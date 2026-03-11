"""Lab 1 測試: LLM 客戶端 — create_message, retry, streaming。

測試覆蓋:
- create_message: 基本消息發送、參數傳遞、tool_use 回應映射
- retry: 可重試錯誤重試、不可重試錯誤直接拋出、超過最大重試次數
- streaming: 串流文字 delta 事件
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch, call

import pytest

# Ensure shared utils are importable
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared"))

from testing_utils import create_mock_anthropic_response, create_mock_tool_use_block

from phase_0.client import LLMClient
from phase_0.types import (
    LLMClientOptions,
    LLMResponse,
    Message,
    RetryConfig,
    TextBlock,
    ToolDefinition,
    ToolUseBlock,
    JSONSchema,
)

import anthropic


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def mock_anthropic_client():
    """Patch anthropic.Anthropic and return the mock client instance."""
    with patch("phase_0.client.anthropic.Anthropic") as MockClass:
        mock_instance = MagicMock()
        MockClass.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def client(mock_anthropic_client):
    """Create an LLMClient with the mocked Anthropic class."""
    return LLMClient(api_key="test-key")


@pytest.fixture
def fast_retry_client(mock_anthropic_client):
    """Create an LLMClient with fast retry config for testing."""
    return LLMClient(
        api_key="test-key",
        retry_config=RetryConfig(
            max_retries=3,
            base_delay_ms=1,  # 1ms for fast tests
            max_delay_ms=10,
            retryable_status_codes=[429, 500, 502, 503, 529],
        ),
    )


# ======================================================================
# create_message tests
# ======================================================================


class TestCreateMessage:
    """Tests for LLMClient.create_message."""

    def test_should_send_basic_message_and_return_llm_response(
        self, client, mock_anthropic_client
    ):
        """基本消息發送，驗證回應正確映射為 LLMResponse。"""
        mock_raw = create_mock_anthropic_response(
            msg_id="msg_001",
            text="Hello! I'm Claude.",
            model="claude-sonnet-4-20250514",
            stop_reason="end_turn",
            input_tokens=12,
            output_tokens=15,
        )
        mock_anthropic_client.messages.create.return_value = mock_raw

        messages = [Message(role="user", content="Hi there")]
        response = client.create_message(messages)

        assert isinstance(response, LLMResponse)
        assert response.id == "msg_001"
        assert response.model == "claude-sonnet-4-20250514"
        assert response.stop_reason == "end_turn"
        assert response.usage.input_tokens == 12
        assert response.usage.output_tokens == 15
        assert len(response.content) == 1
        assert isinstance(response.content[0], TextBlock)
        assert response.content[0].text == "Hello! I'm Claude."

    def test_should_pass_system_prompt_and_tools_to_api(
        self, client, mock_anthropic_client
    ):
        """驗證 system prompt 和 tools 正確傳遞給 API。"""
        mock_raw = create_mock_anthropic_response()
        mock_anthropic_client.messages.create.return_value = mock_raw

        tool_def = ToolDefinition(
            name="get_weather",
            description="Get weather info",
            input_schema=JSONSchema(
                type="object",
                properties={
                    "location": {"type": "string", "description": "City name"},
                },
                required=["location"],
            ),
        )
        options = LLMClientOptions(
            system_prompt="You are helpful.",
            tools=[tool_def],
        )

        messages = [Message(role="user", content="What's the weather?")]
        client.create_message(messages, options)

        call_kwargs = mock_anthropic_client.messages.create.call_args
        assert call_kwargs is not None

        # Check system prompt was passed
        kwargs = call_kwargs[1] if call_kwargs[1] else {}
        args_dict = call_kwargs[0][0] if call_kwargs[0] else kwargs
        if not kwargs:
            kwargs = args_dict

        assert "system" in kwargs
        assert kwargs["system"] == "You are helpful."
        assert "tools" in kwargs
        assert len(kwargs["tools"]) == 1
        assert kwargs["tools"][0]["name"] == "get_weather"

    def test_should_correctly_map_tool_use_responses(
        self, client, mock_anthropic_client
    ):
        """驗證 tool_use 回應正確映射。"""
        tool_block = create_mock_tool_use_block(
            tool_id="toolu_001",
            name="get_weather",
            tool_input={"location": "Tokyo"},
        )
        mock_raw = create_mock_anthropic_response(
            stop_reason="tool_use",
            content=[tool_block],
        )
        mock_anthropic_client.messages.create.return_value = mock_raw

        messages = [Message(role="user", content="Check weather in Tokyo")]
        response = client.create_message(messages)

        assert response.stop_reason == "tool_use"
        assert len(response.content) == 1
        assert isinstance(response.content[0], ToolUseBlock)
        assert response.content[0].id == "toolu_001"
        assert response.content[0].name == "get_weather"
        assert response.content[0].input == {"location": "Tokyo"}


# ======================================================================
# Retry mechanism tests
# ======================================================================


class TestRetryMechanism:
    """Tests for LLMClient._call_with_retry."""

    def test_should_retry_on_429_errors(
        self, fast_retry_client, mock_anthropic_client
    ):
        """429 錯誤應觸發重試，最終成功。"""
        mock_raw = create_mock_anthropic_response()

        error_429 = anthropic.APIStatusError(
            message="Rate limited",
            response=MagicMock(status_code=429, headers={}, text="rate limited"),
            body={"error": {"message": "rate limited", "type": "rate_limit_error"}},
        )

        mock_anthropic_client.messages.create.side_effect = [
            error_429,
            error_429,
            mock_raw,
        ]

        messages = [Message(role="user", content="Hi")]
        response = fast_retry_client.create_message(messages)

        assert response.id == "msg_test_123"
        assert mock_anthropic_client.messages.create.call_count == 3

    def test_should_not_retry_on_400_errors(
        self, fast_retry_client, mock_anthropic_client
    ):
        """400 錯誤不應重試，直接拋出。"""
        error_400 = anthropic.APIStatusError(
            message="Bad request",
            response=MagicMock(status_code=400, headers={}, text="bad request"),
            body={"error": {"message": "bad request", "type": "invalid_request_error"}},
        )

        mock_anthropic_client.messages.create.side_effect = error_400

        messages = [Message(role="user", content="Hi")]
        with pytest.raises(anthropic.APIStatusError):
            fast_retry_client.create_message(messages)

        assert mock_anthropic_client.messages.create.call_count == 1

    def test_should_raise_after_exceeding_max_retries(
        self, fast_retry_client, mock_anthropic_client
    ):
        """超過最大重試次數後應拋出異常。"""
        error_429 = anthropic.APIStatusError(
            message="Rate limited",
            response=MagicMock(status_code=429, headers={}, text="rate limited"),
            body={"error": {"message": "rate limited", "type": "rate_limit_error"}},
        )

        # max_retries=3 means 1 initial + 3 retries = 4 total attempts
        mock_anthropic_client.messages.create.side_effect = error_429

        messages = [Message(role="user", content="Hi")]
        with pytest.raises(anthropic.APIStatusError):
            fast_retry_client.create_message(messages)

        # Should have tried 1 + max_retries times
        assert mock_anthropic_client.messages.create.call_count == 4


# ======================================================================
# Streaming test
# ======================================================================


class TestStreaming:
    """Tests for LLMClient.create_streaming_message."""

    def test_should_yield_text_delta_events(
        self, client, mock_anthropic_client
    ):
        """串流應產生 text_delta 事件。"""
        # Create mock stream events
        event1 = MagicMock()
        event1.type = "content_block_delta"
        event1.delta = MagicMock()
        event1.delta.type = "text_delta"
        event1.delta.text = "Hello"

        event2 = MagicMock()
        event2.type = "content_block_delta"
        event2.delta = MagicMock()
        event2.delta.type = "text_delta"
        event2.delta.text = " world"

        event3 = MagicMock()
        event3.type = "message_stop"

        # Create mock final message for message_stop
        mock_final = create_mock_anthropic_response(text="Hello world")

        # Mock the stream context manager
        mock_stream = MagicMock()
        mock_stream.__enter__ = MagicMock(return_value=mock_stream)
        mock_stream.__exit__ = MagicMock(return_value=False)
        mock_stream.__iter__ = MagicMock(return_value=iter([event1, event2, event3]))
        mock_stream.get_final_message = MagicMock(return_value=mock_final)

        mock_anthropic_client.messages.stream.return_value = mock_stream

        messages = [Message(role="user", content="Hi")]
        events = list(client.create_streaming_message(messages))

        # Should have at least text_delta events
        text_deltas = [e for e in events if hasattr(e, "type") and e.type == "text_delta"]
        assert len(text_deltas) >= 2
        assert text_deltas[0].text == "Hello"
        assert text_deltas[1].text == " world"
