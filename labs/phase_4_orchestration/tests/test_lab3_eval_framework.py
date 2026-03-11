"""Lab 3 測試: Eval Framework — 用例運行、套件聚合、版本比較。

測試覆蓋:
- run_case: 通過用例、失敗用例、超時/錯誤處理
- run_all: 結果聚合、通過率計算
- _validate_output: validator 調用
- compare: 回歸檢測、改進檢測
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Ensure shared utils are importable
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared"))

from phase_4.eval_framework import EvalSuite
from phase_4.types import (
    EvalCase,
    EvalConfig,
    EvalRunResult,
    EvalSuiteResult,
)


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def simple_cases():
    """Create simple eval cases for testing."""
    return [
        EvalCase(
            id="tc_1",
            name="Greeting",
            task="Say hello",
            expected_behavior="A greeting",
            validator=lambda output: "hello" in output.lower(),
            difficulty="easy",
        ),
        EvalCase(
            id="tc_2",
            name="Math",
            task="What is 1+1?",
            expected_behavior="The number 2",
            validator=lambda output: "2" in output,
            difficulty="easy",
        ),
        EvalCase(
            id="tc_3",
            name="Reverse",
            task="Reverse the word CAT",
            expected_behavior="TAC",
            validator=lambda output: "TAC" in output,
            difficulty="medium",
        ),
    ]


@pytest.fixture
def suite(simple_cases):
    """Create an EvalSuite with simple cases."""
    return EvalSuite(
        name="Test Suite",
        cases=simple_cases,
        config=EvalConfig(timeout_seconds=10, max_tokens_per_case=1000),
    )


@pytest.fixture
def passing_agent():
    """An agent that passes all simple test cases."""
    def agent(task: str) -> str:
        task_lower = task.lower()
        if "hello" in task_lower:
            return "Hello there!"
        if "1+1" in task or "1 + 1" in task:
            return "The answer is 2"
        if "reverse" in task_lower and "CAT" in task:
            return "TAC"
        return "I don't know"
    return agent


@pytest.fixture
def failing_agent():
    """An agent that fails all test cases."""
    def agent(task: str) -> str:
        return "I cannot do this task."
    return agent


# ======================================================================
# run_case tests
# ======================================================================


class TestRunCase:
    """Tests for EvalSuite.run_case."""

    def test_run_case_passes_valid(self, suite):
        """run_case() should return passed=True for valid output."""
        case = EvalCase(
            id="pass_1",
            name="Pass Test",
            task="Say hello",
            expected_behavior="A greeting",
            validator=lambda output: "hello" in output.lower(),
            difficulty="easy",
        )
        agent_fn = lambda task: "Hello world!"

        result = suite.run_case(case, agent_fn)

        assert isinstance(result, EvalRunResult)
        assert result.case_id == "pass_1"
        assert result.passed is True
        assert "Hello world!" in result.actual_output
        assert result.error is None

    def test_run_case_fails_invalid(self, suite):
        """run_case() should return passed=False for invalid output."""
        case = EvalCase(
            id="fail_1",
            name="Fail Test",
            task="Say hello",
            expected_behavior="A greeting",
            validator=lambda output: "hello" in output.lower(),
            difficulty="easy",
        )
        agent_fn = lambda task: "Goodbye!"

        result = suite.run_case(case, agent_fn)

        assert result.passed is False
        assert "Goodbye!" in result.actual_output

    def test_run_case_handles_timeout(self, suite):
        """run_case() should handle agent errors gracefully."""
        case = EvalCase(
            id="err_1",
            name="Error Test",
            task="Do something",
            expected_behavior="Something",
            validator=lambda output: True,
            difficulty="easy",
        )

        def error_agent(task: str) -> str:
            raise RuntimeError("Agent crashed")

        result = suite.run_case(case, error_agent)

        assert result.passed is False
        assert result.error is not None
        assert "crashed" in result.error.lower() or "Agent" in result.error


# ======================================================================
# run_all tests
# ======================================================================


class TestRunAll:
    """Tests for EvalSuite.run_all."""

    def test_run_all_aggregates(self, suite, passing_agent):
        """run_all() should return results for all cases."""
        result = suite.run_all(passing_agent)

        assert isinstance(result, EvalSuiteResult)
        assert result.suite_name == "Test Suite"
        assert len(result.results) == 3

    def test_run_all_computes_pass_rate(self, suite, passing_agent):
        """run_all() should correctly compute pass_rate."""
        result = suite.run_all(passing_agent)

        passed = sum(1 for r in result.results if r.passed)
        expected_rate = passed / len(result.results) if result.results else 0

        assert abs(result.pass_rate - expected_rate) < 0.01

    def test_run_all_with_mixed_results(self, suite):
        """run_all() should handle mixed pass/fail results."""
        def partial_agent(task: str) -> str:
            if "hello" in task.lower():
                return "Hello!"
            return "no idea"

        result = suite.run_all(partial_agent)

        assert len(result.results) == 3
        # At least the greeting should pass
        passed = sum(1 for r in result.results if r.passed)
        assert passed >= 1
        assert result.pass_rate > 0
        assert result.pass_rate < 1.0

    def test_suite_with_mixed_difficulties(self):
        """run_all() should work with cases of mixed difficulties."""
        cases = [
            EvalCase(
                id="e1", name="Easy", task="Hi", expected_behavior="Hi",
                validator=lambda o: len(o) > 0, difficulty="easy",
            ),
            EvalCase(
                id="m1", name="Medium", task="Think", expected_behavior="Thought",
                validator=lambda o: len(o) > 5, difficulty="medium",
            ),
            EvalCase(
                id="h1", name="Hard", task="Complex", expected_behavior="Solution",
                validator=lambda o: len(o) > 20, difficulty="hard",
            ),
        ]
        suite = EvalSuite("Mixed", cases, EvalConfig())
        agent_fn = lambda task: f"Here is my detailed response to: {task}"

        result = suite.run_all(agent_fn)

        assert len(result.results) == 3
        assert result.avg_duration_ms >= 0
        assert result.avg_tokens >= 0


# ======================================================================
# _validate_output tests
# ======================================================================


class TestValidateOutput:
    """Tests for EvalSuite._validate_output."""

    def test_validate_output_calls_validator(self, suite):
        """_validate_output() should call the case validator."""
        case = EvalCase(
            id="v1",
            name="Validate",
            task="Check",
            expected_behavior="Checked",
            validator=lambda output: output == "correct",
            difficulty="easy",
        )

        assert suite._validate_output(case, "correct") is True
        assert suite._validate_output(case, "wrong") is False

    def test_validate_output_handles_validator_error(self, suite):
        """_validate_output() should return False if validator raises."""
        def bad_validator(output: str) -> bool:
            raise ValueError("Validator error")

        case = EvalCase(
            id="v2",
            name="Bad Validator",
            task="Check",
            expected_behavior="Checked",
            validator=bad_validator,
            difficulty="easy",
        )

        assert suite._validate_output(case, "anything") is False


# ======================================================================
# compare tests
# ======================================================================


class TestCompare:
    """Tests for EvalSuite.compare."""

    def test_compare_shows_regression(self, suite):
        """compare() should identify regressions."""
        baseline = EvalSuiteResult(
            suite_name="Test",
            results=[
                EvalRunResult(case_id="tc_1", passed=True, actual_output="hi", duration_ms=10),
                EvalRunResult(case_id="tc_2", passed=True, actual_output="2", duration_ms=10),
            ],
            pass_rate=1.0,
            avg_tokens=50,
            avg_duration_ms=10,
        )
        current = EvalSuiteResult(
            suite_name="Test",
            results=[
                EvalRunResult(case_id="tc_1", passed=False, actual_output="bye", duration_ms=10),
                EvalRunResult(case_id="tc_2", passed=True, actual_output="2", duration_ms=10),
            ],
            pass_rate=0.5,
            avg_tokens=50,
            avg_duration_ms=10,
        )

        report = suite.compare(baseline, current)

        assert isinstance(report, str)
        assert len(report) > 0
        # Should mention regression
        assert "tc_1" in report or "regression" in report.lower() or "Regression" in report

    def test_compare_shows_improvement(self, suite):
        """compare() should identify improvements."""
        baseline = EvalSuiteResult(
            suite_name="Test",
            results=[
                EvalRunResult(case_id="tc_1", passed=False, actual_output="", duration_ms=10),
                EvalRunResult(case_id="tc_2", passed=True, actual_output="2", duration_ms=10),
            ],
            pass_rate=0.5,
            avg_tokens=50,
            avg_duration_ms=10,
        )
        current = EvalSuiteResult(
            suite_name="Test",
            results=[
                EvalRunResult(case_id="tc_1", passed=True, actual_output="hi", duration_ms=10),
                EvalRunResult(case_id="tc_2", passed=True, actual_output="2", duration_ms=10),
            ],
            pass_rate=1.0,
            avg_tokens=50,
            avg_duration_ms=10,
        )

        report = suite.compare(baseline, current)

        assert isinstance(report, str)
        # Should mention improvement
        assert "tc_1" in report or "improvement" in report.lower() or "Improvement" in report
