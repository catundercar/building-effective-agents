"""示範 Tool — 三個範例工具供測試與學習使用。

這些工具展示了 Anthropic Tool Use 的標準模式：
每個 Tool 都有一個 ToolDefinition（JSON Schema）和一個 execute 函數。

學生可以參考這些範例來創建自己的 Tool。
"""

from __future__ import annotations

import ast
import json
from pathlib import Path
from typing import Any

from .types import JSONSchema, ToolDefinition, ToolHandler


# ---------------------------------------------------------------------------
# Tool 1: 天氣查詢（mock 資料）
# ---------------------------------------------------------------------------

def _execute_weather(input_data: dict[str, Any]) -> str:
    """查詢天氣 — 使用模擬數據。"""
    location = input_data.get("location", "unknown")

    # Mock weather data
    mock_data = {
        "tokyo": {"temperature": 22, "condition": "晴天", "humidity": 45},
        "taipei": {"temperature": 28, "condition": "多雲", "humidity": 75},
        "new york": {"temperature": 15, "condition": "陰天", "humidity": 60},
        "london": {"temperature": 12, "condition": "小雨", "humidity": 80},
        "san francisco": {"temperature": 18, "condition": "霧", "humidity": 70},
    }

    weather = mock_data.get(location.lower())
    if weather is None:
        return json.dumps(
            {"error": f"找不到 {location} 的天氣資料"},
            ensure_ascii=False,
        )

    return json.dumps(
        {
            "location": location,
            "temperature": weather["temperature"],
            "condition": weather["condition"],
            "humidity": weather["humidity"],
            "unit": "celsius",
        },
        ensure_ascii=False,
    )


weather_tool = ToolHandler(
    definition=ToolDefinition(
        name="get_weather",
        description="查詢指定城市的當前天氣狀況（使用模擬數據）。",
        input_schema=JSONSchema(
            type="object",
            properties={
                "location": {
                    "type": "string",
                    "description": "城市名稱，例如 'Tokyo', 'Taipei', 'New York'",
                },
            },
            required=["location"],
        ),
    ),
    execute=_execute_weather,
)


# ---------------------------------------------------------------------------
# Tool 2: 讀取文件
# ---------------------------------------------------------------------------

def _execute_read_file(input_data: dict[str, Any]) -> str:
    """讀取指定路徑的文件內容。"""
    file_path = input_data.get("path", "")

    if not file_path:
        return json.dumps({"error": "path 參數不能為空"}, ensure_ascii=False)

    path = Path(file_path)

    # Security check: must be absolute path
    if not path.is_absolute():
        return json.dumps(
            {"error": f"必須使用絕對路徑，收到的是: {file_path}"},
            ensure_ascii=False,
        )

    if not path.exists():
        return json.dumps(
            {"error": f"文件不存在: {file_path}"},
            ensure_ascii=False,
        )

    if not path.is_file():
        return json.dumps(
            {"error": f"路徑不是文件: {file_path}"},
            ensure_ascii=False,
        )

    try:
        content = path.read_text(encoding="utf-8")
        # Truncate very large files
        max_chars = 10_000
        if len(content) > max_chars:
            content = content[:max_chars] + f"\n\n... (truncated, total {len(content)} chars)"
        return json.dumps(
            {"path": file_path, "content": content},
            ensure_ascii=False,
        )
    except Exception as e:
        return json.dumps({"error": f"讀取文件失敗: {e}"}, ensure_ascii=False)


read_file_tool = ToolHandler(
    definition=ToolDefinition(
        name="read_file",
        description="讀取指定絕對路徑的文件內容。路徑必須是絕對路徑。",
        input_schema=JSONSchema(
            type="object",
            properties={
                "path": {
                    "type": "string",
                    "description": "要讀取的文件的絕對路徑",
                },
            },
            required=["path"],
        ),
    ),
    execute=_execute_read_file,
)


# ---------------------------------------------------------------------------
# Tool 3: 計算器
# ---------------------------------------------------------------------------

def _execute_calculator(input_data: dict[str, Any]) -> str:
    """安全地計算數學表達式。"""
    expression = input_data.get("expression", "")

    if not expression:
        return json.dumps(
            {"error": "expression 參數不能為空"},
            ensure_ascii=False,
        )

    try:
        # Use ast.literal_eval for simple expressions,
        # fall back to compile + eval with restricted builtins for math
        # Safety: only allow math operations, no function calls or imports
        allowed_names = {"__builtins__": {}}
        code = compile(expression, "<calculator>", "eval")

        # Check for unsafe operations
        for name in code.co_names:
            if name not in ("True", "False", "None"):
                return json.dumps(
                    {"error": f"不允許的操作: {name}"},
                    ensure_ascii=False,
                )

        result = eval(code, allowed_names)  # noqa: S307
        return json.dumps(
            {"expression": expression, "result": result},
            ensure_ascii=False,
        )
    except (SyntaxError, TypeError, ZeroDivisionError) as e:
        return json.dumps(
            {"error": f"計算錯誤: {e}"},
            ensure_ascii=False,
        )
    except Exception as e:
        return json.dumps(
            {"error": f"未知錯誤: {e}"},
            ensure_ascii=False,
        )


calculator_tool = ToolHandler(
    definition=ToolDefinition(
        name="calculator",
        description="安全地計算數學表達式。支持加減乘除、乘方等基本運算。",
        input_schema=JSONSchema(
            type="object",
            properties={
                "expression": {
                    "type": "string",
                    "description": "數學表達式，例如 '2 + 3 * 4' 或 '2 ** 10'",
                },
            },
            required=["expression"],
        ),
    ),
    execute=_execute_calculator,
)


# Convenience: all sample tools as a list
ALL_SAMPLE_TOOLS = [weather_tool, read_file_tool, calculator_tool]
