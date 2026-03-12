"""Lab 2 測試: Tool 系統 — ToolRegistry, ToolExecutor, tool_use_loop。

測試覆蓋:
- ToolRegistry: 註冊、獲取、重複拒絕、空名拒絕、空描述拒絕、取消註冊、取消不存在
- ToolExecutor: 成功執行、未知工具、執行錯誤捕獲、批量執行
- tool_use_loop: 立即結束、工具循環、最大迭代超限
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared"))

from testing_utils import create_mock_anthropic_response, create_mock_tool_use_block

from phase_0.tools import ToolRegistry, ToolExecutor, tool_use_loop
from phase_0.types import (
    JSONSchema,
    LLMResponse,
    Message,
    TextBlock,
    ToolDefinition,
    ToolHandler,
    ToolResultBlock,
    ToolUseBlock,
    TokenUsage,
)


# ======================================================================
# Helpers
# ======================================================================


def make_handler(
    name: str = "test_tool",
    description: str = "A test tool",
    execute_fn=None,
) -> ToolHandler:
    """Create a simple ToolHandler for testing."""
    return ToolHandler(
        definition=ToolDefinition(
            name=name,
            description=description,
            input_schema=JSONSchema(
                type="object",
                properties={"arg": {"type": "string", "description": "An argument"}},
                required=["arg"],
            ),
        ),
        execute=execute_fn or (lambda inp: f"result: {inp.get('arg', '')}"),
    )


# ======================================================================
# ToolRegistry tests
# ======================================================================


class TestToolRegistry:
    """Tests for ToolRegistry."""

    def test_register_and_get(self):
        """註冊後應能通過名稱獲取 handler。"""
        registry = ToolRegistry()
        handler = make_handler(name="my_tool")
        registry.register(handler)

        result = registry.get("my_tool")
        assert result is not None
        assert result.definition.name == "my_tool"
        assert registry.size == 1

    def test_register_duplicate_should_raise(self):
        """重複註冊同名 tool 應拋出 ValueError。"""
        registry = ToolRegistry()
        handler = make_handler(name="dup_tool")
        registry.register(handler)

        with pytest.raises(ValueError):
            registry.register(handler)

    def test_register_empty_name_should_raise(self):
        """空名稱應拋出 ValueError。"""
        registry = ToolRegistry()
        handler = make_handler(name="")

        with pytest.raises(ValueError):
            registry.register(handler)

    def test_register_empty_description_should_raise(self):
        """空描述應拋出 ValueError。"""
        registry = ToolRegistry()
        handler = make_handler(name="tool", description="")

        with pytest.raises(ValueError):
            registry.register(handler)

    def test_list_definitions(self):
        """list_definitions 應返回所有已註冊的定義。"""
        registry = ToolRegistry()
        registry.register(make_handler(name="tool_a", description="Tool A"))
        registry.register(make_handler(name="tool_b", description="Tool B"))

        defs = registry.list_definitions()
        names = [d.name for d in defs]
        assert "tool_a" in names
        assert "tool_b" in names
        assert len(defs) == 2

    def test_unregister(self):
        """取消註冊後應無法再獲取。"""
        registry = ToolRegistry()
        registry.register(make_handler(name="removable"))
        assert registry.size == 1

        registry.unregister("removable")
        assert registry.size == 0
        assert registry.get("removable") is None

    def test_unregister_nonexistent_should_raise(self):
        """取消註冊不存在的 tool 應拋出 KeyError。"""
        registry = ToolRegistry()

        with pytest.raises(KeyError):
            registry.unregister("nonexistent")


# ======================================================================
# ToolExecutor tests
# ======================================================================


class TestToolExecutor:
    """Tests for ToolExecutor."""

    def test_execute_success(self):
        """成功執行 tool 應返回正確結果。"""
        registry = ToolRegistry()
        registry.register(make_handler(
            name="echo",
            execute_fn=lambda inp: f"echo: {inp['arg']}",
        ))
        executor = ToolExecutor(registry)

        tool_call = ToolUseBlock(id="call_001", name="echo", input={"arg": "hello"})
        result = executor.execute(tool_call)

        assert isinstance(result, ToolResultBlock)
        assert result.tool_use_id == "call_001"
        assert result.content == "echo: hello"
        assert result.is_error is False

    def test_execute_unknown_tool_returns_error(self):
        """調用不存在的 tool 應返回 is_error=True 的結果。"""
        registry = ToolRegistry()
        executor = ToolExecutor(registry)

        tool_call = ToolUseBlock(id="call_002", name="nonexistent", input={})
        result = executor.execute(tool_call)

        assert result.is_error is True
        assert "not found" in result.content.lower() or "Tool not found" in result.content

    def test_execute_catches_execution_errors(self):
        """Tool 執行出錯時應捕獲異常並返回 is_error=True。"""
        registry = ToolRegistry()

        def failing_fn(inp):
            raise RuntimeError("Something went wrong")

        registry.register(make_handler(name="failing", execute_fn=failing_fn))
        executor = ToolExecutor(registry)

        tool_call = ToolUseBlock(id="call_003", name="failing", input={})
        result = executor.execute(tool_call)

        assert result.is_error is True
        assert "Something went wrong" in result.content

    def test_execute_all(self):
        """execute_all 應執行回應中所有 tool_use blocks。"""
        registry = ToolRegistry()
        registry.register(make_handler(
            name="tool_a",
            execute_fn=lambda inp: "result_a",
        ))
        registry.register(make_handler(
            name="tool_b",
            description="Tool B",
            execute_fn=lambda inp: "result_b",
        ))
        executor = ToolExecutor(registry)

        response = LLMResponse(
            id="msg_001",
            content=[
                TextBlock(text="Let me use tools"),
                ToolUseBlock(id="call_a", name="tool_a", input={"arg": "x"}),
                ToolUseBlock(id="call_b", name="tool_b", input={"arg": "y"}),
            ],
            model="claude-sonnet-4-20250514",
            stop_reason="tool_use",
            usage=TokenUsage(input_tokens=10, output_tokens=20),
        )

        results = executor.execute_all(response)
        assert len(results) == 2
        assert results[0].tool_use_id == "call_a"
        assert results[0].content == "result_a"
        assert results[1].tool_use_id == "call_b"
        assert results[1].content == "result_b"


# ======================================================================
# tool_use_loop tests
# ======================================================================


class TestToolUseLoop:
    """Tests for tool_use_loop."""

    def test_immediate_end_turn(self):
        """LLM 直接回覆 end_turn 時應立即返回。"""
        mock_client = MagicMock()
        mock_client.create_message.return_value = LLMResponse(
            id="msg_001",
            content=[TextBlock(text="I can answer directly.")],
            model="claude-sonnet-4-20250514",
            stop_reason="end_turn",
            usage=TokenUsage(input_tokens=10, output_tokens=8),
        )

        registry = ToolRegistry()
        executor = ToolExecutor(registry)

        result = tool_use_loop(
            client=mock_client,
            executor=executor,
            initial_messages=[Message(role="user", content="Hi")],
            tools=[],
        )

        assert result["response"].stop_reason == "end_turn"
        assert mock_client.create_message.call_count == 1

    def test_loop_through_tool_calls(self):
        """應循環執行 tool 調用直到 LLM 返回 end_turn。"""
        mock_client = MagicMock()

        # First call: LLM requests a tool
        tool_response = LLMResponse(
            id="msg_001",
            content=[
                ToolUseBlock(id="call_001", name="echo", input={"arg": "test"}),
            ],
            model="claude-sonnet-4-20250514",
            stop_reason="tool_use",
            usage=TokenUsage(input_tokens=10, output_tokens=15),
        )

        # Second call: LLM gives final answer
        final_response = LLMResponse(
            id="msg_002",
            content=[TextBlock(text="Done!")],
            model="claude-sonnet-4-20250514",
            stop_reason="end_turn",
            usage=TokenUsage(input_tokens=20, output_tokens=5),
        )

        mock_client.create_message.side_effect = [tool_response, final_response]

        registry = ToolRegistry()
        registry.register(make_handler(
            name="echo",
            execute_fn=lambda inp: f"echoed: {inp['arg']}",
        ))
        executor = ToolExecutor(registry)

        result = tool_use_loop(
            client=mock_client,
            executor=executor,
            initial_messages=[Message(role="user", content="Use echo tool")],
            tools=registry.list_definitions(),
        )

        assert result["response"].stop_reason == "end_turn"
        assert mock_client.create_message.call_count == 2

        # Messages should include the tool result
        msgs = result["messages"]
        assert len(msgs) >= 3  # user + assistant(tool_use) + user(tool_result)

    def test_max_iterations_exceeded(self):
        """超過最大迭代次數應拋出 RuntimeError。"""
        mock_client = MagicMock()

        # Always return tool_use
        mock_client.create_message.return_value = LLMResponse(
            id="msg_loop",
            content=[
                ToolUseBlock(id="call_loop", name="echo", input={"arg": "x"}),
            ],
            model="claude-sonnet-4-20250514",
            stop_reason="tool_use",
            usage=TokenUsage(input_tokens=10, output_tokens=10),
        )

        registry = ToolRegistry()
        registry.register(make_handler(
            name="echo",
            execute_fn=lambda inp: "result",
        ))
        executor = ToolExecutor(registry)

        with pytest.raises(RuntimeError):
            tool_use_loop(
                client=mock_client,
                executor=executor,
                initial_messages=[Message(role="user", content="Loop forever")],
                tools=registry.list_definitions(),
                max_iterations=3,
            )

        assert mock_client.create_message.call_count == 3

    def test_should_stop_on_max_tokens(self):
        """max_tokens stop_reason 時應該停止循環"""
        mock_client = MagicMock()
        response = LLMResponse(
            id="msg_max",
            content=[TextBlock(text="Response truncated")],
            model="claude-sonnet-4-20250514",
            stop_reason="max_tokens",
            usage=TokenUsage(input_tokens=10, output_tokens=10),
        )
        mock_client.create_message.return_value = response

        result = tool_use_loop(
            client=mock_client,
            executor=ToolExecutor(ToolRegistry()),
            initial_messages=[Message(role="user", content="test")],
            tools=[],
        )
        assert result["response"].stop_reason == "max_tokens"
        assert mock_client.create_message.call_count == 1
