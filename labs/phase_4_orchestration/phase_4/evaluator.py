"""Lab 2: Evaluator-Optimizer 循環 — LLM 輸出的評分與迭代優化。

本模組實現了 Evaluator-Optimizer 模式，支持：
- 基於評分標準的結構化評估（evaluate）
- 反覆迭代改進的優化循環（optimize）
- 多候選方案投票選擇（vote）
- 自動生成改進建議（_generate_feedback）

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

import json
from typing import Any, Callable

from .types import (
    EvalResult,
    OptimizerConfig,
    Rubric,
    RubricItem,
    ScoreResult,
)


class Evaluator:
    """LLM 輸出的結構化評估與迭代優化器。

    Evaluator 負責：
    1. 用 LLM 依據 Rubric 對代碼/文本評分（evaluate）
    2. 對單項評分項打分（_score_item）
    3. 從評估結果中生成改進建議（_generate_feedback）
    4. 迭代式優化循環：評估 → 反饋 → 重新生成 → 再評估（optimize）
    5. 多候選方案評估與投票選擇最佳方案（vote）

    典型使用流程：
        evaluator = Evaluator(llm_client)
        result = evaluator.evaluate(code, rubric)
        print(f"Score: {result.total_score}/{result.max_possible}")

        # 優化循環
        best_code, history = evaluator.optimize(code, rubric, generator_fn)
    """

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def __init__(
        self,
        llm_client: Any,
        config: OptimizerConfig | None = None,
    ) -> None:
        """初始化 Evaluator。

        Args:
            llm_client: LLM 客戶端實例
            config: 優化器配置

        應初始化以下屬性：
            self.llm_client — LLM 客戶端
            self.config — 配置（默認為 OptimizerConfig()）
        """
        # HINT: 儲存 llm_client, config (默認 OptimizerConfig())
        raise NotImplementedError("TODO: Implement __init__")

    def evaluate(self, code: str, rubric: Rubric) -> EvalResult:
        """使用 Rubric 對代碼進行結構化評估。

        對 Rubric 中的每一項調用 _score_item 進行評分，
        然後計算加權總分。

        Args:
            code: 要評估的代碼或文本
            rubric: 評分標準

        Returns:
            EvalResult: 包含所有評分、總分和反饋
        """
        # HINT: 1. 遍歷 rubric.items，對每項調用 self._score_item(code, item)
        # HINT: 2. 收集所有 ScoreResult 到 scores 列表
        # HINT: 3. 計算加權總分：sum(score.score * item.weight) / sum(item.weight)
        #          乘以 max_score 的歸一化
        # HINT: 4. 計算 max_possible：sum(item.max_score * item.weight)
        #          加權平均最高分
        # HINT: 5. 調用 self._generate_feedback(eval_result) 生成反饋
        # HINT: 6. 構建並返回 EvalResult
        raise NotImplementedError("TODO: Implement evaluate")

    def optimize(
        self,
        code: str,
        rubric: Rubric,
        generator_fn: Callable[[str, str], str],
    ) -> tuple[str, list[EvalResult]]:
        """迭代式優化循環：評估 → 反饋 → 重新生成 → 再評估。

        重複以下步驟直到達到目標分數或超過最大迭代次數：
        1. evaluate(code, rubric) 評估當前版本
        2. _generate_feedback(eval_result) 生成改進建議
        3. generator_fn(code, feedback) 根據建議重新生成代碼
        4. 檢查是否達到目標分數或改進不足

        Args:
            code: 初始代碼或文本
            rubric: 評分標準
            generator_fn: 接受 (current_code, feedback) 返回改進後代碼的函數

        Returns:
            tuple[str, list[EvalResult]]:
                - 最終的最佳代碼
                - 所有迭代的評估結果歷史
        """
        # HINT: 1. 初始化 best_code = code, history = []
        # HINT: 2. for i in range(self.config.max_iterations):
        #          a. eval_result = self.evaluate(best_code, rubric)
        #          b. history.append(eval_result)
        #          c. 計算平均分：total_score / max_possible * max_item_score
        #             或直接用 total_score 與 target_score 比較
        #          d. 如果分數 >= target_score → break
        #          e. 如果 i > 0 且分數改進 < improvement_threshold → break
        #          f. feedback = self._generate_feedback(eval_result)
        #          g. best_code = generator_fn(best_code, feedback)
        # HINT: 3. 返回 (best_code, history)
        raise NotImplementedError("TODO: Implement optimize")

    def _score_item(self, code: str, item: RubricItem) -> ScoreResult:
        """使用 LLM 對單項評分標準打分。

        構建 prompt 讓 LLM 根據 RubricItem 的描述，
        對提供的代碼進行 0 到 max_score 的打分。

        Args:
            code: 要評估的代碼或文本
            item: 評分標準項

        Returns:
            ScoreResult: 包含分數、理由和建議
        """
        # HINT: 1. 構建 prompt，包含：
        #          - 評分項名稱和描述
        #          - 待評估的代碼
        #          - 要求返回 JSON：{"score": N, "reasoning": "...", "suggestions": [...]}
        #          - 說明分數範圍是 0 到 item.max_score
        # HINT: 2. 調用 self.llm_client.create_message() 獲取回應
        # HINT: 3. 解析回應文本中的 JSON
        # HINT: 4. 確保 score 在 0 到 max_score 之間（clamp）
        # HINT: 5. 構建並返回 ScoreResult
        raise NotImplementedError("TODO: Implement _score_item")

    def _generate_feedback(self, eval_result: EvalResult) -> str:
        """從評估結果中生成改進建議。

        將所有低分項的 reasoning 和 suggestions 合併為
        一段結構化的改進指引。

        Args:
            eval_result: 完整的評估結果

        Returns:
            str: 結構化的改進建議文本
        """
        # HINT: 1. 收集所有 ScoreResult
        # HINT: 2. 對於每個得分低於 max_score 的項目：
        #          - 記錄項目名稱、分數
        #          - 包含 reasoning
        #          - 列出 suggestions
        # HINT: 3. 格式化為結構化文本，例如：
        #          "改進建議：\n"
        #          "- [項目名]: 得分 X/Y\n"
        #          "  原因：...\n"
        #          "  建議：...\n"
        # HINT: 4. 如果所有項目都是滿分，返回 "所有項目均已達到最高標準。"
        raise NotImplementedError("TODO: Implement _generate_feedback")

    def vote(
        self,
        candidates: list[str],
        rubric: Rubric,
    ) -> tuple[str, list[EvalResult]]:
        """評估多個候選方案，投票選擇最佳方案。

        對每個候選方案運行 evaluate，選擇總分最高的。

        Args:
            candidates: 候選代碼/文本列表
            rubric: 評分標準

        Returns:
            tuple[str, list[EvalResult]]:
                - 得分最高的候選方案
                - 所有候選方案的評估結果

        Raises:
            ValueError: 當 candidates 為空時
        """
        # HINT: 1. 驗證 candidates 不為空
        # HINT: 2. 對每個 candidate 調用 self.evaluate(candidate, rubric)
        # HINT: 3. 收集所有 EvalResult
        # HINT: 4. 找到 total_score 最高的結果
        # HINT: 5. 返回 (最佳候選方案, 所有評估結果)
        raise NotImplementedError("TODO: Implement vote")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    @staticmethod
    def create_code_quality_rubric() -> Rubric:
        """創建一個代碼質量評分標準。（已實現）

        Returns:
            Rubric: 包含可讀性、錯誤處理、效能、文檔四個評分項
        """
        return Rubric(
            name="Code Quality",
            items=[
                RubricItem(
                    name="Readability",
                    description=(
                        "Code uses clear variable names, consistent formatting, "
                        "and logical structure. Functions are small and focused."
                    ),
                    weight=1.0,
                    max_score=5,
                ),
                RubricItem(
                    name="Error Handling",
                    description=(
                        "Code handles edge cases, validates inputs, "
                        "uses try/except appropriately, and provides meaningful error messages."
                    ),
                    weight=1.5,
                    max_score=5,
                ),
                RubricItem(
                    name="Performance",
                    description=(
                        "Code uses efficient algorithms and data structures. "
                        "Avoids unnecessary computation and memory allocation."
                    ),
                    weight=1.0,
                    max_score=5,
                ),
                RubricItem(
                    name="Documentation",
                    description=(
                        "Functions have docstrings. Complex logic has inline comments. "
                        "Type hints are used consistently."
                    ),
                    weight=0.5,
                    max_score=5,
                ),
            ],
        )

    @staticmethod
    def create_security_rubric() -> Rubric:
        """創建一個安全性評分標準。（已實現）

        Returns:
            Rubric: 包含輸入驗證、注入防護、敏感資料保護三個評分項
        """
        return Rubric(
            name="Security Review",
            items=[
                RubricItem(
                    name="Input Validation",
                    description=(
                        "All user inputs are validated and sanitized. "
                        "File paths are checked for traversal attacks."
                    ),
                    weight=2.0,
                    max_score=5,
                ),
                RubricItem(
                    name="Injection Prevention",
                    description=(
                        "Code prevents command injection, SQL injection, "
                        "and other injection attacks. Uses parameterized queries."
                    ),
                    weight=2.0,
                    max_score=5,
                ),
                RubricItem(
                    name="Sensitive Data Protection",
                    description=(
                        "API keys, passwords, and tokens are not hardcoded. "
                        "Sensitive data is not logged or exposed in error messages."
                    ),
                    weight=1.5,
                    max_score=5,
                ),
            ],
        )
