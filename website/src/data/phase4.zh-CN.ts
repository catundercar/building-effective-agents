import type { PhaseContent } from "./types";

export const phase4ContentZhCN: PhaseContent = {
  phaseId: 4,
  color: "#2563EB",
  accent: "#60A5FA",
  lessons: [
    // ─── Lesson 1: Orchestrator-Workers ──────────────────────────────
    {
      phaseId: 4,
      lessonId: 1,
      title: "Orchestrator-Workers 模式",
      subtitle: "Dynamic Task Decomposition & Worker Dispatch",
      type: "概念 + 实践",
      duration: "3.5 hrs",
      objectives: [
        "理解 Orchestrator 的职责：分析 → 分解 → 分派 → 聚合",
        "实现动态任务分解：LLM 根据项目结构规划子任务",
        "设计 Worker 的独立性：每个 Worker 有独立的 context",
        "实现结果合并和冲突检测",
        "理解并行执行的挑战",
      ],
      sections: [
        {
          title: "Phase 导读：为什么需要高阶模式",
          blocks: [
            {
              type: "callout",
              variant: "quote",
              text: "Week 9-10 · Orchestration & Evaluation\nPhase 3 的 Agent 能自主解决问题了——但一次只能处理一个任务。\n真实的编程工作往往涉及多个文件、多个步骤的协同修改。",
            },
            {
              type: "heading",
              level: 3,
              text: "从单 Agent 到多 Worker",
            },
            {
              type: "paragraph",
              text: "想像你要「重构一个项目的错误处理逻辑」。这涉及：分析所有文件 → 识别需要修改的部分 → 逐个修改 → 确保不冲突 → 运行测试。一个 Agent 做所有事情太慢，也容易 context 溢出。",
            },
            {
              type: "diagram",
              content:
                "┌──────────────────────────────────────────────┐\n│            Orchestrator (指挥官)               │\n│                                              │\n│   分析任务 → 分解子任务 → 分派 → 聚合结果      │\n└──────────┬──────────┬──────────┬──────────────┘\n           │          │          │\n     ┌─────▼────┐ ┌──▼─────┐ ┌─▼────────┐\n     │ Worker 1 │ │Worker 2│ │ Worker 3 │\n     │ file-a.py│ │file-b  │ │ file-c   │\n     └─────┬────┘ └──┬─────┘ └─┬────────┘\n           │          │          │\n     ┌─────▼──────────▼──────────▼────────┐\n     │          合并 & 验证                │\n     │  冲突检测 → 测试运行 → 最终结果     │\n     └────────────────────────────────────┘",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "Orchestrator-Workers：动态分解和分派复杂任务（Lab 1）",
                "Evaluator-Optimizer：自动评估和迭代优化（Lab 2）",
                "Eval Framework：系统化的 Agent 评测体系（Lab 3）",
              ],
            },
          ],
        },
        {
          title: "Orchestrator 的设计原则",
          blocks: [
            {
              type: "paragraph",
              text: "Orchestrator-Workers 模式的核心不在于「并行」，而在于「分解」。好的任务分解决定了 Agent 的上限。",
            },
            {
              type: "heading",
              level: 3,
              text: "分解的原则",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "每个子任务应该是自包含的——Worker 不需要知道其他 Worker 在做什么",
                "子任务的粒度要适当——太粗则 Worker 负担重，太细则 Orchestrator 开销大",
                "明确指定每个子任务的目标文件——避免 Worker 之间修改同一文件",
                "考虑依赖关系——有些子任务必须在其他完成后才能开始",
              ],
            },
            {
              type: "callout",
              variant: "tip",
              text: "实践经验：让 Orchestrator 在分解时就为每个子任务指定目标文件列表。如果两个子任务的目标文件有重叠，就合并它们。",
            },
          ],
        },
        {
          title: "Lab 1: Orchestrator 实现",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 1 实战指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: plan() — 任务分解",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def plan(self, task, file_list):
    # 用 LLM 分析任务，生成子任务计划
    prompt = f"""分析以下任务并分解为子任务。

任务：{task}
项目文件：{file_list}

为每个子任务指定：
- description: 子任务描述
- target_files: 需要修改的文件
- dependencies: 依赖的其他子任务 ID

以 JSON 格式回应。"""

    response = self.llm_client.create_message(prompt)
    subtasks = parse_subtasks(response)

    return OrchestratorPlan(
        task_description=task,
        subtasks=subtasks,
    )`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: execute_plan() — 执行计划",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def execute_plan(self, plan):
    results = []

    # 按依赖顺序执行子任务
    ordered = self._resolve_dependencies(plan.subtasks)
    for subtask in ordered:
        result = self._run_worker(subtask)
        results.append(result)

    # 合并结果并检测冲突
    files_modified, conflicts = self._merge_results(results)

    # 全局验证
    validation_passed = self._validate(results)

    return OrchestratorResult(
        success=len(conflicts) == 0 and validation_passed,
        worker_results=results,
        conflicts=conflicts,
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
              code: `# 运行 Lab 1 测试
pytest tests/test_lab1_orchestrator.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "4.1.1",
          title: "实现 plan() 任务分解",
          description:
            "用 LLM 分析任务和项目文件结构，自动分解为多个子任务。每个子任务指定目标文件和依赖关系。",
          labFile: "phase_4/orchestrator.py",
          hints: [
            "将文件列表提供给 LLM 作为上下文",
            "要求 LLM 以 JSON 格式返回子任务列表",
            "限制子任务数量不超过 config.max_subtasks",
          ],
          pseudocode: `prompt = build_plan_prompt(task, file_list)
response = llm.call(prompt)
subtasks = json.loads(response)
return OrchestratorPlan(subtasks=subtasks)`,
        },
        {
          id: "4.1.2",
          title: "实现 execute_plan() 和 _run_worker()",
          description:
            "按顺序执行子任务，每个子任务由独立的 Worker（简化版 Agent Loop）完成。",
          labFile: "phase_4/orchestrator.py",
          hints: [
            "Worker 可以是简化版的 Agent Loop",
            "每个 Worker 只能访问分配的文件",
            "记录每个 Worker 的结果和修改的文件",
          ],
        },
        {
          id: "4.1.3",
          title: "实现 _merge_results() 和 _validate()",
          description:
            "合并所有 Worker 的修改结果，检测文件冲突，运行全局验证。",
          labFile: "phase_4/orchestrator.py",
          hints: [
            "如果两个 Worker 修改了同一文件，标记为冲突",
            "验证可以是运行测试或语法检查",
            "冲突时 success 应为 False",
          ],
        },
      ],
      acceptanceCriteria: [
        "plan() 能将任务分解为合理的子任务",
        "Worker 能独立执行子任务",
        "冲突检测正确识别文件冲突",
        "全局验证在 Worker 完成后运行",
        "所有 Lab 1 测试通过",
      ],
      references: [
        {
          title: "Building Effective Agents — Orchestrator-Workers",
          description:
            "Anthropic 对 Orchestrator-Workers 模式的设计建议。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "MapReduce Pattern",
          description:
            "分布式计算中的 MapReduce 模式，与 Orchestrator-Workers 有相似理念。",
          url: "https://en.wikipedia.org/wiki/MapReduce",
        },
      ],
    },

    // ─── Lesson 2: Evaluator-Optimizer ───────────────────────────────
    {
      phaseId: 4,
      lessonId: 2,
      title: "Evaluator-Optimizer 循环",
      subtitle: "Auto-scoring & Iterative Improvement",
      type: "概念 + 实践",
      duration: "2.5 hrs",
      objectives: [
        "设计评分 Rubric：明确、可衡量的评估标准",
        "实现 LLM-based 自动评分",
        "构建 Generate → Evaluate → Feedback → Improve 循环",
        "实现 Voting 机制：多方案取最优",
      ],
      sections: [
        {
          title: "Evaluator-Optimizer 的核心思想",
          blocks: [
            {
              type: "paragraph",
              text: "Evaluator-Optimizer 是让 Agent 自我改进的关键模式。核心循环：生成 → 评估 → 反馈 → 改进 → 再评估，直到达到质量标准。",
            },
            {
              type: "diagram",
              content:
                "┌──────────┐    ┌───────────┐    ┌──────────┐\n│Generator │───→│ Evaluator │───→│ score≥4? │\n│ (生成代码) │    │ (按 Rubric │    │          │\n└──────────┘    │   逐项打分) │    └────┬─────┘\n     ▲          └───────────┘         │\n     │                            No  │  Yes\n     │          ┌───────────┐         │    │\n     └──────────│ Feedback  │◄────────┘    │\n                │(改进建议)  │              ▼\n                └───────────┘         ┌────────┐\n                                      │ Output │\n                                      └────────┘",
            },
            {
              type: "heading",
              level: 3,
              text: "Rubric 设计",
            },
            {
              type: "paragraph",
              text: "好的 Rubric 是 Evaluator 的核心。每个评分项应该：明确、可衡量、有权重。",
            },
            {
              type: "code",
              language: "python",
              code: `rubric = Rubric(name="code_quality", items=[
    RubricItem(name="correctness", description="代码逻辑正确，无 bug", weight=2.0),
    RubricItem(name="readability", description="命名清晰，结构合理", weight=1.0),
    RubricItem(name="error_handling", description="异常处理完善", weight=1.5),
    RubricItem(name="efficiency", description="时间复杂度合理", weight=1.0),
])`,
            },
          ],
        },
        {
          title: "Lab 2: Evaluator 实现",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 2 实战指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: evaluate() — 按 Rubric 评分",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def evaluate(self, code, rubric):
    scores = []
    for item in rubric.items:
        score = self._score_item(code, item)
        scores.append(score)

    total = sum(s.score * item.weight for s, item in zip(scores, rubric.items))
    max_possible = sum(item.max_score * item.weight for item in rubric.items)
    feedback = self._generate_feedback(scores)

    return EvalResult(
        scores=scores,
        total_score=total,
        max_possible=max_possible,
        feedback=feedback,
    )`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: optimize() — 迭代优化循环",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def optimize(self, code, rubric, generator_fn):
    history = []
    current_code = code

    for i in range(self.config.max_iterations):
        result = self.evaluate(current_code, rubric)
        history.append(result)

        if result.total_score >= self.config.target_score:
            break  # 达到目标分数

        # 生成改进版本
        current_code = generator_fn(current_code, result.feedback)

    return (current_code, history)`,
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
pytest tests/test_lab2_evaluator.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "4.2.1",
          title: "实现 evaluate() 和 _score_item()",
          description:
            "用 LLM 按 Rubric 逐项评分。每项返回 1-5 分、推理过程和改进建议。",
          labFile: "phase_4/evaluator.py",
          hints: [
            "为每个 rubric item 构建评分 prompt",
            "要求 LLM 以 JSON 返回 score 和 reasoning",
            "确保 score 在 1-5 范围内",
          ],
        },
        {
          id: "4.2.2",
          title: "实现 optimize() 迭代优化",
          description:
            "构建 Generate → Evaluate → Feedback → Improve 循环。每轮将评分反馈传给 generator 改进代码。",
          labFile: "phase_4/evaluator.py",
          hints: [
            "最多迭代 config.max_iterations 次",
            "分数达到 target_score 提前停止",
            "记录每轮的 EvalResult 用于对比",
          ],
        },
        {
          id: "4.2.3",
          title: "实现 vote() Voting 机制",
          description:
            "用不同 prompt 生成多个候选方案，分别评分，选择最高分方案。",
          labFile: "phase_4/evaluator.py",
          hints: [
            "逐个评估每个候选方案",
            "比较 total_score 选最高",
            "返回最佳方案和所有评分结果",
          ],
        },
      ],
      acceptanceCriteria: [
        "evaluate() 能按 rubric 逐项打分",
        "optimize() 迭代改进分数可衡量提升",
        "vote() 从多个候选中选出最优",
        "所有 Lab 2 测试通过",
      ],
      references: [
        {
          title: "Building Effective Agents — Evaluator-Optimizer",
          description:
            "Anthropic 对 Evaluator-Optimizer 模式的设计建议。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "SWE-bench",
          description:
            "软件工程 Agent 的标准评测基准。",
          url: "https://www.swebench.com/",
        },
      ],
    },

    // ─── Lesson 3: Eval Framework ────────────────────────────────────
    {
      phaseId: 4,
      lessonId: 3,
      title: "Eval 体系建设",
      subtitle: "Systematic Agent Evaluation Framework",
      type: "设计 + 实践",
      duration: "3 hrs",
      objectives: [
        "理解 Eval 驱动开发的重要性",
        "设计分层测试：easy / medium / hard",
        "实现 Eval Case 和 Suite 的运行框架",
        "建立 Baseline 对比和 Regression 检测",
      ],
      sections: [
        {
          title: "为什么 Eval 是 Agent 开发的核心",
          blocks: [
            {
              type: "paragraph",
              text: "Anthropic 的第五个设计原则：「用 Eval 驱动开发」。没有 eval 的 Agent 开发就是盲人摸象。",
            },
            {
              type: "callout",
              variant: "quote",
              text: "像写测试驱动的软件一样构建 Agent。建立评测集、设定 baseline、量化每次改动的影响。",
            },
            {
              type: "heading",
              level: 3,
              text: "Eval 的三个层次",
            },
            {
              type: "table",
              headers: ["层次", "测试内容", "例子"],
              rows: [
                ["Easy (5 cases)", "单文件简单修改", "修复 typo、添加 docstring"],
                ["Medium (10 cases)", "多步骤、需搜索和分析", "重构函数、修复 bug"],
                ["Hard (5 cases)", "多文件、理解项目结构", "添加新功能、安全修复"],
              ],
            },
          ],
        },
        {
          title: "Lab 3: Eval Framework 实现",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 3 实战指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: run_case() — 单 Case 执行",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def run_case(self, case, agent_fn):
    start = time.time()
    try:
        output = agent_fn(case.task)
        passed = self._validate_output(case, output)
        return EvalRunResult(
            case_id=case.id,
            passed=passed,
            actual_output=output,
            duration_ms=(time.time() - start) * 1000,
        )
    except Exception as e:
        return EvalRunResult(
            case_id=case.id,
            passed=False,
            error=str(e),
        )`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: run_all() — 全套执行",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def run_all(self, agent_fn):
    results = [self.run_case(case, agent_fn) for case in self.cases]
    pass_rate = sum(r.passed for r in results) / len(results)
    return EvalSuiteResult(
        results=results,
        pass_rate=pass_rate,
        avg_tokens=avg(r.tokens_used for r in results),
    )`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 3: compare() — Baseline 对比",
            },
            {
              type: "code",
              language: "python",
              code: `# 伪代码
def compare(self, baseline, current):
    diff = current.pass_rate - baseline.pass_rate
    if diff > 0:
        return f"✓ Improvement: {diff:+.1%}"
    elif diff < 0:
        return f"✗ Regression: {diff:+.1%}"
    else:
        return "= No change"`,
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
pytest tests/test_lab3_eval_framework.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "4.3.1",
          title: "实现 run_case() 和 _validate_output()",
          description:
            "执行单个 eval case，调用 agent_fn 处理任务，用 case 的 validator 验证输出。",
          labFile: "phase_4/eval_framework.py",
          hints: [
            "记录执行时间和 token 消耗",
            "捕获异常，标记为失败而非崩溃",
            "使用 case.validator 验证输出",
          ],
        },
        {
          id: "4.3.2",
          title: "实现 run_all() 聚合执行",
          description:
            "运行所有 eval cases，计算聚合指标：通过率、平均 token、平均耗时。",
          labFile: "phase_4/eval_framework.py",
          hints: [
            "遍历所有 cases 调用 run_case",
            "pass_rate = passed / total",
            "处理 division by zero（空 cases 列表）",
          ],
        },
        {
          id: "4.3.3",
          title: "实现 compare() Baseline 对比",
          description:
            "对比两次 eval 结果，显示改进或退步，用于 regression 检测。",
          labFile: "phase_4/eval_framework.py",
          hints: [
            "比较 pass_rate 的差异",
            "显示每个 case 的结果变化",
            "正向变化 = improvement，负向 = regression",
          ],
        },
      ],
      acceptanceCriteria: [
        "run_case 正确执行并验证输出",
        "run_all 聚合指标计算正确",
        "compare 能检测改进和退步",
        "所有 Lab 3 测试通过",
      ],
      references: [
        {
          title: "SWE-bench 评测方法论",
          description:
            "了解业界如何评测 coding agent 的能力。",
          url: "https://www.swebench.com/",
        },
        {
          title: "Building Effective Agents — Eval",
          description:
            "Anthropic 对 eval 驱动开发的建议。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
      ],
    },

    // ─── Lesson 4: 整合与回顾 ────────────────────────────────────────
    {
      phaseId: 4,
      lessonId: 4,
      title: "整合与回顾",
      subtitle: "Full Orchestration Integration & Benchmarking",
      type: "项目实践",
      duration: "4 hrs",
      objectives: [
        "整合 Orchestrator、Evaluator 和 Eval Framework",
        "运行完整的 Eval Suite 并建立 Baseline",
        "用 Evaluator-Optimizer 改进 Agent 输出",
        "回顾 Phase 4 核心知识点",
      ],
      sections: [
        {
          title: "Phase 4 整合",
          blocks: [
            {
              type: "paragraph",
              text: "将三个模块整合：用 Orchestrator 处理复杂任务，用 Evaluator 评分和优化，用 Eval Framework 量化 Agent 的整体表现。",
            },
            {
              type: "diagram",
              content:
                "┌───────────────────────────────────────────┐\n│              Phase 4 系统整合              │\n│                                           │\n│  ┌─────────────┐     ┌──────────────┐    │\n│  │Orchestrator │────→│  Evaluator   │    │\n│  │(分解+执行)   │     │  (评分+优化)  │    │\n│  └──────┬──────┘     └──────┬───────┘    │\n│         │                   │            │\n│         └───────┬───────────┘            │\n│                 │                        │\n│         ┌───────▼──────┐                 │\n│         │Eval Framework│                 │\n│         │(量化+对比)    │                 │\n│         └──────────────┘                 │\n└───────────────────────────────────────────┘",
            },
          ],
        },
        {
          title: "回顾与展望",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Phase 4 核心收获",
            },
            {
              type: "table",
              headers: ["模块", "核心能力", "对应设计原则"],
              rows: [
                ["Orchestrator", "复杂任务分解和多 Worker 协同", "从简单开始，按需增加复杂度"],
                ["Evaluator", "自动评分和迭代优化", "用 Eval 驱动开发"],
                ["Eval Framework", "系统化的量化评测", "用 Eval 驱动开发"],
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "下一步：Phase 5 — Ship It",
            },
            {
              type: "paragraph",
              text: "Phase 0-4 完成了 Agent 的所有核心能力。Phase 5 将把它们整合为一个可发布的 CLI 产品：美观的 UI、完善的配置系统、Session 持久化。你的 Agent 将从实验室走向用户手中。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "4.4.1",
          title: "运行全部测试",
          description:
            "运行完整测试套件，确保 Lab 1-3 的所有 TODO 都已正确实现。",
          labFile: "phase_4/",
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
          id: "4.4.2",
          title: "运行 Eval Suite 建立 Baseline",
          description:
            "使用 Eval Framework 运行 20+ 个测试 case，建立 Agent 的 baseline 数据。",
          labFile: "phase_4/cli.py",
          hints: [
            "先运行 easy cases 确认基本功能",
            "记录 pass_rate 和 avg_tokens 作为 baseline",
            "分析失败的 cases，找到改进方向",
          ],
        },
        {
          id: "4.4.3",
          title: "Evaluator-Optimizer 优化循环",
          description:
            "选择一个 Agent 输出，用 Evaluator 评分，根据反馈改进，观察分数提升。",
          labFile: "phase_4/cli.py",
          hints: [
            "先定义一个 code quality rubric",
            "观察每轮迭代的分数变化",
            "尝试 voting 机制对比效果",
          ],
        },
      ],
      acceptanceCriteria: [
        "pytest 全部测试通过",
        "grade.py 显示 100% 完成度",
        "Eval Suite 包含 20+ 个 cases",
        "有 baseline 数据可供对比",
        "Evaluator 迭代后分数可衡量提升",
      ],
      references: [
        {
          title: "pytest 文档",
          description: "Python 测试框架。",
          url: "https://docs.pytest.org/en/stable/",
        },
        {
          title: "Building Effective Agents",
          description:
            "回顾 Orchestrator-Workers 和 Evaluator-Optimizer 部分。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "SWE-bench Leaderboard",
          description:
            "查看各 Agent 在 SWE-bench 上的表现对比。",
          url: "https://www.swebench.com/",
        },
      ],
    },
  ],
};
