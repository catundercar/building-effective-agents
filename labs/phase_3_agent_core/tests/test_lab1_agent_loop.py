"""Lab 1 測試: Agent Loop — 主循環、回應處理、工具執行、預算控制。

測試覆蓋:
- run: 簡單任務完成、工具調用循環、最大迭代停止、預算超限停止、追蹤記錄
- _process_response: 提取思考文字、提取工具調用
- _execute_tool: 成功返回結果、處理不存在的工具
- _build_system_prompt: 包含任務信息
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared"))

from phase_3.agent_loop import AgentLoop
from phase_3.types import (
    AgentConfig,
    AgentResult,
    AgentStep,
)


# ======================================================================
# Helpers
# ======================================================================


def make_text_block(text: str) -> MagicMock:
    """Create a mock text content block."""
    block = MagicMock()
    block.type = "text"
    block.text = text
    return block


def make_tool_use_block(
    tool_id: str = "toolu_001",
    name: str = "read_file",
    tool_input: dict | None = None,
) -> MagicMock:
    """Create a mock tool_use content block."""
    block = MagicMock()
    block.type = "tool_use"
    block.id = tool_id
    block.name = name
    block.input = tool_input or {}
    return block


def make_llm_response(
    content: list | None = None,
    stop_reason: str = "end_turn",
    input_tokens: int = 50,
    output_tokens: int = 30,
) -> MagicMock:
    """Create a mock LLM response."""
    response = MagicMock()
    if content is None:
        content = [make_text_block("Task completed successfully.")]
    response.content = content
    response.stop_reason = stop_reason
    response.usage = MagicMock()
    response.usage.input_tokens = input_tokens
    response.usage.output_tokens = output_tokens
    return response


def make_echo_tools() -> dict:
    """Create simple echo tools for testing."""
    return {
        "read_file": lambda inp: f"Content of {inp.get('path', 'unknown')}",
        "write_file": lambda inp: f"Wrote to {inp.get('path', 'unknown')}",
        "calculator": lambda inp: str(eval(inp.get("expression", "0"))),  # noqa: S307
    }


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def mock_llm():
    """Create a mock LLM client."""
    return MagicMock()


@pytest.fixture
def tools():
    """Create test tools."""
    return make_echo_tools()


@pytest.fixture
def config():
    """Create a test config with small limits."""
    return AgentConfig(
        max_iterations=5,
        max_tokens_budget=10_000,
        model="claude-sonnet-4-20250514",
    )


@pytest.fixture
def agent(mock_llm, tools, config):
    """Create an AgentLoop instance."""
    return AgentLoop(llm_client=mock_llm, tools=tools, config=config)


# ======================================================================
# AgentLoop.run tests
# ======================================================================


class TestAgentLoopRun:
    """Tests for AgentLoop.run."""

    def test_run_simple_task_completes(self, agent, mock_llm):
        """簡單任務應在一次迭代後完成。"""
        mock_llm.create_message.return_value = make_llm_response(
            content=[make_text_block("Here is the answer to your question.")],
            stop_reason="end_turn",
        )

        result = agent.run("What is 2+2?")

        assert isinstance(result, AgentResult)
        assert result.success is True
        assert result.iterations >= 1
        assert "answer" in result.final_output.lower() or len(result.final_output) > 0

    def test_run_calls_tool_and_loops(self, agent, mock_llm):
        """Agent 應調用工具然後在下一輪完成。"""
        # First call: LLM requests a tool
        tool_response = make_llm_response(
            content=[
                make_text_block("Let me read that file."),
                make_tool_use_block(
                    tool_id="toolu_001",
                    name="read_file",
                    tool_input={"path": "/tmp/test.py"},
                ),
            ],
            stop_reason="tool_use",
        )

        # Second call: LLM gives final answer
        final_response = make_llm_response(
            content=[make_text_block("The file contains a Python script.")],
            stop_reason="end_turn",
        )

        mock_llm.create_message.side_effect = [tool_response, final_response]

        result = agent.run("Read /tmp/test.py")

        assert result.success is True
        assert result.iterations >= 2
        assert mock_llm.create_message.call_count == 2

    def test_run_stops_at_max_iterations(self, mock_llm, tools):
        """達到最大迭代次數時應停止。"""
        config = AgentConfig(max_iterations=3, max_tokens_budget=100_000)
        agent = AgentLoop(llm_client=mock_llm, tools=tools, config=config)

        # Always return tool_use to force looping
        mock_llm.create_message.return_value = make_llm_response(
            content=[
                make_tool_use_block(
                    name="read_file",
                    tool_input={"path": "/tmp/loop.py"},
                ),
            ],
            stop_reason="tool_use",
        )

        result = agent.run("Keep reading files forever")

        assert result.success is False
        assert result.iterations == 3
        assert "max_iterations" in (result.error or "").lower() or result.iterations == 3

    def test_run_stops_at_budget(self, mock_llm, tools):
        """超出 token 預算時應停止。"""
        config = AgentConfig(max_iterations=20, max_tokens_budget=100)
        agent = AgentLoop(llm_client=mock_llm, tools=tools, config=config)

        # Response uses lots of tokens
        mock_llm.create_message.return_value = make_llm_response(
            content=[
                make_tool_use_block(
                    name="read_file",
                    tool_input={"path": "/tmp/big.py"},
                ),
            ],
            stop_reason="tool_use",
            input_tokens=80,
            output_tokens=30,
        )

        result = agent.run("Process a big file")

        assert result.success is False
        # Should have stopped due to budget
        assert result.total_tokens > 0

    def test_run_records_trace(self, agent, mock_llm):
        """應記錄完整的推理追蹤。"""
        # Two iterations: tool call then completion
        tool_response = make_llm_response(
            content=[
                make_text_block("Thinking about the task..."),
                make_tool_use_block(
                    name="calculator",
                    tool_input={"expression": "2+2"},
                ),
            ],
            stop_reason="tool_use",
        )
        final_response = make_llm_response(
            content=[make_text_block("The answer is 4.")],
            stop_reason="end_turn",
        )

        mock_llm.create_message.side_effect = [tool_response, final_response]

        result = agent.run("Calculate 2+2")

        assert len(result.trace) >= 1
        assert result.total_tokens > 0
        # At least one step should have been recorded
        first_step = result.trace[0]
        assert isinstance(first_step, AgentStep)


# ======================================================================
# AgentLoop._process_response tests
# ======================================================================


class TestProcessResponse:
    """Tests for AgentLoop._process_response."""

    def test_process_response_extracts_thought(self, agent):
        """應從 text block 提取思考文字。"""
        response = make_llm_response(
            content=[make_text_block("I need to analyze this carefully.")],
            stop_reason="end_turn",
        )

        step = agent._process_response(response)

        assert step.thought is not None
        assert "analyze" in step.thought.lower()

    def test_process_response_extracts_tool_call(self, agent):
        """應從 tool_use block 提取工具調用信息。"""
        response = make_llm_response(
            content=[
                make_text_block("Let me read the file."),
                make_tool_use_block(
                    tool_id="toolu_002",
                    name="read_file",
                    tool_input={"path": "/tmp/main.py"},
                ),
            ],
            stop_reason="tool_use",
        )

        step = agent._process_response(response)

        assert step.tool_name == "read_file"
        assert step.tool_input == {"path": "/tmp/main.py"}
        assert step.thought is not None


# ======================================================================
# AgentLoop._execute_tool tests
# ======================================================================


class TestExecuteTool:
    """Tests for AgentLoop._execute_tool."""

    def test_execute_tool_returns_result(self, agent):
        """成功執行工具應返回結果字串。"""
        result = agent._execute_tool("read_file", {"path": "/tmp/test.py"})

        assert isinstance(result, str)
        assert "test.py" in result

    def test_execute_tool_handles_missing_tool(self, agent):
        """調用不存在的工具應返回錯誤信息而非拋出異常。"""
        result = agent._execute_tool("nonexistent_tool", {})

        assert isinstance(result, str)
        assert "error" in result.lower() or "not found" in result.lower()


# ======================================================================
# AgentLoop._build_system_prompt tests
# ======================================================================


class TestBuildSystemPrompt:
    """Tests for AgentLoop._build_system_prompt."""

    def test_build_system_prompt_includes_task(self, agent):
        """系統提示應包含工具信息。"""
        prompt = agent._build_system_prompt("Fix the bug in main.py")

        assert isinstance(prompt, str)
        assert len(prompt) > 0
        # Should mention available tools
        assert "read_file" in prompt or "tool" in prompt.lower()
