import type { PhaseContent } from "./types";

export const phase1ContentZhCN: PhaseContent = {
  phaseId: 1,
  color: "#D97706",
  accent: "#F59E0B",
  lessons: [
    // ─── Lesson 1: Tool Registry 设计模式 ───────────────────────────
    {
      phaseId: 1,
      lessonId: 1,
      title: "Tool Registry 设计模式",
      subtitle: "Building a Scalable Tool Management System",
      type: "设计 + 实践",
      duration: "3 hrs",
      visualization: "phase1-registry",
      objectives: [
        "理解 Registry Pattern 在 Agent 系统中的角色",
        "掌握 Tool 的完整生命周期：定义 → 验证 → 注册 → 发现 → 调用",
        "学会 Tool Description Engineering——写出 LLM 容易理解的描述",
        "理解 Poka-yoke 原则：让工具难以被错误使用",
        "实现带完整验证的 Tool 注册与取消注册",
        "实现 JSON Schema 格式验证",
        "实现从目录自动发现和加载工具模块",
      ],
      sections: [
        {
          title: "Phase 导读：为什么 Tool 设计比 Prompt 更重要？",
          blocks: [
            {
              type: "callout",
              variant: "quote",
              text: "Week 3-4 · Agent-Computer Interface\n你的 Agent 已经能说话了（Phase 0），现在要让它能动手。\nTool 系统是 Agent 与外部世界的接口——它的质量直接决定 Agent 的上限。",
            },
            {
              type: "heading",
              level: 3,
              text: "从 Phase 0 到 Phase 1",
            },
            {
              type: "paragraph",
              text: "在 Phase 0 中，你实现了 LLM Client、Tool Use Loop 和 Context Manager。但 Phase 0 的工具很原始——mock 天气、简单读文件、计算器。要让 Agent 真正有用，它需要完整的文件操作和安全的 Shell 执行能力。",
            },
            {
              type: "diagram",
              content:
                "Phase 0 的 Agent:                    Phase 1 之后:\n  「读取 app.py」→ ✅ 可以            「读取 app.py」→ ✅ 带行号\n  「修改第 42 行」→ ❌ 不行            「修改第 42 行」→ ✅ 精确编辑\n  「运行测试」  → ❌ 不行             「运行测试」  → ✅ 安全 Shell\n  「搜索 TODO」 → ❌ 不行             「搜索 TODO」 → ✅ glob + 内容搜索",
            },
            {
              type: "callout",
              variant: "tip",
              text: "Anthropic 的经验：\"We invested more time in optimizing our tools than on the overall prompt.\" —— 在 SWE-bench 评测中，改进 Tool description 比改进 System Prompt 带来更大的准确率提升。",
            },
          ],
        },
        {
          title: "本 Phase 的三大交付物",
          blocks: [
            {
              type: "diagram",
              content:
                "┌─────────────────────────────────────────────────┐\n│              Tool System (Phase 1)               │\n│                                                   │\n│  ┌───────────────┐  ┌───────────────────────┐    │\n│  │ Tool Registry │  │    File Tools         │    │\n│  │               │  │                       │    │\n│  │ · register    │  │ · read_file          │    │\n│  │ · unregister  │  │ · write_file         │    │\n│  │ · validate    │  │ · list_directory     │    │\n│  │ · discover    │  │ · search_files       │    │\n│  │               │  │ · edit_file          │    │\n│  └───────────────┘  └───────────────────────┘    │\n│                                                   │\n│  ┌───────────────────────────────────────────┐    │\n│  │         Shell Executor                    │    │\n│  │ · execute (timeout + output truncation)   │    │\n│  │ · blocked command detection               │    │\n│  │ · structured result formatting            │    │\n│  └───────────────────────────────────────────┘    │\n└─────────────────────────────────────────────────┘",
            },
          ],
        },
        {
          title: "Registry Pattern 在 Agent 中的角色",
          blocks: [
            {
              type: "paragraph",
              text: "在一个成熟的 Agent 系统中，工具不是硬编码的，而是动态管理的。想象一下 Claude Code 启动时的流程：",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "扫描内建工具目录 → 注册 Read, Write, Edit, Bash 等",
                "扫描用户的 MCP 配置 → 注册 MCP 工具",
                "扫描项目配置 → 根据项目类型启用/禁用工具",
              ],
            },
            {
              type: "paragraph",
              text: "运行时，用户输入指令 → Agent 查询 Registry 获取可用工具 → 将工具定义发送给 LLM → LLM 自主选择合适的工具。",
            },
          ],
        },
        {
          title: "Tool 的生命周期",
          blocks: [
            {
              type: "diagram",
              content:
                "定义 → 验证 → 注册 → 发现 → 调用 → 结果\n │       │       │      │      │      │\n │       │       │      │      │      └── ToolResult (结构化返回)\n │       │       │      │      └── handler.execute(input)\n │       │       │      └── registry.get(name)\n │       │       └── registry.register(handler)\n │       └── validate_schema(definition)\n └── ToolDefinition { name, description, input_schema }",
            },
          ],
        },
        {
          title: "Tool Description Engineering",
          blocks: [
            {
              type: "paragraph",
              text: "写 Tool description 就像写 API 文档——LLM 是你的「用户」。一个好的 description 要回答四个问题：这个工具做什么、什么时候该用它、输入要什么格式、有什么限制。",
            },
            {
              type: "code",
              language: "python",
              code: `# ❌ 差的 description
"Read a file."

# ✅ 好的 description
"Read the contents of a file at the given absolute path. "
"Returns the file contents as a string with line numbers. "
"Use this to examine source code, configuration files, "
"or any text file. "
"The path must be absolute (e.g. /home/user/project/src/main.py). "
"For large files, use offset and limit to read specific sections."`,
            },
          ],
        },
        {
          title: "Poka-yoke 原则",
          blocks: [
            {
              type: "paragraph",
              text: "Poka-yoke（防错设计）源自丰田生产系统。在 Tool 设计中，目标是让工具难以被错误使用。",
            },
            {
              type: "table",
              headers: ["原则", "工具设计实践", "例子"],
              rows: [
                ["物理约束", "参数类型限制", "path 必须是 string"],
                ["格式强制", "强制使用绝对路径", "拒绝 ./src/app.py"],
                ["默认安全", "安全的默认值", "Shell 默认 timeout=30s"],
                ["清晰错误", "错误信息含修正建议", "Path must be absolute. Got: ./src"],
              ],
            },
          ],
        },
        {
          title: "Lab 1 实战指引",
          blocks: [
            {
              type: "paragraph",
              text: "打开 phase_1/registry.py，你会看到 4 个 TODO。建议的实现顺序：",
            },
            {
              type: "heading",
              level: 3,
              text: "Step 1: register() — 工具注册",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def register(self, handler):
    name = handler.definition.name
    if not name:
        raise ValueError("Tool name cannot be empty")
    if not handler.definition.description:
        raise ValueError("Tool description cannot be empty")
    if name in self._handlers:
        raise ValueError(f"Tool '{name}' already registered")
    if handler.definition.input_schema.type != "object":
        raise ValueError("input_schema.type must be 'object'")
    if not re.match(r'^[a-z][a-z0-9_]*$', name):
        raise ValueError("Tool name must be snake_case")
    self._handlers[name] = handler`,
            },
            {
              type: "heading",
              level: 3,
              text: "Step 2: unregister() — 取消注册",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def unregister(self, name):
    if name not in self._handlers:
        raise KeyError(f"Tool '{name}' not found")
    del self._handlers[name]`,
            },
            {
              type: "heading",
              level: 3,
              text: "Step 3: validate_schema() — Schema 验证",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def validate_schema(self, definition):
    errors = []
    if definition.input_schema.type != "object":
        errors.append("type must be 'object'")
    for field in definition.input_schema.required:
        if field not in definition.input_schema.properties:
            errors.append(f"Required '{field}' not in properties")
    for name, schema in definition.input_schema.properties.items():
        if "type" not in schema:
            errors.append(f"Property '{name}' missing 'type'")
        if "description" not in schema:
            errors.append(f"Property '{name}' missing 'description'")
    return errors`,
            },
            {
              type: "heading",
              level: 3,
              text: "Step 4: load_from_directory() — 动态加载",
            },
            {
              type: "paragraph",
              text: "使用 importlib 从指定目录扫描 .py 文件，查找 tool_handler 变量，自动注册。跳过 __init__.py 和以 _ 开头的文件。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "1.1.1",
          title: "register() — 工具注册",
          description:
            "实现 ToolRegistry.register()，支持 5 项验证：名称非空、描述非空、无重复、schema type 为 object、名称为 snake_case。",
          labFile: "phase_1/registry.py",
          hints: [
            "使用 re.match(r'^[a-z][a-z0-9_]*$', name) 验证名称格式",
            "存入 self._handlers[name] = handler",
          ],
        },
        {
          id: "1.1.2",
          title: "unregister() — 取消注册",
          description: "实现 ToolRegistry.unregister()，从注册表移除工具。不存在时抛出 KeyError。",
          labFile: "phase_1/registry.py",
          hints: ["先检查是否存在，再 del"],
        },
        {
          id: "1.1.3",
          title: "validate_schema() — JSON Schema 验证",
          description:
            "验证 ToolDefinition 的 input_schema：type 必须是 object、required 字段必须在 properties 中、每个 property 必须有 type 和 description。",
          labFile: "phase_1/registry.py",
          hints: [
            "返回 errors 列表，空列表表示通过",
            "遍历 required 和 properties 分别检查",
          ],
        },
        {
          id: "1.1.4",
          title: "load_from_directory() — 动态加载",
          description:
            "从目录自动扫描 .py 文件，查找 tool_handler 变量并自动注册。跳过 __init__.py。",
          labFile: "phase_1/registry.py",
          hints: [
            "使用 importlib.util.spec_from_file_location",
            "用 try/except 跳过加载失败的文件",
            "检查 hasattr(module, 'tool_handler')",
          ],
        },
      ],
      acceptanceCriteria: [
        "register() 通过 5 项验证检查",
        "重复注册同名工具时抛出 ValueError",
        "不合法的名称格式（如 CamelCase）被拒绝",
        "unregister() 不存在的工具时抛出 KeyError",
        "validate_schema() 能检测出缺少 type/description 的 property",
        "load_from_directory() 能从目录自动加载工具",
        "所有 test_lab1_registry.py 测试通过",
      ],
      references: [
        {
          title: "Building Effective Agents §Appendix 2",
          description: "Anthropic 的 Tool 设计方法论，包含 Description Engineering 的最佳实践",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Anthropic Tool Use 文档",
          description: "Tool Use 的完整 API 文档和示例",
          url: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use",
        },
        {
          title: "JSON Schema 规范",
          description: "理解 input_schema 的格式标准",
          url: "https://json-schema.org/understanding-json-schema/",
        },
        {
          title: "Poka-yoke (Wikipedia)",
          description: "防错设计原则的起源与应用",
          url: "https://en.wikipedia.org/wiki/Poka-yoke",
        },
      ],
    },

    // ─── Lesson 2: 文件系统工具套件 ───────────────────────────────
    {
      phaseId: 1,
      lessonId: 2,
      title: "文件系统工具套件",
      subtitle: "Building File System Tools for Your Agent",
      type: "概念 + 实践",
      duration: "3 hrs",
      objectives: [
        "理解文件工具在 Agent 中的核心地位（80%+ 的工具调用）",
        "掌握绝对路径的重要性——Anthropic SWE-bench 的血泪教训",
        "理解路径穿越攻击及其防护方法",
        "掌握 edit_file 使用搜索替换而非行号的设计哲学",
        "实现带行号的文件读取工具",
        "实现安全的文件写入工具（自动创建目录）",
        "实现目录列出、文件搜索和精确编辑工具",
      ],
      sections: [
        {
          title: "为什么文件工具是 Agent 最重要的工具",
          blocks: [
            {
              type: "paragraph",
              text: "一个 coding agent 80% 以上的工具调用都是文件操作。在典型的 bug 修复任务中，read_file 占 48%，edit_file 占 28%，run_command 只占 12%。",
            },
            {
              type: "diagram",
              content:
                "典型 bug 修复任务的工具调用分布：\n\n  read_file      ████████████████████████  48%\n  edit_file      ██████████████            28%\n  run_command    ██████                    12%\n  search_files   ████                       8%\n  write_file     ██                         4%",
            },
          ],
        },
        {
          title: "路径安全：Anthropic 的血泪教训",
          blocks: [
            {
              type: "callout",
              variant: "warning",
              text: "始终使用绝对路径。Anthropic 在 SWE-bench 中发现，Agent 移出根目录后使用相对路径会导致大量错误。改为强制要求绝对路径后，问题完全消失。",
            },
            {
              type: "code",
              language: "python",
              code: `# ❌ 使用相对路径的 Agent:
1. cd tests/         → 进入 tests 目录
2. read test_utils.py → OK
3. cd ../src/        → 进入 src 目录
4. read utils.py     → OK
5. cd ../tests/      → 期望回到 tests
6. read test_utils.py → ❌ 路径计算错误！Agent 迷路了

# ✅ 使用绝对路径的 Agent:
1. read /repo/tests/test_utils.py → OK
2. read /repo/src/utils.py        → OK
3. edit /repo/src/utils.py        → OK
4. read /repo/tests/test_utils.py → OK  # 永远不会迷路`,
            },
          ],
        },
        {
          title: "路径穿越攻击防护",
          blocks: [
            {
              type: "paragraph",
              text: "如果你的 Agent 是一个服务，恶意用户可能尝试用 ../ 逃出沙箱目录。正确做法是使用 Path.resolve() + relative_to() 来验证。",
            },
            {
              type: "code",
              language: "python",
              code: `# 路径穿越防护
path = Path("/workspace/../../../../etc/passwd").resolve()
# = /etc/passwd

sandbox = Path("/workspace").resolve()
path.relative_to(sandbox)  # → 抛出 ValueError！`,
            },
          ],
        },
        {
          title: "edit_file 的设计哲学",
          blocks: [
            {
              type: "paragraph",
              text: "为什么用「搜索替换」而不是「行号替换」？因为行号在读取和编辑之间可能会变化（文件被其他进程修改）。搜索替换不依赖行号，更加稳健。Claude Code 的 Edit 工具就是使用这种模式。",
            },
            {
              type: "callout",
              variant: "info",
              text: "如果搜索字串出现多次（歧义），要求 LLM 提供更多上下文使其唯一。这比猜测替换哪一个要安全得多。",
            },
          ],
        },
        {
          title: "Lab 2 实战指引",
          blocks: [
            {
              type: "paragraph",
              text: "打开 phase_1/file_tools.py，你会看到 5 个 TODO。所有方法都遵循相同的模式：先调用 _validate_path() 验证路径安全性，然后执行操作，最后返回 ToolResult。",
            },
            {
              type: "heading",
              level: 3,
              text: "Step 1: read_file() — 带行号的文件读取",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def read_file(self, path, *, offset=0, limit=0):
    try:
        self._validate_path(path)
        p = Path(path)
        if not p.is_file():
            return ToolResult(content=f"Not found: {path}", is_error=True)
        lines = p.read_text("utf-8").splitlines()
        start = offset - 1 if offset > 0 else 0
        lines = lines[start:]
        if limit > 0:
            lines = lines[:limit]
        formatted = [f"{i:>4} | {line}"
                     for i, line in enumerate(lines, start=max(offset, 1))]
        return ToolResult(content="\\n".join(formatted))
    except Exception as e:
        return ToolResult(content=str(e), is_error=True)`,
            },
            {
              type: "heading",
              level: 3,
              text: "Step 2-5: write_file, list_directory, search_files, edit_file",
            },
            {
              type: "paragraph",
              text: "每个方法的伪代码都在 COURSE.md 和源文件的 HINT 注释中。记住：所有路径操作先 validate，所有异常都捕获并返回 ToolResult。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "1.2.1",
          title: "read_file() — 文件读取",
          description:
            "读取文件内容，返回带行号的格式。支持 offset（从第几行开始）和 limit（读几行）。",
          labFile: "phase_1/file_tools.py",
          hints: [
            "先 _validate_path(path)，捕获 ValueError/PermissionError",
            "行号格式: f\"{i:>4} | {line}\"",
            "offset 是 1-indexed",
          ],
        },
        {
          id: "1.2.2",
          title: "write_file() — 文件写入",
          description: "写入文件内容，支持覆盖和追加模式。config.create_dirs 为 True 时自动创建父目录。",
          labFile: "phase_1/file_tools.py",
          hints: [
            "根据 append 选择 'a' 或 'w' 模式",
            "Path.parent.mkdir(parents=True, exist_ok=True)",
          ],
        },
        {
          id: "1.2.3",
          title: "list_directory() — 目录列出",
          description: "列出目录内容。递归模式用 rglob，目录结尾加 /。支持 glob 过滤。",
          labFile: "phase_1/file_tools.py",
          hints: [
            "recursive 用 rglob，否则用 glob",
            "item.relative_to(path) 获取相对路径",
          ],
        },
        {
          id: "1.2.4",
          title: "search_files() — 文件搜索",
          description: "搜索文件（glob 匹配 + 可选的内容搜索）。内容匹配时显示行号。",
          labFile: "phase_1/file_tools.py",
          hints: [
            "用 try/except 跳过二进制文件（UnicodeDecodeError）",
            "格式: f\"{file_path}:{line_no}: {line.strip()}\"",
          ],
        },
        {
          id: "1.2.5",
          title: "edit_file() — 精确编辑",
          description:
            "搜索替换模式。old_string 必须唯一匹配：0 次 → 报错；>1 次 → 报歧义；1 次 → 替换。",
          labFile: "phase_1/file_tools.py",
          hints: [
            "content.count(old_string) 计算出现次数",
            "content.replace(old_string, new_string, 1) 替换",
          ],
        },
      ],
      acceptanceCriteria: [
        "read_file 返回带行号的内容",
        "read_file 支持 offset 和 limit 范围读取",
        "write_file 支持覆盖和追加模式",
        "write_file 自动创建不存在的父目录",
        "list_directory 支持递归和 glob 过滤",
        "search_files 支持文件名和内容搜索",
        "edit_file 拒绝歧义替换（>1 匹配）",
        "所有路径操作使用绝对路径",
        "沙箱外的路径被安全拦截",
        "所有 test_lab2_file_tools.py 测试通过",
      ],
      references: [
        {
          title: "SWE-bench",
          description: "理解 Agent 在真实编程任务上的评测方法",
          url: "https://www.swebench.com/",
        },
        {
          title: "Python pathlib 文档",
          description: "Path 类的完整 API",
          url: "https://docs.python.org/3/library/pathlib.html",
        },
        {
          title: "Building Effective Agents",
          description: "绝对路径的设计决策来源",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
      ],
    },

    // ─── Lesson 3: Shell 执行器与沙箱 ─────────────────────────────
    {
      phaseId: 1,
      lessonId: 3,
      title: "Shell 执行器与沙箱",
      subtitle: "Safe Command Execution for Agents",
      type: "概念 + 实践",
      duration: "2 hrs",
      objectives: [
        "理解 Shell 工具在 Agent 中的角色（验证修改、运行测试）",
        "掌握 Shell 安全三角：安全性（黑名单）、可靠性（超时）、可用性（截断）",
        "理解命令注入攻击的风险及防范方法",
        "实现命令黑名单检测",
        "实现带超时和输出截断的命令执行",
        "实现 LLM 友好的结果格式化",
      ],
      sections: [
        {
          title: "为什么需要 Shell 工具",
          blocks: [
            {
              type: "paragraph",
              text: "文件工具让 Agent 能看和写，Shell 工具让 Agent 能验证。没有 Shell 工具，Agent 就是一个只会写代码但不会测试的初级开发者。",
            },
            {
              type: "code",
              language: "python",
              code: `# 典型工作流：
# 1. read_file → 理解代码
# 2. edit_file → 修改代码
# 3. run_command("python -m pytest tests/") → 验证修改
# 4. 如果测试失败 → 读取错误 → 再次修改 → 再次测试`,
            },
          ],
        },
        {
          title: "Shell 工具的安全三角",
          blocks: [
            {
              type: "diagram",
              content:
                "                ┌──────────────┐\n                │   安全性      │\n                │  (黑名单)     │\n                └──────┬───────┘\n                       │\n          ┌────────────┼────────────┐\n          │            │            │\n    ┌─────┴──────┐           ┌─────┴──────┐\n    │  可靠性     │           │  可用性     │\n    │ (超时控制)  │           │ (输出截断)  │\n    └────────────┘           └────────────┘",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "安全性：命令黑名单防止 rm -rf /、sudo 等危险命令",
                "可靠性：超时控制防止 sleep infinity、死循环等",
                "可用性：输出截断防止 cat huge_file.log 撑爆内存",
              ],
            },
          ],
        },
        {
          title: "结构化输出",
          blocks: [
            {
              type: "paragraph",
              text: "LLM 需要的不只是原始输出，还需要上下文。比较两种返回方式：",
            },
            {
              type: "code",
              language: "python",
              code: `# ❌ 只返回 stderr:
"ModuleNotFoundError: No module named 'flask'"

# ✅ 结构化返回:
"Command failed (exit code 1).\\n"
"stdout:\\n  (empty)\\n"
"stderr:\\n  Traceback (most recent call last):\\n"
"    File \\"app.py\\", line 1, in <module>\\n"
"      from flask import Flask\\n"
"  ModuleNotFoundError: No module named 'flask'"

# LLM 看到完整上下文 → 决定: pip install flask`,
            },
          ],
        },
        {
          title: "Lab 3 实战指引",
          blocks: [
            {
              type: "paragraph",
              text: "打开 phase_1/shell_tools.py，你会看到 4 个 TODO。",
            },
            {
              type: "heading",
              level: 3,
              text: "Step 1: is_command_blocked()",
            },
            {
              type: "paragraph",
              text: "遍历 config.blocked_commands，用子字串匹配检测。如果任何 pattern 出现在 command 中，返回 (True, reason)。",
            },
            {
              type: "heading",
              level: 3,
              text: "Step 2: execute()",
            },
            {
              type: "paragraph",
              text: "核心方法。先检查黑名单 → 构建环境变量 → subprocess.run() → 截断输出。捕获 TimeoutExpired 设置 timed_out=True。",
            },
            {
              type: "heading",
              level: 3,
              text: "Step 3-4: format_result() 和 run()",
            },
            {
              type: "paragraph",
              text: "format_result 根据 timed_out / exit_code 决定返回格式。run() 是 execute() + format_result() 的便捷组合。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "1.3.1",
          title: "is_command_blocked() — 黑名单检测",
          description: "遍历 blocked_commands，子字串匹配。返回 (bool, reason)。",
          labFile: "phase_1/shell_tools.py",
          hints: [
            "command.strip() 去除空白",
            "pattern in command 做子字串匹配",
          ],
        },
        {
          id: "1.3.2",
          title: "execute() — 命令执行",
          description:
            "安全执行命令：黑名单 → 环境变量合并 → subprocess.run → 输出截断 → 超时处理。",
          labFile: "phase_1/shell_tools.py",
          hints: [
            "subprocess.run(command, shell=True, capture_output=True, text=True, timeout=...)",
            "捕获 subprocess.TimeoutExpired 设置 timed_out=True",
            "输出超过 max_output_bytes 时截断并附加提示",
          ],
          pseudocode: `blocked, reason = self.is_command_blocked(command)
if blocked: return ShellResult(stderr=reason, exit_code=1)
merged_env = dict(os.environ)
if env: merged_env.update(env)
merged_env.update(self.config.env_overrides)
try:
    result = subprocess.run(command, shell=True, ...)
    # truncate stdout/stderr if too long
    return ShellResult(stdout, stderr, result.returncode)
except subprocess.TimeoutExpired:
    return ShellResult(timed_out=True, exit_code=124)`,
        },
        {
          id: "1.3.3",
          title: "format_result() — 结果格式化",
          description: "将 ShellResult 格式化为 LLM 友好的 ToolResult。区分成功、失败、超时。",
          labFile: "phase_1/shell_tools.py",
          hints: [
            "timed_out → is_error=True",
            "exit_code != 0 → is_error=True，包含 stdout + stderr",
          ],
        },
        {
          id: "1.3.4",
          title: "run() — 便捷组合",
          description: "execute() + format_result() 的组合方法。",
          labFile: "phase_1/shell_tools.py",
          hints: ["直接调用 self.execute() 然后 self.format_result()"],
        },
      ],
      acceptanceCriteria: [
        "rm -rf / 和 sudo rm 被拦截",
        "安全命令（echo hello）不被拦截",
        "命令超时返回 timed_out=True",
        "长输出被截断",
        "exit_code 正确捕获",
        "stderr 正确捕获",
        "format_result 区分成功/失败/超时",
        "所有 test_lab3_shell_tools.py 测试通过",
      ],
      references: [
        {
          title: "Python subprocess 文档",
          description: "安全的命令执行 API",
          url: "https://docs.python.org/3/library/subprocess.html",
        },
        {
          title: "OWASP Command Injection",
          description: "命令注入攻击的防范指南",
          url: "https://owasp.org/www-community/attacks/Command_Injection",
        },
        {
          title: "Building Effective Agents",
          description: "Agent 安全设计的整体框架",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
      ],
    },

    // ─── Lesson 4: 整合与回顾 ────────────────────────────────────
    {
      phaseId: 1,
      lessonId: 4,
      title: "整合与回顾",
      subtitle: "Integration & Phase 2 Preview",
      type: "项目实践",
      duration: "2 hrs",
      objectives: [
        "将 Registry、File Tools、Shell Executor 整合运行",
        "验证所有测试通过",
        "理解 Phase 1 在整体架构中的位置",
        "预览 Phase 2 的 Workflow 模式",
      ],
      sections: [
        {
          title: "启动你的 Tool System",
          blocks: [
            {
              type: "paragraph",
              text: "当 Lab 1-3 的测试全部通过后，你可以运行 demo：",
            },
            {
              type: "code",
              language: "bash",
              code: `# 查看成绩
python scripts/grade.py

# 运行 demo
python -m phase_1.demo`,
            },
          ],
        },
        {
          title: "你在这个 Phase 学到了什么",
          blocks: [
            {
              type: "table",
              headers: ["概念", "你学到的", "为什么重要"],
              rows: [
                ["Registry Pattern", "动态工具管理、验证、发现", "Agent 工具需要可扩展"],
                ["Description Engineering", "LLM 友好的工具描述", "好描述 = 更准确的调用"],
                ["Poka-yoke", "让工具难以被错误使用", "预防 > 修复"],
                ["绝对路径", "避免相对路径陷阱", "SWE-bench 核心教训"],
                ["Sandbox", "路径穿越防护", "安全边界"],
                ["Shell 安全", "黑名单、超时、输出限制", "安全地执行命令"],
                ["结构化结果", "LLM 友好的输出格式", "Agent 需要理解反馈"],
              ],
            },
          ],
        },
        {
          title: "你构建了什么",
          blocks: [
            {
              type: "diagram",
              content:
                "┌────────────────────────────────────────────────┐\n│  my-agent-tools                                │\n│                                                │\n│  ┌────────────────────┐  ┌──────────────────┐  │\n│  │   Tool Registry    │  │  File Tools      │  │\n│  │  · register        │  │  · read_file     │  │\n│  │  · unregister      │  │  · write_file    │  │\n│  │  · validate_schema │  │  · list_directory│  │\n│  │  · load_from_dir   │  │  · search_files  │  │\n│  │                    │  │  · edit_file     │  │\n│  └────────────────────┘  └──────────────────┘  │\n│                                                │\n│  ┌────────────────────────────────────────┐     │\n│  │       Shell Executor                  │     │\n│  │  · is_command_blocked                 │     │\n│  │  · execute (timeout + truncation)     │     │\n│  │  · format_result                      │     │\n│  │  · run (execute + format)             │     │\n│  └────────────────────────────────────────┘     │\n└────────────────────────────────────────────────┘",
            },
          ],
        },
        {
          title: "下一步：Phase 2 预告",
          blocks: [
            {
              type: "paragraph",
              text: "你的 Agent 现在有了手（File Tools）和脚（Shell Executor）。但它的行为模式还是「收到指令 → 调用一个工具 → 返回结果」的简单模式。",
            },
            {
              type: "paragraph",
              text: "在 Phase 2 中，你将学会两种工作流模式：Prompt Chaining（把复杂任务分解为多步，每步之间有程序化的质量检查）和 Routing（根据用户意图自动路由到不同的处理器）。你的 Agent 将从「一招鲜」进化为「见招拆招」。",
            },
          ],
        },
      ],
      exercises: [],
      acceptanceCriteria: [
        "python scripts/grade.py 显示所有测试通过",
        "python -m phase_1.demo 正常运行",
        "Tool Registry 能注册和查询工具",
        "File Tools 能读写搜索编辑文件",
        "Shell Executor 能安全执行命令",
        "危险命令被拦截，沙箱外路径被拒绝",
      ],
      references: [
        {
          title: "Building Effective Agents",
          description: "完整的 Agent 设计方法论",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Model Context Protocol",
          description: "MCP 规范，理解工具的未来生态",
          url: "https://modelcontextprotocol.io/",
        },
        {
          title: "Claude Code",
          description: "看看成熟的 Agent 如何设计工具系统",
          url: "https://docs.anthropic.com/en/docs/claude-code",
        },
      ],
    },
  ],
};
