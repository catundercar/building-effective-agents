"""Phase 4 互動式 CLI — 完成所有 Lab 後可運行的介面。

使用方式:
    python -m phase_4.cli

支持的命令:
    /plan     — 分解一個任務為子任務
    /eval     — 評估一段代碼
    /suite    — 運行評測套件
    /compare  — 比較兩次評測結果
    /help     — 顯示幫助訊息
    /exit     — 退出程式
"""

from __future__ import annotations

import sys

from .evaluator import Evaluator
from .eval_framework import EvalSuite
from .orchestrator import Orchestrator
from .sample_tasks import (
    SAMPLE_CODE_GOOD,
    SAMPLE_CODE_POOR,
    SAMPLE_ORCHESTRATOR_TASKS,
    SAMPLE_RUBRIC_CODE_REVIEW,
)
from .types import (
    EvalConfig,
    OrchestratorConfig,
    OptimizerConfig,
)

# ANSI color codes
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
CYAN = "\033[36m"


def print_banner() -> None:
    """Print startup banner."""
    print(f"\n{BOLD}{BLUE}{'=' * 52}{RESET}")
    print(f"{BOLD}{BLUE}  Phase 4: Orchestration & Evaluation — CLI{RESET}")
    print(f"{BOLD}{BLUE}{'=' * 52}{RESET}")
    print(f"{DIM}輸入命令開始操作，或使用 /help 查看幫助{RESET}\n")


def print_help() -> None:
    """Print available commands."""
    print(f"\n{BOLD}可用命令:{RESET}")
    print(f"  {GREEN}/plan{RESET}     — 分解一個範例任務為子任務")
    print(f"  {GREEN}/eval{RESET}     — 用 Code Quality Rubric 評估範例代碼")
    print(f"  {GREEN}/compare{RESET}  — 比較好代碼與差代碼的評分")
    print(f"  {GREEN}/suite{RESET}    — 運行簡單評測套件")
    print(f"  {GREEN}/help{RESET}     — 顯示此幫助訊息")
    print(f"  {GREEN}/exit{RESET}     — 退出程式\n")


def cmd_plan(orchestrator: Orchestrator) -> None:
    """Run a sample plan decomposition."""
    task_info = SAMPLE_ORCHESTRATOR_TASKS[0]
    print(f"\n{BOLD}{YELLOW}Task: {task_info['name']}{RESET}")
    print(f"{DIM}{task_info['task']}{RESET}\n")

    try:
        plan = orchestrator.plan(task_info["task"], task_info["files"])
        display = Orchestrator._format_plan_for_display(plan)
        print(f"{CYAN}{display}{RESET}\n")
    except NotImplementedError as e:
        print(f"{RED}功能尚未實現: {e}{RESET}\n")
    except Exception as e:
        print(f"{RED}錯誤: {e}{RESET}\n")


def cmd_eval(evaluator: Evaluator) -> None:
    """Evaluate sample code."""
    rubric = Evaluator.create_code_quality_rubric()

    print(f"\n{BOLD}{YELLOW}Evaluating good code sample...{RESET}")
    try:
        result = evaluator.evaluate(SAMPLE_CODE_GOOD, rubric)
        print(f"  {GREEN}Score: {result.total_score:.1f}/{result.max_possible:.1f}{RESET}")
        for score in result.scores:
            print(f"    {score.rubric_item}: {score.score}/5 — {score.reasoning[:60]}...")
        if result.feedback:
            print(f"\n{DIM}Feedback: {result.feedback[:200]}...{RESET}")
    except NotImplementedError as e:
        print(f"{RED}功能尚未實現: {e}{RESET}")
    except Exception as e:
        print(f"{RED}錯誤: {e}{RESET}")
    print()


def cmd_compare(evaluator: Evaluator) -> None:
    """Compare good vs poor code evaluations."""
    rubric = Evaluator.create_code_quality_rubric()

    print(f"\n{BOLD}{YELLOW}Comparing good vs poor code...{RESET}\n")
    try:
        candidates = [SAMPLE_CODE_GOOD, SAMPLE_CODE_POOR]
        best, results = evaluator.vote(candidates, rubric)

        for i, result in enumerate(results):
            label = "Good Code" if i == 0 else "Poor Code"
            color = GREEN if i == 0 else RED
            print(f"  {color}{label}: {result.total_score:.1f}/{result.max_possible:.1f}{RESET}")
            for score in result.scores:
                print(f"    {score.rubric_item}: {score.score}/5")

        winner = "Good Code" if best == SAMPLE_CODE_GOOD else "Poor Code"
        print(f"\n  {BOLD}Winner: {winner}{RESET}")
    except NotImplementedError as e:
        print(f"{RED}功能尚未實現: {e}{RESET}")
    except Exception as e:
        print(f"{RED}錯誤: {e}{RESET}")
    print()


def cmd_suite() -> None:
    """Run the easy eval suite."""
    cases = EvalSuite.create_easy_cases()
    suite = EvalSuite("Easy Cases", cases, EvalConfig(timeout_seconds=10))

    print(f"\n{BOLD}{YELLOW}Running eval suite: Easy Cases ({len(cases)} cases){RESET}\n")

    def mock_agent(task: str) -> str:
        """Simple mock agent for demo purposes."""
        task_lower = task.lower()
        if "hello" in task_lower or "greet" in task_lower:
            return "Hello! How can I help you today?"
        if "2 + 3" in task or "2+3" in task:
            return "5"
        if "BANANA" in task:
            return "BANANA"
        return f"I'll work on: {task}"

    try:
        result = suite.run_all(mock_agent)
        print(f"  Pass rate: {result.pass_rate:.0%}")
        print(f"  Avg duration: {result.avg_duration_ms:.1f}ms")
        for run in result.results:
            status = f"{GREEN}PASS{RESET}" if run.passed else f"{RED}FAIL{RESET}"
            print(f"    [{status}] {run.case_id}: {run.actual_output[:50]}")
    except NotImplementedError as e:
        print(f"{RED}功能尚未實現: {e}{RESET}")
    except Exception as e:
        print(f"{RED}錯誤: {e}{RESET}")
    print()


def main() -> None:
    """Run the interactive CLI."""
    print_banner()

    # Initialize components
    try:
        import anthropic
        client = anthropic.Anthropic()

        # We pass the raw client; students can adapt in their implementation
        orchestrator = Orchestrator(
            llm_client=client,
            tools=[],
            config=OrchestratorConfig(max_subtasks=5),
        )
        evaluator = Evaluator(
            llm_client=client,
            config=OptimizerConfig(max_iterations=3, target_score=4.0),
        )
    except NotImplementedError:
        # Students haven't implemented __init__ yet
        orchestrator = None
        evaluator = None
        print(f"{YELLOW}注意: Orchestrator/Evaluator 尚未實現，部分功能不可用{RESET}\n")
    except Exception as e:
        orchestrator = None
        evaluator = None
        print(f"{YELLOW}注意: 初始化失敗 ({e})，部分功能不可用{RESET}\n")

    # Main loop
    while True:
        try:
            user_input = input(f"{BOLD}{BLUE}phase4>{RESET} ").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\n{DIM}再見！{RESET}")
            break

        if not user_input:
            continue

        cmd = user_input.lower()

        if cmd in ("/exit", "/quit"):
            print(f"{DIM}再見！{RESET}")
            break
        elif cmd == "/help":
            print_help()
        elif cmd == "/plan":
            if orchestrator is None:
                print(f"{RED}Orchestrator 尚未初始化{RESET}\n")
            else:
                cmd_plan(orchestrator)
        elif cmd == "/eval":
            if evaluator is None:
                print(f"{RED}Evaluator 尚未初始化{RESET}\n")
            else:
                cmd_eval(evaluator)
        elif cmd == "/compare":
            if evaluator is None:
                print(f"{RED}Evaluator 尚未初始化{RESET}\n")
            else:
                cmd_compare(evaluator)
        elif cmd == "/suite":
            cmd_suite()
        else:
            print(f"{RED}未知命令: {user_input}{RESET}")
            print_help()


if __name__ == "__main__":
    main()
