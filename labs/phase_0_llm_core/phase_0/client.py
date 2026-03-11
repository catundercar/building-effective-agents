"""Lab 1: LLM API 客戶端 — 與 Claude API 的穩定交互層。

本模組實現了 LLM 客戶端，支持：
- 基本消息發送與回應解析
- 串流 (streaming) 輸出
- 指數退避重試機制 (exponential backoff retry)

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

import json
import time
from typing import Any, Generator

import anthropic

from .types import (
    ContentBlock,
    LLMClientOptions,
    LLMResponse,
    Message,
    RetryConfig,
    StreamEvent,
    TextBlock,
    TextDeltaEvent,
    ToolUseBlock,
    ToolUseDeltaEvent,
    ToolUseStartEvent,
    MessageCompleteEvent,
    ErrorEvent,
    TokenUsage,
)


class LLMClient:
    """LLM API 客戶端，封裝 Anthropic SDK 的核心交互邏輯。"""

    def __init__(
        self,
        api_key: str | None = None,
        retry_config: RetryConfig | None = None,
    ) -> None:
        self.client = anthropic.Anthropic(api_key=api_key)
        self.retry_config = retry_config or RetryConfig()

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def create_message(
        self,
        messages: list[Message],
        options: LLMClientOptions | None = None,
    ) -> LLMResponse:
        """發送消息到 LLM API 並返回結構化回應。

        將用戶消息列表發送給 Claude API，處理回應並返回 LLMResponse。
        需要支持重試機制以應對臨時性錯誤。

        Args:
            messages: 對話歷史消息列表
            options: 可選的客戶端配置（模型、溫度、system prompt 等）

        Returns:
            LLMResponse: 結構化的 LLM 回應

        Raises:
            anthropic.APIError: 當重試次數耗盡仍然失敗時拋出
        """
        # HINT: 1. 使用 _build_request_params 構建請求參數
        # HINT: 2. 使用 _call_with_retry 包裝 API 調用以支持自動重試
        # HINT: 3. 使用 _map_response 將原始回應轉為 LLMResponse
        raise NotImplementedError("TODO: Implement create_message")

    def create_streaming_message(
        self,
        messages: list[Message],
        options: LLMClientOptions | None = None,
    ) -> Generator[StreamEvent, None, None]:
        """以串流方式發送消息並逐步返回事件。

        使用 Anthropic SDK 的串流功能，逐步 yield StreamEvent，
        允許調用方在收到部分回應時就開始處理（例如即時顯示文字）。

        Args:
            messages: 對話歷史消息列表
            options: 可選的客戶端配置

        Yields:
            StreamEvent: 串流事件（text_delta / tool_use_start / tool_use_delta /
                         message_complete / error）
        """
        # HINT: 1. 使用 _build_request_params 構建參數
        # HINT: 2. 調用 self.client.messages.stream(**params) 獲取串流
        # HINT: 3. 使用 with 語句管理串流生命週期
        # HINT: 4. 遍歷串流事件，根據 event.type 轉為對應的 StreamEvent
        #          - "content_block_start" (type=="tool_use") → ToolUseStartEvent
        #          - "content_block_delta" (delta.type=="text_delta") → TextDeltaEvent
        #          - "content_block_delta" (delta.type=="input_json_delta") → ToolUseDeltaEvent
        #          - "message_stop" → MessageCompleteEvent
        # HINT: 5. 使用 try/except 包裝，錯誤時 yield ErrorEvent
        raise NotImplementedError("TODO: Implement create_streaming_message")

    def _call_with_retry(self, fn: Any) -> Any:
        """帶指數退避的重試機制。

        對於可重試的 HTTP 狀態碼（如 429 Too Many Requests），
        使用指數退避策略自動重試，直到成功或達到最大重試次數。

        Args:
            fn: 一個無參數的 callable，執行實際的 API 調用

        Returns:
            API 調用的原始回應

        Raises:
            anthropic.APIStatusError: 當遇到不可重試的錯誤或重試次數耗盡時
        """
        # HINT: 1. 在 for 循環中嘗試調用 fn()
        # HINT: 2. 捕獲 anthropic.APIStatusError，檢查 status_code 是否在
        #          self.retry_config.retryable_status_codes 中
        # HINT: 3. 如果可重試且未達到 max_retries，計算延遲：
        #          delay = min(base_delay_ms * 2^attempt, max_delay_ms) / 1000
        #          然後 time.sleep(delay)
        # HINT: 4. 如果不可重試或已達最大次數，直接 raise
        raise NotImplementedError("TODO: Implement _call_with_retry")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    def _build_request_params(
        self,
        messages: list[Message],
        options: LLMClientOptions | None = None,
    ) -> dict[str, Any]:
        """構建 Anthropic API 請求參數。（已實現）"""
        opts = options or LLMClientOptions()

        # Convert our Message dataclasses to API-compatible dicts
        api_messages = []
        for msg in messages:
            if isinstance(msg.content, str):
                api_messages.append({"role": msg.role, "content": msg.content})
            else:
                # Convert content blocks to dicts
                blocks = []
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        blocks.append({"type": "text", "text": block.text})
                    elif isinstance(block, ToolUseBlock):
                        blocks.append({
                            "type": "tool_use",
                            "id": block.id,
                            "name": block.name,
                            "input": block.input,
                        })
                    else:
                        # ToolResultBlock
                        blocks.append({
                            "type": "tool_result",
                            "tool_use_id": block.tool_use_id,
                            "content": block.content,
                            **({"is_error": True} if block.is_error else {}),
                        })
                api_messages.append({"role": msg.role, "content": blocks})

        params: dict[str, Any] = {
            "model": opts.model,
            "max_tokens": opts.max_tokens,
            "temperature": opts.temperature,
            "messages": api_messages,
        }
        if opts.system_prompt:
            params["system"] = opts.system_prompt
        if opts.tools:
            params["tools"] = [
                {
                    "name": t.name,
                    "description": t.description,
                    "input_schema": {
                        "type": t.input_schema.type,
                        "properties": t.input_schema.properties,
                        "required": t.input_schema.required,
                    },
                }
                for t in opts.tools
            ]
        return params

    def _map_response(self, raw: Any) -> LLMResponse:
        """將 Anthropic SDK 原始回應映射為 LLMResponse。（已實現）"""
        content_blocks: list[ContentBlock] = []
        for block in raw.content:
            if block.type == "text":
                content_blocks.append(TextBlock(text=block.text))
            elif block.type == "tool_use":
                content_blocks.append(
                    ToolUseBlock(
                        id=block.id,
                        name=block.name,
                        input=block.input,
                    )
                )

        return LLMResponse(
            id=raw.id,
            content=content_blocks,
            model=raw.model,
            stop_reason=raw.stop_reason,
            usage=TokenUsage(
                input_tokens=raw.usage.input_tokens,
                output_tokens=raw.usage.output_tokens,
            ),
        )
