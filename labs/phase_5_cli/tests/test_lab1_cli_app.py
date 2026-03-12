"""Lab 1 測試: CLI 渲染器 — streaming text, tool call cards, diff view, progress.

測試覆蓋:
- render_streaming_text: 串流文字輸出、顏色控制
- render_tool_call: 工具調用卡片渲染、詳情隱藏
- render_diff: 差異著色（新增行綠色、刪除行紅色）
- render_progress: 進度條渲染
- render_welcome: 歡迎畫面版本和模型顯示
- color disabled: 禁用顏色時無 ANSI 碼
- truncate: 超長輸出截斷
"""

from __future__ import annotations

import sys
from io import StringIO
from unittest.mock import patch

import pytest

from phase_5.cli_app import CLIRenderer, create_dark_theme, create_light_theme, RESET
from phase_5.types import DisplayConfig


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def renderer():
    """Create a CLIRenderer with default config."""
    return CLIRenderer(DisplayConfig(color_enabled=True, max_width=80))


@pytest.fixture
def no_color_renderer():
    """Create a CLIRenderer with color disabled."""
    return CLIRenderer(DisplayConfig(color_enabled=False, max_width=80))


# ======================================================================
# render_streaming_text tests
# ======================================================================


class TestRenderStreamingText:
    """Tests for CLIRenderer.render_streaming_text."""

    def test_render_streaming_text_outputs_chars(self, renderer):
        """串流渲染應輸出文字內容並返回格式化字串。"""
        captured = StringIO()
        with patch("sys.stdout", captured):
            result = renderer.render_streaming_text("Hello")

        # The result should contain "Hello"
        assert "Hello" in result

    def test_render_streaming_text_writes_to_stdout(self, renderer):
        """串流渲染應寫入 stdout。"""
        captured = StringIO()
        with patch("sys.stdout", captured):
            renderer.render_streaming_text("Hi")

        output = captured.getvalue()
        assert "Hi" in output

    def test_render_streaming_text_with_color(self, renderer):
        """啟用顏色時，輸出應包含 ANSI 碼。"""
        captured = StringIO()
        with patch("sys.stdout", captured):
            result = renderer.render_streaming_text("colored")

        # With color enabled, stdout output should contain ANSI escape sequences
        output = captured.getvalue()
        assert "colored" in result
        assert "\033[" in output, "Color-enabled renderer should emit ANSI codes to stdout"

    def test_render_streaming_text_empty_string(self, renderer):
        """空字串應返回空結果。"""
        captured = StringIO()
        with patch("sys.stdout", captured):
            result = renderer.render_streaming_text("")

        assert result == "" or "\033" in result  # Empty or just color codes


# ======================================================================
# render_tool_call tests
# ======================================================================


class TestRenderToolCall:
    """Tests for CLIRenderer.render_tool_call."""

    def test_render_tool_call_shows_name_and_result(self, renderer):
        """工具卡片應顯示工具名稱和結果。"""
        result = renderer.render_tool_call(
            tool_name="read_file",
            tool_input={"path": "/src/main.py"},
            result="file content here",
        )

        assert "read_file" in result
        assert "file content" in result

    def test_render_tool_call_shows_input_params(self, renderer):
        """工具卡片應顯示輸入參數。"""
        result = renderer.render_tool_call(
            tool_name="search",
            tool_input={"query": "hello", "limit": "10"},
            result="found 3 results",
        )

        assert "query" in result
        assert "hello" in result

    def test_render_tool_call_hidden_details(self):
        """當 show_tool_details 為 False 時，應顯示簡短摘要。"""
        config = DisplayConfig(show_tool_details=False, color_enabled=False)
        renderer = CLIRenderer(config)

        result = renderer.render_tool_call(
            tool_name="read_file",
            tool_input={"path": "/src/main.py"},
            result="long content that should not appear in detail",
        )

        # Should be a compact summary, not the full card
        assert "read_file" in result
        # Should NOT contain the full card borders when details are hidden
        assert "Input" not in result or len(result) < 200


# ======================================================================
# render_diff tests
# ======================================================================


class TestRenderDiff:
    """Tests for CLIRenderer.render_diff."""

    def test_render_diff_colorizes_additions(self, renderer):
        """diff 中以 '+' 開頭的行應使用綠色。"""
        diff_text = "+added line\n unchanged\n"
        result = renderer.render_diff("test.py", diff_text)

        assert "added line" in result
        # With color enabled, should contain the success (green) color code
        assert "\033[32m" in result  # green color for additions

    def test_render_diff_colorizes_deletions(self, renderer):
        """diff 中以 '-' 開頭的行應使用紅色。"""
        diff_text = "-removed line\n unchanged\n"
        result = renderer.render_diff("test.py", diff_text)

        assert "removed line" in result
        # With color enabled, should contain the error (red) color code
        assert "\033[31m" in result  # red color for deletions

    def test_render_diff_shows_filename(self, renderer):
        """diff 視圖應顯示文件名。"""
        result = renderer.render_diff("main.py", "+new line\n")

        assert "main.py" in result

    def test_render_diff_no_color(self, no_color_renderer):
        """禁用顏色時，diff 不應包含 ANSI 碼。"""
        diff_text = "+added\n-removed\n unchanged\n"
        result = no_color_renderer.render_diff("test.py", diff_text)

        assert "\033[" not in result
        assert "added" in result
        assert "removed" in result


# ======================================================================
# render_progress tests
# ======================================================================


class TestRenderProgress:
    """Tests for CLIRenderer.render_progress."""

    def test_render_progress_shows_bar(self, renderer):
        """進度條應顯示填充和空白部分。"""
        result = renderer.render_progress("Processing...", 5, 10)

        assert "Processing" in result
        assert "50%" in result
        assert "5/10" in result or "5" in result

    def test_render_progress_zero_total(self, renderer):
        """total 為 0 時不應報錯。"""
        result = renderer.render_progress("Idle", 0, 0)

        assert "Idle" in result
        assert "0%" in result

    def test_render_progress_complete(self, renderer):
        """完成時應顯示 100%。"""
        result = renderer.render_progress("Done", 10, 10)

        assert "100%" in result


# ======================================================================
# render_welcome tests
# ======================================================================


class TestRenderWelcome:
    """Tests for CLIRenderer.render_welcome."""

    def test_render_welcome_shows_version(self, renderer):
        """歡迎畫面應包含版本號。"""
        result = renderer.render_welcome("1.0.0", "claude-sonnet-4-20250514")

        assert "1.0.0" in result

    def test_render_welcome_shows_model(self, renderer):
        """歡迎畫面應包含模型名稱。"""
        result = renderer.render_welcome("1.0.0", "claude-sonnet-4-20250514")

        assert "claude-sonnet-4-20250514" in result


# ======================================================================
# Color and truncate tests
# ======================================================================


class TestColorAndTruncate:
    """Tests for color disable and truncation."""

    def test_color_disabled_no_ansi(self, no_color_renderer):
        """禁用顏色後，所有輸出不應包含 ANSI 碼。"""
        captured = StringIO()
        with patch("sys.stdout", captured):
            no_color_renderer.render_streaming_text("plain text")

        output = captured.getvalue()
        assert "\033[" not in output

    def test_truncate_long_output(self, renderer):
        """超長文字應被截斷並附加 '...'。"""
        long_text = "x" * 200
        result = renderer._truncate(long_text, max_len=50)

        assert len(result) == 50
        assert result.endswith("...")
