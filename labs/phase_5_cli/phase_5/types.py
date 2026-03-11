"""Phase 5 類型定義 — 所有資料結構和類型別名。

本文件定義了整個 Phase 5 使用的核心資料結構。
學生不需要修改此文件，只需閱讀並理解每個類型的用途。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal


# ---------------------------------------------------------------------------
# CLI app types
# ---------------------------------------------------------------------------

@dataclass
class CLITheme:
    """CLI 視覺主題配置。

    定義了 CLI 介面中使用的各種顏色。
    顏色值使用 ANSI escape code 格式。
    """
    name: str = "dark"
    primary_color: str = "\033[36m"       # cyan
    secondary_color: str = "\033[34m"     # blue
    bg_color: str = "\033[40m"            # black background
    text_color: str = "\033[37m"          # white text
    error_color: str = "\033[31m"         # red
    success_color: str = "\033[32m"       # green


@dataclass
class RenderableBlock:
    """可渲染的內容塊。

    Agent 的回應被解析為一系列 RenderableBlock，
    每種類型有不同的渲染方式。
    """
    type: Literal["text", "tool_call", "diff", "progress", "error", "info"] = "text"
    content: str = ""
    metadata: dict = field(default_factory=dict)


@dataclass
class DisplayConfig:
    """顯示配置，控制 CLI 輸出行為。"""
    show_thinking: bool = True
    show_tool_details: bool = True
    color_enabled: bool = True
    max_width: int = 120


InputMode = Literal["single_line", "multi_line"]


# ---------------------------------------------------------------------------
# Config types
# ---------------------------------------------------------------------------

@dataclass
class AgentConfig:
    """Agent 運行時配置。

    控制 LLM 調用的核心參數和資源限制。
    """
    model: str = "claude-sonnet-4-20250514"
    max_tokens: int = 8192
    temperature: float = 0.0
    max_iterations: int = 20
    token_budget: int = 100_000


@dataclass
class ToolPermission:
    """工具權限配置。

    定義單個工具的執行權限級別。
    - auto: 自動執行，不需要確認
    - confirm: 每次執行前詢問用戶確認
    - deny: 禁止執行
    """
    tool_name: str = ""
    level: Literal["auto", "confirm", "deny"] = "auto"


@dataclass
class ProjectConfig:
    """專案層級配置。

    合併所有配置層（default / global / project / cli）後的最終結果。
    """
    agent: AgentConfig = field(default_factory=AgentConfig)
    permissions: list[ToolPermission] = field(default_factory=list)
    allowed_dirs: list[str] = field(default_factory=list)
    blocked_commands: list[str] = field(default_factory=list)


ConfigLayer = Literal["default", "global", "project", "cli"]


@dataclass
class ConfigEntry:
    """單個配置項的元數據。

    記錄配置值的來源層級，方便調試配置優先級問題。
    """
    key: str = ""
    value: Any = None
    layer: ConfigLayer = "default"
    source: str = ""


# ---------------------------------------------------------------------------
# Session types
# ---------------------------------------------------------------------------

@dataclass
class SessionMessage:
    """Session 中的單條消息記錄。"""
    role: Literal["user", "assistant"] = "user"
    content: str = ""
    timestamp: float = 0.0
    tool_calls: list[dict] = field(default_factory=list)


@dataclass
class Session:
    """一個完整的對話 Session。

    包含對話的所有消息、元數據和統計信息。
    """
    id: str = ""
    created_at: float = 0.0
    updated_at: float = 0.0
    messages: list[SessionMessage] = field(default_factory=list)
    project_dir: str = ""
    model: str = ""
    total_tokens: int = 0


@dataclass
class SessionConfig:
    """Session 管理器配置。"""
    storage_dir: str = "~/.agent/sessions"
    max_sessions: int = 50
    auto_save: bool = True


@dataclass
class SessionSummary:
    """Session 的摘要信息，用於列表展示。"""
    id: str = ""
    created_at: float = 0.0
    message_count: int = 0
    preview: str = ""
    project_dir: str = ""
