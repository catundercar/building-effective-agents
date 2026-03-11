import type { PhaseContent } from "./types";

export const phase5Content: PhaseContent = {
  phaseId: 5,
  color: "#DC2626",
  accent: "#F87171",
  lessons: [
    // ─── Lesson 1: CLI 交互設計 ──────────────────────────────────────
    {
      phaseId: 5,
      lessonId: 1,
      title: "CLI 交互設計與渲染引擎",
      subtitle: "Building a Beautiful Terminal UI",
      type: "設計 + 實踐",
      duration: "3.5 hrs",
      objectives: [
        "設計終端 UI 的色彩系統和排版規範",
        "實現 Streaming 文字的實時渲染",
        "實現 Tool Call 的結構化展示卡片",
        "實現彩色 Diff 視圖",
        "支持 NO_COLOR 模式和寬度自適應",
      ],
      sections: [
        {
          title: "Phase 導讀：從 Agent 到產品",
          blocks: [
            {
              type: "callout",
              variant: "quote",
              text: "Week 11-12 · Ship It\nPhase 0-4 構建了 Agent 的所有核心能力。\n現在是時候把它們包裝成一個用戶真正想用的產品了。",
            },
            {
              type: "heading",
              level: 3,
              text: "產品化的三大支柱",
            },
            {
              type: "diagram",
              content:
                "┌─────────────────────────────────────────────────┐\n│              CLI Product (Phase 5)              │\n│                                                 │\n│   ┌──────────┐  ┌──────────┐  ┌───────────┐   │\n│   │CLI Render│  │  Config  │  │  Session  │   │\n│   │ 美觀 UI   │  │ 配置系統  │  │ 會話管理   │   │\n│   └────┬─────┘  └────┬─────┘  └─────┬─────┘   │\n│        │             │              │          │\n│        └─────────────┼──────────────┘          │\n│                      │                         │\n│          ┌───────────┴───────────┐             │\n│          │   Agent Core          │             │\n│          │   (Phase 0-4)         │             │\n│          └───────────────────────┘             │\n└─────────────────────────────────────────────────┘",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "CLI Renderer：美觀的終端渲染（streaming、tool cards、diff）（Lab 1）",
                "Config System：層級化配置管理（Lab 2）",
                "Session Manager：對話持久化與恢復（Lab 3）",
              ],
            },
          ],
        },
        {
          title: "終端 UI 設計原則",
          blocks: [
            {
              type: "paragraph",
              text: "好的 CLI UI 不是花哨的動畫，而是清晰、高效的信息展示。參考 Claude Code 的設計：",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "Streaming 輸出要流暢——逐字顯示，有光標動畫",
                "Tool 調用要透明——顯示工具名、參數、結果",
                "Diff 要易讀——綠色加紅色減，行號對齊",
                "錯誤要醒目——紅色高亮，附帶上下文",
                "進度要可見——知道 Agent 在做什麼",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "ANSI 色彩系統",
            },
            {
              type: "code",
              language: "python",
              code: `# 基礎 ANSI 色彩碼
RESET = "\\033[0m"
BOLD = "\\033[1m"
DIM = "\\033[2m"
RED = "\\033[31m"      # 錯誤、刪除
GREEN = "\\033[32m"    # 成功、新增
YELLOW = "\\033[33m"   # 警告、Tool 名稱
BLUE = "\\033[34m"     # 信息、思考過程
CYAN = "\\033[36m"     # 標題、強調
MAGENTA = "\\033[35m"  # 進度、統計`,
            },
            {
              type: "callout",
              variant: "tip",
              text: "始終支持 NO_COLOR 環境變量。當 NO_COLOR 被設置時，所有 ANSI 碼應該變為空字串。這是終端應用的標準約定。",
            },
          ],
        },
        {
          title: "Lab 1: CLI Renderer 實現",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 1 實戰指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: render_streaming_text() — 流式輸出",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def render_streaming_text(self, text_delta):
    # 直接輸出文字增量（不換行）
    if self.config.color_enabled:
        sys.stdout.write(text_delta)
    else:
        sys.stdout.write(text_delta)
    sys.stdout.flush()`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: render_tool_call() — 工具調用卡片",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def render_tool_call(self, tool_name, tool_input, result):
    print(f"\\n{CYAN}┌─ Tool: {tool_name}{RESET}")
    print(f"{DIM}│ Input: {json.dumps(tool_input, indent=2)}{RESET}")
    if result:
        truncated = self._truncate(result, 500)
        print(f"│ Result: {truncated}")
    print(f"{CYAN}└{'─' * 40}{RESET}\\n")`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 3: render_diff() — 彩色 Diff",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def render_diff(self, filename, diff_content):
    print(f"\\n{BOLD}--- {filename}{RESET}")
    for line in diff_content.split("\\n"):
        if line.startswith("+"):
            print(f"{GREEN}{line}{RESET}")
        elif line.startswith("-"):
            print(f"{RED}{line}{RESET}")
        elif line.startswith("@@"):
            print(f"{CYAN}{line}{RESET}")
        else:
            print(line)`,
            },
          ],
        },
        {
          title: "測試你的實現",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: `# 運行 Lab 1 測試
pytest tests/test_lab1_cli_app.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "5.1.1",
          title: "實現 render_streaming_text()",
          description:
            "實現流式文字渲染，逐字輸出 LLM 的回應。支持 NO_COLOR 模式。",
          labFile: "phase_5/cli_app.py",
          hints: [
            "使用 sys.stdout.write() + flush() 實現即時輸出",
            "不要用 print()——它會自動加換行",
            "檢查 config.color_enabled 決定是否加色彩",
          ],
        },
        {
          id: "5.1.2",
          title: "實現 render_tool_call() 和 render_diff()",
          description:
            "工具調用顯示為帶邊框的卡片。Diff 用綠色/紅色區分新增/刪除行。",
          labFile: "phase_5/cli_app.py",
          hints: [
            "用 ┌│└─ 字符繪製邊框",
            "JSON 輸入用 json.dumps(indent=2) 格式化",
            "diff 的 + 行 = 綠色，- 行 = 紅色，@@ = 青色",
          ],
        },
        {
          id: "5.1.3",
          title: "實現 render_progress() 和 render_welcome()",
          description:
            "進度條顯示當前步驟和總步驟。歡迎畫面顯示版本和模型信息。",
          labFile: "phase_5/cli_app.py",
          hints: [
            "用 █ 和 ░ 繪製進度條",
            "歡迎畫面可以包含 ASCII art logo",
            "顯示當前配置的模型名稱",
          ],
        },
      ],
      acceptanceCriteria: [
        "Streaming 文字即時輸出",
        "Tool 調用顯示為結構化卡片",
        "Diff 用紅綠色區分",
        "NO_COLOR 模式無 ANSI 碼",
        "所有 Lab 1 測試通過",
      ],
      references: [
        {
          title: "ANSI Escape Codes",
          description:
            "終端色彩和格式化的完整參考。",
          url: "https://en.wikipedia.org/wiki/ANSI_escape_code",
        },
        {
          title: "NO_COLOR Convention",
          description:
            "命令行工具的 NO_COLOR 標準約定。",
          url: "https://no-color.org/",
        },
        {
          title: "12-Factor CLI App",
          description:
            "構建優秀命令行應用的原則。",
          url: "https://medium.com/@jdxcode/12-factor-cli-apps-dd3c227a0e46",
        },
      ],
    },

    // ─── Lesson 2: Configuration 系統 ────────────────────────────────
    {
      phaseId: 5,
      lessonId: 2,
      title: "Configuration 系統設計",
      subtitle: "Layered Config & Permission Management",
      type: "代碼實踐",
      duration: "2.5 hrs",
      objectives: [
        "設計層級化配置系統：默認 < 全局 < 項目 < CLI",
        "實現配置的深度合併策略",
        "支持 .agent.yml 項目配置文件",
        "實現 dotted key path 的配置讀取",
      ],
      sections: [
        {
          title: "配置系統的設計",
          blocks: [
            {
              type: "paragraph",
              text: "一個好的配置系統需要支持多層級覆蓋。用戶可以在不同層級設置配置，高優先級覆蓋低優先級：",
            },
            {
              type: "diagram",
              content:
                "優先級（高到低）：\n\n┌──────────────┐\n│  CLI 參數     │  ← --model claude-opus-4-6\n├──────────────┤\n│  項目配置     │  ← .agent.yml\n├──────────────┤\n│  全局配置     │  ← ~/.agent/config.yml\n├──────────────┤\n│  默認值       │  ← 代碼中的 default\n└──────────────┘",
            },
            {
              type: "heading",
              level: 3,
              text: "配置文件格式",
            },
            {
              type: "code",
              language: "python",
              code: `# .agent.yml 示例
# agent:
#   model: claude-sonnet-4-20250514
#   max_tokens: 8192
#   temperature: 0.0
#   max_iterations: 20
#
# permissions:
#   - tool_name: "read_*"
#     level: auto
#   - tool_name: "write_*"
#     level: confirm
#   - tool_name: "shell_*"
#     level: confirm
#
# allowed_dirs:
#   - /Users/me/project
#
# blocked_commands:
#   - rm -rf
#   - sudo`,
            },
          ],
        },
        {
          title: "Lab 2: Config Manager 實現",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 2 實戰指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: load() — 載入並合併配置",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def load(self):
    default = self._default_config()
    global_config = self._load_global_config()
    project_config = self._load_project_config()

    merged = self._merge_configs(
        default,
        global_config,
        project_config,
        self.cli_overrides,
    )
    return validate_config(merged)`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: _merge_configs() — 深度合併",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def _merge_configs(self, *layers):
    result = {}
    for layer in layers:
        for key, value in layer.items():
            if isinstance(value, dict) and isinstance(result.get(key), dict):
                result[key] = self._merge_configs(result[key], value)
            else:
                result[key] = value
    return result`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 3: get() — Dotted key path",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def get(self, key, default=None):
    # 支持 "agent.model" 這樣的 dotted key
    parts = key.split(".")
    current = self._config
    for part in parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return default
    return current`,
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
pytest tests/test_lab2_config.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "5.2.1",
          title: "實現 load() 和配置加載",
          description:
            "從默認值、全局配置、項目配置、CLI 參數四個層級加載配置，按優先級合併。",
          labFile: "phase_5/config.py",
          hints: [
            "全局配置在 ~/.agent/config.yml",
            "項目配置在項目根目錄的 .agent.yml",
            "文件不存在時返回空 dict，不要報錯",
          ],
        },
        {
          id: "5.2.2",
          title: "實現 _merge_configs() 深度合併",
          description:
            "遞歸合併多層配置字典。嵌套的 dict 應該深度合併而非覆蓋。",
          labFile: "phase_5/config.py",
          hints: [
            "兩個 dict 的同名 key 都是 dict → 遞歸合併",
            "否則後面的覆蓋前面的",
            "注意 list 類型——通常是覆蓋而非拼接",
          ],
        },
        {
          id: "5.2.3",
          title: "實現 get() dotted key path",
          description:
            "支持 'agent.model' 風格的配置讀取，逐層查找嵌套字典。",
          labFile: "phase_5/config.py",
          hints: [
            "用 split('.') 拆分 key",
            "逐層深入字典查找",
            "找不到時返回 default 值",
          ],
        },
      ],
      acceptanceCriteria: [
        "四層配置正確合併，優先級正確",
        "深度合併不丟失嵌套配置",
        "dotted key path 正確查找",
        "配置文件缺失時不報錯",
        "所有 Lab 2 測試通過",
      ],
      references: [
        {
          title: "YAML Specification",
          description: "YAML 配置文件格式規範。",
          url: "https://yaml.org/spec/",
        },
        {
          title: "Python pathlib",
          description: "路徑處理的現代 Python API。",
          url: "https://docs.python.org/3/library/pathlib.html",
        },
      ],
    },

    // ─── Lesson 3: Session 管理 ──────────────────────────────────────
    {
      phaseId: 5,
      lessonId: 3,
      title: "Session 管理與持久化",
      subtitle: "Conversation Persistence & Recovery",
      type: "代碼實踐",
      duration: "2.5 hrs",
      objectives: [
        "設計 Session 的數據結構和生命週期",
        "實現 Session 的本地持久化（JSON 文件）",
        "支持 Session 列表和恢復",
        "實現自動保存和舊 Session 清理",
      ],
      sections: [
        {
          title: "為什麼需要 Session 管理",
          blocks: [
            {
              type: "paragraph",
              text: "用戶經常需要中斷工作稍後繼續。Session 管理讓 Agent 能記住之前的對話上下文。",
            },
            {
              type: "heading",
              level: 3,
              text: "Session 的生命週期",
            },
            {
              type: "diagram",
              content:
                "創建 Session\n     │\n     ▼\n用戶發送消息 ──→ 添加到 Session ──→ 自動保存\n     │                                  │\n     ▼                                  ▼\nAgent 回應 ───→ 添加到 Session ──→ 自動保存\n     │\n     ▼\n用戶退出 ──→ Session 保存到磁盤\n     │\n     ▼\n下次啟動 ──→ 列出歷史 Session ──→ 恢復選中 Session",
            },
            {
              type: "heading",
              level: 3,
              text: "存儲格式",
            },
            {
              type: "code",
              language: "python",
              code: `# Session 存儲為 JSON 文件
# ~/.agent/sessions/sess_abc123.json
{
    "id": "sess_abc123",
    "created_at": 1700000000.0,
    "updated_at": 1700003600.0,
    "project_dir": "/Users/me/project",
    "model": "claude-sonnet-4-20250514",
    "total_tokens": 15000,
    "messages": [
        {
            "role": "user",
            "content": "幫我修復 auth 模塊的 bug",
            "timestamp": 1700000000.0,
            "tool_calls": []
        },
        {
            "role": "assistant",
            "content": "我來分析一下...",
            "timestamp": 1700000010.0,
            "tool_calls": [{"name": "read_file", "input": {"path": "/src/auth.py"}}]
        }
    ]
}`,
            },
          ],
        },
        {
          title: "Lab 3: Session Manager 實現",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 3 實戰指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: create_session() 和 add_message()",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def create_session(self, project_dir, model):
    session = Session(
        id=self._generate_session_id(),
        created_at=time.time(),
        updated_at=time.time(),
        project_dir=project_dir,
        model=model,
    )
    return session

def add_message(self, session, role, content, tool_calls=None):
    msg = SessionMessage(
        role=role,
        content=content,
        timestamp=time.time(),
        tool_calls=tool_calls or [],
    )
    session.messages.append(msg)
    session.updated_at = time.time()
    if self.config.auto_save:
        self.save_session(session)`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: save_session() 和 load_session()",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def save_session(self, session):
    path = self._session_path(session.id)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = dataclasses.asdict(session)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2))

def load_session(self, session_id):
    path = self._session_path(session_id)
    if not path.exists():
        raise FileNotFoundError(f"Session {session_id} not found")
    data = json.loads(path.read_text())
    return Session(**data)`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 3: list_sessions()",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def list_sessions(self):
    storage = Path(self.config.storage_dir).expanduser()
    summaries = []
    for f in sorted(storage.glob("sess_*.json"), reverse=True):
        data = json.loads(f.read_text())
        summaries.append(SessionSummary(
            id=data["id"],
            created_at=data["created_at"],
            message_count=len(data["messages"]),
            preview=data["messages"][0]["content"][:50] if data["messages"] else "",
            project_dir=data["project_dir"],
        ))
    return summaries`,
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
pytest tests/test_lab3_session.py -v`,
            },
            {
              type: "callout",
              variant: "info",
              text: "測試使用 tmp_path fixture 作為臨時目錄，不會影響你的真實文件系統。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "5.3.1",
          title: "實現 create_session() 和 add_message()",
          description:
            "創建新 Session 並支持添加消息。添加消息後自動更新 updated_at，如果 auto_save 開啟則自動持久化。",
          labFile: "phase_5/session.py",
          hints: [
            "使用 _generate_session_id() 生成唯一 ID",
            "auto_save 時調用 save_session()",
            "更新 session.updated_at = time.time()",
          ],
        },
        {
          id: "5.3.2",
          title: "實現 save_session() 和 load_session()",
          description:
            "將 Session 序列化為 JSON 保存到磁盤，支持從磁盤加載恢復。",
          labFile: "phase_5/session.py",
          hints: [
            "使用 dataclasses.asdict() 序列化",
            "用 json.dumps(ensure_ascii=False) 支持中文",
            "load 時文件不存在要拋 FileNotFoundError",
          ],
        },
        {
          id: "5.3.3",
          title: "實現 list_sessions()",
          description:
            "列出所有保存的 Session，返回摘要列表（ID、時間、消息數、預覽）。",
          labFile: "phase_5/session.py",
          hints: [
            "用 glob('sess_*.json') 找所有 session 文件",
            "按時間倒序排列",
            "preview 取第一條消息的前 50 字符",
          ],
        },
      ],
      acceptanceCriteria: [
        "Session 創建和消息添加正常",
        "save/load 往返一致（roundtrip）",
        "list_sessions 返回正確的摘要",
        "auto_save 自動觸發保存",
        "所有 Lab 3 測試通過",
      ],
      references: [
        {
          title: "Python JSON",
          description: "JSON 序列化/反序列化。",
          url: "https://docs.python.org/3/library/json.html",
        },
        {
          title: "Python dataclasses",
          description: "dataclasses.asdict 用於序列化。",
          url: "https://docs.python.org/3/library/dataclasses.html",
        },
      ],
    },

    // ─── Lesson 4: 整合與回顧 — v1.0 發布 ───────────────────────────
    {
      phaseId: 5,
      lessonId: 4,
      title: "整合與發布：v1.0",
      subtitle: "Ship Your Code Agent",
      type: "項目實踐",
      duration: "6 hrs",
      objectives: [
        "整合 Phase 0-5 的所有模塊",
        "打磨完整的用戶體驗流程",
        "在真實項目上測試 Agent",
        "完成文檔和發布準備",
        "回顧整個課程的核心收穫",
      ],
      sections: [
        {
          title: "Phase 5 整合：完整的 Agent 產品",
          blocks: [
            {
              type: "paragraph",
              text: "最後一步：把 6 個 Phase 的成果整合為一個完整的 CLI Agent 產品。",
            },
            {
              type: "diagram",
              content:
                "┌────────────────────────────────────────────────┐\n│               my-code-agent v1.0               │\n│                                                │\n│  Phase 5: CLI Renderer + Config + Session      │\n│  ┌──────────────────────────────────────────┐  │\n│  │ Phase 4: Orchestrator + Evaluator + Eval │  │\n│  │ ┌────────────────────────────────────┐   │  │\n│  │ │ Phase 3: Agent Loop + Recovery     │   │  │\n│  │ │ ┌────────────────────────────────┐ │   │  │\n│  │ │ │ Phase 2: Chain + Router + Trace│ │   │  │\n│  │ │ │ ┌──────────────────────────┐   │ │   │  │\n│  │ │ │ │ Phase 1: Tool System     │   │ │   │  │\n│  │ │ │ │ ┌──────────────────────┐ │   │ │   │  │\n│  │ │ │ │ │ Phase 0: LLM Core   │ │   │ │   │  │\n│  │ │ │ │ └──────────────────────┘ │   │ │   │  │\n│  │ │ │ └──────────────────────────┘   │ │   │  │\n│  │ │ └────────────────────────────────┘ │   │  │\n│  │ └────────────────────────────────────┘   │  │\n│  └──────────────────────────────────────────┘  │\n└────────────────────────────────────────────────┘",
            },
          ],
        },
        {
          title: "完整課程回顧",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "12 週的旅程",
            },
            {
              type: "table",
              headers: ["Phase", "主題", "核心成果", "對應原則"],
              rows: [
                ["Phase 0", "LLM Core", "API Client + Tool Use + Context", "從簡單開始"],
                ["Phase 1", "Tool System", "Registry + File Ops + Shell", "在 Tool 上投入更多"],
                ["Phase 2", "Workflow", "Chain + Router + Tracing", "透明性優先"],
                ["Phase 3", "Agent Core", "ReAct Loop + Recovery + Permissions", "環境反饋是眼睛"],
                ["Phase 4", "Orchestration", "Orchestrator + Evaluator + Eval", "用 Eval 驅動開發"],
                ["Phase 5", "Ship It", "CLI + Config + Session", "產品化"],
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "五大設計原則回顧",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "從簡單開始，按需增加複雜度——你從單次 API 調用開始，逐步構建了完整的 Agent",
                "透明性優先——Tracing 系統讓每一步都可追蹤",
                "在 Tool 上投入比 Prompt 更多——Tool System 是 Agent 能力的基石",
                "環境反饋是 Agent 的眼睛——Error Recovery 讓 Agent 能從錯誤中學習",
                "用 Eval 驅動開發——Eval Framework 讓每次改進都可量化",
              ],
            },
            {
              type: "callout",
              variant: "quote",
              text: "恭喜你完成了這個 12 週的旅程。你從零構建了一個完整的 AI Coding Agent——\n不僅理解了原理，更親手實現了每一個組件。\n\n這不是結束，而是開始。去構建你自己的 Agent 吧。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "5.4.1",
          title: "運行全部測試",
          description:
            "運行完整測試套件，確保所有 Lab 都已正確實現。\n\n目標：全部測試通過，grade.py 顯示 100%。",
          labFile: "phase_5/",
          hints: [
            "pytest -v 顯示每個測試的詳細結果",
            "確保所有 Phase 的測試都通過",
          ],
          pseudocode: `# 運行所有測試
pytest -v

# 查看成績報告
python scripts/grade.py`,
        },
        {
          id: "5.4.2",
          title: "端到端體驗測試",
          description:
            "啟動完整的 CLI Agent，體驗從啟動到對話到退出的完整流程。\n\n測試場景：\n- 首次啟動的歡迎畫面\n- 對話中的 tool 調用展示\n- Session 保存和恢復\n- 配置文件的效果",
          labFile: "phase_5/cli.py",
          hints: [
            "先創建 .agent.yml 配置文件",
            "退出後重啟，嘗試恢復之前的 session",
            "用 /sessions 命令查看歷史",
          ],
          pseudocode: `# 啟動 CLI
python -m phase_5.cli

# 可用指令：
# /sessions  — 列出歷史 session
# /config    — 查看當前配置
# /exit      — 保存並退出`,
        },
        {
          id: "5.4.3",
          title: "回顧整個課程",
          description:
            "回顧 Phase 0-5 的所有成果。思考：哪個 Phase 最有挑戰性？哪個設計原則印象最深？如果重新開始，你會做什麼不同？",
          labFile: "phase_5/cli.py",
          hints: [
            "回顧每個 Phase 的 COURSE.md",
            "對比你的實現和 Anthropic 的設計建議",
            "思考如何進一步改進你的 Agent",
          ],
        },
      ],
      acceptanceCriteria: [
        "pytest 全部測試通過",
        "grade.py 顯示 100% 完成度",
        "CLI 啟動流程完整友好",
        "Session 保存和恢復正常",
        "配置系統層級覆蓋正確",
      ],
      references: [
        {
          title: "Building Effective Agents",
          description:
            "回顧全文——你已經實現了文中描述的所有模式。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Claude Code",
          description:
            "對比你的實現和 Claude Code 的設計。",
          url: "https://docs.anthropic.com/en/docs/claude-code",
        },
        {
          title: "Anthropic Agent SDK",
          description:
            "Anthropic 的官方 Agent SDK——了解生產級實現。",
          url: "https://github.com/anthropics/anthropic-sdk-python",
        },
      ],
    },
  ],
};
