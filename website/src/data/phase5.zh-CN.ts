import type { PhaseContent } from "./types";

export const phase5ContentZhCN: PhaseContent = {
  phaseId: 5,
  color: "#DC2626",
  accent: "#F87171",
  lessons: [
    // ─── Lesson 1: CLI 交互设计 ──────────────────────────────────────
    {
      phaseId: 5,
      lessonId: 1,
      title: "CLI 交互设计与渲染引擎",
      subtitle: "Building a Beautiful Terminal UI",
      type: "设计 + 实践",
      duration: "3.5 hrs",
      objectives: [
        "设计终端 UI 的色彩系统和排版规范",
        "实现 Streaming 文字的实时渲染",
        "实现 Tool Call 的结构化展示卡片",
        "实现彩色 Diff 视图",
        "支持 NO_COLOR 模式和宽度自适应",
      ],
      sections: [
        {
          title: "Phase 导读：从 Agent 到产品",
          blocks: [
            {
              type: "callout",
              variant: "quote",
              text: "Week 11-12 · Ship It\nPhase 0-4 构建了 Agent 的所有核心能力。\n现在是时候把它们包装成一个用户真正想用的产品了。",
            },
            {
              type: "heading",
              level: 3,
              text: "产品化的三大支柱",
            },
            {
              type: "diagram",
              content:
                "┌─────────────────────────────────────────────────┐\n│              CLI Product (Phase 5)              │\n│                                                 │\n│   ┌──────────┐  ┌──────────┐  ┌───────────┐   │\n│   │CLI Render│  │  Config  │  │  Session  │   │\n│   │ 美观 UI   │  │ 配置系统  │  │ 会话管理   │   │\n│   └────┬─────┘  └────┬─────┘  └─────┬─────┘   │\n│        │             │              │          │\n│        └─────────────┼──────────────┘          │\n│                      │                         │\n│          ┌───────────┴───────────┐             │\n│          │   Agent Core          │             │\n│          │   (Phase 0-4)         │             │\n│          └───────────────────────┘             │\n└─────────────────────────────────────────────────┘",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "CLI Renderer：美观的终端渲染（streaming、tool cards、diff）（Lab 1）",
                "Config System：层级化配置管理（Lab 2）",
                "Session Manager：对话持久化与恢复（Lab 3）",
              ],
            },
          ],
        },
        {
          title: "终端 UI 设计原则",
          blocks: [
            {
              type: "paragraph",
              text: "好的 CLI UI 不是花哨的动画，而是清晰、高效的信息展示。参考 Claude Code 的设计：",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "Streaming 输出要流畅——逐字显示，有光标动画",
                "Tool 调用要透明——显示工具名、参数、结果",
                "Diff 要易读——绿色加红色减，行号对齐",
                "错误要醒目——红色高亮，附带上下文",
                "进度要可见——知道 Agent 在做什么",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "ANSI 色彩系统",
            },
            {
              type: "code",
              language: "python",
              code: `# 基础 ANSI 色彩码
RESET = "\\033[0m"
BOLD = "\\033[1m"
DIM = "\\033[2m"
RED = "\\033[31m"      # 错误、删除
GREEN = "\\033[32m"    # 成功、新增
YELLOW = "\\033[33m"   # 警告、Tool 名称
BLUE = "\\033[34m"     # 信息、思考过程
CYAN = "\\033[36m"     # 标题、强调
MAGENTA = "\\033[35m"  # 进度、统计`,
            },
            {
              type: "callout",
              variant: "tip",
              text: "始终支持 NO_COLOR 环境变量。当 NO_COLOR 被设置时，所有 ANSI 码应该变为空字串。这是终端应用的标准约定。",
            },
          ],
        },
        {
          title: "Lab 1: CLI Renderer 实现",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 1 实战指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: render_streaming_text() — 流式输出",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def render_streaming_text(self, text_delta):
    # 直接输出文字增量（不换行）
    if self.config.color_enabled:
        sys.stdout.write(self._colorize(text_delta, self.theme.text_color))
    else:
        sys.stdout.write(text_delta)
    sys.stdout.flush()
    return text_delta`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: render_tool_call() — 工具调用卡片",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
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
              code: `# 伪代码
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
          title: "测试你的实现",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: `# 运行 Lab 1 测试
pytest tests/test_lab1_cli_app.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "5.1.1",
          title: "实现 render_streaming_text()",
          description:
            "实现流式文字渲染，逐字输出 LLM 的回应。支持 NO_COLOR 模式。",
          labFile: "phase_5/cli_app.py",
          hints: [
            "使用 sys.stdout.write() + flush() 实现即时输出",
            "不要用 print()——它会自动加换行",
            "检查 config.color_enabled 决定是否加色彩",
          ],
        },
        {
          id: "5.1.2",
          title: "实现 render_tool_call() 和 render_diff()",
          description:
            "工具调用显示为带边框的卡片。Diff 用绿色/红色区分新增/删除行。",
          labFile: "phase_5/cli_app.py",
          hints: [
            "用 ┌│└─ 字符绘制边框",
            "JSON 输入用 json.dumps(indent=2) 格式化",
            "diff 的 + 行 = 绿色，- 行 = 红色，@@ = 青色",
          ],
        },
        {
          id: "5.1.3",
          title: "实现 render_progress() 和 render_welcome()",
          description:
            "进度条显示当前步骤和总步骤。欢迎画面显示版本和模型信息。",
          labFile: "phase_5/cli_app.py",
          hints: [
            "用 █ 和 ░ 绘制进度条",
            "欢迎画面可以包含 ASCII art logo",
            "显示当前配置的模型名称",
          ],
        },
      ],
      acceptanceCriteria: [
        "Streaming 文字即时输出",
        "Tool 调用显示为结构化卡片",
        "Diff 用红绿色区分",
        "NO_COLOR 模式无 ANSI 码",
        "所有 Lab 1 测试通过",
      ],
      references: [
        {
          title: "ANSI Escape Codes",
          description:
            "终端色彩和格式化的完整参考。",
          url: "https://en.wikipedia.org/wiki/ANSI_escape_code",
        },
        {
          title: "NO_COLOR Convention",
          description:
            "命令行工具的 NO_COLOR 标准约定。",
          url: "https://no-color.org/",
        },
        {
          title: "12-Factor CLI App",
          description:
            "构建优秀命令行应用的原则。",
          url: "https://medium.com/@jdxcode/12-factor-cli-apps-dd3c227a0e46",
        },
      ],
    },

    // ─── Lesson 2: Configuration 系统 ────────────────────────────────
    {
      phaseId: 5,
      lessonId: 2,
      title: "Configuration 系统设计",
      subtitle: "Layered Config & Permission Management",
      type: "代码实践",
      duration: "2.5 hrs",
      objectives: [
        "设计层级化配置系统：默认 < 全局 < 项目 < CLI",
        "实现配置的深度合并策略",
        "支持 .agent.yml 项目配置文件",
        "实现 dotted key path 的配置读取",
      ],
      sections: [
        {
          title: "配置系统的设计",
          blocks: [
            {
              type: "paragraph",
              text: "一个好的配置系统需要支持多层级覆盖。用户可以在不同层级设置配置，高优先级覆盖低优先级：",
            },
            {
              type: "diagram",
              content:
                "优先级（高到低）：\n\n┌──────────────┐\n│  CLI 参数     │  ← --model claude-opus-4-6\n├──────────────┤\n│  项目配置     │  ← .agent.yml\n├──────────────┤\n│  全局配置     │  ← ~/.agent/config.yml\n├──────────────┤\n│  默认值       │  ← 代码中的 default\n└──────────────┘",
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
          title: "Lab 2: Config Manager 实现",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 2 实战指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: load() — 载入并合并配置",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
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
              text: "Step 2: _merge_configs() — 深度合并",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
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
              code: `# 伪代码
def get(self, key, default=None):
    # 支持 "agent.model" 这样的 dotted key
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
          title: "测试你的实现",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: `# 运行 Lab 2 测试
pytest tests/test_lab2_config.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "5.2.1",
          title: "实现 load() 和配置加载",
          description:
            "从默认值、全局配置、项目配置、CLI 参数四个层级加载配置，按优先级合并。",
          labFile: "phase_5/config.py",
          hints: [
            "全局配置在 ~/.agent/config.yml",
            "项目配置在项目根目录的 .agent.yml",
            "文件不存在时返回空 dict，不要报错",
          ],
        },
        {
          id: "5.2.2",
          title: "实现 _merge_configs() 深度合并",
          description:
            "递归合并多层配置字典。嵌套的 dict 应该深度合并而非覆盖。",
          labFile: "phase_5/config.py",
          hints: [
            "两个 dict 的同名 key 都是 dict → 递归合并",
            "否则后面的覆盖前面的",
            "注意 list 类型——通常是覆盖而非拼接",
          ],
        },
        {
          id: "5.2.3",
          title: "实现 get() dotted key path",
          description:
            "支持 'agent.model' 风格的配置读取，逐层查找嵌套字典。",
          labFile: "phase_5/config.py",
          hints: [
            "用 split('.') 拆分 key",
            "逐层深入字典查找",
            "找不到时返回 default 值",
          ],
        },
      ],
      acceptanceCriteria: [
        "四层配置正确合并，优先级正确",
        "深度合并不丢失嵌套配置",
        "dotted key path 正确查找",
        "配置文件缺失时不报错",
        "所有 Lab 2 测试通过",
      ],
      references: [
        {
          title: "YAML Specification",
          description: "YAML 配置文件格式规范。",
          url: "https://yaml.org/spec/",
        },
        {
          title: "Python pathlib",
          description: "路径处理的现代 Python API。",
          url: "https://docs.python.org/3/library/pathlib.html",
        },
      ],
    },

    // ─── Lesson 3: Session 管理 ──────────────────────────────────────
    {
      phaseId: 5,
      lessonId: 3,
      title: "Session 管理与持久化",
      subtitle: "Conversation Persistence & Recovery",
      type: "代码实践",
      duration: "2.5 hrs",
      objectives: [
        "设计 Session 的数据结构和生命周期",
        "实现 Session 的本地持久化（JSON 文件）",
        "支持 Session 列表和恢复",
        "实现自动保存和旧 Session 清理",
      ],
      sections: [
        {
          title: "为什么需要 Session 管理",
          blocks: [
            {
              type: "paragraph",
              text: "用户经常需要中断工作稍后继续。Session 管理让 Agent 能记住之前的对话上下文。",
            },
            {
              type: "heading",
              level: 3,
              text: "Session 的生命周期",
            },
            {
              type: "diagram",
              content:
                "创建 Session\n     │\n     ▼\n用户发送消息 ──→ 添加到 Session ──→ 自动保存\n     │                                  │\n     ▼                                  ▼\nAgent 回应 ───→ 添加到 Session ──→ 自动保存\n     │\n     ▼\n用户退出 ──→ Session 保存到磁盘\n     │\n     ▼\n下次启动 ──→ 列出历史 Session ──→ 恢复选中 Session",
            },
            {
              type: "heading",
              level: 3,
              text: "存储格式",
            },
            {
              type: "code",
              language: "python",
              code: `# Session 存储为 JSON 文件
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
            "content": "帮我修复 auth 模块的 bug",
            "timestamp": 1700000000.0,
            "tool_calls": []
        },
        {
            "role": "assistant",
            "content": "我来分析一下...",
            "timestamp": 1700000010.0,
            "tool_calls": [{"name": "read_file", "input": {"path": "/src/auth.py"}}]
        }
    ]
}`,
            },
          ],
        },
        {
          title: "Lab 3: Session Manager 实现",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 3 实战指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: create_session() 和 add_message()",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
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
              code: `# 伪代码
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
              code: `# 伪代码
def list_sessions(self):
    storage = Path(self.config.storage_dir).expanduser()
    summaries = []
    for f in sorted(storage.glob("*.json"), reverse=True):
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
          title: "测试你的实现",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: `# 运行 Lab 3 测试
pytest tests/test_lab3_session.py -v`,
            },
            {
              type: "callout",
              variant: "info",
              text: "测试使用 tmp_path fixture 作为临时目录，不会影响你的真实文件系统。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "5.3.1",
          title: "实现 create_session() 和 add_message()",
          description:
            "创建新 Session 并支持添加消息。添加消息后自动更新 updated_at，如果 auto_save 开启则自动持久化。",
          labFile: "phase_5/session.py",
          hints: [
            "使用 _generate_session_id() 生成唯一 ID",
            "auto_save 时调用 save_session()",
            "更新 session.updated_at = time.time()",
          ],
        },
        {
          id: "5.3.2",
          title: "实现 save_session() 和 load_session()",
          description:
            "将 Session 序列化为 JSON 保存到磁盘，支持从磁盘加载恢复。",
          labFile: "phase_5/session.py",
          hints: [
            "使用 dataclasses.asdict() 序列化",
            "用 json.dumps(ensure_ascii=False) 支持中文",
            "load 时文件不存在要抛 FileNotFoundError",
          ],
        },
        {
          id: "5.3.3",
          title: "实现 list_sessions()",
          description:
            "列出所有保存的 Session，返回摘要列表（ID、时间、消息数、预览）。",
          labFile: "phase_5/session.py",
          hints: [
            "用 glob('*.json') 找所有 session 文件",
            "按时间倒序排列",
            "preview 取第一条消息的前 50 字符",
          ],
        },
      ],
      acceptanceCriteria: [
        "Session 创建和消息添加正常",
        "save/load 往返一致（roundtrip）",
        "list_sessions 返回正确的摘要",
        "auto_save 自动触发保存",
        "所有 Lab 3 测试通过",
      ],
      references: [
        {
          title: "Python JSON",
          description: "JSON 序列化/反序列化。",
          url: "https://docs.python.org/3/library/json.html",
        },
        {
          title: "Python dataclasses",
          description: "dataclasses.asdict 用于序列化。",
          url: "https://docs.python.org/3/library/dataclasses.html",
        },
      ],
    },

    // ─── Lesson 4: 整合与回顾 — v1.0 发布 ───────────────────────────
    {
      phaseId: 5,
      lessonId: 4,
      title: "整合与发布：v1.0",
      subtitle: "Ship Your Code Agent",
      type: "项目实践",
      duration: "6 hrs",
      objectives: [
        "整合 Phase 0-5 的所有模块",
        "打磨完整的用户体验流程",
        "在真实项目上测试 Agent",
        "完成文档和发布准备",
        "回顾整个课程的核心收获",
      ],
      sections: [
        {
          title: "Phase 5 整合：完整的 Agent 产品",
          blocks: [
            {
              type: "paragraph",
              text: "最后一步：把 6 个 Phase 的成果整合为一个完整的 CLI Agent 产品。",
            },
            {
              type: "diagram",
              content:
                "┌────────────────────────────────────────────────┐\n│               my-code-agent v1.0               │\n│                                                │\n│  Phase 5: CLI Renderer + Config + Session      │\n│  ┌──────────────────────────────────────────┐  │\n│  │ Phase 4: Orchestrator + Evaluator + Eval │  │\n│  │ ┌────────────────────────────────────┐   │  │\n│  │ │ Phase 3: Agent Loop + Recovery     │   │  │\n│  │ │ ┌────────────────────────────────┐ │   │  │\n│  │ │ │ Phase 2: Chain + Router + Trace│ │   │  │\n│  │ │ │ ┌──────────────────────────┐   │ │   │  │\n│  │ │ │ │ Phase 1: Tool System     │   │ │   │  │\n│  │ │ │ │ ┌──────────────────────┐ │   │ │   │  │\n│  │ │ │ │ │ Phase 0: LLM Core   │ │   │ │   │  │\n│  │ │ │ │ └──────────────────────┘ │   │ │   │  │\n│  │ │ │ └──────────────────────────┘   │ │   │  │\n│  │ │ └────────────────────────────────┘ │   │  │\n│  │ └────────────────────────────────────┘   │  │\n│  └──────────────────────────────────────────┘  │\n└────────────────────────────────────────────────┘",
            },
          ],
        },
        {
          title: "完整课程回顾",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "12 周的旅程",
            },
            {
              type: "table",
              headers: ["Phase", "主题", "核心成果", "对应原则"],
              rows: [
                ["Phase 0", "LLM Core", "API Client + Tool Use + Context", "从简单开始"],
                ["Phase 1", "Tool System", "Registry + File Ops + Shell", "在 Tool 上投入更多"],
                ["Phase 2", "Workflow", "Chain + Router + Tracing", "透明性优先"],
                ["Phase 3", "Agent Core", "ReAct Loop + Recovery + Permissions", "环境反馈是眼睛"],
                ["Phase 4", "Orchestration", "Orchestrator + Evaluator + Eval", "用 Eval 驱动开发"],
                ["Phase 5", "Ship It", "CLI + Config + Session", "产品化"],
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "五大设计原则回顾",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "从简单开始，按需增加复杂度——你从单次 API 调用开始，逐步构建了完整的 Agent",
                "透明性优先——Tracing 系统让每一步都可追踪",
                "在 Tool 上投入比 Prompt 更多——Tool System 是 Agent 能力的基石",
                "环境反馈是 Agent 的眼睛——Error Recovery 让 Agent 能从错误中学习",
                "用 Eval 驱动开发——Eval Framework 让每次改进都可量化",
              ],
            },
            {
              type: "callout",
              variant: "quote",
              text: "恭喜你完成了这个 12 周的旅程。你从零构建了一个完整的 AI Coding Agent——\n不仅理解了原理，更亲手实现了每一个组件。\n\n这不是结束，而是开始。去构建你自己的 Agent 吧。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "5.4.1",
          title: "运行全部测试",
          description:
            "运行完整测试套件，确保所有 Lab 都已正确实现。\n\n目标：全部测试通过，grade.py 显示 100%。",
          labFile: "phase_5/",
          hints: [
            "pytest -v 显示每个测试的详细结果",
            "确保所有 Phase 的测试都通过",
          ],
          pseudocode: `# 运行所有测试
pytest -v

# 查看成绩报告
python scripts/grade.py`,
        },
        {
          id: "5.4.2",
          title: "端到端体验测试",
          description:
            "启动完整的 CLI Agent，体验从启动到对话到退出的完整流程。\n\n测试场景：\n- 首次启动的欢迎画面\n- 对话中的 tool 调用展示\n- Session 保存和恢复\n- 配置文件的效果",
          labFile: "phase_5/cli.py",
          hints: [
            "先创建 .agent.yml 配置文件",
            "退出后重启，尝试恢复之前的 session",
            "用 /sessions 命令查看历史",
          ],
          pseudocode: `# 启动 CLI
python -m phase_5.cli

# 可用指令：
# /sessions  — 列出历史 session
# /config    — 查看当前配置
# /exit      — 保存并退出`,
        },
        {
          id: "5.4.3",
          title: "回顾整个课程",
          description:
            "回顾 Phase 0-5 的所有成果。思考：哪个 Phase 最有挑战性？哪个设计原则印象最深？如果重新开始，你会做什么不同？",
          labFile: "phase_5/cli.py",
          hints: [
            "回顾每个 Phase 的 COURSE.md",
            "对比你的实现和 Anthropic 的设计建议",
            "思考如何进一步改进你的 Agent",
          ],
        },
      ],
      acceptanceCriteria: [
        "pytest 全部测试通过",
        "grade.py 显示 100% 完成度",
        "CLI 启动流程完整友好",
        "Session 保存和恢复正常",
        "配置系统层级覆盖正确",
      ],
      references: [
        {
          title: "Building Effective Agents",
          description:
            "回顾全文——你已经实现了文中描述的所有模式。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Claude Code",
          description:
            "对比你的实现和 Claude Code 的设计。",
          url: "https://docs.anthropic.com/en/docs/claude-code",
        },
        {
          title: "Anthropic Agent SDK",
          description:
            "Anthropic 的官方 Agent SDK——了解生产级实现。",
          url: "https://github.com/anthropics/anthropic-sdk-python",
        },
      ],
    },
  ],
};
