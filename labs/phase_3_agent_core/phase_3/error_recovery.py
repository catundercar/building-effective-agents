"""Lab 2: Error Recovery — 環境反饋與自我修正。

讓 Agent 能從錯誤中學習，自動重試或切換策略。
一個好的 Agent 不是不犯錯，而是能從錯誤中恢復。

學習目標:
- 將錯誤分類為可重試、需換策略、致命三種
- 實現有限次數的重試機制
- 基於失敗歷史選擇恢復策略
- 在重試提示中注入錯誤上下文

Error Recovery Flow:
    ┌──────────┐
    │  Error   │
    │ Occurred │
    └────┬─────┘
         │
    ┌────▼─────┐     ┌─────────────┐
    │Categorize│────→│   Fatal?    │──→ Stop & Report
    │  Error   │     └─────────────┘
    └────┬─────┘
         │ retryable / strategy_change
    ┌────▼──────────┐
    │ Check Retry   │
    │ Eligibility   │
    └────┬──────────┘
         │ eligible
    ┌────▼──────────┐
    │ Get Recovery  │
    │ Strategy      │
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ Build Retry   │
    │ Prompt        │
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ Retry with    │
    │ Enhanced Ctx  │
    └───────────────┘
"""

from __future__ import annotations

from typing import Any

from .types import (
    ErrorCategory,
    ErrorRecord,
    RecoveryConfig,
    RecoveryStrategy,
)


class ErrorRecovery:
    """錯誤恢復管理器。

    追蹤錯誤歷史，將錯誤分類，並選擇合適的恢復策略。
    核心理念：Agent 應該能從錯誤中學習，而不是盲目重試。

    Attributes:
        config: 恢復配置（最大重試次數、策略切換次數等）。
        error_history: 所有記錄的錯誤歷史。
        strategy_changes: 已進行的策略切換次數。
    """

    def __init__(self, config: RecoveryConfig | None = None) -> None:
        """初始化錯誤恢復管理器。

        TODO: 學生實現
        - 保存 config（若為 None 則創建默認 RecoveryConfig）
        - 初始化 error_history 為空列表
        - 初始化 strategy_changes 計數器為 0

        HINT: self.error_history: list[ErrorRecord] = []

        Args:
            config: 恢復配置，None 時使用默認值。
        """
        # TODO: 初始化錯誤恢復管理器
        raise NotImplementedError("TODO: 初始化 ErrorRecovery")

    def categorize_error(
        self, error: Exception | str, context: dict[str, Any] | None = None
    ) -> ErrorRecord:
        """將錯誤分類並建立記錄。

        TODO: 學生實現

        分類規則:
        - "retryable": 暫時性錯誤，重試可能成功
          - 包含 "timeout", "rate limit", "connection", "429", "503", "temporary"
        - "fatal": 不可恢復的錯誤
          - 包含 "permission denied", "authentication", "invalid api",
            "401", "403"
        - "strategy_change": 方法有問題，需要換策略
          - 其他所有錯誤（默認）

        偽代碼:
            error_msg = str(error).lower()
            error_type = type(error).__name__ if isinstance(error, Exception) else "StringError"

            retryable_keywords = ["timeout", "rate limit", "connection", "429", "503", "temporary"]
            fatal_keywords = ["permission denied", "authentication", "invalid api", "401", "403"]

            category = "strategy_change"  # 默認
            for kw in retryable_keywords:
                if kw in error_msg:
                    category = "retryable"
                    break
            for kw in fatal_keywords:
                if kw in error_msg:
                    category = "fatal"
                    break

            current_attempt = len([r for r in self.error_history
                                   if r.error_type == error_type]) + 1

            return ErrorRecord(
                error_type=error_type,
                message=str(error),
                category=category,
                attempt=current_attempt,
                context=context or {},
            )

        HINT: 用 str(error).lower() 來做關鍵字匹配，
              這樣可以不區分大小寫。

        Args:
            error: 要分類的錯誤（可以是 Exception 或字串）。
            context: 額外的上下文信息。

        Returns:
            ErrorRecord: 分類後的錯誤記錄。
        """
        # TODO: 分類錯誤
        raise NotImplementedError("TODO: 分類錯誤")

    def should_retry(self, error_record: ErrorRecord) -> bool:
        """判斷是否應該重試。

        TODO: 學生實現

        偽代碼:
            if error_record.category == "fatal":
                return False
            if error_record.category == "retryable":
                return error_record.attempt <= self.config.max_retries
            if error_record.category == "strategy_change":
                return self.strategy_changes < self.config.max_strategy_changes
            return False

        HINT: fatal 錯誤永遠不重試。
              retryable 錯誤受 max_retries 限制。
              strategy_change 錯誤受 max_strategy_changes 限制。

        Args:
            error_record: 要判斷的錯誤記錄。

        Returns:
            bool: True 表示應該重試。
        """
        # TODO: 判斷是否應該重試
        raise NotImplementedError("TODO: 判斷是否應該重試")

    def get_recovery_strategy(
        self, error_records: list[ErrorRecord]
    ) -> RecoveryStrategy:
        """根據失敗歷史選擇恢復策略。

        TODO: 學生實現

        偽代碼:
            strategies = self._default_strategies()
            repeated = self._detect_repeated_failures(error_records)

            if not error_records:
                return strategies[0]  # 簡單重試

            if repeated:
                # 有重複失敗，需要大幅改變策略
                self.strategy_changes += 1
                return strategies[2]  # 完全不同的方法

            latest = error_records[-1]
            if latest.category == "retryable":
                return strategies[0]  # 簡單重試
            elif latest.category == "strategy_change":
                self.strategy_changes += 1
                return strategies[1]  # 微調方法

            return strategies[0]

        HINT: _default_strategies() 返回三個策略：
              [0] 簡單重試, [1] 微調方法, [2] 完全不同的方法

        Args:
            error_records: 到目前為止的錯誤記錄列表。

        Returns:
            RecoveryStrategy: 選擇的恢復策略。
        """
        # TODO: 選擇恢復策略
        raise NotImplementedError("TODO: 選擇恢復策略")

    def build_retry_prompt(
        self,
        original_prompt: str,
        error_records: list[ErrorRecord],
    ) -> str:
        """構建帶有錯誤上下文的重試提示。

        TODO: 學生實現

        偽代碼:
            if not error_records:
                return original_prompt

            strategy = self.get_recovery_strategy(error_records)

            error_summary_lines = []
            for i, record in enumerate(error_records, 1):
                error_summary_lines.append(
                    f"  嘗試 {i}: [{record.error_type}] {record.message}"
                )
            error_summary = "\n".join(error_summary_lines)

            retry_prompt = (
                f"{original_prompt}\n\n"
                f"--- 之前的嘗試失敗了 ---\n"
                f"失敗歷史:\n{error_summary}\n\n"
                f"恢復策略: {strategy.name}\n"
                f"{strategy.prompt_modifier}\n\n"
                f"請基於以上信息，嘗試一個不同的方法來完成任務。"
            )
            return retry_prompt

        HINT: 把錯誤歷史格式化為結構化的文字，
              讓 LLM 能清楚看到之前哪裡出了問題。

        Args:
            original_prompt: 原始的任務提示。
            error_records: 到目前為止的錯誤記錄。

        Returns:
            str: 增強後的重試提示。
        """
        # TODO: 構建重試提示
        raise NotImplementedError("TODO: 構建重試提示")

    def record_error(self, error_record: ErrorRecord) -> None:
        """記錄一次錯誤到歷史中。

        TODO: 學生實現

        偽代碼:
            self.error_history.append(error_record)

        HINT: 簡單地將錯誤記錄添加到 error_history 列表中。
              這些歷史記錄用於後續的策略選擇。

        Args:
            error_record: 要記錄的錯誤。
        """
        # TODO: 記錄錯誤
        raise NotImplementedError("TODO: 記錄錯誤")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現，學生不需要修改
    # ------------------------------------------------------------------

    @staticmethod
    def _default_strategies() -> list[RecoveryStrategy]:
        """返回默認的恢復策略列表。

        PROVIDED: 學生不需要修改此方法。

        Returns:
            三個預設策略：簡單重試、微調方法、完全不同的方法。
        """
        return [
            RecoveryStrategy(
                name="simple_retry",
                description="簡單重試，保持相同方法",
                prompt_modifier=(
                    "之前的嘗試遇到了暫時性問題。"
                    "請使用相同的方法再試一次。"
                ),
            ),
            RecoveryStrategy(
                name="adjust_approach",
                description="微調方法，修正之前的問題",
                prompt_modifier=(
                    "之前的方法有一些問題。請分析錯誤原因，"
                    "對方法做小幅調整後重試。"
                    "保持整體策略不變，但修正具體的問題點。"
                ),
            ),
            RecoveryStrategy(
                name="alternative_approach",
                description="完全不同的方法",
                prompt_modifier=(
                    "之前的方法已經反覆失敗。"
                    "請從頭開始，使用一個完全不同的方法來解決問題。"
                    "不要再使用之前嘗試過的方法。"
                ),
            ),
        ]

    @staticmethod
    def _detect_repeated_failures(records: list[ErrorRecord]) -> bool:
        """檢測是否有重複失敗模式。

        PROVIDED: 學生不需要修改此方法。

        如果最近 3 條記錄中有相同類型的錯誤出現 2 次以上，
        則認為存在重複失敗。

        Args:
            records: 錯誤記錄列表。

        Returns:
            bool: True 表示檢測到重複失敗模式。
        """
        if len(records) < 2:
            return False

        recent = records[-3:] if len(records) >= 3 else records
        error_types = [r.error_type for r in recent]

        for error_type in error_types:
            if error_types.count(error_type) >= 2:
                return True

        return False
