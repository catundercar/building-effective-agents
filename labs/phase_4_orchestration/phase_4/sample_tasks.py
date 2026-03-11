"""Phase 4 範例任務與評分標準 — 提供參考用例和測試資料。

本文件提供：
- 範例 Orchestrator 任務（用於測試任務分解）
- 範例 Rubric（用於測試評估系統）
- 範例 Eval 用例集合（用於測試評測框架）

學生不需要修改此文件，可直接在 CLI 或測試中使用。
"""

from __future__ import annotations

from .types import (
    EvalCase,
    Rubric,
    RubricItem,
    SubTask,
    OrchestratorPlan,
)


# ---------------------------------------------------------------------------
# Orchestrator sample tasks
# ---------------------------------------------------------------------------

SAMPLE_ORCHESTRATOR_TASKS = [
    {
        "name": "Refactor Authentication Module",
        "task": (
            "Refactor the authentication module to use JWT tokens instead of "
            "session cookies. Update the login endpoint, add token validation "
            "middleware, and update all tests."
        ),
        "files": [
            "/src/auth/login.py",
            "/src/auth/middleware.py",
            "/src/auth/tokens.py",
            "/tests/test_auth.py",
        ],
    },
    {
        "name": "Add Logging System",
        "task": (
            "Add structured logging throughout the application. Create a "
            "logging utility module, add request/response logging middleware, "
            "and add error logging to all exception handlers."
        ),
        "files": [
            "/src/utils/logger.py",
            "/src/middleware/logging.py",
            "/src/handlers/errors.py",
            "/src/config.py",
        ],
    },
    {
        "name": "Database Migration",
        "task": (
            "Migrate the user table to add email verification fields. "
            "Create the migration script, update the user model, "
            "add verification email sending, and update the registration flow."
        ),
        "files": [
            "/migrations/add_email_verification.py",
            "/src/models/user.py",
            "/src/services/email.py",
            "/src/handlers/registration.py",
            "/tests/test_registration.py",
        ],
    },
]


SAMPLE_PLAN = OrchestratorPlan(
    task_description="Refactor authentication module to use JWT tokens",
    subtasks=[
        SubTask(
            id="subtask_1",
            description="Create JWT token utility with sign/verify functions",
            target_files=["/src/auth/tokens.py"],
            dependencies=[],
        ),
        SubTask(
            id="subtask_2",
            description="Update login endpoint to return JWT tokens",
            target_files=["/src/auth/login.py"],
            dependencies=["subtask_1"],
        ),
        SubTask(
            id="subtask_3",
            description="Add JWT validation middleware",
            target_files=["/src/auth/middleware.py"],
            dependencies=["subtask_1"],
        ),
        SubTask(
            id="subtask_4",
            description="Update all authentication tests for JWT flow",
            target_files=["/tests/test_auth.py"],
            dependencies=["subtask_2", "subtask_3"],
        ),
    ],
)


# ---------------------------------------------------------------------------
# Evaluator sample rubrics
# ---------------------------------------------------------------------------

SAMPLE_RUBRIC_CODE_REVIEW = Rubric(
    name="Code Review",
    items=[
        RubricItem(
            name="Correctness",
            description="The code correctly implements the required functionality without bugs.",
            weight=2.0,
            max_score=5,
        ),
        RubricItem(
            name="Style",
            description="Code follows PEP 8 style guide, uses consistent naming conventions.",
            weight=1.0,
            max_score=5,
        ),
        RubricItem(
            name="Testing",
            description="Adequate test coverage with meaningful test cases.",
            weight=1.5,
            max_score=5,
        ),
    ],
)

SAMPLE_RUBRIC_DOCUMENTATION = Rubric(
    name="Documentation Quality",
    items=[
        RubricItem(
            name="Completeness",
            description="All public APIs are documented with docstrings.",
            weight=1.5,
            max_score=5,
        ),
        RubricItem(
            name="Clarity",
            description="Documentation is clear, concise, and easy to understand.",
            weight=1.0,
            max_score=5,
        ),
        RubricItem(
            name="Examples",
            description="Documentation includes usage examples for complex functions.",
            weight=1.0,
            max_score=5,
        ),
    ],
)


# ---------------------------------------------------------------------------
# Eval sample code snippets (for evaluator testing)
# ---------------------------------------------------------------------------

SAMPLE_CODE_GOOD = '''\
def calculate_average(numbers: list[float]) -> float:
    """Calculate the arithmetic average of a list of numbers.

    Args:
        numbers: A list of floating point numbers.

    Returns:
        The arithmetic mean of the input numbers.

    Raises:
        ValueError: If the input list is empty.
    """
    if not numbers:
        raise ValueError("Cannot calculate average of empty list")
    return sum(numbers) / len(numbers)


def find_median(numbers: list[float]) -> float:
    """Find the median value in a list of numbers.

    Args:
        numbers: A list of floating point numbers.

    Returns:
        The median value.

    Raises:
        ValueError: If the input list is empty.
    """
    if not numbers:
        raise ValueError("Cannot find median of empty list")
    sorted_nums = sorted(numbers)
    n = len(sorted_nums)
    mid = n // 2
    if n % 2 == 0:
        return (sorted_nums[mid - 1] + sorted_nums[mid]) / 2
    return sorted_nums[mid]
'''

SAMPLE_CODE_POOR = '''\
def calc(x):
    s = 0
    for i in x:
        s = s + i
    return s / len(x)

def med(x):
    x.sort()
    if len(x) % 2 == 0:
        return (x[len(x)//2-1] + x[len(x)//2]) / 2
    else:
        return x[len(x)//2]
'''


# ---------------------------------------------------------------------------
# Eval framework sample cases
# ---------------------------------------------------------------------------

SAMPLE_EVAL_CASES = [
    EvalCase(
        id="sample_001",
        name="Basic Function Generation",
        task="Write a Python function called 'add' that takes two numbers and returns their sum.",
        expected_behavior="A function with correct signature and implementation",
        validator=lambda output: "def add" in output and "return" in output,
        difficulty="easy",
    ),
    EvalCase(
        id="sample_002",
        name="Error Handling",
        task=(
            "Write a Python function called 'safe_divide' that divides two numbers "
            "and returns None if the divisor is zero."
        ),
        expected_behavior="A function that handles ZeroDivisionError",
        validator=lambda output: (
            "def safe_divide" in output
            and ("zero" in output.lower() or "None" in output or "0" in output)
        ),
        difficulty="medium",
    ),
    EvalCase(
        id="sample_003",
        name="Data Structure Implementation",
        task=(
            "Write a Python class called 'Stack' with push, pop, and peek methods. "
            "Include proper error handling for empty stack operations."
        ),
        expected_behavior="A Stack class with all required methods",
        validator=lambda output: (
            "class Stack" in output
            and "push" in output
            and "pop" in output
            and "peek" in output
        ),
        difficulty="hard",
    ),
]
