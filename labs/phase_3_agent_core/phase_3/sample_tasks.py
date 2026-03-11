"""示範任務 — 五個預設的 Agent 任務供測試與學習使用。

這些任務展示了 Agent Loop 的典型使用場景，從簡單的問答到複雜的多步驟任務。
每個任務都包含描述、預期步驟和驗收標準。

學生可以用這些任務來測試自己實現的 Agent Loop。
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class SampleTask:
    """一個示範任務的定義。

    Attributes:
        name: 任務名稱。
        description: 任務描述（這是給 Agent 的 prompt）。
        expected_tools: 預期會用到的工具列表。
        expected_min_steps: 預期的最少步驟數。
        expected_max_steps: 預期的最多步驟數。
        success_criteria: 驗收標準描述。
    """
    name: str = ""
    description: str = ""
    expected_tools: list[str] = field(default_factory=list)
    expected_min_steps: int = 1
    expected_max_steps: int = 10
    success_criteria: str = ""


# ---------------------------------------------------------------------------
# Task 1: 簡單問答 (No tools needed)
# ---------------------------------------------------------------------------

TASK_SIMPLE_QA = SampleTask(
    name="Simple Q&A",
    description=(
        "請用繁體中文解釋什麼是 ReAct (Reason + Act) 模式，"
        "以及它在 AI Agent 設計中的作用。"
        "回答控制在 200 字以內。"
    ),
    expected_tools=[],
    expected_min_steps=1,
    expected_max_steps=1,
    success_criteria="Agent 直接用文字回答，不調用任何工具，回答涵蓋 ReAct 的核心概念。",
)


# ---------------------------------------------------------------------------
# Task 2: 單工具調用 (Read file)
# ---------------------------------------------------------------------------

TASK_READ_FILE = SampleTask(
    name="Read and Analyze File",
    description=(
        "請讀取 /tmp/sample_code.py 這個文件，"
        "然後告訴我這個文件定義了哪些函數，每個函數的作用是什麼。"
    ),
    expected_tools=["read_file"],
    expected_min_steps=2,
    expected_max_steps=3,
    success_criteria="Agent 成功調用 read_file，正確列出文件中的函數及其功能。",
)


# ---------------------------------------------------------------------------
# Task 3: 多步驟任務 (Read → Analyze → Write)
# ---------------------------------------------------------------------------

TASK_MULTI_STEP = SampleTask(
    name="Multi-step Code Task",
    description=(
        "請完成以下任務：\n"
        "1. 讀取 /tmp/calculator.py 的內容\n"
        "2. 找出代碼中的 bug\n"
        "3. 將修復後的代碼寫入 /tmp/calculator_fixed.py\n"
        "4. 用 run_tests 工具驗證修復是否正確\n"
    ),
    expected_tools=["read_file", "write_file", "run_tests"],
    expected_min_steps=4,
    expected_max_steps=8,
    success_criteria=(
        "Agent 完成所有步驟：讀取→分析→修復→驗證。"
        "如果測試失敗，Agent 應該嘗試修正。"
    ),
)


# ---------------------------------------------------------------------------
# Task 4: 錯誤恢復場景
# ---------------------------------------------------------------------------

TASK_ERROR_RECOVERY = SampleTask(
    name="Error Recovery Challenge",
    description=(
        "請讀取 /tmp/nonexistent_file.py 的內容。\n"
        "如果文件不存在，請嘗試搜索 /tmp 目錄下所有 .py 文件，"
        "找到一個可能相關的文件並讀取它的內容。"
    ),
    expected_tools=["read_file", "search_files"],
    expected_min_steps=2,
    expected_max_steps=5,
    success_criteria=(
        "Agent 遇到第一個文件不存在的錯誤後，"
        "自動切換策略搜索其他文件。展示錯誤恢復能力。"
    ),
)


# ---------------------------------------------------------------------------
# Task 5: 需要權限確認的操作
# ---------------------------------------------------------------------------

TASK_PERMISSION_REQUIRED = SampleTask(
    name="Permission-Sensitive Task",
    description=(
        "請完成以下任務：\n"
        "1. 讀取 /tmp/config.json 的內容（讀取操作）\n"
        "2. 修改配置中的 debug 欄位為 true\n"
        "3. 將修改後的配置寫回 /tmp/config.json\n"
        "4. 刪除 /tmp/config.json.bak 備份文件\n"
    ),
    expected_tools=["read_file", "write_file", "delete_file"],
    expected_min_steps=3,
    expected_max_steps=6,
    success_criteria=(
        "讀取操作自動通過。寫入操作觸發確認提示。"
        "刪除操作觸發確認提示（高風險）。"
    ),
)


# All sample tasks as a list
ALL_SAMPLE_TASKS = [
    TASK_SIMPLE_QA,
    TASK_READ_FILE,
    TASK_MULTI_STEP,
    TASK_ERROR_RECOVERY,
    TASK_PERMISSION_REQUIRED,
]
