"""Lab 2 測試: Evaluator — 評分、優化循環、投票機制。

測試覆蓋:
- evaluate: 對所有評分項打分、計算總分
- _score_item: 單項打分、分數有效範圍
- _generate_feedback: 生成改進建議
- optimize: 迭代改進、目標分數停止、最大迭代停止
- vote: 多候選方案選擇最佳
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Ensure shared utils are importable
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared"))

from testing_utils import create_mock_anthropic_response

from phase_4.evaluator import Evaluator
from phase_4.types import (
    EvalResult,
    OptimizerConfig,
    Rubric,
    RubricItem,
    ScoreResult,
)


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def mock_llm_client():
    """Create a mock LLM client."""
    return MagicMock()


@pytest.fixture
def evaluator(mock_llm_client):
    """Create an Evaluator with mock LLM client."""
    return Evaluator(
        llm_client=mock_llm_client,
        config=OptimizerConfig(max_iterations=3, target_score=4.0, improvement_threshold=0.5),
    )


@pytest.fixture
def sample_rubric():
    """Create a simple rubric for testing."""
    return Rubric(
        name="Test Rubric",
        items=[
            RubricItem(name="Clarity", description="Code is clear", weight=1.0, max_score=5),
            RubricItem(name="Correctness", description="Code is correct", weight=2.0, max_score=5),
        ],
    )


@pytest.fixture
def sample_code():
    """Sample code for evaluation."""
    return "def add(a, b):\n    return a + b\n"


def _make_score_response(score: int, reasoning: str, suggestions: list[str]) -> MagicMock:
    """Helper to create a mock LLM response containing a score JSON."""
    data = {"score": score, "reasoning": reasoning, "suggestions": suggestions}
    return create_mock_anthropic_response(text=json.dumps(data))


# ======================================================================
# evaluate tests
# ======================================================================


class TestEvaluate:
    """Tests for Evaluator.evaluate."""

    def test_evaluate_scores_all_items(self, evaluator, mock_llm_client, sample_rubric, sample_code):
        """evaluate() should score every item in the rubric."""
        mock_llm_client.create_message.return_value = _make_score_response(
            score=4, reasoning="Good code", suggestions=["Add types"]
        )

        result = evaluator.evaluate(sample_code, sample_rubric)

        assert isinstance(result, EvalResult)
        assert result.rubric_name == "Test Rubric"
        assert len(result.scores) == len(sample_rubric.items)

    def test_evaluate_with_empty_code(self, evaluator, mock_llm_client, sample_rubric):
        """evaluate() should handle empty code input."""
        mock_llm_client.create_message.return_value = _make_score_response(
            score=1, reasoning="Empty code", suggestions=["Write code"]
        )

        result = evaluator.evaluate("", sample_rubric)

        assert isinstance(result, EvalResult)
        assert len(result.scores) == len(sample_rubric.items)


# ======================================================================
# _score_item tests
# ======================================================================


class TestScoreItem:
    """Tests for Evaluator._score_item."""

    def test_score_item_returns_valid_range(self, evaluator, mock_llm_client, sample_code):
        """_score_item() should return a score within [0, max_score]."""
        mock_llm_client.create_message.return_value = _make_score_response(
            score=3, reasoning="Decent", suggestions=["Could be better"]
        )

        item = RubricItem(name="Quality", description="Overall quality", max_score=5)
        result = evaluator._score_item(sample_code, item)

        assert isinstance(result, ScoreResult)
        assert 0 <= result.score <= item.max_score
        assert result.rubric_item == "Quality"
        assert len(result.reasoning) > 0

    def test_score_item_clamps_out_of_range(self, evaluator, mock_llm_client, sample_code):
        """_score_item() should clamp scores exceeding max_score."""
        # LLM returns a score higher than max
        mock_llm_client.create_message.return_value = _make_score_response(
            score=10, reasoning="Perfect", suggestions=[]
        )

        item = RubricItem(name="Quality", description="Overall quality", max_score=5)
        result = evaluator._score_item(sample_code, item)

        assert result.score <= item.max_score


# ======================================================================
# _generate_feedback tests
# ======================================================================


class TestGenerateFeedback:
    """Tests for Evaluator._generate_feedback."""

    def test_generate_feedback_includes_suggestions(self, evaluator):
        """_generate_feedback() should include suggestions from low-scoring items."""
        eval_result = EvalResult(
            rubric_name="Test",
            scores=[
                ScoreResult(
                    rubric_item="Clarity",
                    score=2,
                    reasoning="Hard to read",
                    suggestions=["Use better names", "Add comments"],
                ),
                ScoreResult(
                    rubric_item="Correctness",
                    score=5,
                    reasoning="All correct",
                    suggestions=[],
                ),
            ],
            total_score=3.5,
            max_possible=5.0,
            feedback="",
        )

        feedback = evaluator._generate_feedback(eval_result)

        assert isinstance(feedback, str)
        assert len(feedback) > 0
        # Should mention the low-scoring item
        assert "Clarity" in feedback or "2" in feedback


# ======================================================================
# optimize tests
# ======================================================================


class TestOptimize:
    """Tests for Evaluator.optimize."""

    def test_optimize_improves_score(self, evaluator, mock_llm_client, sample_rubric, sample_code):
        """optimize() should iterate and collect evaluation history."""
        # First evaluation: low score
        low_score = _make_score_response(score=2, reasoning="Needs work", suggestions=["Improve"])
        # Second evaluation: high score (meets target)
        high_score = _make_score_response(score=5, reasoning="Excellent", suggestions=[])

        mock_llm_client.create_message.side_effect = [
            # First iteration: score each item (2 items)
            low_score, low_score,
            # Second iteration: score each item (2 items)
            high_score, high_score,
        ]

        def generator_fn(code: str, feedback: str) -> str:
            return code + "\n# Improved based on feedback"

        best_code, history = evaluator.optimize(sample_code, sample_rubric, generator_fn)

        assert len(history) >= 1
        assert isinstance(history[0], EvalResult)
        assert isinstance(best_code, str)

    def test_optimize_stops_at_target(self, evaluator, mock_llm_client, sample_rubric, sample_code):
        """optimize() should stop when target_score is reached."""
        # Already high score
        high_score = _make_score_response(score=5, reasoning="Perfect", suggestions=[])
        mock_llm_client.create_message.return_value = high_score

        call_count = 0
        def generator_fn(code: str, feedback: str) -> str:
            nonlocal call_count
            call_count += 1
            return code

        best_code, history = evaluator.optimize(sample_code, sample_rubric, generator_fn)

        # Should stop after first evaluation since score meets target
        assert len(history) >= 1
        # generator_fn should not be called if first eval meets target
        assert call_count == 0

    def test_optimize_max_iterations(self, evaluator, mock_llm_client, sample_rubric, sample_code):
        """optimize() should stop after max_iterations."""
        # Always return mediocre score
        mid_score = _make_score_response(score=2, reasoning="OK", suggestions=["More"])
        mock_llm_client.create_message.return_value = mid_score

        def generator_fn(code: str, feedback: str) -> str:
            return code + "\n# attempt"

        best_code, history = evaluator.optimize(sample_code, sample_rubric, generator_fn)

        # max_iterations is 3 in fixture
        assert len(history) <= evaluator.config.max_iterations


# ======================================================================
# vote tests
# ======================================================================


class TestVote:
    """Tests for Evaluator.vote."""

    def test_vote_selects_best(self, evaluator, mock_llm_client, sample_rubric):
        """vote() should select the candidate with the highest score."""
        # First candidate: low scores
        low = _make_score_response(score=2, reasoning="Low", suggestions=["Fix"])
        # Second candidate: high scores
        high = _make_score_response(score=5, reasoning="High", suggestions=[])

        mock_llm_client.create_message.side_effect = [
            # Candidate 1: 2 items
            low, low,
            # Candidate 2: 2 items
            high, high,
        ]

        candidates = ["bad code", "good code"]
        best, results = evaluator.vote(candidates, sample_rubric)

        assert len(results) == 2
        assert best == "good code"

    def test_vote_with_single_candidate(self, evaluator, mock_llm_client, sample_rubric):
        """vote() with one candidate should return that candidate."""
        score_resp = _make_score_response(score=3, reasoning="OK", suggestions=[])
        mock_llm_client.create_message.return_value = score_resp

        candidates = ["only option"]
        best, results = evaluator.vote(candidates, sample_rubric)

        assert best == "only option"
        assert len(results) == 1

    def test_vote_empty_candidates_raises(self, evaluator, sample_rubric):
        """vote() with empty candidates should raise ValueError."""
        with pytest.raises(ValueError):
            evaluator.vote([], sample_rubric)
