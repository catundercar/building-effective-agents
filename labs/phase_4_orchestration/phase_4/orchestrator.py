"""Lab 1: Orchestrator-Workers 模式 — 多 Agent 任務分解與協調。

本模組實現了 Orchestrator-Workers 模式，支持：
- 任務分析與分解（plan）
- 多 worker agent 執行子任務（execute_plan）
- 結果合併與衝突檢測（_merge_results）
- 全局驗證（_validate）

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

import json
import time
from typing import Any, Callable

from .types import (
    OrchestratorConfig,
    OrchestratorPlan,
    OrchestratorResult,
    SubTask,
    WorkerResult,
)


class Orchestrator:
    """Orchestrator-Workers 模式的核心控制器。

    Orchestrator 負責：
    1. 分析任務並分解為子任務（plan）
    2. 依照依賴關係調度 worker 執行子任務（execute_plan）
    3. 合併 worker 結果並檢測衝突（_merge_results）
    4. 運行全局驗證確認整體一致性（_validate）

    典型使用流程：
        orchestrator = Orchestrator(llm_client, tools, config)
        plan = orchestrator.plan("重構 auth 模塊", ["auth.py", "utils.py"])
        result = orchestrator.execute_plan(plan)
        if result.success:
            print("任務完成！")
    """

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def __init__(
        self,
        llm_client: Any,
        tools: list[Any] | None = None,
        config: OrchestratorConfig | None = None,
    ) -> None:
        """初始化 Orchestrator。

        Args:
            llm_client: LLM 客戶端實例（Phase 0 的 LLMClient 或相容介面）
            tools: 可用工具列表，提供給每個 worker agent 使用
            config: 編排器配置

        應初始化以下屬性：
            self.llm_client — LLM 客戶端
            self.tools — 工具列表（默認為空列表）
            self.config — 配置（默認為 OrchestratorConfig()）
        """
        # HINT: 儲存 llm_client, tools (默認空列表), config (默認 OrchestratorConfig())
        raise NotImplementedError("TODO: Implement __init__")

    def plan(self, task: str, file_list: list[str]) -> OrchestratorPlan:
        """分析任務並分解為可執行的子任務。

        使用 LLM 分析任務描述和相關文件，生成一個包含多個子任務的執行計劃。
        每個子任務有明確的描述、目標文件和依賴關係。

        Args:
            task: 任務描述，例如 "重構 auth 模塊並添加測試"
            file_list: 相關文件路徑列表

        Returns:
            OrchestratorPlan: 包含子任務的執行計劃

        Raises:
            ValueError: 當任務描述為空時

        注意：
            - 子任務數量不應超過 self.config.max_subtasks
            - 每個子任務的 id 應唯一
            - 依賴關係引用的 id 必須存在於計劃中
        """
        # HINT: 1. 驗證 task 不為空
        # HINT: 2. 構建 prompt，要求 LLM 將任務分解為子任務
        #          包含：task 描述、file_list、max_subtasks 限制
        # HINT: 3. 要求 LLM 返回 JSON 格式：
        #          [{"id": "...", "description": "...",
        #            "target_files": [...], "dependencies": [...]}]
        # HINT: 4. 調用 self.llm_client.create_message() 獲取回應
        # HINT: 5. 解析 JSON，為每個項創建 SubTask
        # HINT: 6. 確保子任務數量不超過 max_subtasks
        # HINT: 7. 創建並返回 OrchestratorPlan
        raise NotImplementedError("TODO: Implement plan")

    def execute_plan(self, plan: OrchestratorPlan) -> OrchestratorResult:
        """按照計劃執行所有子任務。

        依照子任務的依賴關係順序執行，每個子任務由 _run_worker 處理。
        執行完畢後合併結果並運行全局驗證。

        Args:
            plan: 由 plan() 方法生成的執行計劃

        Returns:
            OrchestratorResult: 包含所有 worker 結果、衝突和驗證狀態

        流程：
            1. 使用 _resolve_dependencies 確定執行順序
            2. 依序執行每個子任務（調用 _run_worker）
            3. 更新子任務狀態
            4. 合併結果（_merge_results）
            5. 運行全局驗證（_validate）
            6. 組裝並返回最終結果
        """
        # HINT: 1. 調用 _resolve_dependencies(plan.subtasks) 獲取執行順序
        # HINT: 2. 遍歷排序後的子任務：
        #          a. 檢查依賴的子任務是否都已 completed，否則標記 failed
        #          b. 設置 subtask.status = "running"
        #          c. result = self._run_worker(subtask)
        #          d. 根據 result.success 設置 status 為 "completed" 或 "failed"
        #          e. 收集 worker_results
        # HINT: 3. 調用 self._merge_results(worker_results) 獲取衝突
        # HINT: 4. 調用 self._validate(worker_results) 獲取驗證結果
        # HINT: 5. 構建並返回 OrchestratorResult
        raise NotImplementedError("TODO: Implement execute_plan")

    def _run_worker(self, subtask: SubTask) -> WorkerResult:
        """運行單個 worker agent 執行子任務。

        為子任務創建一個獨立的 agent 循環，使用 LLM 和工具
        完成子任務描述的工作。

        Args:
            subtask: 要執行的子任務

        Returns:
            WorkerResult: worker 的執行結果
        """
        # HINT: 1. 構建 worker 的 system prompt，包含子任務描述和目標文件
        # HINT: 2. 構建初始 messages，包含任務指令
        # HINT: 3. 運行 agent 循環（最多 self.config.max_worker_iterations 次）：
        #          a. 調用 self.llm_client.create_message(messages, ...)
        #          b. 如果 stop_reason == "end_turn"：收集結果，break
        #          c. 如果 stop_reason == "tool_use"：執行工具，追加結果
        #          d. 累計 tokens_used
        # HINT: 4. 返回 WorkerResult，包含成功狀態、輸出、修改文件和 token 消耗
        # HINT: 5. 使用 try/except 包裝，出錯時返回 success=False 的 WorkerResult
        raise NotImplementedError("TODO: Implement _run_worker")

    def _merge_results(
        self, results: list[WorkerResult]
    ) -> tuple[list[str], list[str]]:
        """合併所有 worker 的結果，檢測文件衝突。

        檢查是否有多個 worker 修改了同一個文件。
        如果有，記錄為衝突。

        Args:
            results: 所有 worker 的執行結果列表

        Returns:
            tuple[list[str], list[str]]:
                - 第一個列表：所有修改過的文件（去重）
                - 第二個列表：衝突描述（例如 "File auth.py modified by subtask_1 and subtask_2"）
        """
        # HINT: 1. 建立一個 dict[str, list[str]]，key 是文件路徑，
        #          value 是修改該文件的 subtask_id 列表
        # HINT: 2. 遍歷 results，記錄每個 worker 修改的文件
        # HINT: 3. 找出被多個 worker 修改的文件，生成衝突描述
        # HINT: 4. 返回 (所有修改文件列表, 衝突列表)
        raise NotImplementedError("TODO: Implement _merge_results")

    def _validate(self, results: list[WorkerResult]) -> bool:
        """運行全局驗證，確認結果的整體一致性。

        檢查所有 worker 是否都成功完成，可擴展為
        運行編譯、測試等驗證步驟。

        Args:
            results: 所有 worker 的執行結果列表

        Returns:
            bool: 所有 worker 都成功則返回 True
        """
        # HINT: 1. 檢查 results 是否為空，空列表返回 False
        # HINT: 2. 檢查所有 result.success 是否都為 True
        # HINT: 3. 返回驗證結果
        raise NotImplementedError("TODO: Implement _validate")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    @staticmethod
    def _format_plan_for_display(plan: OrchestratorPlan) -> str:
        """將計劃格式化為可讀的字符串。（已實現）

        Args:
            plan: 執行計劃

        Returns:
            str: 格式化後的計劃描述
        """
        lines = [
            f"Task: {plan.task_description}",
            f"Subtasks ({len(plan.subtasks)}):",
        ]
        for i, st in enumerate(plan.subtasks, 1):
            deps = f" (depends on: {', '.join(st.dependencies)})" if st.dependencies else ""
            files = f" [{', '.join(st.target_files)}]" if st.target_files else ""
            lines.append(f"  {i}. [{st.id}] {st.description}{files}{deps}")
        return "\n".join(lines)

    @staticmethod
    def _resolve_dependencies(subtasks: list[SubTask]) -> list[SubTask]:
        """根據依賴關係對子任務進行拓撲排序。（已實現）

        使用 Kahn's algorithm 確保依賴的子任務先執行。
        如果存在循環依賴，按原始順序返回剩餘任務。

        Args:
            subtasks: 子任務列表

        Returns:
            list[SubTask]: 按依賴關係排序後的子任務列表
        """
        if not subtasks:
            return []

        # Build adjacency and in-degree
        task_map: dict[str, SubTask] = {st.id: st for st in subtasks}
        in_degree: dict[str, int] = {st.id: 0 for st in subtasks}

        for st in subtasks:
            for dep_id in st.dependencies:
                if dep_id in task_map:
                    in_degree[st.id] = in_degree.get(st.id, 0) + 1

        # Kahn's algorithm
        queue: list[str] = [tid for tid, deg in in_degree.items() if deg == 0]
        sorted_ids: list[str] = []

        while queue:
            current = queue.pop(0)
            sorted_ids.append(current)
            for st in subtasks:
                if current in st.dependencies:
                    in_degree[st.id] -= 1
                    if in_degree[st.id] == 0:
                        queue.append(st.id)

        # If cycle detected, append remaining tasks in original order
        if len(sorted_ids) < len(subtasks):
            remaining = [st.id for st in subtasks if st.id not in sorted_ids]
            sorted_ids.extend(remaining)

        return [task_map[tid] for tid in sorted_ids]
