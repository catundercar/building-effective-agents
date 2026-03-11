"""Phase 0 類型定義 — 所有資料結構和類型別名。

本文件定義了整個 Phase 0 使用的核心資料結構。
學生不需要修改此文件，只需閱讀並理解每個類型的用途。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Literal, TypeAlias


# ---------------------------------------------------------------------------
# Content blocks
# ---------------------------------------------------------------------------

@dataclass
class TextBlock:
    """純文字內容塊。"""
    type: Literal["text"] = "text"
    text: str = ""


@dataclass
class ToolUseBlock:
    """LLM 請求調用 Tool 時返回的內容塊。"""
    id: str = ""
    name: str = ""
    input: dict[str, Any] = field(default_factory=dict)
    type: Literal["tool_use"] = "tool_use"


@dataclass
class ToolResultBlock:
    """Tool 執行結果，回傳給 LLM 的內容塊。"""
    tool_use_id: str = ""
    content: str = ""
    is_error: bool = False
    type: Literal["tool_result"] = "tool_result"


ContentBlock: TypeAlias = TextBlock | ToolUseBlock | ToolResultBlock


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

@dataclass
class Message:
    """對話消息。"""
    role: Literal["user", "assistant"]
    content: str | list[ContentBlock]


# ---------------------------------------------------------------------------
# LLM client types
# ---------------------------------------------------------------------------

@dataclass
class TokenUsage:
    """Token 用量統計。"""
    input_tokens: int = 0
    output_tokens: int = 0


@dataclass
class LLMResponse:
    """LLM API 回應。"""
    id: str = ""
    content: list[ContentBlock] = field(default_factory=list)
    model: str = ""
    stop_reason: Literal["end_turn", "tool_use", "max_tokens"] = "end_turn"
    usage: TokenUsage = field(default_factory=TokenUsage)


@dataclass
class LLMClientOptions:
    """LLM 客戶端請求選項。"""
    model: str = "claude-sonnet-4-20250514"
    max_tokens: int = 8192
    temperature: float = 0.0
    system_prompt: str | None = None
    tools: list[ToolDefinition] | None = None


# ---------------------------------------------------------------------------
# Stream events
# ---------------------------------------------------------------------------

@dataclass
class TextDeltaEvent:
    """串流文字增量事件。"""
    type: Literal["text_delta"] = "text_delta"
    text: str = ""


@dataclass
class ToolUseStartEvent:
    """串流 Tool 調用開始事件。"""
    type: Literal["tool_use_start"] = "tool_use_start"
    id: str = ""
    name: str = ""


@dataclass
class ToolUseDeltaEvent:
    """串流 Tool 調用增量事件。"""
    type: Literal["tool_use_delta"] = "tool_use_delta"
    input: str = ""


@dataclass
class MessageCompleteEvent:
    """串流消息完成事件。"""
    type: Literal["message_complete"] = "message_complete"
    response: LLMResponse = field(default_factory=LLMResponse)


@dataclass
class ErrorEvent:
    """串流錯誤事件。"""
    type: Literal["error"] = "error"
    error: Exception = field(default_factory=lambda: Exception("unknown"))


StreamEvent: TypeAlias = (
    TextDeltaEvent
    | ToolUseStartEvent
    | ToolUseDeltaEvent
    | MessageCompleteEvent
    | ErrorEvent
)


# ---------------------------------------------------------------------------
# Tool system types
# ---------------------------------------------------------------------------

@dataclass
class JSONSchema:
    """JSON Schema for tool input parameters."""
    type: Literal["object"] = "object"
    properties: dict[str, dict[str, Any]] = field(default_factory=dict)
    required: list[str] = field(default_factory=list)


@dataclass
class ToolDefinition:
    """Tool 定義，包含名稱、描述和輸入 schema。"""
    name: str = ""
    description: str = ""
    input_schema: JSONSchema = field(default_factory=JSONSchema)


@dataclass
class ToolHandler:
    """Tool 處理器，包含定義和執行函數。"""
    definition: ToolDefinition = field(default_factory=ToolDefinition)
    execute: Callable[[dict[str, Any]], str] = field(
        default_factory=lambda: lambda _: ""
    )


# ---------------------------------------------------------------------------
# Context management types
# ---------------------------------------------------------------------------

@dataclass
class ContextManagerConfig:
    """Context Manager 配置。"""
    max_context_tokens: int = 200_000
    reserved_output_tokens: int = 8_192
    summarization_threshold: float = 0.7


@dataclass
class ContextState:
    """Context 當前狀態快照。"""
    messages: list[Message] = field(default_factory=list)
    system_prompt: str = ""
    tools: list[ToolDefinition] = field(default_factory=list)
    total_tokens: int = 0
    is_near_limit: bool = False


# ---------------------------------------------------------------------------
# Retry configuration
# ---------------------------------------------------------------------------

@dataclass
class RetryConfig:
    """重試策略配置。"""
    max_retries: int = 3
    base_delay_ms: int = 1000
    max_delay_ms: int = 30_000
    retryable_status_codes: list[int] = field(
        default_factory=lambda: [429, 500, 502, 503, 529]
    )
