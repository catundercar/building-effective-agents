# Phase 0 · 地基：Augmented LLM 核心模塊

> **The Foundation** — 實現 Agent 的心臟

## 概覽

在這個 Phase 中，你將實現一個可與 Claude API 穩定交互的核心引擎。這個引擎是後續所有 Phase 的基礎。

完成後，你將擁有一個可以在終端交互的 CLI 工具，它能：
- 以 streaming 方式與 Claude 對話
- 讓 Claude 自主調用你註冊的工具（天氣、文件讀取、計算器）
- 自動管理 context window，超限時進行壓縮

## 快速開始

```bash
# 安裝依賴
npm install

# 設置 API Key
export ANTHROPIC_API_KEY=your_key_here

# 運行測試（初始狀態全部失敗 — 這是正常的！）
npm test

# 運行特定 Lab 的測試
npm run test:lab1    # LLM Client
npm run test:lab2    # Tool System
npm run test:lab3    # Context Manager

# 查看成績
npm run grade

# 完成後啟動 CLI
npm run dev
```

## Lab 結構

```
src/
├── types.ts           ✅ 已提供 — 所有類型定義，先閱讀
├── client.ts          📝 Lab 1 — 實現 LLM API 客戶端
├── tools.ts           📝 Lab 2 — 實現 Tool 系統
├── context.ts         📝 Lab 3 — 實現 Context 管理
├── sample-tools.ts    ✅ 已提供 — 三個預置工具
├── cli.ts             ✅ 已提供 — CLI 入口（整合層）
└── __tests__/
    ├── lab1.test.ts   ✅ 已提供 — Lab 1 測試
    ├── lab2.test.ts   ✅ 已提供 — Lab 2 測試
    └── lab3.test.ts   ✅ 已提供 — Lab 3 測試
```

**規則**: 
- `✅ 已提供` 的文件不要修改
- `📝` 的文件是你的工作 — 找到所有 `TODO` 並實現它們
- 每個 `TODO` 都有詳細的要求說明和 `HINT`

## Lab 1: LLM Client (`client.ts`)

**目標**: 實現 Claude API 的客戶端封裝

你需要實現 3 個方法：
| 方法 | 難度 | 說明 |
|------|------|------|
| `createMessage()` | ⭐ | 非 streaming API 調用 |
| `createStreamingMessage()` | ⭐⭐ | Streaming API 調用（async generator）|
| `callWithRetry()` | ⭐⭐ | 指數退避重試機制 |

**建議順序**: `callWithRetry` → `createMessage` → `createStreamingMessage`

## Lab 2: Tool System (`tools.ts`)

**目標**: 實現工具的註冊、執行和 LLM-Tool 交互循環

你需要實現 5 個方法：
| 方法 | 難度 | 說明 |
|------|------|------|
| `ToolRegistry.register()` | ⭐ | 工具註冊（帶驗證）|
| `ToolRegistry.unregister()` | ⭐ | 工具取消註冊 |
| `ToolExecutor.execute()` | ⭐⭐ | 執行單個工具調用 |
| `ToolExecutor.executeAll()` | ⭐ | 批量執行工具調用 |
| `toolUseLoop()` | ⭐⭐⭐ | **核心**: LLM ↔ Tool 交互循環 |

**建議順序**: `register` → `unregister` → `execute` → `executeAll` → `toolUseLoop`

> 💡 `toolUseLoop` 是整個 Phase 0 最重要的函數。它是 Agent 的雛形 — LLM 自主決定是否調用工具，你的代碼負責執行工具並把結果送回給 LLM。

## Lab 3: Context Manager (`context.ts`)

**目標**: 實現 token 估算和 context window 管理

你需要實現 6 個方法：
| 方法 | 難度 | 說明 |
|------|------|------|
| `estimateTokens()` | ⭐ | 文本 token 數估算 |
| `estimateMessageTokens()` | ⭐ | 消息 token 數估算 |
| `getTotalTokens()` | ⭐ | 計算總 token 使用量 |
| `truncate()` | ⭐⭐ | 滑動窗口截斷 |
| `summarize()` | ⭐⭐⭐ | 摘要壓縮 |
| `autoManage()` | ⭐⭐ | 自動管理策略 |

**建議順序**: `estimateTokens` → `estimateMessageTokens` → `getTotalTokens` → `truncate` → `summarize` → `autoManage`

## 驗收標準

運行 `npm run grade` 查看成績：

- [ ] Lab 1: 所有測試通過
- [ ] Lab 2: 所有測試通過
- [ ] Lab 3: 所有測試通過
- [ ] `npm run dev` 可啟動 CLI，能夠正常對話並調用工具

## 學習資料

- [Anthropic Messages API](https://docs.anthropic.com/en/api/messages)
- [Anthropic Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) §Building block: The augmented LLM

## 遇到困難？

1. 先仔細閱讀 `types.ts` 和測試文件中的期望值
2. 每個 `TODO` 的 `HINT` 部分有詳細提示
3. 運行單個測試定位問題：`npx vitest run -t "test name"`
4. 如果真的卡住了，在學習平台上使用 AI 助教功能
