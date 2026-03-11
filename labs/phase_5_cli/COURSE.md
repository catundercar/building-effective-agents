# Phase 5 — 完形：產品化與 CLI 體驗

> **Week 11-12 · Ship It**
> 你已經構建了 Agent 的全部核心模組——LLM 通信、工具系統、工作流引擎、Agent 循環、多 Agent 協作。
> 現在，是時候把它變成一個真正可用的產品了。

---

## 5.0 Phase 導讀：從 Agent 到產品

### 從「能用」到「好用」

回想一下你目前的 Agent。它能工作——接收指令、調用工具、完成任務。但如果你把它交給另一個開發者使用，他們的體驗會怎樣？

```
$ python agent.py
> 幫我修復 bug
(5 秒沉默...)
(突然輸出一大段文字和工具調用日誌，混雜在一起)
(看不出哪些是 Agent 的思考，哪些是工具執行結果)
(不知道進度，不知道還要等多久)
(關閉終端後一切消失，下次重新開始)
```

這就是「能用」和「好用」之間的鴻溝。彌補這道鴻溝需要三樣東西：

```
┌─────────────────────────────────────────────────────────┐
│                    CLI 產品化三要素                        │
│                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │ 1. 渲染引擎   │ │ 2. 配置系統   │ │ 3. Session 管理  │  │
│  │              │ │              │ │                  │  │
│  │ · 串流輸出    │ │ · 多層合併    │ │ · 對話持久化      │  │
│  │ · 工具卡片    │ │ · 優先級      │ │ · 恢復/列表      │  │
│  │ · 差異高亮    │ │ · 驗證        │ │ · 自動保存        │  │
│  │ · 進度指示    │ │ · 點號查詢    │ │ · 清理回收        │  │
│  └──────────────┘ └──────────────┘ └──────────────────┘  │
│                                                           │
│       Lab 1              Lab 2              Lab 3         │
└─────────────────────────────────────────────────────────┘
```

### 為什麼這些是最後做的

在軟體工程中，有一條重要原則：**先讓它能工作，再讓它好用，最後讓它快。** (Make it work, make it right, make it fast.)

Phase 0-4 是「讓它能工作」：
- Phase 0: LLM 通信、工具調用、記憶管理
- Phase 1: 文件操作、Shell 執行、安全邊界
- Phase 2: 工作流模式（chain、parallel、router、orchestrator）
- Phase 3: Agent 循環、規劃能力、錯誤恢復
- Phase 4: 多 Agent 協作、任務分發、結果聚合

Phase 5 是「讓它好用」：
- 專業的終端渲染讓用戶看得懂 Agent 在做什麼
- 靈活的配置系統讓用戶可以自定義行為
- Session 管理讓用戶的工作不會因為關閉終端而消失

### 真實產品的啟示

看看成功的 CLI Agent 產品是怎麼做的：

**Claude Code 的渲染策略**：
```
you> 幫我修復這個 bug

⟳ 正在分析代碼結構...

┌─ Tool: read_file ─────────────────────────┐
│ Input:
│   path: /src/main.py
│ Result:
│   (42 lines read)
└───────────────────────────────────────────┘

我發現問題在第 15 行。空指針異常是因為...

── diff: main.py ──────────────────────────────
- result = data.get("key").strip()
+ value = data.get("key")
+ result = value.strip() if value else ""

⟳ 正在驗證修復... [████████████████░░░░] 80% (4/5)

修復完成。問題是 data.get("key") 可能返回 None...
```

每個元素都有它的作用：
- **串流輸出**：用戶看到 Agent 在「思考」，不會以為卡住了
- **工具卡片**：清楚展示 Agent 調用了什麼工具、傳了什麼參數
- **差異高亮**：直觀顯示代碼修改（紅色刪除、綠色新增）
- **進度條**：告訴用戶要等多久

---

## Lesson 5.1: CLI 交互設計

### 學習目標

實現一個完整的 CLI 渲染器，支持串流文字、工具卡片、差異高亮和進度指示。

### 終端渲染基礎：ANSI Escape Codes

在終端中實現顏色和格式的關鍵是 ANSI escape codes。這是一套從 1970 年代沿用至今的標準：

```python
# ANSI escape code 格式: \033[{code}m

# 樣式碼
RESET  = "\033[0m"   # 重置所有樣式
BOLD   = "\033[1m"   # 粗體
DIM    = "\033[2m"   # 暗淡
ITALIC = "\033[3m"   # 斜體（部分終端支持）

# 前景色（文字顏色）
BLACK   = "\033[30m"
RED     = "\033[31m"
GREEN   = "\033[32m"
YELLOW  = "\033[33m"
BLUE    = "\033[34m"
MAGENTA = "\033[35m"
CYAN    = "\033[36m"
WHITE   = "\033[37m"

# 背景色
BG_RED   = "\033[41m"
BG_GREEN = "\033[42m"
# ...以此類推（4x 系列）
```

使用方式：

```python
# 打印紅色文字
print(f"\033[31mThis is red\033[0m and this is normal")

# 打印粗體綠色文字
print(f"\033[1m\033[32mBold green\033[0m")

# 封裝為函數
def colorize(text: str, color: str) -> str:
    return f"{color}{text}\033[0m"

print(colorize("Error: file not found", "\033[31m"))
```

**重要**：一定要在顏色文字後面加上 `\033[0m` 來重置，否則後續所有輸出都會保持那個顏色。

### 串流渲染的技術細節

串流渲染的核心挑戰是：LLM 的回應是一個字一個字來的，你需要即時顯示而不換行。

```python
import sys

def render_streaming(text_delta: str) -> None:
    """即時渲染串流文字。"""
    # 關鍵 1: 使用 sys.stdout.write 而不是 print
    # print 會自動加換行，我們不要
    sys.stdout.write(text_delta)

    # 關鍵 2: 使用 flush 確保即時顯示
    # 否則內容會留在緩衝區，直到緩衝區滿才輸出
    sys.stdout.flush()
```

為什麼需要 `flush()`？Python 的標準輸出是行緩衝的——它會等到遇到 `\n` 才真正輸出。但串流渲染需要即時顯示每個字元，所以要手動 flush。

### 工具卡片的設計

工具調用是 Agent 最重要的可觀察性特徵。好的工具卡片設計需要平衡兩個需求：
1. **信息量**：用戶需要知道 Agent 做了什麼
2. **簡潔性**：不能讓工具日誌淹沒真正的回答

```
工具卡片的結構：

┌─ Tool: {tool_name} ─────────────────────┐
│ Input:                                    │
│   {key1}: {value1}                        │
│   {key2}: {value2}                        │
│ Result:                                   │
│   {result_content}                        │
└───────────────────────────────────────────┘

設計原則：
- 頂部邊框包含工具名稱，一眼看到調用了什麼
- Input 展示參數，方便調試
- Result 展示結果，但要截斷過長內容
- 底部邊框收尾，視覺上形成一個獨立區塊
```

### 差異高亮的設計

Unified diff 格式是顯示代碼修改的標準方式。每行的第一個字元告訴你修改類型：

```
diff 格式說明：

  +  新增的行（綠色）
  -  刪除的行（紅色）
     未變的行（保持原色）
  @@ 位置標記（通常用青色或灰色）

範例：
  @@ -10,3 +10,4 @@
  -old_value = data["key"]          ← 紅色
  +raw = data.get("key")            ← 綠色
  +old_value = raw if raw else ""   ← 綠色
   unchanged_line                   ← 預設色
```

### Lab 1 實戰指引

打開 `phase_5/cli_app.py`，你會看到 6 個 TODO（包含 `__init__`）。建議順序：

#### Step 1: `__init__()` — 初始化

最基礎的設置。確保 renderer 能正常工作：

```
偽代碼:
1. self.config = config if config is not None else DisplayConfig()
2. self.theme = create_dark_theme()
```

#### Step 2: `render_streaming_text()` — 串流文字

```
偽代碼:
1. if self.config.color_enabled:
     output = self._colorize(text_delta, self.theme.text_color)
   else:
     output = text_delta
2. sys.stdout.write(output)
3. sys.stdout.flush()
4. return output
```

#### Step 3: `render_tool_call()` — 工具卡片

```
偽代碼:
1. if not self.config.show_tool_details:
     summary = f"[Tool: {tool_name}]"
     return self._colorize(summary, self.theme.secondary_color)
        if self.config.color_enabled else summary

2. width = self.config.max_width
3. header = f"┌─ Tool: {tool_name} " + "─" * (width - len(tool_name) - 12) + "┐"
4. lines = [header]
5. lines.append("│ Input:")
6. for key, value in tool_input.items():
     lines.append(f"│   {key}: {value}")
7. lines.append("│ Result:")
8. truncated = self._truncate(result, max_len=width - 4)
9. lines.append(f"│   {truncated}")
10. footer = "└" + "─" * (width - 2) + "┘"
11. lines.append(footer)
12. card = "\n".join(lines)
13. if self.config.color_enabled:
      card = self._colorize(card, self.theme.secondary_color)
14. return card
```

#### Step 4: `render_diff()` — 差異高亮

```
偽代碼:
1. header = f"── diff: {filename} " + "─" * (self.config.max_width - len(filename) - 10)
2. lines = [header]
3. for line in diff_content.split("\n"):
     if line.startswith("+"):
       colored = self._colorize(line, self.theme.success_color)
     elif line.startswith("-"):
       colored = self._colorize(line, self.theme.error_color)
     else:
       colored = line
     lines.append(colored)
4. return "\n".join(lines)
```

#### Step 5: `render_progress()` — 進度指示

```
偽代碼:
1. if total == 0: pct = 0
   else: pct = int(current / total * 100)
2. bar_width = 20
3. filled = int(current / total * bar_width) if total > 0 else 0
4. empty = bar_width - filled
5. bar = "█" * filled + "░" * empty
6. text = f"⟳ {message} [{bar}] {pct}% ({current}/{total})"
7. if self.config.color_enabled:
     return self._colorize(text, self.theme.primary_color)
8. return text
```

#### Step 6: `render_welcome()` — 歡迎畫面

```
偽代碼:
1. width = 50
2. top    = "╔" + "═" * width + "╗"
3. ver    = f"Agent CLI v{version}"
4. mod    = f"Model: {model}"
5. v_line = "║" + ver.center(width) + "║"
6. m_line = "║" + mod.center(width) + "║"
7. bottom = "╚" + "═" * width + "╝"
8. banner = "\n".join([top, v_line, m_line, bottom])
9. if self.config.color_enabled:
     return self._colorize(banner, self.theme.primary_color)
10. return banner
```

### 測試你的實現

```bash
pytest tests/test_lab1_cli_app.py -v
```

---

## Lesson 5.2: Configuration 與 Permission

### 學習目標

實現一個多層級配置系統，支持預設值、全域配置、專案配置和命令列覆蓋的深度合併。

### 為什麼需要多層配置

一個好的 CLI 工具需要在三個層面提供配置能力：

```
┌─────────────────────────────────────────────────────────────┐
│                    配置層級優先級                              │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Layer 4: CLI Overrides (--model claude-opus-4-20250514)         │    │
│  │  → 命令列參數，本次執行有效                            │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  Layer 3: Project Config (.agent.yml)                │    │
│  │  → 專案級配置，團隊共享                               │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  Layer 2: Global Config (~/.agent/config.yml)        │    │
│  │  → 使用者全域偏好                                     │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  Layer 1: Default Values (built-in)                  │    │
│  │  → 程式碼中的預設值                                   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  優先級: Layer 4 > Layer 3 > Layer 2 > Layer 1               │
└─────────────────────────────────────────────────────────────┘
```

每個層級解決不同的需求：
- **Default**: 確保程式在沒有任何配置檔的情況下也能運行
- **Global**: 用戶的個人偏好（比如喜歡用的模型、溫度設置）
- **Project**: 專案特定的配置（比如允許的目錄、工具權限）
- **CLI**: 一次性覆蓋（比如臨時切換模型做測試）

### 深度合併（Deep Merge）

深度合併是配置系統的核心算法。它的規則很簡單：

```
規則 1: 如果兩邊都是 dict → 遞迴合併
規則 2: 否則 → 後者覆蓋前者

範例:
  base    = {"agent": {"model": "a", "temp": 0.0}, "debug": False}
  overlay = {"agent": {"model": "b"},              "verbose": True}

  合併結果:
  {
    "agent": {"model": "b", "temp": 0.0},  ← dict 遞迴合併
    "debug": False,                         ← 只在 base 中，保留
    "verbose": True,                        ← 只在 overlay 中，新增
  }
```

**注意列表的處理**：列表不做合併，而是直接替換。這是業界的慣例——如果用戶在專案配置中指定了 `blocked_commands`，他們通常想完全控制這個列表，而不是在預設列表上追加。

### 點號路徑查詢（Dotted Key Path）

點號路徑讓配置查詢變得優雅：

```python
# 不用點號路徑
model = config["agent"]["model"]  # 如果 "agent" 不存在就報 KeyError

# 使用點號路徑
model = config_mgr.get("agent.model", default="claude-sonnet-4-20250514")
# 安全、有預設值、一行搞定
```

實現方式：

```python
def get(self, key: str, default=None):
    merged = self._merge_configs(...)
    current = merged
    for part in key.split("."):
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return default
    return current
```

### 工具權限模型

Agent 的工具存在安全風險。一個合理的權限模型：

```
┌────────────────────────────────────────────┐
│            Tool Permission Levels          │
├────────────────┬───────────────────────────┤
│ Level          │ 行為                       │
├────────────────┼───────────────────────────┤
│ auto           │ 自動執行，不需要確認        │
│                │ 適用: read_file, search     │
├────────────────┼───────────────────────────┤
│ confirm        │ 每次執行前詢問用戶          │
│                │ 適用: write_file, run_shell │
├────────────────┼───────────────────────────┤
│ deny           │ 禁止執行                    │
│                │ 適用: delete_file (特定場景) │
└────────────────┴───────────────────────────┘
```

配置範例（.agent.yml）：

```yaml
permissions:
  - tool_name: read_file
    level: auto
  - tool_name: write_file
    level: confirm
  - tool_name: run_shell
    level: confirm
  - tool_name: delete_file
    level: deny
```

### Lab 2 實戰指引

打開 `phase_5/config.py`，你會看到 6 個 TODO。建議順序：

#### Step 1: `__init__()` — 初始化

```
偽代碼:
1. self._layers = {
     "default": _default_config(),
     "global": {},
     "project": {},
     "cli": cli_overrides if cli_overrides is not None else {},
   }
2. self._cli_overrides = cli_overrides or {}
```

#### Step 2: `_merge_configs()` — 深度合併

這是配置系統的核心。用遞迴實現：

```
偽代碼:
def _merge_configs(self, *layers):
    result = {}
    for layer in layers:
        for key, value in layer.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_configs(result[key], value)
            else:
                result[key] = value
    return result
```

#### Step 3: `_load_global_config()` — 載入全域配置

```
偽代碼:
1. path = Path.home() / ".agent" / "config.yml"
2. if not path.exists(): return {}
3. content = path.read_text(encoding="utf-8")
4. return self._parse_simple_yaml(content)
```

#### Step 4: `_load_project_config()` — 載入專案配置

```
偽代碼:
1. root = _find_project_root()
2. if root is None: return {}
3. config_path = root / ".agent.yml"
4. content = config_path.read_text(encoding="utf-8")
5. return self._parse_simple_yaml(content)
```

#### Step 5: `load()` — 合併所有層

```
偽代碼:
1. self._layers["global"] = self._load_global_config()
2. self._layers["project"] = self._load_project_config()
3. merged = self._merge_configs(
     self._layers["default"],
     self._layers["global"],
     self._layers["project"],
     self._layers["cli"],
   )
4. agent_dict = merged.get("agent", {})
5. agent = AgentConfig(**agent_dict)
6. permissions = [ToolPermission(**p) for p in merged.get("permissions", [])]
7. allowed_dirs = merged.get("allowed_dirs", [])
8. blocked_commands = merged.get("blocked_commands", [])
9. return ProjectConfig(
     agent=agent,
     permissions=permissions,
     allowed_dirs=allowed_dirs,
     blocked_commands=blocked_commands,
   )
```

#### Step 6: `get()` — 點號路徑查詢

```
偽代碼:
1. merged = self._merge_configs(
     self._layers["default"],
     self._layers["global"],
     self._layers["project"],
     self._layers["cli"],
   )
2. current = merged
3. for part in key.split("."):
     if isinstance(current, dict) and part in current:
       current = current[part]
     else:
       return default
4. return current
```

### 測試你的實現

```bash
pytest tests/test_lab2_config.py -v
```

---

## Lesson 5.3: Session 管理與持久化

### 學習目標

實現對話 Session 的建立、持久化（JSON）、恢復和管理功能。

### 為什麼需要 Session 管理

沒有 Session 管理的 Agent 就像一個失憶的助手：

```
場景 1: 無 Session 管理
  用戶花了 20 分鐘和 Agent 一起 debug
  → 關閉終端
  → 一切消失
  → 隔天回來：「昨天我們分析到哪裡了？」→ Agent：「?」

場景 2: 有 Session 管理
  用戶花了 20 分鐘和 Agent 一起 debug
  → 關閉終端
  → Session 已自動保存
  → 隔天回來：/resume
  → Agent 載入昨天的完整對話歷史，繼續工作
```

### Session 的資料結構

```
Session:
├── id: "ses_1a2b3c4d_0001"       唯一識別符
├── created_at: 1703001234.567     建立時間戳
├── updated_at: 1703002345.678     最後更新時間戳
├── project_dir: "/home/user/proj" 工作目錄
├── model: "claude-sonnet-4-20250514"     使用的模型
├── total_tokens: 12345            累計使用 token
└── messages: [                    消息列表
      SessionMessage:
      ├── role: "user"
      ├── content: "幫我修復 bug"
      ├── timestamp: 1703001234.567
      └── tool_calls: []
      ,
      SessionMessage:
      ├── role: "assistant"
      ├── content: "我來看看代碼..."
      ├── timestamp: 1703001235.123
      └── tool_calls: [
            {"name": "read_file", "input": {"path": "/src/main.py"}}
          ]
    ]
```

### 持久化策略：JSON 文件

每個 Session 儲存為一個獨立的 JSON 文件：

```
~/.agent/sessions/
├── ses_1a2b3c4d_0001.json
├── ses_1a2b3c4e_0002.json
├── ses_1a2b3c4f_0003.json
└── ...
```

JSON 格式的優點：
- 人類可讀——方便調試
- 無需額外依賴——Python 內建 `json` 模組
- 容易遷移——文字格式跨平台

JSON 結構範例：

```json
{
  "id": "ses_1a2b3c4d_0001",
  "created_at": 1703001234.567,
  "updated_at": 1703002345.678,
  "project_dir": "/home/user/project",
  "model": "claude-sonnet-4-20250514",
  "total_tokens": 12345,
  "messages": [
    {
      "role": "user",
      "content": "幫我修復 main.py 的 bug",
      "timestamp": 1703001234.567,
      "tool_calls": []
    },
    {
      "role": "assistant",
      "content": "我來查看代碼...",
      "timestamp": 1703001235.123,
      "tool_calls": [
        {"name": "read_file", "input": {"path": "/src/main.py"}}
      ]
    }
  ]
}
```

### 自動保存策略

自動保存需要平衡兩個需求：
1. **安全性**：盡量不丟失資料
2. **性能**：不能每個字元都保存一次

```
策略: 每次 add_message 後自動保存
├── 用戶消息: add_message("user", "...") → save
├── Agent 回覆: add_message("assistant", "...") → save
└── 即使程式崩潰，最多只丟失當前 turn 的回覆

性能考量:
├── JSON 序列化很快（< 1ms 對於普通 Session）
├── 文件寫入用 write（原子操作依 OS 而異）
└── 如果未來需要更高性能，可以改用 append-only log
```

### Session 清理

隨著使用，Session 文件會不斷累積。需要一個清理機制：

```
清理策略: 保留最新的 N 個 Session

_cleanup_old_sessions():
  1. 列出所有 .json 文件
  2. 按修改時間排序（最新在前）
  3. 刪除超過 max_sessions 的文件
  4. 返回刪除的數量

配置:
  max_sessions: 50    # 預設保留最新 50 個
```

### Lab 3 實戰指引

打開 `phase_5/session.py`，你會看到 6 個 TODO。建議順序：

#### Step 1: `__init__()` — 初始化

```
偽代碼:
1. self.config = config if config is not None else SessionConfig()
2. self.storage_dir = Path(self.config.storage_dir).expanduser()
3. self.storage_dir.mkdir(parents=True, exist_ok=True)
```

#### Step 2: `create_session()` — 建立 Session

```
偽代碼:
1. session_id = self._generate_session_id()
2. now = time.time()
3. return Session(
     id=session_id,
     created_at=now,
     updated_at=now,
     messages=[],
     project_dir=project_dir,
     model=model,
     total_tokens=0,
   )
```

#### Step 3: `save_session()` — 持久化

```
偽代碼:
1. path = self._session_path(session.id)
2. session.updated_at = time.time()
3. data = {
     "id": session.id,
     "created_at": session.created_at,
     "updated_at": session.updated_at,
     "project_dir": session.project_dir,
     "model": session.model,
     "total_tokens": session.total_tokens,
     "messages": [
       {
         "role": m.role,
         "content": m.content,
         "timestamp": m.timestamp,
         "tool_calls": m.tool_calls,
       }
       for m in session.messages
     ],
   }
4. path.write_text(
     json.dumps(data, ensure_ascii=False, indent=2),
     encoding="utf-8",
   )
```

#### Step 4: `load_session()` — 載入

```
偽代碼:
1. path = self._session_path(session_id)
2. if not path.exists():
     raise FileNotFoundError(f"Session not found: {session_id}")
3. data = json.loads(path.read_text(encoding="utf-8"))
4. messages = [SessionMessage(**m) for m in data["messages"]]
5. return Session(
     id=data["id"],
     created_at=data["created_at"],
     updated_at=data["updated_at"],
     messages=messages,
     project_dir=data["project_dir"],
     model=data["model"],
     total_tokens=data.get("total_tokens", 0),
   )
```

#### Step 5: `list_sessions()` — 列表

```
偽代碼:
1. summaries = []
2. for json_file in self.storage_dir.glob("*.json"):
     try:
       data = json.loads(json_file.read_text(encoding="utf-8"))
       messages = data.get("messages", [])
       preview = ""
       for m in messages:
         if m.get("role") == "user":
           preview = m.get("content", "")[:80]
           break
       summaries.append(SessionSummary(
         id=data["id"],
         created_at=data["created_at"],
         message_count=len(messages),
         preview=preview,
         project_dir=data.get("project_dir", ""),
       ))
     except (json.JSONDecodeError, KeyError):
       continue
3. summaries.sort(key=lambda s: s.created_at, reverse=True)
4. return summaries
```

#### Step 6: `add_message()` — 追加消息

```
偽代碼:
1. msg = SessionMessage(
     role=role,
     content=content,
     timestamp=time.time(),
     tool_calls=tool_calls or [],
   )
2. session.messages.append(msg)
3. session.updated_at = time.time()
4. if self.config.auto_save:
     self.save_session(session)
```

### 測試你的實現

```bash
pytest tests/test_lab3_session.py -v
```

---

## Lesson 5.4: Phase 5 整合 — v1.0 發布

### 整合所有模組

當 Lab 1-3 的測試全部通過後，你可以運行完整的 CLI：

```bash
python -m phase_5.cli
```

### 試試這些命令

1. **查看配置**：
   ```
   you> /config
   ```
   驗證配置系統正確載入了預設值。

2. **建立新 Session**：
   ```
   you> /new
   ```
   觀察新 Session ID 的生成。

3. **對話與自動保存**：
   ```
   you> 你好！這是 v1.0 的第一次對話
   ```
   消息被記錄在 Session 中。

4. **列出 Sessions**：
   ```
   you> /sessions
   ```
   看到你的對話歷史列表。

5. **恢復 Session**：
   ```
   you> /resume
   ```
   載入最近的 Session，繼續對話。

### 查看成績

```bash
python scripts/grade.py
```

你應該看到類似這樣的輸出：

```
╔══════════════════════════════════════════════╗
║        Phase 5: Ship It — 評分              ║
╚══════════════════════════════════════════════╝

  Lab 1: CLI Renderer
  Source: phase_5/cli_app.py
  [████████████████████████████████] 12/12 (100%)

  Lab 2: Config System
  Source: phase_5/config.py
  [████████████████████████████████] 11/11 (100%)

  Lab 3: Session Manager
  Source: phase_5/session.py
  [████████████████████████████████] 13/13 (100%)

────────────────────────────────────────────────
  Overall Progress
  [████████████████████████████████] 36/36 (100%)

  ★ 全部通過！ — 36/36 tests passing (100%)
```

---

## 5.5 回顧與展望：完整回顧 Phase 0-5

### 你構建了什麼

在 12 週的旅程中，你從零開始構建了一個完整的 AI coding agent。讓我們回顧整個架構：

```
┌──────────────────────────────────────────────────────────────────┐
│                     Your AI Coding Agent v1.0                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Layer 5: CLI Interface (Phase 5)                         │  │
│  │  ┌──────────┐  ┌────────────┐  ┌───────────────────────┐ │  │
│  │  │ Renderer │  │   Config   │  │   Session Manager     │ │  │
│  │  │ ·stream  │  │  ·4-layer  │  │  ·create/save/load    │ │  │
│  │  │ ·diff    │  │  ·merge    │  │  ·list/resume         │ │  │
│  │  │ ·cards   │  │  ·validate │  │  ·auto-save           │ │  │
│  │  └──────────┘  └────────────┘  └───────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Layer 4: Agent Orchestration (Phase 3-4)                 │  │
│  │  ┌──────────────┐  ┌────────────┐  ┌────────────────┐    │  │
│  │  │ Agent Loop   │  │  Planner   │  │  Multi-Agent   │    │  │
│  │  │ ·think-act   │  │  ·plan     │  │  ·delegator    │    │  │
│  │  │ ·observe     │  │  ·replan   │  │  ·specialist   │    │  │
│  │  │ ·recover     │  │  ·reflect  │  │  ·aggregator   │    │  │
│  │  └──────────────┘  └────────────┘  └────────────────┘    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Layer 3: Workflow Engine (Phase 2)                       │  │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌─────────┐ │  │
│  │  │  Chain   │  │ Parallel  │  │  Router  │  │  Orch.  │ │  │
│  │  │ A → B → C│  │ ┌A┐       │  │  if/else │  │  Plan+  │ │  │
│  │  │          │  │ ├B┤→merge │  │  → route │  │  Do     │ │  │
│  │  │          │  │ └C┘       │  │          │  │         │ │  │
│  │  └──────────┘  └───────────┘  └──────────┘  └─────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Layer 2: Tool System (Phase 1)                           │  │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐ │  │
│  │  │ File Tools   │  │ Shell Exec  │  │ Search Tools     │ │  │
│  │  │ ·read/write  │  │ ·sandbox    │  │ ·glob/grep       │ │  │
│  │  │ ·edit/diff   │  │ ·timeout    │  │ ·semantic        │ │  │
│  │  └──────────────┘  └─────────────┘  └──────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Layer 1: LLM Core (Phase 0)                             │  │
│  │  ┌──────────────┐  ┌────────────┐  ┌────────────────────┐│  │
│  │  │  LLM Client  │  │ Tool Loop  │  │ Context Manager    ││  │
│  │  │  ·stream     │  │ ·register  │  │ ·token count       ││  │
│  │  │  ·retry      │  │ ·execute   │  │ ·truncate          ││  │
│  │  │  ·API call   │  │ ·loop      │  │ ·summarize         ││  │
│  │  └──────────────┘  └────────────┘  └────────────────────┘│  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 每個 Phase 你學到了什麼

| Phase | 主題 | 關鍵概念 | 核心能力 |
|-------|------|----------|----------|
| Phase 0 | LLM 核心 | Messages API, Tool Use, Context | LLM 通信、工具循環、記憶管理 |
| Phase 1 | 工具系統 | ACI, Sandbox, Security | 文件操作、安全執行、搜索 |
| Phase 2 | 工作流 | Chain, Parallel, Router | 任務編排、條件路由、並行處理 |
| Phase 3 | Agent 核心 | Think-Act-Observe, Planning | 自主循環、規劃、錯誤恢復 |
| Phase 4 | 多 Agent | Delegation, Specialization | 任務分發、專家協作、結果聚合 |
| Phase 5 | 產品化 | CLI UX, Config, Session | 渲染引擎、配置管理、持久化 |

### Anthropic 設計原則的實踐

回顧 Anthropic「Building Effective Agents」中的五條設計原則，看看你在每個 Phase 中是如何實踐的：

**原則 1: Start simple, add complexity only when needed**
- Phase 0 的 `tool_use_loop` 是最簡單的 Agent 雛形
- 逐步增加工作流、規劃、多 Agent 等複雜功能
- 每個 Phase 都在前一個的基礎上增量構建

**原則 2: Transparency first — make agent reasoning visible**
- Phase 5 的 CLI 渲染器讓 Agent 的思考過程可見
- 工具卡片展示每次工具調用的細節
- 差異高亮讓代碼修改一目了然

**原則 3: Invest more time in tool design than prompt engineering**
- Phase 1 整整兩週專注於工具設計
- Tool Description Engineering 的深入學習
- 絕對路徑、安全沙箱等最佳實踐

**原則 4: Environment feedback drives agent intelligence**
- `tool_use_loop` 的設計讓 LLM 從工具結果中學習
- 錯誤不中斷流程，而是反饋給 LLM 自行處理
- 測試結果驅動 Agent 的迭代修復

**原則 5: Eval-driven development — measure everything**
- 每個 Phase 都有完整的測試套件
- `grade.py` 提供即時進度反饋
- 自動化評分確保實現正確性

### 從這裡出發

你的 Agent v1.0 已經完成。但這只是開始。以下是一些可以繼續探索的方向：

**性能優化**：
- 實現 prompt caching 減少重複 token 消耗
- 使用 asyncio 讓工具執行真正並行
- 優化 context 管理減少不必要的截斷

**功能增強**：
- 加入圖片理解能力（Vision）
- 實現代碼執行沙箱（Docker / E2B）
- 支持 MCP (Model Context Protocol) 標準

**產品化**：
- 添加 telemetry 和 error reporting
- 實現 token 使用量追蹤和預算警告
- 構建 web UI 作為 CLI 的替代介面

恭喜你完成了整個課程！你現在擁有了從零構建 AI Agent 的完整知識和實戰經驗。

---

## 參考資料

### 必讀
1. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic 的完整指南
2. [Anthropic CLI Design](https://docs.anthropic.com/en/docs/claude-code) — Claude Code 的設計理念
3. [ANSI Escape Codes](https://en.wikipedia.org/wiki/ANSI_escape_code) — 終端顏色和格式的完整參考

### 深入閱讀
4. [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/latest/) — Linux 配置文件路徑的標準
5. [The Twelve-Factor App](https://12factor.net/config) — 配置管理的最佳實踐
6. [Click (Python CLI Framework)](https://click.palletsprojects.com/) — 如果你想用框架重構 CLI
7. [Rich (Python Terminal Formatting)](https://rich.readthedocs.io/) — 專業的終端渲染庫

### 擴展思考
- 如果要支持數千個 Session，JSON 文件還合適嗎？（提示：SQLite）
- CLI 和 Web UI 應該共享哪些模組？（提示：渲染邏輯 vs 業務邏輯的分離）
- 配置系統應該支持「繼承」嗎？（提示：monorepo 的巢狀配置）
