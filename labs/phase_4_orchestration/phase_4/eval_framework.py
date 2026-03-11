"""Lab 3: Eval 體系建設 — 系統性 Agent 能力測試框架。

本模組實現了 Eval（評測）框架，支持：
- 定義評測用例（EvalCase + validator）
- 運行單個評測用例（run_case）
- 運行整個評測套件（run_all）
- 結果驗證（_validate_output）
- 跨版本結果比較（compare）

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

import time
from typing import Any, Callable

from .types import (
    EvalCase,
    EvalConfig,
    EvalRunResult,
    EvalSuiteResult,
)


class EvalSuite:
    """Agent 評測套件。

    EvalSuite 負責：
    1. 管理一組評測用例（cases）
    2. 運行單個或全部用例（run_case / run_all）
    3. 驗證 agent 輸出（_validate_output）
    4. 比較不同版本的結果（compare）

    典型使用流程：
        suite = EvalSuite("basic", create_easy_cases())
        result = suite.run_all(my_agent_fn)
        print(f"Pass rate: {result.pass_rate:.1%}")

        # 比較兩個版本
        baseline = suite.run_all(old_agent_fn)
        current = suite.run_all(new_agent_fn)
        print(suite.compare(baseline, current))
    """

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def __init__(
        self,
        name: str,
        cases: list[EvalCase],
        config: EvalConfig | None = None,
    ) -> None:
        """初始化評測套件。

        Args:
            name: 套件名稱
            cases: 評測用例列表
            config: 評測配置

        應初始化以下屬性：
            self.name — 套件名稱
            self.cases — 用例列表
            self.config — 配置（默認為 EvalConfig()）
        """
        # HINT: 儲存 name, cases, config (默認 EvalConfig())
        raise NotImplementedError("TODO: Implement __init__")

    def run_case(
        self,
        case: EvalCase,
        agent_fn: Callable[[str], str],
    ) -> EvalRunResult:
        """運行單個評測用例。

        調用 agent_fn 處理用例任務，測量時間和 token 消耗，
        並用 validator 驗證輸出。

        Args:
            case: 評測用例
            agent_fn: agent 函數，接受任務描述字符串，返回輸出字符串

        Returns:
            EvalRunResult: 包含通過/失敗、輸出、時間和錯誤信息
        """
        # HINT: 1. 記錄開始時間 start_time = time.time()
        # HINT: 2. 使用 try/except 包裝 agent_fn 調用：
        #          a. output = agent_fn(case.task)
        #          b. 記錄結束時間，計算 duration_ms
        #          c. 調用 self._validate_output(case, output) 驗證
        #          d. 構建 EvalRunResult(passed=..., actual_output=output, ...)
        # HINT: 3. 如果出錯（Exception）：
        #          a. 記錄 error 訊息
        #          b. 返回 EvalRunResult(passed=False, error=str(e), ...)
        # HINT: 4. tokens_used 可設為 len(output) // 4 作為估算
        raise NotImplementedError("TODO: Implement run_case")

    def run_all(
        self,
        agent_fn: Callable[[str], str],
    ) -> EvalSuiteResult:
        """運行套件中所有評測用例。

        依序運行每個用例，收集結果並計算聚合指標。

        Args:
            agent_fn: agent 函數

        Returns:
            EvalSuiteResult: 包含所有結果、通過率和平均消耗
        """
        # HINT: 1. 遍歷 self.cases，對每個 case 調用 self.run_case(case, agent_fn)
        # HINT: 2. 收集所有 EvalRunResult
        # HINT: 3. 計算 pass_rate = 通過數 / 總數（注意除零）
        # HINT: 4. 計算 avg_tokens = 總 tokens / 用例數
        # HINT: 5. 計算 avg_duration_ms = 總時間 / 用例數
        # HINT: 6. 構建並返回 EvalSuiteResult
        raise NotImplementedError("TODO: Implement run_all")

    def _validate_output(
        self,
        case: EvalCase,
        output: str,
    ) -> bool:
        """使用用例的 validator 驗證 agent 輸出。

        Args:
            case: 評測用例（包含 validator 函數）
            output: agent 的輸出

        Returns:
            bool: 驗證是否通過
        """
        # HINT: 1. 調用 case.validator(output) 進行驗證
        # HINT: 2. 使用 try/except 包裝，驗證函數出錯時返回 False
        # HINT: 3. 返回驗證結果
        raise NotImplementedError("TODO: Implement _validate_output")

    def compare(
        self,
        baseline: EvalSuiteResult,
        current: EvalSuiteResult,
    ) -> str:
        """比較兩次評測結果，生成對比報告。

        Args:
            baseline: 基線結果（舊版本）
            current: 當前結果（新版本）

        Returns:
            str: 格式化的對比報告，包含：
                - 通過率變化
                - 每個用例的狀態變化
                - 新出現的回歸（regression）
                - 改進的用例
        """
        # HINT: 1. 計算通過率差異：current.pass_rate - baseline.pass_rate
        # HINT: 2. 建立 baseline 和 current 的 case_id → passed 映射
        # HINT: 3. 找出回歸用例（baseline passed → current failed）
        # HINT: 4. 找出改進用例（baseline failed → current passed）
        # HINT: 5. 生成格式化報告，包含：
        #          "=== Eval Comparison ===\n"
        #          "Pass Rate: X% → Y% (±Z%)\n"
        #          "Regressions: ...\n"
        #          "Improvements: ...\n"
        raise NotImplementedError("TODO: Implement compare")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    @staticmethod
    def create_easy_cases() -> list[EvalCase]:
        """創建簡單難度的評測用例。（已實現）

        Returns:
            list[EvalCase]: 3 個簡單評測用例
        """
        return [
            EvalCase(
                id="easy_001",
                name="Simple Greeting",
                task="Say hello to the user in a friendly way.",
                expected_behavior="A friendly greeting message",
                validator=lambda output: len(output) > 0 and any(
                    word in output.lower() for word in ["hello", "hi", "hey", "greetings"]
                ),
                difficulty="easy",
            ),
            EvalCase(
                id="easy_002",
                name="Simple Math",
                task="What is 2 + 3? Reply with just the number.",
                expected_behavior="The number 5",
                validator=lambda output: "5" in output,
                difficulty="easy",
            ),
            EvalCase(
                id="easy_003",
                name="Echo Task",
                task="Repeat the following word exactly: BANANA",
                expected_behavior="The word BANANA",
                validator=lambda output: "BANANA" in output,
                difficulty="easy",
            ),
        ]

    @staticmethod
    def create_medium_cases() -> list[EvalCase]:
        """創建中等難度的評測用例。（已實現）

        Returns:
            list[EvalCase]: 3 個中等評測用例
        """
        return [
            EvalCase(
                id="med_001",
                name="List Generation",
                task="List 3 programming languages that are statically typed.",
                expected_behavior="A list containing languages like Java, C++, Go, Rust, TypeScript",
                validator=lambda output: sum(
                    1 for lang in ["java", "c++", "go", "rust", "typescript", "c#", "kotlin", "swift", "scala", "haskell"]
                    if lang in output.lower()
                ) >= 2,
                difficulty="medium",
            ),
            EvalCase(
                id="med_002",
                name="Code Explanation",
                task="Explain what a Python list comprehension is in one sentence.",
                expected_behavior="A concise explanation of list comprehensions",
                validator=lambda output: (
                    "list" in output.lower()
                    and len(output) > 20
                    and len(output) < 500
                ),
                difficulty="medium",
            ),
            EvalCase(
                id="med_003",
                name="Error Identification",
                task="What is wrong with this Python code: print('hello'",
                expected_behavior="Identifies the missing closing parenthesis",
                validator=lambda output: any(
                    word in output.lower()
                    for word in ["parenthesis", "paren", "bracket", "closing", "syntax"]
                ),
                difficulty="medium",
            ),
        ]

    @staticmethod
    def create_hard_cases() -> list[EvalCase]:
        """創建困難難度的評測用例。（已實現）

        Returns:
            list[EvalCase]: 3 個困難評測用例
        """
        return [
            EvalCase(
                id="hard_001",
                name="Algorithm Design",
                task=(
                    "Write a Python function that checks if a string has balanced "
                    "parentheses. Include the function signature and implementation."
                ),
                expected_behavior="A working function with stack-based approach",
                validator=lambda output: (
                    "def " in output
                    and ("stack" in output.lower() or "(" in output)
                    and "return" in output
                ),
                difficulty="hard",
            ),
            EvalCase(
                id="hard_002",
                name="Architecture Analysis",
                task=(
                    "Describe the key differences between microservices and "
                    "monolithic architecture. List at least 3 differences."
                ),
                expected_behavior="A structured comparison with multiple points",
                validator=lambda output: (
                    len(output) > 100
                    and sum(1 for keyword in [
                        "deploy", "scale", "service", "database",
                        "team", "independent", "complex", "communicate",
                    ] if keyword in output.lower()) >= 3
                ),
                difficulty="hard",
            ),
            EvalCase(
                id="hard_003",
                name="Debugging Challenge",
                task=(
                    "This Python code has a bug. Find and fix it:\n"
                    "def fibonacci(n):\n"
                    "    if n <= 0:\n"
                    "        return 0\n"
                    "    if n == 1:\n"
                    "        return 1\n"
                    "    return fibonacci(n) + fibonacci(n-1)\n"
                ),
                expected_behavior="Identifies the recursive call should be fibonacci(n-1) + fibonacci(n-2)",
                validator=lambda output: (
                    ("n-1" in output or "n - 1" in output)
                    and ("n-2" in output or "n - 2" in output)
                ),
                difficulty="hard",
            ),
        ]
