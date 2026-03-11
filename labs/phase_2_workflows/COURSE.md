# Phase 2 — 脈絡：Prompt Chaining 與 Routing

> **Week 5-6 · Workflow Patterns**
> 從「一次性 LLM 調用」進化到「確定性編排多次 LLM 調用」。
> 這是從 Augmented LLM 走向 Agent 的關鍵中間站。

---

## 2.0 Phase 導讀：為什麼需要 Workflow？

### 回顧：Phase 0 完成了什麼

在 Phase 0 中，你建構了一個 **Augmented LLM**——一個能調用工具、管理 Context 的 LLM 核心。每次交互的模式是：

```
用戶 → LLM → (可能調用 Tool) → 回應
```

這已經很強大了。但考慮這些真實場景：

**場景 1: Code Review**
> 「請幫我 review 這段代碼」
>
> 一個好的 review 需要：分析結構 → 找出問題 → 驗證問題是否真實 → 生成修復建議 → 組織成報告。
> 一次 LLM 調用很難同時做好所有這些步驟。

**場景 2: 智能路由**
> 「幫我修改 main.py 第 42 行」vs「今天天氣怎麼樣？」
>
> 這兩個請求需要完全不同的處理流程。前者需要文件讀取 → 修改 → 驗證流水線，
> 後者只需要簡單的對話回應。

### 解決方案：Workflow Patterns

Anthropic 在 "Building Effective Agents" 中定義了兩種基礎 Workflow 模式：

```
┌─────────────────────────────────────────────────────────┐
│                   Workflow Patterns                      │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │   Prompt Chaining    │  │      Routing             │ │
│  │                      │  │                          │ │
│  │  Step 1 → Gate →     │  │   ┌─── Handler A        │ │
│  │  Step 2 → Gate →     │  │   │                      │ │
│  │  Step 3 → Gate →     │  │  Input → Classifier ─┤   │ │
│  │  Step 4 → Output     │  │   │                      │ │
│  │                      │  │   └─── Handler B        │ │
│  └──────────────────────┘  └──────────────────────────┘ │
│                                                         │
│  關鍵特徵：流程是 **預定義** 的（確定性的）              │
└─────────────────────────────────────────────────────────┘
```

> **Workflow vs Agent 的核心區別：**
> - **Workflow**: 流程由開發者預先定義。LLM 在每一步中執行，但步驟順序和走向是確定的。
> - **Agent**: 流程由 LLM 動態決定。LLM 自主選擇下一步做什麼。（Phase 3-4 才會實現）

### 本 Phase 的目標

完成這個 Phase 後，你會掌握三個核心能力：

| 能力 | Lab | 檔案 |
|------|-----|------|
| **串行編排** — 將複雜任務分解為多步 LLM 調用 | Lab 1 | `chain.py` |
| **智能路由** — 根據意圖分類分發到不同處理器 | Lab 2 | `router.py` |
| **可觀測性** — 追蹤和記錄每次 Workflow 執行 | Lab 3 | `tracing.py` |

### 架構位置

```
┌─────────────────────────────────────────┐
│  Layer 5 · CLI Interface                │  Phase 5
├─────────────────────────────────────────┤
│  Layer 4 · Agent Core                   │  Phase 3-4
├─────────────────────────────────────────┤
│  Layer 3 · Workflow Engine    ◀── 你在這裡  │  Phase 2
│  Chaining / Routing / Tracing           │
├─────────────────────────────────────────┤
│  Layer 2 · Tool System                  │  Phase 1
├─────────────────────────────────────────┤
│  Layer 1 · LLM Core                     │  Phase 0 ✓
└─────────────────────────────────────────┘
```

---

## 2.1 Lesson 2.1 — Prompt Chaining 實現

### 概念：什麼是 Prompt Chaining？

**Prompt Chaining** 是最直覺的 Workflow 模式：把一個複雜任務拆成多個簡單步驟，前一步的輸出作為後一步的輸入。

```
                     Prompt Chaining
                     
Input → [Step 1] → Gate ✓ → [Step 2] → Gate ✓ → [Step 3] → Output
           │                    │                    │
           ▼                    ▼                    ▼
        LLM Call             LLM Call             LLM Call
```

這個概念來自一個樸素但強大的觀察：

> **LLM 在「做一件事」時比「同時做很多事」要好得多。**

考慮 Code Review 的例子：

| 方法 | Prompt | 品質 |
|------|--------|------|
| 一次性 | 「分析這段代碼的問題，生成修復，並輸出報告」 | 中等，容易遺漏 |
| 分步執行 | Step 1: 分析 → Step 2: 驗證 → Step 3: 修復 → Step 4: 報告 | 高品質，結構化 |

### 設計原則

Anthropic 提出了幾個 Chaining 的設計原則：

**1. 每步做一件事**
```
# 不好的設計：一步做太多
ChainStep("analyze_and_fix", "分析代碼問題並直接修復")

# 好的設計：職責單一
ChainStep("analyze", "分析代碼結構和潛在問題")
ChainStep("fix", "根據分析結果生成修復代碼")
```

**2. Gate 檢查保證品質**

Gate 是步驟之間的「質量關卡」——用程序化的方式檢查 LLM 輸出是否符合預期：

```
def analysis_gate(output: str) -> tuple[bool, str]:
    """檢查分析結果是否包含必要部分。"""
    required = ["function", "issue", "suggestion"]
    missing = [s for s in required if s not in output.lower()]
    if missing:
        return False, f"Missing: {', '.join(missing)}"
    return True, "OK"
```

Gate 的設計要點：
- 用**程序化**方法檢查（字串匹配、JSON 解析、正則表達式），不用 LLM 檢查
- 返回**明確的失敗原因**，這個原因會被放入重試 prompt 中
- 檢查**格式**而非**品質**（品質很難程序化判斷）

**3. 失敗恢復：哪步失敗就從哪步重試**

```
Step 1 ✓ → Step 2 ✗ (Gate Failed) → Retry Step 2 (with error context) → Step 3 → ...
```

重試時，把上一次的錯誤信息放入 prompt，讓 LLM 知道之前為什麼失敗：

```python
retry_prompt = original_prompt + f"""

[RETRY] Previous attempt failed: {error_reason}
Please fix the issue and try again.
"""
```

### Lab 1 實作指南

打開 `phase_2/chain.py`，你需要實現 `ChainRunner` 類的五個方法。

#### 步驟 1: `__init__` — 基礎初始化

這是最簡單的一步，只需保存參數：

```python
# 虛擬碼
def __init__(self, llm_client, config=None):
    self.llm_client = llm_client
    self.config = config if config is not None else ChainConfig()
```

#### 步驟 2: `_apply_gate` — Gate 邏輯

Gate 函數的封裝層。需要處理三種情況：

```
情況 1: step.gate 為 None → 返回 (True, "no gate")
情況 2: step.gate(output) 正常執行 → 返回其結果
情況 3: step.gate(output) 拋出異常 → 返回 (False, str(error))
```

#### 步驟 3: `run_step` — 核心步驟執行

這是最關鍵的方法，流程如下：

```
                    run_step 流程
                    
format_prompt(template, input) → prompt
                │
                ▼
    llm_client.create_message([{user: prompt}])
                │
                ▼
          提取 output 文字
                │
                ▼
        step.gate 存在？─── 否 ──→ 直接到 transform
                │
               是
                │
                ▼
        _apply_gate(step, output)
                │
           ┌────┴────┐
          通過       未通過
           │          │
           ▼          ▼
      到 transform   _retry_step(step, input, reason)
                          │
                          ▼
                    返回重試結果
                          
                ▼
        step.transform 存在？
           │          │
          是         否
           │          │
           ▼          ▼
    transform(output)  output
           │          │
           └────┬─────┘
                ▼
           返回最終結果
```

#### 步驟 4: `_retry_step` — 帶上下文的重試

重試的關鍵是把**錯誤原因**附加到 prompt 中：

```python
# 虛擬碼
for attempt in range(max_retries):
    enhanced_prompt = format_prompt(template, input)
    enhanced_prompt += f"\n\n[RETRY] Previous attempt failed: {error}"
    
    output = call_llm(enhanced_prompt)
    
    if gate exists:
        passed, reason = apply_gate(step, output)
        if passed:
            return transform(output) if transform else output
        error = reason  # 更新錯誤信息給下次重試
    else:
        return transform(output) if transform else output

raise RuntimeError(f"Step '{step.name}' failed after retries: {error}")
```

#### 步驟 5: `run_chain` — 串行編排

把所有步驟串起來：

```python
# 虛擬碼
trace = []
current_input = initial_input

for step in steps:
    start = time.time()
    try:
        output = run_step(step, current_input)
        duration = (time.time() - start) * 1000
        trace.append({"name": step.name, "input": current_input[:100],
                       "output": output[:100], "duration_ms": duration})
        current_input = output
    except Exception as e:
        duration = (time.time() - start) * 1000
        trace.append({"name": step.name, "input": current_input[:100],
                       "error": str(e), "duration_ms": duration})
        return ChainResult(
            steps_completed=len(trace) - 1,
            final_output="",
            trace=trace,
            success=False,
            error=str(e),
        )

return ChainResult(
    steps_completed=len(steps),
    final_output=current_input,
    trace=trace,
    success=True,
)
```

### 測試驗證

```bash
# 運行 Lab 1 測試
pytest tests/test_lab1_chain.py -v

# 關鍵測試案例：
# test_run_step_calls_llm — LLM 是否被正確調用
# test_run_chain_passes_output — 步驟間的資料傳遞
# test_run_step_gate_failure — Gate 失敗時的重試
```

---

## 2.2 Lesson 2.2 — Routing 分發器

### 概念：什麼是 Routing？

**Routing** 的核心思想是：不同的用戶請求應該走不同的處理路徑。

```
                        Routing Pattern

                    ┌─── 「解釋代碼」 → Code Analysis Pipeline
                    │
User Input → [Classifier] ─┤─── 「修改文件」 → File Edit Pipeline
                    │
                    ├─── 「運行命令」 → Shell Execution Pipeline
                    │
                    └─── 「閒聊」    → Simple Chat (cheap model)
```

Routing 的本質是 **分類 + 分發**：
1. **分類**（Classification）：判斷用戶意圖屬於哪個類別
2. **分發**（Dispatch）：將請求發送到對應的處理器

### 分類策略比較

| 策略 | 優點 | 缺點 | 適用場景 |
|------|------|------|----------|
| **LLM 分類** | 靈活、處理模糊意圖 | 較慢、有成本 | 開放式輸入 |
| **規則分類** | 快速、確定性 | 不靈活、維護困難 | 結構化命令 |
| **混合模式** | 兼具兩者優點 | 複雜度較高 | 生產環境 |

在本 Lab 中，我們實現 **LLM 分類**，這是最通用的方法。

### LLM 分類器的設計

好的分類器 prompt 需要包含：

1. **明確的任務描述** — 告訴 LLM 它是一個分類器
2. **所有可選路由** — 列出每條路由的名稱、描述和提示
3. **用戶輸入** — 需要被分類的文字
4. **輸出格式** — 要求 JSON 格式以便程序化解析

```
你是一個意圖分類器。根據用戶輸入，判斷它屬於以下哪個類別。

可用路由：
- explain_code: 解釋程式碼的功能和邏輯 (hint: User asks to explain...)
- edit_file: 修改、編輯或重構文件內容 (hint: User asks to modify...)
- run_command: 執行 shell 命令或腳本 (hint: User asks to run...)
- chat: 一般對話、問答或閒聊 (hint: General conversation...)

用戶輸入：
"""請幫我解釋這個排序算法的工作原理"""

請以 JSON 格式回應：
{"route": "路由名稱", "confidence": 0.0到1.0的置信度}
```

### 置信度與 Fallback

不是所有輸入都能被清楚地分類。我們需要一個 **置信度閾值** 機制：

```
classify(input)
    │
    ▼
(route_name, confidence)
    │
    ▼
confidence >= threshold? ─── 是 ──→ 使用分類結果
    │
   否
    │
    ▼
有 fallback route? ─── 是 ──→ 使用 fallback
    │
   否
    │
    ▼
使用分類結果（帶低置信度標記）
```

### Lab 2 實作指南

打開 `phase_2/router.py`，你需要實現 `Router` 類的五個方法。

#### 步驟 1: `__init__` — 初始化與路由表

```python
# 虛擬碼
def __init__(self, llm_client, routes, config=None):
    if not routes:
        raise ValueError("At least one route is required")
    self.llm_client = llm_client
    self.routes = routes
    self.config = config or RouterConfig()
    self._route_map = {r.name: r for r in routes}
```

#### 步驟 2: `_build_classification_prompt` — 構建分類 Prompt

這是分類品質的關鍵。一個好的 prompt 應該：

```python
# 虛擬碼
def _build_classification_prompt(self, user_input):
    route_descriptions = []
    for route in self.routes:
        route_descriptions.append(
            f"- {route.name}: {route.description} (hint: {route.classifier_hint})"
        )
    routes_text = "\n".join(route_descriptions)
    
    return f"""You are an intent classifier. Classify the user input into one of the following routes.

Available routes:
{routes_text}

User input:
\"\"\"{user_input}\"\"\"

Respond with JSON only:
{{"route": "route_name", "confidence": 0.0_to_1.0}}"""
```

#### 步驟 3: `_parse_classification` — 解析 LLM 輸出

LLM 可能返回「乾淨的 JSON」或「帶解釋的 JSON」，都需要處理：

```python
# 虛擬碼
def _parse_classification(self, response):
    try:
        # 找到 JSON 的開始和結束位置
        start = response.index("{")
        end = response.rindex("}") + 1
        data = json.loads(response[start:end])
        
        route = data.get("route", "")
        confidence = float(data.get("confidence", 0.0))
        
        # 驗證路由是否已知
        if route not in self._route_map:
            return (self.routes[0].name, 0.0)
        
        # 限制置信度在 0-1 範圍內
        confidence = max(0.0, min(1.0, confidence))
        
        return (route, confidence)
    except (ValueError, json.JSONDecodeError, KeyError):
        return (self.routes[0].name, 0.0)
```

#### 步驟 4: `classify` — 完整分類流程

```python
# 虛擬碼
def classify(self, user_input):
    prompt = self._build_classification_prompt(user_input)
    messages = [{"role": "user", "content": prompt}]
    response = self.llm_client.create_message(messages)
    text = response.content[0].text
    return self._parse_classification(text)
```

#### 步驟 5: `route` — 分類 + 分發

```python
# 虛擬碼
def route(self, user_input):
    start = time.time()
    route_name, confidence = self.classify(user_input)
    classification_time_ms = (time.time() - start) * 1000
    
    # 置信度檢查
    if confidence < self.config.confidence_threshold:
        if self.config.fallback_route and self.config.fallback_route in self._route_map:
            route_name = self.config.fallback_route
    
    # 分發
    route_obj = self._route_map.get(route_name, self.routes[0])
    handler_output = route_obj.handler(user_input)
    
    return RouteResult(
        route_name=route_name,
        confidence=confidence,
        handler_output=handler_output,
        classification_time_ms=classification_time_ms,
    )
```

### 測試驗證

```bash
# 運行 Lab 2 測試
pytest tests/test_lab2_router.py -v

# 關鍵測試案例：
# test_classify_returns_route_and_confidence — 基本分類
# test_route_uses_fallback_on_low_confidence — Fallback 機制
# test_parse_classification_invalid_format — 容錯處理
```

---

## 2.3 Lesson 2.3 — 可觀測性：Logging 與 Tracing

### 概念：為什麼可觀測性重要？

當你的 Workflow 有多個步驟時，Debug 會變得困難：

> 「Code Review 的結果不對」
> → 是 Step 1 分析錯了？Step 2 Gate 誤判了？Step 3 修復生成有問題？

沒有 Tracing，你只能猜。有了 Tracing，你能**精確定位**問題。

### Trace 與 Span 的概念

```
Trace: code_review (整次 code review 的追蹤)
│
└── root_span
    │
    ├── chain_step_1: analyze_code (400ms)
    │   ├── llm_call (350ms, 120 tokens)
    │   └── gate_check (50ms)
    │       input: {"check": "format"}
    │       output: {"passed": true}
    │
    ├── chain_step_2: generate_fixes (600ms)
    │   └── llm_call (580ms, 200 tokens)
    │
    └── chain_step_3: final_report (300ms)
        └── llm_call (280ms, 150 tokens)
```

- **Trace**: 一次完整請求的追蹤，從開始到結束
- **Span**: 追蹤中的一個邏輯操作，可以嵌套
- **Root Span**: Trace 的頂層 Span，所有其他 Span 都是它的後代

### 資料結構設計

```python
@dataclass
class Span:
    span_id: str           # 唯一 ID
    parent_id: str | None  # 父 Span ID（root 為 None）
    name: str              # 操作名稱
    start_time: float      # 開始時間戳
    end_time: float | None # 結束時間戳
    input_data: dict       # 輸入資料
    output_data: dict      # 輸出資料
    metadata: dict         # 額外資訊（token 數等）
    children: list[Span]   # 子 Span 列表

@dataclass
class Trace:
    trace_id: str          # 唯一 ID
    name: str              # 追蹤名稱
    root_span: Span        # 根 Span
    start_time: float      # 開始時間
    end_time: float | None # 結束時間
    total_tokens: int      # 所有 LLM 調用的 token 總和
    total_duration_ms: float # 總耗時
```

### Span 生命週期

```
start_span(name, parent)  →  Span 物件（end_time=None）
         │
     執行操作...
         │
end_span(span, output)    →  設置 end_time 和 output_data
```

### 格式化輸出

將 Span 樹渲染為人類可讀的文字是 Tracing 系統的重要功能。

使用樹狀結構符號：

```
Trace: code_review (1523ms, 470 tokens)
└── code_review_root (1500ms)
    ├── analyze (450ms)
    │   input: {"code": "def add(a, b)..."}
    │   output: {"issues": 2}
    ├── gate_check (23ms)
    │   input: {"check": "format"}
    │   output: {"passed": true}
    └── fix (800ms)
        input: {"issues": 2}
        output: {"fixed": 2}
```

樹狀符號的規則：
- 最後一個子項使用 `└── `
- 其他子項使用 `├── `
- 子項的延續使用 `│   ` 或 `    `（最後一項後的空白）

### Lab 3 實作指南

打開 `phase_2/tracing.py`，你需要實現 `Tracer` 類的六個方法。

#### 步驟 1: `__init__` — 初始化

```python
# 虛擬碼
def __init__(self, config=None):
    self.config = config or TraceConfig()
    self._traces = {}  # trace_id -> Trace
```

#### 步驟 2: `start_trace` — 建立追蹤

```python
# 虛擬碼
def start_trace(self, name):
    trace_id = self._generate_id()
    now = time.time()
    root_span = Span(
        span_id=self._generate_id(),
        name=f"{name}_root",
        start_time=now,
    )
    trace = Trace(
        trace_id=trace_id,
        name=name,
        root_span=root_span,
        start_time=now,
    )
    self._traces[trace_id] = trace
    return trace
```

#### 步驟 3: `start_span` — 建立子 Span

```python
# 虛擬碼
def start_span(self, name, parent, input_data=None):
    span = Span(
        span_id=self._generate_id(),
        parent_id=parent.span_id,
        name=name,
        start_time=time.time(),
        input_data=input_data or {},
    )
    parent.children.append(span)
    return span
```

#### 步驟 4: `end_span` — 結束 Span

```python
# 虛擬碼
def end_span(self, span, output_data=None):
    span.end_time = time.time()
    if output_data is not None:
        span.output_data = output_data
```

#### 步驟 5: `end_trace` — 結束追蹤並計算統計

```python
# 虛擬碼
def end_trace(self, trace):
    trace.end_time = time.time()
    if trace.root_span.end_time is None:
        trace.root_span.end_time = trace.end_time
    
    trace.total_duration_ms = (trace.end_time - trace.start_time) * 1000
    
    # 計算總 token 數
    all_spans = self._collect_all_spans(trace.root_span)
    total_tokens = 0
    for span in all_spans:
        total_tokens += span.metadata.get("input_tokens", 0)
        total_tokens += span.metadata.get("output_tokens", 0)
    trace.total_tokens = total_tokens
```

#### 步驟 6: `format_trace` — 格式化為樹狀文字

這是最有挑戰性的方法。需要遞迴地格式化 Span 樹：

```python
# 虛擬碼
def format_trace(self, trace):
    lines = []
    lines.append(
        f"Trace: {trace.name} "
        f"({self._format_duration(trace.total_duration_ms)}, "
        f"{trace.total_tokens} tokens)"
    )
    # 遞迴格式化 root span
    self._format_span(trace.root_span, lines, prefix="", is_last=True)
    return "\n".join(lines)

def _format_span(self, span, lines, prefix, is_last):
    connector = "└── " if is_last else "├── "
    duration_ms = ((span.end_time or 0) - span.start_time) * 1000
    lines.append(f"{prefix}{connector}{span.name} ({self._format_duration(duration_ms)})")
    
    # 在 verbose 模式下顯示 input/output
    child_prefix = prefix + ("    " if is_last else "│   ")
    if self.config.verbose:
        if span.input_data:
            lines.append(f"{child_prefix}input: {span.input_data}")
        if span.output_data:
            lines.append(f"{child_prefix}output: {span.output_data}")
    
    # 遞迴格式化子 span
    for i, child in enumerate(span.children):
        self._format_span(child, lines, child_prefix, i == len(span.children) - 1)
```

### 測試驗證

```bash
# 運行 Lab 3 測試
pytest tests/test_lab3_tracing.py -v

# 關鍵測試案例：
# test_start_trace_creates_root_span — Trace 基本結構
# test_nested_spans — 多層巢狀結構
# test_end_trace_computes_totals — 統計計算
# test_format_trace_tree_output — 樹狀輸出
```

---

## 2.4 Lesson 2.4 — Phase 2 整合

### 將三個 Lab 組合

完成三個 Lab 後，你可以將它們組合成一個完整的 Workflow 系統：

```
                    完整的 Workflow 系統

User Input
    │
    ▼
[Tracer: start_trace("request")]
    │
    ▼
[Router: classify intent] ──→ [Tracer: start_span("classify")]
    │
    ├── "explain_code" → [ChainRunner: analysis chain]
    │                      ├── [Tracer: start_span("step_1")]
    │                      ├── [Tracer: start_span("step_2")]
    │                      └── [Tracer: start_span("step_3")]
    │
    ├── "edit_file"    → [ChainRunner: edit chain]
    │
    └── "chat"         → [Simple handler]
    │
    ▼
[Tracer: end_trace]
    │
    ▼
Output + Trace
```

### 整合範例

```python
# 虛擬碼：完整 Workflow 系統
class WorkflowEngine:
    def __init__(self, llm_client):
        self.tracer = Tracer(config=TraceConfig(verbose=True))
        self.chain_runner = ChainRunner(llm_client=llm_client)
        self.router = Router(
            llm_client=llm_client,
            routes=create_sample_routes(),
            config=RouterConfig(fallback_route="chat"),
        )
    
    def process(self, user_input):
        # 開始追蹤
        trace = self.tracer.start_trace("request")
        
        # 路由分類
        classify_span = self.tracer.start_span(
            "classify", parent=trace.root_span,
            input_data={"input": user_input[:100]}
        )
        result = self.router.route(user_input)
        self.tracer.end_span(classify_span, output_data={
            "route": result.route_name,
            "confidence": result.confidence
        })
        
        # 根據路由執行對應的 chain
        if result.route_name == "explain_code":
            chain_span = self.tracer.start_span(
                "explain_chain", parent=trace.root_span
            )
            chain_result = self.chain_runner.run_chain(
                code_review_pipeline(), initial_input=user_input
            )
            self.tracer.end_span(chain_span, output_data={
                "success": chain_result.success,
                "steps": chain_result.steps_completed
            })
        
        # 結束追蹤
        self.tracer.end_trace(trace)
        
        # 輸出 trace
        print(self.tracer.format_trace(trace))
        
        return result
```

### 驗收檢查清單

完成 Phase 2 後，請確認以下項目：

**Lab 1: Prompt Chaining**
- [ ] `ChainRunner.run_step` 正確調用 LLM 並返回文字
- [ ] Gate 失敗時自動重試，重試包含錯誤上下文
- [ ] `run_chain` 串行傳遞每步的輸出
- [ ] Chain 中任一步驟失敗時 graceful fallback
- [ ] 支持 transform 函數

**Lab 2: Router**
- [ ] `classify` 正確調用 LLM 並返回 (route_name, confidence)
- [ ] `_parse_classification` 能處理各種 LLM 輸出格式
- [ ] 低置信度時使用 fallback 路由
- [ ] `route` 正確分發到對應的 handler

**Lab 3: Tracing**
- [ ] Trace 和 Span 有唯一 ID 和正確的時間戳
- [ ] Span 嵌套結構正確（parent-children 關係）
- [ ] `end_trace` 計算正確的 total_tokens 和 total_duration_ms
- [ ] `format_trace` 輸出可讀的樹狀結構

**整體**
- [ ] 所有測試通過: `pytest`
- [ ] 評分滿分: `python scripts/grade.py`

### 運行完整示範

```bash
# 確保所有測試通過
python scripts/grade.py

# 運行互動式 CLI（需要 ANTHROPIC_API_KEY）
python -m phase_2.cli
```

---

## 回顧與展望

### 本 Phase 學到了什麼

| 概念 | 說明 | 實際應用 |
|------|------|----------|
| **Prompt Chaining** | 將任務分解為多步串行 LLM 調用 | Code Review、翻譯、報告生成 |
| **Gate 檢查** | 步驟間的程序化品質驗證 | 格式驗證、關鍵字檢查 |
| **Routing** | 根據意圖分類分發請求 | 多功能 Agent、成本優化 |
| **Tracing** | 結構化的全鏈路追蹤 | Debug、效能分析、監控 |

### Workflow vs Agent：關鍵區別

```
Workflow（Phase 2）              Agent（Phase 3-4）
──────────────────              ─────────────────
流程是預定義的                  流程由 LLM 動態決定
開發者決定步驟順序              LLM 自主選擇下一步
確定性的（同一輸入，同一路徑）  非確定性的（可能走不同路徑）
適合結構化任務                  適合開放式任務
```

### 下一步：Phase 3-4

在 Phase 3-4 中，你將實現 **Agent Core**——讓 LLM 從「按腳本演」變成「自主行動」：

- **ReAct 循環**: Reason → Act → Observe → Reason → ...
- **動態規劃**: LLM 自主決定調用哪個 Tool、走哪條路徑
- **多步推理**: 面對複雜任務時自動分解和迭代
- **錯誤恢復**: 遇到問題時自主調整策略

> Phase 2 的 Workflow 仍然會在 Agent 中被使用——當 Agent 決定走某條路徑時，
> 它可能會啟動一個 Prompt Chain 或使用 Router 來處理子任務。
> 層次分明，各司其職。

---

## 參考資料

### 核心閱讀

1. **Anthropic: Building Effective Agents**
   - Section: "Workflow Patterns — Prompt Chaining"
   - Section: "Workflow Patterns — Routing"
   - https://www.anthropic.com/research/building-effective-agents

2. **Anthropic: Messages API Documentation**
   - https://docs.anthropic.com/en/docs/build-with-claude/overview

### 延伸閱讀

3. **OpenTelemetry Concepts: Traces and Spans**
   - 了解工業級的 Tracing 標準
   - https://opentelemetry.io/docs/concepts/signals/traces/

4. **LangSmith Tracing Documentation**
   - 了解 LLM 應用的追蹤最佳實踐
   - https://docs.smith.langchain.com/

5. **Prompt Engineering Guide — Chain of Thought**
   - Chaining 的理論基礎
   - https://www.promptingguide.ai/techniques/cot

### 設計哲學

> "Start with the simplest solution possible — prompt engineering, a single LLM call.
> Only add complexity when simpler solutions demonstrably fail."
> — Anthropic, Building Effective Agents

> "Workflows are best for tasks where predictability and consistency are priorities.
> Agents shine when flexibility and model-driven decision-making are needed."
> — Anthropic, Building Effective Agents
