"""Phase 1 類型定義 — Tool 系統的所有資料結構和類型別名。

本文件定義了整個 Phase 1 使用的核心資料結構。
學生不需要修改此文件，只需閱讀並理解每個類型的用途。

與 Phase 0 的 types.py 相比，這裡增加了：
- ToolValidationError: 工具驗證錯誤
- ToolResult: 工具執行結果（結構化）
- FileToolConfig / ShellToolConfig: 工具配置
- ShellResult: Shell 命令執行結果
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Literal


# ---------------------------------------------------------------------------
# Tool system types (shared with Phase 0)
# ---------------------------------------------------------------------------

@dataclass
class JSONSchema:
    """JSON Schema for tool input parameters."""
    type: Literal["object"] = "object"
    properties: dict[str, dict[str, Any]] = field(default_factory=dict)
    required: list[str] = field(default_factory=list)


@dataclass
class ToolDefinition:
    """Tool 定義，包含名稱、描述和輸入 schema。

    一個好的 ToolDefinition 包含：
    - 清晰的 name（snake_case，動詞開頭）
    - 詳盡的 description（含用途、示例、注意事項）
    - 精確的 input_schema（JSON Schema 格式）
    """
    name: str = ""
    description: str = ""
    input_schema: JSONSchema = field(default_factory=JSONSchema)


@dataclass
class ToolHandler:
    """Tool 處理器，包含定義和執行函數。"""
    definition: ToolDefinition = field(default_factory=ToolDefinition)
    execute: Callable[[dict[str, Any]], str] = field(
        default_factory=lambda: lambda _: ""
    )


# ---------------------------------------------------------------------------
# Tool result types
# ---------------------------------------------------------------------------

@dataclass
class ToolResult:
    """Tool 執行的結構化結果。

    與 Phase 0 的 ToolResultBlock 不同，這是工具內部使用的結果結構，
    包含更多的元數據（如執行時間）。
    """
    content: str = ""
    is_error: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# File tool types
# ---------------------------------------------------------------------------

@dataclass
class FileToolConfig:
    """文件工具的配置。

    sandbox_dir: 允許操作的根目錄。所有文件操作都限制在此目錄內。
                 設為 None 表示不限制（不推薦用於生產環境）。
    max_file_size: 最大可讀取的文件大小（bytes）。
    create_dirs: write_file 時如果目錄不存在是否自動創建。
    """
    sandbox_dir: str | None = None
    max_file_size: int = 1_048_576  # 1 MB
    create_dirs: bool = True


# ---------------------------------------------------------------------------
# Shell tool types
# ---------------------------------------------------------------------------

@dataclass
class ShellResult:
    """Shell 命令執行結果。"""
    stdout: str = ""
    stderr: str = ""
    exit_code: int = 0
    timed_out: bool = False


@dataclass
class ShellToolConfig:
    """Shell 工具的配置。

    timeout_seconds: 命令執行超時時間（秒）。
    max_output_bytes: stdout/stderr 最大捕獲長度。超出時截斷。
    blocked_commands: 被禁止執行的命令列表（如 rm -rf /）。
    allowed_cwd: 允許設為工作目錄的路徑。None 表示不限制。
    env_overrides: 強制設置的環境變量，覆蓋子進程繼承的環境。
    """
    timeout_seconds: int = 30
    max_output_bytes: int = 10_240  # 10 KB
    blocked_commands: list[str] = field(default_factory=lambda: [
        "rm -rf /",
        "rm -rf /*",
        "rm -rf ~",
        "sudo rm",
        "mkfs",
        "dd if=/dev",
        ":(){:|:&};:",
        "chmod -R 777 /",
    ])
    allowed_cwd: str | None = None
    env_overrides: dict[str, str] = field(default_factory=dict)
