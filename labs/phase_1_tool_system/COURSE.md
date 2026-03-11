# Phase 1 — 骨架：Tool 系統與 ACI 設計

> **Week 3-4 · Agent-Computer Interface**
> 你的 Agent 已經能說話了（Phase 0），現在要讓它能動手。
> Tool 系統是 Agent 與外部世界的接口——它的質量直接決定 Agent 的上限。

---

## 1.0 Phase 導讀：為什麼 Tool 設計比 Prompt 更重要？

### 從 Phase 0 到 Phase 1

在 Phase 0 中，你實現了：
- LLM Client（與 API 通信）
- Tool Use Loop（LLM ↔ Tool 循環）
- Context Manager（記憶管理）

但 Phase 0 的工具很原始——mock 天氣、簡單的文件讀取、計算器。要讓 Agent 真正有用，它需要：

```
Phase 0 的 Agent:
  "幫我查天氣" → ✅ 可以（mock 數據）
  "讀取 app.py" → ✅ 可以（但只能讀，不能寫）
  "修改第 42 行" → ❌ 不行
  "運行測試" → ❌ 不行
  "搜索所有 TODO" → ❌ 不行

Phase 1 之後:
  "讀取 app.py" → ✅ 帶行號、範圍讀取
  "修改第 42 行" → ✅ 精確編輯（搜索替換）
  "運行測試" → ✅ 安全的 Shell 執行
  "搜索所有 TODO" → ✅ glob + 內容搜索
  "創建新文件" → ✅ 自動創建目錄
```

### Anthropic 的經驗：Tool 設計的投資回報率最高

> "We invested more time in optimizing our tools than on the overall prompt."
> — Anthropic, Building Effective Agents

在 SWE-bench 評測中，Anthropic 發現：
1. **改進 Tool description** 比改進 System Prompt 帶來更大的準確率提升
2. **強制絕對路徑** 一個改動就消除了一整類 bug
3. **讓 Tool 難以被錯誤使用**（Poka-yoke）比教 LLM 正確使用更有效

### 本 Phase 的三大交付物

```
┌─────────────────────────────────────────────────┐
│              Tool System (Phase 1)               │
│                                                   │
│  ┌───────────────┐  ┌───────────────────────┐    │
│  │ Tool Registry │  │    File Tools         │    │
│  │               │  │                       │    │
│  │ · register    │  │ · read_file          │    │
│  │ · unregister  │  │ · write_file         │    │
│  │ · validate    │  │ · list_directory     │    │
│  │ · discover    │  │ · search_files       │    │
│  │               │  │ · edit_file          │    │
│  └───────────────┘  └───────────────────────┘    │
│                                                   │
│  ┌───────────────────────────────────────────┐    │
│  │         Shell Executor                    │    │
│  │                                           │    │
│  │ · execute (timeout + output truncation)   │    │
│  │ · blocked command detection               │    │
│  │ · structured result formatting            │    │
│  └───────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## 1.1 概念課：Tool Registry 設計模式

### Registry Pattern 在 Agent 中的角色

在一個成熟的 Agent 系統中，工具不是硬編碼的，而是**動態管理**的。想像一下 Claude Code：

```
啟動時:
  → 掃描內建工具目錄 → 註冊 Read, Write, Edit, Bash, ...
  → 掃描用戶的 MCP 配置 → 註冊 MCP 工具
  → 掃描項目配置 → 根據項目類型啟用/禁用工具

運行時:
  → 用戶輸入 "幫我寫測試"
  → Agent 查詢 Registry → 找到 read_file, write_file, run_command
  → 發送工具定義給 LLM → LLM 自主選擇
```

### Tool 的生命週期

```
定義 → 驗證 → 註冊 → 發現 → 調用 → 結果
 │       │       │      │      │      │
 │       │       │      │      │      └── ToolResult (結構化返回)
 │       │       │      │      └── handler.execute(input)
 │       │       │      └── registry.get(name)
 │       │       └── registry.register(handler)
 │       └── validate_schema(definition)
 └── ToolDefinition { name, description, input_schema }
```

### Tool Description Engineering

寫 Tool description 就像寫 API 文檔——LLM 是你的「用戶」。一個好的 description 要回答：

1. **這個工具做什麼**（用途）
2. **什麼時候該用它**（場景）
3. **輸入要什麼格式**（帶示例）
4. **有什麼限制**（邊界情況）

看兩個版本的對比：

```python
# ❌ 差的 description
"Read a file."

# ✅ 好的 description
"Read the contents of a file at the given absolute path. "
"Returns the file contents as a string with line numbers. "
"Use this to examine source code, configuration files, "
"or any text file. "
"The path must be absolute (e.g. /home/user/project/src/main.py). "
"For large files, use offset and limit to read specific sections."
```

### Poka-yoke 原則

Poka-yoke（防錯設計）源自豐田生產系統。在 Tool 設計中的應用：

| 原則 | 工具設計中的實踐 | 例子 |
|------|-----------------|------|
| 物理約束 | 參數類型限制 | `path` 必須是 string，不能是 array |
| 格式強制 | 強制使用絕對路徑 | 拒絕 `./src/app.py`，要求 `/home/user/src/app.py` |
| 默認安全 | 有安全的默認值 | Shell 默認 timeout=30s，不需要顯式設置 |
| 清晰錯誤 | 錯誤信息包含修正建議 | "Path must be absolute. Got: ./src. Try: /home/user/src" |

---

## Lab 1：Tool Registry

### 學習目標

實現一個完整的 Tool Registry，支持：
- 帶驗證的工具註冊與取消註冊
- JSON Schema 格式驗證
- 從目錄自動發現和加載工具模塊

### 前置知識

確保你理解以下概念：
- Python 的 `dataclass` 和 `field`
- 正則表達式基礎（`re.match`）
- `importlib` 動態模塊加載
- `pathlib.Path` 的常用方法

### Lab 1 實戰指引

打開 `phase_1/registry.py`，你會看到 4 個 TODO。建議的實現順序：

#### Step 1: `register()` — 工具註冊

最核心的方法。你需要做 5 個驗證：

```
偽代碼:
1. name = handler.definition.name
2. if name 為空 → raise ValueError("Tool name cannot be empty")
3. if description 為空 → raise ValueError("Tool description cannot be empty")
4. if name 已存在於 self._handlers → raise ValueError(f"Tool '{name}' already registered")
5. if input_schema.type != "object" → raise ValueError("input_schema.type must be 'object'")
6. if name 不匹配 r'^[a-z][a-z0-9_]*$' → raise ValueError("Tool name must be snake_case")
7. self._handlers[name] = handler
```

#### Step 2: `unregister()` — 工具取消註冊

```
偽代碼:
1. if name 不在 self._handlers → raise KeyError(f"Tool '{name}' not found")
2. del self._handlers[name]
```

#### Step 3: `validate_schema()` — JSON Schema 驗證

```
偽代碼:
errors = []

1. if definition.input_schema.type != "object":
     errors.append("input_schema.type must be 'object'")

2. for field_name in definition.input_schema.required:
     if field_name not in definition.input_schema.properties:
       errors.append(f"Required field '{field_name}' not in properties")

3. for prop_name, prop_schema in definition.input_schema.properties.items():
     if "type" not in prop_schema:
       errors.append(f"Property '{prop_name}' missing 'type'")
     if "description" not in prop_schema:
       errors.append(f"Property '{prop_name}' missing 'description'")

return errors
```

#### Step 4: `load_from_directory()` — 動態加載

```
偽代碼:
directory = Path(directory)
loaded = 0

for py_file in directory.glob("*.py"):
    if py_file.name.startswith("_"):
        continue  # 跳過 __init__.py 等

    try:
        spec = importlib.util.spec_from_file_location(
            py_file.stem, str(py_file)
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        if hasattr(module, "tool_handler"):
            handler = module.tool_handler
            if isinstance(handler, ToolHandler):
                self.register(handler)
                loaded += 1
    except Exception:
        continue  # 跳過加載失敗的文件

return loaded
```

### 測試你的實現

```bash
pytest tests/test_lab1_registry.py -v
```

---

## 1.2 概念課：文件系統工具——Agent 的手和眼

### 為什麼文件工具是 Agent 最重要的工具

一個 coding agent 80% 以上的工具調用都是文件操作。看看 Claude Code 的工具調用統計：

```
典型的 bug 修復任務中的工具調用分佈：

  read_file      ████████████████████████  48%
  edit_file      ██████████████            28%
  run_command    ██████                    12%
  search_files   ████                       8%
  write_file     ██                         4%
```

### 路徑安全：Anthropic 的血淚教訓

Anthropic 在 SWE-bench 上的真實案例：

```
Agent 任務: "修復 tests/test_utils.py 中的 bug"

❌ 使用相對路徑的 Agent:
  1. cd tests/         → 進入 tests 目錄
  2. read test_utils.py → OK
  3. cd ../src/        → 進入 src 目錄
  4. edit utils.py     → OK
  5. cd ../tests/      → 期望回到 tests
  6. read test_utils.py → ❌ 路徑計算錯誤！
                          Agent 迷路了

✅ 使用絕對路徑的 Agent:
  1. read /repo/tests/test_utils.py → OK
  2. read /repo/src/utils.py        → OK
  3. edit /repo/src/utils.py        → OK
  4. read /repo/tests/test_utils.py → OK
     永遠不會迷路
```

### 路徑穿越攻擊防護

如果你的 Agent 是一個服務，惡意用戶可能嘗試：

```
用戶: "幫我讀取 ../../../../etc/passwd"

如果你只是拼接路徑:
  base = "/home/agent/workspace"
  path = base + "/../../../../etc/passwd"
  resolved = "/etc/passwd"  ← 逃出了 sandbox！

正確做法:
  path = Path("/home/agent/workspace/../../../../etc/passwd").resolve()
  # = /etc/passwd
  sandbox = Path("/home/agent/workspace").resolve()
  path.relative_to(sandbox)  # → 拋出 ValueError！
```

### edit_file 的設計哲學

為什麼用「搜索替換」而不是「行號替換」？

```
❌ 行號替換的問題:
  1. LLM 讀取文件時是第 42 行
  2. 讀取和編輯之間，文件被其他進程修改了
  3. 原來的第 42 行現在是第 45 行
  4. 替換了錯誤的行！

✅ 搜索替換的優勢:
  1. LLM 看到 "def old_function():"
  2. 搜索這個字串 → 找到唯一匹配
  3. 替換為 "def new_function():"
  4. 不依賴行號，更加穩健
```

Claude Code 的 Edit 工具就是使用搜索替換模式。如果搜索字串出現多次，要求 LLM 提供更多上下文使其唯一。

---

## Lab 2：文件系統工具套件

### 學習目標

實現 Agent 操作文件系統的 5 個核心工具：
- `read_file` — 帶行號的文件讀取
- `write_file` — 安全的文件寫入
- `list_directory` — 目錄內容列出
- `search_files` — glob + 內容搜索
- `edit_file` — 基於搜索替換的精確編輯

### Lab 2 實戰指引

打開 `phase_1/file_tools.py`，你會看到 5 個 TODO。建議順序：

#### Step 1: `read_file()` — 文件讀取

```
偽代碼:
try:
    self._validate_path(path)  # 驗證路徑安全性

    p = Path(path)
    if not p.is_file():
        return ToolResult(content=f"File not found: {path}", is_error=True)

    if p.stat().st_size > self.config.max_file_size:
        return ToolResult(content=f"File too large: {size} bytes", is_error=True)

    content = p.read_text(encoding="utf-8")
    lines = content.splitlines()

    # 處理 offset 和 limit
    if offset > 0:
        lines = lines[offset - 1:]  # offset 是 1-indexed
        start_line = offset
    else:
        start_line = 1

    if limit > 0:
        lines = lines[:limit]

    # 添加行號
    formatted = []
    for i, line in enumerate(lines, start=start_line):
        formatted.append(f"{i:>4} | {line}")

    return ToolResult(content="\n".join(formatted))

except (ValueError, PermissionError) as e:
    return ToolResult(content=str(e), is_error=True)
except Exception as e:
    return ToolResult(content=f"Error reading file: {e}", is_error=True)
```

#### Step 2: `write_file()` — 文件寫入

```
偽代碼:
try:
    self._validate_path(path)

    p = Path(path)
    if self.config.create_dirs:
        p.parent.mkdir(parents=True, exist_ok=True)

    mode = "a" if append else "w"
    with open(path, mode, encoding="utf-8") as f:
        f.write(content)

    return ToolResult(content=f"Successfully wrote {len(content)} bytes to {path}")

except (ValueError, PermissionError) as e:
    return ToolResult(content=str(e), is_error=True)
```

#### Step 3: `list_directory()` — 目錄列出

```
偽代碼:
try:
    self._validate_path(path)

    p = Path(path)
    if not p.is_dir():
        return ToolResult(content=f"Not a directory: {path}", is_error=True)

    if recursive:
        items = sorted(p.rglob(pattern))
    else:
        items = sorted(p.glob(pattern))

    entries = []
    for item in items:
        rel = item.relative_to(p)
        if item.is_dir():
            entries.append(f"{rel}/")
        else:
            entries.append(str(rel))

    return ToolResult(content="\n".join(entries))
except ...
```

#### Step 4: `search_files()` — 文件搜索

```
偽代碼:
try:
    self._validate_path(path)
    p = Path(path)

    matches = []
    for file_path in sorted(p.glob(pattern)):
        if not file_path.is_file():
            continue

        if not content_match:
            matches.append(str(file_path))
        else:
            try:
                text = file_path.read_text(encoding="utf-8")
                for line_no, line in enumerate(text.splitlines(), 1):
                    if content_match in line:
                        matches.append(f"{file_path}:{line_no}: {line.strip()}")
            except (UnicodeDecodeError, PermissionError):
                continue  # 跳過二進制/不可讀文件

    return ToolResult(content="\n".join(matches) if matches else "No matches found.")
except ...
```

#### Step 5: `edit_file()` — 精確編輯

```
偽代碼:
try:
    self._validate_path(path)

    content = Path(path).read_text(encoding="utf-8")
    count = content.count(old_string)

    if count == 0:
        return ToolResult(
            content=f"old_string not found in {path}",
            is_error=True
        )

    if count > 1:
        return ToolResult(
            content=f"old_string is ambiguous ({count} matches). "
                    "Provide more context to make it unique.",
            is_error=True
        )

    new_content = content.replace(old_string, new_string, 1)
    Path(path).write_text(new_content, encoding="utf-8")

    return ToolResult(
        content=f"Successfully edited {path}\n"
                f"Replaced:\n  {old_string!r}\n"
                f"With:\n  {new_string!r}"
    )
except ...
```

### 測試你的實現

```bash
pytest tests/test_lab2_file_tools.py -v
```

---

## 1.3 概念課：Shell 執行器——給 Agent 裝上腿

### 為什麼需要 Shell 工具

文件工具讓 Agent 能看和寫，Shell 工具讓 Agent 能**驗證**：

```
典型工作流:
  1. read_file → 理解代碼
  2. edit_file → 修改代碼
  3. run_command("python -m pytest tests/") → 驗證修改
  4. 如果測試失敗 → 讀取錯誤 → 再次修改 → 再次測試
```

沒有 Shell 工具，Agent 就是一個只會寫代碼但不會測試的初級開發者。

### Shell 工具的安全三角

```
                    ┌──────────────┐
                    │   安全性      │
                    │  (黑名單)     │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴──────┐           ┌─────┴──────┐
        │  可靠性     │           │  可用性     │
        │ (超時控制)  │           │ (輸出截斷)  │
        └────────────┘           └────────────┘
```

1. **安全性**：命令黑名單防止 `rm -rf /`、`sudo` 等危險命令
2. **可靠性**：超時控制防止 `sleep infinity`、死循環等
3. **可用性**：輸出截斷防止 `cat huge_file.log` 撐爆記憶體

### 命令注入防範

```
❌ 危險的實現:
  def execute(command, filename):
      os.system(f"cat {filename}")
      # 如果 filename = "; rm -rf /"  → 災難！

✅ 正確的實現:
  使用 subprocess.run() 而不是 os.system()
  shell=True 時命令由 shell 解析
  通過黑名單匹配而非白名單（更靈活）
```

### 結構化輸出

LLM 需要的不只是原始輸出，還需要**上下文**：

```
❌ 只返回 stderr:
  "ModuleNotFoundError: No module named 'flask'"

✅ 結構化返回:
  "Command failed (exit code 1).
   stdout:
     (empty)
   stderr:
     Traceback (most recent call last):
       File "app.py", line 1, in <module>
         from flask import Flask
     ModuleNotFoundError: No module named 'flask'"

LLM 看到完整的上下文後，能決定: "需要安裝 flask → pip install flask"
```

---

## Lab 3：Shell 執行器與沙箱

### 學習目標

實現安全的命令行執行工具：
- 命令黑名單檢測
- 帶超時的命令執行
- 輸出截斷
- 結構化的結果格式化

### 前置知識

確保你理解以下概念：
- `subprocess.run()` 的使用
- `subprocess.TimeoutExpired` 異常
- `os.environ` 環境變量
- `try/except` 多異常處理

### Lab 3 實戰指引

打開 `phase_1/shell_tools.py`，你會看到 4 個 TODO。

#### Step 1: `is_command_blocked()` — 黑名單檢測

```
偽代碼:
command = command.strip()

for pattern in self.config.blocked_commands:
    if pattern in command:
        return (True, f"Command blocked: '{pattern}' detected in command")

return (False, "")
```

#### Step 2: `execute()` — 命令執行

```
偽代碼:
# 1. 黑名單檢查
blocked, reason = self.is_command_blocked(command)
if blocked:
    return ShellResult(stderr=reason, exit_code=1)

# 2. 驗證 cwd
if cwd and not Path(cwd).is_dir():
    return ShellResult(stderr=f"Working directory not found: {cwd}", exit_code=1)

# 3. 構建環境變量
merged_env = dict(os.environ)
if env:
    merged_env.update(env)
merged_env.update(self.config.env_overrides)

# 4. 執行命令
try:
    result = subprocess.run(
        command,
        shell=True,
        capture_output=True,
        text=True,
        timeout=self.config.timeout_seconds,
        cwd=cwd,
        env=merged_env,
    )

    stdout = result.stdout
    stderr = result.stderr

    # 5. 截斷輸出
    max_bytes = self.config.max_output_bytes
    if len(stdout) > max_bytes:
        stdout = stdout[:max_bytes] + "\n... [output truncated]"
    if len(stderr) > max_bytes:
        stderr = stderr[:max_bytes] + "\n... [output truncated]"

    return ShellResult(
        stdout=stdout,
        stderr=stderr,
        exit_code=result.returncode,
    )

except subprocess.TimeoutExpired as e:
    return ShellResult(
        stdout=e.stdout or "" if hasattr(e, 'stdout') and e.stdout else "",
        stderr=f"Command timed out after {self.config.timeout_seconds}s",
        exit_code=124,
        timed_out=True,
    )
except Exception as e:
    return ShellResult(stderr=str(e), exit_code=1)
```

#### Step 3: `format_result()` — 結果格式化

```
偽代碼:
if result.timed_out:
    return ToolResult(
        content=f"Command timed out after {self.config.timeout_seconds}s.\n"
                f"Partial stdout:\n{result.stdout}",
        is_error=True,
    )

if result.exit_code != 0:
    return ToolResult(
        content=f"Command failed (exit code {result.exit_code}).\n"
                f"stdout:\n{result.stdout}\n"
                f"stderr:\n{result.stderr}",
        is_error=True,
    )

return ToolResult(content=result.stdout)
```

#### Step 4: `run()` — 便捷組合

```
偽代碼:
result = self.execute(command, cwd=cwd, env=env)
return self.format_result(result)
```

### 測試你的實現

```bash
pytest tests/test_lab3_shell_tools.py -v
```

---

## 1.4 整合：試用你的 Tool System

當 Lab 1-3 的測試全部通過後，你可以運行 demo：

```bash
python -m phase_1.demo
```

### 試試這些

1. **Tool Registry**：
   觀察工具如何被註冊、驗證和查詢。

2. **文件操作**：
   觀察文件的讀寫和路徑安全機制。

3. **Shell 執行**：
   觀察安全命令的執行和危險命令的攔截。

### 查看成績

```bash
python scripts/grade.py
```

你應該看到類似這樣的輸出：

```
╔══════════════════════════════════════════════════╗
║   Phase 1: Tool System & ACI Design — 評分      ║
╚══════════════════════════════════════════════════╝

  Lab 1: Tool Registry
  Source: phase_1/registry.py
  [████████████████████████████████] 14/14 (100%)

  Lab 2: File Tools
  Source: phase_1/file_tools.py
  [████████████████████████████████] 14/14 (100%)

  Lab 3: Shell Executor
  Source: phase_1/shell_tools.py
  [████████████████████████████████] 14/14 (100%)

────────────────────────────────────────────────────
  Overall Progress
  [████████████████████████████████] 42/42 (100%)

  ★ 全部通過！ — 42/42 tests passing (100%)
```

---

## 1.5 回顧與展望

### 你在這個 Phase 學到了什麼

| 概念 | 你學到的 | 為什麼重要 |
|------|---------|-----------|
| Registry Pattern | 動態工具管理、驗證、發現 | Agent 的工具系統需要可擴展 |
| Description Engineering | 如何寫 LLM 友好的工具描述 | 好的描述 = 更準確的調用 |
| Poka-yoke | 讓工具難以被錯誤使用 | 預防 > 修復 |
| 絕對路徑 | 避免相對路徑的陷阱 | Anthropic SWE-bench 的核心教訓 |
| Sandbox | 路徑穿越防護 | 安全邊界 |
| Shell 安全 | 黑名單、超時、輸出限制 | Agent 需要安全地執行命令 |
| 結構化結果 | LLM 友好的輸出格式 | Agent 需要理解工具的反饋 |

### 你構建了什麼

```
┌────────────────────────────────────────────────┐
│  my-agent-tools                                │
│                                                │
│  ┌────────────────────┐  ┌──────────────────┐  │
│  │   Tool Registry    │  │  File Tools      │  │
│  │  · register        │  │  · read_file     │  │
│  │  · unregister      │  │  · write_file    │  │
│  │  · validate_schema │  │  · list_directory│  │
│  │  · load_from_dir   │  │  · search_files  │  │
│  │                    │  │  · edit_file     │  │
│  └────────────────────┘  └──────────────────┘  │
│                                                │
│  ┌────────────────────────────────────────┐     │
│  │       Shell Executor                  │     │
│  │  · is_command_blocked                 │     │
│  │  · execute (timeout + truncation)     │     │
│  │  · format_result                      │     │
│  │  · run (execute + format)             │     │
│  └────────────────────────────────────────┘     │
└────────────────────────────────────────────────┘
```

### 下一步：Phase 2 預告

你的 Agent 現在有了手（File Tools）和腳（Shell Executor）。但它的行為模式還是「收到指令 → 調用一個工具 → 返回結果」的簡單模式。

在 Phase 2 中，你將學會兩種**工作流模式**：
- **Prompt Chaining**：把複雜任務分解為多步，每步之間有程序化的質量檢查
- **Routing**：根據用戶意圖自動路由到不同的處理器

你的 Agent 將從「一招鮮」進化為「見招拆招」。

---

## 參考資料

### 必讀
1. [Building Effective Agents §Appendix 2: Prompt Engineering your Tools](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic 的 Tool 設計方法論
2. [Anthropic Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) — Tool Use 的完整文檔
3. [Model Context Protocol](https://modelcontextprotocol.io/) — MCP 規範，理解工具的未來生態

### 深入閱讀
4. [Poka-yoke (Wikipedia)](https://en.wikipedia.org/wiki/Poka-yoke) — 防錯設計的起源
5. [SWE-bench](https://www.swebench.com/) — 理解 Agent 在真實編程任務上的評測方法
6. Python `subprocess` [官方文檔](https://docs.python.org/3/library/subprocess.html) — 安全的命令執行

### 擴展思考
- 如果你有 100 個工具，LLM 在一次請求中能有效選擇嗎？（提示：工具過多 = token 開銷 + 選擇困難）
- MCP 和本地 Tool Registry 各有什麼優缺點？（提示：標準化 vs 靈活性）
- 為什麼 Claude Code 的 Edit 工具使用搜索替換而不是行號？（提示：並發安全性）
