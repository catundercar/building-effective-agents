import { useState } from "react";

const PHASES = [
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

const ARCHITECTURE = {
  layers: [
    { name: "CLI Interface", color: "#E8453C", modules: ["Terminal UI", "Input Parser", "Config Manager", "Permission Gate"] },
    { name: "Agent Core", color: "#7C3AED", modules: ["Agentic Loop", "Planner", "Memory/Context", "Error Recovery"] },
    { name: "Workflow Engine", color: "#059669", modules: ["Chaining", "Routing", "Orchestrator", "Evaluator"] },
    { name: "Tool System", color: "#D97706", modules: ["Tool Registry", "File Ops", "Shell Executor", "MCP Bridge"] },
    { name: "LLM Core", color: "#2563EB", modules: ["API Client", "Streaming", "Token Manager", "Retry Logic"] },
  ],
};

export default function CourseRoadmap() {
  const [activePhase, setActivePhase] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmap");

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      background: "#0A0A0B",
      color: "#E4E4E7",
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(228,228,231,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(228,228,231,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 10,
        padding: "48px 32px 24px",
        borderBottom: "1px solid rgba(228,228,231,0.08)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            padding: "4px 12px",
            background: "rgba(232,69,60,0.15)",
            border: "1px solid rgba(232,69,60,0.3)",
            borderRadius: 4,
            fontSize: 11,
            letterSpacing: "0.1em",
            color: "#E8453C",
            marginBottom: 16,
            textTransform: "uppercase",
          }}>
            Engineering Practicum · 12 Weeks
          </div>
          <h1 style={{
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1.2,
            margin: "0 0 8px",
            background: "linear-gradient(135deg, #E4E4E7 0%, #A1A1AA 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            構建 Code Agent
          </h1>
          <p style={{
            fontSize: 15,
            color: "#71717A",
            margin: 0,
            maxWidth: 600,
            lineHeight: 1.6,
          }}>
            從零實現一個類似 Claude Code 的 AI 編程助手。<br/>
            每個 Phase 都有可運行的交付物，最終產出一個可發布的 CLI 工具。
          </p>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, marginTop: 32 }}>
            {[
              { key: "roadmap", label: "課程路線" },
              { key: "arch", label: "系統架構" },
              { key: "principles", label: "設計原則" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "8px 20px",
                  background: activeTab === tab.key ? "rgba(228,228,231,0.1)" : "transparent",
                  border: "1px solid",
                  borderColor: activeTab === tab.key ? "rgba(228,228,231,0.15)" : "transparent",
                  borderRadius: 4,
                  color: activeTab === tab.key ? "#E4E4E7" : "#52525B",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ position: "relative", zIndex: 10, maxWidth: 960, margin: "0 auto", padding: "32px 32px 80px" }}>
        
        {activeTab === "roadmap" && (
          <div>
            {/* Timeline */}
            {PHASES.map((phase, i) => {
              const isOpen = activePhase === phase.id;
              return (
                <div key={phase.id} style={{ position: "relative", marginBottom: 2 }}>
                  {/* Connector line */}
                  {i < PHASES.length - 1 && (
                    <div style={{
                      position: "absolute",
                      left: 19,
                      top: 44,
                      bottom: -2,
                      width: 1,
                      background: `linear-gradient(to bottom, ${phase.color}44, ${PHASES[i+1].color}44)`,
                    }} />
                  )}

                  {/* Phase header */}
                  <button
                    onClick={() => setActivePhase(isOpen ? null : phase.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      width: "100%",
                      padding: "16px 0",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    {/* Icon dot */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: `${phase.color}18`,
                      border: `1px solid ${phase.color}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                      transition: "all 0.3s",
                      boxShadow: isOpen ? `0 0 20px ${phase.color}33` : "none",
                    }}>
                      {phase.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: phase.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          {phase.week}
                        </span>
                        <span style={{ fontSize: 11, color: "#52525B" }}>
                          {phase.duration}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: "#E4E4E7",
                        margin: "4px 0 2px",
                        transition: "color 0.2s",
                      }}>
                        {phase.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#52525B", fontStyle: "italic" }}>
                        {phase.subtitle}
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <div style={{
                      color: "#52525B",
                      fontSize: 14,
                      transform: isOpen ? "rotate(90deg)" : "rotate(0)",
                      transition: "transform 0.2s",
                      marginTop: 8,
                    }}>
                      →
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div style={{
                      marginLeft: 56,
                      marginBottom: 24,
                      animation: "fadeIn 0.3s ease",
                    }}>
                      {/* Goal */}
                      <div style={{
                        padding: "16px 20px",
                        background: `${phase.color}08`,
                        borderLeft: `2px solid ${phase.color}66`,
                        borderRadius: "0 8px 8px 0",
                        marginBottom: 24,
                        fontSize: 13,
                        lineHeight: 1.7,
                        color: "#A1A1AA",
                      }}>
                        {phase.goal}
                      </div>

                      {/* Three columns */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                        {/* Concepts */}
                        <div style={{
                          padding: 16,
                          background: "rgba(228,228,231,0.03)",
                          border: "1px solid rgba(228,228,231,0.06)",
                          borderRadius: 8,
                        }}>
                          <div style={{ fontSize: 10, color: "#71717A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                            核心知識點
                          </div>
                          {phase.concepts.map((c, j) => (
                            <div key={j} style={{
                              fontSize: 12,
                              color: "#A1A1AA",
                              padding: "6px 0",
                              borderBottom: j < phase.concepts.length - 1 ? "1px solid rgba(228,228,231,0.04)" : "none",
                              display: "flex",
                              gap: 8,
                            }}>
                              <span style={{ color: phase.color, opacity: 0.6 }}>›</span>
                              {c}
                            </div>
                          ))}
                        </div>

                        {/* Readings */}
                        <div style={{
                          padding: 16,
                          background: "rgba(228,228,231,0.03)",
                          border: "1px solid rgba(228,228,231,0.06)",
                          borderRadius: 8,
                        }}>
                          <div style={{ fontSize: 10, color: "#71717A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                            參考資料
                          </div>
                          {phase.readings.map((r, j) => (
                            <div key={j} style={{
                              fontSize: 12,
                              color: "#A1A1AA",
                              padding: "6px 0",
                              borderBottom: j < phase.readings.length - 1 ? "1px solid rgba(228,228,231,0.04)" : "none",
                              display: "flex",
                              gap: 8,
                            }}>
                              <span style={{ color: "#52525B" }}>📄</span>
                              {r}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deliverable */}
                      <div style={{
                        padding: 20,
                        background: `linear-gradient(135deg, ${phase.color}0A, ${phase.accent}06)`,
                        border: `1px solid ${phase.color}22`,
                        borderRadius: 8,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <div style={{
                            fontSize: 10,
                            color: phase.color,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            fontWeight: 700,
                          }}>
                            ✦ 交付物
                          </div>
                          <code style={{
                            fontSize: 13,
                            color: phase.accent,
                            background: `${phase.color}15`,
                            padding: "2px 8px",
                            borderRadius: 4,
                          }}>
                            {phase.deliverable.name}
                          </code>
                        </div>
                        <p style={{ fontSize: 13, color: "#A1A1AA", lineHeight: 1.7, margin: "0 0 16px" }}>
                          {phase.deliverable.desc}
                        </p>
                        <div style={{ fontSize: 10, color: "#71717A", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                          驗收標準
                        </div>
                        {phase.deliverable.acceptance.map((a, j) => (
                          <div key={j} style={{
                            fontSize: 12,
                            color: "#A1A1AA",
                            padding: "5px 0",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                          }}>
                            <span style={{
                              display: "inline-block",
                              width: 16,
                              height: 16,
                              borderRadius: 3,
                              border: `1px solid ${phase.color}44`,
                              flexShrink: 0,
                              marginTop: 1,
                            }} />
                            {a}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "arch" && (
          <div>
            <p style={{ fontSize: 13, color: "#71717A", marginBottom: 32, lineHeight: 1.7 }}>
              整體架構採用分層設計，每一層對應一個 Phase 的交付物。上層依賴下層，但下層不感知上層存在。
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ARCHITECTURE.layers.map((layer, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: 0,
                  borderRadius: 8,
                  overflow: "hidden",
                  border: `1px solid ${layer.color}22`,
                }}>
                  {/* Layer label */}
                  <div style={{
                    width: 180,
                    padding: "16px 20px",
                    background: `${layer.color}12`,
                    borderRight: `1px solid ${layer.color}22`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: layer.color }}>
                      {layer.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#52525B", marginTop: 2 }}>
                      Phase {ARCHITECTURE.layers.length - 1 - i}
                    </div>
                  </div>
                  {/* Modules */}
                  <div style={{
                    flex: 1,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    padding: 12,
                    background: "rgba(228,228,231,0.02)",
                    alignItems: "center",
                  }}>
                    {layer.modules.map((mod, j) => (
                      <div key={j} style={{
                        padding: "6px 12px",
                        background: `${layer.color}0A`,
                        border: `1px solid ${layer.color}18`,
                        borderRadius: 4,
                        fontSize: 11,
                        color: "#A1A1AA",
                      }}>
                        {mod}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Data flow */}
            <div style={{
              marginTop: 32,
              padding: 24,
              background: "rgba(228,228,231,0.03)",
              border: "1px solid rgba(228,228,231,0.06)",
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 10, color: "#71717A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
                核心數據流
              </div>
              <div style={{ fontFamily: "inherit", fontSize: 12, color: "#71717A", lineHeight: 2.2 }}>
                <span style={{ color: "#E8453C" }}>User Input</span>
                {" → "}
                <span style={{ color: "#E8453C" }}>CLI Parser</span>
                {" → "}
                <span style={{ color: "#7C3AED" }}>Agent Loop</span>
                {" → "}
                <span style={{ color: "#7C3AED" }}>Planner</span>
                {" → "}
                <span style={{ color: "#059669" }}>Workflow Select</span>
                {" → "}
                <span style={{ color: "#2563EB" }}>LLM Call</span>
                {" → "}
                <span style={{ color: "#D97706" }}>Tool Execute</span>
                {" → "}
                <span style={{ color: "#7C3AED" }}>Observe Result</span>
                {" → "}
                <span style={{ color: "#7C3AED" }}>Loop / Complete</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "principles" && (
          <div>
            <p style={{ fontSize: 13, color: "#71717A", marginBottom: 32, lineHeight: 1.7 }}>
              源自 Anthropic "Building Effective Agents" 的核心設計哲學，貫穿整個課程。
            </p>
            {[
              {
                num: "01",
                title: "從簡單開始，按需增加複雜度",
                desc: "不要一開始就構建最複雜的系統。先用單次 LLM 調用解決問題，只在確實需要時才引入 workflow 和 agent 模式。每增加一層抽象都必須有可衡量的收益。",
                color: "#E8453C",
              },
              {
                num: "02",
                title: "透明性優先",
                desc: "讓 Agent 的規劃步驟、決策邏輯、工具調用都清晰可見。用戶應該能理解 Agent 在做什麼、為什麼這樣做。這也是調試和改進的基礎。",
                color: "#D97706",
              },
              {
                num: "03",
                title: "在 Tool 上投入比 Prompt 更多的時間",
                desc: "Anthropic 在 SWE-bench 上的經驗：工具的設計質量決定了 Agent 的上限。好的 Tool 包含示例、邊界情況說明，並且難以被錯誤使用（Poka-yoke 原則）。",
                color: "#059669",
              },
              {
                num: "04",
                title: "環境反饋是 Agent 的眼睛",
                desc: "每一步執行後都要獲取真實的環境反饋（工具調用結果、代碼執行輸出、測試結果）。Agent 的智能來自於對這些 ground truth 的正確理解和響應。",
                color: "#7C3AED",
              },
              {
                num: "05",
                title: "用 Eval 驅動開發",
                desc: "像寫測試驅動的軟件一樣構建 Agent。建立評測集、設定 baseline、量化每次改動的影響。沒有 eval 的 agent 開發就是在盲人摸象。",
                color: "#2563EB",
              },
            ].map((p, i) => (
              <div key={i} style={{
                display: "flex",
                gap: 20,
                padding: "24px 0",
                borderBottom: i < 4 ? "1px solid rgba(228,228,231,0.06)" : "none",
              }}>
                <div style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: `${p.color}33`,
                  lineHeight: 1,
                  flexShrink: 0,
                  width: 48,
                }}>
                  {p.num}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#E4E4E7", marginBottom: 8 }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 13, color: "#71717A", lineHeight: 1.7 }}>
                    {p.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        button:hover { opacity: 0.9; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #27272A; border-radius: 3px; }
      `}</style>
    </div>
  );
}
