"""Phase 3 類型定義 — 所有資料結構和類型別名。

本文件定義了整個 Phase 3 使用的核心資料結構。
學生不需要修改此文件，只需閱讀並理解每個類型的用途。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Literal


# ---------------------------------------------------------------------------
# Shared tool types (carried forward from Phase 0)
# ---------------------------------------------------------------------------

@dataclass
class ToolCall:
    """Tool 調用請求。"""
    id: str = ""
    name: str = ""
    input: dict[str, Any] = field(default_factory=dict)


@dataclass
class ToolResult:
    """Tool 執行結果。"""
    tool_use_id: str = ""
    content: str = ""
    is_error: bool = False


# ---------------------------------------------------------------------------
# Agent loop types
# ---------------------------------------------------------------------------

@dataclass
class AgentConfig:
    """Agent 循環的配置參數。

    Attributes:
        max_iterations: 最大循環迭代次數，防止無限循環。
        max_tokens_budget: Token 預算上限，超過則停止。
        model: 使用的 LLM 模型名稱。
    """
    max_iterations: int = 20
    max_tokens_budget: int = 100_000
    model: str = "claude-sonnet-4-20250514"


@dataclass
class AgentStep:
    """Agent 循環中的一步動作記錄。

    每次迭代會產生一個 AgentStep，記錄 Agent 的思考、行動和觀察。

    Attributes:
        iteration: 迭代編號（從 1 開始）。
        thought: Agent 的推理過程文字（可能為 None）。
        action: Agent 選擇的行動描述（可能為 None）。
        tool_name: 被調用的工具名稱（如果有的話）。
        tool_input: 傳遞給工具的輸入參數。
        observation: 工具執行結果或環境反饋。
        tokens_used: 本步驟消耗的 token 數。
    """
    iteration: int = 0
    thought: str | None = None
    action: str | None = None
    tool_name: str | None = None
    tool_input: dict[str, Any] | None = None
    observation: str | None = None
    tokens_used: int = 0


@dataclass
class AgentState:
    """Agent 循環的即時狀態快照。

    Attributes:
        messages: 當前對話歷史。
        iteration_count: 已完成的迭代次數。
        total_tokens_used: 已消耗的總 token 數。
        status: Agent 當前的運行狀態。
    """
    messages: list[dict[str, Any]] = field(default_factory=list)
    iteration_count: int = 0
    total_tokens_used: int = 0
    status: Literal[
        "running",
        "completed",
        "failed",
        "budget_exceeded",
        "max_iterations",
    ] = "running"


@dataclass
class AgentResult:
    """Agent 循環的最終結果。

    Attributes:
        success: 任務是否成功完成。
        final_output: Agent 的最終回覆文字。
        iterations: 總迭代次數。
        total_tokens: 總 token 消耗量。
        trace: 完整的步驟追蹤列表。
        error: 如果失敗，錯誤信息（可能為 None）。
    """
    success: bool = False
    final_output: str = ""
    iterations: int = 0
    total_tokens: int = 0
    trace: list[AgentStep] = field(default_factory=list)
    error: str | None = None


# ---------------------------------------------------------------------------
# Error recovery types
# ---------------------------------------------------------------------------

ErrorCategory: type = Literal["retryable", "strategy_change", "fatal"]


@dataclass
class ErrorRecord:
    """一次錯誤的詳細記錄。

    Attributes:
        error_type: 錯誤的類別名稱（如 FileNotFoundError）。
        message: 錯誤訊息文字。
        category: 錯誤分類：retryable / strategy_change / fatal。
        attempt: 當前是第幾次嘗試。
        context: 與錯誤相關的上下文資訊。
    """
    error_type: str = ""
    message: str = ""
    category: Literal["retryable", "strategy_change", "fatal"] = "retryable"
    attempt: int = 1
    context: dict[str, Any] = field(default_factory=dict)


@dataclass
class RecoveryStrategy:
    """一種錯誤恢復策略。

    Attributes:
        name: 策略名稱（如 "retry", "alternative_approach"）。
        description: 策略的描述說明。
        prompt_modifier: 添加到 prompt 中的策略指引文字。
    """
    name: str = ""
    description: str = ""
    prompt_modifier: str = ""


@dataclass
class RecoveryConfig:
    """錯誤恢復模組的配置。

    Attributes:
        max_retries: 同一錯誤最多重試次數。
        max_strategy_changes: 最多切換策略次數。
        retry_delay_ms: 重試間隔（毫秒），測試時可設為極小值。
    """
    max_retries: int = 3
    max_strategy_changes: int = 2
    retry_delay_ms: int = 100


# ---------------------------------------------------------------------------
# Permission types
# ---------------------------------------------------------------------------

@dataclass
class PermissionRule:
    """一條權限規則。

    Attributes:
        tool_pattern: 匹配工具名稱的 glob 模式（如 "read_*", "write_*"）。
        level: 權限等級：auto / confirm / deny。
        reason: 為什麼設置這個等級的說明。
    """
    tool_pattern: str = "*"
    level: Literal["auto", "confirm", "deny"] = "confirm"
    reason: str = ""


@dataclass
class PermissionRequest:
    """一次權限請求。

    Attributes:
        tool_name: 請求執行的工具名稱。
        tool_input: 傳給工具的輸入參數。
        risk_level: 風險評估：low / medium / high。
        description: 人類可讀的操作描述。
    """
    tool_name: str = ""
    tool_input: dict[str, Any] = field(default_factory=dict)
    risk_level: Literal["low", "medium", "high"] = "medium"
    description: str = ""


@dataclass
class PermissionResult:
    """權限檢查的結果。

    Attributes:
        allowed: 是否允許執行。
        reason: 允許或拒絕的原因。
        modified_input: 如果用戶修改了輸入參數，這裡是修改後的值。
    """
    allowed: bool = False
    reason: str = ""
    modified_input: dict[str, Any] | None = None


@dataclass
class PermissionConfig:
    """Permission 系統的配置。

    Attributes:
        default_level: 沒有匹配規則時的默認等級。
        rules: 權限規則列表，按優先級排列。
        auto_approve_read: 是否自動批准讀取類操作。
    """
    default_level: Literal["auto", "confirm", "deny"] = "confirm"
    rules: list[PermissionRule] = field(default_factory=list)
    auto_approve_read: bool = True
