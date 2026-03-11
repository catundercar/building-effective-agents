"""Lab 2: 文件系統工具套件 — Agent 操作文件的完整工具集。

本模組實現了 Agent 操作文件系統的核心工具：
- read_file: 讀取文件內容（支持行號、範圍）
- write_file: 寫入文件（支持創建目錄）
- list_directory: 列出目錄內容
- search_files: 搜索文件（glob + 內容搜索）
- edit_file: 精確編輯文件（基於搜索替換）

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。

關鍵設計決策（來自 Anthropic SWE-bench 經驗）：
  始終使用絕對路徑。Agent 移出根目錄後使用相對路徑會導致大量錯誤。
  改為強制要求絕對路徑後，問題完全消失。
"""

from __future__ import annotations

import fnmatch
import os
from pathlib import Path
from typing import Any

from .types import (
    FileToolConfig,
    ToolResult,
)


class FileTools:
    """文件系統工具集 — 所有文件操作都在此類中實現。

    安全設計：
    1. 所有路徑必須是絕對路徑
    2. 如果配置了 sandbox_dir，所有操作限制在其中
    3. 防止路徑穿越攻擊（path traversal）
    """

    def __init__(self, config: FileToolConfig | None = None) -> None:
        self.config = config or FileToolConfig()

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def read_file(self, path: str, *, offset: int = 0, limit: int = 0) -> ToolResult:
        """讀取文件內容。

        讀取指定路徑的文件，返回帶行號的內容。

        Args:
            path: 文件的絕對路徑
            offset: 從第幾行開始讀取（0 表示從頭開始，1-indexed）
            limit: 最多讀取幾行（0 表示不限制）

        Returns:
            ToolResult: 帶行號的文件內容，或錯誤信息

        行號格式示例：
            1 | def hello():
            2 |     print("hello")
            3 |
        """
        # HINT: 1. 先調用 self._validate_path(path) 驗證路徑
        # HINT: 2. 檢查文件是否存在（Path(path).is_file()）
        # HINT: 3. 檢查文件大小是否超過 config.max_file_size
        # HINT: 4. 讀取文件內容，按行分割
        # HINT: 5. 如果 offset > 0，跳過前面的行（注意 1-indexed）
        # HINT: 6. 如果 limit > 0，只取指定數量的行
        # HINT: 7. 為每行添加行號前綴，格式: f"{line_no:>4} | {line}"
        # HINT: 8. 返回 ToolResult(content=formatted_content)
        # HINT: 9. 任何異常都捕獲並返回 ToolResult(content=str(e), is_error=True)
        raise NotImplementedError("TODO: Implement read_file")

    def write_file(self, path: str, content: str, *, append: bool = False) -> ToolResult:
        """寫入文件內容。

        將內容寫入指定路徑。支持覆蓋寫入和追加模式。
        如果目錄不存在且 config.create_dirs 為 True，自動創建。

        Args:
            path: 文件的絕對路徑
            content: 要寫入的內容
            append: 是否追加模式（True=追加，False=覆蓋）

        Returns:
            ToolResult: 成功信息或錯誤信息
        """
        # HINT: 1. 先調用 self._validate_path(path) 驗證路徑
        # HINT: 2. 如果 config.create_dirs 為 True，確保父目錄存在
        #          Path(path).parent.mkdir(parents=True, exist_ok=True)
        # HINT: 3. 根據 append 選擇寫入模式 ("a" or "w")
        # HINT: 4. 寫入文件
        # HINT: 5. 返回 ToolResult(content=f"Successfully wrote {n} bytes to {path}")
        # HINT: 6. 任何異常都捕獲並返回 ToolResult(content=str(e), is_error=True)
        raise NotImplementedError("TODO: Implement write_file")

    def list_directory(
        self, path: str, *, recursive: bool = False, pattern: str = "*"
    ) -> ToolResult:
        """列出目錄內容。

        列出指定目錄下的文件和子目錄。支持遞歸和 glob 過濾。

        Args:
            path: 目錄的絕對路徑
            recursive: 是否遞歸列出子目錄
            pattern: glob 過濾模式（如 "*.py"）

        Returns:
            ToolResult: 目錄列表（每行一個條目，目錄以 / 結尾）
        """
        # HINT: 1. 先調用 self._validate_path(path) 驗證路徑
        # HINT: 2. 檢查路徑是否為目錄（Path(path).is_dir()）
        # HINT: 3. 如果 recursive，使用 Path.rglob(pattern)
        #          否則使用 Path.glob(pattern)
        # HINT: 4. 對每個條目，構建相對於 path 的路徑字串
        #          如果是目錄，結尾加 "/"
        # HINT: 5. 排序結果
        # HINT: 6. 返回 ToolResult(content="\n".join(entries))
        raise NotImplementedError("TODO: Implement list_directory")

    def search_files(
        self, path: str, *, pattern: str = "**/*", content_match: str = ""
    ) -> ToolResult:
        """搜索文件。

        在指定目錄下搜索匹配的文件。支持文件名 glob 匹配和內容搜索。

        Args:
            path: 搜索根目錄的絕對路徑
            pattern: 文件名 glob 模式（如 "**/*.py"）
            content_match: 內容搜索字串（為空則只匹配文件名）

        Returns:
            ToolResult: 匹配的文件列表。如果有 content_match，
                       還包含匹配的行號和內容。

        輸出格式（僅文件名匹配）：
            /abs/path/file1.py
            /abs/path/file2.py

        輸出格式（含內容匹配）：
            /abs/path/file1.py:10: matched line content
            /abs/path/file1.py:25: another matched line
        """
        # HINT: 1. 先調用 self._validate_path(path) 驗證路徑
        # HINT: 2. 使用 Path(path).glob(pattern) 或 rglob 查找文件
        # HINT: 3. 過濾：只保留文件（不要目錄）
        # HINT: 4. 如果 content_match 為空，直接返回文件路徑列表
        # HINT: 5. 如果有 content_match，讀取每個文件的內容
        #          查找包含 content_match 的行
        #          格式: f"{file_path}:{line_no}: {line_content}"
        # HINT: 6. 用 try/except 跳過無法讀取的文件（二進制文件等）
        raise NotImplementedError("TODO: Implement search_files")

    def edit_file(self, path: str, old_string: str, new_string: str) -> ToolResult:
        """精確編輯文件。

        在文件中查找 old_string 並替換為 new_string。
        old_string 必須在文件中唯一匹配（避免歧義）。

        Args:
            path: 文件的絕對路徑
            old_string: 要查找的原始字串
            new_string: 替換後的字串

        Returns:
            ToolResult: 成功信息（含 diff 預覽）或錯誤信息
        """
        # HINT: 1. 先調用 self._validate_path(path) 驗證路徑
        # HINT: 2. 讀取文件內容
        # HINT: 3. 計算 old_string 在文件中出現的次數
        # HINT: 4. 如果出現 0 次 → 返回錯誤 "old_string not found"
        # HINT: 5. 如果出現 > 1 次 → 返回錯誤 "old_string is ambiguous (N matches)"
        # HINT: 6. 執行替換：content.replace(old_string, new_string, 1)
        # HINT: 7. 寫回文件
        # HINT: 8. 返回 ToolResult，包含替換的 diff 預覽
        raise NotImplementedError("TODO: Implement edit_file")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    def _validate_path(self, path: str) -> None:
        """驗證路徑的安全性。（已實現）

        檢查：
        1. 路徑必須是絕對路徑
        2. 如果配置了 sandbox_dir，路徑必須在其內

        Raises:
            ValueError: 路徑不是絕對路徑
            PermissionError: 路徑超出 sandbox 邊界
        """
        p = Path(path).resolve()

        if not p.is_absolute():
            raise ValueError(
                f"Path must be absolute. Got: {path}. "
                "Use absolute paths to avoid ambiguity — "
                "this is a lesson from Anthropic's SWE-bench experience."
            )

        if self.config.sandbox_dir:
            sandbox = Path(self.config.sandbox_dir).resolve()
            try:
                p.relative_to(sandbox)
            except ValueError:
                raise PermissionError(
                    f"Path '{path}' is outside sandbox directory '{self.config.sandbox_dir}'. "
                    "File operations are restricted to the sandbox for security."
                )

    def _format_with_line_numbers(self, content: str, start_line: int = 1) -> str:
        """為內容添加行號格式。（已實現）"""
        lines = content.splitlines()
        formatted = []
        for i, line in enumerate(lines, start=start_line):
            formatted.append(f"{i:>4} | {line}")
        return "\n".join(formatted)
