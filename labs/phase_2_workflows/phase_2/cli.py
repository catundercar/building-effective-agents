"""Phase 2 互動式 CLI — 完成所有 Lab 後可運行的 Workflow 示範介面。

使用方式:
    python -m phase_2.cli

支持的命令:
    /chain   — 運行 Code Review Chain 示範
    /route   — 互動式路由分類
    /trace   — 顯示最近的 Trace
    /help    — 顯示幫助
    /exit    — 退出程式
"""

from __future__ import annotations

import sys
from typing import TYPE_CHECKING

from .chain import ChainRunner
from .router import Router
from .sample_pipelines import code_review_pipeline, create_sample_routes
from .tracing import Tracer
from .types import ChainConfig, RouterConfig, Trace, TraceConfig

if TYPE_CHECKING:
    pass

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

PHASE_COLOR = "\033[38;2;5;150;105m"  # #059669


def print_banner() -> None:
    """Print startup banner."""
    print(f"\n{BOLD}{PHASE_COLOR}{'=' * 50}{RESET}")
    print(f"{BOLD}{PHASE_COLOR}  Phase 2: Workflow Patterns — CLI{RESET}")
    print(f"{BOLD}{PHASE_COLOR}  Prompt Chaining | Routing | Tracing{RESET}")
    print(f"{BOLD}{PHASE_COLOR}{'=' * 50}{RESET}")
    print(f"{DIM}輸入訊息開始互動，或使用 /help 查看命令{RESET}\n")


def print_help() -> None:
    """Print available commands."""
    print(f"\n{BOLD}可用命令:{RESET}")
    print(f"  {GREEN}/chain{RESET}   — 運行 Code Review Chain 示範")
    print(f"  {GREEN}/route{RESET}   — 路由分類一段輸入")
    print(f"  {GREEN}/trace{RESET}   — 顯示最近的 Trace")
    print(f"  {GREEN}/help{RESET}    — 顯示此幫助訊息")
    print(f"  {GREEN}/exit{RESET}    — 退出程式\n")


def run_chain_demo(llm_client: object, tracer: Tracer | None = None) -> Trace | None:
    """Run a chain demo with user-provided code. Returns a Trace if tracer is provided."""
    print(f"\n{BOLD}{CYAN}=== Prompt Chain Demo ==={RESET}")
    print(f"{DIM}輸入一段程式碼進行 Code Review（輸入空行結束）:{RESET}")

    lines = []
    while True:
        try:
            line = input()
            if line == "":
                break
            lines.append(line)
        except EOFError:
            break

    code = "\n".join(lines)
    if not code.strip():
        code = "def add(a, b):\n    return a - b  # Bug: should be a + b"
        print(f"{DIM}使用預設範例代碼{RESET}")

    try:
        runner = ChainRunner(llm_client=llm_client, config=ChainConfig())
        steps = code_review_pipeline()
        print(f"\n{DIM}Running {len(steps)}-step chain...{RESET}")

        trace = None
        if tracer is not None:
            trace = tracer.start_trace("chain_demo")

        result = runner.run_chain(steps, initial_input=code)

        if result.success:
            print(f"\n{GREEN}Chain completed successfully!{RESET}")
            print(f"{BOLD}Steps completed:{RESET} {result.steps_completed}")
            print(f"\n{BOLD}Output:{RESET}")
            print(result.final_output)
        else:
            print(f"\n{RED}Chain failed at step {result.steps_completed}:{RESET}")
            print(f"  {result.error}")

        # Show trace
        if result.trace:
            print(f"\n{BOLD}Execution Trace:{RESET}")
            for entry in result.trace:
                duration = entry.get("duration_ms", 0)
                status = f"{GREEN}OK{RESET}" if "output" in entry else f"{RED}FAIL{RESET}"
                print(f"  {entry['name']}: {status} ({duration:.0f}ms)")

        if tracer is not None and trace is not None:
            tracer.end_trace(trace)
        return trace

    except NotImplementedError as e:
        print(f"\n{RED}功能尚未實現: {e}{RESET}")
        print(f"{DIM}請先完成 Lab 1 (chain.py){RESET}")
        return None


def run_route_demo(llm_client: object, tracer: Tracer | None = None) -> Trace | None:
    """Run a routing demo. Returns a Trace if tracer is provided."""
    print(f"\n{BOLD}{CYAN}=== Routing Demo ==={RESET}")
    print(f"{DIM}輸入一段文字，Router 會分類並路由:{RESET}")

    try:
        user_input = input(f"{BOLD}{GREEN}Input> {RESET}").strip()
    except (EOFError, KeyboardInterrupt):
        return None

    if not user_input:
        user_input = "請幫我解釋這個函數的作用"
        print(f"{DIM}使用預設範例輸入{RESET}")

    try:
        routes = create_sample_routes()
        router = Router(
            llm_client=llm_client,
            routes=routes,
            config=RouterConfig(confidence_threshold=0.7, fallback_route="chat"),
        )

        trace = None
        if tracer is not None:
            trace = tracer.start_trace("route_demo")

        result = router.route(user_input)

        print(f"\n{BOLD}Routing Result:{RESET}")
        print(f"  Route: {PHASE_COLOR}{result.route_name}{RESET}")
        print(f"  Confidence: {result.confidence:.1%}")
        print(f"  Classification time: {result.classification_time_ms:.0f}ms")
        print(f"\n{BOLD}Handler Output:{RESET}")
        print(f"  {result.handler_output}")

        if tracer is not None and trace is not None:
            tracer.end_trace(trace)
        return trace

    except NotImplementedError as e:
        print(f"\n{RED}功能尚未實現: {e}{RESET}")
        print(f"{DIM}請先完成 Lab 2 (router.py){RESET}")
        return None


def main() -> None:
    """Run the interactive CLI."""
    print_banner()

    # Try to initialize LLM client
    llm_client = None
    try:
        import anthropic
        llm_client = anthropic.Anthropic()
        print(f"{DIM}LLM 客戶端已初始化{RESET}\n")
    except Exception as e:
        print(f"{YELLOW}警告: 無法初始化 LLM 客戶端: {e}{RESET}")
        print(f"{DIM}部分功能將無法使用。請設置 ANTHROPIC_API_KEY 環境變量。{RESET}\n")

    # Initialize tracer
    tracer = Tracer(config=TraceConfig(verbose=True))
    last_trace = None

    while True:
        try:
            user_input = input(f"{BOLD}{GREEN}workflow> {RESET}").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\n{DIM}再見！{RESET}")
            break

        if not user_input:
            continue

        if user_input.startswith("/"):
            cmd = user_input.lower()
            if cmd in ("/exit", "/quit"):
                print(f"{DIM}再見！{RESET}")
                break
            elif cmd == "/help":
                print_help()
            elif cmd == "/chain":
                if llm_client is None:
                    print(f"{RED}需要 LLM 客戶端。請設置 ANTHROPIC_API_KEY。{RESET}")
                else:
                    last_trace = run_chain_demo(llm_client, tracer) or last_trace
            elif cmd == "/route":
                if llm_client is None:
                    print(f"{RED}需要 LLM 客戶端。請設置 ANTHROPIC_API_KEY。{RESET}")
                else:
                    last_trace = run_route_demo(llm_client, tracer) or last_trace
            elif cmd == "/trace":
                if last_trace is None:
                    print(f"{DIM}尚無追蹤記錄。先運行 /chain 或 /route。{RESET}")
                else:
                    try:
                        print(tracer.format_trace(last_trace))
                    except NotImplementedError as e:
                        print(f"{RED}功能尚未實現: {e}{RESET}")
            else:
                print(f"{RED}未知命令: {user_input}{RESET}")
                print_help()
            continue

        # For free-form input, try routing
        if llm_client is not None:
            last_trace = run_route_demo(llm_client, tracer) or last_trace
        else:
            print(f"{DIM}請設置 ANTHROPIC_API_KEY 以啟用互動功能{RESET}")


if __name__ == "__main__":
    main()
