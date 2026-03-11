"""Phase 5 互動式 CLI — 完成所有 Lab 後可運行的完整 Agent 介面。

使用方式:
    python -m phase_5.cli

支持的命令:
    /help     — 顯示幫助訊息
    /config   — 顯示當前配置
    /sessions — 列出所有已保存的 Session
    /resume   — 恢復最近的 Session
    /new      — 建立新的 Session
    /clear    — 清除當前 Session 的歷史
    /exit     — 退出程式
"""

from __future__ import annotations

import sys
import time

from .cli_app import CLIRenderer, create_dark_theme
from .config import ConfigManager, _default_config, validate_config
from .session import SessionManager
from .types import (
    DisplayConfig,
    ProjectConfig,
    SessionConfig,
)

# ANSI color codes
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
CYAN = "\033[36m"

VERSION = "1.0.0"


def print_help() -> None:
    """Print available commands."""
    print(f"\n{BOLD}可用命令:{RESET}")
    print(f"  {GREEN}/help{RESET}     — 顯示此幫助訊息")
    print(f"  {GREEN}/config{RESET}   — 顯示當前配置")
    print(f"  {GREEN}/sessions{RESET} — 列出所有已保存的 Session")
    print(f"  {GREEN}/resume{RESET}   — 恢復最近的 Session")
    print(f"  {GREEN}/new{RESET}      — 建立新的 Session")
    print(f"  {GREEN}/clear{RESET}    — 清除當前 Session 的歷史")
    print(f"  {GREEN}/exit{RESET}     — 退出程式\n")


def print_config(config: ProjectConfig) -> None:
    """Print current configuration."""
    print(f"\n{BOLD}當前配置:{RESET}")
    print(f"  {CYAN}Model:{RESET}          {config.agent.model}")
    print(f"  {CYAN}Max Tokens:{RESET}     {config.agent.max_tokens}")
    print(f"  {CYAN}Temperature:{RESET}    {config.agent.temperature}")
    print(f"  {CYAN}Max Iterations:{RESET} {config.agent.max_iterations}")
    print(f"  {CYAN}Token Budget:{RESET}   {config.agent.token_budget:,}")

    if config.permissions:
        print(f"\n  {BOLD}工具權限:{RESET}")
        for perm in config.permissions:
            color = GREEN if perm.level == "auto" else YELLOW if perm.level == "confirm" else RED
            print(f"    {perm.tool_name}: {color}{perm.level}{RESET}")

    if config.blocked_commands:
        print(f"\n  {BOLD}封鎖的命令:{RESET}")
        for cmd in config.blocked_commands:
            print(f"    {RED}{cmd}{RESET}")

    print()


def print_sessions(session_mgr: SessionManager) -> None:
    """Print saved sessions."""
    try:
        sessions = session_mgr.list_sessions()
    except NotImplementedError:
        print(f"\n{RED}list_sessions 尚未實現{RESET}\n")
        return

    if not sessions:
        print(f"\n{DIM}沒有已保存的 Session{RESET}\n")
        return

    print(f"\n{BOLD}已保存的 Session ({len(sessions)}):{RESET}")
    for s in sessions[:10]:  # Show max 10
        ts = time.strftime("%Y-%m-%d %H:%M", time.localtime(s.created_at))
        print(f"  {CYAN}{s.id}{RESET}  {DIM}{ts}{RESET}  "
              f"{s.message_count} msgs  {DIM}{s.preview}{RESET}")
    print()


def main() -> None:
    """Run the interactive CLI."""
    # Initialize config
    try:
        config_mgr = ConfigManager()
        config = config_mgr.load()
    except NotImplementedError:
        print(f"{YELLOW}ConfigManager 尚未實現，使用預設配置{RESET}")
        from .types import AgentConfig
        config = ProjectConfig(agent=AgentConfig())

    # Validate config
    errors = validate_config(config)
    if errors:
        print(f"{RED}配置錯誤:{RESET}")
        for err in errors:
            print(f"  {RED}- {err}{RESET}")
        print()

    # Initialize renderer
    try:
        display_config = DisplayConfig()
        renderer = CLIRenderer(display_config)
    except NotImplementedError:
        renderer = None

    # Initialize session manager
    try:
        session_mgr = SessionManager(SessionConfig())
    except NotImplementedError:
        print(f"{YELLOW}SessionManager 尚未實現{RESET}")
        session_mgr = None

    # Print welcome
    if renderer:
        try:
            welcome = renderer.render_welcome(VERSION, config.agent.model)
            print(welcome)
        except NotImplementedError:
            pass

    if renderer is None:
        print(f"\n{BOLD}{CYAN}╔══════════════════════════════════════════╗{RESET}")
        print(f"{BOLD}{CYAN}║       Phase 5: Ship It — CLI            ║{RESET}")
        print(f"{BOLD}{CYAN}╚══════════════════════════════════════════╝{RESET}")

    print(f"{DIM}輸入訊息開始對話，或使用 /help 查看命令{RESET}\n")

    # Create or resume session
    current_session = None
    if session_mgr:
        try:
            current_session = session_mgr.create_session(
                project_dir=str(__import__("pathlib").Path.cwd()),
                model=config.agent.model,
            )
            print(f"{DIM}Session: {current_session.id}{RESET}\n")
        except NotImplementedError:
            print(f"{YELLOW}create_session 尚未實現{RESET}\n")

    # Main loop
    while True:
        try:
            user_input = input(f"{BOLD}{GREEN}you> {RESET}").strip()
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
            elif cmd == "/config":
                print_config(config)
            elif cmd == "/sessions":
                if session_mgr:
                    print_sessions(session_mgr)
                else:
                    print(f"{RED}SessionManager 未初始化{RESET}\n")
            elif cmd == "/resume":
                if session_mgr:
                    try:
                        sessions = session_mgr.list_sessions()
                        if sessions:
                            current_session = session_mgr.load_session(sessions[0].id)
                            print(f"{GREEN}已恢復 Session: {current_session.id}{RESET}\n")
                        else:
                            print(f"{DIM}沒有可恢復的 Session{RESET}\n")
                    except (NotImplementedError, FileNotFoundError) as e:
                        print(f"{RED}恢復失敗: {e}{RESET}\n")
                else:
                    print(f"{RED}SessionManager 未初始化{RESET}\n")
            elif cmd == "/new":
                if session_mgr:
                    try:
                        current_session = session_mgr.create_session(
                            project_dir=str(__import__("pathlib").Path.cwd()),
                            model=config.agent.model,
                        )
                        print(f"{GREEN}新 Session: {current_session.id}{RESET}\n")
                    except NotImplementedError:
                        print(f"{RED}create_session 尚未實現{RESET}\n")
                else:
                    print(f"{RED}SessionManager 未初始化{RESET}\n")
            elif cmd == "/clear":
                if current_session:
                    current_session.messages.clear()
                    print(f"{DIM}Session 歷史已清除{RESET}\n")
                else:
                    print(f"{DIM}沒有活動的 Session{RESET}\n")
            else:
                print(f"{RED}未知命令: {user_input}{RESET}")
                print_help()
            continue

        # Record message in session
        if current_session and session_mgr:
            try:
                session_mgr.add_message(current_session, "user", user_input)
            except NotImplementedError:
                pass

        # For now, just echo back (full Agent integration would go here)
        print(f"\n{BOLD}{BLUE}assistant>{RESET} ", end="")

        if renderer:
            try:
                renderer.render_streaming_text(
                    f"收到你的訊息: \"{user_input}\"\n"
                    f"（完整的 Agent 回應需要整合 Phase 0-4 的模組）\n"
                )
            except NotImplementedError:
                print(f"收到你的訊息: \"{user_input}\"")
                print(f"{DIM}（render_streaming_text 尚未實現）{RESET}")
        else:
            print(f"收到你的訊息: \"{user_input}\"")

        # Record assistant response
        if current_session and session_mgr:
            try:
                session_mgr.add_message(
                    current_session, "assistant",
                    f"收到你的訊息: \"{user_input}\""
                )
            except NotImplementedError:
                pass

        print()


if __name__ == "__main__":
    main()
