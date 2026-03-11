#!/usr/bin/env python3
"""Phase 1 自動評分腳本

運行所有測試並生成進度報告，按 Lab 分組顯示結果。

使用方式:
    python scripts/grade.py
"""

import subprocess
import sys
from pathlib import Path

# ANSI colors
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
CYAN = "\033[36m"
MAGENTA = "\033[35m"
AMBER = "\033[33m"

# Lab definitions
LABS = [
    {
        "name": "Lab 1: Tool Registry",
        "test_file": "tests/test_lab1_registry.py",
        "source_file": "phase_1/registry.py",
        "color": AMBER,
    },
    {
        "name": "Lab 2: File Tools",
        "test_file": "tests/test_lab2_file_tools.py",
        "source_file": "phase_1/file_tools.py",
        "color": YELLOW,
    },
    {
        "name": "Lab 3: Shell Executor",
        "test_file": "tests/test_lab3_shell_tools.py",
        "source_file": "phase_1/shell_tools.py",
        "color": RED,
    },
]

BAR_WIDTH = 30


def run_tests(test_file: str) -> dict:
    """Run pytest on a specific test file and return results."""
    project_dir = Path(__file__).parent.parent

    result = subprocess.run(
        [
            sys.executable, "-m", "pytest",
            str(project_dir / test_file),
            "-v",
            "--tb=no",
            "--no-header",
            "-q",
        ],
        capture_output=True,
        text=True,
        cwd=str(project_dir),
    )

    output = result.stdout + result.stderr

    # Parse results from pytest -q output
    passed = 0
    failed = 0
    errors = 0

    for line in output.split("\n"):
        line = line.strip()
        if not line:
            continue
        if "passed" in line or "failed" in line or "error" in line:
            parts = line.split(",")
            for part in parts:
                part = part.strip()
                words = part.split()
                if len(words) >= 2:
                    try:
                        count = int(words[0])
                    except ValueError:
                        continue
                    if "passed" in words[1]:
                        passed = count
                    elif "failed" in words[1]:
                        failed = count
                    elif "error" in words[1]:
                        errors = count

    total = passed + failed + errors
    return {
        "passed": passed,
        "failed": failed,
        "errors": errors,
        "total": total,
        "output": output,
    }


def render_progress_bar(passed: int, total: int, color: str) -> str:
    """Render a colored progress bar."""
    if total == 0:
        pct = 0.0
        filled = 0
    else:
        pct = passed / total
        filled = int(pct * BAR_WIDTH)

    empty = BAR_WIDTH - filled
    bar = f"{color}{'█' * filled}{DIM}{'░' * empty}{RESET}"
    return f"  [{bar}] {passed}/{total} ({pct * 100:.0f}%)"


def main():
    project_dir = Path(__file__).parent.parent

    print()
    print(f"{BOLD}{AMBER}╔══════════════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{AMBER}║   Phase 1: Tool System & ACI Design — 評分      ║{RESET}")
    print(f"{BOLD}{AMBER}╚══════════════════════════════════════════════════╝{RESET}")
    print()

    total_passed = 0
    total_tests = 0
    lab_results = []

    for lab in LABS:
        print(f"{BOLD}{lab['color']}  {lab['name']}{RESET}")
        print(f"{DIM}  Source: {lab['source_file']}{RESET}")

        results = run_tests(lab["test_file"])
        lab_results.append(results)

        total_passed += results["passed"]
        total_tests += results["total"]

        bar = render_progress_bar(results["passed"], results["total"], lab["color"])
        print(bar)

        if results["failed"] > 0 or results["errors"] > 0:
            for line in results["output"].split("\n"):
                if "FAILED" in line or "ERROR" in line:
                    test_name = line.split("::")[-1].split(" ")[0] if "::" in line else line
                    print(f"    {RED}✗ {test_name.strip()}{RESET}")
        print()

    # Overall summary
    print(f"{BOLD}{'─' * 52}{RESET}")
    if total_tests == 0:
        overall_pct = 0.0
    else:
        overall_pct = total_passed / total_tests * 100

    if overall_pct == 100:
        status_color = GREEN
        status_icon = "★"
        status_text = "全部通過！"
    elif overall_pct >= 70:
        status_color = YELLOW
        status_icon = "◉"
        status_text = "接近完成"
    elif overall_pct > 0:
        status_color = YELLOW
        status_icon = "◎"
        status_text = "進行中"
    else:
        status_color = RED
        status_icon = "○"
        status_text = "尚未開始"

    overall_bar = render_progress_bar(total_passed, total_tests, MAGENTA)
    print(f"{BOLD}  Overall Progress{RESET}")
    print(overall_bar)
    print()
    print(f"  {BOLD}{status_color}{status_icon} {status_text}{RESET} — "
          f"{total_passed}/{total_tests} tests passing ({overall_pct:.0f}%)")
    print()

    if total_passed < total_tests:
        sys.exit(1)


if __name__ == "__main__":
    main()
