"""Lab 3 測試: Shell 執行器 — 命令執行、黑名單、超時、輸出截斷。

測試覆蓋:
- is_command_blocked: 黑名單檢測
- execute: 基本命令執行、工作目錄、環境變量
- 超時: 超時控制
- 輸出截斷: 長輸出處理
- format_result: 結果格式化
- run: 完整的執行+格式化流程
"""

from __future__ import annotations

import pytest

from phase_1.shell_tools import ShellExecutor
from phase_1.types import ShellToolConfig, ShellResult


# ======================================================================
# is_command_blocked tests
# ======================================================================

class TestIsCommandBlocked:
    """Tests for ShellExecutor.is_command_blocked."""

    def test_should_block_rm_rf_root(self):
        """rm -rf / 應被攔截。"""
        executor = ShellExecutor()
        blocked, reason = executor.is_command_blocked("rm -rf /")
        assert blocked is True
        assert reason != ""

    def test_should_block_sudo_rm(self):
        """sudo rm 應被攔截。"""
        executor = ShellExecutor()
        blocked, reason = executor.is_command_blocked("sudo rm -rf /tmp/test")
        assert blocked is True

    def test_should_allow_safe_commands(self):
        """安全的命令不應被攔截。"""
        executor = ShellExecutor()
        blocked, reason = executor.is_command_blocked("echo hello")
        assert blocked is False
        assert reason == ""

    def test_should_allow_safe_rm(self):
        """正常的 rm 命令（不是 rm -rf /）不應被攔截。"""
        executor = ShellExecutor()
        blocked, reason = executor.is_command_blocked("rm temp.txt")
        assert blocked is False

    def test_should_block_fork_bomb(self):
        """fork bomb 應被攔截。"""
        executor = ShellExecutor()
        blocked, reason = executor.is_command_blocked(":(){ :|:& };:")
        assert blocked is True

    def test_should_respect_custom_blocklist(self):
        """自定義黑名單應生效。"""
        config = ShellToolConfig(blocked_commands=["curl", "wget"])
        executor = ShellExecutor(config)

        blocked, _ = executor.is_command_blocked("curl http://example.com")
        assert blocked is True

        blocked, _ = executor.is_command_blocked("echo hello")
        assert blocked is False


# ======================================================================
# execute tests
# ======================================================================

class TestExecute:
    """Tests for ShellExecutor.execute."""

    def test_should_execute_basic_command(self):
        """應能執行基本命令。"""
        executor = ShellExecutor()
        result = executor.execute("echo hello")
        assert result.stdout.strip() == "hello"
        assert result.exit_code == 0

    def test_should_capture_exit_code(self):
        """應捕獲非零退出碼。"""
        executor = ShellExecutor()
        result = executor.execute("exit 42")
        assert result.exit_code == 42

    def test_should_capture_stderr(self):
        """應捕獲 stderr。"""
        executor = ShellExecutor()
        result = executor.execute("echo error >&2")
        assert "error" in result.stderr

    def test_should_respect_cwd(self, tmp_path):
        """應使用指定的工作目錄。"""
        executor = ShellExecutor()
        result = executor.execute("pwd", cwd=str(tmp_path))
        assert tmp_path.name in result.stdout

    def test_should_pass_env_variables(self):
        """應傳遞額外的環境變量。"""
        executor = ShellExecutor()
        result = executor.execute(
            "echo $MY_TEST_VAR",
            env={"MY_TEST_VAR": "test_value"},
        )
        assert "test_value" in result.stdout

    def test_should_return_error_for_blocked_command(self):
        """被攔截的命令應返回錯誤。"""
        executor = ShellExecutor()
        result = executor.execute("rm -rf /")
        assert result.exit_code != 0
        assert result.stderr != ""

    def test_should_timeout_long_running_command(self):
        """超時的命令應返回 timed_out=True。"""
        config = ShellToolConfig(timeout_seconds=1)
        executor = ShellExecutor(config)
        result = executor.execute("sleep 10")
        assert result.timed_out is True

    def test_should_truncate_long_output(self):
        """超過 max_output_bytes 的輸出應被截斷。"""
        config = ShellToolConfig(max_output_bytes=100)
        executor = ShellExecutor(config)
        result = executor.execute("python3 -c \"print('x' * 500)\"")
        assert len(result.stdout) <= 200  # 100 + truncation message
        assert "truncated" in result.stdout.lower() or len(result.stdout) <= 100


# ======================================================================
# format_result tests
# ======================================================================

class TestFormatResult:
    """Tests for ShellExecutor.format_result."""

    def test_should_format_success(self):
        """成功的結果應格式化為正常的 ToolResult。"""
        executor = ShellExecutor()
        result = ShellResult(stdout="hello\n", stderr="", exit_code=0)
        tool_result = executor.format_result(result)
        assert not tool_result.is_error
        assert "hello" in tool_result.content

    def test_should_format_error(self):
        """失敗的結果應格式化為錯誤的 ToolResult。"""
        executor = ShellExecutor()
        result = ShellResult(stdout="", stderr="file not found", exit_code=1)
        tool_result = executor.format_result(result)
        assert tool_result.is_error
        assert "file not found" in tool_result.content
        assert "1" in tool_result.content  # exit code

    def test_should_format_timeout(self):
        """超時的結果應格式化為超時錯誤。"""
        executor = ShellExecutor()
        result = ShellResult(stdout="partial", stderr="", exit_code=0, timed_out=True)
        tool_result = executor.format_result(result)
        assert tool_result.is_error
        assert "timed out" in tool_result.content.lower() or "timeout" in tool_result.content.lower()


# ======================================================================
# run tests
# ======================================================================

class TestRun:
    """Tests for ShellExecutor.run (execute + format)."""

    def test_should_run_and_format_success(self):
        """run() 應執行命令並返回格式化的 ToolResult。"""
        executor = ShellExecutor()
        result = executor.run("echo hello")
        assert not result.is_error
        assert "hello" in result.content

    def test_should_run_and_format_error(self):
        """run() 對失敗命令應返回錯誤 ToolResult。"""
        executor = ShellExecutor()
        result = executor.run("exit 1")
        assert result.is_error
