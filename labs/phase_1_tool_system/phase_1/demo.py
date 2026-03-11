"""Phase 1 Demo — 展示 Tool Registry、File Tools 和 Shell Executor 的使用。

使用方式:
    python -m phase_1.demo

這個 demo 會：
1. 建立一個 ToolRegistry 並註冊文件和 shell 工具
2. 執行幾個文件操作
3. 執行幾個 shell 命令
4. 展示工具的安全機制
"""

from __future__ import annotations

from pathlib import Path

from .types import (
    FileToolConfig,
    ShellToolConfig,
    ToolDefinition,
    ToolHandler,
    JSONSchema,
)
from .registry import ToolRegistry
from .file_tools import FileTools
from .shell_tools import ShellExecutor

# ANSI colors
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
AMBER = "\033[33m"
GREEN = "\033[32m"
RED = "\033[31m"
CYAN = "\033[36m"


def _header(text: str) -> None:
    print(f"\n{BOLD}{AMBER}{'─' * 50}{RESET}")
    print(f"{BOLD}{AMBER}  {text}{RESET}")
    print(f"{BOLD}{AMBER}{'─' * 50}{RESET}\n")


def _result(label: str, content: str, is_error: bool = False) -> None:
    color = RED if is_error else GREEN
    icon = "✗" if is_error else "✓"
    print(f"  {color}{icon}{RESET} {BOLD}{label}{RESET}")
    for line in content.strip().split("\n")[:10]:
        print(f"    {DIM}{line}{RESET}")
    print()


def main() -> None:
    print(f"\n{BOLD}{CYAN}╔══════════════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{CYAN}║   Phase 1: Tool System & ACI Design — Demo      ║{RESET}")
    print(f"{BOLD}{CYAN}╚══════════════════════════════════════════════════╝{RESET}")

    # ── Tool Registry Demo ──────────────────────────────────────────
    _header("1. Tool Registry")

    registry = ToolRegistry()

    # Create and register tools
    demo_dir = Path(__file__).parent.parent / "fixtures" / "sandbox_test"
    demo_dir.mkdir(parents=True, exist_ok=True)

    file_tools = FileTools(FileToolConfig(sandbox_dir=str(demo_dir)))

    read_handler = ToolHandler(
        definition=ToolDefinition(
            name="read_file",
            description="Read the contents of a file at the given absolute path.",
            input_schema=JSONSchema(
                properties={"path": {"type": "string", "description": "Absolute file path"}},
                required=["path"],
            ),
        ),
        execute=lambda args: file_tools.read_file(args["path"]).content,
    )

    registry.register(read_handler)
    print(f"  Registered tools: {registry.list_names()}")
    print(f"  Registry size: {registry.size}")

    # ── File Tools Demo ─────────────────────────────────────────────
    _header("2. File Tools")

    # Write a test file
    test_file = str(demo_dir / "hello.py")
    result = file_tools.write_file(test_file, 'def greet(name):\n    return f"Hello, {name}!"\n')
    _result("write_file", result.content, result.is_error)

    # Read it back
    result = file_tools.read_file(test_file)
    _result("read_file", result.content, result.is_error)

    # List directory
    result = file_tools.list_directory(str(demo_dir))
    _result("list_directory", result.content, result.is_error)

    # Test path traversal protection
    try:
        file_tools._validate_path("/etc/passwd")
        print(f"  {RED}✗ Path traversal NOT blocked!{RESET}\n")
    except PermissionError as e:
        _result("sandbox protection", str(e), is_error=True)

    # ── Shell Executor Demo ─────────────────────────────────────────
    _header("3. Shell Executor")

    shell = ShellExecutor(ShellToolConfig(timeout_seconds=5))

    # Basic command
    result = shell.run("echo 'Hello from shell!'")
    _result("echo command", result.content, result.is_error)

    # Command with output
    result = shell.run("python3 -c \"print('2 + 2 =', 2+2)\"")
    _result("python command", result.content, result.is_error)

    # Blocked command
    result = shell.run("rm -rf /")
    _result("blocked command", result.content, result.is_error)

    # ── Summary ─────────────────────────────────────────────────────
    _header("Summary")
    print(f"  {GREEN}Tool Registry{RESET}: {registry.size} tools registered")
    print(f"  {GREEN}File Tools{RESET}: read, write, list, search, edit")
    print(f"  {GREEN}Shell Executor{RESET}: safe execution with timeout & blacklist")
    print()


if __name__ == "__main__":
    main()
