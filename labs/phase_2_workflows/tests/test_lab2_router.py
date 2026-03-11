"""Lab 2 測試: Router — 意圖分類、路由分發、置信度閾值、fallback。

測試覆蓋:
- classify: LLM 分類調用驗證、多路由分類
- route: 分發到正確 handler、低置信度 fallback
- _build_classification_prompt: prompt 包含所有路由
- _parse_classification: 正確 JSON 解析、無效格式處理
- timing: 分類耗時記錄
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Ensure shared utils are importable
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared"))

from phase_2.router import Router
from phase_2.types import Route, RouteResult, RouterConfig


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def mock_llm_client():
    """Create a mock LLM client for routing tests."""
    client = MagicMock()
    return client


def _set_classification_response(mock_client: MagicMock, route_name: str, confidence: float) -> None:
    """Helper to set the LLM to return a specific classification."""
    response_json = json.dumps({"route": route_name, "confidence": confidence})
    mock_response = MagicMock()
    mock_block = MagicMock()
    mock_block.text = response_json
    mock_block.type = "text"
    mock_response.content = [mock_block]
    mock_client.create_message.return_value = mock_response


@pytest.fixture
def sample_routes():
    """Create sample routes for testing."""
    return [
        Route(
            name="explain_code",
            description="Explain code functionality",
            handler=lambda x: f"Explained: {x[:50]}",
            classifier_hint="User asks to explain or analyze code",
        ),
        Route(
            name="edit_file",
            description="Edit or modify files",
            handler=lambda x: f"Editing: {x[:50]}",
            classifier_hint="User asks to edit, modify, or fix files",
        ),
        Route(
            name="run_command",
            description="Run shell commands",
            handler=lambda x: f"Running: {x[:50]}",
            classifier_hint="User asks to run or execute commands",
        ),
        Route(
            name="chat",
            description="General conversation",
            handler=lambda x: f"Chatting: {x[:50]}",
            classifier_hint="General questions or greetings",
        ),
    ]


@pytest.fixture
def router(mock_llm_client, sample_routes):
    """Create a Router with mock client and sample routes."""
    return Router(
        llm_client=mock_llm_client,
        routes=sample_routes,
        config=RouterConfig(
            confidence_threshold=0.7,
            fallback_route="chat",
        ),
    )


# ======================================================================
# __init__ tests
# ======================================================================


class TestRouterInit:
    """Tests for Router.__init__."""

    def test_empty_routes_raises(self, mock_llm_client):
        """空路由列表應拋出 ValueError。"""
        with pytest.raises(ValueError, match="[Aa]t least one route"):
            Router(llm_client=mock_llm_client, routes=[], config=RouterConfig())


# ======================================================================
# classify tests
# ======================================================================


class TestClassify:
    """Tests for Router.classify."""

    def test_classify_returns_route_and_confidence(
        self, router, mock_llm_client
    ):
        """分類應返回路由名稱和置信度。"""
        _set_classification_response(mock_llm_client, "explain_code", 0.95)

        route_name, confidence = router.classify("What does this function do?")

        assert route_name == "explain_code"
        assert confidence == pytest.approx(0.95)
        mock_llm_client.create_message.assert_called_once()

    def test_classify_with_multiple_routes(
        self, router, mock_llm_client
    ):
        """分類器應能區分多種路由。"""
        _set_classification_response(mock_llm_client, "run_command", 0.88)

        route_name, confidence = router.classify("Run the test suite please")

        assert route_name == "run_command"
        assert confidence == pytest.approx(0.88)


# ======================================================================
# route tests
# ======================================================================


class TestRoute:
    """Tests for Router.route."""

    def test_route_dispatches_to_handler(
        self, router, mock_llm_client
    ):
        """路由應分發到正確的 handler。"""
        _set_classification_response(mock_llm_client, "explain_code", 0.9)

        result = router.route("Explain this function")

        assert isinstance(result, RouteResult)
        assert result.route_name == "explain_code"
        assert result.confidence == pytest.approx(0.9)
        assert "Explained:" in result.handler_output

    def test_route_uses_fallback_on_low_confidence(
        self, router, mock_llm_client
    ):
        """低置信度時應使用 fallback 路由。"""
        _set_classification_response(mock_llm_client, "explain_code", 0.3)

        result = router.route("something ambiguous")

        # Should fall back to "chat" route since confidence < 0.7
        assert result.route_name == "chat"
        assert "Chatting:" in result.handler_output

    def test_route_result_includes_timing(
        self, router, mock_llm_client
    ):
        """路由結果應包含分類耗時。"""
        _set_classification_response(mock_llm_client, "edit_file", 0.85)

        result = router.route("Fix this bug in main.py")

        assert result.classification_time_ms >= 0
        assert isinstance(result.classification_time_ms, float)

    def test_route_without_fallback(self, mock_llm_client, sample_routes):
        """沒有 fallback 路由時，低置信度仍使用分類結果。"""
        router = Router(
            llm_client=mock_llm_client,
            routes=sample_routes,
            config=RouterConfig(confidence_threshold=0.9, fallback_route=None),
        )
        _set_classification_response(mock_llm_client, "edit_file", 0.5)

        result = router.route("edit something maybe")

        # Without fallback, should still use the classified route
        assert result.route_name == "edit_file"
        assert result.confidence == pytest.approx(0.5)


# ======================================================================
# _build_classification_prompt tests
# ======================================================================


class TestBuildClassificationPrompt:
    """Tests for Router._build_classification_prompt."""

    def test_build_classification_prompt_includes_routes(self, router):
        """分類 prompt 應包含所有路由名稱和描述。"""
        prompt = router._build_classification_prompt("test input")

        assert "explain_code" in prompt
        assert "edit_file" in prompt
        assert "run_command" in prompt
        assert "chat" in prompt
        assert "test input" in prompt
        # Should ask for JSON output
        assert "json" in prompt.lower() or "JSON" in prompt

    def test_build_classification_prompt_includes_hints(self, router):
        """分類 prompt 應包含 classifier_hint。"""
        prompt = router._build_classification_prompt("analyze this")

        # At least some hints should be present
        assert "explain" in prompt.lower() or "analyze" in prompt.lower()


# ======================================================================
# _parse_classification tests
# ======================================================================


class TestParseClassification:
    """Tests for Router._parse_classification."""

    def test_parse_classification_valid_json(self, router):
        """正確 JSON 格式應被成功解析。"""
        response = '{"route": "explain_code", "confidence": 0.92}'

        route_name, confidence = router._parse_classification(response)

        assert route_name == "explain_code"
        assert confidence == pytest.approx(0.92)

    def test_parse_classification_json_with_extra_text(self, router):
        """JSON 被額外文字包裹時仍應被正確解析。"""
        response = 'Based on analysis, the classification is: {"route": "edit_file", "confidence": 0.8} as determined.'

        route_name, confidence = router._parse_classification(response)

        assert route_name == "edit_file"
        assert confidence == pytest.approx(0.8)

    def test_parse_classification_invalid_format(self, router):
        """無效格式應返回第一條路由名稱和 0.0 置信度。"""
        response = "I think this is about explaining code"

        route_name, confidence = router._parse_classification(response)

        # Should fall back to first route with 0.0 confidence
        assert route_name == router.routes[0].name
        assert confidence == pytest.approx(0.0)

    def test_parse_classification_unknown_route(self, router):
        """未知路由名稱應返回 fallback。"""
        response = '{"route": "unknown_route", "confidence": 0.9}'

        route_name, confidence = router._parse_classification(response)

        # Should fall back since "unknown_route" is not in routes
        assert route_name == router.routes[0].name
        assert confidence == pytest.approx(0.0)
