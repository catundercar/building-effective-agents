import type { PhaseContent } from "./types";

export const phase2Content: PhaseContent = {
  phaseId: 2,
  color: "#059669",
  accent: "#34D399",
  lessons: [
    // ─── Lesson 1: Prompt Chaining 引擎 ───────────────────────────────
    {
      phaseId: 2,
      lessonId: 1,
      title: "Prompt Chaining 引擎實現",
      subtitle: "Building a Chain Runner for Sequential LLM Calls",
      type: "概念 + 實踐",
      duration: "3 hrs",
      visualization: "phase2-chain",
      objectives: [
        "理解 Prompt Chaining 的設計原則：每步做一件事",
        "掌握 Gate 檢查機制：中間結果的程序化驗證",
        "實現步驟間的數據傳遞與格式轉換",
        "設計失敗恢復策略：哪步失敗就從哪步重試",
        "實現一個完整的 Code Review Pipeline",
      ],
      sections: [
        // ── Phase 導讀 ──
        {
          title: "Phase 導讀：從單次調用到流程編排",
          blocks: [
            {
              type: "callout",
              variant: "quote",
              text: "Week 5-6 · Workflow Patterns\n在 Phase 0-1 中，你的 Agent 已經能與 LLM 對話、使用工具了。\n但每次都是「一問一答」——現在是時候讓多次 LLM 調用協同工作了。",
            },
            {
              type: "heading",
              level: 3,
              text: "Workflow vs Agent：關鍵區別",
            },
            {
              type: "paragraph",
              text: "Anthropic 在 \"Building Effective Agents\" 中區分了兩種模式：",
            },
            {
              type: "table",
              headers: ["維度", "Workflow", "Agent"],
              rows: [
                ["流程控制", "由代碼預定義", "由 LLM 動態決定"],
                ["確定性", "高——流程固定", "低——每次可能不同"],
                ["適用場景", "結構化任務", "開放式任務"],
                ["調試難度", "容易——步驟可追蹤", "較難——決策不可預測"],
              ],
            },
            {
              type: "paragraph",
              text: "在這個 Phase 中，我們聚焦 Workflow 模式——用確定性的代碼來編排 LLM 調用。這是 Phase 3（Agent Loop）的重要前置。",
            },
            {
              type: "heading",
              level: 3,
              text: "你在構建什麼",
            },
            {
              type: "diagram",
              content:
                "┌─────────────────────────────────────────────────┐\n│              Workflow Engine (Phase 2)           │\n│                                                 │\n│   ┌──────────┐    ┌─────────┐    ┌──────────┐  │\n│   │ Chaining │    │ Routing │    │ Tracing  │  │\n│   │ 串行編排  │    │ 意圖路由 │    │ 可觀測性  │  │\n│   └────┬─────┘    └────┬────┘    └────┬─────┘  │\n│        │               │              │         │\n│        └───────────────┼──────────────┘         │\n│                        │                        │\n│                ┌───────┴───────┐                │\n│                │   LLM Core   │                │\n│                │  (Phase 0-1) │                │\n│                └───────────────┘                │\n└─────────────────────────────────────────────────┘",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "Prompt Chaining：將複雜任務拆成步驟，串行執行（Lab 1）",
                "Routing：根據用戶意圖，路由到不同處理器（Lab 2）",
                "Tracing：為整個流程建立可觀測性（Lab 3）",
              ],
            },
          ],
        },
        // ── 2.1 概念：Prompt Chaining ──
        {
          title: "Prompt Chaining 的核心概念",
          blocks: [
            {
              type: "paragraph",
              text: "Prompt Chaining 的核心思想非常簡單：把一個複雜任務拆成多個簡單步驟，每步用一次 LLM 調用完成，步驟之間用程序化的邏輯銜接。",
            },
            {
              type: "heading",
              level: 3,
              text: "為什麼需要 Chaining？",
            },
            {
              type: "paragraph",
              text: "單次 LLM 調用的問題在於：任務越複雜，輸出質量越不穩定。把「分析代碼 + 找 bug + 寫修復 + 驗證」塞進一個 prompt，不如拆成 4 個步驟，每步聚焦一件事。",
            },
            {
              type: "callout",
              variant: "tip",
              text: "Anthropic 建議：如果你的 prompt 超過 500 字，考慮拆成 chain。每步的 prompt 應該足夠簡短和聚焦。",
            },
            {
              type: "heading",
              level: 3,
              text: "Chain 的三要素",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "Step（步驟）：每一步的 prompt 模板和處理邏輯",
                "Gate（關卡）：步驟間的質量檢查，決定是繼續還是重試",
                "Transform（轉換）：將上一步的輸出格式化為下一步的輸入",
              ],
            },
            {
              type: "code",
              language: "python",
              code: `# Chain 的基本結構
chain_steps = [
    ChainStep(
        name="analyze",
        prompt_template="分析以下代碼的問題：\\n{code}",
        gate=lambda output: "問題" in output,  # 檢查輸出是否包含問題描述
    ),
    ChainStep(
        name="fix",
        prompt_template="根據以下分析，生成修復代碼：\\n{analysis}",
        gate=lambda output: "def " in output,  # 檢查輸出是否包含函數定義
    ),
    ChainStep(
        name="verify",
        prompt_template="驗證以下修復是否正確：\\n{fix}",
    ),
]`,
            },
          ],
        },
        // ── Lab 1 實戰指引 ──
        {
          title: "Lab 1: Prompt Chaining 引擎",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "學習目標",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "實現 ChainRunner 類，支持順序執行多個 LLM 調用步驟",
                "實現 Gate 檢查機制，在步驟間進行質量控制",
                "實現失敗重試邏輯，攜帶錯誤上下文",
                "支持 dry-run 模式預覽執行計劃",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "核心概念：Gate 檢查",
            },
            {
              type: "paragraph",
              text: "Gate 是 Chaining 中最重要的機制——它在每步之間添加程序化的驗證，確保 LLM 的輸出符合預期後才繼續下一步。",
            },
            {
              type: "diagram",
              content:
                "Step 1          Gate 1         Step 2          Gate 2         Step 3\n  │               │               │               │               │\n  ▼               ▼               ▼               ▼               ▼\n┌─────┐  output ┌─────┐  pass  ┌─────┐  output ┌─────┐  pass  ┌─────┐\n│ LLM │───────→│Check│───────→│ LLM │───────→│Check│───────→│ LLM │\n│Call 1│        │ OK? │        │Call 2│        │ OK? │        │Call 3│\n└─────┘        └──┬──┘        └─────┘        └──┬──┘        └─────┘\n                  │ fail                         │ fail\n                  ▼                               ▼\n              ┌─────┐                         ┌─────┐\n              │Retry│                         │Retry│\n              └─────┘                         └─────┘",
            },
            {
              type: "heading",
              level: 3,
              text: "Lab 1 實戰指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: run_step() — 執行單步",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def run_step(self, step, input_data):
    # 1. 用 format_prompt() 將 input_data 填入 prompt_template
    prompt = self.format_prompt(step.prompt_template, input_data)

    # 2. 調用 LLM client 獲取回應
    response = self.llm_client.create_message(prompt)
    output = extract_text(response)

    # 3. 如果 step 有 gate，執行 gate 檢查
    if step.gate:
        passed, reason = self._apply_gate(step, output)
        if not passed:
            # gate 未通過，嘗試重試
            output = self._retry_step(step, input_data, reason)

    # 4. 如果 step 有 transform，轉換輸出格式
    if step.transform:
        output = step.transform(output)

    return output`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: run_chain() — 執行完整鏈",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def run_chain(self, steps, initial_input):
    current_input = initial_input
    trace = []

    for i, step in enumerate(steps):
        try:
            output = self.run_step(step, current_input)
            trace.append({"name": step.name, "output": output})
            current_input = output  # 下一步的輸入 = 這一步的輸出
        except Exception as e:
            return ChainResult(
                steps_completed=i,
                success=False,
                error=str(e),
                trace=trace,
            )

    return ChainResult(
        steps_completed=len(steps),
        final_output=current_input,
        success=True,
        trace=trace,
    )`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 3: _apply_gate() — Gate 檢查",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def _apply_gate(self, step, output):
    try:
        passed, reason = step.gate(output)
        if passed:
            return (True, reason)
        else:
            return (False, reason)
    except Exception as e:
        return (False, f"Gate error: {e}")`,
            },
          ],
        },
        // ── 測試指引 ──
        {
          title: "測試你的實現",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: `# 運行 Lab 1 測試
pytest tests/test_lab1_chain.py -v

# 只運行某個測試
pytest tests/test_lab1_chain.py::TestChainRunner::test_run_step_calls_llm -v`,
            },
            {
              type: "callout",
              variant: "info",
              text: "所有測試使用 MagicMock 模擬 LLM 調用，不需要真實的 API Key。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "2.1.1",
          title: "實現 run_step()",
          description:
            "實現 ChainRunner.run_step() 方法。它接收一個 ChainStep 和輸入數據，調用 LLM 獲取輸出，並執行 gate 檢查。",
          labFile: "phase_2/chain.py",
          hints: [
            "使用 format_prompt() 將數據填入模板",
            "記得處理 gate 為 None 的情況（直接通過）",
            "gate 失敗時調用 _retry_step()",
          ],
          pseudocode: `prompt = self.format_prompt(step.prompt_template, input_data)
response = self.llm_client.create_message(prompt)
output = extract_text(response)
if step.gate:
    passed, reason = self._apply_gate(step, output)
    if not passed:
        output = self._retry_step(step, input_data, reason)
return output`,
        },
        {
          id: "2.1.2",
          title: "實現 run_chain()",
          description:
            "實現完整的 chain 執行邏輯。依次執行每個步驟，將輸出傳遞給下一步的輸入，記錄 trace。",
          labFile: "phase_2/chain.py",
          hints: [
            "用一個 for 迴圈遍歷 steps",
            "每步的輸出作為下一步的輸入",
            "用 try/except 捕獲失敗，返回部分結果",
          ],
          pseudocode: `current_input = initial_input
trace = []
for step in steps:
    output = self.run_step(step, current_input)
    trace.append({"name": step.name, "output": output})
    current_input = output
return ChainResult(success=True, ...)`,
        },
        {
          id: "2.1.3",
          title: "實現 _apply_gate() 和 _retry_step()",
          description:
            "實現 gate 檢查邏輯和帶錯誤上下文的重試機制。重試時應將之前的錯誤信息注入 prompt。",
          labFile: "phase_2/chain.py",
          hints: [
            "gate 是一個 callable，返回 bool",
            "重試時在 prompt 中附加錯誤信息",
            "最多重試 config.max_retries_per_step 次",
          ],
        },
      ],
      acceptanceCriteria: [
        "run_step 能正確調用 LLM 並返回輸出",
        "Gate 失敗時觸發重試",
        "run_chain 將多步串行執行，輸出流入下一步",
        "失敗時返回部分結果和錯誤信息",
        "所有 Lab 1 測試通過",
      ],
      references: [
        {
          title: "Building Effective Agents — Prompt Chaining",
          description:
            "Anthropic 對 Prompt Chaining 模式的詳細介紹，包含設計原則和使用場景。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Chain of Responsibility Pattern",
          description:
            "GoF 設計模式中的責任鏈模式，與 Prompt Chaining 有相似的設計理念。",
          url: "https://refactoring.guru/design-patterns/chain-of-responsibility",
        },
        {
          title: "Python dataclasses",
          description:
            "Python dataclass 文檔，用於理解 ChainStep、ChainResult 等類型定義。",
          url: "https://docs.python.org/3/library/dataclasses.html",
        },
      ],
    },

    // ─── Lesson 2: Routing 分發器 ───────────────────────────────────
    {
      phaseId: 2,
      lessonId: 2,
      title: "Routing 分發器實現",
      subtitle: "Intent Classification & Smart Dispatching",
      type: "概念 + 實踐",
      duration: "2.5 hrs",
      visualization: "phase2-router",
      objectives: [
        "理解 Routing 的核心：分類 + 分發",
        "掌握 LLM-based 意圖分類的設計方法",
        "實現多路由場景的智能派發",
        "建立路由準確率的測試方法論",
        "理解成本優化：不同路由可使用不同模型",
      ],
      sections: [
        {
          title: "Routing 的核心概念",
          blocks: [
            {
              type: "paragraph",
              text: "Routing 是另一種基礎 Workflow 模式。它的核心思想是：先理解用戶想做什麼，再把請求導向最合適的處理器。",
            },
            {
              type: "diagram",
              content:
                "                    ┌──────────┐\n                    │ 用戶輸入  │\n                    └────┬─────┘\n                         │\n                    ┌────▼─────┐\n                    │ Classifier│\n                    │ (LLM分類) │\n                    └────┬─────┘\n                         │\n            ┌────────────┼────────────┐\n            │            │            │\n       ┌────▼───┐   ┌───▼────┐  ┌───▼────┐\n       │解釋代碼 │   │修改文件 │  │運行命令 │\n       │Pipeline│   │Pipeline│  │Pipeline│\n       └────────┘   └────────┘  └────────┘",
            },
            {
              type: "heading",
              level: 3,
              text: "分類方式的選擇",
            },
            {
              type: "table",
              headers: ["方式", "優點", "缺點", "適用場景"],
              rows: [
                ["LLM 分類", "靈活、能處理模糊輸入", "有延遲、有成本", "複雜意圖分類"],
                ["規則分類", "快速、確定性", "不靈活", "關鍵字匹配場景"],
                ["混合模式", "先規則後 LLM", "實現稍複雜", "生產環境推薦"],
              ],
            },
            {
              type: "callout",
              variant: "tip",
              text: "成本優化技巧：分類本身可以用便宜的模型（如 Haiku），只有確定路由後才使用強模型（如 Sonnet）處理實際任務。",
            },
          ],
        },
        // ── Lab 2 指引 ──
        {
          title: "Lab 2: Router 實現",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "學習目標",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "實現 LLM-based 意圖分類器",
                "構建帶置信度的路由決策",
                "支持 fallback 路由（低置信度時的默認處理）",
                "建立路由準確率測試集",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "Lab 2 實戰指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: _build_classification_prompt() — 構建分類 Prompt",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def _build_classification_prompt(self, user_input):
    routes_desc = ""
    for route in self.routes:
        routes_desc += f"- {route.name}: {route.description}\\n"

    return f"""根據用戶輸入，判斷應該路由到哪個處理器。

可用的路由：
{routes_desc}

用戶輸入：{user_input}

請以 JSON 格式回應：
{{"route": "路由名稱", "confidence": 0.0-1.0}}"""`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: classify() — 意圖分類",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def classify(self, user_input):
    prompt = self._build_classification_prompt(user_input)
    response = self.llm_client.create_message(prompt)
    route_name, confidence = self._parse_classification(response)
    return (route_name, confidence)`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 3: route() — 完整路由流程",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def route(self, user_input):
    route_name, confidence = self.classify(user_input)

    # 低置信度 → 使用 fallback
    if confidence < self.config.confidence_threshold:
        if self.config.fallback_route:
            route_name = self.config.fallback_route

    # 找到對應的 handler 並執行
    handler = self._get_handler(route_name)
    result = handler(user_input)

    return RouteResult(
        route_name=route_name,
        confidence=confidence,
        handler_output=result,
    )`,
            },
          ],
        },
        {
          title: "測試你的實現",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: `# 運行 Lab 2 測試
pytest tests/test_lab2_router.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "2.2.1",
          title: "實現 _build_classification_prompt()",
          description:
            "構建 LLM 分類 prompt，列出所有可用路由及其描述，要求 LLM 以 JSON 格式返回分類結果。",
          labFile: "phase_2/router.py",
          hints: [
            "遍歷 self.routes 構建路由描述列表",
            "在 prompt 中明確要求 JSON 格式回應",
            "包含 classifier_hint 幫助 LLM 判斷",
          ],
        },
        {
          id: "2.2.2",
          title: "實現 classify() 和 _parse_classification()",
          description:
            "調用 LLM 進行意圖分類，並解析 JSON 回應為路由名稱和置信度。",
          labFile: "phase_2/router.py",
          hints: [
            "用 json.loads() 解析 LLM 回應",
            "處理 JSON 解析失敗的情況",
            "確保 confidence 在 0-1 範圍內",
          ],
        },
        {
          id: "2.2.3",
          title: "實現 route() 完整路由",
          description:
            "整合分類和分發：先分類意圖，再根據置信度決定是否使用 fallback，最後執行對應 handler。",
          labFile: "phase_2/router.py",
          hints: [
            "先調用 classify() 獲取路由和置信度",
            "置信度低於閾值時使用 fallback",
            "記錄路由決策用於 tracing",
          ],
        },
      ],
      acceptanceCriteria: [
        "Router 能正確分類用戶意圖",
        "低置信度時使用 fallback 路由",
        "路由決策有結構化 trace",
        "所有 Lab 2 測試通過",
      ],
      references: [
        {
          title: "Building Effective Agents — Routing",
          description:
            "Anthropic 對 Routing 模式的介紹，包含分類方式和成本優化。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Strategy Pattern",
          description:
            "GoF 設計模式中的策略模式，Router 的設計理念與之相似。",
          url: "https://refactoring.guru/design-patterns/strategy",
        },
        {
          title: "JSON Schema",
          description:
            "用於定義 LLM 分類輸出的結構化格式規範。",
          url: "https://json-schema.org/learn/getting-started-step-by-step",
        },
      ],
    },

    // ─── Lesson 3: Tracing 可觀測性 ──────────────────────────────────
    {
      phaseId: 2,
      lessonId: 3,
      title: "可觀測性：Tracing 系統",
      subtitle: "Structured Logging & Trace Visualization",
      type: "概念 + 實踐",
      duration: "2.5 hrs",
      objectives: [
        "理解結構化 Trace 的概念：Trace、Span、嵌套",
        "實現完整的 Trace 生命週期管理",
        "為 LLM 調用和 Tool 調用自動創建 Span",
        "實現終端 Trace 樹的可視化",
        "掌握性能指標的採集與展示",
      ],
      sections: [
        {
          title: "為什麼需要 Tracing",
          blocks: [
            {
              type: "paragraph",
              text: "當 Workflow 涉及多次 LLM 調用和 Tool 調用時，如果沒有可觀測性，你就像在黑箱中工作——出了問題不知道是哪一步、為什麼。",
            },
            {
              type: "heading",
              level: 3,
              text: "Trace 的結構",
            },
            {
              type: "paragraph",
              text: "一個 Trace 代表一次完整請求的全鏈路追蹤。它由多個 Span 組成，每個 Span 代表一個操作（LLM 調用、Tool 調用、Gate 檢查等）。Span 可以嵌套。",
            },
            {
              type: "diagram",
              content:
                "Trace: \"code-review-pipeline\"\n│\n├── Span: \"chain_run\" (1200ms)\n│   ├── Span: \"step_analyze\" (450ms)\n│   │   ├── Span: \"llm_call\" (400ms, 1500 tokens)\n│   │   └── Span: \"gate_check\" (2ms, pass)\n│   ├── Span: \"step_fix\" (500ms)\n│   │   ├── Span: \"llm_call\" (480ms, 2000 tokens)\n│   │   └── Span: \"gate_check\" (1ms, pass)\n│   └── Span: \"step_verify\" (250ms)\n│       └── Span: \"llm_call\" (240ms, 800 tokens)\n│\nTotal: 1200ms, 4300 tokens",
            },
            {
              type: "callout",
              variant: "info",
              text: "Trace 和 Span 的概念來自分佈式追蹤系統（如 OpenTelemetry）。雖然我們的場景更簡單，但這些概念可以直接復用。",
            },
          ],
        },
        {
          title: "Lab 3: Tracer 實現",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "學習目標",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "實現 Trace 和 Span 的生命週期管理",
                "支持 Span 的嵌套（父子關係）",
                "計算 Trace 的聚合指標（總耗時、總 token）",
                "實現終端樹狀 Trace 展示",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "Lab 3 實戰指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: start_trace() 和 start_span()",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def start_trace(self, name):
    trace_id = self._generate_id()
    root_span = Span(
        span_id=self._generate_id(),
        name=name,
        start_time=time.time(),
    )
    return Trace(
        trace_id=trace_id,
        name=name,
        root_span=root_span,
        start_time=time.time(),
    )

def start_span(self, name, parent, input_data=None):
    span = Span(
        span_id=self._generate_id(),
        parent_id=parent.span_id,
        name=name,
        start_time=time.time(),
        input_data=input_data,
    )
    parent.children.append(span)
    return span`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: end_span() 和 end_trace()",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def end_span(self, span, output_data=None):
    span.end_time = time.time()
    if output_data is not None:
        span.output_data = output_data

def end_trace(self, trace):
    trace.end_time = time.time()
    # 遞歸遍歷所有 span，計算總 token 和總耗時
    trace.total_duration_ms = (trace.end_time - trace.start_time) * 1000
    trace.total_tokens = self._sum_tokens(trace.root_span)`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 3: format_trace() — 樹狀展示",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def format_trace(self, trace):
    lines = [f"Trace: {trace.name} ({trace.total_duration_ms:.0f}ms)"]
    self._format_span(trace.root_span, lines, indent=0)
    lines.append(f"Total: {trace.total_duration_ms:.0f}ms, {trace.total_tokens} tokens")
    return "\\n".join(lines)

def _format_span(self, span, lines, indent):
    prefix = "│   " * indent + "├── "
    duration = (span.end_time - span.start_time) * 1000
    lines.append(f"{prefix}{span.name} ({duration:.0f}ms)")
    for child in span.children:
        self._format_span(child, lines, indent + 1)`,
            },
          ],
        },
        {
          title: "測試你的實現",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: `# 運行 Lab 3 測試
pytest tests/test_lab3_tracing.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "2.3.1",
          title: "實現 start_trace() 和 start_span()",
          description:
            "建立 Trace 和 Span 的創建機制。Trace 包含一個 root span，新的 span 可以作為子節點掛載。",
          labFile: "phase_2/tracing.py",
          hints: [
            "使用 _generate_id() 生成唯一 ID",
            "start_time 使用 time.time()",
            "子 span 需要加入到 parent.children 列表",
          ],
          pseudocode: `trace = Trace(trace_id=gen_id(), name=name, root_span=Span(...))
span = Span(span_id=gen_id(), parent_id=parent.span_id, ...)
parent.children.append(span)`,
        },
        {
          id: "2.3.2",
          title: "實現 end_span() 和 end_trace()",
          description:
            "關閉 Span 和 Trace，記錄結束時間，計算聚合指標。",
          labFile: "phase_2/tracing.py",
          hints: [
            "設置 end_time = time.time()",
            "遞歸遍歷 span 樹計算總 token",
            "duration_ms = (end_time - start_time) * 1000",
          ],
        },
        {
          id: "2.3.3",
          title: "實現 format_trace() 樹狀展示",
          description:
            "將 Trace 渲染為終端可讀的樹狀結構，包含每個 span 的名稱和耗時。",
          labFile: "phase_2/tracing.py",
          hints: [
            "使用遞歸遍歷 span 樹",
            "用縮進表示層級關係",
            "顯示耗時和 token 消耗",
          ],
        },
      ],
      acceptanceCriteria: [
        "Trace 和 Span 的創建和關閉正確",
        "嵌套 Span 的父子關係正確",
        "聚合指標（總耗時、總 token）計算正確",
        "format_trace 輸出可讀的樹狀結構",
        "所有 Lab 3 測試通過",
      ],
      references: [
        {
          title: "OpenTelemetry Concepts",
          description:
            "分佈式追蹤的核心概念：Trace、Span、Context Propagation。",
          url: "https://opentelemetry.io/docs/concepts/signals/traces/",
        },
        {
          title: "LangSmith Tracing",
          description:
            "LangChain 的追蹤工具，展示了 LLM 應用中 tracing 的實際用法。",
          url: "https://docs.smith.langchain.com/",
        },
        {
          title: "Python time module",
          description:
            "Python 時間模塊，用於高精度計時。",
          url: "https://docs.python.org/3/library/time.html",
        },
      ],
    },

    // ─── Lesson 4: 整合與回顧 ────────────────────────────────────────
    {
      phaseId: 2,
      lessonId: 4,
      title: "整合與回顧",
      subtitle: "Integration & Retrospective",
      type: "項目實踐",
      duration: "3 hrs",
      objectives: [
        "將 Chaining、Routing、Tracing 三個模塊整合",
        "實現一個完整的 Code Review Pipeline",
        "驗證端到端的 Workflow 執行與追蹤",
        "回顧 Phase 2 的核心知識點",
        "預覽 Phase 3 的 Agentic Loop",
      ],
      sections: [
        {
          title: "Phase 2 整合",
          blocks: [
            {
              type: "paragraph",
              text: "在前三個 Lab 中，你分別實現了 Chaining、Routing 和 Tracing。現在把它們整合起來，構建一個完整的 Workflow 系統。",
            },
            {
              type: "diagram",
              content:
                "用戶輸入\n  │\n  ▼\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│  Router  │────→│  Chain   │────→│  Output  │\n│  (路由)   │     │  (執行)   │     │  (結果)   │\n└──────────┘     └──────────┘     └──────────┘\n      │                │                │\n      └────────────────┼────────────────┘\n                       │\n                ┌──────▼──────┐\n                │   Tracer    │\n                │  (全程追蹤)  │\n                └─────────────┘",
            },
            {
              type: "heading",
              level: 3,
              text: "整合流程",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "Router 接收用戶輸入，分類意圖",
                "根據路由結果，選擇對應的 Chain Pipeline",
                "Chain 執行多步驟 LLM 調用",
                "Tracer 記錄整個過程的每個 span",
                "最終輸出結果和完整 trace",
              ],
            },
          ],
        },
        {
          title: "回顧與展望",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Phase 2 核心收穫",
            },
            {
              type: "table",
              headers: ["模塊", "核心能力", "對應設計原則"],
              rows: [
                ["Chaining", "任務分解與串行執行", "從簡單開始，按需增加複雜度"],
                ["Routing", "意圖分類與智能分發", "在 Tool 上投入比 Prompt 更多時間"],
                ["Tracing", "全鏈路可觀測性", "透明性優先"],
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "下一步：Phase 3 — Agentic Loop",
            },
            {
              type: "paragraph",
              text: "Phase 2 中的 Workflow 流程是預定義的——你在代碼中寫好了每一步該做什麼。但在 Phase 3 中，流程將由 LLM 自主決定。這是從 Workflow 到 Agent 的質變：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "Workflow：代碼告訴 LLM「先做 A，再做 B，再做 C」",
                "Agent：LLM 自己決定「我應該先做什麼、接下來做什麼」",
              ],
            },
            {
              type: "callout",
              variant: "quote",
              text: "Phase 2 教你如何「編排」LLM，Phase 3 教你如何「放手」讓 LLM 自己編排。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "2.4.1",
          title: "運行全部測試",
          description:
            "運行完整測試套件，確保 Lab 1-3 的所有 TODO 都已正確實現。\n\n目標：全部測試通過，grade.py 顯示 100%。",
          labFile: "phase_2/",
          hints: [
            "pytest -v 顯示每個測試的詳細結果",
            "pytest tests/test_lab1_chain.py 單獨運行某個 Lab 的測試",
            "pytest -x 遇到第一個失敗就停止",
          ],
          pseudocode: `# 運行所有測試
pytest -v

# 查看成績報告
python scripts/grade.py`,
        },
        {
          id: "2.4.2",
          title: "啟動 CLI 體驗 Workflow",
          description:
            "啟動 CLI，體驗完整的 Routing + Chaining + Tracing 流程。\n\n嘗試：\n- 「分析這段代碼」→ 觸發 Code Review Chain\n- 「修改 xxx 文件」→ 觸發文件編輯路由\n- 「今天天氣如何」→ 觸發閒聊路由",
          labFile: "phase_2/cli.py",
          hints: [
            "觀察 Router 的分類結果和置信度",
            "觀察 Chain 的每步執行過程",
            "用 /trace 命令查看完整 trace",
          ],
          pseudocode: `# 啟動 CLI
python -m phase_2.cli

# CLI 中可用的指令：
# /trace   — 查看最近一次的 trace
# /exit    — 退出`,
        },
        {
          id: "2.4.3",
          title: "端到端場景測試",
          description:
            "驗證完整的 Workflow 流程：用戶輸入 → 路由分類 → Chain 執行 → Trace 記錄。",
          labFile: "phase_2/cli.py",
          hints: [
            "觀察不同類型輸入的路由結果",
            "對比不同 Pipeline 的 trace 結構",
            "嘗試讓 Gate 失敗，觀察重試機制",
          ],
        },
      ],
      acceptanceCriteria: [
        "pytest 全部測試通過",
        "grade.py 顯示 100% 完成度",
        "python -m phase_2.cli 可正常啟動",
        "Router 能正確分類不同意圖",
        "Chain 能串行執行多步驟並產出結果",
        "Trace 記錄完整的執行過程",
      ],
      references: [
        {
          title: "pytest 文檔",
          description:
            "Python 測試框架 pytest 的完整文檔。",
          url: "https://docs.pytest.org/en/stable/",
        },
        {
          title: "Building Effective Agents",
          description:
            "回顧 Prompt Chaining 和 Routing 部分的設計思想。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Anthropic Messages API",
          description:
            "API 參考文檔，供整合練習時查閱。",
          url: "https://docs.anthropic.com/en/api/messages",
        },
      ],
    },
  ],
};
