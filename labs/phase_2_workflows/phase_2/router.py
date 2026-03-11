"""Lab 2: Router — 意圖分類與智能路由。

本模組實現了 Routing 模式，包括：
- LLM-based 意圖分類（根據用戶輸入判斷意圖）
- 路由分發（將不同意圖導向專用處理函數）
- 置信度閾值（低置信度時使用 fallback 路由）
- 分類結果解析（從 LLM 輸出中提取路由名稱和置信度）

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

import json
import time
from typing import Any

from .types import Route, RouteResult, RouterConfig


class Router:
    """意圖分類路由器。

    使用 LLM 對用戶輸入進行意圖分類，然後將請求分發到
    對應的處理函數。支持置信度閾值和 fallback 路由。

    使用範例::

        router = Router(
            llm_client=my_client,
            routes=create_default_routes(),
            config=RouterConfig(confidence_threshold=0.8),
        )
        result = router.route("請幫我解釋這段程式碼的作用")
        print(result.route_name, result.handler_output)
    """

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def __init__(
        self,
        llm_client: Any,
        routes: list[Route],
        config: RouterConfig | None = None,
    ) -> None:
        """初始化 Router。

        保存 LLM 客戶端、路由列表和配置。需要驗證至少有一條路由。

        Args:
            llm_client: LLM 客戶端實例
            routes: 路由規則列表
            config: 可選的 Router 配置

        Raises:
            ValueError: 當 routes 為空時
        """
        # HINT: 1. 如果 routes 為空列表，raise ValueError("At least one route is required")
        # HINT: 2. 保存 self.llm_client = llm_client
        # HINT: 3. 保存 self.routes = routes
        # HINT: 4. 保存 self.config = config or RouterConfig()
        # HINT: 5. 建立路由名稱到 Route 的查找字典: self._route_map = {r.name: r for r in routes}
        raise NotImplementedError("TODO: Implement __init__")

    def classify(self, user_input: str) -> tuple[str, float]:
        """使用 LLM 分類用戶意圖。

        構建分類 prompt，調用 LLM，解析結果以獲得
        路由名稱和置信度。

        Args:
            user_input: 用戶的原始輸入文字

        Returns:
            tuple[str, float]: (路由名稱, 置信度 0.0-1.0)
        """
        # HINT: 1. 調用 self._build_classification_prompt(user_input) 構建 prompt
        # HINT: 2. 構建 messages: [{"role": "user", "content": prompt}]
        # HINT: 3. 調用 self.llm_client.create_message(messages) 獲取回應
        # HINT: 4. 從回應中提取文字（response.content[0].text 或類似方式）
        # HINT: 5. 調用 self._parse_classification(response_text) 解析結果
        # HINT: 6. 返回 (route_name, confidence)
        raise NotImplementedError("TODO: Implement classify")

    def route(self, user_input: str) -> RouteResult:
        """分類並路由用戶輸入。

        先分類意圖，再根據分類結果調用對應的 handler。
        如果置信度低於閾值，使用 fallback 路由。

        Args:
            user_input: 用戶的原始輸入文字

        Returns:
            RouteResult: 包含路由名稱、置信度、handler 輸出和耗時
        """
        # HINT: 1. 記錄開始時間 (time.time())
        # HINT: 2. 調用 self.classify(user_input) 獲取 (route_name, confidence)
        # HINT: 3. 記錄分類耗時 classification_time_ms
        # HINT: 4. 如果 confidence < self.config.confidence_threshold:
        #    a. 如果 self.config.fallback_route 存在且在 _route_map 中，使用 fallback
        #    b. 否則，仍然使用分類結果（但置信度不變）
        # HINT: 5. 從 self._route_map 中獲取 Route
        # HINT: 6. 如果找不到路由，使用 fallback 或第一條路由
        # HINT: 7. 調用 route.handler(user_input) 獲取 handler_output
        # HINT: 8. 返回 RouteResult(route_name=..., confidence=..., handler_output=..., classification_time_ms=...)
        raise NotImplementedError("TODO: Implement route")

    def _build_classification_prompt(self, user_input: str) -> str:
        """構建分類用的 LLM prompt。

        生成一個結構化的 prompt，列出所有可用路由及其描述，
        要求 LLM 返回 JSON 格式的分類結果。

        Args:
            user_input: 用戶的原始輸入文字

        Returns:
            str: 用於 LLM 分類的完整 prompt
        """
        # HINT: 1. 遍歷 self.routes，為每條路由生成描述文字:
        #          f"- {route.name}: {route.description} (hint: {route.classifier_hint})"
        # HINT: 2. 構建完整 prompt，包含：
        #          - 任務描述：你是一個意圖分類器
        #          - 所有可用路由的列表
        #          - 用戶輸入
        #          - 輸出格式要求：JSON {"route": "route_name", "confidence": 0.0-1.0}
        # HINT: 3. 返回完整的 prompt 字串
        raise NotImplementedError("TODO: Implement _build_classification_prompt")

    def _parse_classification(self, response: str) -> tuple[str, float]:
        """解析 LLM 的分類結果。

        從 LLM 輸出中提取 JSON 格式的分類結果。
        需要處理 LLM 可能在 JSON 前後添加額外文字的情況。

        Args:
            response: LLM 的原始回應文字

        Returns:
            tuple[str, float]: (路由名稱, 置信度)
                如果解析失敗，返回第一條路由的名稱和 0.0 的置信度
        """
        # HINT: 1. 嘗試從 response 中找到 JSON（可能被 ``` 包裹或有前後文字）
        # HINT: 2. 尋找 { 和 } 的位置，提取 JSON 子串
        # HINT: 3. 用 json.loads() 解析 JSON
        # HINT: 4. 提取 "route" 和 "confidence" 欄位
        # HINT: 5. 驗證 route 名稱是否在已知路由中
        # HINT: 6. 驗證 confidence 是否在 0.0-1.0 範圍內
        # HINT: 7. 如果任何步驟失敗，返回 (self.routes[0].name, 0.0)
        raise NotImplementedError("TODO: Implement _parse_classification")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    @staticmethod
    def create_default_routes() -> list[Route]:
        """建立預設路由列表。（已實現）

        包含四條示範路由：
        1. explain_code — 解釋程式碼
        2. edit_file — 修改文件
        3. run_command — 執行命令
        4. chat — 一般對話

        Returns:
            list[Route]: 四條預設路由
        """

        def explain_handler(user_input: str) -> str:
            return f"[Explain Handler] Analyzing: {user_input[:80]}..."

        def edit_handler(user_input: str) -> str:
            return f"[Edit Handler] Preparing edit for: {user_input[:80]}..."

        def run_handler(user_input: str) -> str:
            return f"[Run Handler] Executing: {user_input[:80]}..."

        def chat_handler(user_input: str) -> str:
            return f"[Chat Handler] Responding to: {user_input[:80]}..."

        return [
            Route(
                name="explain_code",
                description="解釋程式碼的功能和邏輯",
                handler=explain_handler,
                classifier_hint="User asks to explain, understand, or analyze code",
            ),
            Route(
                name="edit_file",
                description="修改、編輯或重構文件內容",
                handler=edit_handler,
                classifier_hint="User asks to modify, edit, fix, or refactor a file",
            ),
            Route(
                name="run_command",
                description="執行 shell 命令或腳本",
                handler=run_handler,
                classifier_hint="User asks to run, execute, or test something",
            ),
            Route(
                name="chat",
                description="一般對話、問答或閒聊",
                handler=chat_handler,
                classifier_hint="General conversation, greetings, or questions not about code",
            ),
        ]
