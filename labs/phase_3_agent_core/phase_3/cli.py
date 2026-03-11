"""Phase 3 互動式 CLI — 完成所有 Lab 後可運行的 Agent 介面。

使用方式:
    python -m phase_3.cli

支持的命令:
    /tools   — 列出所有已註冊的工具
    /trace   — 顯示上一次任務的推理追蹤
    /config  — 顯示 Agent 配置
    /clear   — 重置 Agent 狀態
    /exit    — 退出程式
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from .agent_loop import AgentLoop
from .error_recovery import ErrorRecovery
from .permissions import PermissionManager, create_default_rules
from .sample_tasks import ALL_SAMPLE_TASKS
from .types import (
    AgentConfig,
    AgentResult,
    PermissionConfig,
    PermissionRequest,
    RecoveryConfig,
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
PURPLE = "\033[35m"

SYSTEM_PROMPT = (
    "你是一個能夠自主完成任務的 AI Agent。"
    "你可以使用提供的工具來幫助用戶完成任務。"
    "請用繁體中文回答，除非用戶使用其他語言。"
)


# ---------------------------------------------------------------------------
# Mock tools for CLI demo
# ---------------------------------------------------------------------------

def _mock_read_file(input_data: dict[str, Any]) -> str:
    """Mock read_file tool for demo."""
    path = input_data.get("path", "")
    p = Path(path)
    if p.exists() and p.is_file():
        try:
            content = p.read_text(encoding="utf-8")
            if len(content) > 5000:
                content = content[:5000] + f"\n... (truncated, total {len(content)} chars)"
            return json.dumps({"path": path, "content": content}, ensure_ascii=False)
        except Exception as e:
            return json.dumps({"error": str(e)}, ensure_ascii=False)
    return json.dumps({"error": f"File not found: {path}"}, ensure_ascii=False)


def _mock_list_files(input_data: dict[str, Any]) -> str:
    """Mock list_files tool for demo."""
    directory = input_data.get("directory", ".")
    pattern = input_data.get("pattern", "*")
    p = Path(directory)
    if not p.exists():
        return json.dumps({"error": f"Directory not found: {directory}"}, ensure_ascii=False)
    files = sorted(str(f) for f in p.glob(pattern) if f.is_file())[:50]
    return json.dumps({"directory": directory, "files": files}, ensure_ascii=False)


def _mock_calculator(input_data: dict[str, Any]) -> str:
    """Mock calculator tool for demo."""
    expression = input_data.get("expression", "")
    try:
        allowed_names = {"__builtins__": {}}
        code = compile(expression, "<calculator>", "eval")
        result = eval(code, allowed_names)  # noqa: S307
        return json.dumps({"expression": expression, "result": result}, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)}, ensure_ascii=False)


DEMO_TOOLS: dict[str, Any] = {
    "read_file": _mock_read_file,
    "list_files": _mock_list_files,
    "calculator": _mock_calculator,
}


# ---------------------------------------------------------------------------
# CLI functions
# ---------------------------------------------------------------------------

def print_banner() -> None:
    """Print startup banner."""
    print(f"\n{BOLD}{PURPLE}{'=' * 50}{RESET}")
    print(f"{BOLD}{PURPLE}   Phase 3: Agentic Loop — Interactive CLI{RESET}")
    print(f"{BOLD}{PURPLE}{'=' * 50}{RESET}")
    print(f"{DIM}輸入任務讓 Agent 自主完成，或使用 /help 查看命令{RESET}\n")


def print_help() -> None:
    """Print available commands."""
    print(f"\n{BOLD}可用命令:{RESET}")
    print(f"  {GREEN}/tasks{RESET}   — 列出示範任務")
    print(f"  {GREEN}/run N{RESET}   — 運行第 N 個示範任務")
    print(f"  {GREEN}/tools{RESET}   — 列出可用工具")
    print(f"  {GREEN}/trace{RESET}   — 顯示上次任務的推理追蹤")
    print(f"  {GREEN}/config{RESET}  — 顯示 Agent 配置")
    print(f"  {GREEN}/help{RESET}    — 顯示此幫助訊息")
    print(f"  {GREEN}/exit{RESET}    — 退出程式\n")


def print_tasks() -> None:
    """Print sample tasks."""
    print(f"\n{BOLD}示範任務:{RESET}")
    for i, task in enumerate(ALL_SAMPLE_TASKS, 1):
        print(f"  {YELLOW}{i}.{RESET} {task.name}")
        desc_preview = task.description[:80].replace("\n", " ")
        print(f"     {DIM}{desc_preview}...{RESET}")
    print(f"\n{DIM}使用 /run N 運行第 N 個任務{RESET}\n")


def print_tools() -> None:
    """Print available tools."""
    print(f"\n{BOLD}可用工具 ({len(DEMO_TOOLS)}):{RESET}")
    for name in DEMO_TOOLS:
        print(f"  {YELLOW}{name}{RESET}")
    print()


def print_result(result: AgentResult) -> None:
    """Print agent result."""
    status_color = GREEN if result.success else RED
    status_text = "SUCCESS" if result.success else "FAILED"

    print(f"\n{BOLD}{status_color}--- Result: {status_text} ---{RESET}")
    print(f"  Iterations: {result.iterations}")
    print(f"  Tokens:     {result.total_tokens:,}")

    if result.error:
        print(f"  Error:      {RED}{result.error}{RESET}")

    print(f"\n{BOLD}Output:{RESET}")
    print(f"  {result.final_output[:500]}")
    print()


def print_trace(result: AgentResult | None) -> None:
    """Print trace from last result."""
    if result is None:
        print(f"{DIM}尚未運行任何任務{RESET}\n")
        return

    print(f"\n{BOLD}推理追蹤 ({len(result.trace)} steps):{RESET}")
    for step in result.trace:
        print(f"\n  {PURPLE}Step {step.iteration}:{RESET}")
        if step.thought:
            thought = step.thought[:150]
            if len(step.thought) > 150:
                thought += "..."
            print(f"    {BLUE}Think:{RESET} {thought}")
        if step.action:
            print(f"    {YELLOW}Act:{RESET}   {step.action}")
        if step.observation:
            obs = step.observation[:150]
            if len(step.observation) > 150:
                obs += "..."
            print(f"    {GREEN}Obs:{RESET}   {obs}")
        print(f"    {DIM}Tokens: {step.tokens_used}{RESET}")
    print()


def user_confirm(description: str) -> bool:
    """Prompt user for confirmation."""
    print(f"\n{YELLOW}{description}{RESET}")
    try:
        answer = input(f"{BOLD}Allow? (y/n): {RESET}").strip().lower()
        return answer in ("y", "yes")
    except (EOFError, KeyboardInterrupt):
        return False


def main() -> None:
    """Run the interactive CLI."""
    print_banner()

    # Initialize components
    config = AgentConfig(max_iterations=10, max_tokens_budget=50_000)
    permission_config = PermissionConfig(rules=create_default_rules())
    recovery_config = RecoveryConfig()

    try:
        # Try to create a real LLM client
        from phase_0.client import LLMClient
        llm_client = LLMClient()
        print(f"{GREEN}LLM 客戶端已初始化{RESET}")
    except Exception:
        print(f"{YELLOW}無法初始化 LLM 客戶端 — 使用 mock 模式{RESET}")
        print(f"{DIM}請確保已完成 Phase 0 並設置 ANTHROPIC_API_KEY{RESET}")
        llm_client = None

    permission_mgr = PermissionManager(
        config=permission_config,
        user_input_fn=user_confirm,
    )
    error_recovery = ErrorRecovery(config=recovery_config)

    last_result: AgentResult | None = None

    print(f"{DIM}已載入 {len(DEMO_TOOLS)} 個工具: {', '.join(DEMO_TOOLS.keys())}{RESET}\n")

    # Main loop
    while True:
        try:
            user_input = input(f"{BOLD}{GREEN}Task> {RESET}").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\n{DIM}再見！{RESET}")
            break

        if not user_input:
            continue

        # Handle commands
        if user_input.startswith("/"):
            cmd = user_input.lower().split()
            if cmd[0] in ("/exit", "/quit"):
                print(f"{DIM}再見！{RESET}")
                break
            elif cmd[0] == "/help":
                print_help()
            elif cmd[0] == "/tasks":
                print_tasks()
            elif cmd[0] == "/tools":
                print_tools()
            elif cmd[0] == "/trace":
                print_trace(last_result)
            elif cmd[0] == "/config":
                print(f"\n{BOLD}Agent Config:{RESET}")
                print(f"  Max iterations:  {config.max_iterations}")
                print(f"  Token budget:    {config.max_tokens_budget:,}")
                print(f"  Model:           {config.model}\n")
            elif cmd[0] == "/run" and len(cmd) > 1:
                try:
                    task_idx = int(cmd[1]) - 1
                    if 0 <= task_idx < len(ALL_SAMPLE_TASKS):
                        task = ALL_SAMPLE_TASKS[task_idx]
                        user_input = task.description
                        print(f"{PURPLE}Running: {task.name}{RESET}\n")
                        # Fall through to run the task
                    else:
                        print(f"{RED}任務編號 {cmd[1]} 不存在{RESET}")
                        continue
                except ValueError:
                    print(f"{RED}無效的任務編號{RESET}")
                    continue
            else:
                print(f"{RED}未知命令: {user_input}{RESET}")
                print_help()
                continue

        if user_input.startswith("/"):
            continue

        # Run task
        if llm_client is None:
            print(f"{RED}LLM 客戶端未初始化，無法運行任務{RESET}")
            print(f"{DIM}請設置 ANTHROPIC_API_KEY 環境變量{RESET}\n")
            continue

        try:
            agent = AgentLoop(
                llm_client=llm_client,
                tools=DEMO_TOOLS,
                config=config,
            )

            print(f"{DIM}Agent 開始處理任務...{RESET}\n")
            result = agent.run(user_input)
            last_result = result

            print_result(result)

        except NotImplementedError as e:
            print(f"\n{RED}功能尚未實現: {e}{RESET}")
            print(f"{DIM}請先完成對應的 Lab 實驗{RESET}\n")
        except Exception as e:
            print(f"\n{RED}錯誤: {e}{RESET}\n")


if __name__ == "__main__":
    main()
