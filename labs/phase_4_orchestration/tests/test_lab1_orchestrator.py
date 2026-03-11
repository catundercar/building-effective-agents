"""Lab 1 測試: Orchestrator — 任務分解、worker 執行、結果合併。

測試覆蓋:
- plan: 任務分解為子任務、目標文件分配、子任務數量限制
- execute_plan: worker 執行、依賴關係、結果收集
- _run_worker: 單個 worker 運行並返回結果
- _merge_results: 衝突檢測、文件列表合併
- _validate: 驗證所有 worker 結果
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure shared utils are importable
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared"))

from testing_utils import create_mock_anthropic_response

from phase_4.orchestrator import Orchestrator
from phase_4.types import (
    OrchestratorConfig,
    OrchestratorPlan,
    OrchestratorResult,
    SubTask,
    WorkerResult,
)


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def mock_llm_client():
    """Create a mock LLM client."""
    client = MagicMock()
    return client


@pytest.fixture
def orchestrator(mock_llm_client):
    """Create an Orchestrator with mock LLM client."""
    return Orchestrator(
        llm_client=mock_llm_client,
        tools=[],
        config=OrchestratorConfig(max_subtasks=5, max_worker_iterations=3),
    )


@pytest.fixture
def sample_plan():
    """Create a sample plan for testing."""
    return OrchestratorPlan(
        task_description="Refactor auth module",
        subtasks=[
            SubTask(
                id="sub_1",
                description="Create JWT utility",
                target_files=["/src/auth/tokens.py"],
                dependencies=[],
            ),
            SubTask(
                id="sub_2",
                description="Update login endpoint",
                target_files=["/src/auth/login.py"],
                dependencies=["sub_1"],
            ),
            SubTask(
                id="sub_3",
                description="Update tests",
                target_files=["/tests/test_auth.py"],
                dependencies=["sub_1", "sub_2"],
            ),
        ],
    )


def _make_plan_response(subtasks_json: list[dict]) -> MagicMock:
    """Helper to create a mock LLM response containing a JSON plan."""
    text = json.dumps(subtasks_json)
    return create_mock_anthropic_response(text=text)


# ======================================================================
# Plan tests
# ======================================================================


class TestPlan:
    """Tests for Orchestrator.plan."""

    def test_plan_decomposes_task(self, orchestrator, mock_llm_client):
        """plan() should decompose a task into subtasks."""
        subtasks_json = [
            {
                "id": "st_1",
                "description": "Implement feature A",
                "target_files": ["/src/a.py"],
                "dependencies": [],
            },
            {
                "id": "st_2",
                "description": "Implement feature B",
                "target_files": ["/src/b.py"],
                "dependencies": ["st_1"],
            },
        ]
        mock_llm_client.create_message.return_value = _make_plan_response(subtasks_json)

        plan = orchestrator.plan("Build features A and B", ["/src/a.py", "/src/b.py"])

        assert isinstance(plan, OrchestratorPlan)
        assert len(plan.subtasks) == 2
        assert plan.task_description == "Build features A and B"
        assert plan.subtasks[0].id == "st_1"
        assert plan.subtasks[1].id == "st_2"

    def test_plan_assigns_target_files(self, orchestrator, mock_llm_client):
        """plan() should assign target_files to each subtask."""
        subtasks_json = [
            {
                "id": "st_1",
                "description": "Modify the config",
                "target_files": ["/src/config.py", "/src/settings.py"],
                "dependencies": [],
            },
        ]
        mock_llm_client.create_message.return_value = _make_plan_response(subtasks_json)

        plan = orchestrator.plan("Update config", ["/src/config.py", "/src/settings.py"])

        assert plan.subtasks[0].target_files == ["/src/config.py", "/src/settings.py"]

    def test_plan_limits_subtasks(self, orchestrator, mock_llm_client):
        """plan() should limit subtask count to max_subtasks."""
        # Return more subtasks than allowed
        subtasks_json = [
            {
                "id": f"st_{i}",
                "description": f"Task {i}",
                "target_files": [f"/src/f{i}.py"],
                "dependencies": [],
            }
            for i in range(10)
        ]
        mock_llm_client.create_message.return_value = _make_plan_response(subtasks_json)

        plan = orchestrator.plan("Big task", ["/src/main.py"])

        # max_subtasks is 5 in fixture
        assert len(plan.subtasks) <= 5


# ======================================================================
# Execute plan tests
# ======================================================================


class TestExecutePlan:
    """Tests for Orchestrator.execute_plan."""

    def test_execute_plan_runs_workers(self, orchestrator, mock_llm_client, sample_plan):
        """execute_plan() should run workers for each subtask."""
        # Mock worker responses — each worker gets an end_turn response
        mock_llm_client.create_message.return_value = create_mock_anthropic_response(
            text="Task completed successfully."
        )

        result = orchestrator.execute_plan(sample_plan)

        assert isinstance(result, OrchestratorResult)
        assert len(result.worker_results) == len(sample_plan.subtasks)

    def test_execute_respects_dependencies(self, orchestrator, mock_llm_client, sample_plan):
        """execute_plan() should execute subtasks in dependency order."""
        call_order = []
        original_run_worker = orchestrator._run_worker

        def tracking_run_worker(subtask):
            call_order.append(subtask.id)
            return WorkerResult(
                subtask_id=subtask.id,
                success=True,
                output="Done",
                files_modified=subtask.target_files,
                tokens_used=100,
            )

        orchestrator._run_worker = tracking_run_worker
        orchestrator.execute_plan(sample_plan)

        # sub_1 has no deps, so it should be first
        # sub_2 depends on sub_1
        # sub_3 depends on sub_1 and sub_2
        assert call_order.index("sub_1") < call_order.index("sub_2")
        assert call_order.index("sub_2") < call_order.index("sub_3")


# ======================================================================
# Worker tests
# ======================================================================


class TestRunWorker:
    """Tests for Orchestrator._run_worker."""

    def test_run_worker_returns_result(self, orchestrator, mock_llm_client):
        """_run_worker() should return a WorkerResult."""
        mock_llm_client.create_message.return_value = create_mock_anthropic_response(
            text="Completed the subtask."
        )

        subtask = SubTask(
            id="w_1",
            description="Write a helper function",
            target_files=["/src/helper.py"],
        )

        result = orchestrator._run_worker(subtask)

        assert isinstance(result, WorkerResult)
        assert result.subtask_id == "w_1"
        assert result.success is True
        assert len(result.output) > 0


# ======================================================================
# Merge results tests
# ======================================================================


class TestMergeResults:
    """Tests for Orchestrator._merge_results."""

    def test_merge_results_no_conflicts(self, orchestrator):
        """_merge_results() with no overlapping files should have no conflicts."""
        results = [
            WorkerResult(
                subtask_id="s1",
                success=True,
                output="Done",
                files_modified=["/src/a.py"],
                tokens_used=100,
            ),
            WorkerResult(
                subtask_id="s2",
                success=True,
                output="Done",
                files_modified=["/src/b.py"],
                tokens_used=100,
            ),
        ]

        all_files, conflicts = orchestrator._merge_results(results)

        assert set(all_files) == {"/src/a.py", "/src/b.py"}
        assert len(conflicts) == 0

    def test_merge_results_detects_conflicts(self, orchestrator):
        """_merge_results() should detect when multiple workers modify the same file."""
        results = [
            WorkerResult(
                subtask_id="s1",
                success=True,
                output="Done",
                files_modified=["/src/shared.py", "/src/a.py"],
                tokens_used=100,
            ),
            WorkerResult(
                subtask_id="s2",
                success=True,
                output="Done",
                files_modified=["/src/shared.py", "/src/b.py"],
                tokens_used=100,
            ),
        ]

        all_files, conflicts = orchestrator._merge_results(results)

        assert "/src/shared.py" in all_files
        assert len(conflicts) >= 1
        # The conflict description should mention the conflicting file
        assert any("shared.py" in c for c in conflicts)


# ======================================================================
# Validate tests
# ======================================================================


class TestValidate:
    """Tests for Orchestrator._validate."""

    def test_validate_runs_checks(self, orchestrator):
        """_validate() should return True when all workers succeeded."""
        results = [
            WorkerResult(subtask_id="s1", success=True, output="OK", tokens_used=50),
            WorkerResult(subtask_id="s2", success=True, output="OK", tokens_used=50),
        ]

        assert orchestrator._validate(results) is True

    def test_validate_fails_on_worker_failure(self, orchestrator):
        """_validate() should return False when any worker failed."""
        results = [
            WorkerResult(subtask_id="s1", success=True, output="OK", tokens_used=50),
            WorkerResult(subtask_id="s2", success=False, output="Error", tokens_used=50),
        ]

        assert orchestrator._validate(results) is False

    def test_validate_empty_results(self, orchestrator):
        """_validate() should return False for empty results."""
        assert orchestrator._validate([]) is False
