import type { PhaseContent } from "./types";

export const phase3ContentZhCN: PhaseContent = {
  phaseId: 3,
  color: "#7C3AED",
  accent: "#A78BFA",
  lessons: [
    // ─── Lesson 1: ReAct 循环实现 ────────────────────────────────────
    {
      phaseId: 3,
      lessonId: 1,
      title: "ReAct 循环与 Agent Loop",
      subtitle: "Building the Reasoning Engine",
      type: "概念 + 实践",
      duration: "3.5 hrs",
      visualization: "phase3-react",
      objectives: [
        "理解从 Workflow 到 Agent 的质变：流程由 LLM 动态决定",
        "掌握 ReAct 模式：Think → Act → Observe → Loop",
        "实现完整的 Agent Loop（接收任务 → 自主规划 → 循环执行）",
        "设计停止条件：任务完成、最大迭代、Budget 耗尽",
        "实现 Token Budget 控制和思考过程可视化",
      ],
      sections: [
        {
          title: "Phase 导读：从 Workflow 到 Agent 的质变",
          blocks: [
            {
              type: "callout",
              variant: "quote",
              text: "Week 7-8 · The Reasoning Engine\n在 Phase 2 中，你学会了用代码编排 LLM 调用。\n现在，是时候放手——让 LLM 自己决定该做什么、怎么做了。",
            },
            {
              type: "heading",
              level: 3,
              text: "Workflow vs Agent：关键转变",
            },
            {
              type: "paragraph",
              text: "Anthropic 在 \"Building Effective Agents\" 中明确区分了 Workflow 和 Agent：",
            },
            {
              type: "table",
              headers: ["维度", "Workflow (Phase 2)", "Agent (Phase 3)"],
              rows: [
                ["流程控制", "代码预定义每一步", "LLM 动态决定下一步"],
                ["适用场景", "结构化、可预测的任务", "开放式、探索性任务"],
                ["核心模式", "Chain / Route", "ReAct Loop"],
                ["复杂度", "低——步骤固定", "高——行为不可预测"],
                ["能力上限", "取决于你的设计", "取决于 LLM 的推理能力"],
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "你在构建什么",
            },
            {
              type: "diagram",
              content:
                "┌─────────────────────────────────────────────────────┐\n│                 Agent Core (Phase 3)                │\n│                                                     │\n│   ┌────────────┐  ┌──────────────┐  ┌───────────┐  │\n│   │ Agent Loop │  │Error Recovery│  │Permissions│  │\n│   │ ReAct 循环  │  │  自我修正     │  │ 人机交互   │  │\n│   └─────┬──────┘  └──────┬───────┘  └─────┬─────┘  │\n│         │                │                │         │\n│         └────────────────┼────────────────┘         │\n│                          │                          │\n│              ┌───────────┴───────────┐              │\n│              │  Workflow + Tools     │              │\n│              │    (Phase 0-2)        │              │\n│              └───────────────────────┘              │\n└─────────────────────────────────────────────────────┘",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "Agent Loop：ReAct 循环——让 LLM 自主推理和行动（Lab 1）",
                "Error Recovery：错误感知与自我修正机制（Lab 2）",
                "Permissions：Human-in-the-loop 安全机制（Lab 3）",
              ],
            },
          ],
        },
        {
          title: "ReAct 模式核心概念",
          blocks: [
            {
              type: "paragraph",
              text: "ReAct（Reason + Act）是目前最流行的 Agent 架构模式。它的核心循环非常简单：",
            },
            {
              type: "diagram",
              content:
                "          ┌─────────────┐\n          │   Task      │\n          │  (用户任务)  │\n          └──────┬──────┘\n                 │\n          ┌──────▼──────┐\n     ┌───→│   Think     │\n     │    │  (推理规划)  │\n     │    └──────┬──────┘\n     │           │\n     │    ┌──────▼──────┐\n     │    │    Act      │\n     │    │  (调用工具)  │\n     │    └──────┬──────┘\n     │           │\n     │    ┌──────▼──────┐\n     │    │  Observe    │\n     │    │ (观察结果)   │\n     │    └──────┬──────┘\n     │           │\n     │      完成了？──── No ───┐\n     │           │              │\n     │          Yes             │\n     │           │              │\n     │    ┌──────▼──────┐      │\n     │    │   Output    │      │\n     │    │  (最终结果)  │      │\n     │    └─────────────┘      │\n     │                         │\n     └─────────────────────────┘",
            },
            {
              type: "heading",
              level: 3,
              text: "与 Anthropic Tool Use 的天然契合",
            },
            {
              type: "paragraph",
              text: "ReAct 模式与 Anthropic 的 Tool Use API 天然契合。在 API 层面，Agent Loop 其实就是：",
            },
            {
              type: "code",
              language: "python",
              code: `# Agent Loop 的本质
while True:
    response = llm.create_message(messages, tools=tools)

    if response.stop_reason == "end_turn":
        # LLM 认为任务完成了
        break
    elif response.stop_reason == "tool_use":
        # LLM 想使用工具 → 执行工具 → 把结果加入 messages
        for tool_call in response.tool_uses:
            result = execute_tool(tool_call)
            messages.append(tool_result_message(result))
        # 继续循环

    if iteration > max_iterations:
        break  # 安全阀`,
            },
            {
              type: "callout",
              variant: "tip",
              text: "关键洞察：Tool Use 的 stop_reason 是自然的循环信号。end_turn = 停止，tool_use = 继续。你只需要加上 budget 控制和错误处理就是完整的 Agent。",
            },
          ],
        },
        {
          title: "Lab 1: Agent Loop 实现",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "学习目标",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "实现完整的 ReAct 循环",
                "解析 LLM 回应为思考和行动",
                "执行 Tool 调用并将结果回馈 LLM",
                "实现 Token Budget 控制",
                "可视化推理过程",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "Lab 1 实战指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: run() — 主循环",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def run(self, task):
    # 1. 初始化状态
    self.state = AgentState(messages=[
        {"role": "user", "content": task}
    ])
    system_prompt = self._build_system_prompt(task)
    steps = []

    # 2. 主循环
    while self.state.status == "running":
        # 检查预算
        if self._check_budget():
            self.state.status = "budget_exceeded"
            break

        # 检查迭代次数
        if self.state.iteration_count >= self.config.max_iterations:
            self.state.status = "max_iterations"
            break

        # 调用 LLM
        response = self.llm_client.create_message(
            messages=self.state.messages,
            system_prompt=system_prompt,
            tools=self.tools,
        )

        # 处理回应
        step = self._process_response(response)
        steps.append(step)
        self.state.iteration_count += 1
        self.state.total_tokens_used += response.usage.total

    return AgentResult(
        success=self.state.status == "completed",
        iterations=self.state.iteration_count,
        trace=steps,
    )`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: _process_response() — 解析回应",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def _process_response(self, response):
    step = AgentStep(iteration=self.state.iteration_count)

    if response.stop_reason == "end_turn":
        # 任务完成
        step.thought = extract_text(response)
        self.state.status = "completed"

    elif response.stop_reason == "tool_use":
        # 提取思考和工具调用
        for block in response.content:
            if block.type == "text":
                step.thought = block.text
            elif block.type == "tool_use":
                step.tool_name = block.name
                step.tool_input = block.input

                # 执行工具
                result = self._execute_tool(block.name, block.input)
                step.observation = result

                # 将结果加入消息
                self.state.messages.append(tool_result_msg(result))

    return step`,
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
pytest tests/test_lab1_agent_loop.py -v`,
            },
            {
              type: "callout",
              variant: "info",
              text: "测试使用 MagicMock 模拟 LLM 和 Tools，不需要 API Key。Agent 的行为完全由 mock 控制。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "3.1.1",
          title: "实现 run() 主循环",
          description:
            "实现 AgentLoop.run() 方法——Agent 的核心。接收任务描述，循环调用 LLM 和 Tools，直到任务完成或达到限制。",
          labFile: "phase_3/agent_loop.py",
          hints: [
            "初始化 AgentState，设置 status='running'",
            "每轮循环前检查 budget 和 iteration 限制",
            "根据 stop_reason 决定是继续还是停止",
            "记录每步的 AgentStep 用于 trace",
          ],
          pseudocode: `state = AgentState(messages=[user_msg])
while state.status == "running":
    if check_budget(): break
    if iteration >= max: break
    response = llm.call(messages, tools)
    step = process_response(response)
    steps.append(step)
return AgentResult(success=..., trace=steps)`,
        },
        {
          id: "3.1.2",
          title: "实现 _process_response()",
          description:
            "解析 LLM 回应，提取思考内容和工具调用。如果是 tool_use，执行工具并将结果加入消息历史。",
          labFile: "phase_3/agent_loop.py",
          hints: [
            "遍历 response.content 区分 text 和 tool_use",
            "tool_use 时调用 _execute_tool()",
            "end_turn 时设置 status='completed'",
          ],
        },
        {
          id: "3.1.3",
          title: "实现 _execute_tool() 和 _check_budget()",
          description:
            "安全地执行工具调用，处理工具不存在的情况。实现 token budget 检查。",
          labFile: "phase_3/agent_loop.py",
          hints: [
            "在 tools dict 中查找对应工具",
            "工具不存在时返回错误信息（不要抛异常）",
            "比较 total_tokens_used 和 max_tokens_budget",
          ],
        },
      ],
      acceptanceCriteria: [
        "Agent 能自主循环调用 LLM 和 Tools",
        "到达 max_iterations 或 budget 时安全停止",
        "每步的思考和行动都有记录",
        "工具不存在时返回错误而非崩溃",
        "所有 Lab 1 测试通过",
      ],
      references: [
        {
          title: "Building Effective Agents — Agents",
          description:
            "Anthropic 对 Agent 模式的定义和设计建议。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "ReAct: Synergizing Reasoning and Acting",
          description:
            "ReAct 论文——Agent 循环的理论基础。",
          url: "https://arxiv.org/abs/2210.03629",
        },
        {
          title: "Anthropic Tool Use 文档",
          description:
            "Tool Use API 的完整参考，Agent Loop 的底层机制。",
          url: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use",
        },
      ],
    },

    // ─── Lesson 2: 环境反馈与自我修正 ──────────────────────────────────
    {
      phaseId: 3,
      lessonId: 2,
      title: "环境反馈与自我修正",
      subtitle: "Error Recovery & Strategy Adaptation",
      type: "概念 + 实践",
      duration: "2.5 hrs",
      objectives: [
        "理解 Ground Truth 的重要性：环境反馈是 Agent 的眼睛",
        "掌握错误分类：可重试 vs 需换策略 vs 致命错误",
        "实现自动重试与策略切换机制",
        "设计带错误上下文的重试 Prompt",
        "避免 Agent 在同一错误上无限重试",
      ],
      sections: [
        {
          title: "环境反馈：Agent 的眼睛",
          blocks: [
            {
              type: "paragraph",
              text: "Anthropic 的第四个设计原则：「环境反馈是 Agent 的眼睛」。Agent 的智能不仅来自 LLM 的推理能力，更来自对环境反馈的正确理解和响应。",
            },
            {
              type: "callout",
              variant: "quote",
              text: "Agent 写了一段代码 → 运行测试 → 测试失败 → 读取错误信息 → 修改代码 → 重新测试 → 通过\n\n这个循环的关键在于「测试失败」这个环境反馈。没有它，Agent 就是盲目的。",
            },
            {
              type: "heading",
              level: 3,
              text: "错误的分类",
            },
            {
              type: "table",
              headers: ["类别", "例子", "处理策略"],
              rows: [
                ["可重试 (retryable)", "文件暂时锁定、网络超时", "等待后重试同一操作"],
                ["需换策略 (strategy_change)", "方法 A 连续失败 2 次", "尝试完全不同的方法"],
                ["致命 (fatal)", "权限不足、依赖缺失", "向用户报告，停止执行"],
              ],
            },
          ],
        },
        {
          title: "Lab 2: Error Recovery 实现",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 2 实战指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: categorize_error() — 错误分类",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def categorize_error(self, error, context):
    error_str = str(error).lower()

    # 致命错误
    if "permission denied" in error_str or "401" in error_str or "403" in error_str:
        return "fatal"

    # 可重试错误
    if "timeout" in error_str or "connection" in error_str:
        return "retryable"

    # 检查是否同一错误重复出现
    if self._detect_repeated_failures(self.history):
        return "strategy_change"

    return "retryable"  # 默认可重试`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: build_retry_prompt() — 增强 Prompt",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def build_retry_prompt(self, original_prompt, error_records):
    error_summary = "\\n".join([
        f"尝试 {r.attempt}: {r.message}" for r in error_records
    ])
    return f"""{original_prompt}

之前的尝试失败了。以下是错误历史：
{error_summary}

请尝试不同的方法来完成任务。不要重复之前失败的方法。"""`,
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
pytest tests/test_lab2_error_recovery.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "3.2.1",
          title: "实现 categorize_error()",
          description:
            "根据错误内容和上下文，将错误分类为 retryable、strategy_change 或 fatal。",
          labFile: "phase_3/error_recovery.py",
          hints: [
            "分析错误字串中的关键词",
            "检查历史中是否有重复的相同错误",
            "致命错误应立即识别，不要重试",
          ],
        },
        {
          id: "3.2.2",
          title: "实现 should_retry() 和 get_recovery_strategy()",
          description:
            "判断是否应该重试，以及选择什么恢复策略。需要考虑重试次数和策略切换次数的限制。",
          labFile: "phase_3/error_recovery.py",
          hints: [
            "比较当前重试次数和 max_retries",
            "策略切换次数超过 max_strategy_changes 时返回 fatal",
            "从 _default_strategies() 中选择策略",
          ],
        },
        {
          id: "3.2.3",
          title: "实现 build_retry_prompt()",
          description:
            "构建带错误历史的重试 prompt。让 LLM 知道之前尝试了什么、为什么失败、应该换什么方法。",
          labFile: "phase_3/error_recovery.py",
          hints: [
            "包含所有失败历史的摘要",
            "明确告诉 LLM 不要重复失败的方法",
            "如果是 strategy_change，附加新策略的描述",
          ],
        },
      ],
      acceptanceCriteria: [
        "错误被正确分类为三个类别",
        "重试次数限制生效",
        "策略切换在同类错误重复出现时触发",
        "重试 prompt 包含完整的错误上下文",
        "所有 Lab 2 测试通过",
      ],
      references: [
        {
          title: "Building Effective Agents — Ground Truth",
          description:
            "环境反馈在 Agent 系统中的重要性。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Exponential Backoff",
          description:
            "重试策略中指数退避算法的设计理念。",
          url: "https://en.wikipedia.org/wiki/Exponential_backoff",
        },
      ],
    },

    // ─── Lesson 3: Human-in-the-loop ─────────────────────────────────
    {
      phaseId: 3,
      lessonId: 3,
      title: "Human-in-the-loop 设计",
      subtitle: "Permission System & Safety Controls",
      type: "设计 + 实践",
      duration: "2.5 hrs",
      objectives: [
        "设计安全的人机交互点：哪些操作需要确认",
        "实现三级权限模型：auto / confirm / deny",
        "设计操作预览机制：diff、命令预览",
        "理解 Agent 安全的核心挑战",
      ],
      sections: [
        {
          title: "为什么需要 Human-in-the-loop",
          blocks: [
            {
              type: "paragraph",
              text: "Agent 能自主行动是强大的能力，但也带来风险。一个没有安全阀的 Agent 可能会删除重要文件、执行危险命令、甚至修改生产环境。",
            },
            {
              type: "callout",
              variant: "warning",
              text: "Claude Code 的设计原则：危险操作（文件删除、外部命令、git push）默认需要用户确认。只有用户明确授权的操作才能自动执行。",
            },
            {
              type: "heading",
              level: 3,
              text: "三级权限模型",
            },
            {
              type: "table",
              headers: ["级别", "行为", "适用场景"],
              rows: [
                ["auto", "自动执行，不询问", "读取文件、搜索代码"],
                ["confirm", "显示操作详情，等待确认", "写入文件、执行命令"],
                ["deny", "直接拒绝，不执行", "rm -rf、sudo 等危险操作"],
              ],
            },
          ],
        },
        {
          title: "Lab 3: Permission Manager 实现",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 3 实战指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: check_permission() — 权限检查",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def check_permission(self, request):
    # 1. 查找匹配的规则
    rule = self._match_rule(request.tool_name)

    if rule:
        if rule.level == "auto":
            return PermissionResult(allowed=True, reason="Auto-approved")
        elif rule.level == "deny":
            return PermissionResult(allowed=False, reason=rule.reason)
        else:  # confirm
            return self.request_approval(request)
    else:
        # 使用默认级别
        if self.config.default_level == "auto":
            return PermissionResult(allowed=True)
        return self.request_approval(request)`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: request_approval() — 用户确认",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def request_approval(self, request):
    # 格式化操作描述
    description = format_permission_request(request)

    # 调用用户输入回调
    user_response = self.user_input_fn(description)

    if user_response.lower() in ("y", "yes"):
        return PermissionResult(allowed=True, reason="User approved")
    else:
        return PermissionResult(allowed=False, reason="User denied")`,
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
pytest tests/test_lab3_permissions.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "3.3.1",
          title: "实现 check_permission()",
          description:
            "根据规则检查工具调用的权限。匹配规则 → 根据级别决定自动通过、拒绝或请求确认。",
          labFile: "phase_3/permissions.py",
          hints: [
            "用 _match_rule() 找到匹配的规则",
            "没有匹配规则时使用 default_level",
            "auto_approve_read 可以跳过读操作的确认",
          ],
        },
        {
          id: "3.3.2",
          title: "实现 _match_rule() 和 _assess_risk()",
          description:
            "实现工具名称的 glob 匹配和风险评估。",
          labFile: "phase_3/permissions.py",
          hints: [
            "使用 fnmatch.fnmatch() 进行 glob 匹配",
            "写入/删除操作 = high risk",
            "读取操作 = low risk",
          ],
        },
        {
          id: "3.3.3",
          title: "实现 request_approval()",
          description:
            "向用户展示操作详情并等待确认。支持 approve、reject 两种回应。",
          labFile: "phase_3/permissions.py",
          hints: [
            "使用 format_permission_request() 格式化展示",
            "调用 self.user_input_fn() 获取用户输入",
            "处理各种用户回应格式（y/yes/Y/YES）",
          ],
        },
      ],
      acceptanceCriteria: [
        "auto 模式直接通过不询问",
        "deny 模式直接拒绝",
        "confirm 模式正确调用用户确认",
        "glob 规则匹配正确",
        "所有 Lab 3 测试通过",
      ],
      references: [
        {
          title: "Claude Code Permission Model",
          description:
            "Claude Code 的权限设计，包含 auto/confirm/deny 三级模型。",
          url: "https://docs.anthropic.com/en/docs/claude-code",
        },
        {
          title: "Python fnmatch",
          description:
            "Python 的 Unix filename pattern matching，用于 glob 规则匹配。",
          url: "https://docs.python.org/3/library/fnmatch.html",
        },
      ],
    },

    // ─── Lesson 4: 整合与回顾 ────────────────────────────────────────
    {
      phaseId: 3,
      lessonId: 4,
      title: "整合与回顾",
      subtitle: "Full Agent Integration & Testing",
      type: "项目实践",
      duration: "4 hrs",
      objectives: [
        "将 Agent Loop、Error Recovery、Permissions 整合",
        "用 5 个预设编程任务测试 Agent",
        "记录每个任务的 token 消耗和 trace",
        "回顾 Phase 3 核心知识点",
        "预览 Phase 4 的高阶模式",
      ],
      sections: [
        {
          title: "Phase 3 整合",
          blocks: [
            {
              type: "paragraph",
              text: "现在把三个模块整合：Agent Loop 负责核心循环，Error Recovery 负责错误处理，Permissions 负责安全控制。",
            },
            {
              type: "heading",
              level: 3,
              text: "5 个测试任务",
            },
            {
              type: "table",
              headers: ["#", "任务", "难度", "涉及技能"],
              rows: [
                ["1", "创建 TODO API (CRUD + 测试)", "中", "多文件读写、命令执行"],
                ["2", "重构 buggy 计算器函数", "低", "读取、分析、修改"],
                ["3", "为模块生成 docstring", "低", "读取、生成文字"],
                ["4", "callback → async/await 重写", "中", "理解代码、重构"],
                ["5", "修复 SQL injection 漏洞", "高", "安全分析、精确修改"],
              ],
            },
          ],
        },
        {
          title: "回顾与展望",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Phase 3 核心收获",
            },
            {
              type: "table",
              headers: ["模块", "核心能力", "对应设计原则"],
              rows: [
                ["Agent Loop", "LLM 自主推理和行动", "从简单开始，按需增加复杂度"],
                ["Error Recovery", "错误感知与自我修正", "环境反馈是 Agent 的眼睛"],
                ["Permissions", "安全的人机交互", "透明性优先"],
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "下一步：Phase 4",
            },
            {
              type: "paragraph",
              text: "Phase 3 的 Agent 是单线程的——一次只能做一件事。Phase 4 将引入 Orchestrator-Workers 模式，让 Agent 能分解复杂任务、分派子任务、并行处理。同时引入 Evaluator 机制，让 Agent 能自我评估和优化。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "3.4.1",
          title: "运行全部测试",
          description:
            "运行完整测试套件，确保 Lab 1-3 的所有 TODO 都已正确实现。\n\n目标：全部测试通过，grade.py 显示 100%。",
          labFile: "phase_3/",
          hints: [
            "pytest -v 显示每个测试的详细结果",
            "pytest -x 遇到第一个失败就停止",
          ],
          pseudocode: `# 运行所有测试
pytest -v

# 查看成绩报告
python scripts/grade.py`,
        },
        {
          id: "3.4.2",
          title: "用 5 个任务测试 Agent",
          description:
            "启动 CLI，依次测试 5 个预设任务。记录每个任务的完成情况、token 消耗、是否需要人工干预。",
          labFile: "phase_3/cli.py",
          hints: [
            "先尝试简单任务（重构计算器）",
            "观察 Agent 遇到错误时的自我修正",
            "注意哪些操作触发了 permission 确认",
          ],
          pseudocode: `# 启动 CLI
python -m phase_3.cli

# 试试这些任务：
# 1. "创建一个简单的 TODO class，包含 add/remove/list 方法"
# 2. "修复 sample_tasks.py 中的 buggy_calculator"
# 3. "为 agent_loop.py 的所有 public 方法添加 docstring"`,
        },
        {
          id: "3.4.3",
          title: "分析 Agent 行为",
          description:
            "回顾 Agent 在各个任务中的表现，分析成功和失败的原因。",
          labFile: "phase_3/cli.py",
          hints: [
            "对比 token 消耗高和低的任务",
            "分析 Agent 在哪些地方做了不必要的操作",
            "思考如何通过 prompt 优化来改善行为",
          ],
        },
      ],
      acceptanceCriteria: [
        "pytest 全部测试通过",
        "grade.py 显示 100% 完成度",
        "Agent 能独立完成至少 3 个测试任务",
        "危险操作触发 permission 确认",
        "遇到错误能自动重试或换策略",
      ],
      references: [
        {
          title: "pytest 文档",
          description: "Python 测试框架 pytest 的完整文档。",
          url: "https://docs.pytest.org/en/stable/",
        },
        {
          title: "Building Effective Agents",
          description:
            "回顾 Agent 部分——你刚刚实现了一个完整的 Agent。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "ReAct Paper",
          description:
            "深入阅读 ReAct 论文，理解理论基础。",
          url: "https://arxiv.org/abs/2210.03629",
        },
      ],
    },
  ],
};
