"""Lab 3: Permissions — Human-in-the-loop 設計。

實現工具執行前的權限檢查系統。危險操作（寫入、刪除、執行命令）
需要經過用戶確認，而讀取操作可以自動批准。

學習目標:
- 理解 Agent 安全性的重要性
- 使用 glob 模式匹配工具名稱
- 實現分級權限控制 (auto / confirm / deny)
- 設計人機交互的確認流程

Permission Flow:
    ┌──────────────┐
    │  Tool Call   │
    │  Requested   │
    └──────┬───────┘
           │
    ┌──────▼───────┐
    │ Match Rule   │
    │ (glob)       │
    └──────┬───────┘
           │
    ┌──────▼───────┐
    │ Check Level  │
    └──┬───┬───┬───┘
       │   │   │
  auto │   │   │ deny
       │   │   │
       ▼   │   ▼
    Allow  │  Block
           │
      confirm
           │
    ┌──────▼───────┐
    │ Ask User     │
    │ (callback)   │
    └──────┬───────┘
           │
      ┌────┴────┐
      ▼         ▼
    Allow     Block
"""

from __future__ import annotations

import fnmatch
from typing import Any, Callable

from .types import (
    PermissionConfig,
    PermissionRequest,
    PermissionResult,
    PermissionRule,
)


class PermissionManager:
    """工具執行權限管理器。

    在 Agent 調用工具前，根據規則和風險等級決定是否允許執行。
    支持自動批准、用戶確認和直接拒絕三種模式。

    Attributes:
        config: 權限配置。
        user_input_fn: 請求用戶確認時的回調函數。
            接收描述字串，返回 True（批准）或 False（拒絕）。
    """

    def __init__(
        self,
        config: PermissionConfig | None = None,
        user_input_fn: Callable[[str], bool] | None = None,
    ) -> None:
        """初始化權限管理器。

        TODO: 學生實現
        - 保存 config（若為 None 則創建默認 PermissionConfig，
          並使用 create_default_rules() 初始化 rules）
        - 保存 user_input_fn（若為 None 則默認返回 False 的函數）

        HINT: 如果 config 為 None，可以這樣做：
              config = PermissionConfig(rules=create_default_rules())

        Args:
            config: 權限配置，None 時使用默認值。
            user_input_fn: 用戶確認回調，None 時默認拒絕。
        """
        # TODO: 初始化權限管理器
        raise NotImplementedError("TODO: 初始化 PermissionManager")

    def check_permission(self, request: PermissionRequest) -> PermissionResult:
        """檢查工具執行權限。

        TODO: 學生實現

        偽代碼:
            # 1. 先檢查是否自動批准讀取操作
            if self.config.auto_approve_read:
                risk = self._assess_risk(request.tool_name, request.tool_input)
                if risk == "low":
                    return PermissionResult(
                        allowed=True,
                        reason="讀取操作自動批准",
                    )

            # 2. 查找匹配的規則
            rule = self._match_rule(request.tool_name)

            if rule is not None:
                if rule.level == "auto":
                    return PermissionResult(allowed=True, reason=rule.reason)
                elif rule.level == "deny":
                    return PermissionResult(allowed=False, reason=rule.reason)
                elif rule.level == "confirm":
                    return self.request_approval(request)

            # 3. 使用默認等級
            if self.config.default_level == "auto":
                return PermissionResult(allowed=True, reason="默認自動批准")
            elif self.config.default_level == "deny":
                return PermissionResult(allowed=False, reason="默認拒絕")
            else:
                return self.request_approval(request)

        HINT: 優先級是 auto_approve_read → 規則匹配 → 默認等級。
              確保讀取操作（risk == "low"）可以快速通過。

        Args:
            request: 權限請求對象。

        Returns:
            PermissionResult: 權限檢查結果。
        """
        # TODO: 檢查權限
        raise NotImplementedError("TODO: 檢查權限")

    def request_approval(self, request: PermissionRequest) -> PermissionResult:
        """請求用戶批准操作。

        TODO: 學生實現

        偽代碼:
            description = format_permission_request(request)
            user_approved = self.user_input_fn(description)

            if user_approved:
                return PermissionResult(
                    allowed=True,
                    reason="用戶已批准",
                )
            else:
                return PermissionResult(
                    allowed=False,
                    reason="用戶已拒絕",
                )

        HINT: 調用 self.user_input_fn 來詢問用戶。
              格式化請求使用已提供的 format_permission_request()。

        Args:
            request: 權限請求對象。

        Returns:
            PermissionResult: 用戶的決定。
        """
        # TODO: 請求用戶批准
        raise NotImplementedError("TODO: 請求用戶批准")

    def _match_rule(self, tool_name: str) -> PermissionRule | None:
        """查找匹配工具名稱的權限規則。

        TODO: 學生實現

        偽代碼:
            for rule in self.config.rules:
                if fnmatch.fnmatch(tool_name, rule.tool_pattern):
                    return rule
            return None

        HINT: 使用 fnmatch.fnmatch() 進行 glob 模式匹配。
              規則列表按優先級排列，第一個匹配的規則生效。
              例如 "read_*" 匹配 "read_file", "read_dir" 等。

        Args:
            tool_name: 要匹配的工具名稱。

        Returns:
            PermissionRule | None: 匹配的規則，或 None。
        """
        # TODO: 匹配規則
        raise NotImplementedError("TODO: 匹配規則")

    def _assess_risk(self, tool_name: str, tool_input: dict[str, Any]) -> str:
        """評估工具調用的風險等級。

        TODO: 學生實現

        偽代碼:
            high_risk_patterns = ["delete", "remove", "drop", "exec", "shell", "sudo"]
            medium_risk_patterns = ["write", "edit", "modify", "create", "update"]
            low_risk_patterns = ["read", "get", "list", "search", "find", "view"]

            tool_lower = tool_name.lower()

            for pattern in high_risk_patterns:
                if pattern in tool_lower:
                    return "high"

            for pattern in medium_risk_patterns:
                if pattern in tool_lower:
                    return "medium"

            for pattern in low_risk_patterns:
                if pattern in tool_lower:
                    return "low"

            # 檢查 tool_input 中是否有危險信號
            input_str = str(tool_input).lower()
            if any(kw in input_str for kw in ["rm ", "sudo", "chmod", "drop table"]):
                return "high"

            return "medium"  # 默認中等風險

        HINT: 根據工具名稱中的關鍵字判斷風險。
              "read" 相關的通常是低風險，
              "delete" 相關的通常是高風險。
              也可以檢查 tool_input 的內容。

        Args:
            tool_name: 工具名稱。
            tool_input: 工具的輸入參數。

        Returns:
            str: "low", "medium", 或 "high"。
        """
        # TODO: 評估風險等級
        raise NotImplementedError("TODO: 評估風險等級")

    # ------------------------------------------------------------------
    # PROVIDED: 以下函數已經實現，學生不需要修改
    # ------------------------------------------------------------------


def create_default_rules() -> list[PermissionRule]:
    """創建默認的權限規則集。

    PROVIDED: 學生不需要修改此函數。

    Returns:
        list[PermissionRule]: 預設的權限規則列表。
    """
    return [
        PermissionRule(
            tool_pattern="read_*",
            level="auto",
            reason="讀取操作安全，自動批准",
        ),
        PermissionRule(
            tool_pattern="get_*",
            level="auto",
            reason="查詢操作安全，自動批准",
        ),
        PermissionRule(
            tool_pattern="list_*",
            level="auto",
            reason="列表操作安全，自動批准",
        ),
        PermissionRule(
            tool_pattern="search_*",
            level="auto",
            reason="搜索操作安全，自動批准",
        ),
        PermissionRule(
            tool_pattern="write_*",
            level="confirm",
            reason="寫入操作需要確認",
        ),
        PermissionRule(
            tool_pattern="edit_*",
            level="confirm",
            reason="編輯操作需要確認",
        ),
        PermissionRule(
            tool_pattern="create_*",
            level="confirm",
            reason="創建操作需要確認",
        ),
        PermissionRule(
            tool_pattern="delete_*",
            level="confirm",
            reason="刪除操作需要確認",
        ),
        PermissionRule(
            tool_pattern="execute_*",
            level="confirm",
            reason="執行操作需要確認",
        ),
        PermissionRule(
            tool_pattern="run_*",
            level="confirm",
            reason="運行操作需要確認",
        ),
        PermissionRule(
            tool_pattern="sudo_*",
            level="deny",
            reason="超級用戶操作被禁止",
        ),
        PermissionRule(
            tool_pattern="drop_*",
            level="deny",
            reason="銷毀操作被禁止",
        ),
    ]


def format_permission_request(request: PermissionRequest) -> str:
    """格式化權限請求為人類可讀的描述。

    PROVIDED: 學生不需要修改此函數。

    Args:
        request: 權限請求對象。

    Returns:
        str: 格式化的描述文字。
    """
    risk_indicators = {
        "low": "[LOW RISK]",
        "medium": "[MEDIUM RISK]",
        "high": "[HIGH RISK]",
    }
    risk_label = risk_indicators.get(request.risk_level, "[UNKNOWN RISK]")

    input_preview = str(request.tool_input)
    if len(input_preview) > 200:
        input_preview = input_preview[:200] + "..."

    lines = [
        f"=== Permission Request {risk_label} ===",
        f"Tool:        {request.tool_name}",
        f"Description: {request.description}",
        f"Input:       {input_preview}",
        f"Risk Level:  {request.risk_level}",
        "========================================",
        "Allow this operation? (y/n)",
    ]
    return "\n".join(lines)
