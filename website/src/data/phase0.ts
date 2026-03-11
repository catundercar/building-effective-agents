import type { PhaseContent } from "./types";

export const phase0Content: PhaseContent = {
  phaseId: 0,
  color: "#E8453C",
  accent: "#FF6B5E",
  lessons: [
    // ─── Lesson 1: LLM API 深度解析與 Client 實現 ───────────────────
    {
      phaseId: 0,
      lessonId: 1,
      title: "LLM API 深度解析與 Client 實現",
      subtitle: "Understanding the API & Building a Robust Client",
      type: "概念 + 實踐",
      duration: "3 hrs",
      objectives: [
        "理解 Augmented LLM 的整體架構與三大核心模塊",
        "掌握「對話是不斷增長的數組」這一心智模型",
        "深入理解 Anthropic Messages API 的請求/響應結構",
        "理解 Token、Context Window 的構成與限制",
        "掌握 Streaming vs Non-Streaming 的差異與取捨",
        "實現帶指數退避的 API Client",
        "實現 Non-streaming 和 Streaming 調用",
      ],
      sections: [
        // ── 0.0 Phase 導讀 ──
        {
          title: "Phase 導讀：為什麼從這裡開始？",
          blocks: [
            {
              type: "callout",
              variant: "quote",
              text: "Week 1-2 · The Foundation\n你即將構建的不是一個聊天機器人，而是一個能夠自主使用工具、管理記憶的智能引擎。\n這個引擎是整個 Agent 的心臟——後續每一個 Phase 都建立在它之上。",
            },
            {
              type: "heading",
              level: 3,
              text: "你在構建什麼",
            },
            {
              type: "paragraph",
              text: "想像一下 Claude Code 的工作方式：你輸入 \"幫我修復這個 bug\"，它就會：",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "讀取相關的代碼文件",
                "分析問題所在",
                "修改文件",
                "運行測試驗證",
                "如果測試失敗，繼續修改",
              ],
            },
            {
              type: "paragraph",
              text: "這一切的底層，是一個 Augmented LLM——一個被工具和記憶增強過的 LLM。Anthropic 在 \"Building Effective Agents\" 中將它定義為整個 agentic system 的基本構建塊：",
            },
            {
              type: "diagram",
              content:
                "┌─────────────────────────────────────────────┐\n│              Augmented LLM                  │\n│                                             │\n│   ┌───────────┐  ┌──────┐  ┌────────────┐  │\n│   │ Retrieval │  │ Tools │  │   Memory   │  │\n│   └─────┬─────┘  └──┬───┘  └─────┬──────┘  │\n│         │           │            │          │\n│         └───────────┼────────────┘          │\n│                     │                       │\n│              ┌──────┴──────┐                │\n│              │   LLM Core  │                │\n│              └─────────────┘                │\n└─────────────────────────────────────────────┘",
            },
            {
              type: "paragraph",
              text: "在這個 Phase 中，你要實現的就是這個方塊內的所有東西：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "LLM Core：與 Claude API 穩定通信的客戶端（Lab 1）",
                "Tools：讓 LLM 能調用外部功能的工具系統（Lab 2）",
                "Memory：管理對話歷史、防止 context 溢出的記憶系統（Lab 3）",
              ],
            },
          ],
        },
        {
          title: "心智模型：對話是一個不斷增長的數組",
          blocks: [
            {
              type: "paragraph",
              text: "理解 LLM API 最重要的一個心智模型：每次 API 調用都是無狀態的。LLM 不記得你之前說過什麼——你必須每次都把完整的對話歷史發送過去。",
            },
            {
              type: "code",
              language: "python",
              code: `# 每次調用 API，你發送的其實是這樣一個結構：
{
    "system": "You are a helpful assistant...",    # 系統指令
    "tools": [{"name": "read_file", ...}],        # 可用工具
    "messages": [                                  # 完整的對話歷史
        {"role": "user", "content": "幫我讀取 main.py"},
        {"role": "assistant", "content": [{"type": "tool_use", "name": "read_file", ...}]},
        {"role": "user", "content": [{"type": "tool_result", "content": "file content..."}]},
        {"role": "assistant", "content": "這個文件的功能是..."},
        {"role": "user", "content": "現在幫我修改第 42 行"},
        # ... 歷史越來越長
    ]
}`,
            },
            {
              type: "paragraph",
              text: "這意味著：",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "你的代碼負責管理這個 messages 數組 — 這就是「記憶」",
                "每條消息都消耗 token — 歷史太長就會超過 context window",
                "工具調用也是消息 — 工具的請求和結果都記錄在 messages 中",
              ],
            },
            {
              type: "paragraph",
              text: "這三個挑戰分別對應 Lab 1、Lab 2、Lab 3。",
            },
          ],
        },
        // ── 0.1 概念課：Messages API 深度解析 ──
        {
          title: "API 的核心概念",
          blocks: [
            {
              type: "paragraph",
              text: "在寫任何代碼之前，你需要深入理解 Anthropic Messages API 的設計。",
            },
            {
              type: "heading",
              level: 3,
              text: "消息的角色",
            },
            {
              type: "paragraph",
              text: "API 中只有兩個角色：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "user — 人類用戶的輸入（以及工具執行結果）",
                "assistant — LLM 的輸出",
              ],
            },
            {
              type: "callout",
              variant: "warning",
              text: "注意：沒有 system 角色。System prompt 是一個獨立的頂層字段，不在 messages 數組中。",
            },
            {
              type: "callout",
              variant: "info",
              text: "messages 數組必須嚴格交替：user → assistant → user → assistant → ...\n第一條必須是 user，不能有連續兩條相同 role 的消息。",
            },
            {
              type: "heading",
              level: 3,
              text: "內容塊（Content Blocks）",
            },
            {
              type: "paragraph",
              text: "每條消息的 content 可以是簡單字符串，也可以是一個 ContentBlock 數組。這很重要，因為 LLM 的一次回覆可能同時包含文字和工具調用：",
            },
            {
              type: "code",
              language: "python",
              code: `# LLM 的一次回覆可能包含多個 content blocks：
{
    "role": "assistant",
    "content": [
        {"type": "text", "text": "讓我查看這個文件的內容。"},          # 文字
        {"type": "tool_use", "id": "toolu_01A", "name": "read_file",   # 工具調用
         "input": {"path": "/src/main.py"}}
    ]
}`,
            },
            {
              type: "heading",
              level: 3,
              text: "stop_reason 的含義",
            },
            {
              type: "paragraph",
              text: "每次 API 調用結束時，stop_reason 告訴你 LLM 為什麼停止：",
            },
            {
              type: "table",
              headers: ["stop_reason", "含義", "你該怎麼做"],
              rows: [
                ["end_turn", "LLM 認為任務完成了", "將回覆展示給用戶"],
                [
                  "tool_use",
                  "LLM 想調用工具",
                  "執行工具 → 把結果送回 → 再次調用 API",
                ],
                [
                  "max_tokens",
                  "輸出達到了 token 上限",
                  "可能需要增加 max_tokens 或者讓 LLM 繼續",
                ],
              ],
            },
            {
              type: "callout",
              variant: "tip",
              text: "tool_use 是最關鍵的——它意味著 LLM 還沒說完，它在等待工具的結果。你必須執行工具，然後把結果發回去讓 LLM 繼續。",
            },
          ],
        },
        {
          title: "Token 與 Context Window",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "什麼是 Token",
            },
            {
              type: "paragraph",
              text: "Token 是 LLM 處理文本的最小單位。它不是字符也不是單詞，而是介於兩者之間的東西：",
            },
            {
              type: "diagram",
              content:
                '英文：  "Hello, world!"      → ["Hello", ",", " world", "!"]       ≈ 4 tokens\n中文：  "你好世界"            → ["你好", "世界"]                     ≈ 2-3 tokens\n代碼：  "print(\'hi\')"       → ["print", "(\'", "hi", "\')"]          ≈ 4 tokens',
            },
            {
              type: "paragraph",
              text: "粗略估算：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "英文 ≈ 每 4 個字符 1 token",
                "中文 ≈ 每 1.5 個字符 1 token",
                "代碼 ≈ 每 3 個字符 1 token",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "Context Window 的構成",
            },
            {
              type: "paragraph",
              text: "Claude 的 context window 是 200K tokens。每次 API 調用的 token 消耗如下：",
            },
            {
              type: "code",
              language: "text",
              code: `total_tokens = system_prompt_tokens
             + tool_definitions_tokens    ← 容易被忽略！
             + all_messages_tokens        ← 隨對話增長
             + max_tokens (output)        ← 為輸出預留的空間

如果 total_tokens > 200,000 → API 報錯`,
            },
            {
              type: "callout",
              variant: "warning",
              text: "一個常見的陷阱：tool definitions 也佔用 token。如果你有 20 個工具，每個的描述和 schema 加起來可能佔到幾千 tokens。這些是每次調用都會消耗的「固定開銷」。",
            },
            {
              type: "diagram",
              content:
                "┌─────────────────────── 200K Context Window ───────────────────────┐\n│                                                                   │\n│  ┌──────────────┐ ┌────────────────┐ ┌───────────────────────┐    │\n│  │ System Prompt │ │ Tool Schemas   │ │   Messages History    │    │\n│  │ (~500 tokens) │ │ (~2000 tokens) │ │  (grows over time!)   │    │\n│  └──────────────┘ └────────────────┘ └───────────────────────┘    │\n│                                                                   │\n│                              ┌──────────────────┐                 │\n│                              │ Reserved Output   │                 │\n│                              │  (4096 tokens)    │                 │\n│                              └──────────────────┘                 │\n└───────────────────────────────────────────────────────────────────┘",
            },
          ],
        },
        {
          title: "Streaming vs Non-Streaming",
          blocks: [
            {
              type: "paragraph",
              text: "Non-streaming：發送請求 → 等待 → 收到完整回覆。用戶體驗差（等待時間長），但代碼簡單。",
            },
            {
              type: "paragraph",
              text: "Streaming：發送請求 → 逐步收到 token → 組裝完整回覆。用戶體驗好（即時看到輸出），但需要處理 Server-Sent Events（SSE）。",
            },
            {
              type: "diagram",
              content:
                "Non-streaming:\n  請求 ──────────────────────────────────────→ 完整回覆\n                    (等待 2-10 秒)\n\nStreaming:\n  請求 → H → e → l → l → o →   → w → o → r → l → d → [完成]\n         ↑   ↑   ↑   ↑   ↑                              ↑\n       TTFT  (每個 delta 即時顯示)                    finalMessage",
            },
            {
              type: "paragraph",
              text: "TTFT（Time To First Token）是 streaming 的關鍵指標——用戶等待看到第一個字的時間。通常 < 500ms。",
            },
          ],
        },
        // ── Lab 1 概念鋪墊 ──
        {
          title: "核心概念：Exponential Backoff（指數退避）",
          blocks: [
            {
              type: "paragraph",
              text: "當 API 返回 429 (Rate Limited) 或 500 (Server Error) 時，你不應該立刻重試——這會加劇問題。正確的做法是指數退避：",
            },
            {
              type: "diagram",
              content:
                "第 1 次重試：等待 1 秒\n第 2 次重試：等待 2 秒\n第 3 次重試：等待 4 秒\n第 4 次重試：等待 8 秒\n...",
            },
            {
              type: "paragraph",
              text: "為了避免驚群效應（thundering herd problem）——大量客戶端在同一時刻重試，需要加入隨機抖動（jitter）：",
            },
            {
              type: "code",
              language: "text",
              code: "實際等待 = baseDelay × 2^attempt × random(0.5, 1.0)",
            },
            {
              type: "heading",
              level: 3,
              text: "哪些錯誤可以重試？",
            },
            {
              type: "table",
              headers: ["HTTP Status", "含義", "可重試？"],
              rows: [
                ["400", "Bad Request（請求格式錯誤）", "❌ 不可重試——是你的代碼問題"],
                ["401", "Unauthorized（API Key 無效）", "❌ 不可重試"],
                ["429", "Rate Limited（超出速率限制）", "✅ 等待後重試"],
                ["500", "Internal Server Error", "✅ 可能是暫時的"],
                ["502/503", "Bad Gateway / Service Unavailable", "✅ 暫時性問題"],
                ["529", "Overloaded", "✅ 等待後重試"],
              ],
            },
          ],
        },
        {
          title: "核心概念：Generator（生成器）",
          blocks: [
            {
              type: "paragraph",
              text: "Streaming 使用 generator 模式。如果你不熟悉，這裡有個最小示例：",
            },
            {
              type: "code",
              language: "python",
              code: `import time
from typing import Generator

# 定義一個 generator
def count_slowly() -> Generator[int, None, None]:
    for i in range(1, 6):
        time.sleep(1)  # 模擬耗時操作
        yield i        # 逐步產出值

# 消費一個 generator
for num in count_slowly():
    print(num)  # 1, 2, 3, 4, 5（每秒一個）`,
            },
            {
              type: "paragraph",
              text: "在我們的場景中：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "create_streaming_message() 是 generator，逐步 yield StreamEvent",
                "調用者用 for event in ... 消費這些事件",
                "每收到一個 text_delta 事件就立即顯示在終端",
              ],
            },
          ],
        },
      ],
      exercises: [
        {
          id: "0.1.1",
          title: "Step 1: _call_with_retry() — 指數退避重試",
          description:
            "這是最底層的工具方法。先實現它，後面兩個方法就可以直接使用。\n\n打開 phase_0/client.py，找到第一個 TODO。\n\n輸入: fn: Callable  — 任何可調用對象\n輸出: Any            — fn 的返回值\n\n使用 time.sleep() 實現等待。",
          labFile: "phase_0/client.py",
          hints: [
            "用 hasattr(error, 'status_code') 檢查是否有狀態碼",
            "沒有 status_code 的錯誤視為不可重試，直接拋出",
            "time.sleep(delay) 實現等待",
            "retryable_status_codes: [429, 500, 502, 503, 529]",
          ],
          pseudocode: `for attempt in range(max_retries + 1):
    try:
        return fn()
    except error:
        if error.status_code NOT IN retryable_status_codes:
            raise error  # 不可重試，直接拋出
        if attempt == max_retries:
            raise error  # 用盡重試次數
        delay = min(base_delay_ms * 2**attempt, max_delay_ms) / 1000
        time.sleep(delay)`,
        },
        {
          id: "0.1.2",
          title: "Step 2: create_message() — Non-Streaming 調用",
          description:
            "組裝參數 → 調用 API → 轉換響應格式。\n\n打開 phase_0/client.py，找到第二個 TODO。\n\n已提供的助手：_build_request_params() 和 _map_response() 都已實現。你只需要把它們組裝起來。",
          labFile: "phase_0/client.py",
          hints: [
            "_build_request_params() 和 _map_response() 已經實現好了，直接用",
            "先把 create 調用封裝成 lambda 傳給 _call_with_retry()",
            "注意 create() 的參數要用 **params 展開",
          ],
          pseudocode: `1. params = self._build_request_params(messages, options)  # 已提供
2. raw = self._call_with_retry(
       lambda: self.client.messages.create(**params)
   )
3. return self._map_response(raw)                          # 已提供`,
        },
        {
          id: "0.1.3",
          title: "Step 3: create_streaming_message() — Streaming 調用",
          description:
            "這是最有趣的部分。你需要處理 SSE 事件流。\n\n打開 phase_0/client.py，找到第三個 TODO。",
          labFile: "phase_0/client.py",
          hints: [
            "使用 self.client.messages.stream(**params) 創建 stream 上下文管理器",
            "遍歷 stream 的事件：for event in stream",
            "最後用 stream.get_final_message() 拿到完整回應做 _map_response()",
          ],
          pseudocode: `1. params = self._build_request_params(messages, options)
2. with self.client.messages.stream(**params) as stream:
3.   for event in stream:
       if event.type == "content_block_delta":
         if event.delta.type == "text_delta":
           yield TextDeltaEvent(text=event.delta.text)
         if event.delta.type == "input_json_delta":
           yield ToolUseDeltaEvent(input=event.delta.partial_json)
       if event.type == "content_block_start":
         if event.content_block.type == "tool_use":
           yield ToolUseStartEvent(id=event.content_block.id,
                   name=event.content_block.name)
4.   final_msg = stream.get_final_message()
5.   yield MessageCompleteEvent(response=self._map_response(final_msg))`,
        },
      ],
      acceptanceCriteria: [
        "create_message 能正確發送請求並返回 LLMResponse 格式",
        "system prompt 和 tools 能正確傳遞給 API",
        "tool_use 響應能正確映射（包含 id、name、input）",
        "429 錯誤自動重試，400 錯誤不重試",
        "超過最大重試次數後拋出異常",
        "streaming 能逐步 yield text_delta 事件",
        "所有 test_lab1_client.py 測試通過",
      ],
      references: [
        {
          title: "Anthropic Messages API",
          description:
            "Messages API 的完整請求/響應格式文檔，包含所有參數說明和示例。",
          url: "https://docs.anthropic.com/en/api/messages",
        },
        {
          title: "Streaming Messages",
          description:
            "Server-Sent Events 格式的 streaming 響應文檔，包含所有事件類型說明。",
          url: "https://docs.anthropic.com/en/api/messages-streaming",
        },
        {
          title: "Anthropic Python SDK",
          description:
            "官方 Python SDK 的安裝和使用指南，包含同步/異步客戶端的用法。",
          url: "https://docs.anthropic.com/en/api/client-sdks",
        },
        {
          title: "Building Effective Agents",
          description:
            "Anthropic 關於構建高效 AI Agent 的設計哲學，本課程的核心參考文獻。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Exponential Backoff and Jitter (AWS)",
          description:
            "AWS 的經典文章，解釋指數退避和 jitter 的重要性，避免驚群效應。",
          url: "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/",
        },
      ],
    },

    // ─── Lesson 2: Tool Use 協議與工具系統實現 ───────────────────
    {
      phaseId: 0,
      lessonId: 2,
      title: "Tool Use 協議與工具系統實現",
      subtitle: "Connecting LLM to the Real World",
      type: "概念 + 實踐",
      duration: "3 hrs",
      objectives: [
        "理解 Tool Use 為什麼是 Agent 的關鍵能力",
        "掌握 Tool Use 的完整對話流和多輪循環機制",
        "理解 messages 數組在 tool use 過程中的增長過程",
        "學會設計高品質的 Tool Definition",
        "實現 Tool 的註冊、執行和 LLM-Tool 交互循環",
      ],
      sections: [
        {
          title: "為什麼 Tool Use 是 Agent 的關鍵",
          blocks: [
            {
              type: "paragraph",
              text: "一個單純的 LLM 只能用文字回答問題。但加上 Tool Use 後，它就能：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "讀取文件（read_file）",
                "執行命令（run_shell）",
                "搜索代碼（search_files）",
                "調用 API（http_request）",
                "...任何你定義的操作",
              ],
            },
            {
              type: "callout",
              variant: "info",
              text: "Tool Use 的核心機制：LLM 自己決定什麼時候用什麼工具。\n\n你告訴 LLM \"這裡有這些工具可以用\"，LLM 分析用戶的請求後，自己決定：\n- 是否需要使用工具\n- 使用哪個工具\n- 傳什麼參數",
            },
          ],
        },
        {
          title: "Tool Use 的對話流",
          blocks: [
            {
              type: "paragraph",
              text: "這是理解 Tool Use 最重要的圖。請仔細看每一步：",
            },
            {
              type: "diagram",
              content:
                'Round 1:\n┌────────┐     messages + tools      ┌─────┐\n│  你的   │ ──────────────────────→  │     │\n│  代碼   │                          │ LLM │\n│        │ ←──────────────────────  │     │\n└────────┘    stop_reason: tool_use  └─────┘\n              content: [{\n                type: "tool_use",\n                name: "read_file",\n                input: { path: "/src/app.py" }\n              }]\n\n你的代碼: 收到 tool_use → 查找 read_file handler → 執行 → 得到文件內容\n\nRound 2:\n┌────────┐  messages + tool_result   ┌─────┐\n│  你的   │ ──────────────────────→  │     │\n│  代碼   │                          │ LLM │\n│        │ ←──────────────────────  │     │\n└────────┘    stop_reason: end_turn  └─────┘\n              content: [{\n                type: "text",\n                text: "這個文件定義了一個 Flask app..."\n              }]\n\nLLM 看到工具結果後，用自然語言回覆用戶。任務完成。',
            },
            {
              type: "paragraph",
              text: "但如果任務更複雜，LLM 可能在 Round 2 之後再次要求調用工具——形成多輪循環：",
            },
            {
              type: "diagram",
              content:
                "User → LLM → tool_use(read_file) → tool_result → LLM → tool_use(edit_file) → \ntool_result → LLM → tool_use(run_test) → tool_result → LLM → end_turn",
            },
            {
              type: "callout",
              variant: "tip",
              text: "這個循環就是 Agent 的雛形。在 Phase 3 中，我們會把它發展為完整的 Agentic Loop。",
            },
          ],
        },
        {
          title: "Messages 數組的增長過程",
          blocks: [
            {
              type: "paragraph",
              text: "理解 messages 數組在 tool use 過程中如何增長，是正確實現 tool_use_loop() 的關鍵：",
            },
            {
              type: "code",
              language: "python",
              code: `# 初始狀態
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
                     input={"path": "/src/app.py"})
    ])
]

# → 執行工具，追加 tool result
messages = [
    Message(role="user", content="讀取 app.py 並告訴我它做了什麼"),
    Message(role="assistant", content=[...]),
    Message(role="user", content=[                                   # ← 新增
        ToolResultBlock(tool_use_id="toolu_01",
                        content="from flask import Flask\\n...")
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
]`,
            },
            {
              type: "paragraph",
              text: "注意兩個關鍵點：",
            },
            {
              type: "list",
              ordered: true,
              items: [
                'Tool result 的 role 是 "user"，不是 "system" 或 "tool"。這是 Anthropic API 的設計約定。',
                "messages 必須交替 user/assistant。tool_result 作為 user message，自然地維持了交替順序。",
              ],
            },
          ],
        },
        {
          title: "Tool Definition 的設計",
          blocks: [
            {
              type: "paragraph",
              text: "一個好的 Tool Definition 應該讓 LLM 一看就知道怎麼用。看看我們預置的 read_file 工具：",
            },
            {
              type: "code",
              language: "python",
              code: `{
    "name": "read_file",
    "description": (
        "Read the contents of a file at the given absolute path. "
        "Returns the file contents as a string. "
        "Use this to examine source code, configuration files, "
        "or any text file."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": (
                    "Absolute path to the file to read, "
                    "e.g. /home/user/project/src/main.py"
                )
            }
        },
        "required": ["path"]
    }
}`,
            },
            {
              type: "paragraph",
              text: "注意 description 的寫法：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "說明用途：不只是 \"讀取文件\"，而是明確列出使用場景",
                "參數說明附帶示例：e.g. /home/user/project/src/main.py",
                "強調絕對路徑：這是 Anthropic 在 SWE-bench 中學到的教訓",
              ],
            },
            {
              type: "callout",
              variant: "quote",
              text: "在 Phase 1 中，我們會深入探討 Tool Description Engineering。現在只需要理解：\n好的 description = LLM 更準確地使用工具 = 更少的錯誤 = 更好的 Agent。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "0.2.1",
          title: "Step 1: ToolRegistry.register() — 工具註冊",
          description:
            "最簡單的開始。你需要做 4 個驗證。\n\n打開 phase_0/tools.py，找到第一個 TODO。",
          labFile: "phase_0/tools.py",
          hints: [
            "用 dict 存儲 name → ToolHandler 的映射",
            "驗證失敗時拋出 ValueError 並附帶清晰的錯誤信息",
            "參考已實現的 get()、list_definitions() 了解數據結構",
          ],
          pseudocode: `1. 如果 handler.definition.name 為空 → raise ValueError
2. 如果 handler.definition.description 為空 → raise ValueError
3. 如果 self._handlers 已經有同名工具 → raise ValueError
4. 如果 handler.definition.input_schema.type != "object" → raise ValueError
5. self._handlers[name] = handler`,
        },
        {
          id: "0.2.2",
          title: "Step 2: ToolRegistry.unregister() — 工具取消註冊",
          description:
            "打開 phase_0/tools.py，找到第二個 TODO。",
          labFile: "phase_0/tools.py",
          hints: [
            "檢查 tool 是否存在，不存在則拋出異常",
            "從內部 dict 中刪除",
          ],
          pseudocode: `1. 如果 name 不在 self._handlers 中 → raise KeyError
2. del self._handlers[name]`,
        },
        {
          id: "0.2.3",
          title: "Step 3: ToolExecutor.execute() — 執行單個工具",
          description:
            "這裡的關鍵是永遠不讓工具的錯誤中斷整個流程——用 is_error: true 告訴 LLM 出錯了，讓 LLM 自己決定下一步。\n\n打開 phase_0/tools.py，找到第三個 TODO。",
          labFile: "phase_0/tools.py",
          hints: [
            "execute 不應該拋出異常——所有錯誤都轉為 is_error=True 的結果",
            "execute_all 按順序執行（不並行），因為 tool 之間可能有依賴",
            "篩選 tool_use blocks: [b for b in content if b.type == 'tool_use']",
          ],
          pseudocode: `1. handler = self.registry.get(tool_call.name)
2. 如果 handler 不存在:
     return ToolResultBlock(tool_use_id=tool_call.id,
              content=f"Tool not found: {name}", is_error=True)
3. try:
       result = handler.execute(tool_call.input)
       return ToolResultBlock(tool_use_id=tool_call.id,
              content=result)
   except Exception as e:
       return ToolResultBlock(tool_use_id=tool_call.id,
              content=str(e), is_error=True)`,
        },
        {
          id: "0.2.4",
          title: "Step 4: ToolExecutor.execute_all() — 批量執行",
          description:
            "打開 phase_0/tools.py，找到第四個 TODO。",
          labFile: "phase_0/tools.py",
          hints: [
            "從 response.content 篩選出所有 ToolUseBlock",
            "依次調用 execute()",
            "返回所有結果的列表",
          ],
          pseudocode: `1. tool_calls = [b for b in response.content if b.type == "tool_use"]
2. results = []
3. for tool_call in tool_calls:
       result = self.execute(tool_call)
       results.append(result)
4. return results`,
        },
        {
          id: "0.2.5",
          title: "Step 5: tool_use_loop() — 核心循環",
          description:
            "這是整個 Phase 0 最重要的函數。它是 Agent 的胚胎——LLM 自主決定行動，你的代碼負責執行並反饋結果。\n\n打開 phase_0/tools.py，找到第五個 TODO。\n\n常見錯誤：\n1. 忘記在 end_turn 時追加最後的 assistant message\n2. 把 tool_result 的 role 設為 \"assistant\" 而不是 \"user\"\n3. 忘記傳遞 system_prompt 和 tools 給 create_message",
          labFile: "phase_0/tools.py",
          hints: [
            "assistant message: Message(role='assistant', content=response.content)",
            "tool results message: Message(role='user', content=results_list)",
            "記得把 tools 和 system_prompt 傳給每次 create_message() 調用",
          ],
          pseudocode: `messages = list(initial_messages)

for iteration in range(max_iterations):
    # 1. 調用 LLM
    response = client.create_message(messages, LLMClientOptions(
        system_prompt=system_prompt, tools=tools
    ))

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
raise RuntimeError(f"Exceeded maximum iterations ({max_iterations})")`,
        },
      ],
      acceptanceCriteria: [
        "ToolRegistry 能註冊、獲取、取消註冊工具",
        "重複名稱、空名稱、空描述都能正確拒絕",
        "ToolExecutor 能執行工具並返回結果",
        "未知工具和執行錯誤都返回 is_error=True 的結果",
        "execute_all 能批量處理 response 中的所有 tool 調用",
        "tool_use_loop 能正確循環直到 end_turn",
        "超過 max_iterations 時拋出異常",
        "所有 test_lab2_tools.py 測試通過",
      ],
      references: [
        {
          title: "Anthropic Tool Use 文檔",
          description:
            "Tool Use 的完整指南，包含定義格式、API 請求示例、多輪交互流程。",
          url: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview",
        },
        {
          title: "JSON Schema 入門",
          description:
            "理解 JSON Schema 的核心概念：type、properties、required、description。Tool 定義的基礎。",
          url: "https://json-schema.org/understanding-json-schema/",
        },
        {
          title: "Anthropic Python SDK",
          description:
            "SDK 中 Tool Use 相關的 API 用法，包含 tool_use 和 tool_result 的處理示例。",
          url: "https://docs.anthropic.com/en/api/client-sdks",
        },
      ],
    },

    // ─── Lesson 3: Context Window 管理策略 ──────────────────────
    {
      phaseId: 0,
      lessonId: 3,
      title: "Context Window 管理策略",
      subtitle: "Managing the Memory Limit",
      type: "概念 + 實踐",
      duration: "2 hrs",
      objectives: [
        "理解 Agent 場景下 context window 增長的速度和壓力",
        "掌握三種 context 管理策略：滑動窗口、摘要壓縮、混合策略",
        "理解截斷時「配對消息」的陷阱",
        "實現 token 估算、滑動窗口截斷和摘要壓縮",
      ],
      sections: [
        {
          title: "為什麼需要管理 Context",
          blocks: [
            {
              type: "paragraph",
              text: "在短對話中，context window 不是問題。但在 Agent 場景中：",
            },
            {
              type: "diagram",
              content:
                "一個中等複雜的編程任務：\n\n  用戶指令:          ~100 tokens\n  System prompt:    ~500 tokens\n  Tool definitions: ~2,000 tokens\n  ──────────────────────\n  固定開銷:         ~2,600 tokens\n\n  每輪 tool use:\n    LLM 思考 + 工具調用:  ~200 tokens\n    工具返回的文件內容:    ~1,000 tokens  ← 大頭\n    LLM 對結果的分析:    ~300 tokens\n  ──────────────────────\n  每輪增長:         ~1,500 tokens\n\n  10 輪 tool use 後:  ~17,600 tokens   ← 已經不少了\n  50 輪後:            ~77,600 tokens   ← 接近一半了\n  100 輪後:           ~152,600 tokens  ← 快超了",
            },
            {
              type: "paragraph",
              text: "真實的 Agent 任務經常需要幾十輪甚至上百輪的 tool use。如果不管理 context，很快就會撞牆。",
            },
          ],
        },
        {
          title: "三種管理策略",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "策略 1: Sliding Window（滑動窗口截斷）",
            },
            {
              type: "paragraph",
              text: "最簡單的方法——直接丟棄最早的消息。",
            },
            {
              type: "diagram",
              content:
                "Before:  [msg1, msg2, msg3, msg4, msg5, msg6, msg7, msg8]\nAfter:   [msg1, ──────── dropped ────────, msg6, msg7, msg8]\n                                              ↑\n                                      保留最近的 N 條",
            },
            {
              type: "paragraph",
              text: "注意：始終保留第一條 user message（通常是任務描述）。",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "優點：簡單、快速、不消耗額外 token",
                "缺點：丟失了中間的上下文，Agent 可能忘記之前做過什麼",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "策略 2: Summarization（摘要壓縮）",
            },
            {
              type: "paragraph",
              text: "調用 LLM 把舊消息壓縮成一段摘要。",
            },
            {
              type: "diagram",
              content:
                'Before:  [msg1, msg2, msg3, msg4, msg5, msg6, msg7, msg8]\n         ├──── 要壓縮的部分 ────┤  ├── 保留的最近消息 ──┤\n\nAfter:   [summary_msg, ack_msg, msg6, msg7, msg8]\n          ↑\n          "用戶請求修復 bug。Agent 已讀取 app.py 和 utils.py，\n           發現問題在第 42 行的空指針引用..."',
            },
            {
              type: "list",
              ordered: false,
              items: [
                "優點：保留關鍵信息，Agent 不會完全失憶",
                "缺點：需要額外的 LLM 調用（消耗 token 和時間），摘要可能遺漏細節",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "策略 3: 混合策略（推薦）",
            },
            {
              type: "paragraph",
              text: "先嘗試截斷，如果截斷後仍然超限再做摘要。",
            },
            {
              type: "code",
              language: "text",
              code: `auto_manage():
  if not is_near_limit → 不做操作
  if is_near_limit:
    先嘗試 truncate()
    if 截斷後仍然超限:
      做 summarize()`,
            },
          ],
        },
        {
          title: "截斷的陷阱：配對消息",
          blocks: [
            {
              type: "paragraph",
              text: "Tool use 的消息是成對的——assistant 的 tool_use 和 user 的 tool_result 必須一起出現或一起移除。如果你只移除了其中一條，API 會報錯。",
            },
            {
              type: "code",
              language: "python",
              code: `# ❌ 錯誤: 只移除了 assistant message，留下孤立的 tool_result
[
    Message(role="user", content=[ToolResultBlock(...)]),  # ← 孤立！
    Message(role="assistant", content="..."),
]

# ✅ 正確: 成對移除
[
    Message(role="assistant", content="..."),
    Message(role="user", content="..."),
]`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "0.3.1",
          title: "Step 1: estimate_tokens() — Token 估算",
          description:
            "不需要精確的 tokenizer。一個簡單的啟發式就夠了。\n\n打開 phase_0/context.py，找到第一個 TODO。",
          labFile: "phase_0/context.py",
          hints: [
            "用 ord(c) > 127 判斷非 ASCII 字符",
            "math.ceil() 向上取整",
            "空字符串返回 0",
          ],
          pseudocode: `if not text:
    return 0

ascii_count = 0
non_ascii_count = 0
for ch in text:
    if ord(ch) < 128:
        ascii_count += 1
    else:
        non_ascii_count += 1

tokens = math.ceil(ascii_count / 4 + non_ascii_count / 1.5)
return tokens`,
        },
        {
          id: "0.3.2",
          title: "Step 2: estimate_message_tokens() — 消息 Token 估算",
          description:
            "打開 phase_0/context.py，找到第二個 TODO。",
          labFile: "phase_0/context.py",
          hints: [
            "ToolUseBlock 的 token: 估算 name + json.dumps(input)",
            "str content → 直接估算",
            "list[ContentBlock] → 累加每個 block + overhead",
          ],
          pseudocode: `overhead = 4  # role 等元數據的開銷

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
return total`,
        },
        {
          id: "0.3.3",
          title: "Step 3: get_total_tokens() — 計算總量",
          description:
            "打開 phase_0/context.py，找到第三個 TODO。",
          labFile: "phase_0/context.py",
          hints: [
            "別忘了 reserved_output_tokens",
            "tool definitions 也消耗 token：name + description + json.dumps(input_schema)",
            "遍歷所有 messages 累加",
          ],
          pseudocode: `total = self.config.reserved_output_tokens

# System prompt
total += self.estimate_tokens(self._system_prompt)

# Tool definitions
for tool in self._tools:
    total += self.estimate_tokens(
        tool.name + tool.description + json.dumps(vars(tool.input_schema))
    )

# All messages
for msg in self._messages:
    total += self.estimate_message_tokens(msg)

return total`,
        },
        {
          id: "0.3.4",
          title: "Step 4: truncate() — 滑動窗口",
          description:
            "打開 phase_0/context.py，找到第四個 TODO。\n\n注意：這個簡化版本不處理配對消息問題。在測試中足以通過，但在實際 Agent 中你會想要更精確地處理。",
          labFile: "phase_0/context.py",
          hints: [
            "用 while 循環 + pop(1) 移除第二條（index=1）",
            "注意：self._messages 列表至少要保留一條",
            "如果只剩第一條還超限，也要停止（避免移除所有 messages）",
          ],
          pseudocode: `if self.get_total_tokens() <= self.config.max_context_tokens:
    return 0

removed = 0
# 從第 2 條消息開始移除（保留第 1 條 user message）
while self.get_total_tokens() > self.config.max_context_tokens and len(self._messages) > 1:
    self._messages.pop(1)  # 移除 index 1 的消息
    removed += 1

return removed`,
        },
        {
          id: "0.3.5",
          title: "Step 5: summarize() — 摘要壓縮",
          description:
            "打開 phase_0/context.py，找到第五個 TODO。",
          labFile: "phase_0/context.py",
          hints: [
            "摘要 prompt: 'Summarize this conversation concisely...'",
            "ack message: Message(role='assistant', content='I understand the context. Let me continue.')",
            "messages ≤ 4 條時不值得壓縮，直接返回 False",
          ],
          pseudocode: `if len(self._messages) <= 4:
    return False  # 太少不值得壓縮

# 取前半部分消息壓縮
half = len(self._messages) // 2
old_messages = self._messages[:half]
recent_messages = self._messages[half:]

# 格式化舊消息為文本
history_text = ""
for msg in old_messages:
    role = msg.role
    text = msg.content if isinstance(msg.content, str) \
           else json.dumps([vars(b) for b in msg.content])
    history_text += f"[{role}]: {text}\\n"

# 調用 LLM 生成摘要
response = client.create_message(
    [Message(role="user", content=
       "你是一個對話摘要助手。請將以下對話壓縮為簡潔的摘要，保留關鍵信息。\\n\\n"
     + history_text)],
    LLMClientOptions(max_tokens=500)
)

summary_text = response.content[0].text  # 假設第一個 block 是 text

# 重建 messages
self._messages = [
    Message(role="user",      content="[Conversation Summary]\\n" + summary_text),
    Message(role="assistant", content="I understand the context. Let me continue."),
    *recent_messages
]

return True`,
        },
        {
          id: "0.3.6",
          title: "Step 6: auto_manage() — 自動管理",
          description:
            "打開 phase_0/context.py，找到第六個 TODO。",
          labFile: "phase_0/context.py",
          hints: [
            "用 self.get_state().is_near_limit 判斷是否需要操作",
            "先嘗試 truncate，仍超限則 summarize",
            "不需要返回值，直接修改內部狀態",
          ],
          pseudocode: `state = self.get_state()

if not state.is_near_limit:
    return  # 不需要操作

# 先嘗試截斷
self.truncate()

# 如果仍然超限，做摘要
if self.get_state().is_near_limit:
    self.summarize(client)`,
        },
      ],
      acceptanceCriteria: [
        "英文、中文、混合文本的 token 估算在合理範圍",
        "空字符串返回 0，長文本按比例增長",
        "Message token 估算支持 string 和 ContentBlock 兩種格式",
        "get_total_tokens 包含 system prompt、tools、messages、reserved 四部分",
        "截斷能正確移除最早的 messages 並保留第一條",
        "摘要能壓縮舊 messages 並保留最近 4 條",
        "auto_manage 在不超限時不操作，超限時自動處理",
        "所有 test_lab3_context.py 測試通過",
      ],
      references: [
        {
          title: "Building Effective Agents",
          description:
            "Anthropic 的 Agent 設計哲學。Augmented LLM 部分討論了 context 管理的重要性。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Anthropic Messages API",
          description: "API 文檔中關於 token 計算、usage 統計的說明。",
          url: "https://docs.anthropic.com/en/api/messages",
        },
        {
          title: "Token Counting（Anthropic）",
          description:
            "Anthropic 官方的 token 計數 API，可用於精確計算（本 Lab 使用估算替代）。",
          url: "https://docs.anthropic.com/en/docs/build-with-claude/token-counting",
        },
      ],
    },

    // ─── Lesson 4: 整合與回顧 ──────────────────────────────────
    {
      phaseId: 0,
      lessonId: 4,
      title: "整合與回顧",
      subtitle: "Bringing It All Together",
      type: "項目實踐",
      duration: "2 hrs",
      objectives: [
        "將 Lab 1-3 的模塊整合為一個可運行的 CLI 工具",
        "通過端到端場景測試驗證整體功能",
        "體驗完整的 Augmented LLM 工作流",
        "回顧本 Phase 所學的所有概念",
        "理解各模塊之間的協作關係與下一步方向",
      ],
      sections: [
        {
          title: "啟動你的第一個 Augmented LLM",
          blocks: [
            {
              type: "paragraph",
              text: "當 Lab 1-3 的測試全部通過後，你就可以啟動 CLI 了：",
            },
            {
              type: "code",
              language: "bash",
              code: `# 設置 API Key
export ANTHROPIC_API_KEY=sk-ant-...

# 啟動
python -m phase_0.cli`,
            },
            {
              type: "heading",
              level: 3,
              text: "試試這些",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "基礎對話：「用中文解釋什麼是 recursion」",
                "工具調用：「東京現在天氣怎麼樣？」— 觀察 Agent 自動調用 get_weather 工具",
                "文件讀取：「讀取 /path/to/your/phase_0/cli.py 並告訴我這個文件做了什麼」— 觀察 Agent 調用 read_file 工具然後解釋代碼",
                "多工具鏈式調用：「算一下 2^20 是多少，然後告訴我東京的天氣」— 觀察 Agent 在一次任務中調用多個工具",
                "Context 壓力測試：進行一段很長的對話，觀察 /context 命令顯示的 token 使用量增長",
              ],
            },
          ],
        },
        {
          title: "查看成績",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: "python scripts/grade.py",
            },
            {
              type: "paragraph",
              text: "你應該看到類似這樣的輸出：",
            },
            {
              type: "diagram",
              content:
                "═══════════════════════════════════════════\n  Phase 0 · Grading Report\n═══════════════════════════════════════════\n\n  Lab 1: LLM Client\n  ████████████████████ 100%  (5/5 tests)\n\n  Lab 2: Tool System\n  ████████████████████ 100%  (8/8 tests)\n\n  Lab 3: Context Manager\n  ████████████████████ 100%  (9/9 tests)\n\n─────────────────────────────────────────────\n  Overall: 22/22 tests passed (100%)\n\n  All tests passed! Phase 0 complete.",
            },
          ],
        },
        {
          title: "回顧：你在這個 Phase 學到了什麼",
          blocks: [
            {
              type: "table",
              headers: ["概念", "你學到的", "為什麼重要"],
              rows: [
                [
                  "Messages API",
                  "請求/響應結構、角色、內容塊",
                  "這是所有 LLM 應用的基礎",
                ],
                [
                  "Streaming",
                  "SSE、generator、TTFT",
                  "生產環境必須支持 streaming",
                ],
                [
                  "Retry",
                  "指數退避、jitter、可重試錯誤",
                  "健壯的 API 客戶端必備",
                ],
                [
                  "Tool Use",
                  "定義、註冊、執行、循環",
                  "Agent 的核心能力——操作外部世界",
                ],
                [
                  "Tool Loop",
                  "LLM 自主決策 → 執行 → 反饋 → 繼續",
                  "這就是 Agent 的雛形",
                ],
                [
                  "Context Mgmt",
                  "Token 估算、截斷、摘要",
                  "Agent 的長期記憶管理",
                ],
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
                "┌────────────────────────────────────────────┐\n│  my-llm-core                               │\n│                                            │\n│  ┌──────────────────┐  ┌────────────────┐  │\n│  │   LLM Client     │  │  Tool System   │  │\n│  │  · create_message │  │  · Registry    │  │\n│  │  · streaming      │  │  · Executor    │  │\n│  │  · retry          │  │  · Tool Loop   │  │\n│  └──────────────────┘  └────────────────┘  │\n│                                            │\n│  ┌──────────────────┐  ┌────────────────┐  │\n│  │ Context Manager  │  │  Sample Tools  │  │\n│  │  · token count   │  │  · weather     │  │\n│  │  · truncate      │  │  · read_file   │  │\n│  │  · summarize     │  │  · calculator  │  │\n│  └──────────────────┘  └────────────────┘  │\n│                                            │\n│  ┌─────────────────────────────────────┐   │\n│  │  CLI (Interactive REPL)             │   │\n│  └─────────────────────────────────────┘   │\n└────────────────────────────────────────────┘",
            },
          ],
        },
        {
          title: "下一步：Phase 1 預告",
          blocks: [
            {
              type: "paragraph",
              text: "你的 tool_use_loop 能讓 LLM 調用工具了，但工具本身還很簡單（mock 天氣、讀文件、計算器）。在 Phase 1 中，你將：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "設計真正的 Agent-Computer Interface (ACI)",
                "實現完整的文件系統工具（讀、寫、搜索、diff、編輯）",
                "實現安全的 Shell 執行器（帶沙箱、超時、命令黑名單）",
                "深入學習 Tool Description Engineering——如何讓工具不容易被 LLM 錯誤使用",
              ],
            },
            {
              type: "paragraph",
              text: "你的 Agent 將從 \"能說話\" 進化為 \"能動手\"。",
            },
          ],
        },
        {
          title: "擴展思考",
          blocks: [
            {
              type: "list",
              ordered: false,
              items: [
                "如果 context window 是無限的，我們還需要管理它嗎？（提示：成本和延遲）",
                "tool_use_loop 和 Phase 3 的 agent_loop 有什麼區別？（提示：規劃能力）",
                "為什麼 Anthropic 選擇讓 tool result 作為 user message 而不是獨立角色？（提示：保持簡單）",
              ],
            },
          ],
        },
      ],
      exercises: [
        {
          id: "0.4.1",
          title: "運行全部測試",
          description:
            "運行完整測試套件，確保 Lab 1-3 的所有 TODO 都已正確實現。\n\n目標：全部測試通過，grade.py 顯示 100%。\n如果有失敗的測試，回到對應的 Lab 文件修復。",
          labFile: "phase_0/",
          hints: [
            "pytest -v 顯示每個測試的詳細結果",
            "pytest tests/test_lab1_client.py 單獨運行某個 Lab 的測試",
            "pytest -x 遇到第一個失敗就停止，方便逐個修復",
          ],
          pseudocode: `# 運行所有測試
pytest -v

# 查看成績報告
python scripts/grade.py`,
        },
        {
          id: "0.4.2",
          title: "啟動 CLI 體驗完整功能",
          description:
            "設置 API Key 並啟動 CLI，體驗你親手構建的 Augmented LLM。\n\n嘗試以下場景：\n- 普通對話：「你好，介紹一下你自己」\n- Tool 調用：「東京的天氣怎麼樣？」\n- 文件讀取：「讀一下 /path/to/some/file」\n- 多 Tool：「幫我算一下 sqrt(144)，順便查查北京天氣」\n- 長對話：持續對話 20+ 輪，觀察 context 管理",
          labFile: "phase_0/cli.py",
          hints: [
            "如果沒有 API Key，可以先跳過這步——測試已經覆蓋了所有邏輯",
            "/context 命令查看 context window 使用情況",
            "/tools 命令列出已註冊的工具",
          ],
          pseudocode: `# 設置 API Key
export ANTHROPIC_API_KEY=your-key-here

# 啟動 CLI
python -m phase_0.cli

# CLI 中可用的指令：
# /tools    — 列出已註冊的工具
# /context  — 查看 context window 使用情況
# /clear    — 清空對話歷史
# /exit     — 退出`,
        },
        {
          id: "0.4.3",
          title: "端到端場景測試",
          description:
            "在 CLI 中嘗試多工具鏈式調用和 context 壓力測試，觀察你的 Augmented LLM 在真實場景下的表現。",
          labFile: "phase_0/cli.py",
          hints: [
            "觀察 Agent 調用多個工具時的消息增長過程",
            "用 /context 命令監控 token 使用量",
            "嘗試讓對話超過 20 輪，看 context 管理是否自動觸發",
          ],
        },
      ],
      acceptanceCriteria: [
        "pytest 全部測試通過",
        "grade.py 顯示 100% 完成度",
        "python -m phase_0.cli 可正常啟動（需 API Key）",
        "Tool 調用在終端正確顯示調用詳情",
        "長對話場景下 context 自動壓縮",
      ],
      references: [
        {
          title: "pytest 文檔",
          description:
            "Python 測試框架 pytest 的完整文檔，包含 fixture、parametrize、mock 等進階用法。",
          url: "https://docs.pytest.org/en/stable/",
        },
        {
          title: "Building Effective Agents",
          description:
            "回顧 Augmented LLM 部分——你剛剛實現了這個架構的完整原型。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Anthropic Messages API",
          description:
            "API 參考文檔，包含認證、錯誤碼、rate limits 等全面信息。",
          url: "https://docs.anthropic.com/en/api/messages",
        },
      ],
    },
  ],
};
