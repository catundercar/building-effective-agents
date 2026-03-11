import type { Locale } from "../i18n";

// ─── Type definitions (moved from CourseRoadmap.tsx) ─────────

export interface Deliverable {
  name: string;
  desc: string;
  acceptance: string[];
}

export interface Phase {
  id: number;
  week: string;
  duration: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  accent: string;
  goal: string;
  concepts: string[];
  readings: string[];
  deliverable: Deliverable;
}

export interface ArchitectureLayer {
  name: string;
  color: string;
  modules: string[];
}

export interface Architecture {
  layers: ArchitectureLayer[];
}

export interface Principle {
  num: string;
  title: string;
  desc: string;
  color: string;
}

// ─── Architecture (non-localized) ────────────────────────────

const ARCHITECTURE: Architecture = {
  layers: [
    { name: "CLI Interface", color: "#E8453C", modules: ["Terminal UI", "Input Parser", "Config Manager", "Permission Gate"] },
    { name: "Agent Core", color: "#7C3AED", modules: ["Agentic Loop", "Planner", "Memory/Context", "Error Recovery"] },
    { name: "Workflow Engine", color: "#059669", modules: ["Chaining", "Routing", "Orchestrator", "Evaluator"] },
    { name: "Tool System", color: "#D97706", modules: ["Tool Registry", "File Ops", "Shell Executor", "MCP Bridge"] },
    { name: "LLM Core", color: "#2563EB", modules: ["API Client", "Streaming", "Token Manager", "Retry Logic"] },
  ],
};

export function getArchitecture(): Architecture {
  return ARCHITECTURE;
}

// ─── Phases: zh-TW (Traditional Chinese) ─────────────────────

const PHASES_ZH_TW: Phase[] = [
  {
    id: 0,
    week: "Phase 0",
    duration: "Week 1-2",
    title: "地基：Augmented LLM 核心模塊",
    subtitle: "The Foundation",
    icon: "⬡",
    color: "#E8453C",
    accent: "#FF6B5E",
    goal: "理解並實現一個可與 LLM API 穩定交互的核心引擎，這是整個 Agent 的心臟。",
    concepts: [
      "LLM API 調用封裝（streaming / non-streaming）",
      "Tool/Function Calling 協議實現",
      "System Prompt 工程與模板管理",
      "Token 計數與 Context Window 管理",
      "錯誤重試與 Rate Limiting 策略",
    ],
    readings: [
      "Anthropic Messages API 文檔",
      "Building Effective Agents §Building block: The augmented LLM",
      "OpenAI Function Calling 設計文檔（對比學習）",
    ],
    deliverable: {
      name: "my-llm-core",
      desc: "一個 CLI 工具，能夠：① 以 streaming 方式與 Claude API 對話 ② 註冊 Tool 並讓 LLM 自主調用（如獲取天氣、讀取文件）③ 自動管理 context window，超限時進行 summarization",
      acceptance: [
        "支持至少 3 個自定義 Tool",
        "streaming 輸出延遲 < 200ms TTFT",
        "context window 溢出時自動 truncate + summarize",
        "有完整的 unit test 覆蓋核心模組",
      ],
    },
  },
  {
    id: 1,
    week: "Phase 1",
    duration: "Week 3-4",
    title: "骨架：Tool 系統與 ACI 設計",
    subtitle: "Agent-Computer Interface",
    icon: "◈",
    color: "#D97706",
    accent: "#F59E0B",
    goal: "設計並實現一套高質量的工具系統，這是 Agent 與外部世界交互的接口層。正如 Anthropic 所說，在工具上花的時間應該比 prompt 更多。",
    concepts: [
      "Tool 定義規範設計（JSON Schema / 描述工程）",
      "文件系統操作工具（read / write / search / diff）",
      "Shell 命令執行工具（沙箱安全機制）",
      "Tool Result 的結構化返回與錯誤處理",
      "Poka-yoke 原則：讓 Tool 難以被錯誤使用",
    ],
    readings: [
      "Building Effective Agents §Appendix 2: Prompt Engineering your Tools",
      "Claude Code 源碼中的 Tool 定義模式",
      "MCP (Model Context Protocol) 規範",
    ],
    deliverable: {
      name: "my-agent-tools",
      desc: "一套完整的文件系統 + Shell 工具庫：① Tool Registry 動態註冊機制 ② 文件 CRUD、搜索、diff 工具 ③ 帶沙箱的 Shell 執行器 ④ 每個 Tool 都有詳盡的 description 和 example",
      acceptance: [
        "Tool Registry 支持動態增刪，有 validation",
        "文件工具使用絕對路徑（避免相對路徑 bug）",
        "Shell 工具有 timeout、黑名單命令過濾",
        "每個 Tool 的 description 經過 A/B 測試迭代",
      ],
    },
  },
  {
    id: 2,
    week: "Phase 2",
    duration: "Week 5-6",
    title: "脈絡：Prompt Chaining 與 Routing",
    subtitle: "Workflow Patterns",
    icon: "◇",
    color: "#059669",
    accent: "#34D399",
    goal: "實現兩種基礎 Workflow 模式，學會在確定性流程中編排 LLM 調用。",
    concepts: [
      "Prompt Chaining：任務分解與 Gate 檢查",
      "Routing：意圖分類與專用處理路徑",
      "中間結果校驗與流程控制",
      "不同模型路由策略（成本/能力平衡）",
      "Workflow 的可觀測性（logging / tracing）",
    ],
    readings: [
      "Building Effective Agents §Prompt Chaining & §Routing",
      "LangSmith / Braintrust 等 tracing 工具文檔",
      "設計模式：Chain of Responsibility / Strategy Pattern",
    ],
    deliverable: {
      name: "my-agent-workflows",
      desc: "在 Phase 0 基礎上擴展：① 實現一個 Code Review Pipeline（Chaining：讀取代碼 → 分析問題 → 生成修復 → 驗證修復）② 實現 Router 根據用戶指令自動路由到不同處理器",
      acceptance: [
        "Chain 中任一步驟失敗可 graceful fallback",
        "Router 準確率 > 95%（在 50 個測試 case 上）",
        "全流程有結構化 trace log 可追蹤",
        "支持 dry-run 模式預覽執行計劃",
      ],
    },
  },
  {
    id: 3,
    week: "Phase 3",
    duration: "Week 7-8",
    title: "心智：Agentic Loop 核心引擎",
    subtitle: "The Reasoning Engine",
    icon: "◎",
    color: "#7C3AED",
    accent: "#A78BFA",
    goal: "實現 Agent 的核心循環——讓 LLM 自主規劃、執行、觀察、反思，直到完成任務。這是從 workflow 到 agent 的質變。",
    concepts: [
      "ReAct 模式（Reason + Act）循環實現",
      "環境反饋（Ground Truth）的採集與注入",
      "最大迭代次數與停止條件設計",
      "錯誤恢復與自我修正機制",
      "Human-in-the-loop 確認點設計",
    ],
    readings: [
      "Building Effective Agents §Agents",
      "ReAct: Synergizing Reasoning and Acting 論文",
      "Claude Code 的 agentic loop 實現分析",
    ],
    deliverable: {
      name: "my-agent-core",
      desc: "一個能自主解決編程任務的 Agent：① 接收任務描述 → 自主規劃步驟 ② 循環調用 Tool 讀寫文件、執行命令 ③ 根據執行結果自我調整策略 ④ 完成後生成 summary",
      acceptance: [
        "能獨立完成 5 個預設的編程任務（如 TODO app）",
        "遇到錯誤能自動重試或換策略（最多 3 次）",
        "有 human confirmation 機制（危險操作前暫停）",
        "單任務 token 消耗有 budget 控制",
      ],
    },
  },
  {
    id: 4,
    week: "Phase 4",
    duration: "Week 9-10",
    title: "進化：高階模式與質量保障",
    subtitle: "Orchestration & Evaluation",
    icon: "⬢",
    color: "#2563EB",
    accent: "#60A5FA",
    goal: "實現 Orchestrator-Workers 和 Evaluator-Optimizer 模式，讓 Agent 能處理複雜多文件任務並自我優化。",
    concepts: [
      "Orchestrator 動態任務分解與 Worker 分派",
      "並行執行與結果聚合",
      "Evaluator-Optimizer 迭代優化循環",
      "Eval 體系建設（自動化測試用例）",
      "Voting 機制提升輸出可靠性",
    ],
    readings: [
      "Building Effective Agents §Orchestrator-workers & §Evaluator-optimizer",
      "SWE-bench 評測方法論",
      "Claude Code 的多文件編輯策略",
    ],
    deliverable: {
      name: "my-agent-advanced",
      desc: "① Orchestrator 模式：接收 \"重構這個項目\" 的指令，自動分析所有文件、分派子任務、並行處理、合併結果 ② Evaluator：對 Agent 的輸出自動評分並觸發改進循環 ③ 一套 Eval 測試集",
      acceptance: [
        "能處理涉及 5+ 文件的代碼修改任務",
        "Evaluator 能檢測出 > 80% 的已知問題類型",
        "Eval 測試集包含 20+ 個不同難度的 case",
        "端到端 benchmark 有 baseline 對比數據",
      ],
    },
  },
  {
    id: 5,
    week: "Phase 5",
    duration: "Week 11-12",
    title: "完形：產品化與 CLI 體驗",
    subtitle: "Ship It",
    icon: "✦",
    color: "#DC2626",
    accent: "#F87171",
    goal: "將所有模塊整合為一個完整的 CLI 產品，打磨用戶體驗，準備開源發布。",
    concepts: [
      "CLI 交互設計（Ink / blessed 等終端 UI）",
      "Configuration 系統（項目級 / 全局配置）",
      "Permission 系統與安全策略",
      "Session 持久化與恢復",
      "插件系統 / MCP 集成",
      "打包、分發、CI/CD",
    ],
    readings: [
      "Claude Code CLI 的 UX 設計哲學",
      "Ink (React for CLI) 文檔",
      "12-Factor CLI App 原則",
    ],
    deliverable: {
      name: "my-code-agent v1.0",
      desc: "一個可發布的 CLI Agent 工具：① 美觀的終端 UI（彩色輸出、進度條、diff 高亮）② 完整的配置體系 ③ 權限控制（自動/確認/拒絕模式）④ 可通過 npm/pip 安裝 ⑤ README + Demo 視頻",
      acceptance: [
        "npm install -g my-code-agent 可正常安裝使用",
        "首次使用引導流程完整且友好",
        "在 3 個真實開源項目上完成任務演示",
        "有 README、CONTRIBUTING、LICENSE",
        "GitHub repo star-ready（有 demo GIF）",
      ],
    },
  },
];

// ─── Phases: zh-CN (Simplified Chinese) ──────────────────────

const PHASES_ZH_CN: Phase[] = [
  {
    id: 0,
    week: "Phase 0",
    duration: "Week 1-2",
    title: "地基：Augmented LLM 核心模块",
    subtitle: "The Foundation",
    icon: "⬡",
    color: "#E8453C",
    accent: "#FF6B5E",
    goal: "理解并实现一个可与 LLM API 稳定交互的核心引擎，这是整个 Agent 的心脏。",
    concepts: [
      "LLM API 调用封装（streaming / non-streaming）",
      "Tool/Function Calling 协议实现",
      "System Prompt 工程与模板管理",
      "Token 计数与 Context Window 管理",
      "错误重试与 Rate Limiting 策略",
    ],
    readings: [
      "Anthropic Messages API 文档",
      "Building Effective Agents §Building block: The augmented LLM",
      "OpenAI Function Calling 设计文档（对比学习）",
    ],
    deliverable: {
      name: "my-llm-core",
      desc: "一个 CLI 工具，能够：① 以 streaming 方式与 Claude API 对话 ② 注册 Tool 并让 LLM 自主调用（如获取天气、读取文件）③ 自动管理 context window，超限时进行 summarization",
      acceptance: [
        "支持至少 3 个自定义 Tool",
        "streaming 输出延迟 < 200ms TTFT",
        "context window 溢出时自动 truncate + summarize",
        "有完整的 unit test 覆盖核心模块",
      ],
    },
  },
  {
    id: 1,
    week: "Phase 1",
    duration: "Week 3-4",
    title: "骨架：Tool 系统与 ACI 设计",
    subtitle: "Agent-Computer Interface",
    icon: "◈",
    color: "#D97706",
    accent: "#F59E0B",
    goal: "设计并实现一套高质量的工具系统，这是 Agent 与外部世界交互的接口层。正如 Anthropic 所说，在工具上花的时间应该比 prompt 更多。",
    concepts: [
      "Tool 定义规范设计（JSON Schema / 描述工程）",
      "文件系统操作工具（read / write / search / diff）",
      "Shell 命令执行工具（沙箱安全机制）",
      "Tool Result 的结构化返回与错误处理",
      "Poka-yoke 原则：让 Tool 难以被错误使用",
    ],
    readings: [
      "Building Effective Agents §Appendix 2: Prompt Engineering your Tools",
      "Claude Code 源码中的 Tool 定义模式",
      "MCP (Model Context Protocol) 规范",
    ],
    deliverable: {
      name: "my-agent-tools",
      desc: "一套完整的文件系统 + Shell 工具库：① Tool Registry 动态注册机制 ② 文件 CRUD、搜索、diff 工具 ③ 带沙箱的 Shell 执行器 ④ 每个 Tool 都有详尽的 description 和 example",
      acceptance: [
        "Tool Registry 支持动态增删，有 validation",
        "文件工具使用绝对路径（避免相对路径 bug）",
        "Shell 工具有 timeout、黑名单命令过滤",
        "每个 Tool 的 description 经过 A/B 测试迭代",
      ],
    },
  },
  {
    id: 2,
    week: "Phase 2",
    duration: "Week 5-6",
    title: "脉络：Prompt Chaining 与 Routing",
    subtitle: "Workflow Patterns",
    icon: "◇",
    color: "#059669",
    accent: "#34D399",
    goal: "实现两种基础 Workflow 模式，学会在确定性流程中编排 LLM 调用。",
    concepts: [
      "Prompt Chaining：任务分解与 Gate 检查",
      "Routing：意图分类与专用处理路径",
      "中间结果校验与流程控制",
      "不同模型路由策略（成本/能力平衡）",
      "Workflow 的可观测性（logging / tracing）",
    ],
    readings: [
      "Building Effective Agents §Prompt Chaining & §Routing",
      "LangSmith / Braintrust 等 tracing 工具文档",
      "设计模式：Chain of Responsibility / Strategy Pattern",
    ],
    deliverable: {
      name: "my-agent-workflows",
      desc: "在 Phase 0 基础上扩展：① 实现一个 Code Review Pipeline（Chaining：读取代码 → 分析问题 → 生成修复 → 验证修复）② 实现 Router 根据用户指令自动路由到不同处理器",
      acceptance: [
        "Chain 中任一步骤失败可 graceful fallback",
        "Router 准确率 > 95%（在 50 个测试 case 上）",
        "全流程有结构化 trace log 可追踪",
        "支持 dry-run 模式预览执行计划",
      ],
    },
  },
  {
    id: 3,
    week: "Phase 3",
    duration: "Week 7-8",
    title: "心智：Agentic Loop 核心引擎",
    subtitle: "The Reasoning Engine",
    icon: "◎",
    color: "#7C3AED",
    accent: "#A78BFA",
    goal: "实现 Agent 的核心循环——让 LLM 自主规划、执行、观察、反思，直到完成任务。这是从 workflow 到 agent 的质变。",
    concepts: [
      "ReAct 模式（Reason + Act）循环实现",
      "环境反馈（Ground Truth）的采集与注入",
      "最大迭代次数与停止条件设计",
      "错误恢复与自我修正机制",
      "Human-in-the-loop 确认点设计",
    ],
    readings: [
      "Building Effective Agents §Agents",
      "ReAct: Synergizing Reasoning and Acting 论文",
      "Claude Code 的 agentic loop 实现分析",
    ],
    deliverable: {
      name: "my-agent-core",
      desc: "一个能自主解决编程任务的 Agent：① 接收任务描述 → 自主规划步骤 ② 循环调用 Tool 读写文件、执行命令 ③ 根据执行结果自我调整策略 ④ 完成后生成 summary",
      acceptance: [
        "能独立完成 5 个预设的编程任务（如 TODO app）",
        "遇到错误能自动重试或换策略（最多 3 次）",
        "有 human confirmation 机制（危险操作前暂停）",
        "单任务 token 消耗有 budget 控制",
      ],
    },
  },
  {
    id: 4,
    week: "Phase 4",
    duration: "Week 9-10",
    title: "进化：高阶模式与质量保障",
    subtitle: "Orchestration & Evaluation",
    icon: "⬢",
    color: "#2563EB",
    accent: "#60A5FA",
    goal: "实现 Orchestrator-Workers 和 Evaluator-Optimizer 模式，让 Agent 能处理复杂多文件任务并自我优化。",
    concepts: [
      "Orchestrator 动态任务分解与 Worker 分派",
      "并行执行与结果聚合",
      "Evaluator-Optimizer 迭代优化循环",
      "Eval 体系建设（自动化测试用例）",
      "Voting 机制提升输出可靠性",
    ],
    readings: [
      "Building Effective Agents §Orchestrator-workers & §Evaluator-optimizer",
      "SWE-bench 评测方法论",
      "Claude Code 的多文件编辑策略",
    ],
    deliverable: {
      name: "my-agent-advanced",
      desc: "① Orchestrator 模式：接收 \"重构这个项目\" 的指令，自动分析所有文件、分派子任务、并行处理、合并结果 ② Evaluator：对 Agent 的输出自动评分并触发改进循环 ③ 一套 Eval 测试集",
      acceptance: [
        "能处理涉及 5+ 文件的代码修改任务",
        "Evaluator 能检测出 > 80% 的已知问题类型",
        "Eval 测试集包含 20+ 个不同难度的 case",
        "端到端 benchmark 有 baseline 对比数据",
      ],
    },
  },
  {
    id: 5,
    week: "Phase 5",
    duration: "Week 11-12",
    title: "完形：产品化与 CLI 体验",
    subtitle: "Ship It",
    icon: "✦",
    color: "#DC2626",
    accent: "#F87171",
    goal: "将所有模块整合为一个完整的 CLI 产品，打磨用户体验，准备开源发布。",
    concepts: [
      "CLI 交互设计（Ink / blessed 等终端 UI）",
      "Configuration 系统（项目级 / 全局配置）",
      "Permission 系统与安全策略",
      "Session 持久化与恢复",
      "插件系统 / MCP 集成",
      "打包、分发、CI/CD",
    ],
    readings: [
      "Claude Code CLI 的 UX 设计哲学",
      "Ink (React for CLI) 文档",
      "12-Factor CLI App 原则",
    ],
    deliverable: {
      name: "my-code-agent v1.0",
      desc: "一个可发布的 CLI Agent 工具：① 美观的终端 UI（彩色输出、进度条、diff 高亮）② 完整的配置体系 ③ 权限控制（自动/确认/拒绝模式）④ 可通过 npm/pip 安装 ⑤ README + Demo 视频",
      acceptance: [
        "npm install -g my-code-agent 可正常安装使用",
        "首次使用引导流程完整且友好",
        "在 3 个真实开源项目上完成任务演示",
        "有 README、CONTRIBUTING、LICENSE",
        "GitHub repo star-ready（有 demo GIF）",
      ],
    },
  },
];

// ─── Phases: en (English) ────────────────────────────────────

const PHASES_EN: Phase[] = [
  {
    id: 0,
    week: "Phase 0",
    duration: "Week 1-2",
    title: "Foundation: Augmented LLM Core",
    subtitle: "The Foundation",
    icon: "⬡",
    color: "#E8453C",
    accent: "#FF6B5E",
    goal: "Understand and implement a core engine that interacts reliably with the LLM API — the heart of the entire Agent.",
    concepts: [
      "LLM API client (streaming / non-streaming)",
      "Tool/Function Calling protocol",
      "System Prompt engineering & template management",
      "Token counting & Context Window management",
      "Error retry & Rate Limiting strategies",
    ],
    readings: [
      "Anthropic Messages API docs",
      "Building Effective Agents §Building block: The augmented LLM",
      "OpenAI Function Calling design docs (comparative study)",
    ],
    deliverable: {
      name: "my-llm-core",
      desc: "A CLI tool that can: ① Stream conversations with Claude API ② Register Tools and let LLM autonomously invoke them (e.g. weather, file reading) ③ Auto-manage context window with summarization when exceeded",
      acceptance: [
        "Support at least 3 custom Tools",
        "Streaming output latency < 200ms TTFT",
        "Auto truncate + summarize on context window overflow",
        "Complete unit test coverage for core modules",
      ],
    },
  },
  {
    id: 1,
    week: "Phase 1",
    duration: "Week 3-4",
    title: "Skeleton: Tool System & ACI Design",
    subtitle: "Agent-Computer Interface",
    icon: "◈",
    color: "#D97706",
    accent: "#F59E0B",
    goal: "Design and implement a high-quality tool system — the Agent's interface layer with the outside world. As Anthropic says, spend more time on tools than prompts.",
    concepts: [
      "Tool definition standards (JSON Schema / description engineering)",
      "File system tools (read / write / search / diff)",
      "Shell command executor (sandbox security)",
      "Structured Tool Result returns & error handling",
      "Poka-yoke principle: make tools hard to misuse",
    ],
    readings: [
      "Building Effective Agents §Appendix 2: Prompt Engineering your Tools",
      "Claude Code source: Tool definition patterns",
      "MCP (Model Context Protocol) spec",
    ],
    deliverable: {
      name: "my-agent-tools",
      desc: "A complete file system + shell toolkit: ① Dynamic Tool Registry ② File CRUD, search, diff tools ③ Sandboxed shell executor ④ Every tool has detailed description and examples",
      acceptance: [
        "Tool Registry supports dynamic add/remove with validation",
        "File tools use absolute paths (avoid relative path bugs)",
        "Shell tool has timeout and command blacklist filtering",
        "Every tool description A/B tested and iterated",
      ],
    },
  },
  {
    id: 2,
    week: "Phase 2",
    duration: "Week 5-6",
    title: "Flow: Prompt Chaining & Routing",
    subtitle: "Workflow Patterns",
    icon: "◇",
    color: "#059669",
    accent: "#34D399",
    goal: "Implement two foundational workflow patterns, learning to orchestrate LLM calls in deterministic flows.",
    concepts: [
      "Prompt Chaining: task decomposition & gate checks",
      "Routing: intent classification & specialized handlers",
      "Intermediate result validation & flow control",
      "Multi-model routing strategies (cost/capability balance)",
      "Workflow observability (logging / tracing)",
    ],
    readings: [
      "Building Effective Agents §Prompt Chaining & §Routing",
      "LangSmith / Braintrust tracing tool docs",
      "Design Patterns: Chain of Responsibility / Strategy Pattern",
    ],
    deliverable: {
      name: "my-agent-workflows",
      desc: "Building on Phase 0: ① Code Review Pipeline (Chaining: read code → analyze issues → generate fix → verify fix) ② Router that auto-routes user commands to different handlers",
      acceptance: [
        "Chain gracefully falls back on any step failure",
        "Router accuracy > 95% (on 50 test cases)",
        "Full structured trace log for the entire flow",
        "Support dry-run mode to preview execution plan",
      ],
    },
  },
  {
    id: 3,
    week: "Phase 3",
    duration: "Week 7-8",
    title: "Mind: Agentic Loop Core Engine",
    subtitle: "The Reasoning Engine",
    icon: "◎",
    color: "#7C3AED",
    accent: "#A78BFA",
    goal: "Implement the Agent's core loop — LLM autonomously plans, executes, observes, and reflects until the task is complete. This is the qualitative leap from workflow to agent.",
    concepts: [
      "ReAct pattern (Reason + Act) loop implementation",
      "Environment feedback (ground truth) collection & injection",
      "Max iteration & stopping condition design",
      "Error recovery & self-correction mechanisms",
      "Human-in-the-loop confirmation points",
    ],
    readings: [
      "Building Effective Agents §Agents",
      "ReAct: Synergizing Reasoning and Acting paper",
      "Claude Code agentic loop implementation analysis",
    ],
    deliverable: {
      name: "my-agent-core",
      desc: "An Agent that autonomously solves programming tasks: ① Receives task description → autonomously plans steps ② Loops tool calls to read/write files, execute commands ③ Self-adjusts strategy based on results ④ Generates summary on completion",
      acceptance: [
        "Can independently complete 5 preset programming tasks (e.g. TODO app)",
        "Auto-retries or switches strategy on errors (max 3 attempts)",
        "Human confirmation mechanism (pause before dangerous operations)",
        "Token budget control per task",
      ],
    },
  },
  {
    id: 4,
    week: "Phase 4",
    duration: "Week 9-10",
    title: "Evolution: Advanced Patterns & Quality Assurance",
    subtitle: "Orchestration & Evaluation",
    icon: "⬢",
    color: "#2563EB",
    accent: "#60A5FA",
    goal: "Implement Orchestrator-Workers and Evaluator-Optimizer patterns, enabling the Agent to handle complex multi-file tasks and self-optimize.",
    concepts: [
      "Orchestrator dynamic task decomposition & worker dispatch",
      "Parallel execution & result aggregation",
      "Evaluator-Optimizer iterative improvement loop",
      "Eval system construction (automated test cases)",
      "Voting mechanism for output reliability",
    ],
    readings: [
      "Building Effective Agents §Orchestrator-workers & §Evaluator-optimizer",
      "SWE-bench evaluation methodology",
      "Claude Code multi-file editing strategies",
    ],
    deliverable: {
      name: "my-agent-advanced",
      desc: "① Orchestrator mode: receives 'refactor this project', auto-analyzes all files, dispatches subtasks, processes in parallel, merges results ② Evaluator: auto-scores Agent output and triggers improvement loop ③ An eval test suite",
      acceptance: [
        "Can handle code modification tasks spanning 5+ files",
        "Evaluator detects > 80% of known issue types",
        "Eval test suite contains 20+ cases of varying difficulty",
        "End-to-end benchmark with baseline comparison data",
      ],
    },
  },
  {
    id: 5,
    week: "Phase 5",
    duration: "Week 11-12",
    title: "Completion: Productionization & CLI Experience",
    subtitle: "Ship It",
    icon: "✦",
    color: "#DC2626",
    accent: "#F87171",
    goal: "Integrate all modules into a complete CLI product, polish user experience, and prepare for open-source release.",
    concepts: [
      "CLI interaction design (Ink / blessed terminal UI)",
      "Configuration system (project-level / global config)",
      "Permission system & security policies",
      "Session persistence & recovery",
      "Plugin system / MCP integration",
      "Packaging, distribution, CI/CD",
    ],
    readings: [
      "Claude Code CLI UX design philosophy",
      "Ink (React for CLI) docs",
      "12-Factor CLI App principles",
    ],
    deliverable: {
      name: "my-code-agent v1.0",
      desc: "A shippable CLI Agent tool: ① Beautiful terminal UI (colored output, progress bars, diff highlighting) ② Complete configuration system ③ Permission control (auto/confirm/deny modes) ④ Installable via npm/pip ⑤ README + demo video",
      acceptance: [
        "npm install -g my-code-agent works correctly",
        "First-use onboarding flow is complete and friendly",
        "Task completion demo on 3 real open-source projects",
        "Has README, CONTRIBUTING, LICENSE",
        "GitHub repo star-ready (with demo GIF)",
      ],
    },
  },
];

// ─── Principles: locale-specific ─────────────────────────────

const PRINCIPLE_COLORS = ["#E8453C", "#D97706", "#059669", "#7C3AED", "#2563EB"] as const;

const PRINCIPLES_ZH_TW: Principle[] = [
  {
    num: "01",
    title: "從簡單開始，按需增加複雜度",
    desc: "先用最簡單的方案解決問題。只在有明確需求和度量標準時才增加系統複雜度。",
    color: PRINCIPLE_COLORS[0],
  },
  {
    num: "02",
    title: "透明性優先",
    desc: "讓 Agent 的推理過程對用戶可見。每一步操作都應該可以被審查和理解。",
    color: PRINCIPLE_COLORS[1],
  },
  {
    num: "03",
    title: "在 Tool 上投入比 Prompt 更多的時間",
    desc: "好的工具定義和良好設計的 ACI 比精巧的 prompt 更重要、更可靠。",
    color: PRINCIPLE_COLORS[2],
  },
  {
    num: "04",
    title: "環境反饋是 Agent 的眼睛",
    desc: "利用真實的環境反饋（測試結果、lint 輸出、錯誤信息）來驅動 Agent 行為，而非依賴 LLM 的猜測。",
    color: PRINCIPLE_COLORS[3],
  },
  {
    num: "05",
    title: "用 Eval 驅動開發",
    desc: "建立全面的自動化評估體系。用數據而非直覺來衡量 Agent 的能力和進步。",
    color: PRINCIPLE_COLORS[4],
  },
];

const PRINCIPLES_ZH_CN: Principle[] = [
  {
    num: "01",
    title: "从简单开始，按需增加复杂度",
    desc: "先用最简单的方案解决问题。只在有明确需求和度量标准时才增加系统复杂度。",
    color: PRINCIPLE_COLORS[0],
  },
  {
    num: "02",
    title: "透明性优先",
    desc: "让 Agent 的推理过程对用户可见。每一步操作都应该可以被审查和理解。",
    color: PRINCIPLE_COLORS[1],
  },
  {
    num: "03",
    title: "在 Tool 上投入比 Prompt 更多的时间",
    desc: "好的工具定义和良好设计的 ACI 比精巧的 prompt 更重要、更可靠。",
    color: PRINCIPLE_COLORS[2],
  },
  {
    num: "04",
    title: "环境反馈是 Agent 的眼睛",
    desc: "利用真实的环境反馈（测试结果、lint 输出、错误信息）来驱动 Agent 行为，而非依赖 LLM 的猜测。",
    color: PRINCIPLE_COLORS[3],
  },
  {
    num: "05",
    title: "用 Eval 驱动开发",
    desc: "建立全面的自动化评估体系。用数据而非直觉来衡量 Agent 的能力和进步。",
    color: PRINCIPLE_COLORS[4],
  },
];

const PRINCIPLES_EN: Principle[] = [
  {
    num: "01",
    title: "Start Simple, Add Complexity as Needed",
    desc: "Solve problems with the simplest approach first. Only add complexity when there's clear demand and measurable criteria.",
    color: PRINCIPLE_COLORS[0],
  },
  {
    num: "02",
    title: "Transparency First",
    desc: "Make the Agent's reasoning visible to users. Every action should be auditable and understandable.",
    color: PRINCIPLE_COLORS[1],
  },
  {
    num: "03",
    title: "Invest More Time in Tools Than Prompts",
    desc: "Well-defined tools and a well-designed ACI matter more than clever prompts.",
    color: PRINCIPLE_COLORS[2],
  },
  {
    num: "04",
    title: "Environment Feedback Is the Agent's Eyes",
    desc: "Use real environment feedback (test results, lint output, error messages) to drive Agent behavior, rather than relying on LLM guesswork.",
    color: PRINCIPLE_COLORS[3],
  },
  {
    num: "05",
    title: "Eval-Driven Development",
    desc: "Build comprehensive automated evaluation. Measure Agent capability and progress with data, not intuition.",
    color: PRINCIPLE_COLORS[4],
  },
];

// ─── Lookup maps ─────────────────────────────────────────────

const PHASES_MAP: Record<Locale, Phase[]> = {
  "zh-TW": PHASES_ZH_TW,
  "zh-CN": PHASES_ZH_CN,
  en: PHASES_EN,
};

const PRINCIPLES_MAP: Record<Locale, Principle[]> = {
  "zh-TW": PRINCIPLES_ZH_TW,
  "zh-CN": PRINCIPLES_ZH_CN,
  en: PRINCIPLES_EN,
};

// ─── Public API ──────────────────────────────────────────────

export function getPhases(locale: Locale): Phase[] {
  return PHASES_MAP[locale] ?? PHASES_ZH_TW;
}

export function getPrinciples(locale: Locale): Principle[] {
  return PRINCIPLES_MAP[locale] ?? PRINCIPLES_ZH_TW;
}
