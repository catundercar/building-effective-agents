import type { PhaseContent } from "./types";

export const phase2ContentZhCN: PhaseContent = {
  phaseId: 2,
  color: "#059669",
  accent: "#34D399",
  lessons: [
    // ─── Lesson 1: Prompt Chaining 引擎 ───────────────────────────────
    {
      phaseId: 2,
      lessonId: 1,
      title: "Prompt Chaining 引擎实现",
      subtitle: "Building a Chain Runner for Sequential LLM Calls",
      type: "概念 + 实践",
      duration: "3 hrs",
      objectives: [
        "理解 Prompt Chaining 的设计原则：每步做一件事",
        "掌握 Gate 检查机制：中间结果的程序化验证",
        "实现步骤间的数据传递与格式转换",
        "设计失败恢复策略：哪步失败就从哪步重试",
        "实现一个完整的 Code Review Pipeline",
      ],
      sections: [
        // ── Phase 导读 ──
        {
          title: "Phase 导读：从单次调用到流程编排",
          blocks: [
            {
              type: "callout",
              variant: "quote",
              text: "Week 5-6 · Workflow Patterns\n在 Phase 0-1 中，你的 Agent 已经能与 LLM 对话、使用工具了。\n但每次都是「一问一答」——现在是时候让多次 LLM 调用协同工作了。",
            },
            {
              type: "heading",
              level: 3,
              text: "Workflow vs Agent：关键区别",
            },
            {
              type: "paragraph",
              text: "Anthropic 在 \"Building Effective Agents\" 中区分了两种模式：",
            },
            {
              type: "table",
              headers: ["维度", "Workflow", "Agent"],
              rows: [
                ["流程控制", "由代码预定义", "由 LLM 动态决定"],
                ["确定性", "高——流程固定", "低——每次可能不同"],
                ["适用场景", "结构化任务", "开放式任务"],
                ["调试难度", "容易——步骤可追踪", "较难——决策不可预测"],
              ],
            },
            {
              type: "paragraph",
              text: "在这个 Phase 中，我们聚焦 Workflow 模式——用确定性的代码来编排 LLM 调用。这是 Phase 3（Agent Loop）的重要前置。",
            },
            {
              type: "heading",
              level: 3,
              text: "你在构建什么",
            },
            {
              type: "diagram",
              content:
                "┌─────────────────────────────────────────────────┐\n│              Workflow Engine (Phase 2)           │\n│                                                 │\n│   ┌──────────┐    ┌─────────┐    ┌──────────┐  │\n│   │ Chaining │    │ Routing │    │ Tracing  │  │\n│   │ 串行编排  │    │ 意图路由 │    │ 可观测性  │  │\n│   └────┬─────┘    └────┬────┘    └────┬─────┘  │\n│        │               │              │         │\n│        └───────────────┼──────────────┘         │\n│                        │                        │\n│                ┌───────┴───────┐                │\n│                │   LLM Core   │                │\n│                │  (Phase 0-1) │                │\n│                └───────────────┘                │\n└─────────────────────────────────────────────────┘",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "Prompt Chaining：将复杂任务拆成步骤，串行执行（Lab 1）",
                "Routing：根据用户意图，路由到不同处理器（Lab 2）",
                "Tracing：为整个流程建立可观测性（Lab 3）",
              ],
            },
          ],
        },
        // ── 2.1 概念：Prompt Chaining ──
        {
          title: "Prompt Chaining 的核心概念",
          blocks: [
            {
              type: "paragraph",
              text: "Prompt Chaining 的核心思想非常简单：把一个复杂任务拆成多个简单步骤，每步用一次 LLM 调用完成，步骤之间用程序化的逻辑衔接。",
            },
            {
              type: "heading",
              level: 3,
              text: "为什么需要 Chaining？",
            },
            {
              type: "paragraph",
              text: "单次 LLM 调用的问题在于：任务越复杂，输出质量越不稳定。把「分析代码 + 找 bug + 写修复 + 验证」塞进一个 prompt，不如拆成 4 个步骤，每步聚焦一件事。",
            },
            {
              type: "callout",
              variant: "tip",
              text: "Anthropic 建议：如果你的 prompt 超过 500 字，考虑拆成 chain。每步的 prompt 应该足够简短和聚焦。",
            },
            {
              type: "heading",
              level: 3,
              text: "Chain 的三要素",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "Step（步骤）：每一步的 prompt 模板和处理逻辑",
                "Gate（关卡）：步骤间的质量检查，决定是继续还是重试",
                "Transform（转换）：将上一步的输出格式化为下一步的输入",
              ],
            },
            {
              type: "code",
              language: "python",
              code: `# Chain 的基本结构
chain_steps = [
    ChainStep(
        name="analyze",
        prompt_template="分析以下代码的问题：\\n{code}",
        gate=lambda output: "问题" in output,  # 检查输出是否包含问题描述
    ),
    ChainStep(
        name="fix",
        prompt_template="根据以下分析，生成修复代码：\\n{analysis}",
        gate=lambda output: "def " in output,  # 检查输出是否包含函数定义
    ),
    ChainStep(
        name="verify",
        prompt_template="验证以下修复是否正确：\\n{fix}",
    ),
]`,
            },
          ],
        },
        // ── Lab 1 实战指引 ──
        {
          title: "Lab 1: Prompt Chaining 引擎",
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
                "实现 ChainRunner 类，支持顺序执行多个 LLM 调用步骤",
                "实现 Gate 检查机制，在步骤间进行质量控制",
                "实现失败重试逻辑，携带错误上下文",
                "支持 dry-run 模式预览执行计划",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "核心概念：Gate 检查",
            },
            {
              type: "paragraph",
              text: "Gate 是 Chaining 中最重要的机制——它在每步之间添加程序化的验证，确保 LLM 的输出符合预期后才继续下一步。",
            },
            {
              type: "diagram",
              content:
                "Step 1          Gate 1         Step 2          Gate 2         Step 3\n  │               │               │               │               │\n  ▼               ▼               ▼               ▼               ▼\n┌─────┐  output ┌─────┐  pass  ┌─────┐  output ┌─────┐  pass  ┌─────┐\n│ LLM │───────→│Check│───────→│ LLM │───────→│Check│───────→│ LLM │\n│Call 1│        │ OK? │        │Call 2│        │ OK? │        │Call 3│\n└─────┘        └──┬──┘        └─────┘        └──┬──┘        └─────┘\n                  │ fail                         │ fail\n                  ▼                               ▼\n              ┌─────┐                         ┌─────┐\n              │Retry│                         │Retry│\n              └─────┘                         └─────┘",
            },
            {
              type: "heading",
              level: 3,
              text: "Lab 1 实战指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: run_step() — 执行单步",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def run_step(self, step, input_data):
    # 1. 用 format_prompt() 将 input_data 填入 prompt_template
    prompt = self.format_prompt(step.prompt_template, input_data)

    # 2. 调用 LLM client 获取回应
    response = self.llm_client.create_message(prompt)
    output = extract_text(response)

    # 3. 如果 step 有 gate，执行 gate 检查
    if step.gate:
        passed, reason = self._apply_gate(step, output)
        if not passed:
            # gate 未通过，尝试重试
            output = self._retry_step(step, input_data, reason)

    # 4. 如果 step 有 transform，转换输出格式
    if step.transform:
        output = step.transform(output)

    return output`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: run_chain() — 执行完整链",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def run_chain(self, steps, initial_input):
    current_input = initial_input
    trace = []

    for i, step in enumerate(steps):
        try:
            output = self.run_step(step, current_input)
            trace.append({"step": step.name, "output": output})
            current_input = output  # 下一步的输入 = 这一步的输出
        except Exception as e:
            return ChainResult(
                steps_completed=i,
                success=False,
                error=str(e),
                trace=trace,
            )

    return ChainResult(
        steps_completed=len(steps),
        final_output=current_input,
        success=True,
        trace=trace,
    )`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 3: _apply_gate() — Gate 检查",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def _apply_gate(self, step, output):
    try:
        passed = step.gate(output)
        if passed:
            return (True, "Gate check passed")
        else:
            return (False, f"Gate check failed for step '{step.name}'")
    except Exception as e:
        return (False, f"Gate error: {e}")`,
            },
          ],
        },
        // ── 测试指引 ──
        {
          title: "测试你的实现",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: `# 运行 Lab 1 测试
pytest tests/test_lab1_chain.py -v

# 只运行某个测试
pytest tests/test_lab1_chain.py::TestChainRunner::test_run_step_calls_llm -v`,
            },
            {
              type: "callout",
              variant: "info",
              text: "所有测试使用 MagicMock 模拟 LLM 调用，不需要真实的 API Key。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "2.1.1",
          title: "实现 run_step()",
          description:
            "实现 ChainRunner.run_step() 方法。它接收一个 ChainStep 和输入数据，调用 LLM 获取输出，并执行 gate 检查。",
          labFile: "phase_2/chain.py",
          hints: [
            "使用 format_prompt() 将数据填入模板",
            "记得处理 gate 为 None 的情况（直接通过）",
            "gate 失败时调用 _retry_step()",
          ],
          pseudocode: `prompt = self.format_prompt(step.prompt_template, input_data)
response = self.llm_client.create_message(prompt)
output = extract_text(response)
if step.gate:
    passed, reason = self._apply_gate(step, output)
    if not passed:
        output = self._retry_step(step, input_data, reason)
return output`,
        },
        {
          id: "2.1.2",
          title: "实现 run_chain()",
          description:
            "实现完整的 chain 执行逻辑。依次执行每个步骤，将输出传递给下一步的输入，记录 trace。",
          labFile: "phase_2/chain.py",
          hints: [
            "用一个 for 循环遍历 steps",
            "每步的输出作为下一步的输入",
            "用 try/except 捕获失败，返回部分结果",
          ],
          pseudocode: `current_input = initial_input
trace = []
for step in steps:
    output = self.run_step(step, current_input)
    trace.append({"step": step.name, "output": output})
    current_input = output
return ChainResult(success=True, ...)`,
        },
        {
          id: "2.1.3",
          title: "实现 _apply_gate() 和 _retry_step()",
          description:
            "实现 gate 检查逻辑和带错误上下文的重试机制。重试时应将之前的错误信息注入 prompt。",
          labFile: "phase_2/chain.py",
          hints: [
            "gate 是一个 callable，返回 bool",
            "重试时在 prompt 中附加错误信息",
            "最多重试 config.max_retries_per_step 次",
          ],
        },
      ],
      acceptanceCriteria: [
        "run_step 能正确调用 LLM 并返回输出",
        "Gate 失败时触发重试",
        "run_chain 将多步串行执行，输出流入下一步",
        "失败时返回部分结果和错误信息",
        "所有 Lab 1 测试通过",
      ],
      references: [
        {
          title: "Building Effective Agents — Prompt Chaining",
          description:
            "Anthropic 对 Prompt Chaining 模式的详细介绍，包含设计原则和使用场景。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Chain of Responsibility Pattern",
          description:
            "GoF 设计模式中的责任链模式，与 Prompt Chaining 有相似的设计理念。",
          url: "https://refactoring.guru/design-patterns/chain-of-responsibility",
        },
        {
          title: "Python dataclasses",
          description:
            "Python dataclass 文档，用于理解 ChainStep、ChainResult 等类型定义。",
          url: "https://docs.python.org/3/library/dataclasses.html",
        },
      ],
    },

    // ─── Lesson 2: Routing 分发器 ───────────────────────────────────
    {
      phaseId: 2,
      lessonId: 2,
      title: "Routing 分发器实现",
      subtitle: "Intent Classification & Smart Dispatching",
      type: "概念 + 实践",
      duration: "2.5 hrs",
      objectives: [
        "理解 Routing 的核心：分类 + 分发",
        "掌握 LLM-based 意图分类的设计方法",
        "实现多路由场景的智能派发",
        "建立路由准确率的测试方法论",
        "理解成本优化：不同路由可使用不同模型",
      ],
      sections: [
        {
          title: "Routing 的核心概念",
          blocks: [
            {
              type: "paragraph",
              text: "Routing 是另一种基础 Workflow 模式。它的核心思想是：先理解用户想做什么，再把请求导向最合适的处理器。",
            },
            {
              type: "diagram",
              content:
                "                    ┌──────────┐\n                    │ 用户输入  │\n                    └────┬─────┘\n                         │\n                    ┌────▼─────┐\n                    │ Classifier│\n                    │ (LLM分类) │\n                    └────┬─────┘\n                         │\n            ┌────────────┼────────────┐\n            │            │            │\n       ┌────▼───┐   ┌───▼────┐  ┌───▼────┐\n       │解释代码 │   │修改文件 │  │运行命令 │\n       │Pipeline│   │Pipeline│  │Pipeline│\n       └────────┘   └────────┘  └────────┘",
            },
            {
              type: "heading",
              level: 3,
              text: "分类方式的选择",
            },
            {
              type: "table",
              headers: ["方式", "优点", "缺点", "适用场景"],
              rows: [
                ["LLM 分类", "灵活、能处理模糊输入", "有延迟、有成本", "复杂意图分类"],
                ["规则分类", "快速、确定性", "不灵活", "关键字匹配场景"],
                ["混合模式", "先规则后 LLM", "实现稍复杂", "生产环境推荐"],
              ],
            },
            {
              type: "callout",
              variant: "tip",
              text: "成本优化技巧：分类本身可以用便宜的模型（如 Haiku），只有确定路由后才使用强模型（如 Sonnet）处理实际任务。",
            },
          ],
        },
        // ── Lab 2 指引 ──
        {
          title: "Lab 2: Router 实现",
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
                "实现 LLM-based 意图分类器",
                "构建带置信度的路由决策",
                "支持 fallback 路由（低置信度时的默认处理）",
                "建立路由准确率测试集",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "Lab 2 实战指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: _build_classification_prompt() — 构建分类 Prompt",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def _build_classification_prompt(self, user_input):
    routes_desc = ""
    for route in self.routes:
        routes_desc += f"- {route.name}: {route.description}\\n"

    return f"""根据用户输入，判断应该路由到哪个处理器。

可用的路由：
{routes_desc}

用户输入：{user_input}

请以 JSON 格式回应：
{{"route": "路由名称", "confidence": 0.0-1.0}}"""`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: classify() — 意图分类",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def classify(self, user_input):
    prompt = self._build_classification_prompt(user_input)
    response = self.llm_client.create_message(prompt)
    route_name, confidence = self._parse_classification(response)
    return (route_name, confidence)`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 3: route() — 完整路由流程",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def route(self, user_input):
    route_name, confidence = self.classify(user_input)

    # 低置信度 → 使用 fallback
    if confidence < self.config.confidence_threshold:
        if self.config.fallback_route:
            route_name = self.config.fallback_route

    # 找到对应的 handler 并执行
    handler = self._get_handler(route_name)
    result = handler(user_input)

    return RouteResult(
        route_name=route_name,
        confidence=confidence,
        handler_output=result,
    )`,
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
pytest tests/test_lab2_router.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "2.2.1",
          title: "实现 _build_classification_prompt()",
          description:
            "构建 LLM 分类 prompt，列出所有可用路由及其描述，要求 LLM 以 JSON 格式返回分类结果。",
          labFile: "phase_2/router.py",
          hints: [
            "遍历 self.routes 构建路由描述列表",
            "在 prompt 中明确要求 JSON 格式回应",
            "包含 classifier_hint 帮助 LLM 判断",
          ],
        },
        {
          id: "2.2.2",
          title: "实现 classify() 和 _parse_classification()",
          description:
            "调用 LLM 进行意图分类，并解析 JSON 回应为路由名称和置信度。",
          labFile: "phase_2/router.py",
          hints: [
            "用 json.loads() 解析 LLM 回应",
            "处理 JSON 解析失败的情况",
            "确保 confidence 在 0-1 范围内",
          ],
        },
        {
          id: "2.2.3",
          title: "实现 route() 完整路由",
          description:
            "整合分类和分发：先分类意图，再根据置信度决定是否使用 fallback，最后执行对应 handler。",
          labFile: "phase_2/router.py",
          hints: [
            "先调用 classify() 获取路由和置信度",
            "置信度低于阈值时使用 fallback",
            "记录路由决策用于 tracing",
          ],
        },
      ],
      acceptanceCriteria: [
        "Router 能正确分类用户意图",
        "低置信度时使用 fallback 路由",
        "路由决策有结构化 trace",
        "所有 Lab 2 测试通过",
      ],
      references: [
        {
          title: "Building Effective Agents — Routing",
          description:
            "Anthropic 对 Routing 模式的介绍，包含分类方式和成本优化。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Strategy Pattern",
          description:
            "GoF 设计模式中的策略模式，Router 的设计理念与之相似。",
          url: "https://refactoring.guru/design-patterns/strategy",
        },
        {
          title: "JSON Schema",
          description:
            "用于定义 LLM 分类输出的结构化格式规范。",
          url: "https://json-schema.org/learn/getting-started-step-by-step",
        },
      ],
    },

    // ─── Lesson 3: Tracing 可观测性 ──────────────────────────────────
    {
      phaseId: 2,
      lessonId: 3,
      title: "可观测性：Tracing 系统",
      subtitle: "Structured Logging & Trace Visualization",
      type: "概念 + 实践",
      duration: "2.5 hrs",
      objectives: [
        "理解结构化 Trace 的概念：Trace、Span、嵌套",
        "实现完整的 Trace 生命周期管理",
        "为 LLM 调用和 Tool 调用自动创建 Span",
        "实现终端 Trace 树的可视化",
        "掌握性能指标的采集与展示",
      ],
      sections: [
        {
          title: "为什么需要 Tracing",
          blocks: [
            {
              type: "paragraph",
              text: "当 Workflow 涉及多次 LLM 调用和 Tool 调用时，如果没有可观测性，你就像在黑箱中工作——出了问题不知道是哪一步、为什么。",
            },
            {
              type: "heading",
              level: 3,
              text: "Trace 的结构",
            },
            {
              type: "paragraph",
              text: "一个 Trace 代表一次完整请求的全链路追踪。它由多个 Span 组成，每个 Span 代表一个操作（LLM 调用、Tool 调用、Gate 检查等）。Span 可以嵌套。",
            },
            {
              type: "diagram",
              content:
                "Trace: \"code-review-pipeline\"\n│\n├── Span: \"chain_run\" (1200ms)\n│   ├── Span: \"step_analyze\" (450ms)\n│   │   ├── Span: \"llm_call\" (400ms, 1500 tokens)\n│   │   └── Span: \"gate_check\" (2ms, pass)\n│   ├── Span: \"step_fix\" (500ms)\n│   │   ├── Span: \"llm_call\" (480ms, 2000 tokens)\n│   │   └── Span: \"gate_check\" (1ms, pass)\n│   └── Span: \"step_verify\" (250ms)\n│       └── Span: \"llm_call\" (240ms, 800 tokens)\n│\nTotal: 1200ms, 4300 tokens",
            },
            {
              type: "callout",
              variant: "info",
              text: "Trace 和 Span 的概念来自分布式追踪系统（如 OpenTelemetry）。虽然我们的场景更简单，但这些概念可以直接复用。",
            },
          ],
        },
        {
          title: "Lab 3: Tracer 实现",
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
                "实现 Trace 和 Span 的生命周期管理",
                "支持 Span 的嵌套（父子关系）",
                "计算 Trace 的聚合指标（总耗时、总 token）",
                "实现终端树状 Trace 展示",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "Lab 3 实战指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: start_trace() 和 start_span()",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def start_trace(self, name):
    trace_id = self._generate_id()
    root_span = Span(
        span_id=self._generate_id(),
        name=name,
        start_time=time.time(),
    )
    return Trace(
        trace_id=trace_id,
        name=name,
        root_span=root_span,
        start_time=time.time(),
    )

def start_span(self, name, parent, input_data=None):
    span = Span(
        span_id=self._generate_id(),
        parent_id=parent.span_id,
        name=name,
        start_time=time.time(),
        input_data=input_data,
    )
    parent.children.append(span)
    return span`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: end_span() 和 end_trace()",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def end_span(self, span, output_data=None):
    span.end_time = time.time()
    span.output_data = output_data

def end_trace(self, trace):
    trace.end_time = time.time()
    # 递归遍历所有 span，计算总 token 和总耗时
    trace.total_duration_ms = (trace.end_time - trace.start_time) * 1000
    trace.total_tokens = self._sum_tokens(trace.root_span)`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 3: format_trace() — 树状展示",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def format_trace(self, trace):
    lines = [f"Trace: {trace.name} ({trace.total_duration_ms:.0f}ms)"]
    self._format_span(trace.root_span, lines, indent=0)
    lines.append(f"Total: {trace.total_duration_ms:.0f}ms, {trace.total_tokens} tokens")
    return "\\n".join(lines)

def _format_span(self, span, lines, indent):
    prefix = "│   " * indent + "├── "
    duration = (span.end_time - span.start_time) * 1000
    lines.append(f"{prefix}{span.name} ({duration:.0f}ms)")
    for child in span.children:
        self._format_span(child, lines, indent + 1)`,
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
pytest tests/test_lab3_tracing.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "2.3.1",
          title: "实现 start_trace() 和 start_span()",
          description:
            "建立 Trace 和 Span 的创建机制。Trace 包含一个 root span，新的 span 可以作为子节点挂载。",
          labFile: "phase_2/tracing.py",
          hints: [
            "使用 _generate_id() 生成唯一 ID",
            "start_time 使用 time.time()",
            "子 span 需要加入到 parent.children 列表",
          ],
          pseudocode: `trace = Trace(trace_id=gen_id(), name=name, root_span=Span(...))
span = Span(span_id=gen_id(), parent_id=parent.span_id, ...)
parent.children.append(span)`,
        },
        {
          id: "2.3.2",
          title: "实现 end_span() 和 end_trace()",
          description:
            "关闭 Span 和 Trace，记录结束时间，计算聚合指标。",
          labFile: "phase_2/tracing.py",
          hints: [
            "设置 end_time = time.time()",
            "递归遍历 span 树计算总 token",
            "duration_ms = (end_time - start_time) * 1000",
          ],
        },
        {
          id: "2.3.3",
          title: "实现 format_trace() 树状展示",
          description:
            "将 Trace 渲染为终端可读的树状结构，包含每个 span 的名称和耗时。",
          labFile: "phase_2/tracing.py",
          hints: [
            "使用递归遍历 span 树",
            "用缩进表示层级关系",
            "显示耗时和 token 消耗",
          ],
        },
      ],
      acceptanceCriteria: [
        "Trace 和 Span 的创建和关闭正确",
        "嵌套 Span 的父子关系正确",
        "聚合指标（总耗时、总 token）计算正确",
        "format_trace 输出可读的树状结构",
        "所有 Lab 3 测试通过",
      ],
      references: [
        {
          title: "OpenTelemetry Concepts",
          description:
            "分布式追踪的核心概念：Trace、Span、Context Propagation。",
          url: "https://opentelemetry.io/docs/concepts/signals/traces/",
        },
        {
          title: "LangSmith Tracing",
          description:
            "LangChain 的追踪工具，展示了 LLM 应用中 tracing 的实际用法。",
          url: "https://docs.smith.langchain.com/",
        },
        {
          title: "Python time module",
          description:
            "Python 时间模块，用于高精度计时。",
          url: "https://docs.python.org/3/library/time.html",
        },
      ],
    },

    // ─── Lesson 4: 整合与回顾 ────────────────────────────────────────
    {
      phaseId: 2,
      lessonId: 4,
      title: "整合与回顾",
      subtitle: "Integration & Retrospective",
      type: "项目实践",
      duration: "3 hrs",
      objectives: [
        "将 Chaining、Routing、Tracing 三个模块整合",
        "实现一个完整的 Code Review Pipeline",
        "验证端到端的 Workflow 执行与追踪",
        "回顾 Phase 2 的核心知识点",
        "预览 Phase 3 的 Agentic Loop",
      ],
      sections: [
        {
          title: "Phase 2 整合",
          blocks: [
            {
              type: "paragraph",
              text: "在前三个 Lab 中，你分别实现了 Chaining、Routing 和 Tracing。现在把它们整合起来，构建一个完整的 Workflow 系统。",
            },
            {
              type: "diagram",
              content:
                "用户输入\n  │\n  ▼\n┌──────────┐     ┌──────────┐     ┌──────────┐\n│  Router  │────→│  Chain   │────→│  Output  │\n│  (路由)   │     │  (执行)   │     │  (结果)   │\n└──────────┘     └──────────┘     └──────────┘\n      │                │                │\n      └────────────────┼────────────────┘\n                       │\n                ┌──────▼──────┐\n                │   Tracer    │\n                │  (全程追踪)  │\n                └─────────────┘",
            },
            {
              type: "heading",
              level: 3,
              text: "整合流程",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "Router 接收用户输入，分类意图",
                "根据路由结果，选择对应的 Chain Pipeline",
                "Chain 执行多步骤 LLM 调用",
                "Tracer 记录整个过程的每个 span",
                "最终输出结果和完整 trace",
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
              text: "Phase 2 核心收获",
            },
            {
              type: "table",
              headers: ["模块", "核心能力", "对应设计原则"],
              rows: [
                ["Chaining", "任务分解与串行执行", "从简单开始，按需增加复杂度"],
                ["Routing", "意图分类与智能分发", "在 Tool 上投入比 Prompt 更多时间"],
                ["Tracing", "全链路可观测性", "透明性优先"],
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "下一步：Phase 3 — Agentic Loop",
            },
            {
              type: "paragraph",
              text: "Phase 2 中的 Workflow 流程是预定义的——你在代码中写好了每一步该做什么。但在 Phase 3 中，流程将由 LLM 自主决定。这是从 Workflow 到 Agent 的质变：",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "Workflow：代码告诉 LLM「先做 A，再做 B，再做 C」",
                "Agent：LLM 自己决定「我应该先做什么、接下来做什么」",
              ],
            },
            {
              type: "callout",
              variant: "quote",
              text: "Phase 2 教你如何「编排」LLM，Phase 3 教你如何「放手」让 LLM 自己编排。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "2.4.1",
          title: "运行全部测试",
          description:
            "运行完整测试套件，确保 Lab 1-3 的所有 TODO 都已正确实现。\n\n目标：全部测试通过，grade.py 显示 100%。",
          labFile: "phase_2/",
          hints: [
            "pytest -v 显示每个测试的详细结果",
            "pytest tests/test_lab1_chain.py 单独运行某个 Lab 的测试",
            "pytest -x 遇到第一个失败就停止",
          ],
          pseudocode: `# 运行所有测试
pytest -v

# 查看成绩报告
python scripts/grade.py`,
        },
        {
          id: "2.4.2",
          title: "启动 CLI 体验 Workflow",
          description:
            "启动 CLI，体验完整的 Routing + Chaining + Tracing 流程。\n\n尝试：\n- 「分析这段代码」→ 触发 Code Review Chain\n- 「修改 xxx 文件」→ 触发文件编辑路由\n- 「今天天气如何」→ 触发闲聊路由",
          labFile: "phase_2/cli.py",
          hints: [
            "观察 Router 的分类结果和置信度",
            "观察 Chain 的每步执行过程",
            "用 /trace 命令查看完整 trace",
          ],
          pseudocode: `# 启动 CLI
python -m phase_2.cli

# CLI 中可用的指令：
# /trace   — 查看最近一次的 trace
# /routes  — 列出所有路由
# /exit    — 退出`,
        },
        {
          id: "2.4.3",
          title: "端到端场景测试",
          description:
            "验证完整的 Workflow 流程：用户输入 → 路由分类 → Chain 执行 → Trace 记录。",
          labFile: "phase_2/cli.py",
          hints: [
            "观察不同类型输入的路由结果",
            "对比不同 Pipeline 的 trace 结构",
            "尝试让 Gate 失败，观察重试机制",
          ],
        },
      ],
      acceptanceCriteria: [
        "pytest 全部测试通过",
        "grade.py 显示 100% 完成度",
        "python -m phase_2.cli 可正常启动",
        "Router 能正确分类不同意图",
        "Chain 能串行执行多步骤并产出结果",
        "Trace 记录完整的执行过程",
      ],
      references: [
        {
          title: "pytest 文档",
          description:
            "Python 测试框架 pytest 的完整文档。",
          url: "https://docs.pytest.org/en/stable/",
        },
        {
          title: "Building Effective Agents",
          description:
            "回顾 Prompt Chaining 和 Routing 部分的设计思想。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Anthropic Messages API",
          description:
            "API 参考文档，供整合练习时查阅。",
          url: "https://docs.anthropic.com/en/api/messages",
        },
      ],
    },
  ],
};
