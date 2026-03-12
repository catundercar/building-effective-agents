# 構建 Code Agent — 從零打造 AI 編程助手

![Visitors](https://hits.sh/github.com/catundercar/building-effective-agents.svg?label=visitors&color=0A0A0B&labelColor=1a1a2e)

> 🔧 **12 週工程實踐課程** · 基於 Anthropic「Building Effective Agents」設計哲學
>
> 從 LLM API 調用到完整 CLI Agent，每個 Phase 都有可運行的交付物，最終產出一個可發布的開源工具。

---

## ✨ 課程簡介

這是一門面向工程師的 **動手實踐課程**，目標是帶你從零構建一個類似 [Claude Code](https://claude.ai/code) 的 AI 編程助手。

你將自底向上實現 5 層架構，從最基礎的 LLM API 封裝，逐步構建出一個能夠自主讀寫文件、執行命令、分析代碼、修復 Bug 的智能 Agent。

### 你會學到什麼

- 🧠 LLM API 的生產級封裝（streaming、重試、token 管理）
- 🔧 Agent-Computer Interface 的工具系統設計（Anthropic SWE-bench 經驗）
- 🔗 Workflow 模式實現（Prompt Chaining、Routing、Orchestrator）
- 🔄 Agentic Loop 核心引擎（ReAct 循環、自我修正、策略切換）
- 📊 Eval 驅動開發（自動評測、baseline 對比、regression 檢測）
- 💻 CLI 產品化（Ink UI、配置系統、權限管理、MCP 集成）

---

## 🏗️ 系統架構

課程採用分層設計，每個 Phase 構建一層，上層依賴下層，下層不感知上層：

```
┌─────────────────────────────────────────────┐
│  Layer 5 · CLI Interface                    │  Phase 5 (Week 11-12)
│  Terminal UI / Config / Permissions         │
├─────────────────────────────────────────────┤
│  Layer 4 · Agent Core                       │  Phase 3-4 (Week 7-10)
│  Agentic Loop / Planner / Orchestrator      │
├─────────────────────────────────────────────┤
│  Layer 3 · Workflow Engine                  │  Phase 2 (Week 5-6)
│  Chaining / Routing / Evaluator             │
├─────────────────────────────────────────────┤
│  Layer 2 · Tool System                      │  Phase 1 (Week 3-4)
│  Registry / File Ops / Shell / MCP          │
├─────────────────────────────────────────────┤
│  Layer 1 · LLM Core                         │  Phase 0 (Week 1-2)
│  API Client / Streaming / Token Mgmt        │
└─────────────────────────────────────────────┘
```

### 核心數據流

```
User Input → CLI Parser → Agent Loop → Planner → Workflow Select
→ LLM Call → Tool Execute → Observe Result → Loop / Complete
```

---

## 📋 課程路線圖

| Phase | 名稱 | 時間 | 交付物 | 核心主題 |
|:-----:|------|:----:|--------|----------|
| **0** | ⬡ 地基：Augmented LLM 核心 | Week 1-2 | `my-llm-core` | API Client · Streaming · Tool Calling · Context 管理 |
| **1** | ◈ 骨架：Tool 系統與 ACI | Week 3-4 | `my-agent-tools` | Tool Registry · 文件操作 · Shell 沙箱 · Description 工程 |
| **2** | ◇ 脈絡：Prompt Chaining 與 Routing | Week 5-6 | `my-agent-workflows` | 任務串接 · 智能路由 · Tracing · 可觀測性 |
| **3** | ◎ 心智：Agentic Loop 核心引擎 | Week 7-8 | `my-agent-core` | ReAct 循環 · 自我修正 · Human-in-the-loop |
| **4** | ⬢ 進化：高階模式與質量保障 | Week 9-10 | `my-agent-advanced` | Orchestrator · Evaluator · Eval 體系 · Voting |
| **5** | ✦ 完形：產品化與 CLI 體驗 | Week 11-12 | `my-code-agent v1.0` | Ink UI · 配置系統 · MCP · 打包發布 |

> 每個 Phase 包含 4 節課（共 24 節），每節課包含：教學目標、知識點、代碼練習、驗收標準。
> 完整課程大綱見 [`curriculum.md`](./curriculum.md)

---

## 🚀 快速開始

### 環境要求

- Python 3.10+（Lab 框架）
- Node.js 20+（Web 學習工具）
- Anthropic API Key

### Phase 0 Lab — 開始你的第一個實驗

```bash
# 進入 Phase 0 Lab
cd labs/phase_0_llm_core

# 安裝依賴
pip install -e .

# 設置 API Key
export ANTHROPIC_API_KEY=your_key_here

# 運行測試（初始狀態全部失敗 — 這是正常的！）
pytest

# 查看成績
python scripts/grade.py
```

### 啟動互動式課程網站

```bash
cd website
npm install
npm run dev
```

---

## 📁 項目結構

```
building-effective-agents/
├── curriculum.md          # 📖 完整 24 節課程大綱
├── course-roadmap.jsx     # 🎨 互動式課程路線圖（React 組件）
├── SUMMARY.md             # 📝 項目決策記錄
├── CLAUDE.md              # 🤖 AI 協作指引
│
├── labs/                  # 🧪 動手實驗（Python）
│   ├── phase_0_llm_core/  #    Phase 0: LLM 核心模塊
│   │   ├── phase_0/       #    學生實現代碼（找 TODO）
│   │   ├── tests/         #    自動化測試套件
│   │   └── scripts/       #    評分腳本
│   └── shared/            #    跨 Phase 共享工具
│
├── website/               # 🌐 互動式學習網站（Vite + React）
│   ├── src/               #    前端源碼
│   └── dist/              #    構建產物
│
├── src/                   # 📦 Phase 0 原始 Lab（TypeScript，legacy）
│   ├── client.ts          #    Lab 1: LLM API Client
│   ├── tools.ts           #    Lab 2: Tool System
│   ├── context.ts         #    Lab 3: Context Manager
│   └── __tests__/         #    測試套件
│
└── scripts/               # 🔧 輔助腳本
```

---

## 🧪 Lab 教學模式

採用 **MIT Lab 風格** 的教學設計：

| 類別 | 說明 | 學生操作 |
|------|------|---------|
| **框架代碼** | 類型定義、測試套件、範例工具、CLI 入口 | ❌ 不要修改 |
| **學生代碼** | 含 `TODO` 標記的核心邏輯文件 | ✅ 找到並實現所有 TODO |
| **自動評分** | 運行測試 + 生成進度報告 | ✅ 用 `pytest` / `npm test` 驗收 |

- 所有測試使用 **Mock API 響應**，不需要真實 API Key 即可測試
- Tool 定義遵循 **Anthropic Tool Use 格式**（JSON Schema `input_schema`）
- 文件路徑強制使用 **絕對路徑**（Anthropic SWE-bench 經驗教訓）

---

## 🎯 設計原則

源自 Anthropic「[Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)」的核心哲學：

| # | 原則 | 說明 |
|:-:|------|------|
| 01 | **從簡單開始** | 先用單次 LLM 調用解決問題，只在必要時才引入 workflow / agent |
| 02 | **透明性優先** | Agent 的規劃、決策、工具調用都清晰可見，便於調試和改進 |
| 03 | **重工具輕提示** | 工具設計質量決定 Agent 上限，遵循 Poka-yoke 原則 |
| 04 | **環境反饋驅動** | 每步都獲取 ground truth（工具結果、測試輸出），而非依賴猜測 |
| 05 | **Eval 驅動開發** | 建立評測集、設定 baseline、量化每次改動的影響 |

---

## 📚 參考資料

- [Building Effective Agents — Anthropic (2024)](https://www.anthropic.com/engineering/building-effective-agents)
- [Anthropic Messages API 文檔](https://docs.anthropic.com/en/api/messages)
- [Anthropic Tool Use 文檔](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Model Context Protocol 規範](https://modelcontextprotocol.io/)
- [ReAct: Synergizing Reasoning and Acting (Yao et al., 2022)](https://arxiv.org/abs/2210.03629)

---

## 🗺️ 目標產出

課程結束時，你將擁有一個可通過 `npm install -g` 或 `pip install` 安裝的 CLI Agent 工具，能夠：

- ✅ 接收自然語言指令，自主規劃任務步驟
- ✅ 讀寫文件、搜索代碼、執行 Shell 命令
- ✅ 運行測試並根據結果自動修正代碼
- ✅ 處理涉及多文件的複雜重構任務
- ✅ 美觀的終端 UI，支持 streaming 輸出和 diff 高亮
- ✅ 完善的權限控制和配置系統

---

## 📄 License

[MIT](./LICENSE)
