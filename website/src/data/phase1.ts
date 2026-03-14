import type { PhaseContent } from "./types";

export const phase1Content: PhaseContent = {
  phaseId: 1,
  color: "#D97706",
  accent: "#F59E0B",
  lessons: [
    // ─── Lesson 1: Tool Registry 設計模式 ───────────────────────────
    {
      phaseId: 1,
      lessonId: 1,
      title: "Tool Registry 設計模式",
      subtitle: "Building a Scalable Tool Management System",
      type: "設計 + 實踐",
      duration: "3 hrs",
      visualization: "phase1-registry",
      objectives: [
        "理解 Registry Pattern 在 Agent 系統中的角色",
        "掌握 Tool 的完整生命週期：定義 → 驗證 → 註冊 → 發現 → 調用",
        "學會 Tool Description Engineering——寫出 LLM 容易理解的描述",
        "理解 Poka-yoke 原則：讓工具難以被錯誤使用",
        "實現帶完整驗證的 Tool 註冊與取消註冊",
        "實現 JSON Schema 格式驗證",
        "實現從目錄自動發現和加載工具模塊",
      ],
      sections: [
        {
          title: "Phase 導讀：為什麼 Tool 設計比 Prompt 更重要？",
          blocks: [
            {
              type: "callout",
              variant: "quote",
              text: "Week 3-4 · Agent-Computer Interface\n你的 Agent 已經能說話了（Phase 0），現在要讓它能動手。\nTool 系統是 Agent 與外部世界的接口——它的質量直接決定 Agent 的上限。",
            },
            {
              type: "heading",
              level: 3,
              text: "從 Phase 0 到 Phase 1",
            },
            {
              type: "paragraph",
              text: "在 Phase 0 中，你實現了 LLM Client、Tool Use Loop 和 Context Manager。但 Phase 0 的工具很原始——mock 天氣、簡單讀檔、計算器。要讓 Agent 真正有用，它需要完整的文件操作和安全的 Shell 執行能力。",
            },
            {
              type: "diagram",
              content:
                "Phase 0 的 Agent:                    Phase 1 之後:\n  「讀取 app.py」→ ✅ 可以            「讀取 app.py」→ ✅ 帶行號\n  「修改第 42 行」→ ❌ 不行            「修改第 42 行」→ ✅ 精確編輯\n  「運行測試」  → ❌ 不行             「運行測試」  → ✅ 安全 Shell\n  「搜索 TODO」 → ❌ 不行             「搜索 TODO」 → ✅ glob + 內容搜索",
            },
            {
              type: "callout",
              variant: "tip",
              text: "Anthropic 的經驗：\"We invested more time in optimizing our tools than on the overall prompt.\" —— 在 SWE-bench 評測中，改進 Tool description 比改進 System Prompt 帶來更大的準確率提升。",
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
              text: "在一個成熟的 Agent 系統中，工具不是硬編碼的，而是動態管理的。想像一下 Claude Code 啟動時的流程：",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "掃描內建工具目錄 → 註冊 Read, Write, Edit, Bash 等",
                "掃描用戶的 MCP 配置 → 註冊 MCP 工具",
                "掃描項目配置 → 根據項目類型啟用/禁用工具",
              ],
            },
            {
              type: "paragraph",
              text: "運行時，用戶輸入指令 → Agent 查詢 Registry 獲取可用工具 → 將工具定義發送給 LLM → LLM 自主選擇合適的工具。",
            },
          ],
        },
        {
          title: "Tool 的生命週期",
          blocks: [
            {
              type: "diagram",
              content:
                "定義 → 驗證 → 註冊 → 發現 → 調用 → 結果\n │       │       │      │      │      │\n │       │       │      │      │      └── ToolResult (結構化返回)\n │       │       │      │      └── handler.execute(input)\n │       │       │      └── registry.get(name)\n │       │       └── registry.register(handler)\n │       └── validate_schema(definition)\n └── ToolDefinition { name, description, input_schema }",
            },
          ],
        },
        {
          title: "Tool Description Engineering",
          blocks: [
            {
              type: "paragraph",
              text: "寫 Tool description 就像寫 API 文檔——LLM 是你的「用戶」。一個好的 description 要回答四個問題：這個工具做什麼、什麼時候該用它、輸入要什麼格式、有什麼限制。",
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
          title: "Poka-yoke 原則",
          blocks: [
            {
              type: "paragraph",
              text: "Poka-yoke（防錯設計）源自豐田生產系統。在 Tool 設計中，目標是讓工具難以被錯誤使用。",
            },
            {
              type: "table",
              headers: ["原則", "工具設計實踐", "例子"],
              rows: [
                ["物理約束", "參數類型限制", "path 必須是 string"],
                ["格式強制", "強制使用絕對路徑", "拒絕 ./src/app.py"],
                ["默認安全", "安全的默認值", "Shell 默認 timeout=30s"],
                ["清晰錯誤", "錯誤信息含修正建議", "Path must be absolute. Got: ./src"],
              ],
            },
          ],
        },
        {
          title: "Lab 1 實戰指引",
          blocks: [
            {
              type: "paragraph",
              text: "打開 phase_1/registry.py，你會看到 4 個 TODO。建議的實現順序：",
            },
            {
              type: "heading",
              level: 3,
              text: "Step 1: register() — 工具註冊",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
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
              text: "Step 2: unregister() — 取消註冊",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def unregister(self, name):
    if name not in self._handlers:
        raise KeyError(f"Tool '{name}' not found")
    del self._handlers[name]`,
            },
            {
              type: "heading",
              level: 3,
              text: "Step 3: validate_schema() — Schema 驗證",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
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
              text: "Step 4: load_from_directory() — 動態加載",
            },
            {
              type: "paragraph",
              text: "使用 importlib 從指定目錄掃描 .py 文件，查找 tool_handler 變量，自動註冊。跳過 __init__.py 和以 _ 開頭的文件。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "1.1.1",
          title: "register() — 工具註冊",
          description:
            "實現 ToolRegistry.register()，支持 5 項驗證：名稱非空、描述非空、無重複、schema type 為 object、名稱為 snake_case。",
          labFile: "phase_1/registry.py",
          hints: [
            "使用 re.match(r'^[a-z][a-z0-9_]*$', name) 驗證名稱格式",
            "存入 self._handlers[name] = handler",
          ],
        },
        {
          id: "1.1.2",
          title: "unregister() — 取消註冊",
          description: "實現 ToolRegistry.unregister()，從註冊表移除工具。不存在時拋出 KeyError。",
          labFile: "phase_1/registry.py",
          hints: ["先檢查是否存在，再 del"],
        },
        {
          id: "1.1.3",
          title: "validate_schema() — JSON Schema 驗證",
          description:
            "驗證 ToolDefinition 的 input_schema：type 必須是 object、required 字段必須在 properties 中、每個 property 必須有 type 和 description。",
          labFile: "phase_1/registry.py",
          hints: [
            "返回 errors 列表，空列表表示通過",
            "遍歷 required 和 properties 分別檢查",
          ],
        },
        {
          id: "1.1.4",
          title: "load_from_directory() — 動態加載",
          description:
            "從目錄自動掃描 .py 文件，查找 tool_handler 變量並自動註冊。跳過 __init__.py。",
          labFile: "phase_1/registry.py",
          hints: [
            "使用 importlib.util.spec_from_file_location",
            "用 try/except 跳過加載失敗的文件",
            "檢查 hasattr(module, 'tool_handler')",
          ],
        },
      ],
      acceptanceCriteria: [
        "register() 通過 5 項驗證檢查",
        "重複註冊同名工具時拋出 ValueError",
        "不合法的名稱格式（如 CamelCase）被拒絕",
        "unregister() 不存在的工具時拋出 KeyError",
        "validate_schema() 能檢測出缺少 type/description 的 property",
        "load_from_directory() 能從目錄自動加載工具",
        "所有 test_lab1_registry.py 測試通過",
      ],
      references: [
        {
          title: "Building Effective Agents §Appendix 2",
          description: "Anthropic 的 Tool 設計方法論，包含 Description Engineering 的最佳實踐",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Anthropic Tool Use 文檔",
          description: "Tool Use 的完整 API 文檔和示例",
          url: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use",
        },
        {
          title: "JSON Schema 規範",
          description: "理解 input_schema 的格式標準",
          url: "https://json-schema.org/understanding-json-schema/",
        },
        {
          title: "Poka-yoke (Wikipedia)",
          description: "防錯設計原則的起源與應用",
          url: "https://en.wikipedia.org/wiki/Poka-yoke",
        },
      ],
    },

    // ─── Lesson 2: 文件系統工具套件 ───────────────────────────────
    {
      phaseId: 1,
      lessonId: 2,
      title: "文件系統工具套件",
      subtitle: "Building File System Tools for Your Agent",
      type: "概念 + 實踐",
      duration: "3 hrs",
      objectives: [
        "理解文件工具在 Agent 中的核心地位（80%+ 的工具調用）",
        "掌握絕對路徑的重要性——Anthropic SWE-bench 的血淚教訓",
        "理解路徑穿越攻擊及其防護方法",
        "掌握 edit_file 使用搜索替換而非行號的設計哲學",
        "實現帶行號的文件讀取工具",
        "實現安全的文件寫入工具（自動創建目錄）",
        "實現目錄列出、文件搜索和精確編輯工具",
      ],
      sections: [
        {
          title: "為什麼文件工具是 Agent 最重要的工具",
          blocks: [
            {
              type: "paragraph",
              text: "一個 coding agent 80% 以上的工具調用都是文件操作。在典型的 bug 修復任務中，read_file 佔 48%，edit_file 佔 28%，run_command 只佔 12%。",
            },
            {
              type: "diagram",
              content:
                "典型 bug 修復任務的工具調用分佈：\n\n  read_file      ████████████████████████  48%\n  edit_file      ██████████████            28%\n  run_command    ██████                    12%\n  search_files   ████                       8%\n  write_file     ██                         4%",
            },
          ],
        },
        {
          title: "路徑安全：Anthropic 的血淚教訓",
          blocks: [
            {
              type: "callout",
              variant: "warning",
              text: "始終使用絕對路徑。Anthropic 在 SWE-bench 中發現，Agent 移出根目錄後使用相對路徑會導致大量錯誤。改為強制要求絕對路徑後，問題完全消失。",
            },
            {
              type: "code",
              language: "python",
              code: `# ❌ 使用相對路徑的 Agent:
1. cd tests/         → 進入 tests 目錄
2. read test_utils.py → OK
3. cd ../src/        → 進入 src 目錄
4. read utils.py     → OK
5. cd ../tests/      → 期望回到 tests
6. read test_utils.py → ❌ 路徑計算錯誤！Agent 迷路了

# ✅ 使用絕對路徑的 Agent:
1. read /repo/tests/test_utils.py → OK
2. read /repo/src/utils.py        → OK
3. edit /repo/src/utils.py        → OK
4. read /repo/tests/test_utils.py → OK  # 永遠不會迷路`,
            },
          ],
        },
        {
          title: "路徑穿越攻擊防護",
          blocks: [
            {
              type: "paragraph",
              text: "如果你的 Agent 是一個服務，惡意用戶可能嘗試用 ../ 逃出沙箱目錄。正確做法是使用 Path.resolve() + relative_to() 來驗證。",
            },
            {
              type: "code",
              language: "python",
              code: `# 路徑穿越防護
path = Path("/workspace/../../../../etc/passwd").resolve()
# = /etc/passwd

sandbox = Path("/workspace").resolve()
path.relative_to(sandbox)  # → 拋出 ValueError！`,
            },
          ],
        },
        {
          title: "edit_file 的設計哲學",
          blocks: [
            {
              type: "paragraph",
              text: "為什麼用「搜索替換」而不是「行號替換」？因為行號在讀取和編輯之間可能會變化（文件被其他進程修改）。搜索替換不依賴行號，更加穩健。Claude Code 的 Edit 工具就是使用這種模式。",
            },
            {
              type: "callout",
              variant: "info",
              text: "如果搜索字串出現多次（歧義），要求 LLM 提供更多上下文使其唯一。這比猜測替換哪一個要安全得多。",
            },
          ],
        },
        {
          title: "Lab 2 實戰指引",
          blocks: [
            {
              type: "paragraph",
              text: "打開 phase_1/file_tools.py，你會看到 5 個 TODO。所有方法都遵循相同的模式：先調用 _validate_path() 驗證路徑安全性，然後執行操作，最後返回 ToolResult。",
            },
            {
              type: "heading",
              level: 3,
              text: "Step 1: read_file() — 帶行號的文件讀取",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
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
              text: "每個方法的偽代碼都在 COURSE.md 和源文件的 HINT 註釋中。記住：所有路徑操作先 validate，所有異常都捕獲並返回 ToolResult。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "1.2.1",
          title: "read_file() — 文件讀取",
          description:
            "讀取文件內容，返回帶行號的格式。支持 offset（從第幾行開始）和 limit（讀幾行）。",
          labFile: "phase_1/file_tools.py",
          hints: [
            "先 _validate_path(path)，捕獲 ValueError/PermissionError",
            "行號格式: f\"{i:>4} | {line}\"",
            "offset 是 1-indexed",
          ],
        },
        {
          id: "1.2.2",
          title: "write_file() — 文件寫入",
          description: "寫入文件內容，支持覆蓋和追加模式。config.create_dirs 為 True 時自動創建父目錄。",
          labFile: "phase_1/file_tools.py",
          hints: [
            "根據 append 選擇 'a' 或 'w' 模式",
            "Path.parent.mkdir(parents=True, exist_ok=True)",
          ],
        },
        {
          id: "1.2.3",
          title: "list_directory() — 目錄列出",
          description: "列出目錄內容。遞歸模式用 rglob，目錄結尾加 /。支持 glob 過濾。",
          labFile: "phase_1/file_tools.py",
          hints: [
            "recursive 用 rglob，否則用 glob",
            "item.relative_to(path) 獲取相對路徑",
          ],
        },
        {
          id: "1.2.4",
          title: "search_files() — 文件搜索",
          description: "搜索文件（glob 匹配 + 可選的內容搜索）。內容匹配時顯示行號。",
          labFile: "phase_1/file_tools.py",
          hints: [
            "用 try/except 跳過二進制文件（UnicodeDecodeError）",
            "格式: f\"{file_path}:{line_no}: {line.strip()}\"",
          ],
        },
        {
          id: "1.2.5",
          title: "edit_file() — 精確編輯",
          description:
            "搜索替換模式。old_string 必須唯一匹配：0 次 → 報錯；>1 次 → 報歧義；1 次 → 替換。",
          labFile: "phase_1/file_tools.py",
          hints: [
            "content.count(old_string) 計算出現次數",
            "content.replace(old_string, new_string, 1) 替換",
          ],
        },
      ],
      acceptanceCriteria: [
        "read_file 返回帶行號的內容",
        "read_file 支持 offset 和 limit 範圍讀取",
        "write_file 支持覆蓋和追加模式",
        "write_file 自動創建不存在的父目錄",
        "list_directory 支持遞歸和 glob 過濾",
        "search_files 支持文件名和內容搜索",
        "edit_file 拒絕歧義替換（>1 匹配）",
        "所有路徑操作使用絕對路徑",
        "沙箱外的路徑被安全攔截",
        "所有 test_lab2_file_tools.py 測試通過",
      ],
      references: [
        {
          title: "SWE-bench",
          description: "理解 Agent 在真實編程任務上的評測方法",
          url: "https://www.swebench.com/",
        },
        {
          title: "Python pathlib 文檔",
          description: "Path 類的完整 API",
          url: "https://docs.python.org/3/library/pathlib.html",
        },
        {
          title: "Building Effective Agents",
          description: "絕對路徑的設計決策來源",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
      ],
    },

    // ─── Lesson 3: Shell 執行器與沙箱 ─────────────────────────────
    {
      phaseId: 1,
      lessonId: 3,
      title: "Shell 執行器與沙箱",
      subtitle: "Safe Command Execution for Agents",
      type: "概念 + 實踐",
      duration: "2 hrs",
      objectives: [
        "理解 Shell 工具在 Agent 中的角色（驗證修改、運行測試）",
        "掌握 Shell 安全三角：安全性（黑名單）、可靠性（超時）、可用性（截斷）",
        "理解命令注入攻擊的風險及防範方法",
        "實現命令黑名單檢測",
        "實現帶超時和輸出截斷的命令執行",
        "實現 LLM 友好的結果格式化",
      ],
      sections: [
        {
          title: "為什麼需要 Shell 工具",
          blocks: [
            {
              type: "paragraph",
              text: "文件工具讓 Agent 能看和寫，Shell 工具讓 Agent 能驗證。沒有 Shell 工具，Agent 就是一個只會寫代碼但不會測試的初級開發者。",
            },
            {
              type: "code",
              language: "python",
              code: `# 典型工作流：
# 1. read_file → 理解代碼
# 2. edit_file → 修改代碼
# 3. run_command("python -m pytest tests/") → 驗證修改
# 4. 如果測試失敗 → 讀取錯誤 → 再次修改 → 再次測試`,
            },
          ],
        },
        {
          title: "Shell 工具的安全三角",
          blocks: [
            {
              type: "diagram",
              content:
                "                ┌──────────────┐\n                │   安全性      │\n                │  (黑名單)     │\n                └──────┬───────┘\n                       │\n          ┌────────────┼────────────┐\n          │            │            │\n    ┌─────┴──────┐           ┌─────┴──────┐\n    │  可靠性     │           │  可用性     │\n    │ (超時控制)  │           │ (輸出截斷)  │\n    └────────────┘           └────────────┘",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "安全性：命令黑名單防止 rm -rf /、sudo 等危險命令",
                "可靠性：超時控制防止 sleep infinity、死循環等",
                "可用性：輸出截斷防止 cat huge_file.log 撐爆記憶體",
              ],
            },
          ],
        },
        {
          title: "結構化輸出",
          blocks: [
            {
              type: "paragraph",
              text: "LLM 需要的不只是原始輸出，還需要上下文。比較兩種返回方式：",
            },
            {
              type: "code",
              language: "python",
              code: `# ❌ 只返回 stderr:
"ModuleNotFoundError: No module named 'flask'"

# ✅ 結構化返回:
"Command failed (exit code 1).\\n"
"stdout:\\n  (empty)\\n"
"stderr:\\n  Traceback (most recent call last):\\n"
"    File \\"app.py\\", line 1, in <module>\\n"
"      from flask import Flask\\n"
"  ModuleNotFoundError: No module named 'flask'"

# LLM 看到完整上下文 → 決定: pip install flask`,
            },
          ],
        },
        {
          title: "Lab 3 實戰指引",
          blocks: [
            {
              type: "paragraph",
              text: "打開 phase_1/shell_tools.py，你會看到 4 個 TODO。",
            },
            {
              type: "heading",
              level: 3,
              text: "Step 1: is_command_blocked()",
            },
            {
              type: "paragraph",
              text: "遍歷 config.blocked_commands，用子字串匹配檢測。如果任何 pattern 出現在 command 中，返回 (True, reason)。",
            },
            {
              type: "heading",
              level: 3,
              text: "Step 2: execute()",
            },
            {
              type: "paragraph",
              text: "核心方法。先檢查黑名單 → 構建環境變量 → subprocess.run() → 截斷輸出。捕獲 TimeoutExpired 設置 timed_out=True。",
            },
            {
              type: "heading",
              level: 3,
              text: "Step 3-4: format_result() 和 run()",
            },
            {
              type: "paragraph",
              text: "format_result 根據 timed_out / exit_code 決定返回格式。run() 是 execute() + format_result() 的便捷組合。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "1.3.1",
          title: "is_command_blocked() — 黑名單檢測",
          description: "遍歷 blocked_commands，子字串匹配。返回 (bool, reason)。",
          labFile: "phase_1/shell_tools.py",
          hints: [
            "command.strip() 去除空白",
            "pattern in command 做子字串匹配",
          ],
        },
        {
          id: "1.3.2",
          title: "execute() — 命令執行",
          description:
            "安全執行命令：黑名單 → 環境變量合併 → subprocess.run → 輸出截斷 → 超時處理。",
          labFile: "phase_1/shell_tools.py",
          hints: [
            "subprocess.run(command, shell=True, capture_output=True, text=True, timeout=...)",
            "捕獲 subprocess.TimeoutExpired 設置 timed_out=True",
            "輸出超過 max_output_bytes 時截斷並附加提示",
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
          title: "format_result() — 結果格式化",
          description: "將 ShellResult 格式化為 LLM 友好的 ToolResult。區分成功、失敗、超時。",
          labFile: "phase_1/shell_tools.py",
          hints: [
            "timed_out → is_error=True",
            "exit_code != 0 → is_error=True，包含 stdout + stderr",
          ],
        },
        {
          id: "1.3.4",
          title: "run() — 便捷組合",
          description: "execute() + format_result() 的組合方法。",
          labFile: "phase_1/shell_tools.py",
          hints: ["直接調用 self.execute() 然後 self.format_result()"],
        },
      ],
      acceptanceCriteria: [
        "rm -rf / 和 sudo rm 被攔截",
        "安全命令（echo hello）不被攔截",
        "命令超時返回 timed_out=True",
        "長輸出被截斷",
        "exit_code 正確捕獲",
        "stderr 正確捕獲",
        "format_result 區分成功/失敗/超時",
        "所有 test_lab3_shell_tools.py 測試通過",
      ],
      references: [
        {
          title: "Python subprocess 文檔",
          description: "安全的命令執行 API",
          url: "https://docs.python.org/3/library/subprocess.html",
        },
        {
          title: "OWASP Command Injection",
          description: "命令注入攻擊的防範指南",
          url: "https://owasp.org/www-community/attacks/Command_Injection",
        },
        {
          title: "Building Effective Agents",
          description: "Agent 安全設計的整體框架",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
      ],
    },

    // ─── Lesson 4: 整合與回顧 ────────────────────────────────────
    {
      phaseId: 1,
      lessonId: 4,
      title: "整合與回顧",
      subtitle: "Integration & Phase 2 Preview",
      type: "項目實踐",
      duration: "2 hrs",
      objectives: [
        "將 Registry、File Tools、Shell Executor 整合運行",
        "驗證所有測試通過",
        "理解 Phase 1 在整體架構中的位置",
        "預覽 Phase 2 的 Workflow 模式",
      ],
      sections: [
        {
          title: "啟動你的 Tool System",
          blocks: [
            {
              type: "paragraph",
              text: "當 Lab 1-3 的測試全部通過後，你可以運行 demo：",
            },
            {
              type: "code",
              language: "bash",
              code: `# 查看成績
python scripts/grade.py

# 運行 demo
python -m phase_1.demo`,
            },
          ],
        },
        {
          title: "你在這個 Phase 學到了什麼",
          blocks: [
            {
              type: "table",
              headers: ["概念", "你學到的", "為什麼重要"],
              rows: [
                ["Registry Pattern", "動態工具管理、驗證、發現", "Agent 工具需要可擴展"],
                ["Description Engineering", "LLM 友好的工具描述", "好描述 = 更準確的調用"],
                ["Poka-yoke", "讓工具難以被錯誤使用", "預防 > 修復"],
                ["絕對路徑", "避免相對路徑陷阱", "SWE-bench 核心教訓"],
                ["Sandbox", "路徑穿越防護", "安全邊界"],
                ["Shell 安全", "黑名單、超時、輸出限制", "安全地執行命令"],
                ["結構化結果", "LLM 友好的輸出格式", "Agent 需要理解反饋"],
              ],
            },
          ],
        },
        {
          title: "你構建了什麼",
          blocks: [
            {
              type: "diagram",
              content:
                "┌────────────────────────────────────────────────┐\n│  my-agent-tools                                │\n│                                                │\n│  ┌────────────────────┐  ┌──────────────────┐  │\n│  │   Tool Registry    │  │  File Tools      │  │\n│  │  · register        │  │  · read_file     │  │\n│  │  · unregister      │  │  · write_file    │  │\n│  │  · validate_schema │  │  · list_directory│  │\n│  │  · load_from_dir   │  │  · search_files  │  │\n│  │                    │  │  · edit_file     │  │\n│  └────────────────────┘  └──────────────────┘  │\n│                                                │\n│  ┌────────────────────────────────────────┐     │\n│  │       Shell Executor                  │     │\n│  │  · is_command_blocked                 │     │\n│  │  · execute (timeout + truncation)     │     │\n│  │  · format_result                      │     │\n│  │  · run (execute + format)             │     │\n│  └────────────────────────────────────────┘     │\n└────────────────────────────────────────────────┘",
            },
          ],
        },
        {
          title: "下一步：Phase 2 預告",
          blocks: [
            {
              type: "paragraph",
              text: "你的 Agent 現在有了手（File Tools）和腳（Shell Executor）。但它的行為模式還是「收到指令 → 調用一個工具 → 返回結果」的簡單模式。",
            },
            {
              type: "paragraph",
              text: "在 Phase 2 中，你將學會兩種工作流模式：Prompt Chaining（把複雜任務分解為多步，每步之間有程序化的質量檢查）和 Routing（根據用戶意圖自動路由到不同的處理器）。你的 Agent 將從「一招鮮」進化為「見招拆招」。",
            },
          ],
        },
      ],
      exercises: [],
      acceptanceCriteria: [
        "python scripts/grade.py 顯示所有測試通過",
        "python -m phase_1.demo 正常運行",
        "Tool Registry 能註冊和查詢工具",
        "File Tools 能讀寫搜索編輯文件",
        "Shell Executor 能安全執行命令",
        "危險命令被攔截，沙箱外路徑被拒絕",
      ],
      references: [
        {
          title: "Building Effective Agents",
          description: "完整的 Agent 設計方法論",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Model Context Protocol",
          description: "MCP 規範，理解工具的未來生態",
          url: "https://modelcontextprotocol.io/",
        },
        {
          title: "Claude Code",
          description: "看看成熟的 Agent 如何設計工具系統",
          url: "https://docs.anthropic.com/en/docs/claude-code",
        },
      ],
    },
  ],
};
