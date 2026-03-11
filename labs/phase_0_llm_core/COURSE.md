# Phase 0 — 地基：Augmented LLM 核心模塊

> **Week 1-2 · The Foundation**
> 你即將構建的不是一個聊天機器人，而是一個能夠自主使用工具、管理記憶的智能引擎。
> 這個引擎是整個 Agent 的心臟——後續每一個 Phase 都建立在它之上。

---

## 0.0 Phase 導讀：為什麼從這裡開始？

### 你在構建什麼

想像一下 Claude Code 的工作方式：你輸入 "幫我修復這個 bug"，它就會：
1. 讀取相關的代碼文件
2. 分析問題所在
3. 修改文件
4. 運行測試驗證
5. 如果測試失敗，繼續修改

這一切的底層，是一個 **Augmented LLM**——一個被工具和記憶增強過的 LLM。Anthropic 在 "Building Effective Agents" 中將它定義為整個 agentic system 的基本構建塊：

```
┌─────────────────────────────────────────────┐
│              Augmented LLM                  │
│                                             │
│   ┌───────────┐  ┌──────┐  ┌────────────┐  │
│   │ Retrieval │  │ Tools │  │   Memory   │  │
│   └─────┬─────┘  └──┬───┘  └─────┬──────┘  │
│         │           │            │          │
│         └───────────┼────────────┘          │
│                     │                       │
│              ┌──────┴──────┐                │
│              │   LLM Core  │                │
│              └─────────────┘                │
└─────────────────────────────────────────────┘
```

在這個 Phase 中，你要實現的就是這個方塊內的所有東西：
- **LLM Core**：與 Claude API 穩定通信的客戶端（Lab 1）
- **Tools**：讓 LLM 能調用外部功能的工具系統（Lab 2）
- **Memory**：管理對話歷史、防止 context 溢出的記憶系統（Lab 3）

### 心智模型：對話是一個不斷增長的數組

理解 LLM API 最重要的一個心智模型：**每次 API 調用都是無狀態的**。LLM 不記得你之前說過什麼——你必須每次都把完整的對話歷史發送過去。

```python
# 每次調用 API，你發送的其實是這樣一個結構：
{
  "system": "You are a helpful assistant...",    # 系統指令
  "tools": [{ "name": "read_file", ... }],      # 可用工具
  "messages": [                                  # 完整的對話歷史
    { "role": "user", "content": "幫我讀取 index.py" },
    { "role": "assistant", "content": [{ "type": "tool_use", "name": "read_file", ... }] },
    { "role": "user", "content": [{ "type": "tool_result", "content": "file content..." }] },
    { "role": "assistant", "content": "這個文件的功能是..." },
    { "role": "user", "content": "現在幫我修改第 42 行" },
    # ... 歷史越來越長
  ]
}
```

這意味著：
1. **你的代碼負責管理這個 messages 數組** — 這就是「記憶」
2. **每條消息都消耗 token** — 歷史太長就會超過 context window
3. **工具調用也是消息** — 工具的請求和結果都記錄在 messages 中

這三個挑戰分別對應 Lab 1、Lab 2、Lab 3。

---

## 0.1 概念課：Anthropic Messages API 深度解析

### API 的核心概念

在寫任何代碼之前，你需要深入理解 Anthropic Messages API 的設計。

#### 消息的角色

API 中只有兩個角色：
- `user` — 人類用戶的輸入（以及工具執行結果）
- `assistant` — LLM 的輸出

注意：沒有 `system` 角色。System prompt 是一個獨立的頂層字段，不在 messages 數組中。

```
messages 數組必須嚴格交替：user → assistant → user → assistant → ...
第一條必須是 user，不能有連續兩條相同 role 的消息。
```

#### 內容塊（Content Blocks）

每條消息的 `content` 可以是簡單字符串，也可以是一個 ContentBlock 數組。這很重要，因為 LLM 的一次回覆可能同時包含文字和工具調用：

```python
# LLM 的一次回覆可能包含多個 content blocks：
{
  "role": "assistant",
  "content": [
    { "type": "text", "text": "讓我查看這個文件的內容。" },        # 文字
    { "type": "tool_use", "id": "toolu_01A", "name": "read_file",  # 工具調用
      "input": { "path": "/src/index.py" } }
  ]
}
```

#### stop_reason 的含義

每次 API 調用結束時，`stop_reason` 告訴你 LLM 為什麼停止：

| stop_reason | 含義 | 你該怎麼做 |
|---|---|---|
| `end_turn` | LLM 認為任務完成了 | 將回覆展示給用戶 |
| `tool_use` | LLM 想調用工具 | 執行工具 → 把結果送回 → 再次調用 API |
| `max_tokens` | 輸出達到了 token 上限 | 可能需要增加 max_tokens 或者讓 LLM 繼續 |

`tool_use` 是最關鍵的——它意味著 LLM 還沒說完，它在等待工具的結果。你必須執行工具，然後把結果發回去讓 LLM 繼續。

### Token 與 Context Window

#### 什麼是 Token

Token 是 LLM 處理文本的最小單位。它不是字符也不是單詞，而是介於兩者之間的東西：

```
英文：  "Hello, world!"      → ["Hello", ",", " world", "!"]       ≈ 4 tokens
中文：  "你好世界"            → ["你好", "世界"]                     ≈ 2-3 tokens
代碼：  "print('hi')"       → ["print", "('", "hi", "')"]          ≈ 4 tokens
```

粗略估算：
- 英文 ≈ 每 4 個字符 1 token
- 中文 ≈ 每 1.5 個字符 1 token
- 代碼 ≈ 每 3 個字符 1 token

#### Context Window 的構成

Claude 的 context window 是 200K tokens。每次 API 調用的 token 消耗如下：

```
total_tokens = system_prompt_tokens
             + tool_definitions_tokens    ← 容易被忽略！
             + all_messages_tokens        ← 隨對話增長
             + max_tokens (output)        ← 為輸出預留的空間

如果 total_tokens > 200,000 → API 報錯
```

一個常見的陷阱：tool definitions 也佔用 token。如果你有 20 個工具，每個的描述和 schema 加起來可能佔到幾千 tokens。這些是每次調用都會消耗的「固定開銷」。

```
┌─────────────────────── 200K Context Window ───────────────────────┐
│                                                                   │
│  ┌──────────────┐ ┌────────────────┐ ┌───────────────────────┐    │
│  │ System Prompt │ │ Tool Schemas   │ │   Messages History    │    │
│  │ (~500 tokens) │ │ (~2000 tokens) │ │  (grows over time!)   │    │
│  └──────────────┘ └────────────────┘ └───────────────────────┘    │
│                                                                   │
│                              ┌──────────────────┐                 │
│                              │ Reserved Output   │                 │
│                              │  (4096 tokens)    │                 │
│                              └──────────────────┘                 │
└───────────────────────────────────────────────────────────────────┘
```

### Streaming vs Non-Streaming

**Non-streaming**：發送請求 → 等待 → 收到完整回覆。用戶體驗差（等待時間長），但代碼簡單。

**Streaming**：發送請求 → 逐步收到 token → 組裝完整回覆。用戶體驗好（即時看到輸出），但需要處理 Server-Sent Events（SSE）。

```
Non-streaming:
  請求 ──────────────────────────────────────→ 完整回覆
                    (等待 2-10 秒)

Streaming:
  請求 → H → e → l → l → o →   → w → o → r → l → d → [完成]
         ↑   ↑   ↑   ↑   ↑                              ↑
       TTFT  (每個 delta 即時顯示)                    finalMessage
```

TTFT（Time To First Token）是 streaming 的關鍵指標——用戶等待看到第一個字的時間。通常 < 500ms。

---

## Lab 1：LLM API Client 封裝

### 學習目標

實現一個健壯的 Claude API 客戶端，支持：
- Non-streaming 調用
- Streaming 調用（generator）
- 帶指數退避的錯誤重試

### 前置知識

確保你理解以下概念：
- Python 的 `Generator` 和 `yield` 語法
- `try/except` 錯誤處理模式
- `for...in` 循環遍歷生成器
- `Callable` 類型標註

### 核心概念：Exponential Backoff（指數退避）

當 API 返回 429 (Rate Limited) 或 500 (Server Error) 時，你不應該立刻重試——這會加劇問題。正確的做法是**指數退避**：

```
第 1 次重試：等待 1 秒
第 2 次重試：等待 2 秒
第 3 次重試：等待 4 秒
第 4 次重試：等待 8 秒
...
```

為了避免**驚群效應**（thundering herd problem）——大量客戶端在同一時刻重試，需要加入**隨機抖動（jitter）**：

```
實際等待 = baseDelay × 2^attempt × random(0.5, 1.0)
```

#### 哪些錯誤可以重試？

| HTTP Status | 含義 | 可重試？ |
|---|---|---|
| 400 | Bad Request（請求格式錯誤）| ❌ 不可重試——是你的代碼問題 |
| 401 | Unauthorized（API Key 無效）| ❌ 不可重試 |
| 429 | Rate Limited（超出速率限制）| ✅ 等待後重試 |
| 500 | Internal Server Error | ✅ 可能是暫時的 |
| 502/503 | Bad Gateway / Service Unavailable | ✅ 暫時性問題 |
| 529 | Overloaded | ✅ 等待後重試 |

### 核心概念：Generator

Streaming 使用 Python 的 generator 模式。如果你不熟悉，這裡有個最小示例：

```python
import time
from typing import Generator

# 定義一個 generator
def count_slowly() -> Generator[int, None, None]:
    for i in range(1, 6):
        time.sleep(1)  # 模擬耗時操作
        yield i        # 逐步產出值

# 消費一個 generator
for num in count_slowly():
    print(num)  # 1, 2, 3, 4, 5（每秒一個）
```

在我們的場景中：
- `create_streaming_message()` 是 generator，逐步 yield `StreamEvent`
- 調用者用 `for...in` 消費這些事件
- 每收到一個 `text_delta` 事件就立即顯示在終端

### Lab 1 實戰指引

打開 `phase_0/client.py`，你會看到 3 個 TODO。建議的實現順序：

#### Step 1: `_call_with_retry()` — 指數退避重試

這是最底層的工具方法。先實現它，後面兩個方法就可以直接使用。

```
輸入: fn: Callable[[], Any]  — 任何 callable 操作
輸出: Any                    — fn 的返回值

偽代碼:
for attempt = 0 to maxRetries:
    try:
        return fn()
    except error:
        if error.status_code NOT IN retryable_status_codes:
            raise error  # 不可重試，直接拋出
        if attempt == maxRetries:
            raise error  # 用盡重試次數
        delay = min(base_delay_ms * 2**attempt, max_delay_ms) / 1000
        time.sleep(delay)
```

#### Step 2: `create_message()` — Non-Streaming 調用

組裝參數 → 調用 API → 轉換響應格式。

```
偽代碼:
1. params = self._build_request_params(messages, options)  # 已提供
2. raw = self._call_with_retry(
     lambda: self.client.messages.create(**params)
   )
3. return self._map_response(raw)                          # 已提供
```

**已提供的助手**：`_build_request_params()` 和 `_map_response()` 都已實現。你只需要把它們組裝起來。

#### Step 3: `create_streaming_message()` — Streaming 調用

這是最有趣的部分。你需要處理 SSE 事件流：

```
偽代碼:
1. params = self._build_request_params(messages, options)
2. with self.client.messages.stream(**params) as stream:
3.     for event in stream:
         if event.type == "content_block_delta":
           if event.delta.type == "text_delta":
             yield TextDeltaEvent(text=event.delta.text)
           if event.delta.type == "input_json_delta":
             yield ToolUseDeltaEvent(input=event.delta.partial_json)
         if event.type == "content_block_start":
           if event.content_block.type == "tool_use":
             yield ToolUseStartEvent(id=event.content_block.id,
                     name=event.content_block.name)
4.     final_msg = stream.get_final_message()
5.     yield MessageCompleteEvent(response=self._map_response(final_msg))
```

### 測試你的實現

```bash
pytest tests/test_lab1_client.py -v
```

測試使用 mock 替代了真正的 API 調用，所以**不需要 API Key**。當你看到所有綠色的 ✓ 時，Lab 1 就完成了。

---

## 0.2 概念課：Tool Use 協議——讓 LLM 長出手

### 為什麼 Tool Use 是 Agent 的關鍵

一個單純的 LLM 只能用文字回答問題。但加上 Tool Use 後，它就能：
- 讀取文件（read_file）
- 執行命令（run_shell）
- 搜索代碼（search_files）
- 調用 API（http_request）
- ...任何你定義的操作

**Tool Use 的核心機制：LLM 自己決定什麼時候用什麼工具。**

你告訴 LLM "這裡有這些工具可以用"，LLM 分析用戶的請求後，自己決定：
- 是否需要使用工具
- 使用哪個工具
- 傳什麼參數

### Tool Use 的對話流

這是理解 Tool Use 最重要的圖。請仔細看每一步：

```
Round 1:
┌────────┐     messages + tools      ┌─────┐
│  你的   │ ──────────────────────→  │     │
│  代碼   │                          │ LLM │
│        │ ←──────────────────────  │     │
└────────┘    stop_reason: tool_use  └─────┘
              content: [{
                type: "tool_use",
                name: "read_file",
                input: { path: "/src/app.py" }
              }]

你的代碼: 收到 tool_use → 查找 read_file handler → 執行 → 得到文件內容

Round 2:
┌────────┐  messages + tool_result   ┌─────┐
│  你的   │ ──────────────────────→  │     │
│  代碼   │                          │ LLM │
│        │ ←──────────────────────  │     │
└────────┘    stop_reason: end_turn  └─────┘
              content: [{
                type: "text",
                text: "這個文件定義了一個 Flask app..."
              }]

LLM 看到工具結果後，用自然語言回覆用戶。任務完成。
```

但如果任務更複雜，LLM 可能在 Round 2 之後再次要求調用工具——形成**多輪循環**：

```
User → LLM → tool_use(read_file) → tool_result → LLM → tool_use(edit_file) →
tool_result → LLM → tool_use(run_test) → tool_result → LLM → end_turn
```

**這個循環就是 Agent 的雛形。** 在 Phase 3 中，我們會把它發展為完整的 Agentic Loop。

### Messages 數組的增長過程

理解 messages 數組在 tool use 過程中如何增長，是正確實現 `tool_use_loop()` 的關鍵：

```python
# 初始狀態
messages = [
  Message(role="user", content="讀取 app.py 並告訴我它做了什麼")
]

# Round 1: LLM 回覆（stop_reason: tool_use）
# → 追加 assistant message
messages = [
  Message(role="user", content="讀取 app.py 並告訴我它做了什麼"),
  Message(role="assistant", content=[                              # ← 新增
    TextBlock(text="我來讀取這個文件。"),
    ToolUseBlock(id="toolu_01", name="read_file",
      input={ "path": "/src/app.py" })
  ])
]

# → 執行工具，追加 tool result
messages = [
  Message(role="user", content="讀取 app.py 並告訴我它做了什麼"),
  Message(role="assistant", content=[...]),
  Message(role="user", content=[                                   # ← 新增
    ToolResultBlock(tool_use_id="toolu_01",
      content="from flask import Flask\n...")
  ])
]

# Round 2: 再次調用 API，LLM 看到工具結果後最終回覆
# → 追加 assistant message
messages = [
  Message(role="user", content="讀取 app.py 並告訴我它做了什麼"),
  Message(role="assistant", content=[...]),
  Message(role="user", content=[ToolResultBlock(...)]),
  Message(role="assistant", content=[                              # ← 新增
    TextBlock(text="這個文件定義了一個 Flask 應用...")
  ])
]
```

注意兩個關鍵點：
1. **Tool result 的 role 是 "user"**，不是 "system" 或 "tool"。這是 Anthropic API 的設計約定。
2. **messages 必須交替 user/assistant**。tool_result 作為 user message，自然地維持了交替順序。

### Tool Definition 的設計

一個好的 Tool Definition 應該讓 LLM 一看就知道怎麼用。看看我們預置的 `read_file` 工具：

```python
{
  "name": "read_file",
  "description": "Read the contents of a file at the given absolute path. "
               + "Returns the file contents as a string. "
               + "Use this to examine source code, configuration files, "
               + "or any text file.",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Absolute path to the file to read, "
                     + "e.g. /home/user/project/src/index.py"
      }
    },
    "required": ["path"]
  }
}
```

注意 description 的寫法：
- **說明用途**：不只是 "讀取文件"，而是明確列出使用場景
- **參數說明附帶示例**：`e.g. /home/user/project/src/index.py`
- **強調絕對路徑**：這是 Anthropic 在 SWE-bench 中學到的教訓

> 在 Phase 1 中，我們會深入探討 Tool Description Engineering。現在只需要理解：
> 好的 description = LLM 更準確地使用工具 = 更少的錯誤 = 更好的 Agent。

---

## Lab 2：Tool System

### 學習目標

實現工具的註冊、執行和 LLM-Tool 交互循環。

### Lab 2 實戰指引

打開 `phase_0/tools.py`，你會看到 5 個 TODO。建議順序：

#### Step 1: `ToolRegistry.register()` — 工具註冊

最簡單的開始。你需要做 4 個驗證：

```
偽代碼:
1. 如果 handler.definition.name 為空 → 拋出 ValueError
2. 如果 handler.definition.description 為空 → 拋出 ValueError
3. 如果 self._handlers 已經有同名工具 → 拋出 ValueError
4. 如果 handler.definition.input_schema.type != "object" → 拋出 ValueError
5. self._handlers[name] = handler
```

#### Step 2: `ToolRegistry.unregister()` — 工具取消註冊

```
偽代碼:
1. 如果 self._handlers 沒有這個 name → 拋出 KeyError
2. del self._handlers[name]
```

#### Step 3: `ToolExecutor.execute()` — 執行單個工具

這裡的關鍵是**永遠不讓工具的錯誤中斷整個流程**——用 `is_error=True` 告訴 LLM 出錯了，讓 LLM 自己決定下一步。

```
偽代碼:
1. handler = self.registry.get(tool_call.name)
2. 如果 handler 不存在:
     return ToolResultBlock(tool_use_id=tool_call.id,
              content=f"Error: Tool '{name}' not found", is_error=True)
3. try:
     result = handler.execute(tool_call.input)
     return ToolResultBlock(tool_use_id=tool_call.id,
              content=result)
   except Exception as e:
     return ToolResultBlock(tool_use_id=tool_call.id,
              content=f"Error: {e}", is_error=True)
```

#### Step 4: `ToolExecutor.execute_all()` — 批量執行

```
偽代碼:
1. tool_calls = [block for block in response.content if isinstance(block, ToolUseBlock)]
2. results = []
3. for tool_call in tool_calls:
     result = self.execute(tool_call)
     results.append(result)
4. return results
```

#### Step 5: `tool_use_loop()` — 核心循環 ⭐⭐⭐

這是整個 Phase 0 最重要的函數。它是 Agent 的胚胎——LLM 自主決定行動，你的代碼負責執行並反饋結果。

```
偽代碼:
messages = list(initial_messages)

for iteration in range(max_iterations):
    # 1. 調用 LLM
    response = client.create_message(messages,
        LLMClientOptions(system_prompt=system_prompt, tools=tools))

    # 2. 回調（用於日誌/UI）
    if on_iteration: on_iteration(iteration, response)

    # 3. 檢查是否完成
    if response.stop_reason == "end_turn":
        # 把最後的 assistant message 加入 messages
        messages.append(Message(role="assistant", content=response.content))
        return {"response": response, "messages": messages}

    if response.stop_reason == "tool_use":
        # 4. 追加 assistant message
        messages.append(Message(role="assistant", content=response.content))

        # 5. 執行所有工具
        tool_results = executor.execute_all(response)

        # 6. 追加 tool results 作為 user message
        messages.append(Message(role="user", content=tool_results))

        # 繼續循環...

# 超過最大迭代次數
raise RuntimeError(f"Exceeded maximum iterations ({max_iterations})")
```

**常見錯誤**：
1. 忘記在 `end_turn` 時追加最後的 assistant message
2. 把 tool_result 的 role 設為 "assistant" 而不是 "user"
3. 忘記傳遞 system_prompt 和 tools 給 create_message

### 測試你的實現

```bash
pytest tests/test_lab2_tools.py -v
```

---

## 0.3 概念課：Context Window 管理——Agent 的記憶

### 為什麼需要管理 Context

在短對話中，context window 不是問題。但在 Agent 場景中：

```
一個中等複雜的編程任務：

  用戶指令:          ~100 tokens
  System prompt:    ~500 tokens
  Tool definitions: ~2,000 tokens
  ──────────────────────
  固定開銷:         ~2,600 tokens

  每輪 tool use:
    LLM 思考 + 工具調用:  ~200 tokens
    工具返回的文件內容:    ~1,000 tokens  ← 大頭
    LLM 對結果的分析:    ~300 tokens
  ──────────────────────
  每輪增長:         ~1,500 tokens

  10 輪 tool use 後:  ~17,600 tokens   ← 已經不少了
  50 輪後:            ~77,600 tokens   ← 接近一半了
  100 輪後:           ~152,600 tokens  ← 快超了
```

真實的 Agent 任務經常需要幾十輪甚至上百輪的 tool use。如果不管理 context，很快就會撞牆。

### 三種管理策略

#### 策略 1: Sliding Window（滑動窗口截斷）

最簡單的方法——直接丟棄最早的消息。

```
Before:  [msg1, msg2, msg3, msg4, msg5, msg6, msg7, msg8]
After:   [msg1, ──────── dropped ────────, msg6, msg7, msg8]
                                              ↑
                                      保留最近的 N 條
```

注意：始終保留第一條 user message（通常是任務描述）。

**優點**：簡單、快速、不消耗額外 token
**缺點**：丟失了中間的上下文，Agent 可能忘記之前做過什麼

#### 策略 2: Summarization（摘要壓縮）

調用 LLM 把舊消息壓縮成一段摘要。

```
Before:  [msg1, msg2, msg3, msg4, msg5, msg6, msg7, msg8]
         ├──── 要壓縮的部分 ────┤  ├── 保留的最近消息 ──┤

After:   [summary_msg, ack_msg, msg6, msg7, msg8]
          ↑
          "用戶請求修復 bug。Agent 已讀取 app.py 和 utils.py，
           發現問題在第 42 行的空指針引用..."
```

**優點**：保留關鍵信息，Agent 不會完全失憶
**缺點**：需要額外的 LLM 調用（消耗 token 和時間），摘要可能遺漏細節

#### 策略 3: 混合策略（推薦）

先嘗試截斷，如果截斷後仍然超限再做摘要。

```
auto_manage():
  if not near_limit → 不做操作
  if near_limit:
    先嘗試 truncate()
    if 截斷後仍然超限:
      做 summarize()
```

### 截斷的陷阱：配對消息

Tool use 的消息是**成對的**——assistant 的 tool_use 和 user 的 tool_result 必須一起出現或一起移除。如果你只移除了其中一條，API 會報錯。

```
❌ 錯誤: 只移除了 assistant message，留下孤立的 tool_result
[
  { role: "user", content: [{ type: "tool_result", ... }] },  ← 孤立！
  { role: "assistant", content: "..." },
]

✅ 正確: 成對移除
[
  { role: "assistant", content: "..." },
  { role: "user", content: "..." },
]
```

---

## Lab 3：Context Window Manager

### 學習目標

實現 token 估算、滑動窗口截斷和摘要壓縮。

### Lab 3 實戰指引

打開 `phase_0/context.py`，你會看到 6 個 TODO。建議順序：

#### Step 1: `estimate_tokens()` — Token 估算

不需要精確的 tokenizer。一個簡單的啟發式就夠了：

```
偽代碼:
if text is empty → return 0

chinese_count = 0
other_count = 0
for ch in text:
    if '\u4e00' <= ch <= '\u9fff':
        chinese_count += 1
    else:
        other_count += 1

tokens = math.ceil(other_count / 4 + chinese_count / 1.5)
return tokens
```

#### Step 2: `estimate_message_tokens()` — 消息 Token 估算

```
偽代碼:
overhead = 4  # role 等元數據的開銷

if isinstance(message.content, str):
    return overhead + self.estimate_tokens(message.content)

# content 是 list[ContentBlock]
total = overhead
for block in message.content:
    if block.type == "text":
        total += self.estimate_tokens(block.text)
    if block.type == "tool_use":
        total += self.estimate_tokens(block.name + json.dumps(block.input))
    if block.type == "tool_result":
        total += self.estimate_tokens(block.content)
return total
```

#### Step 3: `get_total_tokens()` — 計算總量

```
偽代碼:
total = self.config.reserved_output_tokens

# System prompt
total += self.estimate_tokens(self._system_prompt)

# Tool definitions
for tool in self._tools:
    total += self.estimate_tokens(
        tool.name + tool.description + json.dumps({"type": tool.input_schema.type, "properties": tool.input_schema.properties, "required": tool.input_schema.required})
    )

# All messages
for msg in self._messages:
    total += self.estimate_message_tokens(msg)

return total
```

#### Step 4: `truncate()` — 滑動窗口

```
偽代碼:
if get_total_tokens() <= max_context_tokens → return 0

removed = 0
# 從第 2 條消息開始移除（保留第 1 條 user message）
while get_total_tokens() > max_context_tokens and len(self._messages) > 1:
    del self._messages[1]  # 移除 index 1 的消息
    removed += 1

return removed
```

注意：這個簡化版本不處理配對消息問題。在測試中足以通過，但在實際 Agent 中你會想要更精確地處理。

#### Step 5: `summarize()` — 摘要壓縮

```
偽代碼:
if len(self._messages) <= 4 → return False (太少不值得壓縮)

# 計算要壓縮的消息數量
half = len(self._messages) // 2
old_messages = self._messages[:half]

# 格式化舊消息為文本
history_text = ""
for msg in old_messages:
    role = msg.role
    content = (msg.content
        if isinstance(msg.content, str)
        else json.dumps([...]))  # 序列化 content blocks
    history_text += f"[{role}]: {content}\n"

# 調用 LLM 生成摘要
response = client.create_message(
    [Message(role="user", content=
       "Summarize this conversation concisely. "
     + "Keep: task goal, completed steps, key decisions, "
     + "important file names and code details.\n\n"
     + history_text)],
    LLMClientOptions(max_tokens=500)
)

summary_text = response.content[0].text  # 假設第一個 block 是 text

# 用摘要消息替換原來的前 half 條消息
self._messages = [
    Message(role="user", content=f"[Conversation Summary]\n{summary_text}"),
    Message(role="assistant", content="I understand the context. Let me continue."),
    *self._messages[half:]
]

return True
```

#### Step 6: `auto_manage()` — 自動管理

```
偽代碼:
state = self.get_state()

if not state.is_near_limit:
    return  # 不需要操作

# 先嘗試截斷
self.truncate()

# 如果仍然超限，做摘要
if self.get_state().is_near_limit:
    self.summarize(client)
```

### 測試你的實現

```bash
pytest tests/test_lab3_context.py -v
```

---

## 0.4 整合：啟動你的第一個 Augmented LLM

當 Lab 1-3 的測試全部通過後，你就可以啟動 CLI 了：

```bash
# 設置 API Key
export ANTHROPIC_API_KEY=sk-ant-...

# 啟動
python -m phase_0.cli
```

### 試試這些

1. **基礎對話**：
   ```
   You › 用中文解釋什麼是 recursion
   ```

2. **工具調用**：
   ```
   You › 東京現在天氣怎麼樣？
   ```
   觀察 Agent 自動調用 `get_weather` 工具。

3. **文件讀取**：
   ```
   You › 讀取 /path/to/your/phase_0/cli.py 並告訴我這個文件做了什麼
   ```
   觀察 Agent 調用 `read_file` 工具然後解釋代碼。

4. **多工具鏈式調用**：
   ```
   You › 算一下 2^20 是多少，然後告訴我東京的天氣
   ```
   觀察 Agent 在一次任務中調用多個工具。

5. **Context 壓力測試**：
   進行一段很長的對話，觀察 `/context` 命令顯示的 token 使用量增長。

### 查看成績

```bash
python scripts/grade.py
```

你應該看到類似這樣的輸出：

```
╔══════════════════════════════════════════════╗
║      Phase 0: Augmented LLM Core — 評分     ║
╚══════════════════════════════════════════════╝

  Lab 1: LLM Client
  Source: phase_0/client.py
  [████████████████████████████████] 5/5 (100%)

  Lab 2: Tool System
  Source: phase_0/tools.py
  [████████████████████████████████] 8/8 (100%)

  Lab 3: Context Manager
  Source: phase_0/context.py
  [████████████████████████████████] 9/9 (100%)

────────────────────────────────────────────────
  Overall Progress
  [████████████████████████████████] 22/22 (100%)

  ★ 全部通過！ — 22/22 tests passing (100%)
```

---

## 0.5 回顧與展望

### 你在這個 Phase 學到了什麼

| 概念 | 你學到的 | 為什麼重要 |
|---|---|---|
| Messages API | 請求/響應結構、角色、內容塊 | 這是所有 LLM 應用的基礎 |
| Streaming | SSE、generator、TTFT | 生產環境必須支持 streaming |
| Retry | 指數退避、jitter、可重試錯誤 | 健壯的 API 客戶端必備 |
| Tool Use | 定義、註冊、執行、循環 | Agent 的核心能力——操作外部世界 |
| Tool Loop | LLM 自主決策 → 執行 → 反饋 → 繼續 | 這就是 Agent 的雛形 |
| Context Mgmt | Token 估算、截斷、摘要 | Agent 的長期記憶管理 |

### 你構建了什麼

```
┌────────────────────────────────────────────┐
│  my-llm-core                               │
│                                            │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │   LLM Client     │  │  Tool System   │  │
│  │  · create_message │  │  · Registry    │  │
│  │  · streaming      │  │  · Executor    │  │
│  │  · retry          │  │  · Tool Loop   │  │
│  └──────────────────┘  └────────────────┘  │
│                                            │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │ Context Manager  │  │  Sample Tools  │  │
│  │  · token count   │  │  · weather     │  │
│  │  · truncate      │  │  · read_file   │  │
│  │  · summarize     │  │  · calculator  │  │
│  └──────────────────┘  └────────────────┘  │
│                                            │
│  ┌─────────────────────────────────────┐   │
│  │  CLI (Interactive REPL)             │   │
│  └─────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

### 下一步：Phase 1 預告

你的 `tool_use_loop` 能讓 LLM 調用工具了，但工具本身還很簡單（mock 天氣、讀文件、計算器）。在 Phase 1 中，你將：

- 設計真正的 **Agent-Computer Interface (ACI)**
- 實現完整的**文件系統工具**（讀、寫、搜索、diff、編輯）
- 實現安全的 **Shell 執行器**（帶沙箱、超時、命令黑名單）
- 深入學習 **Tool Description Engineering**——如何讓工具不容易被 LLM 錯誤使用

你的 Agent 將從 "能說話" 進化為 "能動手"。

---

## 參考資料

### 必讀
1. [Anthropic Messages API](https://docs.anthropic.com/en/api/messages) — API 的完整文檔
2. [Anthropic Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) — Tool Use 的詳細指南
3. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) §Building block: The augmented LLM

### 深入閱讀
4. [Anthropic Streaming](https://docs.anthropic.com/en/api/messages-streaming) — Streaming 事件的完整列表
5. [Exponential Backoff](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) — AWS 的經典文章，解釋 jitter 的重要性
6. Python `Generator` [官方文檔](https://docs.python.org/3/reference/expressions.html#yield-expressions)

### 擴展思考
- 如果 context window 是無限的，我們還需要管理它嗎？（提示：成本和延遲）
- `tool_use_loop` 和 Phase 3 的 `agent_loop` 有什麼區別？（提示：規劃能力）
- 為什麼 Anthropic 選擇讓 tool result 作為 user message 而不是獨立角色？（提示：保持簡單）
