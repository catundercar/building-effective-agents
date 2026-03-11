"""Lab 1 測試: Tool Registry — 註冊、驗證、發現。

測試覆蓋:
- register: 基本註冊、驗證（名稱、描述、重複、格式）
- unregister: 正常取消、不存在的工具
- validate_schema: JSON Schema 驗證
- load_from_directory: 目錄自動加載
"""

from __future__ import annotations

import textwrap
from pathlib import Path

import pytest

from phase_1.registry import ToolRegistry
from phase_1.types import (
    JSONSchema,
    ToolDefinition,
    ToolHandler,
)


# ======================================================================
# Helpers
# ======================================================================

def _make_handler(
    name: str = "test_tool",
    description: str = "A test tool for testing.",
    properties: dict | None = None,
    required: list | None = None,
) -> ToolHandler:
    """Create a valid ToolHandler for testing."""
    return ToolHandler(
        definition=ToolDefinition(
            name=name,
            description=description,
            input_schema=JSONSchema(
                type="object",
                properties=properties or {
                    "input": {"type": "string", "description": "Test input"},
                },
                required=required or ["input"],
            ),
        ),
        execute=lambda args: f"executed with {args}",
    )


# ======================================================================
# Register tests
# ======================================================================

class TestRegister:
    """Tests for ToolRegistry.register."""

    def test_should_register_valid_tool(self):
        """有效的工具應該成功註冊。"""
        registry = ToolRegistry()
        handler = _make_handler(name="read_file", description="Read a file.")
        registry.register(handler)

        assert registry.size == 1
        assert registry.has("read_file")
        assert registry.get("read_file") is handler

    def test_should_reject_empty_name(self):
        """空名稱應被拒絕。"""
        registry = ToolRegistry()
        handler = _make_handler(name="", description="A tool.")

        with pytest.raises(ValueError, match="name"):
            registry.register(handler)

    def test_should_reject_empty_description(self):
        """空描述應被拒絕。"""
        registry = ToolRegistry()
        handler = _make_handler(name="my_tool", description="")

        with pytest.raises(ValueError, match="description"):
            registry.register(handler)

    def test_should_reject_duplicate_name(self):
        """重複名稱應被拒絕。"""
        registry = ToolRegistry()
        handler1 = _make_handler(name="read_file", description="Read a file v1.")
        handler2 = _make_handler(name="read_file", description="Read a file v2.")

        registry.register(handler1)
        with pytest.raises(ValueError, match="already registered|exist"):
            registry.register(handler2)

    def test_should_reject_invalid_name_format(self):
        """不合法的名稱格式應被拒絕（必須是 snake_case）。"""
        registry = ToolRegistry()
        handler = _make_handler(name="ReadFile", description="Read a file.")

        with pytest.raises(ValueError, match="name"):
            registry.register(handler)

    def test_should_reject_invalid_schema_type(self):
        """input_schema.type 不是 "object" 時應被拒絕。"""
        registry = ToolRegistry()
        handler = _make_handler(name="my_tool", description="A tool.")
        handler.definition.input_schema.type = "string"

        with pytest.raises(ValueError, match="schema|type"):
            registry.register(handler)

    def test_should_register_multiple_tools(self):
        """應能註冊多個不同的工具。"""
        registry = ToolRegistry()
        for i in range(5):
            handler = _make_handler(
                name=f"tool_{i}",
                description=f"Tool number {i}."
            )
            registry.register(handler)

        assert registry.size == 5
        assert set(registry.list_names()) == {f"tool_{i}" for i in range(5)}


# ======================================================================
# Unregister tests
# ======================================================================

class TestUnregister:
    """Tests for ToolRegistry.unregister."""

    def test_should_unregister_existing_tool(self):
        """應能取消註冊已有的工具。"""
        registry = ToolRegistry()
        registry.register(_make_handler(name="read_file", description="Read."))
        assert registry.size == 1

        registry.unregister("read_file")
        assert registry.size == 0
        assert not registry.has("read_file")

    def test_should_raise_for_nonexistent_tool(self):
        """取消不存在的工具應拋出 KeyError。"""
        registry = ToolRegistry()

        with pytest.raises(KeyError):
            registry.unregister("nonexistent")


# ======================================================================
# Validate Schema tests
# ======================================================================

class TestValidateSchema:
    """Tests for ToolRegistry.validate_schema."""

    def test_should_pass_valid_schema(self):
        """有效的 schema 應通過驗證。"""
        registry = ToolRegistry()
        definition = ToolDefinition(
            name="test_tool",
            description="A test tool.",
            input_schema=JSONSchema(
                type="object",
                properties={
                    "path": {"type": "string", "description": "File path"},
                },
                required=["path"],
            ),
        )
        errors = registry.validate_schema(definition)
        assert errors == []

    def test_should_detect_wrong_schema_type(self):
        """非 "object" 的 schema type 應報錯。"""
        registry = ToolRegistry()
        definition = ToolDefinition(
            name="test_tool",
            description="A test tool.",
            input_schema=JSONSchema(type="string"),
        )
        errors = registry.validate_schema(definition)
        assert len(errors) > 0
        assert any("object" in e.lower() or "type" in e.lower() for e in errors)

    def test_should_detect_missing_required_in_properties(self):
        """required 中的字段不在 properties 中應報錯。"""
        registry = ToolRegistry()
        definition = ToolDefinition(
            name="test_tool",
            description="A test tool.",
            input_schema=JSONSchema(
                type="object",
                properties={
                    "path": {"type": "string", "description": "File path"},
                },
                required=["path", "missing_field"],
            ),
        )
        errors = registry.validate_schema(definition)
        assert len(errors) > 0
        assert any("missing_field" in e for e in errors)

    def test_should_detect_property_without_type(self):
        """property 缺少 "type" 字段應報錯。"""
        registry = ToolRegistry()
        definition = ToolDefinition(
            name="test_tool",
            description="A test tool.",
            input_schema=JSONSchema(
                type="object",
                properties={
                    "path": {"description": "File path"},  # missing "type"
                },
                required=["path"],
            ),
        )
        errors = registry.validate_schema(definition)
        assert len(errors) > 0

    def test_should_detect_property_without_description(self):
        """property 缺少 "description" 字段應報錯。"""
        registry = ToolRegistry()
        definition = ToolDefinition(
            name="test_tool",
            description="A test tool.",
            input_schema=JSONSchema(
                type="object",
                properties={
                    "path": {"type": "string"},  # missing "description"
                },
                required=["path"],
            ),
        )
        errors = registry.validate_schema(definition)
        assert len(errors) > 0


# ======================================================================
# Load from directory tests
# ======================================================================

class TestLoadFromDirectory:
    """Tests for ToolRegistry.load_from_directory."""

    def test_should_load_tools_from_directory(self, tmp_path: Path):
        """應從目錄中自動加載工具模塊。"""
        # Create a tool module file
        tool_file = tmp_path / "greet_tool.py"
        tool_file.write_text(textwrap.dedent("""\
            import sys
            sys.path.insert(0, "%s")
            from phase_1.types import ToolDefinition, ToolHandler, JSONSchema

            tool_handler = ToolHandler(
                definition=ToolDefinition(
                    name="greet",
                    description="Greet a user by name.",
                    input_schema=JSONSchema(
                        type="object",
                        properties={
                            "name": {"type": "string", "description": "User name"},
                        },
                        required=["name"],
                    ),
                ),
                execute=lambda args: f"Hello, {args['name']}!",
            )
        """ % str(Path(__file__).parent.parent)))

        registry = ToolRegistry()
        loaded = registry.load_from_directory(tmp_path)

        assert loaded == 1
        assert registry.has("greet")

    def test_should_skip_files_without_handler(self, tmp_path: Path):
        """沒有 tool_handler 的 .py 文件應被跳過。"""
        (tmp_path / "utils.py").write_text("def helper(): pass\n")

        registry = ToolRegistry()
        loaded = registry.load_from_directory(tmp_path)
        assert loaded == 0

    def test_should_skip_init_files(self, tmp_path: Path):
        """__init__.py 應被跳過。"""
        (tmp_path / "__init__.py").write_text("")

        registry = ToolRegistry()
        loaded = registry.load_from_directory(tmp_path)
        assert loaded == 0
