"""Shared testing utilities for all phases."""

from __future__ import annotations

from unittest.mock import MagicMock, AsyncMock


def create_mock_anthropic_response(
    msg_id: str = "msg_test_123",
    text: str = "Hello! How can I help?",
    model: str = "claude-sonnet-4-20250514",
    stop_reason: str = "end_turn",
    input_tokens: int = 10,
    output_tokens: int = 8,
    content: list | None = None,
):
    """Create a mock Anthropic API response object."""
    mock = MagicMock()
    mock.id = msg_id
    if content is not None:
        mock.content = content
    else:
        block = MagicMock()
        block.type = "text"
        block.text = text
        mock.content = [block]
    mock.model = model
    mock.stop_reason = stop_reason
    mock.usage = MagicMock()
    mock.usage.input_tokens = input_tokens
    mock.usage.output_tokens = output_tokens
    return mock


def create_mock_tool_use_block(tool_id: str, name: str, tool_input: dict):
    """Create a mock tool_use content block."""
    block = MagicMock()
    block.type = "tool_use"
    block.id = tool_id
    block.name = name
    block.input = tool_input
    return block
