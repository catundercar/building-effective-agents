"""Lab 3: Shell 執行器與沙箱 — 安全的命令行執行工具。

本模組實現了帶安全機制的 Shell 命令執行器：
- 命令黑名單過濾（防止危險命令）
- 超時控制（防止無限運行）
- 輸出截斷（防止記憶體溢出）
- 結構化的執行結果

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

import os
import signal
import subprocess
from pathlib import Path
from typing import Any

from .types import (
    ShellResult,
    ShellToolConfig,
    ToolResult,
)


class ShellExecutor:
    """安全的 Shell 命令執行器。

    安全機制：
    1. 命令黑名單 — 攔截已知的危險命令
    2. 超時控制 — 防止命令無限運行
    3. 輸出限制 — 防止 stdout/stderr 撐爆記憶體
    4. 工作目錄限制 — 限制在允許的目錄中執行
    """

    def __init__(self, config: ShellToolConfig | None = None) -> None:
        self.config = config or ShellToolConfig()

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def is_command_blocked(self, command: str) -> tuple[bool, str]:
        """檢查命令是否在黑名單中。

        將命令與 config.blocked_commands 中的每一個模式比較。
        使用子字串匹配（黑名單中的模式出現在命令中即視為匹配）。

        Args:
            command: 要檢查的完整命令字串

        Returns:
            tuple[bool, str]: (是否被攔截, 攔截原因)
            如果命令安全，返回 (False, "")
            如果被攔截，返回 (True, "Command blocked: {pattern}")
        """
        # HINT: 1. 去除命令的前後空白
        # HINT: 2. 遍歷 self.config.blocked_commands
        # HINT: 3. 如果某個 blocked 模式出現在 command 中 → 返回 (True, reason)
        # HINT: 4. 全部通過 → 返回 (False, "")
        raise NotImplementedError("TODO: Implement is_command_blocked")

    def execute(
        self,
        command: str,
        *,
        cwd: str | None = None,
        env: dict[str, str] | None = None,
    ) -> ShellResult:
        """執行 Shell 命令。

        安全地執行命令，帶超時控制和輸出截斷。

        Args:
            command: 要執行的 shell 命令
            cwd: 工作目錄（絕對路徑）。None 使用當前目錄。
            env: 額外的環境變量。會與當前環境合併。

        Returns:
            ShellResult: 包含 stdout、stderr、exit_code、timed_out
        """
        # HINT: 1. 調用 self.is_command_blocked(command) 檢查黑名單
        #          如果被攔截，返回 ShellResult(stderr=reason, exit_code=1)
        # HINT: 2. 如果指定了 cwd，驗證其存在且為目錄
        # HINT: 3. 構建環境變量：合併 os.environ + env + config.env_overrides
        # HINT: 4. 用 subprocess.run() 執行命令：
        #          - shell=True
        #          - capture_output=True
        #          - text=True
        #          - timeout=self.config.timeout_seconds
        #          - cwd=cwd
        #          - env=merged_env
        # HINT: 5. 截斷輸出：如果 stdout/stderr 超過 max_output_bytes
        #          截斷並附加 "\n... [output truncated]"
        # HINT: 6. 返回 ShellResult(stdout, stderr, exit_code)
        # HINT: 7. 捕獲 subprocess.TimeoutExpired → 返回 timed_out=True 的結果
        # HINT: 8. 捕獲其他異常 → 返回 stderr=str(e) 的結果
        raise NotImplementedError("TODO: Implement execute")

    def format_result(self, result: ShellResult) -> ToolResult:
        """將 ShellResult 格式化為 LLM 友好的 ToolResult。

        格式化規則：
        - 成功：返回 stdout 內容
        - 失敗：返回包含 exit_code 和 stderr 的錯誤信息
        - 超時：返回超時錯誤信息

        Args:
            result: Shell 命令執行結果

        Returns:
            ToolResult: 格式化後的工具結果
        """
        # HINT: 1. 如果 timed_out，返回 ToolResult(
        #          content=f"Command timed out after {config.timeout_seconds}s.\n"
        #                  f"Partial stdout:\n{result.stdout}",
        #          is_error=True)
        # HINT: 2. 如果 exit_code != 0，返回 ToolResult(
        #          content=f"Command failed (exit code {result.exit_code}).\n"
        #                  f"stdout:\n{result.stdout}\n"
        #                  f"stderr:\n{result.stderr}",
        #          is_error=True)
        # HINT: 3. 成功時返回 ToolResult(content=result.stdout)
        raise NotImplementedError("TODO: Implement format_result")

    def run(
        self,
        command: str,
        *,
        cwd: str | None = None,
        env: dict[str, str] | None = None,
    ) -> ToolResult:
        """執行命令並返回格式化的 ToolResult。

        這是 execute() + format_result() 的便捷組合。

        Args:
            command: 要執行的 shell 命令
            cwd: 工作目錄
            env: 額外的環境變量

        Returns:
            ToolResult: 格式化的執行結果
        """
        # HINT: 1. 調用 self.execute(command, cwd=cwd, env=env)
        # HINT: 2. 調用 self.format_result(result)
        # HINT: 3. 返回格式化後的 ToolResult
        raise NotImplementedError("TODO: Implement run")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    def get_blocked_commands(self) -> list[str]:
        """返回當前的命令黑名單。（已實現）"""
        return list(self.config.blocked_commands)

    def add_blocked_command(self, pattern: str) -> None:
        """添加一個命令到黑名單。（已實現）"""
        if pattern not in self.config.blocked_commands:
            self.config.blocked_commands.append(pattern)

    def remove_blocked_command(self, pattern: str) -> None:
        """從黑名單中移除一個命令。（已實現）"""
        if pattern in self.config.blocked_commands:
            self.config.blocked_commands.remove(pattern)
