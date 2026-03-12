"""Lab 1: Agent Loop — ReAct 循環實現。

實現 Agent 的核心推理-行動循環。Agent 接收一個任務描述，
然後自主地與 LLM 交互、調用工具、觀察結果，直到任務完成。

學習目標:
- 理解 ReAct (Reason + Act) 循環的核心思想
- 實現 Think → Act → Observe 的迭代流程
- 實現 budget 控制和最大迭代限制
- 記錄完整的推理追蹤 (trace)

Architecture:
    ┌─────────────────────────────────────────────────────┐
    │                    AgentLoop                        │
    │                                                     │
    │  task ──→ ┌──────────┐    ┌──────────┐             │
    │           │  LLM     │───→│ Process  │             │
    │           │  Call    │    │ Response │             │
    │           └──────────┘    └────┬─────┘             │
    │                ↑               │                    │
    │                │          ┌────┴─────┐             │
    │                │          │ Tool Use? │             │
    │                │          └────┬──┬───┘             │
    │                │           Yes │  │ No              │
    │                │          ┌────┘  └────┐            │
    │                │          ▼            ▼            │
    │           ┌────┴─────┐  ┌──────────┐               │
    │           │ Execute  │  │ Complete │               │
    │           │ Tool     │  │ (return) │               │
    │           └──────────┘  └──────────┘               │
    └─────────────────────────────────────────────────────┘
"""

from __future__ import annotations

from typing import Any, Callable

from .types import (
    AgentConfig,
    AgentResult,
    AgentState,
    AgentStep,
    ToolCall,
    ToolResult,
)


class AgentLoop:
    """ReAct 風格的 Agent 主循環。

    Agent 接收任務後，持續與 LLM 交互，直到：
    1. LLM 認為任務完成（stop_reason == "end_turn"）
    2. 達到最大迭代次數
    3. Token 預算耗盡

    Attributes:
        llm_client: LLM API 客戶端（需支持 create_message 方法）。
        tools: 可用工具的字典，key 是工具名，value 是可調用的執行函數。
        config: Agent 循環配置。
        state: Agent 當前狀態。
    """

    def __init__(
        self,
        llm_client: Any,
        tools: dict[str, Callable[..., str]],
        config: AgentConfig | None = None,
    ) -> None:
        """初始化 Agent 循環。

        TODO: 學生實現
        - 保存 llm_client、tools 引用
        - 使用 config 或創建默認 AgentConfig
        - 初始化 AgentState（messages=[], iteration_count=0, ...）

        HINT: self.state = AgentState() 就能得到全部默認值。
              tools 是一個 dict[str, Callable]，例如:
              {"read_file": read_file_fn, "write_file": write_file_fn}

        Args:
            llm_client: LLM API 客戶端實例。
            tools: 工具名到執行函數的映射。
            config: Agent 配置，None 時使用默認值。
        """
        # TODO: 初始化 agent loop 的狀態
        raise NotImplementedError("TODO: 初始化 AgentLoop")

    def run(self, task: str) -> AgentResult:
        """執行 Agent 主循環。

        TODO: 學生實現
        這是整個 Phase 3 最核心的函數。它實現了 ReAct 循環：

        偽代碼:
            1. system_prompt = self._build_system_prompt(task)
            2. 將用戶任務加入 messages: {"role": "user", "content": task}
            3. for iteration in range(1, config.max_iterations + 1):
                a. 檢查 budget: if self._check_budget() → 返回 budget_exceeded 結果
                b. 調用 LLM:
                   response = self.llm_client.create_message(
                       self.state.messages,
                       system_prompt=system_prompt,
                       model=self.config.model,
                   )
                c. 更新 token 計數:
                   tokens_used = response.usage.input_tokens + response.usage.output_tokens
                   self.state.total_tokens_used += tokens_used
                d. 處理響應: step = self._process_response(response)
                   step.iteration = iteration
                   step.tokens_used = tokens_used
                e. 加入 trace: trace_steps.append(step) (在 run() 開始時初始化 trace_steps = [])
                f. 如果 response.stop_reason == "end_turn":
                   - 提取最終文字輸出
                   - 返回成功的 AgentResult
                g. 如果有 tool_use:
                   - 將 assistant message 加入 messages
                   - 調用 self._execute_tool(step.tool_name, step.tool_input)
                   - 將 tool result 加入 messages（role="user"）
                   - step.observation = tool 結果
                h. 更新 state.iteration_count
            4. 如果超過最大迭代次數 → 返回 max_iterations 結果

        HINT:
        - LLM 的回覆應該作為 {"role": "assistant", "content": ...} 加入 messages
        - Tool result 作為 {"role": "user", "content": [{"type": "tool_result", ...}]}
        - 記得用 try/except 包裝整個循環，捕獲意外錯誤

        Args:
            task: 用戶的任務描述文字。

        Returns:
            AgentResult: 包含成功狀態、最終輸出、追蹤記錄等。
        """
        # TODO: 實現 Agent 主循環
        raise NotImplementedError("TODO: 實現 Agent 主循環")

    def _process_response(self, response: Any) -> AgentStep:
        """解析 LLM 回應，提取思考和行動。

        TODO: 學生實現

        偽代碼:
            step = AgentStep()
            for block in response.content:
                if block.type == "text":
                    step.thought = block.text
                elif block.type == "tool_use":
                    step.action = f"調用工具: {block.name}"
                    step.tool_name = block.name
                    step.tool_input = block.input
            return step

        HINT: response.content 是一個 list，可能同時包含
              text 和 tool_use 兩種 block。

        Args:
            response: LLM API 的回應對象。

        Returns:
            AgentStep: 解析後的步驟記錄。
        """
        # TODO: 解析 LLM 回應
        raise NotImplementedError("TODO: 解析 LLM 回應")

    def _execute_tool(self, tool_name: str, tool_input: dict[str, Any]) -> str:
        """執行指定的工具並返回結果。

        TODO: 學生實現

        偽代碼:
            if tool_name not in self.tools:
                return f"Error: Tool '{tool_name}' not found. Available: {list(self.tools.keys())}"
            try:
                result = self.tools[tool_name](tool_input)
                return str(result)
            except Exception as e:
                return f"Error executing {tool_name}: {e}"

        HINT: 永遠不要讓工具的異常中斷 Agent 循環。
              捕獲所有異常，把錯誤信息作為字符串返回。
              這樣 LLM 就能看到錯誤並決定下一步。

        Args:
            tool_name: 要執行的工具名稱。
            tool_input: 傳遞給工具的輸入參數。

        Returns:
            str: 工具的執行結果或錯誤信息。
        """
        # TODO: 執行工具
        raise NotImplementedError("TODO: 執行工具")

    def _check_budget(self) -> bool:
        """檢查是否已超出 token 預算。

        TODO: 學生實現

        偽代碼:
            return self.state.total_tokens_used >= self.config.max_tokens_budget

        Args:
            無。

        Returns:
            bool: True 表示已超出預算，應停止循環。
        """
        # TODO: 檢查 token 預算
        raise NotImplementedError("TODO: 檢查 token 預算")

    def _build_system_prompt(self, task: str) -> str:
        """構建 Agent 的系統提示。

        TODO: 學生實現

        偽代碼:
            tool_names = list(self.tools.keys())
            tool_list = ", ".join(tool_names) if tool_names else "無"

            prompt = (
                "你是一個能夠自主完成任務的 AI Agent。\n\n"
                f"可用工具: {tool_list}\n\n"
                "工作流程:\n"
                "1. 分析任務需求\n"
                "2. 選擇合適的工具\n"
                "3. 執行工具並觀察結果\n"
                "4. 根據結果決定下一步\n"
                "5. 任務完成後，給出最終總結\n\n"
                "注意:\n"
                "- 每次只調用一個工具\n"
                "- 仔細閱讀工具的返回結果\n"
                "- 如果工具調用失敗，嘗試不同的方法\n"
                "- 任務完成時，用文字總結你的工作\n"
            )
            return prompt

        HINT: 系統提示應該告訴 LLM 它的角色和工作方式。
              包含可用工具列表可以幫助 LLM 做出更好的決策。

        Args:
            task: 用戶的任務描述（可用於定制提示）。

        Returns:
            str: 系統提示文字。
        """
        # TODO: 構建系統提示
        raise NotImplementedError("TODO: 構建系統提示")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現，學生不需要修改
    # ------------------------------------------------------------------

    @staticmethod
    def _format_step_for_display(step: AgentStep) -> str:
        """格式化 AgentStep 為終端顯示文字。

        PROVIDED: 學生不需要修改此方法。
        """
        lines: list[str] = []
        lines.append(f"--- Step {step.iteration} ---")

        if step.thought:
            # Truncate long thoughts for display
            thought_preview = step.thought[:200]
            if len(step.thought) > 200:
                thought_preview += "..."
            lines.append(f"  Think: {thought_preview}")

        if step.action:
            lines.append(f"  Act:   {step.action}")

        if step.tool_name:
            input_str = str(step.tool_input or {})
            if len(input_str) > 100:
                input_str = input_str[:100] + "..."
            lines.append(f"  Tool:  {step.tool_name}({input_str})")

        if step.observation:
            obs_preview = step.observation[:200]
            if len(step.observation) > 200:
                obs_preview += "..."
            lines.append(f"  Obs:   {obs_preview}")

        lines.append(f"  Tokens: {step.tokens_used}")
        return "\n".join(lines)

    @staticmethod
    def _summarize_result(steps: list[AgentStep]) -> str:
        """生成步驟列表的摘要文字。

        PROVIDED: 學生不需要修改此方法。
        """
        if not steps:
            return "No steps recorded."

        total_tokens = sum(s.tokens_used for s in steps)
        tools_used = [s.tool_name for s in steps if s.tool_name]
        unique_tools = list(dict.fromkeys(tools_used))  # preserve order

        lines = [
            f"Total steps: {len(steps)}",
            f"Total tokens: {total_tokens:,}",
            f"Tools used: {', '.join(unique_tools) if unique_tools else 'none'}",
        ]
        return "\n".join(lines)
