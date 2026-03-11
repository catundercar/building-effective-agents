"""Lab 1: CLI 渲染器 — 打造專業的終端輸出體驗。

本模組實現了 CLI 渲染器，支持：
- 串流文字渲染（帶游標動畫）
- 工具調用卡片渲染
- 彩色 diff 視圖
- 進度指示器
- 歡迎畫面

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

import sys
from typing import Any

from .types import CLITheme, DisplayConfig, RenderableBlock

# ANSI escape codes
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
ITALIC = "\033[3m"
UNDERLINE = "\033[4m"


class CLIRenderer:
    """CLI 渲染器，負責所有終端輸出的格式化與顯示。"""

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def __init__(self, config: DisplayConfig | None = None) -> None:
        """初始化渲染器。

        設置顯示配置和主題。如果未提供 config，使用預設值。
        渲染器應維護一個內部的 CLITheme 實例（使用 create_dark_theme()）。

        Args:
            config: 可選的顯示配置
        """
        # HINT: 1. 如果 config 為 None，建立預設的 DisplayConfig
        # HINT: 2. 儲存 config 到 self.config
        # HINT: 3. 使用 create_dark_theme() 建立主題並儲存到 self.theme
        raise NotImplementedError("TODO: Implement __init__")

    def render_streaming_text(self, text_delta: str) -> str:
        """渲染串流文字增量。

        將 LLM 串流輸出的文字增量渲染到終端。
        如果啟用顏色，使用主題的 text_color 上色。
        返回格式化後的字串（同時印出到 stdout）。

        Args:
            text_delta: LLM 串流輸出的文字片段

        Returns:
            格式化後的文字字串
        """
        # HINT: 1. 如果 color_enabled，使用 _colorize 上色
        # HINT: 2. 使用 sys.stdout.write 輸出（不換行）
        # HINT: 3. 使用 sys.stdout.flush() 確保即時顯示
        # HINT: 4. 返回格式化後的字串
        raise NotImplementedError("TODO: Implement render_streaming_text")

    def render_tool_call(
        self,
        tool_name: str,
        tool_input: dict[str, Any],
        result: str,
    ) -> str:
        """渲染工具調用卡片。

        將工具的名稱、輸入參數和執行結果格式化為一個可視化的卡片。
        卡片包含頂部邊框、工具名稱行、輸入參數和結果內容。

        格式範例:
            ┌─ Tool: read_file ─────────────────────┐
            │ Input:
            │   path: /src/main.py
            │ Result:
            │   file content here...
            └───────────────────────────────────────┘

        Args:
            tool_name: 工具名稱
            tool_input: 工具輸入參數字典
            result: 工具執行結果字串

        Returns:
            格式化後的工具調用卡片字串
        """
        # HINT: 1. 如果 show_tool_details 為 False，返回簡短的摘要行
        # HINT: 2. 構建卡片頂部: f"┌─ Tool: {tool_name} " + "─" * padding + "┐"
        # HINT: 3. 格式化輸入參數: 遍歷 tool_input 字典
        # HINT: 4. 格式化結果: 使用 _truncate 截斷過長的結果
        # HINT: 5. 構建卡片底部: "└" + "─" * width + "┘"
        # HINT: 6. 如果 color_enabled，使用主題的 secondary_color 上色邊框
        # HINT: 7. 返回完整的卡片字串
        raise NotImplementedError("TODO: Implement render_tool_call")

    def render_diff(self, filename: str, diff_content: str) -> str:
        """渲染彩色 diff 視圖。

        將 unified diff 格式的內容渲染為彩色輸出。
        以 '+' 開頭的行（新增行）使用綠色，
        以 '-' 開頭的行（刪除行）使用紅色，
        其他行保持預設顏色。

        格式範例:
            ── diff: main.py ──────────────────────
            - old line
            + new line
              unchanged line

        Args:
            filename: 文件名稱
            diff_content: unified diff 格式的內容

        Returns:
            格式化後的 diff 字串
        """
        # HINT: 1. 構建標題行: f"── diff: {filename} " + "─" * padding
        # HINT: 2. 遍歷 diff_content 的每一行
        # HINT: 3. 以 '+' 開頭的行 → 使用 success_color（綠色）
        # HINT: 4. 以 '-' 開頭的行 → 使用 error_color（紅色）
        # HINT: 5. 其他行保持原樣
        # HINT: 6. 如果 color_enabled 為 False，跳過上色
        # HINT: 7. 返回所有行拼接的字串
        raise NotImplementedError("TODO: Implement render_diff")

    def render_progress(self, message: str, current: int, total: int) -> str:
        """渲染進度指示器。

        顯示一個帶有進度條的狀態行。

        格式範例:
            ⟳ Processing files... [████████░░░░░░░░] 50% (5/10)

        Args:
            message: 進度描述文字
            current: 當前完成數量
            total: 總數量

        Returns:
            格式化後的進度字串
        """
        # HINT: 1. 計算百分比: pct = current / total（注意 total 為 0 的情況）
        # HINT: 2. 計算進度條的填充長度（建議 bar_width = 20）
        # HINT: 3. 構建進度條: "█" * filled + "░" * empty
        # HINT: 4. 組合: f"⟳ {message} [{bar}] {pct}% ({current}/{total})"
        # HINT: 5. 如果 color_enabled，使用主題的 primary_color 上色
        # HINT: 6. 返回格式化後的字串
        raise NotImplementedError("TODO: Implement render_progress")

    def render_welcome(self, version: str, model: str) -> str:
        """渲染歡迎畫面。

        顯示應用程式的啟動 banner，包含版本號和模型名稱。

        格式範例:
            ╔══════════════════════════════════════════╗
            ║          Agent CLI v1.0.0                ║
            ║          Model: claude-sonnet-4-20250514        ║
            ╚══════════════════════════════════════════╝

        Args:
            version: 應用版本號
            model: 使用的 LLM 模型名稱

        Returns:
            格式化後的歡迎畫面字串
        """
        # HINT: 1. 定義 banner 寬度（建議 50 個字元）
        # HINT: 2. 構建頂部邊框: "╔" + "═" * width + "╗"
        # HINT: 3. 構建版本行: "║" + centered(f"Agent CLI v{version}") + "║"
        # HINT: 4. 構建模型行: "║" + centered(f"Model: {model}") + "║"
        # HINT: 5. 構建底部邊框: "╚" + "═" * width + "╝"
        # HINT: 6. 如果 color_enabled，使用 primary_color 上色邊框
        # HINT: 7. 返回完整的 banner 字串
        raise NotImplementedError("TODO: Implement render_welcome")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    def _colorize(self, text: str, color: str) -> str:
        """為文字加上 ANSI 顏色。（已實現）

        如果 color_enabled 為 False，則直接返回原始文字。

        Args:
            text: 原始文字
            color: ANSI 顏色碼

        Returns:
            上色後的文字
        """
        if not self.config.color_enabled:
            return text
        return f"{color}{text}{RESET}"

    def _truncate(self, text: str, max_len: int = 0) -> str:
        """截斷過長的文字。（已實現）

        如果 max_len 為 0，使用 config.max_width。

        Args:
            text: 原始文字
            max_len: 最大長度，0 表示使用 config.max_width

        Returns:
            截斷後的文字（超長時末尾加 '...'）
        """
        limit = max_len if max_len > 0 else self.config.max_width
        if len(text) <= limit:
            return text
        return text[: limit - 3] + "..."


def create_dark_theme() -> CLITheme:
    """建立暗色主題。（已實現）"""
    return CLITheme(
        name="dark",
        primary_color="\033[36m",       # cyan
        secondary_color="\033[34m",     # blue
        bg_color="\033[40m",            # black bg
        text_color="\033[37m",          # white text
        error_color="\033[31m",         # red
        success_color="\033[32m",       # green
    )


def create_light_theme() -> CLITheme:
    """建立亮色主題。（已實現）"""
    return CLITheme(
        name="light",
        primary_color="\033[34m",       # blue
        secondary_color="\033[35m",     # magenta
        bg_color="\033[47m",            # white bg
        text_color="\033[30m",          # black text
        error_color="\033[31m",         # red
        success_color="\033[32m",       # green
    )
