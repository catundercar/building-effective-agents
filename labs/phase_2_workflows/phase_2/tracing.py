"""Lab 3: Tracing — 結構化追蹤與可觀測性。

本模組實現了 Trace 與 Span 系統，包括：
- Trace 生命週期管理（start → spans → end）
- Span 嵌套樹結構（父子關係）
- 時間和 token 統計
- 樹狀格式化輸出

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

import time
import uuid
from typing import Any

from .types import Span, Trace, TraceConfig


class Tracer:
    """結構化追蹤系統。

    為 Workflow 的每次執行建立完整的追蹤記錄，
    包含巢狀的 Span 樹，每個 Span 記錄一個邏輯操作的
    輸入、輸出、耗時和 metadata。

    使用範例::

        tracer = Tracer()
        trace = tracer.start_trace("code_review")

        span1 = tracer.start_span("analyze", parent=trace.root_span, input_data={"code": "..."})
        # ... 執行分析 ...
        tracer.end_span(span1, output_data={"issues": 3})

        span2 = tracer.start_span("fix", parent=trace.root_span, input_data={"issues": 3})
        # ... 執行修復 ...
        tracer.end_span(span2, output_data={"fixed": 3})

        tracer.end_trace(trace)
        print(tracer.format_trace(trace))
    """

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def __init__(self, config: TraceConfig | None = None) -> None:
        """初始化 Tracer。

        設置追蹤配置並初始化內部狀態。

        Args:
            config: 可選的 Tracer 配置（啟用/停用、詳細模式、輸出格式）
        """
        # HINT: 1. 保存 self.config = config or TraceConfig()
        # HINT: 2. 初始化一個 trace 存放字典: self._traces: dict[str, Trace] = {}
        raise NotImplementedError("TODO: Implement __init__")

    def start_trace(self, name: str) -> Trace:
        """開始一個新的追蹤。

        建立一個 Trace 物件，包含唯一 ID、名稱和根 Span。
        如果追蹤被停用（config.enabled=False），仍然建立但做最小記錄。

        Args:
            name: 追蹤名稱（例如 "code_review", "route_request"）

        Returns:
            Trace: 新建立的追蹤物件
        """
        # HINT: 1. 用 self._generate_id() 生成 trace_id
        # HINT: 2. 記錄開始時間 time.time()
        # HINT: 3. 建立 root_span = Span(span_id=self._generate_id(), name=f"{name}_root", start_time=...)
        # HINT: 4. 建立 Trace(trace_id=..., name=name, root_span=root_span, start_time=...)
        # HINT: 5. 將 trace 存入 self._traces[trace_id]
        # HINT: 6. 返回 trace
        raise NotImplementedError("TODO: Implement start_trace")

    def start_span(
        self,
        name: str,
        parent: Span,
        input_data: dict[str, Any] | None = None,
    ) -> Span:
        """在指定的 parent Span 下建立一個新的子 Span。

        子 Span 會被加入 parent 的 children 列表中。

        Args:
            name: Span 名稱（例如 "llm_call", "gate_check"）
            parent: 父 Span
            input_data: 可選的輸入資料

        Returns:
            Span: 新建立的子 Span
        """
        # HINT: 1. 用 self._generate_id() 生成 span_id
        # HINT: 2. 建立 Span(span_id=..., parent_id=parent.span_id, name=name,
        #                     start_time=time.time(), input_data=input_data or {})
        # HINT: 3. 將新 span 加入 parent.children 列表
        # HINT: 4. 返回新 span
        raise NotImplementedError("TODO: Implement start_span")

    def end_span(
        self,
        span: Span,
        output_data: dict[str, Any] | None = None,
    ) -> None:
        """結束一個 Span，記錄結束時間和輸出資料。

        Args:
            span: 要結束的 Span
            output_data: 可選的輸出資料
        """
        # HINT: 1. 設置 span.end_time = time.time()
        # HINT: 2. 如果 output_data 不為 None，設置 span.output_data = output_data
        raise NotImplementedError("TODO: Implement end_span")

    def end_trace(self, trace: Trace) -> None:
        """結束追蹤，計算彙總統計。

        結束根 Span，並遍歷所有子 Span 計算總 token 數和總耗時。

        Args:
            trace: 要結束的 Trace
        """
        # HINT: 1. 設置 trace.end_time = time.time()
        # HINT: 2. 如果 trace.root_span.end_time 為 None，結束 root_span
        # HINT: 3. 計算 total_duration_ms = (trace.end_time - trace.start_time) * 1000
        # HINT: 4. 遍歷所有 span（包括巢狀的）來計算 total_tokens:
        #          使用 self._collect_all_spans(trace.root_span)
        # HINT: 5. 對每個 span，累加 metadata 中的 "input_tokens" 和 "output_tokens"
        # HINT: 6. 設置 trace.total_tokens 和 trace.total_duration_ms
        raise NotImplementedError("TODO: Implement end_trace")

    def format_trace(self, trace: Trace) -> str:
        """將追蹤格式化為樹狀文字。

        生成一個人類可讀的樹狀結構，顯示每個 Span 的名稱、耗時、
        輸入/輸出摘要。

        Args:
            trace: 要格式化的 Trace

        Returns:
            str: 格式化的追蹤文字，適合終端顯示

        範例輸出::

            Trace: code_review (1234ms, 500 tokens)
            └── code_review_root (1200ms)
                ├── analyze (400ms)
                │   input: {"code": "def add..."}
                │   output: {"issues": 2}
                ├── gate_check (50ms)
                └── fix (700ms)
        """
        # HINT: 1. 構建標題行: f"Trace: {trace.name} ({trace.total_duration_ms:.0f}ms, {trace.total_tokens} tokens)"
        # HINT: 2. 遞迴格式化 root_span 和所有子 span
        # HINT: 3. 使用 self._format_span_tree(span, prefix, is_last) 遞迴格式化
        # HINT: 4. 每個 span 顯示: 名稱 + 耗時
        # HINT: 5. 如果 self.config.verbose，額外顯示 input_data 和 output_data
        # HINT: 6. 使用 "├── " 和 "└── " 作為樹狀分支符號
        # HINT: 7. 返回所有行拼接的字串
        raise NotImplementedError("TODO: Implement format_trace")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    @staticmethod
    def _generate_id() -> str:
        """生成唯一 ID。（已實現）"""
        return uuid.uuid4().hex[:12]

    @staticmethod
    def _format_duration(ms: float) -> str:
        """格式化耗時顯示。（已實現）

        Args:
            ms: 毫秒數

        Returns:
            str: 格式化的字串，例如 "123ms" 或 "1.5s"
        """
        if ms < 1000:
            return f"{ms:.0f}ms"
        return f"{ms / 1000:.1f}s"

    def _collect_all_spans(self, span: Span) -> list[Span]:
        """遞迴收集一個 Span 下的所有子 Span。（已實現）

        Args:
            span: 根 Span

        Returns:
            list[Span]: 所有 Span 的扁平列表（包含 span 自身）
        """
        result = [span]
        for child in span.children:
            result.extend(self._collect_all_spans(child))
        return result
