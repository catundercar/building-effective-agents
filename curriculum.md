# 構建 Code Agent — 完整課程大綱

> 12 週工程實踐課程 · 從零實現一個類似 Claude Code 的 AI 編程助手
> 基於 Anthropic "Building Effective Agents" 設計哲學

---

## 課程總覽

### 目標產出
一個可通過 `npm install -g` 安裝的 CLI Agent 工具，能夠接收自然語言指令，自主規劃、讀寫文件、執行命令、迭代修正，完成真實的編程任務。

### 架構分層（自底向上）

```
┌─────────────────────────────────────────┐
│  Layer 5 · CLI Interface                │  Phase 5
│  Terminal UI / Config / Permissions     │
├─────────────────────────────────────────┤
│  Layer 4 · Agent Core                   │  Phase 3-4
│  Agentic Loop / Planner / Orchestrator  │
├─────────────────────────────────────────┤
│  Layer 3 · Workflow Engine              │  Phase 2
│  Chaining / Routing / Evaluator         │
├─────────────────────────────────────────┤
│  Layer 2 · Tool System                  │  Phase 1
│  Registry / File Ops / Shell / MCP      │
├─────────────────────────────────────────┤
│  Layer 1 · LLM Core                     │  Phase 0
│  API Client / Streaming / Token Mgmt    │
└─────────────────────────────────────────┘
```

### 核心數據流

```
User Input → CLI Parser → Agent Loop → Planner → Workflow Select
→ LLM Call → Tool Execute → Observe Result → Loop / Complete
```

### 技術棧
- **Runtime**: Node.js 20+ / TypeScript
- **LLM**: Anthropic Claude API (Messages API)
- **CLI UI**: Ink (React for CLI)
- **測試**: Vitest + 自建 eval 框架
- **學習平台**: Next.js 15 + Prisma + PostgreSQL

---

## Phase 0 — 地基：Augmented LLM 核心模塊
**Week 1-2 · The Foundation**

### 學習目標
理解並實現一個可與 LLM API 穩定交互的核心引擎，這是整個 Agent 的心臟。

### Lesson 0.1 — LLM API Client 封裝
**類型**: 代碼實踐 · 90 min

**教學目標**: 實現一個健壯的 Claude API 客戶端，支持 streaming 和 non-streaming 兩種模式。

**知識點**:
- Anthropic Messages API 的請求/響應結構
- Server-Sent Events (SSE) 與 streaming 解析
- TypeScript 類型定義與泛型封裝
- 環境變量管理與 API Key 安全存儲

**代碼練習**:
```
練習 0.1.1: 基礎 API 調用
- 實現 `createMessage(prompt, options)` 函數
- 支持 system prompt、temperature、max_tokens 參數
- 返回類型安全的 response 對象

練習 0.1.2: Streaming 實現
- 實現 `createStreamingMessage()` 使用 async generator
- 逐 token 輸出到終端（模擬打字效果）
- 處理 SSE 的 event types: message_start, content_block_delta, message_stop

練習 0.1.3: 錯誤處理與重試
- 實現 exponential backoff 重試機制
- 區分可重試錯誤（429, 500）和不可重試錯誤（400, 401）
- Rate limiting: token bucket 算法實現
```

**驗收標準**:
- [ ] streaming 輸出 TTFT < 200ms
- [ ] 429 錯誤自動重試（最多 3 次，指數退避）
- [ ] 有完整的 TypeScript 類型定義
- [ ] 通過 unit test（mock API 響應）

**參考資料**:
- Anthropic Messages API 文檔
- Node.js Streams 文檔

---

### Lesson 0.2 — Tool/Function Calling 協議
**類型**: 代碼實踐 · 120 min

**教學目標**: 實現 function calling 協議，讓 LLM 能夠自主決定何時調用工具以及使用什麼參數。

**知識點**:
- Anthropic Tool Use 的 API 格式
- JSON Schema 定義工具的 input 結構
- Tool Result 的回傳格式
- 多輪 tool use 的 message 序列管理

**代碼練習**:
```
練習 0.2.1: Tool 定義格式
- 定義 Tool 的 TypeScript interface
- 實現一個 `get_weather` tool（使用 mock 數據）
- 將 tool 定義序列化為 API 要求的格式

練習 0.2.2: Tool Use 循環
- 發送帶 tools 的 API 請求
- 解析 response 中的 tool_use content block
- 執行對應 tool handler，將結果作為 tool_result 回傳
- 循環直到 LLM 返回 end_turn

練習 0.2.3: 多 Tool 編排
- 同時註冊 3+ 個 tool（get_weather, read_file, calculate）
- 讓 LLM 在一個任務中自主選擇多個 tool
- 處理 tool 調用的錯誤情況（tool not found, invalid params）
```

**驗收標準**:
- [ ] 支持至少 3 個自定義 Tool
- [ ] LLM 能在單次對話中調用多個不同 Tool
- [ ] Tool 調用錯誤時有清晰的錯誤信息返回給 LLM
- [ ] Tool 定義有完整的 JSON Schema validation

**參考資料**:
- Anthropic Tool Use 文檔
- JSON Schema 規範

---

### Lesson 0.3 — Context Window 管理
**類型**: 代碼實踐 · 90 min

**教學目標**: 實現智能的 context window 管理策略，防止 token 溢出。

**知識點**:
- Token 計數方法（tiktoken vs 估算）
- Context window 的組成：system + messages + tools
- 截斷策略：sliding window vs summarization
- Message 優先級排序

**代碼練習**:
```
練習 0.3.1: Token 計數器
- 實現 `countTokens(messages)` 函數
- 考慮 system prompt 和 tool definitions 的 token 佔用
- 預留 max_tokens 的空間

練習 0.3.2: 自動截斷
- 當 token 數接近限制時，移除最早的 messages
- 保留 system prompt 和最近 N 條 messages
- 實現 sliding window 策略

練習 0.3.3: 摘要壓縮
- 當需要截斷大量歷史時，先調用 LLM 生成摘要
- 用摘要替換被截斷的 messages
- 確保關鍵上下文不丟失
```

**驗收標準**:
- [ ] token 計數誤差 < 5%
- [ ] context window 溢出時自動 truncate + summarize
- [ ] 摘要壓縮後仍能維持對話連貫性
- [ ] 有針對邊界情況的測試（空消息、超長單條消息）

---

### Lesson 0.4 — Phase 0 交付物整合
**類型**: 項目實踐 · 3 hrs

**教學目標**: 將前三課的模塊整合為一個可運行的 CLI 工具。

**項目要求**:
```
my-llm-core/
├── src/
│   ├── client.ts          # API 客戶端（Lesson 0.1）
│   ├── tools.ts           # Tool 系統（Lesson 0.2）
│   ├── context.ts         # Context 管理（Lesson 0.3）
│   ├── cli.ts             # CLI 入口
│   └── types.ts           # 共享類型
├── tools/
│   ├── weather.ts         # 天氣工具（mock）
│   ├── file-reader.ts     # 文件讀取工具
│   └── calculator.ts      # 計算工具
├── tests/
│   ├── client.test.ts
│   ├── tools.test.ts
│   └── context.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

**驗收**:
- [ ] `npx tsx src/cli.ts` 可啟動交互式對話
- [ ] streaming 模式實時輸出
- [ ] Tool 調用時在終端顯示調用詳情
- [ ] 長對話自動壓縮 context
- [ ] `npm test` 全部通過

---

## Phase 1 — 骨架：Tool 系統與 ACI 設計
**Week 3-4 · Agent-Computer Interface**

### 學習目標
設計並實現一套高質量的工具系統，這是 Agent 與外部世界交互的接口層。

> **核心理念**: Anthropic 在 SWE-bench 上的經驗——在工具上花的時間應該比 prompt 更多。

### Lesson 1.1 — Tool Registry 設計模式
**類型**: 設計 + 代碼 · 90 min

**教學目標**: 設計一個可擴展的 Tool Registry，支持動態註冊、驗證、發現。

**知識點**:
- Registry Pattern 在 Agent 系統中的應用
- Tool 的生命週期：定義 → 註冊 → 發現 → 調用 → 結果
- Tool Description 的工程化：如何寫出 LLM 容易理解的描述
- Poka-yoke 原則：讓工具難以被錯誤使用

**代碼練習**:
```
練習 1.1.1: Tool Interface 設計
- 定義 Tool 的完整 interface（name, description, inputSchema, handler）
- 實現 Registry 的 register / unregister / list / get
- 加入 validation（schema 校驗、name 唯一性）

練習 1.1.2: Description Engineering
- 為同一個工具寫 3 個不同的 description
- 用 LLM 測試哪個 description 導致更準確的調用
- 記錄 A/B 測試結果

練習 1.1.3: 動態 Tool 加載
- 從指定目錄自動掃描並加載 Tool 模塊
- 支持 hot reload（文件變化時重新加載）
- 實現 tool dependency 聲明
```

**驗收標準**:
- [ ] Registry 支持動態增刪，有 validation
- [ ] 每個 Tool 的 description 至少迭代過 2 個版本
- [ ] 支持從目錄自動發現和加載 tools

---

### Lesson 1.2 — 文件系統工具套件
**類型**: 代碼實踐 · 120 min

**教學目標**: 實現 Agent 操作文件系統的完整工具集。

**知識點**:
- 文件操作的原子性和安全性
- 路徑處理：絕對路徑 vs 相對路徑的陷阱
- Diff 生成與應用
- 文件搜索（glob、正則、語義搜索）

**代碼練習**:
```
練習 1.2.1: 基礎文件工具
- read_file: 支持編碼檢測、行號顯示、範圍讀取
- write_file: 支持創建、覆蓋、追加，自動創建目錄
- list_directory: 支持遞歸、過濾、.gitignore 尊重

練習 1.2.2: 高級文件工具
- search_files: glob 模式 + 內容搜索（grep 風格）
- edit_file: 基於行號或搜索替換的精確編輯
- diff_files: 生成 unified diff 格式

練習 1.2.3: 安全機制
- 路徑正規化（防止路徑穿越攻擊）
- 工作目錄限制（sandbox 邊界）
- 備份機制（編輯前自動 snapshot）
```

**關鍵設計決策**:
> 始終使用絕對路徑。Anthropic 在 SWE-bench 中發現，Agent 移出根目錄後使用相對路徑會導致大量錯誤。改為強制要求絕對路徑後，問題完全消失。

**驗收標準**:
- [ ] 所有文件工具使用絕對路徑
- [ ] 路徑穿越攻擊測試通過
- [ ] diff 輸出格式與 git diff 兼容
- [ ] 搜索支持 glob + regex + content match

---

### Lesson 1.3 — Shell 執行器與沙箱
**類型**: 代碼實踐 · 90 min

**教學目標**: 實現安全的命令行執行工具，帶超時和權限控制。

**知識點**:
- Node.js child_process 的安全使用
- 命令注入攻擊防範
- 超時和資源限制
- stdout / stderr 的流式捕獲
- 環境變量隔離

**代碼練習**:
```
練習 1.3.1: 基礎 Shell 工具
- 實現 run_command(cmd, options)
- 捕獲 stdout, stderr, exit code
- 支持 cwd (工作目錄) 和 env (環境變量) 設置

練習 1.3.2: 安全機制
- 命令黑名單（rm -rf /, sudo, etc.）
- 超時控制（默認 30s，可配置）
- 最大輸出限制（防止 OOM）

練習 1.3.3: 結構化輸出
- 將 shell 輸出格式化為 LLM 友好的結構
- 錯誤時提供 context（命令、退出碼、stderr 摘要）
- 長輸出自動截斷並提示完整輸出路徑
```

**驗收標準**:
- [ ] Shell 工具有 timeout（默認 30s）
- [ ] 命令黑名單攔截測試通過
- [ ] 輸出超過 10KB 時自動截斷
- [ ] 錯誤信息包含足夠的調試上下文

---

### Lesson 1.4 — Phase 1 交付物整合
**類型**: 項目實踐 · 3 hrs

**項目結構**:
```
my-agent-tools/
├── src/
│   ├── registry/
│   │   ├── tool-registry.ts    # Registry 核心
│   │   ├── validator.ts        # Schema 驗證
│   │   └── loader.ts           # 動態加載
│   ├── tools/
│   │   ├── file/
│   │   │   ├── read.ts
│   │   │   ├── write.ts
│   │   │   ├── search.ts
│   │   │   ├── edit.ts
│   │   │   └── diff.ts
│   │   ├── shell/
│   │   │   ├── executor.ts
│   │   │   ├── sandbox.ts
│   │   │   └── blacklist.ts
│   │   └── index.ts            # 導出所有 tools
│   └── types.ts
├── tests/
│   ├── registry.test.ts
│   ├── file-tools.test.ts
│   └── shell-tools.test.ts
├── fixtures/                   # 測試用文件
└── README.md
```

**驗收**:
- [ ] Phase 0 的 CLI 工具現在可以使用 Phase 1 的所有 tools
- [ ] Tool list 命令顯示所有已註冊工具及其描述
- [ ] 在 CLI 中要求 Agent 「讀取 src/cli.ts 並描述其功能」能正確執行

---

## Phase 2 — 脈絡：Prompt Chaining 與 Routing
**Week 5-6 · Workflow Patterns**

### 學習目標
實現兩種基礎 Workflow 模式，學會在確定性流程中編排 LLM 調用。

### Lesson 2.1 — Prompt Chaining 實現
**類型**: 代碼實踐 · 120 min

**教學目標**: 實現任務分解和串行 LLM 調用，每步之間有程序化的質量檢查。

**知識點**:
- Prompt Chaining 的設計原則：每步做一件事
- Gate 檢查：中間結果的程序化驗證
- 步驟間的數據傳遞與格式轉換
- 失敗恢復：哪步失敗就從哪步重試

**代碼練習**:
```
練習 2.1.1: Chain 抽象層
- 定義 ChainStep interface: { name, prompt, gate?, transform? }
- 實現 Chain runner: 順序執行步驟，每步輸出作為下步輸入
- Gate 函數返回 pass/fail/retry，控制流程走向

練習 2.1.2: Code Review Pipeline
- Step 1: 讀取代碼文件 → 生成結構化分析
- Step 2: Gate — 檢查分析是否包含必需字段
- Step 3: 針對每個問題生成修復建議
- Step 4: 驗證修復不引入新問題（語法檢查）

練習 2.1.3: 錯誤處理與回退
- 單步失敗時的重試策略（最多 2 次）
- 重試 prompt 包含之前的錯誤信息
- 無法恢復時的 graceful degradation
```

**驗收標準**:
- [ ] Chain 中任一步驟失敗可 graceful fallback
- [ ] Code Review Pipeline 能分析真實代碼並給出修復
- [ ] 全流程有結構化 trace log
- [ ] 支持 dry-run 模式預覽執行計劃

---

### Lesson 2.2 — Routing 分發器
**類型**: 代碼實踐 · 90 min

**教學目標**: 實現意圖分類和智能路由，將不同類型的請求導向專用處理器。

**知識點**:
- 路由的本質：分類 + 分發
- 分類方式：LLM 分類 vs 規則分類 vs 混合
- 路由目標：不同 prompt / 不同 model / 不同 workflow
- 成本優化：簡單問題用便宜模型，複雜問題用強模型

**代碼練習**:
```
練習 2.2.1: Router 核心
- 定義 Route: { name, classifier, handler }
- 實現 LLM-based classifier（返回路由名稱 + 置信度）
- 支持 fallback route（未匹配時的默認處理）

練習 2.2.2: 多路由場景
- 路由 1: "解釋代碼" → 代碼分析 pipeline
- 路由 2: "修改文件" → 文件編輯 pipeline
- 路由 3: "運行命令" → Shell 執行 pipeline
- 路由 4: "閒聊" → 簡單對話（便宜模型）

練習 2.2.3: 路由準確率測試
- 編寫 50 個測試用例（各路由至少 10 個）
- 計算分類準確率
- 分析錯誤 case 並迭代 classifier prompt
```

**驗收標準**:
- [ ] Router 準確率 > 95%（50 個測試 case）
- [ ] 支持 LLM 分類和規則分類的混合模式
- [ ] 有路由決策的 trace log
- [ ] 分類延遲 < 1s

---

### Lesson 2.3 — 可觀測性：Logging 與 Tracing
**類型**: 代碼實踐 · 90 min

**教學目標**: 為 Workflow 系統建立結構化的日誌和追蹤系統。

**知識點**:
- 結構化日誌 vs 文本日誌
- Trace 的概念：一次完整請求的全鏈路追蹤
- Span 嵌套：每個 LLM 調用 / Tool 調用都是一個 span
- 指標採集：延遲、token 消耗、成功率

**代碼練習**:
```
練習 2.3.1: Trace 系統
- 定義 Trace 和 Span 的數據結構
- 實現 startTrace() → startSpan() → endSpan() → endTrace()
- 每個 span 記錄：開始時間、結束時間、輸入、輸出、metadata

練習 2.3.2: 自動 Instrumentation
- 包裝 LLM client，自動為每次調用創建 span
- 包裝 Tool 系統，自動記錄 tool 調用
- 輸出為 JSON 格式，方便後續分析

練習 2.3.3: Trace 查看器
- 在終端以樹狀結構展示 trace
- 顯示每個 span 的耗時和 token 消耗
- 支持 --verbose 模式顯示完整 input/output
```

**驗收標準**:
- [ ] 每次請求自動生成完整的結構化 trace
- [ ] trace 包含所有 LLM 調用和 Tool 調用
- [ ] 終端可以美觀地展示 trace 樹

---

### Lesson 2.4 — Phase 2 交付物整合
**類型**: 項目實踐 · 3 hrs

**項目結構**:
```
my-agent-workflows/
├── src/
│   ├── workflows/
│   │   ├── chain.ts           # Prompt Chaining 引擎
│   │   ├── router.ts          # Routing 分發器
│   │   └── pipeline/
│   │       ├── code-review.ts  # Code Review Pipeline
│   │       ├── file-edit.ts    # 文件編輯 Pipeline
│   │       └── explain.ts      # 代碼解釋 Pipeline
│   ├── tracing/
│   │   ├── tracer.ts          # Trace 系統核心
│   │   ├── spans.ts           # Span 定義
│   │   └── viewer.ts          # 終端 Trace 查看
│   └── index.ts
├── tests/
│   ├── chain.test.ts
│   ├── router.test.ts
│   ├── router-accuracy.test.ts # 50 case 準確率測試
│   └── tracing.test.ts
└── README.md
```

---

## Phase 3 — 心智：Agentic Loop 核心引擎
**Week 7-8 · The Reasoning Engine**

### 學習目標
實現 Agent 的核心循環——讓 LLM 自主規劃、執行、觀察、反思，直到完成任務。這是從 workflow 到 agent 的質變。

> **關鍵轉變**: Workflow 的流程是預定義的，Agent 的流程是 LLM 動態決定的。

### Lesson 3.1 — ReAct 循環實現
**類型**: 代碼實踐 · 120 min

**教學目標**: 實現 Reason + Act 循環，讓 Agent 能夠自主推理和行動。

**知識點**:
- ReAct 論文的核心思想
- 循環結構：Think → Act → Observe → Think → ...
- 停止條件：任務完成 / 最大迭代 / budget 耗盡
- 與 Anthropic Tool Use 的原生整合

**代碼練習**:
```
練習 3.1.1: 基礎 Agent Loop
- 實現 agentLoop(task, tools, options)
- 每輪：發送 messages 到 LLM → 解析 response
  - 如果是 text → 任務可能完成
  - 如果是 tool_use → 執行 tool → 將結果加入 messages → 繼續
- 最大迭代次數限制（默認 20）

練習 3.1.2: 思考過程可視化
- 在終端實時顯示 Agent 的推理過程
- 區分顯示：思考、行動、觀察
- 顯示當前迭代次數和 token 消耗

練習 3.1.3: Budget 控制
- 設置 token budget（如 100K tokens）
- 每次 LLM 調用後檢查累計消耗
- 接近 budget 時注入提示讓 Agent 盡快收斂
```

**驗收標準**:
- [ ] Agent 能在循環中自主選擇和調用 tools
- [ ] 有清晰的終端輸出顯示推理過程
- [ ] 達到最大迭代或 budget 時 graceful 停止

---

### Lesson 3.2 — 環境反饋與自我修正
**類型**: 代碼實踐 · 90 min

**教學目標**: 讓 Agent 能從環境反饋（ground truth）中學習和調整策略。

**知識點**:
- Ground truth 的來源：tool 返回值、命令輸出、測試結果
- 錯誤分類：可重試 vs 需要換策略
- 自我修正的 prompt 設計
- 避免重複犯同一個錯誤

**代碼練習**:
```
練習 3.2.1: 錯誤感知
- Tool 調用失敗時，將錯誤信息格式化後返回 LLM
- 區分錯誤類型：文件不存在 / 權限不足 / 語法錯誤
- LLM 根據錯誤信息決定下一步

練習 3.2.2: 自動修正循環
- 場景：Agent 寫了代碼 → 運行測試 → 測試失敗
- Agent 讀取錯誤信息 → 分析原因 → 修改代碼 → 重新測試
- 最多重試 3 次，每次攜帶之前所有嘗試的上下文

練習 3.2.3: 策略切換
- 當同一方法失敗 2 次時，Agent 應嘗試不同方法
- 實現 "strategy memory"：記住已嘗試過的方法
- 在 system prompt 中注入失敗歷史摘要
```

**驗收標準**:
- [ ] Agent 遇到錯誤能自動重試或換策略
- [ ] 不會在同一種錯誤上無限重試
- [ ] 每次重試都帶有之前的錯誤上下文

---

### Lesson 3.3 — Human-in-the-loop 設計
**類型**: 設計 + 代碼 · 90 min

**教學目標**: 設計安全的人機交互點，讓 Agent 在關鍵操作前請求確認。

**知識點**:
- 哪些操作需要確認：文件刪除、外部命令、API 調用
- 確認的 UX：阻塞式 vs 預覽式 vs 批量確認
- 自動化等級：全自動 / 需確認 / 只預覽
- 緊急停止機制

**代碼練習**:
```
練習 3.3.1: Permission 系統
- 定義三種模式：auto / confirm / preview
- 每個 Tool 可以設置默認的 permission level
- 危險操作（write, delete, exec）默認需要確認

練習 3.3.2: 確認交互
- 在終端顯示將要執行的操作詳情
- 用戶可以 approve / reject / edit
- reject 時將原因反饋給 Agent

練習 3.3.3: 操作預覽
- 文件修改前顯示 diff 預覽
- 命令執行前顯示命令和工作目錄
- 支持 --yes 標誌跳過所有確認
```

**驗收標準**:
- [ ] 危險操作前有確認提示
- [ ] 用戶可以修改或拒絕操作
- [ ] 有 --yes / --auto 模式用於 CI 場景

---

### Lesson 3.4 — Phase 3 交付物整合
**類型**: 項目實踐 · 4 hrs

**項目要求**:
提交 5 個預設編程任務的完成錄屏/日誌：
1. 創建一個 Express TODO API（CRUD + 測試）
2. 重構一個有 bug 的計算器函數
3. 為一個沒有文檔的模塊生成 JSDoc
4. 將 callback 風格代碼改寫為 async/await
5. 找出並修復一個安全漏洞（SQL injection）

**驗收**:
- [ ] 5 個任務全部獨立完成
- [ ] 每個任務的 token 消耗有記錄
- [ ] 每個任務的 trace log 可查看
- [ ] 至少 3 個任務無需人工干預

---

## Phase 4 — 進化：高階模式與質量保障
**Week 9-10 · Orchestration & Evaluation**

### 學習目標
實現 Orchestrator-Workers 和 Evaluator-Optimizer 模式，讓 Agent 能處理複雜多文件任務並自我優化。

### Lesson 4.1 — Orchestrator-Workers 模式
**類型**: 代碼實踐 · 120 min

**教學目標**: 實現一個動態任務分解器，能將複雜任務拆分為子任務並分派給 Worker。

**知識點**:
- Orchestrator 的職責：分析全局 → 分解任務 → 分派 → 聚合
- Worker 的獨立性：每個 Worker 有自己的 context 和 tools
- 動態分解 vs 靜態分解
- 並行執行與衝突處理

**代碼練習**:
```
練習 4.1.1: Orchestrator 核心
- 實現 orchestrate(task, codebase)
- Step 1: 分析 codebase 結構（文件列表、依賴關係）
- Step 2: LLM 規劃子任務（每個子任務指定目標文件）
- Step 3: 依次或並行執行子任務

練習 4.1.2: Worker 實現
- 每個 Worker 是一個獨立的 Agent Loop
- Worker 只能訪問分配給它的文件
- Worker 完成後返回修改的文件和 summary

練習 4.1.3: 結果聚合
- 合併所有 Worker 的文件修改
- 檢測衝突（同一文件被多個 Worker 修改）
- 運行全局驗證（編譯、測試）
```

**驗收標準**:
- [ ] 能處理涉及 5+ 文件的代碼修改任務
- [ ] Worker 之間的修改不衝突
- [ ] 有全局驗證步驟

---

### Lesson 4.2 — Evaluator-Optimizer 循環
**類型**: 代碼實踐 · 90 min

**教學目標**: 實現自動評估和迭代優化循環。

**知識點**:
- Evaluator 的設計：明確的評分標準
- 評分維度：正確性、代碼質量、效率、可讀性
- 優化循環：生成 → 評估 → 反饋 → 改進 → 再評估
- 收斂條件：分數不再提升 / 達到閾值

**代碼練習**:
```
練習 4.2.1: Evaluator
- 定義評分 rubric（JSON 格式）
- LLM 按 rubric 逐項打分（1-5 分）
- 生成改進建議

練習 4.2.2: Optimizer 循環
- Generator 生成代碼
- Evaluator 評分 + 給出反饋
- Generator 根據反饋改進
- 重複直到分數 >= 4 或迭代 3 次

練習 4.2.3: Voting 機制
- 同一任務用不同 prompt 生成 3 個方案
- 用 Evaluator 分別打分
- 選擇最高分方案（或合併最佳部分）
```

**驗收標準**:
- [ ] Evaluator 能檢測出 > 80% 的已知問題類型
- [ ] 迭代優化後代碼質量可衡量地提升
- [ ] Voting 產出的結果優於單次生成

---

### Lesson 4.3 — Eval 體系建設
**類型**: 設計 + 代碼 · 120 min

**教學目標**: 建立自動化的 Agent 評測體系，量化性能並指導迭代。

**知識點**:
- Eval 的層次：unit eval / integration eval / e2e eval
- 測試用例設計：從簡單到複雜的梯度
- 指標設計：成功率、token 效率、延遲
- Regression testing：每次改動不引入退步

**代碼練習**:
```
練習 4.3.1: Eval 框架
- 定義 EvalCase: { name, task, expected, validator }
- validator 可以是：文件內容匹配、測試通過、包含特定字符串
- Eval runner：批量執行並匯總結果

練習 4.3.2: 測試集構建
- Level 1 (Easy): 單文件簡單修改（5 cases）
- Level 2 (Medium): 多步驟、需要搜索和分析（10 cases）
- Level 3 (Hard): 多文件、需要理解項目結構（5 cases）

練習 4.3.3: Benchmark Dashboard
- 運行全部 eval cases
- 輸出報告：成功率、平均 token 消耗、平均耗時
- 對比不同版本的 baseline 數據
```

**驗收標準**:
- [ ] Eval 測試集包含 20+ 個不同難度的 case
- [ ] 端到端 benchmark 有 baseline 對比數據
- [ ] 每次代碼修改可以快速跑 eval 檢查 regression

---

### Lesson 4.4 — Phase 4 交付物整合
**類型**: 項目實踐 · 4 hrs

**驗收**:
- [ ] Orchestrator 能分析一個真實項目並分解任務
- [ ] Evaluator-Optimizer 循環可量化地改進輸出
- [ ] Eval 套件包含 20+ case，有 pass/fail 報告
- [ ] 有 baseline 數據可供後續版本對比

---

## Phase 5 — 完形：產品化與 CLI 體驗
**Week 11-12 · Ship It**

### 學習目標
將所有模塊整合為一個完整的 CLI 產品，打磨用戶體驗，準備開源發布。

### Lesson 5.1 — CLI 交互設計
**類型**: 設計 + 代碼 · 120 min

**教學目標**: 用 Ink（React for CLI）構建美觀且易用的終端界面。

**知識點**:
- Ink 組件模型：Box, Text, useInput, useApp
- 終端 UI 模式：進度指示、diff 高亮、表格
- 色彩系統設計（支持 no-color 模式）
- 響應式佈局（適應不同終端寬度）

**代碼練習**:
```
練習 5.1.1: 核心 UI 組件
- StreamingText: 實時顯示 LLM 輸出（帶光標動畫）
- ToolCallCard: 顯示 tool 調用詳情（名稱、參數、結果）
- DiffView: 彩色 diff 顯示
- ProgressBar: 任務進度指示

練習 5.1.2: 交互流程
- 啟動畫面（logo + 版本 + 快捷鍵提示）
- 輸入模式（多行輸入支持、歷史紀錄）
- Agent 執行中的狀態顯示
- 任務完成的 summary 展示

練習 5.1.3: 主題與可訪問性
- 深色/淺色主題切換
- 支持 NO_COLOR 環境變量
- 終端寬度自適應
```

---

### Lesson 5.2 — Configuration 與 Permission
**類型**: 代碼實踐 · 90 min

**教學目標**: 實現層級化配置系統和安全的權限管理。

**知識點**:
- 配置層級：默認 < 全局 (~/.config) < 項目 (.agent.yml) < CLI 參數
- 配置合併策略
- Permission 模型：allowlist / blocklist / confirm
- Session 持久化

**代碼練習**:
```
練習 5.2.1: 配置系統
- 定義配置 schema（model, maxTokens, tools, permissions）
- 實現多層配置加載和合併
- 支持 .agent.yml 項目配置

練習 5.2.2: Permission 系統
- 三種模式: auto / confirm / deny
- 每個 tool 可獨立設置 permission level
- 首次使用的引導設置

練習 5.2.3: Session 管理
- 對話歷史的本地持久化
- 支持 resume 上次會話
- Session 的清理和導出
```

---

### Lesson 5.3 — MCP 集成與插件系統
**類型**: 代碼實踐 · 90 min

**教學目標**: 接入 Model Context Protocol 生態，支持第三方工具擴展。

**知識點**:
- MCP 規範：Resources / Tools / Prompts
- MCP Client 的實現
- 插件加載與隔離
- 第三方 Tool 的安全審核

**代碼練習**:
```
練習 5.3.1: MCP Client
- 實現 MCP 協議的 client 端
- 連接一個 MCP server（如 filesystem server）
- 將 MCP tools 註冊到本地 Tool Registry

練習 5.3.2: 插件系統
- 定義插件 interface
- 從 npm 包或本地目錄加載插件
- 插件生命週期：install → activate → deactivate → uninstall
```

---

### Lesson 5.4 — Phase 5 交付物：v1.0 發布
**類型**: 項目實踐 · 6 hrs

**最終項目結構**:
```
my-code-agent/
├── src/
│   ├── core/              # Phase 0: LLM Core
│   ├── tools/             # Phase 1: Tool System
│   ├── workflows/         # Phase 2: Workflow Engine
│   ├── agent/             # Phase 3: Agent Loop
│   ├── advanced/          # Phase 4: Orchestrator + Evaluator
│   ├── cli/               # Phase 5: CLI Interface
│   │   ├── app.tsx        # Ink 主組件
│   │   ├── components/    # UI 組件
│   │   └── themes/        # 主題
│   ├── config/            # 配置系統
│   ├── permissions/       # 權限系統
│   └── index.ts           # 主入口
├── eval/                  # Eval 測試集
├── docs/                  # 文檔
├── .agent.yml             # 默認配置
├── package.json
├── tsconfig.json
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

**最終驗收**:
- [ ] `npm install -g my-code-agent` 可正常安裝使用
- [ ] 首次使用引導流程完整且友好
- [ ] 在 3 個真實開源項目上完成任務演示
- [ ] Eval 套件 pass rate > 70%
- [ ] README 包含：安裝、快速開始、配置、架構說明
- [ ] 有 demo GIF 或視頻
- [ ] GitHub repo star-ready

---

## 附錄 A：設計原則

1. **從簡單開始，按需增加複雜度** — 先用單次 LLM 調用解決問題，只在確實需要時才引入 workflow 和 agent 模式。
2. **透明性優先** — Agent 的規劃步驟、決策邏輯、工具調用都清晰可見。
3. **在 Tool 上投入比 Prompt 更多的時間** — 工具的設計質量決定了 Agent 的上限。
4. **環境反饋是 Agent 的眼睛** — 每一步執行後都要獲取真實的環境反饋。
5. **用 Eval 驅動開發** — 建立評測集、設定 baseline、量化每次改動的影響。

## 附錄 B：推薦閱讀

- Anthropic "Building Effective Agents" (2024)
- ReAct: Synergizing Reasoning and Acting (Yao et al., 2022)
- Anthropic Messages API 文檔
- Model Context Protocol 規範
- SWE-bench 評測方法論
- 12-Factor CLI App 原則

## 附錄 C：平台功能路線圖（後續迭代）

### MVP（本次交付）
- 課程導航與進度追蹤
- AI 助教（卡關時可以問 Claude）

### V2 預留
- 內嵌代碼編輯器
- 自動化作業驗收
- 學習進度儀表板
- 協作/討論區功能
