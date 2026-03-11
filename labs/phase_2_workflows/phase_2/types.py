"""Phase 2 類型定義 — 所有資料結構和類型別名。

本文件定義了整個 Phase 2 使用的核心資料結構。
學生不需要修改此文件，只需閱讀並理解每個類型的用途。

類型分為四組：
- Chain 類型：Prompt Chaining 的步驟、結果和配置
- Router 類型：意圖分類路由的路由、結果和配置
- Tracing 類型：可觀測性追蹤的 Span、Trace 和配置
- 共用類型：跨模組共用的輔助類型
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Literal, TypeAlias


# ---------------------------------------------------------------------------
# Shared types
# ---------------------------------------------------------------------------

@dataclass
class LLMCall:
    """一次 LLM 調用的記錄摘要。"""
    model: str = ""
    input_tokens: int = 0
    output_tokens: int = 0
    duration_ms: float = 0.0
    prompt_preview: str = ""


# ---------------------------------------------------------------------------
# Chain types — Prompt Chaining 引擎
# ---------------------------------------------------------------------------

@dataclass
class ChainStep:
    """Prompt Chain 中的單一步驟。

    每個步驟包含：
    - name: 步驟名稱（用於 trace 和錯誤訊息）
    - prompt_template: prompt 模板，使用 {input} 佔位符
    - gate: 可選的門控函數，接收步驟輸出並返回 (passed, reason)
    - transform: 可選的轉換函數，在傳給下一步之前轉換輸出
    """
    name: str = ""
    prompt_template: str = ""
    gate: Callable[[str], tuple[bool, str]] | None = None
    transform: Callable[[str], str] | None = None


@dataclass
class ChainResult:
    """Prompt Chain 的執行結果。

    包含完整的執行追蹤，無論成功或失敗。
    """
    steps_completed: int = 0
    final_output: str = ""
    trace: list[dict[str, Any]] = field(default_factory=list)
    success: bool = False
    error: str | None = None


@dataclass
class ChainConfig:
    """Prompt Chain 執行配置。"""
    max_retries_per_step: int = 2
    timeout_seconds: float = 30.0


# ---------------------------------------------------------------------------
# Router types — 意圖分類與路由
# ---------------------------------------------------------------------------

@dataclass
class Route:
    """一條路由規則。

    包含：
    - name: 路由名稱（唯一標識）
    - description: 路由描述（用於 LLM 分類提示）
    - handler: 處理函數，接收用戶輸入並返回結果字串
    - classifier_hint: 給 LLM 的分類提示，描述何時應選擇此路由
    """
    name: str = ""
    description: str = ""
    handler: Callable[[str], str] = field(default_factory=lambda: lambda x: x)
    classifier_hint: str = ""


@dataclass
class RouteResult:
    """路由執行結果。"""
    route_name: str = ""
    confidence: float = 0.0
    handler_output: str = ""
    classification_time_ms: float = 0.0


@dataclass
class RouterConfig:
    """Router 配置。"""
    classification_model: str = "claude-sonnet-4-20250514"
    confidence_threshold: float = 0.7
    fallback_route: str | None = None


# ---------------------------------------------------------------------------
# Tracing types — 可觀測性追蹤
# ---------------------------------------------------------------------------

@dataclass
class Span:
    """追蹤中的單一時間段（Span）。

    一個 Span 代表一個邏輯操作（例如一次 LLM 調用、一次 Tool 執行）。
    Span 可以嵌套，形成樹狀結構。
    """
    span_id: str = ""
    parent_id: str | None = None
    name: str = ""
    start_time: float = 0.0
    end_time: float | None = None
    input_data: dict[str, Any] = field(default_factory=dict)
    output_data: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)
    children: list[Span] = field(default_factory=list)


@dataclass
class Trace:
    """一次完整請求的追蹤記錄。

    包含根 Span 和所有巢狀的子 Span，
    以及彙總統計（總 token 數、總耗時）。
    """
    trace_id: str = ""
    name: str = ""
    root_span: Span = field(default_factory=Span)
    start_time: float = 0.0
    end_time: float | None = None
    total_tokens: int = 0
    total_duration_ms: float = 0.0


@dataclass
class TraceConfig:
    """Tracer 配置。"""
    enabled: bool = True
    verbose: bool = False
    output_format: Literal["json", "text"] = "json"
