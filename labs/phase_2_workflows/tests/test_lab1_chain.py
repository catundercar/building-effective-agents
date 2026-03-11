"""Lab 1 測試: Prompt Chaining — ChainRunner 的串行執行、Gate 檢查、重試機制。

測試覆蓋:
- run_step: 基本步驟執行、LLM 調用驗證
- gate: Gate 通過、Gate 失敗觸發重試
- run_chain: 多步串行、輸出傳遞、trace 記錄
- retry: 重試帶錯誤上下文、重試耗盡
- format_prompt: 模板替換
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch, call

import pytest

# Ensure shared utils are importable
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared"))

from phase_2.chain import ChainRunner
from phase_2.types import ChainConfig, ChainResult, ChainStep


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def mock_llm_client():
    """Create a mock LLM client that returns predictable responses."""
    client = MagicMock()

    # Default: return a response with text content
    mock_response = MagicMock()
    mock_content_block = MagicMock()
    mock_content_block.text = "LLM output text"
    mock_content_block.type = "text"
    mock_response.content = [mock_content_block]
    client.create_message.return_value = mock_response

    return client


@pytest.fixture
def runner(mock_llm_client):
    """Create a ChainRunner with the mock LLM client."""
    return ChainRunner(
        llm_client=mock_llm_client,
        config=ChainConfig(max_retries_per_step=2, timeout_seconds=10),
    )


@pytest.fixture
def simple_step():
    """Create a simple ChainStep with no gate or transform."""
    return ChainStep(
        name="simple_step",
        prompt_template="Analyze this: {input}",
    )


@pytest.fixture
def gated_step():
    """Create a ChainStep with a gate function."""
    def gate_fn(output: str) -> tuple[bool, str]:
        if "good" in output.lower():
            return True, "Output looks good"
        return False, "Output missing 'good' keyword"

    return ChainStep(
        name="gated_step",
        prompt_template="Process: {input}",
        gate=gate_fn,
    )


def _set_llm_response(mock_client: MagicMock, text: str) -> None:
    """Helper to set the mock LLM client's response text."""
    mock_response = MagicMock()
    mock_block = MagicMock()
    mock_block.text = text
    mock_block.type = "text"
    mock_response.content = [mock_block]
    mock_client.create_message.return_value = mock_response


def _set_llm_responses(mock_client: MagicMock, texts: list[str]) -> None:
    """Helper to set a sequence of LLM responses."""
    responses = []
    for text in texts:
        mock_response = MagicMock()
        mock_block = MagicMock()
        mock_block.text = text
        mock_block.type = "text"
        mock_response.content = [mock_block]
        responses.append(mock_response)
    mock_client.create_message.side_effect = responses


# ======================================================================
# run_step tests
# ======================================================================


class TestRunStep:
    """Tests for ChainRunner.run_step."""

    def test_run_step_calls_llm(self, runner, mock_llm_client, simple_step):
        """驗證 run_step 會調用 LLM 並傳入格式化的 prompt。"""
        _set_llm_response(mock_llm_client, "Analysis result")

        result = runner.run_step(simple_step, "test code")

        # LLM should have been called
        mock_llm_client.create_message.assert_called_once()
        # Check the messages contain our formatted prompt
        call_args = mock_llm_client.create_message.call_args
        messages = call_args[0][0] if call_args[0] else call_args[1].get("messages", [])
        assert len(messages) > 0
        # The prompt should contain our input
        msg_content = messages[0]["content"] if isinstance(messages[0], dict) else messages[0].content
        assert "test code" in msg_content
        assert result == "Analysis result"

    def test_run_step_applies_gate(self, runner, mock_llm_client, gated_step):
        """驗證 gate 函數被正確調用且通過時返回正常結果。"""
        _set_llm_response(mock_llm_client, "This is a good result")

        result = runner.run_step(gated_step, "some input")

        assert result == "This is a good result"

    def test_run_step_gate_failure(self, runner, mock_llm_client, gated_step):
        """驗證 gate 失敗時觸發重試機制。"""
        # First call fails gate, retry succeeds
        _set_llm_responses(mock_llm_client, [
            "bad result without keyword",
            "This is a good result after retry",
        ])

        result = runner.run_step(gated_step, "some input")

        # Should have called LLM at least twice (original + retry)
        assert mock_llm_client.create_message.call_count >= 2
        assert "good" in result.lower()

    def test_run_step_with_transform(self, runner, mock_llm_client):
        """驗證 transform 函數正確應用於輸出。"""
        step = ChainStep(
            name="transform_step",
            prompt_template="Do: {input}",
            transform=lambda output: f"[TRANSFORMED] {output}",
        )
        _set_llm_response(mock_llm_client, "raw output")

        result = runner.run_step(step, "input data")

        assert result == "[TRANSFORMED] raw output"


# ======================================================================
# run_chain tests
# ======================================================================


class TestRunChain:
    """Tests for ChainRunner.run_chain."""

    def test_run_chain_passes_output(self, runner, mock_llm_client):
        """驗證 chain 中每步的輸出正確傳遞給下一步。"""
        steps = [
            ChainStep(name="step1", prompt_template="Step 1: {input}"),
            ChainStep(name="step2", prompt_template="Step 2: {input}"),
            ChainStep(name="step3", prompt_template="Step 3: {input}"),
        ]
        _set_llm_responses(mock_llm_client, [
            "output_from_step1",
            "output_from_step2",
            "final_output",
        ])

        result = runner.run_chain(steps, initial_input="start")

        assert result.success is True
        assert result.steps_completed == 3
        assert result.final_output == "final_output"
        assert mock_llm_client.create_message.call_count == 3

        # Verify step 2 received output of step 1
        second_call = mock_llm_client.create_message.call_args_list[1]
        second_messages = second_call[0][0] if second_call[0] else second_call[1].get("messages", [])
        second_content = second_messages[0]["content"] if isinstance(second_messages[0], dict) else second_messages[0].content
        assert "output_from_step1" in second_content

    def test_run_chain_records_trace(self, runner, mock_llm_client):
        """驗證 chain 執行記錄完整的 trace。"""
        steps = [
            ChainStep(name="analyze", prompt_template="Analyze: {input}"),
            ChainStep(name="fix", prompt_template="Fix: {input}"),
        ]
        _set_llm_responses(mock_llm_client, ["analysis done", "fix applied"])

        result = runner.run_chain(steps, initial_input="buggy code")

        assert result.success is True
        assert len(result.trace) == 2
        assert result.trace[0]["name"] == "analyze"
        assert result.trace[1]["name"] == "fix"
        # Each trace entry should have duration_ms
        for entry in result.trace:
            assert "duration_ms" in entry
            assert entry["duration_ms"] >= 0

    def test_run_chain_handles_step_failure(self, runner, mock_llm_client):
        """驗證 chain 中步驟失敗時 graceful fallback。"""
        steps = [
            ChainStep(name="step1", prompt_template="Step 1: {input}"),
            ChainStep(name="step2", prompt_template="Step 2: {input}"),
        ]
        # First step succeeds, second step raises exception
        first_response = MagicMock()
        first_block = MagicMock()
        first_block.text = "step1 output"
        first_block.type = "text"
        first_response.content = [first_block]

        mock_llm_client.create_message.side_effect = [
            first_response,
            RuntimeError("LLM API error"),
        ]

        result = runner.run_chain(steps, initial_input="input")

        assert result.success is False
        assert result.steps_completed == 1
        assert result.error is not None
        assert "error" in result.error.lower() or "Error" in result.error or "LLM" in result.error

    def test_run_chain_dry_run(self, runner, mock_llm_client):
        """驗證空 steps 列表返回 initial_input 作為輸出。"""
        result = runner.run_chain([], initial_input="just pass through")

        assert result.success is True
        assert result.steps_completed == 0
        assert result.final_output == "just pass through"
        mock_llm_client.create_message.assert_not_called()


# ======================================================================
# _apply_gate tests
# ======================================================================


class TestApplyGate:
    """Tests for ChainRunner._apply_gate."""

    def test_no_gate_returns_true(self, runner):
        """沒有 gate 函數時應返回 (True, "no gate")。"""
        step = ChainStep(name="no_gate", prompt_template="x", gate=None)

        passed, reason = runner._apply_gate(step, "any output")

        assert passed is True
        assert "no gate" in reason.lower()

    def test_gate_error_returns_false(self, runner):
        """gate 函數自身出錯時應返回 (False, error_message)。"""
        def broken_gate(output: str) -> tuple[bool, str]:
            raise ValueError("Gate crashed!")

        step = ChainStep(name="broken", prompt_template="x", gate=broken_gate)

        passed, reason = runner._apply_gate(step, "any output")

        assert passed is False
        assert "Gate crashed" in reason or "ValueError" in reason


# ======================================================================
# _retry_step tests
# ======================================================================


class TestRetryStep:
    """Tests for ChainRunner._retry_step."""

    def test_retry_step_includes_error(self, runner, mock_llm_client, gated_step):
        """驗證重試的 prompt 包含之前的錯誤信息。"""
        _set_llm_response(mock_llm_client, "This is a good retry result")

        result = runner._retry_step(gated_step, "input data", "previous error reason")

        call_args = mock_llm_client.create_message.call_args
        messages = call_args[0][0] if call_args[0] else call_args[1].get("messages", [])
        msg_content = messages[0]["content"] if isinstance(messages[0], dict) else messages[0].content
        assert "previous error reason" in msg_content

    def test_retry_exhausted_raises(self, runner, mock_llm_client):
        """重試耗盡時應拋出 RuntimeError。"""
        step = ChainStep(
            name="always_fails",
            prompt_template="Do: {input}",
            gate=lambda output: (False, "always fails"),
        )
        _set_llm_response(mock_llm_client, "bad output")

        with pytest.raises(RuntimeError, match="failed after retries"):
            runner._retry_step(step, "input", "initial error")


# ======================================================================
# format_prompt tests
# ======================================================================


class TestFormatPrompt:
    """Tests for ChainRunner.format_prompt (provided method)."""

    def test_format_prompt_substitution(self):
        """驗證 {input} 佔位符被正確替換。"""
        result = ChainRunner.format_prompt("Analyze: {input}", "my code")
        assert result == "Analyze: my code"

    def test_format_prompt_no_placeholder(self):
        """沒有 {input} 佔位符時，資料附加到末尾。"""
        result = ChainRunner.format_prompt("Just a prompt", "extra data")
        assert "Just a prompt" in result
        assert "extra data" in result
