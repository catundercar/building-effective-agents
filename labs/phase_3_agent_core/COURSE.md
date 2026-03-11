# Phase 3 — 心智：Agentic Loop 核心引擎

> **Week 7-8 · The Reasoning Engine**
> 從 Workflow 到 Agent 的質變——你的程式將從「按步執行」進化為「自主推理」。
> 這不只是技術升級，而是整個系統設計哲學的轉變。

---

## 3.0 Phase 導讀：從 Workflow 到 Agent 的質變

### 回顧：你已經走了多遠

在前面的 Phase 中，你已經構建了：

```
Phase 0: LLM Core       — API 客戶端、Tool Use 循環、Context 管理
Phase 1: Tool System     — 文件讀寫、Shell 執行、搜索工具
Phase 2: Workflow Engine — Prompt Chaining、Routing、Evaluator
```

你的 `tool_use_loop`（Phase 0）已經能讓 LLM 自動調用工具了。
你的 Workflow Engine（Phase 2）能夠編排多步驟流程。

**但它們都有一個根本限制：流程是你預定義的。**

```
Workflow (Phase 2):
  你的代碼定義流程: Step A → Step B → Step C → 完成
  LLM 只負責執行每一步，不決定流程

Agent (Phase 3):
  你只給一個目標: "修復這個 bug"
  LLM 自己決定: 讀什麼文件 → 分析問題 → 修改代碼 → 測試 → 可能再修改
```

### Workflow vs Agent：核心差異

| 維度 | Workflow (Phase 2) | Agent (Phase 3) |
|------|-------------------|-----------------|
| 流程控制 | 你的代碼決定 | LLM 自主決定 |
| 步驟數量 | 預定義的有限步驟 | 動態的，可能 1 步或 100 步 |
| 錯誤處理 | 你的代碼處理 | LLM 自己分析和處理 |
| 停止條件 | 流程結束 | LLM 認為任務完成 |
| 適用場景 | 結構化的、可預測的任務 | 開放式的、需要探索的任務 |
| 複雜度 | 低 | 高 |
| 風險 | 低（可預測） | 高（可能跑偏） |

### 為什麼需要 Agent

想像一個真實場景：「幫我修復這個 bug」。

**用 Workflow 的思路：**
```
Step 1: 讀取錯誤日誌
Step 2: 找到相關文件
Step 3: 修改文件
Step 4: 運行測試
```

問題是：如果錯誤日誌指向 A 文件，但真正的問題在 B 文件呢？
如果測試失敗了，需要再改呢？如果修改引入了新的 bug 呢？

**用 Agent 的思路：**
```
LLM 自己決定:
  "讓我先看看錯誤信息..."
  → 讀取錯誤日誌
  "看起來問題可能在 auth 模組..."
  → 讀取 auth.py
  "嗯，這裡有個空指針問題，但可能根因在 utils.py..."
  → 讀取 utils.py
  "找到了！修改這個函數..."
  → 修改 utils.py
  "讓我驗證..."
  → 運行測試
  "測試通過了，但讓我再檢查一下..."
  → 讀取測試輸出
  "確認修復完成。"
```

Agent 的推理過程是**非線性的、探索性的**——更接近人類工程師的工作方式。

### 這個 Phase 的三個核心挑戰

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 3: 三大挑戰                        │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │   Lab 1         │  │   Lab 2          │  │  Lab 3    │  │
│  │   ReAct 循環    │  │   自我修正       │  │  權限控制 │  │
│  │                 │  │                  │  │           │  │
│  │ Think → Act     │  │ Error → Retry    │  │ Check →   │  │
│  │   → Observe     │  │   → Learn        │  │  Approve  │  │
│  │   → Think...    │  │   → Adapt        │  │  → Act    │  │
│  └─────────────────┘  └──────────────────┘  └───────────┘  │
│                                                             │
│  "怎麼做事"           "怎麼從錯誤中學習"    "怎麼安全地做"  │
└─────────────────────────────────────────────────────────────┘
```

1. **Lab 1: ReAct 循環** — Agent 怎麼推理和行動
2. **Lab 2: Error Recovery** — Agent 怎麼從錯誤中恢復
3. **Lab 3: Permissions** — Agent 怎麼安全地操作

---

## 3.1 Lesson 3.1: ReAct 循環實現

### ReAct 的核心思想

ReAct (Reason + Act) 來自 2022 年的一篇重要論文。它的核心洞察是：
**讓 LLM 在行動之前先用自然語言「思考」，能顯著提升決策質量。**

```
傳統方法（直接行動）:
  Task: "計算 2^10"
  → Action: calculator(2^10)
  → Result: 1024

ReAct 方法（先思考再行動）:
  Task: "文件裡有個 bug，找到並修復它"
  → Thought: "讓我先讀取文件來了解代碼結構"
  → Action: read_file("/src/app.py")
  → Observation: "文件內容..."
  → Thought: "我看到第 42 行有個空指針引用，在 user 為 None 時沒有檢查"
  → Action: edit_file("/src/app.py", ...)
  → Observation: "文件已修改"
  → Thought: "讓我運行測試確認修復是否正確"
  → Action: run_tests()
  → Observation: "All 15 tests passed"
  → Thought: "修復完成，測試全部通過"
  → Final Answer: "已修復 app.py 第 42 行的空指針問題..."
```

注意每個 Action 之前都有一個 Thought。Thought 讓我們（和 LLM 自己）能看到推理過程。

### Anthropic 的實現方式

在 Anthropic 的 API 中，ReAct 是**內建的**——不需要特殊的 prompt engineering：

```
LLM 的回應（stop_reason: "tool_use"）:
{
  "content": [
    { "type": "text", "text": "讓我讀取這個文件來了解代碼結構。" },   ← Thought
    { "type": "tool_use", "name": "read_file", "input": {...} }      ← Action
  ]
}

你執行工具後，把結果發回:
{
  "role": "user",
  "content": [
    { "type": "tool_result", "content": "文件內容..." }               ← Observation
  ]
}

LLM 的下一次回應可能是:
  - 更多 text + tool_use → 繼續循環
  - 純 text（stop_reason: "end_turn"）→ 任務完成
```

你的 `tool_use_loop`（Phase 0）已經實現了這個基本模式。
**Phase 3 的 AgentLoop 在此基礎上增加了：**
- 步驟追蹤（trace）：記錄每一步的 Think/Act/Observe
- 預算控制：限制 token 消耗
- 迭代限制：防止無限循環
- 結構化結果：返回 AgentResult 而不是原始 response

### Agent Loop 的完整流程

```
                    ┌─────────────────────┐
                    │   task (用戶任務)    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ build_system_prompt  │
                    │ (構建系統提示)       │
                    └──────────┬──────────┘
                               │
            ┌──────────────────▼──────────────────┐
            │           Main Loop                  │
            │  ┌───────────────────────────────┐   │
            │  │ 1. check_budget()             │   │
            │  │    超出 → 返回 budget_exceeded │   │
            │  └──────────────┬────────────────┘   │
            │                 │ OK                  │
            │  ┌──────────────▼────────────────┐   │
            │  │ 2. llm_client.create_message  │   │
            │  │    (發送消息給 LLM)            │   │
            │  └──────────────┬────────────────┘   │
            │                 │                    │
            │  ┌──────────────▼────────────────┐   │
            │  │ 3. _process_response          │   │
            │  │    (解析思考和行動)            │   │
            │  └──────────────┬────────────────┘   │
            │                 │                    │
            │  ┌──────────────▼────────────────┐   │
            │  │ 4. stop_reason?               │   │
            │  │    end_turn → 返回結果         │   │
            │  │    tool_use → 執行工具         │   │
            │  └──────┬───────────────┬────────┘   │
            │         │ tool_use      │ end_turn   │
            │  ┌──────▼──────┐        │            │
            │  │ _execute_   │        │            │
            │  │  tool       │        │            │
            │  └──────┬──────┘        │            │
            │         │               │            │
            │         └───→ 繼續循環  │            │
            │                         │            │
            └─────────────────────────┘            │
                                                   │
                    ┌──────────────────────────────┘
                    │
            ┌───────▼────────┐
            │  AgentResult   │
            │  · success     │
            │  · final_output│
            │  · trace       │
            │  · tokens      │
            └────────────────┘
```

### 關鍵實現細節

#### Messages 數組的管理

Agent Loop 中 messages 的增長模式：

```python
# 初始
messages = [
    {"role": "user", "content": "修復 app.py 中的 bug"}
]

# 第 1 輪 LLM 回應 (tool_use)
messages = [
    {"role": "user", "content": "修復 app.py 中的 bug"},
    {"role": "assistant", "content": [       # ← LLM 的回應
        TextBlock("讓我先看看文件。"),
        ToolUseBlock(name="read_file", input={"path": "/app.py"})
    ]},
    {"role": "user", "content": [            # ← 工具結果
        ToolResultBlock(tool_use_id="...", content="文件內容...")
    ]},
]

# 第 2 輪 LLM 回應 (end_turn)
messages = [
    {"role": "user", "content": "修復 app.py 中的 bug"},
    {"role": "assistant", "content": [...]},
    {"role": "user", "content": [ToolResultBlock(...)]},
    {"role": "assistant", "content": [       # ← 最終回覆
        TextBlock("已找到並修復了 bug...")
    ]},
]
```

#### Budget 控制

為什麼需要 budget 控制？因為 Agent 可能：
1. 進入無限循環（反覆嘗試同一個失敗的方法）
2. 讀取大量文件（每次都消耗大量 token）
3. 過度探索（讀取不相關的文件）

```python
# 每次 LLM 調用後更新 token 計數
tokens_used = response.usage.input_tokens + response.usage.output_tokens
self.state.total_tokens_used += tokens_used

# 每輪開始前檢查 budget
if self.state.total_tokens_used >= self.config.max_tokens_budget:
    return AgentResult(
        success=False,
        error="Token budget exceeded",
        ...
    )
```

**最佳實踐：** 不同類型的任務設置不同的 budget。簡單問答 5K tokens，
代碼修復任務 50K tokens，複雜重構任務 100K+ tokens。

### Lab 1 實戰指引

打開 `phase_3/agent_loop.py`，你會看到 6 個 TODO。建議的實現順序：

#### Step 1: `__init__` — 初始化

最簡單的開始。你需要保存參數並初始化狀態。

```
偽代碼:
self.llm_client = llm_client
self.tools = tools
self.config = config or AgentConfig()
self.state = AgentState()
```

#### Step 2: `_build_system_prompt` — 構建系統提示

告訴 LLM 它的角色和可用工具。

```
偽代碼:
tool_names = list(self.tools.keys())
prompt = f"你是一個 AI Agent。可用工具: {', '.join(tool_names)}..."
return prompt
```

#### Step 3: `_check_budget` — 預算檢查

一行代碼就能完成。

```
偽代碼:
return self.state.total_tokens_used >= self.config.max_tokens_budget
```

#### Step 4: `_execute_tool` — 工具執行

查找工具、執行、處理錯誤。

```
偽代碼:
if tool_name not in self.tools:
    return "Error: Tool not found"
try:
    return str(self.tools[tool_name](tool_input))
except Exception as e:
    return f"Error: {e}"
```

#### Step 5: `_process_response` — 回應解析

從 LLM 回應中提取 thought 和 action。

```
偽代碼:
step = AgentStep()
for block in response.content:
    if block.type == "text":
        step.thought = block.text
    elif block.type == "tool_use":
        step.tool_name = block.name
        step.tool_input = block.input
        step.action = f"調用工具: {block.name}"
return step
```

#### Step 6: `run` — 主循環 (最核心)

把前面所有的方法組合起來。這是最複雜的部分。

關鍵點：
1. 先構建 system prompt
2. 將 task 作為 user message 加入 messages
3. 進入循環：check budget → call LLM → process response → execute tool or finish
4. 每一步都記錄到 trace
5. 用 try/except 保護整個循環

### 測試你的實現

```bash
pytest tests/test_lab1_agent_loop.py -v
```

---

## 3.2 Lesson 3.2: 環境反饋與自我修正

### 為什麼 Agent 需要從錯誤中學習

Anthropic 在 "Building Effective Agents" 中強調：
**環境反饋（ground truth）是 Agent 智能的核心驅動力。**

```
一個好的 Agent:
  嘗試 → 失敗 → 分析原因 → 調整方法 → 再試 → 成功

一個差的 Agent:
  嘗試 → 失敗 → 用同樣方法再試 → 失敗 → 再試 → ... → 耗盡 budget
```

環境反饋的來源：
- **工具返回值**：`read_file` 返回「文件不存在」
- **命令輸出**：`run_tests` 返回測試失敗的詳細信息
- **錯誤信息**：Python traceback、編譯錯誤等

### 錯誤分類：三種處理策略

不是所有錯誤都應該用同樣的方式處理：

```
┌─────────────────────────────────────────────────────┐
│                   錯誤分類                           │
├──────────────────┬──────────────────────────────────┤
│    Retryable     │  暫時性問題，相同方法再試         │
│    (可重試)       │  例: timeout, rate limit, 503    │
│                  │  策略: 等待後重試                 │
├──────────────────┼──────────────────────────────────┤
│  Strategy Change │  方法有問題，需要換路              │
│  (換策略)         │  例: 文件不存在, 語法錯誤         │
│                  │  策略: 分析原因，嘗試不同方法      │
├──────────────────┼──────────────────────────────────┤
│     Fatal        │  不可恢復，必須停止                │
│    (致命)         │  例: 認證失敗, 權限不足           │
│                  │  策略: 報告錯誤，停止執行          │
└──────────────────┴──────────────────────────────────┘
```

### 恢復策略的選擇

策略不是隨機選的，而是基於**失敗歷史**：

```
第 1 次失敗 (retryable):
  → simple_retry（簡單重試）
  → "之前的嘗試遇到了暫時性問題，請用相同方法再試。"

第 2 次失敗 (strategy_change):
  → adjust_approach（微調方法）
  → "之前的方法有問題，請分析錯誤原因，做小幅調整後重試。"

第 3 次失敗 (重複失敗):
  → alternative_approach（完全不同方法）
  → "之前的方法已反覆失敗，請用完全不同的方法解決。"
```

### 重試提示的設計

重試時，你不只是再次發送原始 prompt。你需要把錯誤歷史注入到新的 prompt 中：

```
原始 prompt:
  "讀取 /tmp/data.csv 並計算平均值"

第一次重試的 prompt (帶錯誤上下文):
  "讀取 /tmp/data.csv 並計算平均值

  --- 之前的嘗試失敗了 ---
  失敗歷史:
    嘗試 1: [FileNotFoundError] File /tmp/data.csv not found

  恢復策略: adjust_approach
  之前的方法有問題。請分析錯誤原因，對方法做小幅調整後重試。

  請基於以上信息，嘗試一個不同的方法來完成任務。"
```

這讓 LLM 能看到之前做了什麼、出了什麼問題，從而做出更好的決策。

### 避免重複失敗

一個常見的問題是 Agent 反覆犯同一個錯誤：

```
❌ 差的行為:
  嘗試讀取 /tmp/file.txt → 失敗 (不存在)
  嘗試讀取 /tmp/file.txt → 失敗 (不存在)
  嘗試讀取 /tmp/file.txt → 失敗 (不存在)
  ...

✅ 好的行為:
  嘗試讀取 /tmp/file.txt → 失敗 (不存在)
  嘗試列出 /tmp/ 目錄 → 成功 (找到 data.txt)
  嘗試讀取 /tmp/data.txt → 成功
```

`_detect_repeated_failures()` 方法就是用來檢測這種模式的。
當它檢測到重複失敗時，`get_recovery_strategy()` 會選擇更激進的策略。

### Lab 2 實戰指引

打開 `phase_3/error_recovery.py`，你會看到 6 個 TODO。建議順序：

#### Step 1: `__init__` — 初始化

```
偽代碼:
self.config = config or RecoveryConfig()
self.error_history = []
self.strategy_changes = 0
```

#### Step 2: `record_error` — 記錄錯誤（最簡單）

```
偽代碼:
self.error_history.append(error_record)
```

#### Step 3: `categorize_error` — 分類錯誤

用關鍵字匹配來判斷類別。

```
偽代碼:
error_msg = str(error).lower()
# 檢查 retryable 關鍵字: timeout, rate limit, connection, ...
# 檢查 fatal 關鍵字: permission denied, authentication, ...
# 其他 → strategy_change
```

#### Step 4: `should_retry` — 重試判斷

根據分類和限制決定是否重試。

```
偽代碼:
if category == "fatal": return False
if category == "retryable": return attempt <= max_retries
if category == "strategy_change": return changes < max_strategy_changes
```

#### Step 5: `get_recovery_strategy` — 選擇策略

根據失敗歷史決定使用哪個策略。

#### Step 6: `build_retry_prompt` — 構建重試提示

把原始 prompt + 錯誤歷史 + 策略建議組合起來。

### 測試你的實現

```bash
pytest tests/test_lab2_error_recovery.py -v
```

---

## 3.3 Lesson 3.3: Human-in-the-loop 設計

### 為什麼需要人機交互

一個完全自主的 Agent 是危險的。想像：

```
用戶: "幫我清理臨時文件"
Agent:
  → 思考: "讓我看看有哪些臨時文件..."
  → 執行: list_files("/tmp")
  → 思考: "找到 50 個文件，讓我全部刪除"
  → 執行: delete_file("/tmp/important_backup.sql")  ← 危險！
  → 執行: delete_file("/tmp/ssh_config_backup")     ← 危險！
  → ...
```

沒有確認機制，Agent 可能刪除重要的文件。

**人機交互的核心原則：** 讓 Agent 在「不確定」或「有風險」的操作前暫停，
讓人類做最終決定。

### 三級權限模型

```
┌──────────────────────────────────────────────────────┐
│                   權限等級                            │
├──────────┬───────────────────────────────────────────┤
│   Auto   │ 自動執行，不需要確認                      │
│          │ 適用: 讀取文件、搜索、查詢                │
│          │ 風險: 低                                  │
├──────────┼───────────────────────────────────────────┤
│  Confirm │ 需要用戶確認才能執行                      │
│          │ 適用: 寫入文件、修改配置、執行命令        │
│          │ 風險: 中                                  │
├──────────┼───────────────────────────────────────────┤
│   Deny   │ 直接拒絕，不允許執行                      │
│          │ 適用: 刪除系統文件、sudo 命令             │
│          │ 風險: 高                                  │
└──────────┴───────────────────────────────────────────┘
```

### 規則匹配：Glob 模式

使用 glob 模式來匹配工具名稱，而不是精確匹配：

```python
# 規則定義
rules = [
    PermissionRule(tool_pattern="read_*",   level="auto"),    # 所有讀取操作
    PermissionRule(tool_pattern="write_*",  level="confirm"), # 所有寫入操作
    PermissionRule(tool_pattern="delete_*", level="confirm"), # 所有刪除操作
    PermissionRule(tool_pattern="sudo_*",   level="deny"),    # 所有 sudo 操作
]

# 匹配邏輯
fnmatch.fnmatch("read_file", "read_*")    → True  → auto
fnmatch.fnmatch("write_file", "write_*")  → True  → confirm
fnmatch.fnmatch("delete_all", "delete_*") → True  → confirm
fnmatch.fnmatch("sudo_exec", "sudo_*")    → True  → deny
```

為什麼用 glob 而不是精確匹配？因為你可能隨時添加新工具。
`read_*` 模式能自動覆蓋 `read_file`, `read_dir`, `read_config` 等所有讀取工具。

### 風險評估

除了規則匹配，還可以根據工具名稱和輸入參數評估風險：

```
高風險 (high):
  - 工具名包含: delete, remove, drop, exec, shell, sudo
  - 輸入包含: rm, sudo, chmod, DROP TABLE

中等風險 (medium):
  - 工具名包含: write, edit, modify, create, update

低風險 (low):
  - 工具名包含: read, get, list, search, find, view
```

### 確認流程的 UX 設計

一個好的確認提示應該讓用戶快速理解將要發生什麼：

```
=== Permission Request [MEDIUM RISK] ===
Tool:        write_file
Description: 將修復後的代碼寫入文件
Input:       {"path": "/src/app.py", "content": "..."}
Risk Level:  medium
========================================
Allow this operation? (y/n)
```

注意：
- 明確標示**風險等級**
- 顯示**工具名稱和輸入參數**
- 截斷過長的輸入（不要顯示 10K 字的文件內容）
- 簡單的 y/n 互動

### Claude Code 的做法

Claude Code 使用了更細緻的權限模型：

```
1. 讀取操作 → 自動批准
   - read_file, list_files, search_code

2. 寫入操作 → 需要確認（顯示 diff）
   - write_file → 顯示修改前後的對比
   - edit_file → 顯示具體的修改內容

3. 命令執行 → 需要確認（顯示命令和工作目錄）
   - run_command → 顯示 "$ npm test" 在 /project/dir 下

4. 破壞性操作 → 額外警告
   - delete_file → "[WARNING] This will permanently delete..."
```

在 Phase 5（CLI）中，你會實現完整的確認 UI。
Phase 3 先實現底層的權限邏輯。

### Lab 3 實戰指引

打開 `phase_3/permissions.py`，你會看到 5 個 TODO。

#### Step 1: `__init__` — 初始化

```
偽代碼:
if config is None:
    config = PermissionConfig(rules=create_default_rules())
self.config = config
self.user_input_fn = user_input_fn or (lambda desc: False)
```

#### Step 2: `_match_rule` — 規則匹配

```
偽代碼:
for rule in self.config.rules:
    if fnmatch.fnmatch(tool_name, rule.tool_pattern):
        return rule
return None
```

#### Step 3: `_assess_risk` — 風險評估

```
偽代碼:
# 檢查工具名稱中的高/中/低風險關鍵字
# 返回 "high", "medium", 或 "low"
```

#### Step 4: `request_approval` — 請求確認

```
偽代碼:
description = format_permission_request(request)
approved = self.user_input_fn(description)
return PermissionResult(allowed=approved, ...)
```

#### Step 5: `check_permission` — 主檢查流程

把規則匹配、風險評估、確認請求串起來。

```
偽代碼:
# 1. 如果 auto_approve_read 且風險低 → 自動批准
# 2. 查找匹配規則 → 按規則等級處理
# 3. 使用默認等級
```

### 測試你的實現

```bash
pytest tests/test_lab3_permissions.py -v
```

---

## 3.4 Phase 3 整合

### 把三個 Lab 串起來

當 Lab 1-3 都實現後，你可以把它們整合到一起：

```python
from phase_3.agent_loop import AgentLoop
from phase_3.error_recovery import ErrorRecovery
from phase_3.permissions import PermissionManager

# 完整的 Agent = Loop + Recovery + Permissions
class Agent:
    def __init__(self, llm_client, tools, config):
        self.loop = AgentLoop(llm_client, tools, config)
        self.recovery = ErrorRecovery()
        self.permissions = PermissionManager()

    def run(self, task):
        # 在工具執行前檢查權限
        # 在遇到錯誤時使用恢復策略
        # 核心還是 AgentLoop.run()
        return self.loop.run(task)
```

### 啟動 CLI

```bash
# 設置 API Key
export ANTHROPIC_API_KEY=sk-ant-...

# 啟動 Agent CLI
python -m phase_3.cli
```

### 試試這些任務

1. **簡單問答**（不需要工具）：
   ```
   Task> 解釋什麼是 ReAct 模式
   ```
   觀察 Agent 直接回覆，不調用工具。

2. **文件操作**（需要工具）：
   ```
   Task> 讀取 /tmp/test.py 的內容並分析它做了什麼
   ```
   觀察 Agent 調用 read_file 然後分析。

3. **使用示範任務**：
   ```
   Task> /tasks          （列出所有示範任務）
   Task> /run 1          （運行第 1 個示範任務）
   ```

4. **查看推理追蹤**：
   ```
   Task> /trace           （顯示上次任務的完整 Think/Act/Observe 記錄）
   ```

### 查看成績

```bash
python scripts/grade.py
```

你應該看到類似這樣的輸出：

```
╔══════════════════════════════════════════════╗
║       Phase 3: Agentic Loop — 評分          ║
╚══════════════════════════════════════════════╝

  Lab 1: Agent Loop
  Source: phase_3/agent_loop.py
  [████████████████████████████████] 10/10 (100%)

  Lab 2: Error Recovery
  Source: phase_3/error_recovery.py
  [████████████████████████████████] 10/10 (100%)

  Lab 3: Permissions
  Source: phase_3/permissions.py
  [████████████████████████████████] 9/9 (100%)

────────────────────────────────────────────────
  Overall Progress
  [████████████████████████████████] 29/29 (100%)

  ★ 全部通過！ — 29/29 tests passing (100%)
```

---

## 3.5 回顧與展望

### 你在這個 Phase 學到了什麼

| 概念 | 你學到的 | 為什麼重要 |
|------|---------|-----------|
| ReAct 循環 | Think → Act → Observe 迭代 | Agent 的核心推理模式 |
| Agent Loop | 主循環結構、狀態管理、trace | 自主推理的工程實現 |
| Budget 控制 | Token 預算、迭代限制 | 防止失控和浪費 |
| 錯誤分類 | retryable / strategy_change / fatal | 不同錯誤需要不同處理 |
| 恢復策略 | 簡單重試 / 調整 / 完全換方法 | 從錯誤中學習 |
| 重試提示 | 注入錯誤歷史到 prompt | 讓 LLM 看到之前的失敗 |
| 權限系統 | auto / confirm / deny 三級 | Agent 安全性的基礎 |
| Glob 匹配 | 用模式匹配工具名稱 | 靈活的規則定義 |
| 風險評估 | 根據名稱/輸入判斷風險 | 自動化的安全檢查 |

### 你構建了什麼

```
┌────────────────────────────────────────────────────┐
│  Phase 3: Agentic Loop 核心引擎                    │
│                                                    │
│  ┌──────────────────────┐  ┌────────────────────┐  │
│  │   Agent Loop         │  │  Error Recovery    │  │
│  │  · run()            │  │  · categorize      │  │
│  │  · _process_response│  │  · should_retry    │  │
│  │  · _execute_tool    │  │  · get_strategy    │  │
│  │  · _check_budget    │  │  · build_prompt    │  │
│  │  · _build_prompt    │  │  · record_error    │  │
│  └──────────────────────┘  └────────────────────┘  │
│                                                    │
│  ┌──────────────────────┐  ┌────────────────────┐  │
│  │  Permission Manager  │  │  Sample Tasks      │  │
│  │  · check_permission │  │  · Q&A              │  │
│  │  · request_approval │  │  · Read file        │  │
│  │  · _match_rule      │  │  · Multi-step       │  │
│  │  · _assess_risk     │  │  · Error recovery   │  │
│  └──────────────────────┘  │  · Permissions      │  │
│                            └────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  CLI (Interactive Agent REPL)                │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Workflow vs Agent 的決策框架

經過這個 Phase，你應該能判斷何時用 Workflow、何時用 Agent：

```
┌─────────────────────────────────────────────────────────┐
│              Workflow vs Agent 決策樹                    │
│                                                         │
│  任務結構清晰？ ──→ Yes ──→ 步驟數可預測？             │
│       │                          │                      │
│       No                    Yes ──→ 用 Workflow         │
│       │                          │                      │
│       ▼                    No ──→ 用 Agent              │
│  需要動態探索？                                         │
│       │                                                 │
│  Yes ──→ 用 Agent                                       │
│  No  ──→ 用 Workflow                                    │
└─────────────────────────────────────────────────────────┘
```

### Phase 0-3 的完整架構

到目前為止，你構建的系統架構：

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Phase 3: Agent Core                                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ AgentLoop · ErrorRecovery · PermissionManager   │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │ uses                          │
│  Phase 2: Workflow Engine                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │ PromptChaining · Router · Evaluator             │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │ uses                          │
│  Phase 1: Tool System                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │ FileTools · ShellExecutor · SearchTools         │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │ uses                          │
│  Phase 0: LLM Core                                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │ LLMClient · ToolLoop · ContextManager           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 下一步：Phase 4 預告

Phase 4 (進階：多 Agent 協作與評估) 將帶你進入更高階的 Agent 設計：

- **Multi-Agent 系統**：多個 Agent 協作完成複雜任務
- **Orchestrator-Workers 模式**：一個指揮 Agent 分配任務給多個工作 Agent
- **Eval 系統**：如何系統性地評估 Agent 的表現
- **自我修正的進階技巧**：讓 Agent 自己評估自己的輸出質量

你的 Agent 將從「單打獨鬥」進化為「團隊作戰」。

---

## 參考資料

### 必讀
1. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) § Agents — Anthropic 對 Agent 模式的定義和最佳實踐
2. [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) — ReAct 論文原文
3. [Anthropic Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) — Tool Use 的完整文檔

### 深入閱讀
4. [Chain-of-Thought Prompting](https://arxiv.org/abs/2201.11903) — 思維鏈推理的原始論文
5. [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366) — 從錯誤中學習的 Agent 框架
6. [Constitutional AI](https://arxiv.org/abs/2212.08073) — AI 安全和行為約束的設計思路

### 擴展思考
- ReAct 中的 Thought 步驟真的是必要的嗎？（提示：Claude 的內部推理 vs 顯式思考）
- 無限 budget 的 Agent 會比有限 budget 的表現更好嗎？（提示：探索 vs 收斂）
- 確認提示太多會怎麼樣？太少呢？最佳的平衡點在哪裡？（提示：UX vs 安全性）
- 如果把 ErrorRecovery 的策略選擇也交給 LLM 來做，效果會更好嗎？（提示：meta-reasoning）
