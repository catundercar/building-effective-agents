"""Lab 2 測試: 文件系統工具 — 讀、寫、列目錄、搜索、編輯。

測試覆蓋:
- read_file: 基本讀取、行號、範圍讀取、不存在的文件、非絕對路徑
- write_file: 覆蓋寫入、追加模式、自動創建目錄
- list_directory: 基本列目錄、遞歸、glob 過濾
- search_files: 文件名搜索、內容搜索
- edit_file: 精確替換、不存在的字串、歧義替換
- 路徑安全: 沙箱限制、路徑穿越防護
"""

from __future__ import annotations

from pathlib import Path

import pytest

from phase_1.file_tools import FileTools
from phase_1.types import FileToolConfig


# ======================================================================
# Fixtures
# ======================================================================

@pytest.fixture
def sandbox(tmp_path: Path) -> Path:
    """Create a sandbox directory with sample files."""
    # Create sample files
    (tmp_path / "hello.py").write_text("def hello():\n    print('hello')\n")
    (tmp_path / "world.py").write_text("def world():\n    print('world')\n")
    (tmp_path / "readme.md").write_text("# Test Project\n\nThis is a test.\n")

    # Create a subdirectory
    sub = tmp_path / "src"
    sub.mkdir()
    (sub / "main.py").write_text("from hello import hello\n\nhello()\n")
    (sub / "utils.py").write_text("def add(a, b):\n    return a + b\n")

    return tmp_path


@pytest.fixture
def file_tools(sandbox: Path) -> FileTools:
    """Create FileTools with sandbox configuration."""
    return FileTools(FileToolConfig(sandbox_dir=str(sandbox)))


# ======================================================================
# read_file tests
# ======================================================================

class TestReadFile:
    """Tests for FileTools.read_file."""

    def test_should_read_file_with_line_numbers(self, file_tools: FileTools, sandbox: Path):
        """應讀取文件並顯示行號。"""
        result = file_tools.read_file(str(sandbox / "hello.py"))
        assert not result.is_error
        assert "1 |" in result.content or "1|" in result.content
        assert "hello" in result.content

    def test_should_read_with_offset_and_limit(self, file_tools: FileTools, sandbox: Path):
        """應支持 offset 和 limit 參數。"""
        # Write a multi-line file
        multi = sandbox / "multi.py"
        multi.write_text("\n".join(f"line {i}" for i in range(1, 11)))

        result = file_tools.read_file(str(multi), offset=3, limit=2)
        assert not result.is_error
        assert "line 3" in result.content
        assert "line 4" in result.content
        assert "line 1" not in result.content
        assert "line 5" not in result.content

    def test_should_error_on_nonexistent_file(self, file_tools: FileTools, sandbox: Path):
        """不存在的文件應返回錯誤。"""
        result = file_tools.read_file(str(sandbox / "nonexistent.py"))
        assert result.is_error

    def test_should_error_on_relative_path(self, file_tools: FileTools):
        """相對路徑應被拒絕。"""
        result = file_tools.read_file("hello.py")
        assert result.is_error

    def test_should_error_on_path_outside_sandbox(self, file_tools: FileTools):
        """沙箱外的路徑應被拒絕。"""
        result = file_tools.read_file("/etc/passwd")
        assert result.is_error

    def test_should_error_on_file_too_large(self, file_tools: FileTools, sandbox: Path):
        """超過 max_file_size 的文件應返回錯誤。"""
        big_file = sandbox / "big.bin"
        # Write a file exceeding the default 1MB limit
        big_file.write_bytes(b"x" * (1_048_576 + 1))
        result = file_tools.read_file(str(big_file))
        assert result.is_error


# ======================================================================
# write_file tests
# ======================================================================

class TestWriteFile:
    """Tests for FileTools.write_file."""

    def test_should_write_new_file(self, file_tools: FileTools, sandbox: Path):
        """應能寫入新文件。"""
        path = str(sandbox / "new_file.txt")
        result = file_tools.write_file(path, "Hello World")
        assert not result.is_error
        assert Path(path).read_text() == "Hello World"

    def test_should_overwrite_existing_file(self, file_tools: FileTools, sandbox: Path):
        """應能覆蓋已有文件。"""
        path = str(sandbox / "hello.py")
        result = file_tools.write_file(path, "new content")
        assert not result.is_error
        assert Path(path).read_text() == "new content"

    def test_should_append_to_file(self, file_tools: FileTools, sandbox: Path):
        """追加模式應在文件末尾添加內容。"""
        path = str(sandbox / "hello.py")
        original = Path(path).read_text()
        result = file_tools.write_file(path, "\n# appended", append=True)
        assert not result.is_error
        assert Path(path).read_text() == original + "\n# appended"

    def test_should_create_parent_directories(self, file_tools: FileTools, sandbox: Path):
        """應自動創建不存在的父目錄。"""
        path = str(sandbox / "deep" / "nested" / "file.txt")
        result = file_tools.write_file(path, "deep content")
        assert not result.is_error
        assert Path(path).read_text() == "deep content"

    def test_should_error_on_relative_path(self, file_tools: FileTools):
        """相對路徑應被拒絕。"""
        result = file_tools.write_file("hello.py", "content")
        assert result.is_error

    def test_should_error_on_path_outside_sandbox(self, file_tools: FileTools):
        """沙箱外的路徑應被拒絕。"""
        result = file_tools.write_file("/tmp/evil.py", "content")
        assert result.is_error


# ======================================================================
# list_directory tests
# ======================================================================

class TestListDirectory:
    """Tests for FileTools.list_directory."""

    def test_should_list_directory_contents(self, file_tools: FileTools, sandbox: Path):
        """應列出目錄中的文件和子目錄。"""
        result = file_tools.list_directory(str(sandbox))
        assert not result.is_error
        assert "hello.py" in result.content
        assert "world.py" in result.content
        assert "src/" in result.content or "src" in result.content

    def test_should_list_recursively(self, file_tools: FileTools, sandbox: Path):
        """遞歸模式應列出子目錄中的文件。"""
        result = file_tools.list_directory(str(sandbox), recursive=True)
        assert not result.is_error
        assert "main.py" in result.content

    def test_should_filter_by_pattern(self, file_tools: FileTools, sandbox: Path):
        """應支持 glob 模式過濾。"""
        result = file_tools.list_directory(str(sandbox), pattern="*.py")
        assert not result.is_error
        assert "hello.py" in result.content
        assert "readme.md" not in result.content

    def test_should_error_on_nonexistent_directory(self, file_tools: FileTools, sandbox: Path):
        """不存在的目錄應返回錯誤。"""
        result = file_tools.list_directory(str(sandbox / "nonexistent"))
        assert result.is_error


# ======================================================================
# search_files tests
# ======================================================================

class TestSearchFiles:
    """Tests for FileTools.search_files."""

    def test_should_search_by_filename_pattern(self, file_tools: FileTools, sandbox: Path):
        """應能按文件名模式搜索。"""
        result = file_tools.search_files(str(sandbox), pattern="*.py")
        assert not result.is_error
        assert "hello.py" in result.content

    def test_should_search_by_content(self, file_tools: FileTools, sandbox: Path):
        """應能按內容搜索。"""
        result = file_tools.search_files(
            str(sandbox), pattern="**/*.py", content_match="print"
        )
        assert not result.is_error
        assert "hello.py" in result.content

    def test_should_show_line_numbers_for_content_match(
        self, file_tools: FileTools, sandbox: Path
    ):
        """內容匹配應顯示行號。"""
        result = file_tools.search_files(
            str(sandbox), pattern="**/*.py", content_match="print"
        )
        assert not result.is_error
        # Should contain line number in the format path:line_no: content
        assert ":" in result.content


# ======================================================================
# edit_file tests
# ======================================================================

class TestEditFile:
    """Tests for FileTools.edit_file."""

    def test_should_replace_unique_string(self, file_tools: FileTools, sandbox: Path):
        """應能替換文件中唯一的字串。"""
        path = str(sandbox / "hello.py")
        result = file_tools.edit_file(path, "print('hello')", "print('hi')")
        assert not result.is_error
        assert "print('hi')" in Path(path).read_text()

    def test_should_error_when_string_not_found(self, file_tools: FileTools, sandbox: Path):
        """字串不存在時應返回錯誤。"""
        path = str(sandbox / "hello.py")
        result = file_tools.edit_file(path, "nonexistent string", "replacement")
        assert result.is_error

    def test_should_error_when_string_is_ambiguous(self, file_tools: FileTools, sandbox: Path):
        """字串出現多次時應返回錯誤（歧義）。"""
        path = str(sandbox / "ambiguous.py")
        (sandbox / "ambiguous.py").write_text("aaa\naaa\nbbb\n")
        result = file_tools.edit_file(path, "aaa", "ccc")
        assert result.is_error
        assert "ambiguous" in result.content.lower() or "2" in result.content
