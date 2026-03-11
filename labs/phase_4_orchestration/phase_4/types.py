"""Phase 4 類型定義 — 所有資料結構和類型別名。

本文件定義了整個 Phase 4 使用的核心資料結構。
學生不需要修改此文件，只需閱讀並理解每個類型的用途。

類型分為三組：
1. Orchestrator types — 多 Agent 協調的任務分解與執行
2. Evaluator types — LLM 輸出的評分與優化
3. Eval framework types — 系統性測試 Agent 能力的框架
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Literal


# ---------------------------------------------------------------------------
# Orchestrator types — 多 Agent 任務分解與協調
# ---------------------------------------------------------------------------

@dataclass
class SubTask:
    """編排器分解出的子任務。

    每個子任務由一個獨立的 worker agent 執行。
    子任務之間可以有依賴關係（dependencies 中列出前置任務的 id）。
    """
    id: str = ""
    description: str = ""
    target_files: list[str] = field(default_factory=list)
    dependencies: list[str] = field(default_factory=list)
    status: Literal["pending", "running", "completed", "failed"] = "pending"
    result: str | None = None


@dataclass
class OrchestratorPlan:
    """編排器生成的執行計劃。

    包含任務描述和分解後的子任務列表。
    created_at 記錄計劃生成的時間戳（用於效能分析）。
    """
    task_description: str = ""
    subtasks: list[SubTask] = field(default_factory=list)
    created_at: float = 0.0


@dataclass
class WorkerResult:
    """單個 worker agent 的執行結果。

    記錄子任務的完成情況、輸出、修改的文件和 token 消耗。
    """
    subtask_id: str = ""
    success: bool = False
    output: str = ""
    files_modified: list[str] = field(default_factory=list)
    tokens_used: int = 0


@dataclass
class OrchestratorResult:
    """編排器的最終執行結果。

    包含計劃、所有 worker 的結果、衝突列表和驗證狀態。
    """
    success: bool = False
    plan: OrchestratorPlan = field(default_factory=OrchestratorPlan)
    worker_results: list[WorkerResult] = field(default_factory=list)
    conflicts: list[str] = field(default_factory=list)
    validation_passed: bool = False


@dataclass
class OrchestratorConfig:
    """編排器配置。

    max_subtasks: 單個任務最多分解為多少個子任務
    max_worker_iterations: 每個 worker agent 最多執行多少輪 tool use
    parallel: 是否並行執行無依賴關係的子任務
    """
    max_subtasks: int = 10
    max_worker_iterations: int = 15
    parallel: bool = False


# ---------------------------------------------------------------------------
# Evaluator types — LLM 輸出評分與優化
# ---------------------------------------------------------------------------

@dataclass
class RubricItem:
    """評分標準中的單項。

    每一項有名稱、描述、權重和最高分。
    weight 用於加權計算總分，max_score 定義評分上限。
    """
    name: str = ""
    description: str = ""
    weight: float = 1.0
    max_score: int = 5


@dataclass
class Rubric:
    """完整的評分標準。

    包含名稱和多個評分項。
    """
    name: str = ""
    items: list[RubricItem] = field(default_factory=list)


@dataclass
class ScoreResult:
    """單項評分結果。

    包含評分項名稱、分數、評分理由和改進建議。
    """
    rubric_item: str = ""
    score: int = 0
    reasoning: str = ""
    suggestions: list[str] = field(default_factory=list)


@dataclass
class EvalResult:
    """完整的評估結果。

    包含所有評分項的分數、總分、最高可能分數和綜合反饋。
    """
    rubric_name: str = ""
    scores: list[ScoreResult] = field(default_factory=list)
    total_score: float = 0.0
    max_possible: float = 0.0
    feedback: str = ""


@dataclass
class OptimizerConfig:
    """Evaluator-Optimizer 循環配置。

    max_iterations: 最多迭代多少輪
    target_score: 達到此分數就停止優化
    improvement_threshold: 兩輪之間分數提升不足此值則停止
    """
    max_iterations: int = 3
    target_score: float = 4.0
    improvement_threshold: float = 0.5


# ---------------------------------------------------------------------------
# Eval framework types — 系統性 Agent 測試框架
# ---------------------------------------------------------------------------

@dataclass
class EvalCase:
    """單個評測用例。

    id: 用例唯一標識符
    name: 用例名稱
    task: 交給 agent 的任務描述
    expected_behavior: 期望的行為描述（用於人工審閱）
    validator: 接受 agent 輸出字符串，返回 bool 的驗證函數
    difficulty: 難度等級
    """
    id: str = ""
    name: str = ""
    task: str = ""
    expected_behavior: str = ""
    validator: Callable[[str], bool] = field(default_factory=lambda: lambda _: True)
    difficulty: Literal["easy", "medium", "hard"] = "easy"


@dataclass
class EvalRunResult:
    """單個評測用例的運行結果。

    case_id: 對應的 EvalCase.id
    passed: 是否通過 validator 驗證
    actual_output: agent 的實際輸出
    tokens_used: 消耗的 token 數
    duration_ms: 執行時間（毫秒）
    error: 如果出錯則記錄錯誤訊息
    """
    case_id: str = ""
    passed: bool = False
    actual_output: str = ""
    tokens_used: int = 0
    duration_ms: float = 0.0
    error: str | None = None


@dataclass
class EvalSuiteResult:
    """評測套件的整體結果。

    包含所有用例的結果、通過率和平均消耗。
    """
    suite_name: str = ""
    results: list[EvalRunResult] = field(default_factory=list)
    pass_rate: float = 0.0
    avg_tokens: float = 0.0
    avg_duration_ms: float = 0.0


@dataclass
class EvalConfig:
    """評測框架配置。

    timeout_seconds: 每個用例的最大執行時間
    max_tokens_per_case: 每個用例的最大 token 消耗
    """
    timeout_seconds: int = 120
    max_tokens_per_case: int = 50_000
