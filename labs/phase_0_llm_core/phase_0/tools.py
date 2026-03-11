"""Lab 2: Tool 系統 — 註冊、執行與 Tool Use 循環。

本模組實現了 Agent 的工具系統，包括：
- ToolRegistry: 管理可用工具的註冊表
- ToolExecutor: 執行 LLM 請求的工具調用
- tool_use_loop: 完整的 Tool Use 循環（LLM ↔ Tool 交替調用）

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

from typing import Any, Callable

from .types import (
    LLMClientOptions,
    LLMResponse,
    Message,
    ToolDefinition,
    ToolHandler,
    ToolResultBlock,
    ToolUseBlock,
    TextBlock,
)


class ToolRegistry:
    """工具註冊表 — 管理所有可用的 Tool。"""

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

        Args:
            handler: 包含 definition 和 execute 的 ToolHandler

        Raises:
            ValueError: 名稱為空、描述為空或已存在同名 Tool 時拋出
        """
        # HINT: 1. 檢查 handler.definition.name 是否為空字串
        # HINT: 2. 檢查 handler.definition.description 是否為空字串
        # HINT: 3. 檢查 self._handlers 中是否已有同名 Tool
        # HINT: 4. 驗證通過後，將 handler 存入 self._handlers 字典
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


class ToolExecutor:
    """工具執行器 — 根據 LLM 的 tool_use 請求執行對應的 Tool。"""

    def __init__(self, registry: ToolRegistry) -> None:
        self.registry = registry

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def execute(self, tool_call: ToolUseBlock) -> ToolResultBlock:
        """執行單個 Tool 調用。

        根據 tool_call 中的 name 從 registry 查找對應的 handler，
        調用 handler.execute(tool_call.input) 獲取結果。
        如果 Tool 不存在或執行出錯，返回帶 is_error=True 的結果。

        Args:
            tool_call: LLM 返回的 ToolUseBlock

        Returns:
            ToolResultBlock: 執行結果
        """
        # HINT: 1. 用 self.registry.get(tool_call.name) 查找 handler
        # HINT: 2. 如果找不到，返回 ToolResultBlock(tool_use_id=..., content="Tool not found: ...", is_error=True)
        # HINT: 3. 使用 try/except 調用 handler.execute(tool_call.input)
        # HINT: 4. 成功時返回 ToolResultBlock(tool_use_id=..., content=result)
        # HINT: 5. 失敗時返回 ToolResultBlock(tool_use_id=..., content=str(e), is_error=True)
        raise NotImplementedError("TODO: Implement execute")

    def execute_all(self, response: LLMResponse) -> list[ToolResultBlock]:
        """執行回應中所有的 Tool 調用。

        遍歷 LLMResponse.content，找出所有 ToolUseBlock 並執行。

        Args:
            response: LLM 回應

        Returns:
            list[ToolResultBlock]: 所有 Tool 的執行結果
        """
        # HINT: 1. 遍歷 response.content，篩選出 type == "tool_use" 的 block
        # HINT: 2. 對每個 ToolUseBlock 調用 self.execute(block)
        # HINT: 3. 收集所有結果並返回
        raise NotImplementedError("TODO: Implement execute_all")


def tool_use_loop(
    client: Any,
    executor: ToolExecutor,
    initial_messages: list[Message],
    *,
    system_prompt: str | None = None,
    tools: list[ToolDefinition],
    max_iterations: int = 10,
    on_iteration: Callable[[int, LLMResponse], None] | None = None,
) -> dict[str, Any]:
    """完整的 Tool Use 循環。

    反覆調用 LLM → 執行 Tool → 將結果回傳 LLM，
    直到 LLM 返回 end_turn 或達到最大迭代次數。

    這是 Augmented LLM 的核心模式：
    LLM 生成 tool_use → 我們執行 tool → 將 tool_result 回傳 → LLM 繼續

    Args:
        client: LLMClient 實例
        executor: ToolExecutor 實例
        initial_messages: 初始對話消息
        system_prompt: 系統提示詞
        tools: 可用的 Tool 定義列表
        max_iterations: 最大迭代次數（防止無限循環）
        on_iteration: 每次迭代的回調函數（可選）

    Returns:
        dict: {"response": 最終的 LLMResponse, "messages": 完整對話歷史}
    """
    # HINT: 1. 複製 initial_messages 到 messages 列表
    # HINT: 2. 構建 LLMClientOptions(system_prompt=..., tools=...)
    # HINT: 3. for 循環（最多 max_iterations 次）:
    #    a. 調用 client.create_message(messages, options)
    #    b. 如果 on_iteration 不為 None，調用它
    #    c. 如果 stop_reason == "end_turn" 或 stop_reason == "max_tokens"，
    #       返回 {"response": response, "messages": messages}
    #    d. 如果 stop_reason == "tool_use":
    #       - 將 assistant 的回應加入 messages（role="assistant", content=response.content）
    #       - 調用 executor.execute_all(response) 獲取 tool_results
    #       - 將 tool_results 作為 user 消息加入 messages（role="user", content=tool_results）
    # HINT: 4. 循環結束後（達到 max_iterations），raise RuntimeError
    raise NotImplementedError("TODO: Implement tool_use_loop")
