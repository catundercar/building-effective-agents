"""Lab 3 測試: Context 管理 — Token 估算、截斷、摘要壓縮。

測試覆蓋:
- estimate_tokens: 英文、中文、混合、空字串、比例關係
- estimate_message_tokens: 純文字、ContentBlock 列表、tool_result
- get_total_tokens: system prompt、tools、messages、reserved tokens
- get_state: 接近限制、未接近限制
- truncate: 未超限、超限截斷、保留首條消息
- summarize: 消息不足跳過、壓縮舊消息
- auto_manage: 未接近限制不操作、接近限制時截斷/摘要
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared"))

from testing_utils import create_mock_anthropic_response

from phase_0.context import ContextManager
from phase_0.types import (
    ContextManagerConfig,
    JSONSchema,
    Message,
    TextBlock,
    ToolDefinition,
    ToolResultBlock,
    ToolUseBlock,
    LLMResponse,
    TokenUsage,
)


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def manager():
    """Create a ContextManager with small limits for testing."""
    return ContextManager(
        ContextManagerConfig(
            max_context_tokens=1000,
            reserved_output_tokens=200,
            summarization_threshold=0.7,
        )
    )


@pytest.fixture
def large_manager():
    """Create a ContextManager with realistic limits."""
    return ContextManager(
        ContextManagerConfig(
            max_context_tokens=200_000,
            reserved_output_tokens=8_192,
            summarization_threshold=0.7,
        )
    )


# ======================================================================
# estimate_tokens tests
# ======================================================================


class TestEstimateTokens:
    """Tests for ContextManager.estimate_tokens."""

    def test_english_text(self, manager):
        """英文文本應大約每 4 字符 1 token。"""
        text = "Hello world"  # 11 chars
        tokens = manager.estimate_tokens(text)
        # ~11 / 4 = ~2.75, should be around 3
        assert 2 <= tokens <= 5

    def test_chinese_text(self, manager):
        """中文文本應大約每字符 1.5 token。"""
        text = "你好世界"  # 4 Chinese chars
        tokens = manager.estimate_tokens(text)
        # ~4 * 1.5 = 6
        assert 5 <= tokens <= 8

    def test_mixed_text(self, manager):
        """中英混合文本的 token 數應在兩者之間。"""
        text = "Hello 你好"  # 6 English chars + space + 2 Chinese chars
        tokens = manager.estimate_tokens(text)
        # English: ~7 * 0.25 = 1.75; Chinese: 2 * 1.5 = 3; total ~4.75
        assert 3 <= tokens <= 8

    def test_empty_string(self, manager):
        """空字串應返回 0。"""
        tokens = manager.estimate_tokens("")
        assert tokens == 0

    def test_proportional(self, manager):
        """較長文本應有更多 token。"""
        short = manager.estimate_tokens("hi")
        long = manager.estimate_tokens("hi " * 100)
        assert long > short


# ======================================================================
# estimate_message_tokens tests
# ======================================================================


class TestEstimateMessageTokens:
    """Tests for ContextManager.estimate_message_tokens."""

    def test_string_content(self, manager):
        """純文字消息應能正確估算。"""
        msg = Message(role="user", content="Hello world")
        tokens = manager.estimate_message_tokens(msg)
        # Should include overhead (~4) + text tokens
        assert tokens > 0

    def test_content_block_list(self, manager):
        """ContentBlock 列表消息應能正確估算。"""
        msg = Message(
            role="assistant",
            content=[
                TextBlock(text="Let me help you."),
                TextBlock(text="Here is more info."),
            ],
        )
        tokens = manager.estimate_message_tokens(msg)
        assert tokens > 0

    def test_tool_result_content(self, manager):
        """包含 ToolResultBlock 的消息應能正確估算。"""
        msg = Message(
            role="user",
            content=[
                ToolResultBlock(
                    tool_use_id="call_001",
                    content='{"result": "sunny, 22°C"}',
                ),
            ],
        )
        tokens = manager.estimate_message_tokens(msg)
        assert tokens > 0


# ======================================================================
# get_total_tokens tests
# ======================================================================


class TestGetTotalTokens:
    """Tests for ContextManager.get_total_tokens."""

    def test_includes_system_prompt(self, manager):
        """應包含 system prompt 的 token 數。"""
        tokens_before = manager.get_total_tokens()
        manager.set_system_prompt("You are a helpful assistant.")
        tokens_after = manager.get_total_tokens()
        assert tokens_after > tokens_before

    def test_includes_tools(self, manager):
        """應包含 tools 定義的 token 數。"""
        tokens_before = manager.get_total_tokens()
        manager.set_tools([
            ToolDefinition(
                name="test",
                description="A test tool",
                input_schema=JSONSchema(
                    type="object",
                    properties={"x": {"type": "string", "description": "input"}},
                    required=["x"],
                ),
            ),
        ])
        tokens_after = manager.get_total_tokens()
        assert tokens_after > tokens_before

    def test_includes_messages(self, manager):
        """應包含所有消息的 token 數。"""
        tokens_before = manager.get_total_tokens()
        manager.add_message(Message(role="user", content="Hello"))
        manager.add_message(Message(role="assistant", content="Hi there!"))
        tokens_after = manager.get_total_tokens()
        assert tokens_after > tokens_before

    def test_includes_reserved_output_tokens(self, manager):
        """應包含預留的輸出 token 數。"""
        total = manager.get_total_tokens()
        # Even with no messages, should include reserved_output_tokens (200)
        assert total >= manager.config.reserved_output_tokens


# ======================================================================
# get_state tests
# ======================================================================


class TestGetState:
    """Tests for ContextManager.get_state."""

    def test_near_limit(self, manager):
        """接近限制時 is_near_limit 應為 True。"""
        # max=1000, reserved=200, available=800, threshold=0.7*800=560
        # We need total_tokens >= 560
        # reserved alone is 200, so we need 360 more in messages/prompt
        # Add many messages to push over threshold
        manager.set_system_prompt("x" * 500)
        for i in range(20):
            manager.add_message(Message(role="user", content=f"Message {i} " * 10))

        state = manager.get_state()
        assert state.is_near_limit is True

    def test_not_near_limit(self, large_manager):
        """未接近限制時 is_near_limit 應為 False。"""
        large_manager.add_message(Message(role="user", content="Short message"))
        state = large_manager.get_state()
        assert state.is_near_limit is False


# ======================================================================
# truncate tests
# ======================================================================


class TestTruncate:
    """Tests for ContextManager.truncate."""

    def test_within_limits_no_truncation(self, large_manager):
        """未超限時不應截斷任何消息。"""
        large_manager.add_message(Message(role="user", content="Hello"))
        large_manager.add_message(Message(role="assistant", content="Hi"))

        removed = large_manager.truncate()
        assert removed == 0
        assert len(large_manager.get_messages()) == 2

    def test_over_limit_truncates(self, manager):
        """超限時應截斷舊消息。"""
        # Add many messages to exceed limit
        for i in range(30):
            role = "user" if i % 2 == 0 else "assistant"
            manager.add_message(Message(role=role, content=f"Long message content {i} " * 20))

        original_count = len(manager.get_messages())
        removed = manager.truncate()

        assert removed > 0
        assert len(manager.get_messages()) < original_count

    def test_preserve_first_message(self, manager):
        """截斷時應保留第一條消息。"""
        first_msg = Message(role="user", content="Important first message")
        manager.add_message(first_msg)

        for i in range(30):
            role = "user" if i % 2 == 0 else "assistant"
            manager.add_message(Message(role=role, content=f"Filler {i} " * 30))

        manager.truncate()

        messages = manager.get_messages()
        assert len(messages) >= 1
        assert messages[0].content == "Important first message"


# ======================================================================
# summarize tests
# ======================================================================


class TestSummarize:
    """Tests for ContextManager.summarize."""

    def test_skip_when_few_messages(self, manager):
        """消息不足 4 條時不應摘要。"""
        manager.add_message(Message(role="user", content="Hello"))
        manager.add_message(Message(role="assistant", content="Hi"))

        mock_client = MagicMock()
        result = manager.summarize(mock_client)

        assert result is False
        mock_client.create_message.assert_not_called()

    def test_compress_old_messages(self, manager):
        """消息超過 4 條時應壓縮舊消息為摘要。"""
        for i in range(8):
            role = "user" if i % 2 == 0 else "assistant"
            manager.add_message(Message(role=role, content=f"Message {i}"))

        mock_client = MagicMock()
        summary_response = LLMResponse(
            id="msg_sum",
            content=[TextBlock(text="Summary of conversation")],
            model="claude-sonnet-4-20250514",
            stop_reason="end_turn",
            usage=TokenUsage(input_tokens=50, output_tokens=20),
        )
        mock_client.create_message.return_value = summary_response

        original_count = len(manager.get_messages())
        result = manager.summarize(mock_client)

        assert result is True
        assert len(manager.get_messages()) < original_count
        mock_client.create_message.assert_called_once()


# ======================================================================
# auto_manage tests
# ======================================================================


class TestAutoManage:
    """Tests for ContextManager.auto_manage."""

    def test_no_action_when_not_near_limit(self, large_manager):
        """未接近限制時不應執行任何操作。"""
        large_manager.add_message(Message(role="user", content="Hi"))

        mock_client = MagicMock()
        large_manager.auto_manage(mock_client)

        # No truncation or summarization needed
        assert len(large_manager.get_messages()) == 1
        mock_client.create_message.assert_not_called()

    def test_truncate_and_summarize_when_near_limit(self, manager):
        """接近限制時應嘗試截斷和摘要。"""
        # Fill up the context
        for i in range(30):
            role = "user" if i % 2 == 0 else "assistant"
            manager.add_message(Message(role=role, content=f"Long content {i} " * 20))

        mock_client = MagicMock()
        summary_response = LLMResponse(
            id="msg_sum",
            content=[TextBlock(text="Conversation summary")],
            model="claude-sonnet-4-20250514",
            stop_reason="end_turn",
            usage=TokenUsage(input_tokens=50, output_tokens=20),
        )
        mock_client.create_message.return_value = summary_response

        original_count = len(manager.get_messages())
        manager.auto_manage(mock_client)

        # Should have fewer messages after management
        assert len(manager.get_messages()) < original_count
