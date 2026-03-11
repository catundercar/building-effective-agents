"""Lab 1: Prompt Chaining 引擎 — 串行 LLM 調用與 Gate 檢查。

本模組實現了 Prompt Chaining 模式，包括：
- 串行步驟執行（每步輸出作為下步輸入）
- Gate 檢查（中間結果的程序化驗證）
- 失敗重試（帶錯誤上下文的重試機制）
- 執行追蹤（記錄每步的輸入/輸出）

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

import time
from typing import Any

from .types import ChainConfig, ChainResult, ChainStep, LLMCall


class ChainRunner:
    """Prompt Chain 執行引擎。

    將一系列 ChainStep 串行執行，每步調用 LLM 生成結果，
    並可選擇性地通過 gate 函數驗證結果品質。

    使用範例::

        runner = ChainRunner(llm_client=my_client)
        steps = create_code_review_chain()
        result = runner.run_chain(steps, initial_input="def add(a, b): return a - b")
        print(result.final_output)
    """

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def __init__(
        self,
        llm_client: Any,
        config: ChainConfig | None = None,
    ) -> None:
        """初始化 ChainRunner。

        設置 LLM 客戶端和執行配置。需要保存這些參數供後續方法使用。

        Args:
            llm_client: LLM 客戶端實例，需要有 create_message(messages, options) 方法
            config: 可選的 Chain 配置（重試次數、超時等）
        """
        # HINT: 1. 將 llm_client 保存為 self.llm_client
        # HINT: 2. 如果 config 為 None，使用 ChainConfig() 預設值
        # HINT: 3. 將 config 保存為 self.config
        raise NotImplementedError("TODO: Implement __init__")

    def run_step(self, step: ChainStep, input_data: str) -> str:
        """執行單一 Chain 步驟。

        使用 format_prompt 將 input_data 填入 step 的 prompt_template，
        調用 LLM 獲得輸出，然後執行 gate 檢查。如果 gate 失敗，
        使用 _retry_step 進行重試。

        Args:
            step: 要執行的 ChainStep
            input_data: 本步驟的輸入資料

        Returns:
            str: LLM 的輸出文字（如果有 transform，則返回轉換後的結果）

        Raises:
            RuntimeError: 當 LLM 調用失敗且重試耗盡時
        """
        # HINT: 1. 使用 format_prompt(step.prompt_template, input_data) 生成最終 prompt
        # HINT: 2. 構建 messages 列表: [{"role": "user", "content": prompt}]
        #          注意：如果 llm_client 需要 Message 物件，則使用字典格式也可
        # HINT: 3. 調用 self.llm_client.create_message(messages) 獲取回應
        # HINT: 4. 從回應中提取文字內容（response.content[0].text 或類似方式）
        # HINT: 5. 如果 step.gate 存在，調用 self._apply_gate(step, output)
        # HINT: 6. 如果 gate 未通過，調用 self._retry_step(step, input_data, reason)
        # HINT: 7. 如果 step.transform 存在，對輸出調用 transform
        # HINT: 8. 返回最終輸出
        raise NotImplementedError("TODO: Implement run_step")

    def run_chain(
        self,
        steps: list[ChainStep],
        initial_input: str,
    ) -> ChainResult:
        """執行完整的 Prompt Chain。

        按順序執行所有步驟，每步的輸出作為下一步的輸入。
        記錄完整的執行追蹤（每步的名稱、輸入、輸出、耗時）。

        Args:
            steps: ChainStep 列表，按順序執行
            initial_input: 第一步的初始輸入

        Returns:
            ChainResult: 包含完成步驟數、最終輸出、追蹤記錄等資訊
        """
        # HINT: 1. 初始化 trace 列表（記錄每步執行資訊）
        # HINT: 2. 設定 current_input = initial_input
        # HINT: 3. 用 for 循環遍歷 steps:
        #    a. 記錄開始時間 (time.time())
        #    b. 用 try/except 調用 self.run_step(step, current_input)
        #    c. 記錄結束時間，計算耗時
        #    d. 將步驟資訊加入 trace: {"name": ..., "input": ..., "output": ..., "duration_ms": ...}
        #    e. 成功時: current_input = output（用於下一步）
        #    f. 失敗時: 返回 ChainResult(success=False, error=str(e), ...)
        # HINT: 4. 全部成功後返回 ChainResult(success=True, final_output=current_input, ...)
        raise NotImplementedError("TODO: Implement run_chain")

    def _apply_gate(self, step: ChainStep, output: str) -> tuple[bool, str]:
        """執行步驟的 Gate 檢查。

        Gate 是一個可選的品質驗證函數。如果步驟定義了 gate，
        調用它檢查 LLM 的輸出是否符合預期。

        Args:
            step: 包含 gate 函數的 ChainStep
            output: LLM 生成的輸出文字

        Returns:
            tuple[bool, str]: (是否通過, 原因說明)
                - 如果沒有 gate 函數，返回 (True, "no gate")
                - 如果有 gate，返回 gate 函數的結果
        """
        # HINT: 1. 如果 step.gate 為 None，返回 (True, "no gate")
        # HINT: 2. 否則，調用 step.gate(output) 並返回結果
        # HINT: 3. 用 try/except 包裝，gate 本身出錯時返回 (False, str(error))
        raise NotImplementedError("TODO: Implement _apply_gate")

    def _retry_step(self, step: ChainStep, input_data: str, error: str) -> str:
        """重試失敗的步驟。

        當 gate 檢查失敗時，使用帶有錯誤上下文的增強 prompt 重試。
        最多重試 config.max_retries_per_step 次。

        Args:
            step: 要重試的 ChainStep
            input_data: 原始輸入資料
            error: 上一次失敗的原因

        Returns:
            str: 重試成功後的輸出

        Raises:
            RuntimeError: 當所有重試都失敗時
        """
        # HINT: 1. 用 for 循環重試 self.config.max_retries_per_step 次
        # HINT: 2. 構建增強 prompt，包含原始 prompt + 錯誤上下文:
        #          retry_prompt = format_prompt(step.prompt_template, input_data)
        #          retry_prompt += f"\n\n[RETRY] Previous attempt failed: {error}\nPlease fix the issue and try again."
        # HINT: 3. 調用 LLM 獲取新輸出
        # HINT: 4. 如果 step.gate 存在，再次檢查 gate
        # HINT: 5. 如果通過，應用 transform（如果有）並返回
        # HINT: 6. 如果仍未通過，更新 error 繼續重試
        # HINT: 7. 所有重試失敗後，raise RuntimeError(f"Step '{step.name}' failed after retries: {error}")
        raise NotImplementedError("TODO: Implement _retry_step")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    @staticmethod
    def format_prompt(template: str, data: str) -> str:
        """將輸入資料填入 prompt 模板。（已實現）

        使用 {input} 佔位符進行替換。如果模板中沒有 {input}，
        則將資料附加到模板末尾。

        Args:
            template: 包含 {input} 佔位符的 prompt 模板
            data: 要填入的資料

        Returns:
            str: 替換完成的 prompt
        """
        if "{input}" in template:
            return template.replace("{input}", data)
        return f"{template}\n\n{data}"

    @staticmethod
    def create_code_review_chain() -> list[ChainStep]:
        """建立一個 Code Review 示範 Chain。（已實現）

        這條 Chain 包含四步：
        1. 分析代碼結構
        2. 檢查分析結果格式（gate）
        3. 生成改進建議
        4. 彙整最終報告

        Returns:
            list[ChainStep]: 四步組成的 Chain
        """

        def analysis_gate(output: str) -> tuple[bool, str]:
            """檢查分析結果是否包含必要的部分。"""
            required_sections = ["function", "issue", "suggestion"]
            output_lower = output.lower()
            missing = [s for s in required_sections if s not in output_lower]
            if missing:
                return False, f"Analysis missing sections: {', '.join(missing)}"
            return True, "Analysis format OK"

        return [
            ChainStep(
                name="analyze_code",
                prompt_template=(
                    "Analyze the following code. Identify the main function, "
                    "any issues, and potential suggestions for improvement.\n\n"
                    "Code:\n{input}\n\n"
                    "Provide your analysis with sections: Function, Issue, Suggestion."
                ),
            ),
            ChainStep(
                name="validate_analysis",
                prompt_template=(
                    "Review this code analysis and ensure it is complete "
                    "and well-structured:\n\n{input}"
                ),
                gate=analysis_gate,
            ),
            ChainStep(
                name="generate_fixes",
                prompt_template=(
                    "Based on this analysis, generate specific code fixes:\n\n{input}\n\n"
                    "Provide the corrected code with explanations."
                ),
            ),
            ChainStep(
                name="final_report",
                prompt_template=(
                    "Create a concise code review report from this information:\n\n{input}\n\n"
                    "Format: Summary, Issues Found, Fixes Applied, Confidence Level."
                ),
                transform=lambda output: f"=== Code Review Report ===\n{output}",
            ),
        ]
