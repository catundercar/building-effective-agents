"""Phase 0 互動式 CLI — 完成所有 Lab 後可運行的聊天介面。

使用方式:
    python -m phase_0.cli

支持的命令:
    /tools   — 列出所有已註冊的工具
    /context — 顯示當前 context 狀態
    /clear   — 清除對話歷史
    /exit    — 退出程式
"""

from __future__ import annotations

import sys

from .client import LLMClient
from .context import ContextManager
from .sample_tools import ALL_SAMPLE_TOOLS
from .tools import ToolExecutor, ToolRegistry, tool_use_loop
from .types import (
    ContextManagerConfig,
    LLMClientOptions,
    Message,
    TextBlock,
    ToolUseBlock,
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

SYSTEM_PROMPT = (
    "你是一個有用的 AI 助手。你可以使用提供的工具來幫助用戶完成任務。"
    "請用繁體中文回答，除非用戶使用其他語言。"
)


def print_banner() -> None:
    """Print startup banner."""
    print(f"\n{BOLD}{CYAN}╔══════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{CYAN}║   Phase 0: Augmented LLM Core — CLI     ║{RESET}")
    print(f"{BOLD}{CYAN}╚══════════════════════════════════════════╝{RESET}")
    print(f"{DIM}輸入訊息開始對話，或使用 /help 查看命令{RESET}\n")


def print_help() -> None:
    """Print available commands."""
    print(f"\n{BOLD}可用命令:{RESET}")
    print(f"  {GREEN}/tools{RESET}   — 列出所有已註冊的工具")
    print(f"  {GREEN}/context{RESET} — 顯示當前 context 狀態")
    print(f"  {GREEN}/clear{RESET}   — 清除對話歷史")
    print(f"  {GREEN}/help{RESET}    — 顯示此幫助訊息")
    print(f"  {GREEN}/exit{RESET}    — 退出程式\n")


def print_tool_list(registry: ToolRegistry) -> None:
    """Print registered tools."""
    print(f"\n{BOLD}已註冊的工具 ({registry.size}):{RESET}")
    for defn in registry.list_definitions():
        print(f"  {YELLOW}{defn.name}{RESET} — {defn.description}")
    print()


def print_context_state(context_mgr: ContextManager) -> None:
    """Print context state."""
    state = context_mgr.get_state()
    limit = context_mgr.config.max_context_tokens
    pct = (state.total_tokens / limit * 100) if limit > 0 else 0
    color = RED if state.is_near_limit else GREEN
    print(f"\n{BOLD}Context 狀態:{RESET}")
    print(f"  消息數量:  {len(state.messages)}")
    print(f"  Token 用量: {color}{state.total_tokens:,} / {limit:,} ({pct:.1f}%){RESET}")
    print(f"  接近限制:  {'是' if state.is_near_limit else '否'}")
    print()


def main() -> None:
    """Run the interactive CLI."""
    print_banner()

    # Initialize components
    try:
        client = LLMClient()
    except Exception as e:
        print(f"{RED}無法初始化 LLM 客戶端: {e}{RESET}")
        print(f"{DIM}請確保已設置 ANTHROPIC_API_KEY 環境變量{RESET}")
        sys.exit(1)

    registry = ToolRegistry()
    for tool in ALL_SAMPLE_TOOLS:
        registry.register(tool)

    executor = ToolExecutor(registry)

    context_mgr = ContextManager(
        ContextManagerConfig(
            max_context_tokens=200_000,
            reserved_output_tokens=8_192,
            summarization_threshold=0.7,
        )
    )
    context_mgr.set_system_prompt(SYSTEM_PROMPT)
    context_mgr.set_tools(registry.list_definitions())

    print(f"{DIM}已載入 {registry.size} 個工具: {', '.join(registry.list_names())}{RESET}\n")

    # Main loop
    while True:
        try:
            user_input = input(f"{BOLD}{GREEN}你> {RESET}").strip()
        except (EOFError, KeyboardInterrupt):
            print(f"\n{DIM}再見！{RESET}")
            break

        if not user_input:
            continue

        # Handle commands
        if user_input.startswith("/"):
            cmd = user_input.lower()
            if cmd == "/exit" or cmd == "/quit":
                print(f"{DIM}再見！{RESET}")
                break
            elif cmd == "/help":
                print_help()
            elif cmd == "/tools":
                print_tool_list(registry)
            elif cmd == "/context":
                print_context_state(context_mgr)
            elif cmd == "/clear":
                context_mgr.clear()
                print(f"{DIM}對話歷史已清除{RESET}\n")
            else:
                print(f"{RED}未知命令: {user_input}{RESET}")
                print_help()
            continue

        # Add user message
        user_msg = Message(role="user", content=user_input)
        context_mgr.add_message(user_msg)

        # Auto-manage context
        try:
            context_mgr.auto_manage(client)
        except NotImplementedError:
            pass  # Student hasn't implemented it yet

        # Run tool use loop
        try:
            messages = context_mgr.get_messages()
            tools = registry.list_definitions()

            def on_iteration(i: int, resp: object) -> None:
                print(f"{DIM}  [迭代 {i + 1}]{RESET}", end="", flush=True)

            result = tool_use_loop(
                client,
                executor,
                messages,
                system_prompt=SYSTEM_PROMPT,
                tools=tools,
                max_iterations=10,
                on_iteration=on_iteration,
            )

            response = result["response"]

            # Print response
            print(f"\n{BOLD}{BLUE}助手>{RESET} ", end="")
            for block in response.content:
                if isinstance(block, TextBlock):
                    print(block.text)
                elif isinstance(block, ToolUseBlock):
                    print(f"{DIM}[調用工具: {block.name}]{RESET}")

            # Add assistant message to context
            assistant_msg = Message(role="assistant", content=response.content)
            context_mgr.add_message(assistant_msg)
            print()

        except NotImplementedError as e:
            print(f"\n{RED}功能尚未實現: {e}{RESET}")
            print(f"{DIM}請先完成對應的 Lab 實驗{RESET}\n")
        except Exception as e:
            print(f"\n{RED}錯誤: {e}{RESET}\n")


if __name__ == "__main__":
    main()
