import type { PhaseContent } from "./types";

export const phase0ContentZhCN: PhaseContent = {
  phaseId: 0,
  color: "#E8453C",
  accent: "#FF6B5E",
  lessons: [
    // ─── Lesson 1: LLM API 深度解析与 Client 实现 ───────────────────
    {
      phaseId: 0,
      lessonId: 1,
      title: "LLM API 深度解析与 Client 实现",
      subtitle: "Understanding the API & Building a Robust Client",
      type: "概念 + 实践",
      duration: "3 hrs",
      objectives: [
        "理解 Augmented LLM 的整体架构与三大核心模块",
        "掌握「对话是不断增长的数组」这一心智模型",
        "深入理解 Anthropic Messages API 的请求/响应结构",
        "理解 Token、Context Window 的构成与限制",
        "掌握 Streaming vs Non-Streaming 的差异与取舍",
        "实现带指数退避的 API Client",
        "实现 Non-streaming 和 Streaming 调用",
      ],
      sections: [
        // ── 0.0 Phase 导读 ──
        {
          title: "Phase 导读：为什么从这里开始？",
          blocks: [
            {
              type: "callout",
              variant: "quote",
              text: "Week 1-2 · The Foundation\n你即将构建的不是一个聊天机器人，而是一个能够自主使用工具、管理记忆的智能引擎。\n这个引擎是整个 Agent 的心脏——后续每一个 Phase 都建立在它之上。",
            },
            {
              type: "heading",
              level: 3,
              text: "你在构建什么",
            },
            {
              type: "paragraph",
              text: "想像一下 Claude Code 的工作方式：你输入 \"帮我修复这个 bug\"，它就会：",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "读取相关的代码文件",
                "分析问题所在",
                "修改文件",
                "运行测试验证",
                "如果测试失败，继续修改",
              ],
            },
            {
              type: "paragraph",
              text: "这一切的底层，是一个 Augmented LLM——一个被工具和记忆增强过的 LLM。Anthropic 在 \"Building Effective Agents\" 中将它定义为整个 agentic system 的基本构建块：",
            },
            {
              type: "diagram",
              content:
                "┌─────────────────────────────────────────────┐\n│              Augmented LLM                  │\n│                                             │\n│   ┌───────────┐  ┌──────┐  ┌────────────┐  │\n│   │ Retrieval │  │ Tools │  │   Memory   │  │\n│   └─────┬─────┘  └──┬───┘  └─────┬──────┘  │\n│         │           │            │          │\n│         └───────────┼────────────┘          │\n│                     │                       │\n│              ┌──────┴──────┐                │\n│              │   LLM Core  │                │\n│              └─────────────┘                │\n└─────────────────────────────────────────────┘",
            },
            {
              type: "paragraph",
              text: "在这个 Phase 中，你要实现的就是这个方块内的所有东西：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "LLM Core：与 Claude API 稳定通信的客户端（Lab 1）",
                "Tools：让 LLM 能调用外部功能的工具系统（Lab 2）",
                "Memory：管理对话历史、防止 context 溢出的记忆系统（Lab 3）",
              ],
            },
          ],
        },
        {
          title: "心智模型：对话是一个不断增长的数组",
          blocks: [
            {
              type: "paragraph",
              text: "理解 LLM API 最重要的一个心智模型：每次 API 调用都是无状态的。LLM 不记得你之前说过什么——你必须每次都把完整的对话历史发送过去。",
            },
            {
              type: "code",
              language: "python",
              code: `# 每次调用 API，你发送的其实是这样一个结构：
{
    "system": "You are a helpful assistant...",    # 系统指令
    "tools": [{"name": "read_file", ...}],        # 可用工具
    "messages": [                                  # 完整的对话历史
        {"role": "user", "content": "帮我读取 main.py"},
        {"role": "assistant", "content": [{"type": "tool_use", "name": "read_file", ...}]},
        {"role": "user", "content": [{"type": "tool_result", "content": "file content..."}]},
        {"role": "assistant", "content": "这个文件的功能是..."},
        {"role": "user", "content": "现在帮我修改第 42 行"},
        # ... 历史越来越长
    ]
}`,
            },
            {
              type: "paragraph",
              text: "这意味著：",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "你的代码负责管理这个 messages 数组 — 这就是「记忆」",
                "每条消息都消耗 token — 历史太长就会超过 context window",
                "工具调用也是消息 — 工具的请求和结果都记录在 messages 中",
              ],
            },
            {
              type: "paragraph",
              text: "这三个挑战分别对应 Lab 1、Lab 2、Lab 3。",
            },
          ],
        },
        // ── 0.1 概念课：Messages API 深度解析 ──
        {
          title: "API 的核心概念",
          blocks: [
            {
              type: "paragraph",
              text: "在写任何代码之前，你需要深入理解 Anthropic Messages API 的设计。",
            },
            {
              type: "heading",
              level: 3,
              text: "消息的角色",
            },
            {
              type: "paragraph",
              text: "API 中只有两个角色：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "user — 人类用户的输入（以及工具执行结果）",
                "assistant — LLM 的输出",
              ],
            },
            {
              type: "callout",
              variant: "warning",
              text: "注意：没有 system 角色。System prompt 是一个独立的顶层字段，不在 messages 数组中。",
            },
            {
              type: "callout",
              variant: "info",
              text: "messages 数组必须严格交替：user → assistant → user → assistant → ...\n第一条必须是 user，不能有连续两条相同 role 的消息。",
            },
            {
              type: "heading",
              level: 3,
              text: "内容块（Content Blocks）",
            },
            {
              type: "paragraph",
              text: "每条消息的 content 可以是简单字符串，也可以是一个 ContentBlock 数组。这很重要，因为 LLM 的一次回复可能同时包含文字和工具调用：",
            },
            {
              type: "code",
              language: "python",
              code: `# LLM 的一次回复可能包含多个 content blocks：
{
    "role": "assistant",
    "content": [
        {"type": "text", "text": "让我查看这个文件的内容。"},          # 文字
        {"type": "tool_use", "id": "toolu_01A", "name": "read_file",   # 工具调用
         "input": {"path": "/src/main.py"}}
    ]
}`,
            },
            {
              type: "heading",
              level: 3,
              text: "stop_reason 的含义",
            },
            {
              type: "paragraph",
              text: "每次 API 调用结束时，stop_reason 告诉你 LLM 为什么停止：",
            },
            {
              type: "table",
              headers: ["stop_reason", "含义", "你该怎么做"],
              rows: [
                ["end_turn", "LLM 认为任务完成了", "将回复展示给用户"],
                [
                  "tool_use",
                  "LLM 想调用工具",
                  "执行工具 → 把结果送回 → 再次调用 API",
                ],
                [
                  "max_tokens",
                  "输出达到了 token 上限",
                  "可能需要增加 max_tokens 或者让 LLM 继续",
                ],
              ],
            },
            {
              type: "callout",
              variant: "tip",
              text: "tool_use 是最关键的——它意味著 LLM 还没说完，它在等待工具的结果。你必须执行工具，然后把结果发回去让 LLM 继续。",
            },
          ],
        },
        {
          title: "Token 与 Context Window",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "什么是 Token",
            },
            {
              type: "paragraph",
              text: "Token 是 LLM 处理文本的最小单位。它不是字符也不是单词，而是介于两者之间的东西：",
            },
            {
              type: "diagram",
              content:
                '英文：  "Hello, world!"      → ["Hello", ",", " world", "!"]       ≈ 4 tokens\n中文：  "你好世界"            → ["你好", "世界"]                     ≈ 2-3 tokens\n代码：  "print(\'hi\')"       → ["print", "(\'", "hi", "\')"]          ≈ 4 tokens',
            },
            {
              type: "paragraph",
              text: "粗略估算：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "英文 ≈ 每 4 个字符 1 token",
                "中文 ≈ 每 1.5 个字符 1 token",
                "代码 ≈ 每 3 个字符 1 token",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "Context Window 的构成",
            },
            {
              type: "paragraph",
              text: "Claude 的 context window 是 200K tokens。每次 API 调用的 token 消耗如下：",
            },
            {
              type: "code",
              language: "text",
              code: `total_tokens = system_prompt_tokens
             + tool_definitions_tokens    ← 容易被忽略！
             + all_messages_tokens        ← 随对话增长
             + max_tokens (output)        ← 为输出预留的空间

如果 total_tokens > 200,000 → API 报错`,
            },
            {
              type: "callout",
              variant: "warning",
              text: "一个常见的陷阱：tool definitions 也占用 token。如果你有 20 个工具，每个的描述和 schema 加起来可能占到几千 tokens。这些是每次调用都会消耗的「固定开销」。",
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
              text: "Non-streaming：发送请求 → 等待 → 收到完整回复。用户体验差（等待时间长），但代码简单。",
            },
            {
              type: "paragraph",
              text: "Streaming：发送请求 → 逐步收到 token → 组装完整回复。用户体验好（即时看到输出），但需要处理 Server-Sent Events（SSE）。",
            },
            {
              type: "diagram",
              content:
                "Non-streaming:\n  请求 ──────────────────────────────────────→ 完整回复\n                    (等待 2-10 秒)\n\nStreaming:\n  请求 → H → e → l → l → o →   → w → o → r → l → d → [完成]\n         ↑   ↑   ↑   ↑   ↑                              ↑\n       TTFT  (每个 delta 即时显示)                    finalMessage",
            },
            {
              type: "paragraph",
              text: "TTFT（Time To First Token）是 streaming 的关键指标——用户等待看到第一个字的时间。通常 < 500ms。",
            },
          ],
        },
        // ── Lab 1 概念铺垫 ──
        {
          title: "核心概念：Exponential Backoff（指数退避）",
          blocks: [
            {
              type: "paragraph",
              text: "当 API 返回 429 (Rate Limited) 或 500 (Server Error) 时，你不应该立刻重试——这会加剧问题。正确的做法是指数退避：",
            },
            {
              type: "diagram",
              content:
                "第 1 次重试：等待 1 秒\n第 2 次重试：等待 2 秒\n第 3 次重试：等待 4 秒\n第 4 次重试：等待 8 秒\n...",
            },
            {
              type: "paragraph",
              text: "为了避免惊群效应（thundering herd problem）——大量客户端在同一时刻重试，需要加入随机抖动（jitter）：",
            },
            {
              type: "code",
              language: "text",
              code: "实际等待 = baseDelay × 2^attempt × random(0.5, 1.0)",
            },
            {
              type: "heading",
              level: 3,
              text: "哪些错误可以重试？",
            },
            {
              type: "table",
              headers: ["HTTP Status", "含义", "可重试？"],
              rows: [
                ["400", "Bad Request（请求格式错误）", "❌ 不可重试——是你的代码问题"],
                ["401", "Unauthorized（API Key 无效）", "❌ 不可重试"],
                ["429", "Rate Limited（超出速率限制）", "✅ 等待后重试"],
                ["500", "Internal Server Error", "✅ 可能是暂时的"],
                ["502/503", "Bad Gateway / Service Unavailable", "✅ 暂时性问题"],
                ["529", "Overloaded", "✅ 等待后重试"],
              ],
            },
          ],
        },
        {
          title: "核心概念：Generator（生成器）",
          blocks: [
            {
              type: "paragraph",
              text: "Streaming 使用 generator 模式。如果你不熟悉，这里有个最小示例：",
            },
            {
              type: "code",
              language: "python",
              code: `import time
from typing import Generator

# 定义一个 generator
def count_slowly() -> Generator[int, None, None]:
    for i in range(1, 6):
        time.sleep(1)  # 模拟耗时操作
        yield i        # 逐步产出值

# 消费一个 generator
for num in count_slowly():
    print(num)  # 1, 2, 3, 4, 5（每秒一个）`,
            },
            {
              type: "paragraph",
              text: "在我们的场景中：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "create_streaming_message() 是 generator，逐步 yield StreamEvent",
                "调用者用 for event in ... 消费这些事件",
                "每收到一个 text_delta 事件就立即显示在终端",
              ],
            },
          ],
        },
      ],
      exercises: [
        {
          id: "0.1.1",
          title: "Step 1: _call_with_retry() — 指数退避重试",
          description:
            "这是最底层的工具方法。先实现它，后面两个方法就可以直接使用。\n\n打开 phase_0/client.py，找到第一个 TODO。\n\n输入: fn: Callable  — 任何可调用对象\n输出: Any            — fn 的返回值\n\n使用 time.sleep() 实现等待。",
          labFile: "phase_0/client.py",
          hints: [
            "用 hasattr(error, 'status_code') 检查是否有状态码",
            "没有 status_code 的错误视为不可重试，直接抛出",
            "time.sleep(delay) 实现等待",
            "retryable_status_codes: [429, 500, 502, 503, 529]",
          ],
          pseudocode: `for attempt in range(max_retries + 1):
    try:
        return fn()
    except error:
        if error.status_code NOT IN retryable_status_codes:
            raise error  # 不可重试，直接抛出
        if attempt == max_retries:
            raise error  # 用尽重试次数
        delay = min(base_delay_ms * 2**attempt, max_delay_ms) / 1000
        time.sleep(delay)`,
        },
        {
          id: "0.1.2",
          title: "Step 2: create_message() — Non-Streaming 调用",
          description:
            "组装参数 → 调用 API → 转换响应格式。\n\n打开 phase_0/client.py，找到第二个 TODO。\n\n已提供的助手：_build_request_params() 和 _map_response() 都已实现。你只需要把它们组装起来。",
          labFile: "phase_0/client.py",
          hints: [
            "_build_request_params() 和 _map_response() 已经实现好了，直接用",
            "先把 create 调用封装成 lambda 传给 _call_with_retry()",
            "注意 create() 的参数要用 **params 展开",
          ],
          pseudocode: `1. params = self._build_request_params(messages, options)  # 已提供
2. raw = self._call_with_retry(
       lambda: self.client.messages.create(**params)
   )
3. return self._map_response(raw)                          # 已提供`,
        },
        {
          id: "0.1.3",
          title: "Step 3: create_streaming_message() — Streaming 调用",
          description:
            "这是最有趣的部分。你需要处理 SSE 事件流。\n\n打开 phase_0/client.py，找到第三个 TODO。",
          labFile: "phase_0/client.py",
          hints: [
            "使用 self.client.messages.stream(**params) 创建 stream 上下文管理器",
            "遍历 stream 的事件：for event in stream",
            "最后用 stream.get_final_message() 拿到完整回应做 _map_response()",
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
        "create_message 能正确发送请求并返回 LLMResponse 格式",
        "system prompt 和 tools 能正确传递给 API",
        "tool_use 响应能正确映射（包含 id、name、input）",
        "429 错误自动重试，400 错误不重试",
        "超过最大重试次数后抛出异常",
        "streaming 能逐步 yield text_delta 事件",
        "所有 test_lab1_client.py 测试通过",
      ],
      references: [
        {
          title: "Anthropic Messages API",
          description:
            "Messages API 的完整请求/响应格式文档，包含所有参数说明和示例。",
          url: "https://docs.anthropic.com/en/api/messages",
        },
        {
          title: "Streaming Messages",
          description:
            "Server-Sent Events 格式的 streaming 响应文档，包含所有事件类型说明。",
          url: "https://docs.anthropic.com/en/api/messages-streaming",
        },
        {
          title: "Anthropic Python SDK",
          description:
            "官方 Python SDK 的安装和使用指南，包含同步/异步客户端的用法。",
          url: "https://docs.anthropic.com/en/api/client-sdks",
        },
        {
          title: "Building Effective Agents",
          description:
            "Anthropic 关于构建高效 AI Agent 的设计哲学，本课程的核心参考文献。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Exponential Backoff and Jitter (AWS)",
          description:
            "AWS 的经典文章，解释指数退避和 jitter 的重要性，避免惊群效应。",
          url: "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/",
        },
      ],
    },

    // ─── Lesson 2: Tool Use 协议与工具系统实现 ───────────────────
    {
      phaseId: 0,
      lessonId: 2,
      title: "Tool Use 协议与工具系统实现",
      subtitle: "Connecting LLM to the Real World",
      type: "概念 + 实践",
      duration: "3 hrs",
      objectives: [
        "理解 Tool Use 为什么是 Agent 的关键能力",
        "掌握 Tool Use 的完整对话流和多轮循环机制",
        "理解 messages 数组在 tool use 过程中的增长过程",
        "学会设计高品质的 Tool Definition",
        "实现 Tool 的注册、执行和 LLM-Tool 交互循环",
      ],
      sections: [
        {
          title: "为什么 Tool Use 是 Agent 的关键",
          blocks: [
            {
              type: "paragraph",
              text: "一个单纯的 LLM 只能用文字回答问题。但加上 Tool Use 后，它就能：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "读取文件（read_file）",
                "执行命令（run_shell）",
                "搜索代码（search_files）",
                "调用 API（http_request）",
                "...任何你定义的操作",
              ],
            },
            {
              type: "callout",
              variant: "info",
              text: "Tool Use 的核心机制：LLM 自己决定什么时候用什么工具。\n\n你告诉 LLM \"这里有这些工具可以用\"，LLM 分析用户的请求后，自己决定：\n- 是否需要使用工具\n- 使用哪个工具\n- 传什么参数",
            },
          ],
        },
        {
          title: "Tool Use 的对话流",
          blocks: [
            {
              type: "paragraph",
              text: "这是理解 Tool Use 最重要的图。请仔细看每一步：",
            },
            {
              type: "diagram",
              content:
                'Round 1:\n┌────────┐     messages + tools      ┌─────┐\n│  你的   │ ──────────────────────→  │     │\n│  代码   │                          │ LLM │\n│        │ ←──────────────────────  │     │\n└────────┘    stop_reason: tool_use  └─────┘\n              content: [{\n                type: "tool_use",\n                name: "read_file",\n                input: { path: "/src/app.py" }\n              }]\n\n你的代码: 收到 tool_use → 查找 read_file handler → 执行 → 得到文件内容\n\nRound 2:\n┌────────┐  messages + tool_result   ┌─────┐\n│  你的   │ ──────────────────────→  │     │\n│  代码   │                          │ LLM │\n│        │ ←──────────────────────  │     │\n└────────┘    stop_reason: end_turn  └─────┘\n              content: [{\n                type: "text",\n                text: "这个文件定义了一个 Flask app..."\n              }]\n\nLLM 看到工具结果后，用自然语言回复用户。任务完成。',
            },
            {
              type: "paragraph",
              text: "但如果任务更复杂，LLM 可能在 Round 2 之后再次要求调用工具——形成多轮循环：",
            },
            {
              type: "diagram",
              content:
                "User → LLM → tool_use(read_file) → tool_result → LLM → tool_use(edit_file) → \ntool_result → LLM → tool_use(run_test) → tool_result → LLM → end_turn",
            },
            {
              type: "callout",
              variant: "tip",
              text: "这个循环就是 Agent 的雏形。在 Phase 3 中，我们会把它发展为完整的 Agentic Loop。",
            },
          ],
        },
        {
          title: "Messages 数组的增长过程",
          blocks: [
            {
              type: "paragraph",
              text: "理解 messages 数组在 tool use 过程中如何增长，是正确实现 tool_use_loop() 的关键：",
            },
            {
              type: "code",
              language: "python",
              code: `# 初始状态
messages = [
    Message(role="user", content="读取 app.py 并告诉我它做了什么")
]

# Round 1: LLM 回复（stop_reason: tool_use）
# → 追加 assistant message
messages = [
    Message(role="user", content="读取 app.py 并告诉我它做了什么"),
    Message(role="assistant", content=[                              # ← 新增
        TextBlock(text="我来读取这个文件。"),
        ToolUseBlock(id="toolu_01", name="read_file",
                     input={"path": "/src/app.py"})
    ])
]

# → 执行工具，追加 tool result
messages = [
    Message(role="user", content="读取 app.py 并告诉我它做了什么"),
    Message(role="assistant", content=[...]),
    Message(role="user", content=[                                   # ← 新增
        ToolResultBlock(tool_use_id="toolu_01",
                        content="from flask import Flask\\n...")
    ])
]

# Round 2: 再次调用 API，LLM 看到工具结果后最终回复
# → 追加 assistant message
messages = [
    Message(role="user", content="读取 app.py 并告诉我它做了什么"),
    Message(role="assistant", content=[...]),
    Message(role="user", content=[ToolResultBlock(...)]),
    Message(role="assistant", content=[                              # ← 新增
        TextBlock(text="这个文件定义了一个 Flask 应用...")
    ])
]`,
            },
            {
              type: "paragraph",
              text: "注意两个关键点：",
            },
            {
              type: "list",
              ordered: true,
              items: [
                'Tool result 的 role 是 "user"，不是 "system" 或 "tool"。这是 Anthropic API 的设计约定。',
                "messages 必须交替 user/assistant。tool_result 作为 user message，自然地维持了交替顺序。",
              ],
            },
          ],
        },
        {
          title: "Tool Definition 的设计",
          blocks: [
            {
              type: "paragraph",
              text: "一个好的 Tool Definition 应该让 LLM 一看就知道怎么用。看看我们预置的 read_file 工具：",
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
              text: "注意 description 的写法：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "说明用途：不只是 \"读取文件\"，而是明确列出使用场景",
                "参数说明附带示例：e.g. /home/user/project/src/main.py",
                "强调绝对路径：这是 Anthropic 在 SWE-bench 中学到的教训",
              ],
            },
            {
              type: "callout",
              variant: "quote",
              text: "在 Phase 1 中，我们会深入探讨 Tool Description Engineering。现在只需要理解：\n好的 description = LLM 更准确地使用工具 = 更少的错误 = 更好的 Agent。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "0.2.1",
          title: "Step 1: ToolRegistry.register() — 工具注册",
          description:
            "最简单的开始。你需要做 4 个验证。\n\n打开 phase_0/tools.py，找到第一个 TODO。",
          labFile: "phase_0/tools.py",
          hints: [
            "用 dict 存储 name → ToolHandler 的映射",
            "验证失败时抛出 ValueError 并附带清晰的错误信息",
            "参考已实现的 get()、list_definitions() 了解数据结构",
          ],
          pseudocode: `1. 如果 handler.definition.name 为空 → raise ValueError
2. 如果 handler.definition.description 为空 → raise ValueError
3. 如果 self._handlers 已经有同名工具 → raise ValueError
4. 如果 handler.definition.input_schema.type != "object" → raise ValueError
5. self._handlers[name] = handler`,
        },
        {
          id: "0.2.2",
          title: "Step 2: ToolRegistry.unregister() — 工具取消注册",
          description:
            "打开 phase_0/tools.py，找到第二个 TODO。",
          labFile: "phase_0/tools.py",
          hints: [
            "检查 tool 是否存在，不存在则抛出异常",
            "从内部 dict 中删除",
          ],
          pseudocode: `1. 如果 name 不在 self._handlers 中 → raise KeyError
2. del self._handlers[name]`,
        },
        {
          id: "0.2.3",
          title: "Step 3: ToolExecutor.execute() — 执行单个工具",
          description:
            "这里的关键是永远不让工具的错误中断整个流程——用 is_error: true 告诉 LLM 出错了，让 LLM 自己决定下一步。\n\n打开 phase_0/tools.py，找到第三个 TODO。",
          labFile: "phase_0/tools.py",
          hints: [
            "execute 不应该抛出异常——所有错误都转为 is_error=True 的结果",
            "execute_all 按顺序执行（不并行），因为 tool 之间可能有依赖",
            "筛选 tool_use blocks: [b for b in content if b.type == 'tool_use']",
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
          title: "Step 4: ToolExecutor.execute_all() — 批量执行",
          description:
            "打开 phase_0/tools.py，找到第四个 TODO。",
          labFile: "phase_0/tools.py",
          hints: [
            "从 response.content 筛选出所有 ToolUseBlock",
            "依次调用 execute()",
            "返回所有结果的列表",
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
          title: "Step 5: tool_use_loop() — 核心循环",
          description:
            "这是整个 Phase 0 最重要的函数。它是 Agent 的胚胎——LLM 自主决定行动，你的代码负责执行并反馈结果。\n\n打开 phase_0/tools.py，找到第五个 TODO。\n\n常见错误：\n1. 忘记在 end_turn 时追加最后的 assistant message\n2. 把 tool_result 的 role 设为 \"assistant\" 而不是 \"user\"\n3. 忘记传递 system_prompt 和 tools 给 create_message",
          labFile: "phase_0/tools.py",
          hints: [
            "assistant message: Message(role='assistant', content=response.content)",
            "tool results message: Message(role='user', content=results_list)",
            "记得把 tools 和 system_prompt 传给每次 create_message() 调用",
          ],
          pseudocode: `messages = list(initial_messages)

for iteration in range(max_iterations):
    # 1. 调用 LLM
    response = client.create_message(messages, LLMClientOptions(
        system_prompt=system_prompt, tools=tools
    ))

    # 2. 回调（用于日志/UI）
    if on_iteration: on_iteration(iteration, response)

    # 3. 检查是否完成
    if response.stop_reason == "end_turn":
        # 把最后的 assistant message 加入 messages
        messages.append(Message(role="assistant", content=response.content))
        return {"response": response, "messages": messages}

    if response.stop_reason == "tool_use":
        # 4. 追加 assistant message
        messages.append(Message(role="assistant", content=response.content))

        # 5. 执行所有工具
        tool_results = executor.execute_all(response)

        # 6. 追加 tool results 作为 user message
        messages.append(Message(role="user", content=tool_results))

        # 继续循环...

# 超过最大迭代次数
raise RuntimeError(f"Exceeded maximum iterations ({max_iterations})")`,
        },
      ],
      acceptanceCriteria: [
        "ToolRegistry 能注册、获取、取消注册工具",
        "重复名称、空名称、空描述都能正确拒绝",
        "ToolExecutor 能执行工具并返回结果",
        "未知工具和执行错误都返回 is_error=True 的结果",
        "execute_all 能批量处理 response 中的所有 tool 调用",
        "tool_use_loop 能正确循环直到 end_turn",
        "超过 max_iterations 时抛出异常",
        "所有 test_lab2_tools.py 测试通过",
      ],
      references: [
        {
          title: "Anthropic Tool Use 文档",
          description:
            "Tool Use 的完整指南，包含定义格式、API 请求示例、多轮交互流程。",
          url: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview",
        },
        {
          title: "JSON Schema 入门",
          description:
            "理解 JSON Schema 的核心概念：type、properties、required、description。Tool 定义的基础。",
          url: "https://json-schema.org/understanding-json-schema/",
        },
        {
          title: "Anthropic Python SDK",
          description:
            "SDK 中 Tool Use 相关的 API 用法，包含 tool_use 和 tool_result 的处理示例。",
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
      type: "概念 + 实践",
      duration: "2 hrs",
      objectives: [
        "理解 Agent 场景下 context window 增长的速度和压力",
        "掌握三种 context 管理策略：滑动窗口、摘要压缩、混合策略",
        "理解截断时「配对消息」的陷阱",
        "实现 token 估算、滑动窗口截断和摘要压缩",
      ],
      sections: [
        {
          title: "为什么需要管理 Context",
          blocks: [
            {
              type: "paragraph",
              text: "在短对话中，context window 不是问题。但在 Agent 场景中：",
            },
            {
              type: "diagram",
              content:
                "一个中等复杂的编程任务：\n\n  用户指令:          ~100 tokens\n  System prompt:    ~500 tokens\n  Tool definitions: ~2,000 tokens\n  ──────────────────────\n  固定开销:         ~2,600 tokens\n\n  每轮 tool use:\n    LLM 思考 + 工具调用:  ~200 tokens\n    工具返回的文件内容:    ~1,000 tokens  ← 大头\n    LLM 对结果的分析:    ~300 tokens\n  ──────────────────────\n  每轮增长:         ~1,500 tokens\n\n  10 轮 tool use 后:  ~17,600 tokens   ← 已经不少了\n  50 轮后:            ~77,600 tokens   ← 接近一半了\n  100 轮后:           ~152,600 tokens  ← 快超了",
            },
            {
              type: "paragraph",
              text: "真实的 Agent 任务经常需要几十轮甚至上百轮的 tool use。如果不管理 context，很快就会撞墙。",
            },
          ],
        },
        {
          title: "三种管理策略",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "策略 1: Sliding Window（滑动窗口截断）",
            },
            {
              type: "paragraph",
              text: "最简单的方法——直接丢弃最早的消息。",
            },
            {
              type: "diagram",
              content:
                "Before:  [msg1, msg2, msg3, msg4, msg5, msg6, msg7, msg8]\nAfter:   [msg1, ──────── dropped ────────, msg6, msg7, msg8]\n                                              ↑\n                                      保留最近的 N 条",
            },
            {
              type: "paragraph",
              text: "注意：始终保留第一条 user message（通常是任务描述）。",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "优点：简单、快速、不消耗额外 token",
                "缺点：丢失了中间的上下文，Agent 可能忘记之前做过什么",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "策略 2: Summarization（摘要压缩）",
            },
            {
              type: "paragraph",
              text: "调用 LLM 把旧消息压缩成一段摘要。",
            },
            {
              type: "diagram",
              content:
                'Before:  [msg1, msg2, msg3, msg4, msg5, msg6, msg7, msg8]\n         ├──── 要压缩的部分 ────┤  ├── 保留的最近消息 ──┤\n\nAfter:   [summary_msg, ack_msg, msg6, msg7, msg8]\n          ↑\n          "用户请求修复 bug。Agent 已读取 app.py 和 utils.py，\n           发现问题在第 42 行的空指针引用..."',
            },
            {
              type: "list",
              ordered: false,
              items: [
                "优点：保留关键信息，Agent 不会完全失忆",
                "缺点：需要额外的 LLM 调用（消耗 token 和时间），摘要可能遗漏细节",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "策略 3: 混合策略（推荐）",
            },
            {
              type: "paragraph",
              text: "先尝试截断，如果截断后仍然超限再做摘要。",
            },
            {
              type: "code",
              language: "text",
              code: `auto_manage():
  if not is_near_limit → 不做操作
  if is_near_limit:
    先尝试 truncate()
    if 截断后仍然超限:
      做 summarize()`,
            },
          ],
        },
        {
          title: "截断的陷阱：配对消息",
          blocks: [
            {
              type: "paragraph",
              text: "Tool use 的消息是成对的——assistant 的 tool_use 和 user 的 tool_result 必须一起出现或一起移除。如果你只移除了其中一条，API 会报错。",
            },
            {
              type: "code",
              language: "python",
              code: `# ❌ 错误: 只移除了 assistant message，留下孤立的 tool_result
[
    Message(role="user", content=[ToolResultBlock(...)]),  # ← 孤立！
    Message(role="assistant", content="..."),
]

# ✅ 正确: 成对移除
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
            "不需要精确的 tokenizer。一个简单的启发式就够了。\n\n打开 phase_0/context.py，找到第一个 TODO。",
          labFile: "phase_0/context.py",
          hints: [
            "用 ord(c) > 127 判断非 ASCII 字符",
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
            "打开 phase_0/context.py，找到第二个 TODO。",
          labFile: "phase_0/context.py",
          hints: [
            "ToolUseBlock 的 token: 估算 name + json.dumps(input)",
            "str content → 直接估算",
            "list[ContentBlock] → 累加每个 block + overhead",
          ],
          pseudocode: `overhead = 4  # role 等元数据的开销

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
          title: "Step 3: get_total_tokens() — 计算总量",
          description:
            "打开 phase_0/context.py，找到第三个 TODO。",
          labFile: "phase_0/context.py",
          hints: [
            "别忘了 reserved_output_tokens",
            "tool definitions 也消耗 token：name + description + json.dumps(input_schema)",
            "遍历所有 messages 累加",
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
          title: "Step 4: truncate() — 滑动窗口",
          description:
            "打开 phase_0/context.py，找到第四个 TODO。\n\n注意：这个简化版本不处理配对消息问题。在测试中足以通过，但在实际 Agent 中你会想要更精确地处理。",
          labFile: "phase_0/context.py",
          hints: [
            "用 while 循环 + pop(1) 移除第二条（index=1）",
            "注意：self._messages 列表至少要保留一条",
            "如果只剩第一条还超限，也要停止（避免移除所有 messages）",
          ],
          pseudocode: `if self.get_total_tokens() <= self.config.max_context_tokens:
    return 0

removed = 0
# 从第 2 条消息开始移除（保留第 1 条 user message）
while self.get_total_tokens() > self.config.max_context_tokens and len(self._messages) > 1:
    self._messages.pop(1)  # 移除 index 1 的消息
    removed += 1

return removed`,
        },
        {
          id: "0.3.5",
          title: "Step 5: summarize() — 摘要压缩",
          description:
            "打开 phase_0/context.py，找到第五个 TODO。",
          labFile: "phase_0/context.py",
          hints: [
            "摘要 prompt: 'Summarize this conversation concisely...'",
            "ack message: Message(role='assistant', content='I understand the context. Let me continue.')",
            "messages ≤ 4 条时不值得压缩，直接返回 False",
          ],
          pseudocode: `if len(self._messages) <= 4:
    return False  # 太少不值得压缩

# 取前半部分消息压缩
half = len(self._messages) // 2
old_messages = self._messages[:half]
recent_messages = self._messages[half:]

# 格式化旧消息为文本
history_text = ""
for msg in old_messages:
    role = msg.role
    text = msg.content if isinstance(msg.content, str) \
           else json.dumps([vars(b) for b in msg.content])
    history_text += f"[{role}]: {text}\\n"

# 调用 LLM 生成摘要
response = client.create_message(
    [Message(role="user", content=
       "你是一个对话摘要助手。请将以下对话压缩为简洁的摘要，保留关键信息。\\n\\n"
     + history_text)],
    LLMClientOptions(max_tokens=500)
)

summary_text = response.content[0].text  # 假设第一个 block 是 text

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
          title: "Step 6: auto_manage() — 自动管理",
          description:
            "打开 phase_0/context.py，找到第六个 TODO。",
          labFile: "phase_0/context.py",
          hints: [
            "用 self.get_state().is_near_limit 判断是否需要操作",
            "先尝试 truncate，仍超限则 summarize",
            "不需要返回值，直接修改内部状态",
          ],
          pseudocode: `state = self.get_state()

if not state.is_near_limit:
    return  # 不需要操作

# 先尝试截断
self.truncate()

# 如果仍然超限，做摘要
if self.get_state().is_near_limit:
    self.summarize(client)`,
        },
      ],
      acceptanceCriteria: [
        "英文、中文、混合文本的 token 估算在合理范围",
        "空字符串返回 0，长文本按比例增长",
        "Message token 估算支持 string 和 ContentBlock 两种格式",
        "get_total_tokens 包含 system prompt、tools、messages、reserved 四部分",
        "截断能正确移除最早的 messages 并保留第一条",
        "摘要能压缩旧 messages 并保留最近 4 条",
        "auto_manage 在不超限时不操作，超限时自动处理",
        "所有 test_lab3_context.py 测试通过",
      ],
      references: [
        {
          title: "Building Effective Agents",
          description:
            "Anthropic 的 Agent 设计哲学。Augmented LLM 部分讨论了 context 管理的重要性。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Anthropic Messages API",
          description: "API 文档中关于 token 计算、usage 统计的说明。",
          url: "https://docs.anthropic.com/en/api/messages",
        },
        {
          title: "Token Counting（Anthropic）",
          description:
            "Anthropic 官方的 token 计数 API，可用于精确计算（本 Lab 使用估算替代）。",
          url: "https://docs.anthropic.com/en/docs/build-with-claude/token-counting",
        },
      ],
    },

    // ─── Lesson 4: 整合与回顾 ──────────────────────────────────
    {
      phaseId: 0,
      lessonId: 4,
      title: "整合与回顾",
      subtitle: "Bringing It All Together",
      type: "项目实践",
      duration: "2 hrs",
      objectives: [
        "将 Lab 1-3 的模块整合为一个可运行的 CLI 工具",
        "通过端到端场景测试验证整体功能",
        "体验完整的 Augmented LLM 工作流",
        "回顾本 Phase 所学的所有概念",
        "理解各模块之间的协作关系与下一步方向",
      ],
      sections: [
        {
          title: "启动你的第一个 Augmented LLM",
          blocks: [
            {
              type: "paragraph",
              text: "当 Lab 1-3 的测试全部通过后，你就可以启动 CLI 了：",
            },
            {
              type: "code",
              language: "bash",
              code: `# 设置 API Key
export ANTHROPIC_API_KEY=sk-ant-...

# 启动
python -m phase_0.cli`,
            },
            {
              type: "heading",
              level: 3,
              text: "试试这些",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "基础对话：「用中文解释什么是 recursion」",
                "工具调用：「东京现在天气怎么样？」— 观察 Agent 自动调用 get_weather 工具",
                "文件读取：「读取 /path/to/your/phase_0/cli.py 并告诉我这个文件做了什么」— 观察 Agent 调用 read_file 工具然后解释代码",
                "多工具链式调用：「算一下 2^20 是多少，然后告诉我东京的天气」— 观察 Agent 在一次任务中调用多个工具",
                "Context 压力测试：进行一段很长的对话，观察 /context 命令显示的 token 使用量增长",
              ],
            },
          ],
        },
        {
          title: "查看成绩",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: "python scripts/grade.py",
            },
            {
              type: "paragraph",
              text: "你应该看到类似这样的输出：",
            },
            {
              type: "diagram",
              content:
                "═══════════════════════════════════════════\n  Phase 0 · Grading Report\n═══════════════════════════════════════════\n\n  Lab 1: LLM Client\n  ████████████████████ 100%  (5/5 tests)\n\n  Lab 2: Tool System\n  ████████████████████ 100%  (8/8 tests)\n\n  Lab 3: Context Manager\n  ████████████████████ 100%  (9/9 tests)\n\n─────────────────────────────────────────────\n  Overall: 22/22 tests passed (100%)\n\n  All tests passed! Phase 0 complete.",
            },
          ],
        },
        {
          title: "回顾：你在这个 Phase 学到了什么",
          blocks: [
            {
              type: "table",
              headers: ["概念", "你学到的", "为什么重要"],
              rows: [
                [
                  "Messages API",
                  "请求/响应结构、角色、内容块",
                  "这是所有 LLM 应用的基础",
                ],
                [
                  "Streaming",
                  "SSE、generator、TTFT",
                  "生产环境必须支持 streaming",
                ],
                [
                  "Retry",
                  "指数退避、jitter、可重试错误",
                  "健壮的 API 客户端必备",
                ],
                [
                  "Tool Use",
                  "定义、注册、执行、循环",
                  "Agent 的核心能力——操作外部世界",
                ],
                [
                  "Tool Loop",
                  "LLM 自主决策 → 执行 → 反馈 → 继续",
                  "这就是 Agent 的雏形",
                ],
                [
                  "Context Mgmt",
                  "Token 估算、截断、摘要",
                  "Agent 的长期记忆管理",
                ],
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
                "┌────────────────────────────────────────────┐\n│  my-llm-core                               │\n│                                            │\n│  ┌──────────────────┐  ┌────────────────┐  │\n│  │   LLM Client     │  │  Tool System   │  │\n│  │  · create_message │  │  · Registry    │  │\n│  │  · streaming      │  │  · Executor    │  │\n│  │  · retry          │  │  · Tool Loop   │  │\n│  └──────────────────┘  └────────────────┘  │\n│                                            │\n│  ┌──────────────────┐  ┌────────────────┐  │\n│  │ Context Manager  │  │  Sample Tools  │  │\n│  │  · token count   │  │  · weather     │  │\n│  │  · truncate      │  │  · read_file   │  │\n│  │  · summarize     │  │  · calculator  │  │\n│  └──────────────────┘  └────────────────┘  │\n│                                            │\n│  ┌─────────────────────────────────────┐   │\n│  │  CLI (Interactive REPL)             │   │\n│  └─────────────────────────────────────┘   │\n└────────────────────────────────────────────┘",
            },
          ],
        },
        {
          title: "下一步：Phase 1 预告",
          blocks: [
            {
              type: "paragraph",
              text: "你的 tool_use_loop 能让 LLM 调用工具了，但工具本身还很简单（mock 天气、读文件、计算器）。在 Phase 1 中，你将：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "设计真正的 Agent-Computer Interface (ACI)",
                "实现完整的文件系统工具（读、写、搜索、diff、编辑）",
                "实现安全的 Shell 执行器（带沙箱、超时、命令黑名单）",
                "深入学习 Tool Description Engineering——如何让工具不容易被 LLM 错误使用",
              ],
            },
            {
              type: "paragraph",
              text: "你的 Agent 将从 \"能说话\" 进化为 \"能动手\"。",
            },
          ],
        },
        {
          title: "扩展思考",
          blocks: [
            {
              type: "list",
              ordered: false,
              items: [
                "如果 context window 是无限的，我们还需要管理它吗？（提示：成本和延迟）",
                "tool_use_loop 和 Phase 3 的 agent_loop 有什么区别？（提示：规划能力）",
                "为什么 Anthropic 选择让 tool result 作为 user message 而不是独立角色？（提示：保持简单）",
              ],
            },
          ],
        },
      ],
      exercises: [
        {
          id: "0.4.1",
          title: "运行全部测试",
          description:
            "运行完整测试套件，确保 Lab 1-3 的所有 TODO 都已正确实现。\n\n目标：全部测试通过，grade.py 显示 100%。\n如果有失败的测试，回到对应的 Lab 文件修复。",
          labFile: "phase_0/",
          hints: [
            "pytest -v 显示每个测试的详细结果",
            "pytest tests/test_lab1_client.py 单独运行某个 Lab 的测试",
            "pytest -x 遇到第一个失败就停止，方便逐个修复",
          ],
          pseudocode: `# 运行所有测试
pytest -v

# 查看成绩报告
python scripts/grade.py`,
        },
        {
          id: "0.4.2",
          title: "启动 CLI 体验完整功能",
          description:
            "设置 API Key 并启动 CLI，体验你亲手构建的 Augmented LLM。\n\n尝试以下场景：\n- 普通对话：「你好，介绍一下你自己」\n- Tool 调用：「东京的天气怎么样？」\n- 文件读取：「读一下 /path/to/some/file」\n- 多 Tool：「帮我算一下 sqrt(144)，顺便查查北京天气」\n- 长对话：持续对话 20+ 轮，观察 context 管理",
          labFile: "phase_0/cli.py",
          hints: [
            "如果没有 API Key，可以先跳过这步——测试已经覆盖了所有逻辑",
            "/context 命令查看 context window 使用情况",
            "/tools 命令列出已注册的工具",
          ],
          pseudocode: `# 设置 API Key
export ANTHROPIC_API_KEY=your-key-here

# 启动 CLI
python -m phase_0.cli

# CLI 中可用的指令：
# /tools    — 列出已注册的工具
# /context  — 查看 context window 使用情况
# /clear    — 清空对话历史
# /exit     — 退出`,
        },
        {
          id: "0.4.3",
          title: "端到端场景测试",
          description:
            "在 CLI 中尝试多工具链式调用和 context 压力测试，观察你的 Augmented LLM 在真实场景下的表现。",
          labFile: "phase_0/cli.py",
          hints: [
            "观察 Agent 调用多个工具时的消息增长过程",
            "用 /context 命令监控 token 使用量",
            "尝试让对话超过 20 轮，看 context 管理是否自动触发",
          ],
        },
      ],
      acceptanceCriteria: [
        "pytest 全部测试通过",
        "grade.py 显示 100% 完成度",
        "python -m phase_0.cli 可正常启动（需 API Key）",
        "Tool 调用在终端正确显示调用详情",
        "长对话场景下 context 自动压缩",
      ],
      references: [
        {
          title: "pytest 文档",
          description:
            "Python 测试框架 pytest 的完整文档，包含 fixture、parametrize、mock 等进阶用法。",
          url: "https://docs.pytest.org/en/stable/",
        },
        {
          title: "Building Effective Agents",
          description:
            "回顾 Augmented LLM 部分——你刚刚实现了这个架构的完整原型。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Anthropic Messages API",
          description:
            "API 参考文档，包含认证、错误码、rate limits 等全面信息。",
          url: "https://docs.anthropic.com/en/api/messages",
        },
      ],
    },
  ],
};
