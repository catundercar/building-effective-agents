"""Lab 1: Tool Registry — 可擴展的工具註冊與管理系統。

本模組實現了 Tool Registry 設計模式，支持：
- 工具的動態註冊與取消註冊（帶完整驗證）
- 工具定義的 JSON Schema 驗證
- 從目錄自動發現和加載工具模塊
- Tool description 的質量檢查

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。

核心理念：Anthropic 在 SWE-bench 上的經驗——在工具上花的時間應該比 prompt 更多。
"""

from __future__ import annotations

import importlib
import importlib.util
from pathlib import Path
from typing import Any

from .types import (
    JSONSchema,
    ToolDefinition,
    ToolHandler,
    ToolResult,
)


class ToolRegistry:
    """工具註冊表 — 管理所有可用的 Tool。

    職責：
    1. 存儲已註冊的 ToolHandler
    2. 驗證新工具的合法性
    3. 提供查詢接口（按名稱查找、列出所有定義）
    4. 支持動態增刪
    """

    def __init__(self) -> None:
        self._handlers: dict[str, ToolHandler] = {}

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def register(self, handler: ToolHandler) -> None:
        """註冊一個新的 Tool。

        將 ToolHandler 加入註冊表。需要驗證：
        1. Tool 名稱不能為空
        2. Tool 描述不能為空
        3. 不能重複註冊同名的 Tool
        4. input_schema.type 必須是 "object"
        5. Tool 名稱只能包含小寫字母、數字和下劃線

        Args:
            handler: 包含 definition 和 execute 的 ToolHandler

        Raises:
            ValueError: 驗證失敗時拋出
        """
        # HINT: 1. 取出 handler.definition.name 和 description
        # HINT: 2. 逐項檢查上述 5 個驗證條件
        # HINT: 3. 對於名稱格式，可以用正則 r'^[a-z][a-z0-9_]*$' 驗證
        # HINT: 4. 全部通過後，存入 self._handlers[name] = handler
        raise NotImplementedError("TODO: Implement register")

    def unregister(self, name: str) -> None:
        """取消註冊一個 Tool。

        從註冊表中移除指定名稱的 Tool。

        Args:
            name: 要移除的 Tool 名稱

        Raises:
            KeyError: 當指定名稱的 Tool 不存在時拋出
        """
        # HINT: 1. 檢查 name 是否在 self._handlers 中
        # HINT: 2. 如果存在則刪除，不存在則 raise KeyError
        raise NotImplementedError("TODO: Implement unregister")

    def validate_schema(self, definition: ToolDefinition) -> list[str]:
        """驗證 ToolDefinition 的 JSON Schema 格式。

        檢查：
        1. input_schema.type 必須是 "object"
        2. required 中的每個字段必須出現在 properties 中
        3. 每個 property 必須有 "type" 字段
        4. 每個 property 必須有 "description" 字段

        Args:
            definition: 要驗證的 ToolDefinition

        Returns:
            list[str]: 錯誤信息列表。空列表表示驗證通過。
        """
        # HINT: 1. 初始化 errors = []
        # HINT: 2. 檢查 input_schema.type 是否為 "object"
        # HINT: 3. 遍歷 required，確認每個都在 properties 中
        # HINT: 4. 遍歷 properties，確認每個都有 "type" 和 "description"
        # HINT: 5. 返回 errors
        raise NotImplementedError("TODO: Implement validate_schema")

    def load_from_directory(self, directory: str | Path) -> int:
        """從指定目錄自動發現和加載 Tool 模塊。

        掃描目錄下所有 .py 文件，查找模塊級的 tool_handler 變量
        （類型為 ToolHandler），自動註冊。

        約定：每個工具模塊導出一個名為 `tool_handler` 的 ToolHandler 實例。

        Args:
            directory: 要掃描的目錄路徑

        Returns:
            int: 成功加載的工具數量
        """
        # HINT: 1. 用 Path(directory).glob("*.py") 掃描 .py 文件
        # HINT: 2. 跳過 __init__.py 和以 _ 開頭的文件
        # HINT: 3. 用 importlib.util.spec_from_file_location 加載模塊
        # HINT: 4. 檢查模塊是否有 'tool_handler' 屬性
        # HINT: 5. 如果有且是 ToolHandler 類型，調用 self.register()
        # HINT: 6. 用 try/except 跳過加載失敗的文件
        # HINT: 7. 返回成功加載的數量
        raise NotImplementedError("TODO: Implement load_from_directory")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    def get(self, name: str) -> ToolHandler | None:
        """根據名稱獲取 ToolHandler。（已實現）"""
        return self._handlers.get(name)

    def list_definitions(self) -> list[ToolDefinition]:
        """返回所有已註冊的 ToolDefinition 列表。（已實現）"""
        return [h.definition for h in self._handlers.values()]

    def list_names(self) -> list[str]:
        """返回所有已註冊的 Tool 名稱列表。（已實現）"""
        return list(self._handlers.keys())

    @property
    def size(self) -> int:
        """已註冊的 Tool 數量。（已實現）"""
        return len(self._handlers)

    def has(self, name: str) -> bool:
        """檢查指定名稱的 Tool 是否已註冊。（已實現）"""
        return name in self._handlers

    def clear(self) -> None:
        """清空所有已註冊的 Tool。（已實現）"""
        self._handlers.clear()

    def get_description_stats(self) -> dict[str, int]:
        """返回所有工具的 description 長度統計。（已實現）

        用於 A/B 測試 description 質量。
        """
        return {
            name: len(handler.definition.description)
            for name, handler in self._handlers.items()
        }
