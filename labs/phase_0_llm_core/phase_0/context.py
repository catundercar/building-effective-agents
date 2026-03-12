"""Lab 3: Context 管理 — Token 估算、截斷與摘要壓縮。

本模組實現了 Context Window 的管理，包括：
- Token 數量估算（支持中英文混合文本）
- 對話歷史截斷（當接近上限時移除最舊的消息）
- 摘要壓縮（將多條舊消息壓縮為一條摘要）

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

import json
import math
from typing import Any

from .types import (
    ContentBlock,
    ContextManagerConfig,
    ContextState,
    LLMClientOptions,
    Message,
    TextBlock,
    ToolDefinition,
    ToolResultBlock,
    ToolUseBlock,
)


class ContextManager:
    """Context Window 管理器。

    負責追蹤對話上下文的 token 用量，並在接近限制時
    自動進行截斷和摘要壓縮。
    """

    def __init__(self, config: ContextManagerConfig | None = None) -> None:
        self.config = config or ContextManagerConfig()
        self._messages: list[Message] = []
        self._system_prompt: str = ""
        self._tools: list[ToolDefinition] = []

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def estimate_tokens(self, text: str) -> int:
        """估算文本的 token 數量。

        使用簡化的估算方法：
        - 英文：大約每 4 個字符 1 個 token
        - 中文：大約每個字符 1.5 個 token
        - 實際採用混合策略以覆蓋多語言場景

        Args:
            text: 要估算的文本

        Returns:
            int: 估算的 token 數量
        """
        # HINT: 1. 如果 text 為空，返回 0
        # HINT: 2. 遍歷每個字符，判斷是否為中文字符
        #          中文 Unicode 範圍: '\u4e00' <= ch <= '\u9fff'
        # HINT: 3. 中文字符算 1.5 token，其他字符算 0.25 token
        # HINT: 4. 返回向上取整的整數值（使用 int() + 1 或 math.ceil）
        raise NotImplementedError("TODO: Implement estimate_tokens")

    def estimate_message_tokens(self, message: Message) -> int:
        """估算單條消息的 token 數量。

        需要處理兩種消息格式：
        1. 純文字 content (str)
        2. ContentBlock 列表

        Args:
            message: 要估算的消息

        Returns:
            int: 估算的 token 數量（包含角色標記等 overhead）
        """
        # HINT: 1. 基礎 overhead = 4 tokens（角色標記等）
        # HINT: 2. 如果 content 是 str，直接估算
        # HINT: 3. 如果 content 是 list，遍歷每個 block:
        #          - TextBlock: 估算 block.text
        #          - ToolUseBlock: 估算 name + json.dumps(block.input)
        #          - ToolResultBlock: 估算 block.content
        # HINT: 4. 返回 overhead + 內容 tokens
        raise NotImplementedError("TODO: Implement estimate_message_tokens")

    def get_total_tokens(self) -> int:
        """計算當前 context 的總 token 數量。

        包括 system prompt、tools 定義、所有消息和預留的輸出 tokens。

        Returns:
            int: 總 token 數量
        """
        # HINT: 1. 估算 system prompt 的 tokens
        # HINT: 2. 估算 tools 的 tokens（json.dumps 每個 tool 的 definition）
        # HINT: 3. 估算所有 messages 的 tokens（用 estimate_message_tokens）
        # HINT: 4. 加上 reserved_output_tokens
        # HINT: 5. 返回總和
        raise NotImplementedError("TODO: Implement get_total_tokens")

    def truncate(self) -> int:
        """截斷對話歷史以控制 token 數量。

        從最舊的消息開始移除，直到總 token 數量降到限制以下。
        始終保留第一條消息（通常是用戶的初始指令）。

        Returns:
            int: 被移除的消息數量
        """
        # HINT: 1. 計算當前 total tokens
        # HINT: 2. 如果未超過 max_context_tokens，返回 0
        # HINT: 3. 保留第一條消息和最後的消息，從第二條開始移除
        # HINT: 4. 持續移除直到 total tokens <= max_context_tokens 或只剩一條消息
        # HINT: 5. 返回被移除的消息數量
        raise NotImplementedError("TODO: Implement truncate")

    def summarize(self, client: Any) -> bool:
        """將舊消息壓縮為摘要。

        當消息數量超過 4 條時，取前半部分消息生成摘要，
        用一條摘要消息替換它們。

        Args:
            client: LLMClient 實例（用於調用 LLM 生成摘要）

        Returns:
            bool: 是否執行了摘要壓縮
        """
        # HINT: 1. 如果消息數量 <= 4，返回 False（不需要摘要）
        # HINT: 2. 計算要壓縮的消息數量：len(messages) // 2
        # HINT: 3. 提取要壓縮的消息（前 half 條）
        # HINT: 4. 構建摘要請求：將這些消息的文字內容拼接起來
        # HINT: 5. 調用 client.create_message() 讓 LLM 生成摘要
        #          system_prompt: "你是一個對話摘要助手。請將以下對話壓縮為簡潔的摘要，保留關鍵信息。"
        # HINT: 6. 用摘要消息替換原來的前 half 條消息
        # HINT: 7. 返回 True
        raise NotImplementedError("TODO: Implement summarize")

    def auto_manage(self, client: Any) -> None:
        """自動管理 context 大小。

        檢查是否接近 token 限制，如果是則先嘗試截斷，再嘗試摘要。

        Args:
            client: LLMClient 實例
        """
        # HINT: 1. 獲取當前狀態 (get_state)
        # HINT: 2. 如果 is_near_limit 為 False，直接返回
        # HINT: 3. 先嘗試 truncate()
        # HINT: 4. 如果仍然 is_near_limit，嘗試 summarize(client)
        raise NotImplementedError("TODO: Implement auto_manage")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    def set_system_prompt(self, prompt: str) -> None:
        """設置系統提示詞。（已實現）"""
        self._system_prompt = prompt

    def set_tools(self, tools: list[ToolDefinition]) -> None:
        """設置可用的 Tool 列表。（已實現）"""
        self._tools = list(tools)

    def add_message(self, message: Message) -> None:
        """添加一條消息到對話歷史。（已實現）"""
        self._messages.append(message)

    def get_messages(self) -> list[Message]:
        """獲取所有對話消息。（已實現）"""
        return list(self._messages)

    def clear(self) -> None:
        """清除所有消息。（已實現）"""
        self._messages.clear()

    def get_state(self) -> ContextState:
        """獲取當前 context 狀態快照。（已實現）"""
        total = self.get_total_tokens()
        available = self.config.max_context_tokens - self.config.reserved_output_tokens
        threshold = available * self.config.summarization_threshold
        return ContextState(
            messages=list(self._messages),
            system_prompt=self._system_prompt,
            tools=list(self._tools),
            total_tokens=total,
            is_near_limit=total >= threshold,
        )
