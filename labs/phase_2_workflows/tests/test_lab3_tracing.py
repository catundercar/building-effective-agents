"""Lab 3 測試: Tracing — Span 嵌套、Trace 生命週期、格式化輸出。

測試覆蓋:
- start_trace: 建立 trace 與 root span
- start_span: 子 span 建立與父子關係
- end_span: 記錄結束時間與輸出
- end_trace: 計算彙總統計
- 嵌套 spans: 多層巢狀結構
- format_trace: 樹狀文字輸出
- disabled mode: 停用追蹤
- metadata: span 額外資訊
"""

from __future__ import annotations

import sys
import time
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure shared utils are importable
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared"))

from phase_2.tracing import Tracer
from phase_2.types import Span, Trace, TraceConfig


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def tracer():
    """Create a Tracer with default config."""
    return Tracer(config=TraceConfig(enabled=True, verbose=False))


@pytest.fixture
def verbose_tracer():
    """Create a Tracer with verbose output."""
    return Tracer(config=TraceConfig(enabled=True, verbose=True))


# ======================================================================
# start_trace tests
# ======================================================================


class TestStartTrace:
    """Tests for Tracer.start_trace."""

    def test_start_trace_creates_root_span(self, tracer):
        """start_trace 應建立帶有 root span 的 trace。"""
        trace = tracer.start_trace("test_workflow")

        assert isinstance(trace, Trace)
        assert trace.trace_id != ""
        assert trace.name == "test_workflow"
        assert trace.start_time > 0
        assert trace.end_time is None

        # Root span should exist
        assert isinstance(trace.root_span, Span)
        assert trace.root_span.span_id != ""
        assert "test_workflow" in trace.root_span.name
        assert trace.root_span.start_time > 0
        assert trace.root_span.parent_id is None

    def test_start_trace_unique_ids(self, tracer):
        """每次 start_trace 應生成唯一的 ID。"""
        trace1 = tracer.start_trace("workflow_1")
        trace2 = tracer.start_trace("workflow_2")

        assert trace1.trace_id != trace2.trace_id
        assert trace1.root_span.span_id != trace2.root_span.span_id


# ======================================================================
# start_span tests
# ======================================================================


class TestStartSpan:
    """Tests for Tracer.start_span."""

    def test_start_span_adds_child(self, tracer):
        """start_span 應將子 span 加入 parent 的 children。"""
        trace = tracer.start_trace("test")
        parent = trace.root_span

        child = tracer.start_span("llm_call", parent=parent, input_data={"prompt": "hello"})

        assert isinstance(child, Span)
        assert child.span_id != ""
        assert child.parent_id == parent.span_id
        assert child.name == "llm_call"
        assert child.input_data == {"prompt": "hello"}
        assert child.start_time > 0
        assert child.end_time is None

        # Should be in parent's children
        assert len(parent.children) == 1
        assert parent.children[0] is child

    def test_start_span_multiple_children(self, tracer):
        """一個 parent 下可以有多個子 span。"""
        trace = tracer.start_trace("test")
        parent = trace.root_span

        child1 = tracer.start_span("step_1", parent=parent)
        child2 = tracer.start_span("step_2", parent=parent)
        child3 = tracer.start_span("step_3", parent=parent)

        assert len(parent.children) == 3
        assert parent.children[0].name == "step_1"
        assert parent.children[1].name == "step_2"
        assert parent.children[2].name == "step_3"

    def test_start_span_default_input(self, tracer):
        """沒有提供 input_data 時應使用空字典。"""
        trace = tracer.start_trace("test")
        child = tracer.start_span("no_input", parent=trace.root_span)

        assert child.input_data == {}


# ======================================================================
# end_span tests
# ======================================================================


class TestEndSpan:
    """Tests for Tracer.end_span."""

    def test_end_span_records_output(self, tracer):
        """end_span 應記錄結束時間和輸出資料。"""
        trace = tracer.start_trace("test")
        span = tracer.start_span("work", parent=trace.root_span)

        tracer.end_span(span, output_data={"result": "success", "tokens": 42})

        assert span.end_time is not None
        assert span.end_time >= span.start_time
        assert span.output_data == {"result": "success", "tokens": 42}

    def test_end_span_without_output(self, tracer):
        """沒有 output_data 時，output_data 保持為空字典。"""
        trace = tracer.start_trace("test")
        span = tracer.start_span("work", parent=trace.root_span)

        tracer.end_span(span)

        assert span.end_time is not None
        assert span.output_data == {}


# ======================================================================
# end_trace tests
# ======================================================================


class TestEndTrace:
    """Tests for Tracer.end_trace."""

    def test_end_trace_computes_totals(self, tracer):
        """end_trace 應計算總耗時和總 token 數。"""
        trace = tracer.start_trace("test")

        span1 = tracer.start_span("llm_1", parent=trace.root_span,
                                   input_data={"prompt": "hello"})
        span1.metadata = {"input_tokens": 10, "output_tokens": 20}
        tracer.end_span(span1, output_data={"text": "response"})

        span2 = tracer.start_span("llm_2", parent=trace.root_span,
                                   input_data={"prompt": "world"})
        span2.metadata = {"input_tokens": 15, "output_tokens": 25}
        tracer.end_span(span2, output_data={"text": "response2"})

        tracer.end_trace(trace)

        assert trace.end_time is not None
        assert trace.total_duration_ms > 0
        assert trace.total_tokens == 70  # 10+20+15+25


# ======================================================================
# Nested spans tests
# ======================================================================


class TestNestedSpans:
    """Tests for nested span structures."""

    def test_nested_spans(self, tracer):
        """支持多層巢狀 span 結構。"""
        trace = tracer.start_trace("pipeline")
        root = trace.root_span

        # Level 1: chain step
        step_span = tracer.start_span("chain_step_1", parent=root)

        # Level 2: LLM call within chain step
        llm_span = tracer.start_span("llm_call", parent=step_span,
                                      input_data={"prompt": "analyze code"})
        tracer.end_span(llm_span, output_data={"text": "analysis result"})

        # Level 2: gate check within chain step
        gate_span = tracer.start_span("gate_check", parent=step_span,
                                       input_data={"check": "format"})
        tracer.end_span(gate_span, output_data={"passed": True})

        tracer.end_span(step_span)
        tracer.end_trace(trace)

        # Verify structure
        assert len(root.children) == 1
        assert root.children[0].name == "chain_step_1"
        assert len(step_span.children) == 2
        assert step_span.children[0].name == "llm_call"
        assert step_span.children[1].name == "gate_check"

        # Verify parent references
        assert llm_span.parent_id == step_span.span_id
        assert gate_span.parent_id == step_span.span_id
        assert step_span.parent_id == root.span_id


# ======================================================================
# format_trace tests
# ======================================================================


class TestFormatTrace:
    """Tests for Tracer.format_trace."""

    def test_format_trace_tree_output(self, verbose_tracer):
        """format_trace 應產生包含 trace 名稱和結構的樹狀輸出。"""
        trace = verbose_tracer.start_trace("code_review")

        span1 = verbose_tracer.start_span("analyze", parent=trace.root_span,
                                            input_data={"code": "x = 1"})
        span1.metadata = {"input_tokens": 10, "output_tokens": 20}
        verbose_tracer.end_span(span1, output_data={"issues": 2})

        span2 = verbose_tracer.start_span("fix", parent=trace.root_span,
                                            input_data={"issues": 2})
        verbose_tracer.end_span(span2, output_data={"fixed": 2})

        verbose_tracer.end_trace(trace)

        output = verbose_tracer.format_trace(trace)

        assert isinstance(output, str)
        assert "code_review" in output
        assert "analyze" in output
        assert "fix" in output
        # Should contain some structural elements (tree branches or indentation)
        assert len(output.split("\n")) >= 3

    def test_format_trace_empty_trace(self, tracer):
        """空 trace（只有 root span）仍應正確格式化。"""
        trace = tracer.start_trace("empty")
        tracer.end_trace(trace)

        output = tracer.format_trace(trace)

        assert isinstance(output, str)
        assert "empty" in output


# ======================================================================
# Configuration tests
# ======================================================================


class TestTracerConfig:
    """Tests for Tracer configuration."""

    def test_trace_disabled_mode(self):
        """停用追蹤時仍應建立基本結構。"""
        tracer = Tracer(config=TraceConfig(enabled=False))
        trace = tracer.start_trace("disabled_test")

        # Should still create a trace object
        assert isinstance(trace, Trace)
        assert trace.trace_id != ""

    def test_span_metadata(self, tracer):
        """span 應支持自定義 metadata。"""
        trace = tracer.start_trace("test")
        span = tracer.start_span("llm_call", parent=trace.root_span)

        # Set metadata directly
        span.metadata = {
            "model": "claude-sonnet-4-20250514",
            "input_tokens": 100,
            "output_tokens": 50,
            "temperature": 0.0,
        }

        tracer.end_span(span)

        assert span.metadata["model"] == "claude-sonnet-4-20250514"
        assert span.metadata["input_tokens"] == 100
        assert span.metadata["output_tokens"] == 50
