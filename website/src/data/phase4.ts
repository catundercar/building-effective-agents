import type { PhaseContent } from "./types";

export const phase4Content: PhaseContent = {
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
      type: "概念 + 實踐",
      duration: "3.5 hrs",
      objectives: [
        "理解 Orchestrator 的職責：分析 → 分解 → 分派 → 聚合",
        "實現動態任務分解：LLM 根據項目結構規劃子任務",
        "設計 Worker 的獨立性：每個 Worker 有獨立的 context",
        "實現結果合併和衝突檢測",
        "理解並行執行的挑戰",
      ],
      sections: [
        {
          title: "Phase 導讀：為什麼需要高階模式",
          blocks: [
            {
              type: "callout",
              variant: "quote",
              text: "Week 9-10 · Orchestration & Evaluation\nPhase 3 的 Agent 能自主解決問題了——但一次只能處理一個任務。\n真實的編程工作往往涉及多個文件、多個步驟的協同修改。",
            },
            {
              type: "heading",
              level: 3,
              text: "從單 Agent 到多 Worker",
            },
            {
              type: "paragraph",
              text: "想像你要「重構一個項目的錯誤處理邏輯」。這涉及：分析所有文件 → 識別需要修改的部分 → 逐個修改 → 確保不衝突 → 運行測試。一個 Agent 做所有事情太慢，也容易 context 溢出。",
            },
            {
              type: "diagram",
              content:
                "┌──────────────────────────────────────────────┐\n│            Orchestrator (指揮官)               │\n│                                              │\n│   分析任務 → 分解子任務 → 分派 → 聚合結果      │\n└──────────┬──────────┬──────────┬──────────────┘\n           │          │          │\n     ┌─────▼────┐ ┌──▼─────┐ ┌─▼────────┐\n     │ Worker 1 │ │Worker 2│ │ Worker 3 │\n     │ file-a.py│ │file-b  │ │ file-c   │\n     └─────┬────┘ └──┬─────┘ └─┬────────┘\n           │          │          │\n     ┌─────▼──────────▼──────────▼────────┐\n     │          合併 & 驗證                │\n     │  衝突檢測 → 測試運行 → 最終結果     │\n     └────────────────────────────────────┘",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "Orchestrator-Workers：動態分解和分派複雜任務（Lab 1）",
                "Evaluator-Optimizer：自動評估和迭代優化（Lab 2）",
                "Eval Framework：系統化的 Agent 評測體系（Lab 3）",
              ],
            },
          ],
        },
        {
          title: "Orchestrator 的設計原則",
          blocks: [
            {
              type: "paragraph",
              text: "Orchestrator-Workers 模式的核心不在於「並行」，而在於「分解」。好的任務分解決定了 Agent 的上限。",
            },
            {
              type: "heading",
              level: 3,
              text: "分解的原則",
            },
            {
              type: "list",
              ordered: true,
              items: [
                "每個子任務應該是自包含的——Worker 不需要知道其他 Worker 在做什麼",
                "子任務的粒度要適當——太粗則 Worker 負擔重，太細則 Orchestrator 開銷大",
                "明確指定每個子任務的目標文件——避免 Worker 之間修改同一文件",
                "考慮依賴關係——有些子任務必須在其他完成後才能開始",
              ],
            },
            {
              type: "callout",
              variant: "tip",
              text: "實踐經驗：讓 Orchestrator 在分解時就為每個子任務指定目標文件列表。如果兩個子任務的目標文件有重疊，就合併它們。",
            },
          ],
        },
        {
          title: "Lab 1: Orchestrator 實現",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 1 實戰指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: plan() — 任務分解",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def plan(self, task, file_list):
    # 用 LLM 分析任務，生成子任務計劃
    prompt = f"""分析以下任務並分解為子任務。

任務：{task}
項目文件：{file_list}

為每個子任務指定：
- description: 子任務描述
- target_files: 需要修改的文件
- dependencies: 依賴的其他子任務 ID

以 JSON 格式回應。"""

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
              text: "Step 2: execute_plan() — 執行計劃",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def execute_plan(self, plan):
    results = []

    # 按依賴順序執行子任務
    ordered = self._resolve_dependencies(plan.subtasks)
    for subtask in ordered:
        result = self._run_worker(subtask)
        results.append(result)

    # 合併結果並檢測衝突
    files_modified, conflicts = self._merge_results(results)

    # 全局驗證
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
          title: "測試你的實現",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: `# 運行 Lab 1 測試
pytest tests/test_lab1_orchestrator.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "4.1.1",
          title: "實現 plan() 任務分解",
          description:
            "用 LLM 分析任務和項目文件結構，自動分解為多個子任務。每個子任務指定目標文件和依賴關係。",
          labFile: "phase_4/orchestrator.py",
          hints: [
            "將文件列表提供給 LLM 作為上下文",
            "要求 LLM 以 JSON 格式返回子任務列表",
            "限制子任務數量不超過 config.max_subtasks",
          ],
          pseudocode: `prompt = build_plan_prompt(task, file_list)
response = llm.call(prompt)
subtasks = json.loads(response)
return OrchestratorPlan(subtasks=subtasks)`,
        },
        {
          id: "4.1.2",
          title: "實現 execute_plan() 和 _run_worker()",
          description:
            "按順序執行子任務，每個子任務由獨立的 Worker（簡化版 Agent Loop）完成。",
          labFile: "phase_4/orchestrator.py",
          hints: [
            "Worker 可以是簡化版的 Agent Loop",
            "每個 Worker 只能訪問分配的文件",
            "記錄每個 Worker 的結果和修改的文件",
          ],
        },
        {
          id: "4.1.3",
          title: "實現 _merge_results() 和 _validate()",
          description:
            "合併所有 Worker 的修改結果，檢測文件衝突，運行全局驗證。",
          labFile: "phase_4/orchestrator.py",
          hints: [
            "如果兩個 Worker 修改了同一文件，標記為衝突",
            "驗證可以是運行測試或語法檢查",
            "衝突時 success 應為 False",
          ],
        },
      ],
      acceptanceCriteria: [
        "plan() 能將任務分解為合理的子任務",
        "Worker 能獨立執行子任務",
        "衝突檢測正確識別文件衝突",
        "全局驗證在 Worker 完成後運行",
        "所有 Lab 1 測試通過",
      ],
      references: [
        {
          title: "Building Effective Agents — Orchestrator-Workers",
          description:
            "Anthropic 對 Orchestrator-Workers 模式的設計建議。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "MapReduce Pattern",
          description:
            "分佈式計算中的 MapReduce 模式，與 Orchestrator-Workers 有相似理念。",
          url: "https://en.wikipedia.org/wiki/MapReduce",
        },
      ],
    },

    // ─── Lesson 2: Evaluator-Optimizer ───────────────────────────────
    {
      phaseId: 4,
      lessonId: 2,
      title: "Evaluator-Optimizer 循環",
      subtitle: "Auto-scoring & Iterative Improvement",
      type: "概念 + 實踐",
      duration: "2.5 hrs",
      objectives: [
        "設計評分 Rubric：明確、可衡量的評估標準",
        "實現 LLM-based 自動評分",
        "構建 Generate → Evaluate → Feedback → Improve 循環",
        "實現 Voting 機制：多方案取最優",
      ],
      sections: [
        {
          title: "Evaluator-Optimizer 的核心思想",
          blocks: [
            {
              type: "paragraph",
              text: "Evaluator-Optimizer 是讓 Agent 自我改進的關鍵模式。核心循環：生成 → 評估 → 反饋 → 改進 → 再評估，直到達到質量標準。",
            },
            {
              type: "diagram",
              content:
                "┌──────────┐    ┌───────────┐    ┌──────────┐\n│Generator │───→│ Evaluator │───→│ score≥4? │\n│ (生成代碼) │    │ (按 Rubric │    │          │\n└──────────┘    │   逐項打分) │    └────┬─────┘\n     ▲          └───────────┘         │\n     │                            No  │  Yes\n     │          ┌───────────┐         │    │\n     └──────────│ Feedback  │◄────────┘    │\n                │(改進建議)  │              ▼\n                └───────────┘         ┌────────┐\n                                      │ Output │\n                                      └────────┘",
            },
            {
              type: "heading",
              level: 3,
              text: "Rubric 設計",
            },
            {
              type: "paragraph",
              text: "好的 Rubric 是 Evaluator 的核心。每個評分項應該：明確、可衡量、有權重。",
            },
            {
              type: "code",
              language: "python",
              code: `rubric = Rubric(name="code_quality", items=[
    RubricItem(name="correctness", description="代碼邏輯正確，無 bug", weight=2.0),
    RubricItem(name="readability", description="命名清晰，結構合理", weight=1.0),
    RubricItem(name="error_handling", description="異常處理完善", weight=1.5),
    RubricItem(name="efficiency", description="時間複雜度合理", weight=1.0),
])`,
            },
          ],
        },
        {
          title: "Lab 2: Evaluator 實現",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 2 實戰指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: evaluate() — 按 Rubric 評分",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
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
              text: "Step 2: optimize() — 迭代優化循環",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def optimize(self, code, rubric, generator_fn):
    history = []
    current_code = code

    for i in range(self.config.max_iterations):
        result = self.evaluate(current_code, rubric)
        history.append(result)

        if result.total_score >= self.config.target_score:
            break  # 達到目標分數

        # 生成改進版本
        current_code = generator_fn(current_code, result.feedback)

    return (current_code, history)`,
            },
          ],
        },
        {
          title: "測試你的實現",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: `# 運行 Lab 2 測試
pytest tests/test_lab2_evaluator.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "4.2.1",
          title: "實現 evaluate() 和 _score_item()",
          description:
            "用 LLM 按 Rubric 逐項評分。每項返回 1-5 分、推理過程和改進建議。",
          labFile: "phase_4/evaluator.py",
          hints: [
            "為每個 rubric item 構建評分 prompt",
            "要求 LLM 以 JSON 返回 score 和 reasoning",
            "確保 score 在 1-5 範圍內",
          ],
        },
        {
          id: "4.2.2",
          title: "實現 optimize() 迭代優化",
          description:
            "構建 Generate → Evaluate → Feedback → Improve 循環。每輪將評分反饋傳給 generator 改進代碼。",
          labFile: "phase_4/evaluator.py",
          hints: [
            "最多迭代 config.max_iterations 次",
            "分數達到 target_score 提前停止",
            "記錄每輪的 EvalResult 用於對比",
          ],
        },
        {
          id: "4.2.3",
          title: "實現 vote() Voting 機制",
          description:
            "用不同 prompt 生成多個候選方案，分別評分，選擇最高分方案。",
          labFile: "phase_4/evaluator.py",
          hints: [
            "逐個評估每個候選方案",
            "比較 total_score 選最高",
            "返回最佳方案和所有評分結果",
          ],
        },
      ],
      acceptanceCriteria: [
        "evaluate() 能按 rubric 逐項打分",
        "optimize() 迭代改進分數可衡量提升",
        "vote() 從多個候選中選出最優",
        "所有 Lab 2 測試通過",
      ],
      references: [
        {
          title: "Building Effective Agents — Evaluator-Optimizer",
          description:
            "Anthropic 對 Evaluator-Optimizer 模式的設計建議。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "SWE-bench",
          description:
            "軟體工程 Agent 的標準評測基準。",
          url: "https://www.swebench.com/",
        },
      ],
    },

    // ─── Lesson 3: Eval Framework ────────────────────────────────────
    {
      phaseId: 4,
      lessonId: 3,
      title: "Eval 體系建設",
      subtitle: "Systematic Agent Evaluation Framework",
      type: "設計 + 實踐",
      duration: "3 hrs",
      objectives: [
        "理解 Eval 驅動開發的重要性",
        "設計分層測試：easy / medium / hard",
        "實現 Eval Case 和 Suite 的運行框架",
        "建立 Baseline 對比和 Regression 檢測",
      ],
      sections: [
        {
          title: "為什麼 Eval 是 Agent 開發的核心",
          blocks: [
            {
              type: "paragraph",
              text: "Anthropic 的第五個設計原則：「用 Eval 驅動開發」。沒有 eval 的 Agent 開發就是盲人摸象。",
            },
            {
              type: "callout",
              variant: "quote",
              text: "像寫測試驅動的軟件一樣構建 Agent。建立評測集、設定 baseline、量化每次改動的影響。",
            },
            {
              type: "heading",
              level: 3,
              text: "Eval 的三個層次",
            },
            {
              type: "table",
              headers: ["層次", "測試內容", "例子"],
              rows: [
                ["Easy (5 cases)", "單文件簡單修改", "修復 typo、添加 docstring"],
                ["Medium (10 cases)", "多步驟、需搜索和分析", "重構函數、修復 bug"],
                ["Hard (5 cases)", "多文件、理解項目結構", "添加新功能、安全修復"],
              ],
            },
          ],
        },
        {
          title: "Lab 3: Eval Framework 實現",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 3 實戰指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: run_case() — 單 Case 執行",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
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
              text: "Step 2: run_all() — 全套執行",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
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
              text: "Step 3: compare() — Baseline 對比",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
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
          title: "測試你的實現",
          blocks: [
            {
              type: "code",
              language: "bash",
              code: `# 運行 Lab 3 測試
pytest tests/test_lab3_eval_framework.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "4.3.1",
          title: "實現 run_case() 和 _validate_output()",
          description:
            "執行單個 eval case，調用 agent_fn 處理任務，用 case 的 validator 驗證輸出。",
          labFile: "phase_4/eval_framework.py",
          hints: [
            "記錄執行時間和 token 消耗",
            "捕獲異常，標記為失敗而非崩潰",
            "使用 case.validator 驗證輸出",
          ],
        },
        {
          id: "4.3.2",
          title: "實現 run_all() 聚合執行",
          description:
            "運行所有 eval cases，計算聚合指標：通過率、平均 token、平均耗時。",
          labFile: "phase_4/eval_framework.py",
          hints: [
            "遍歷所有 cases 調用 run_case",
            "pass_rate = passed / total",
            "處理 division by zero（空 cases 列表）",
          ],
        },
        {
          id: "4.3.3",
          title: "實現 compare() Baseline 對比",
          description:
            "對比兩次 eval 結果，顯示改進或退步，用於 regression 檢測。",
          labFile: "phase_4/eval_framework.py",
          hints: [
            "比較 pass_rate 的差異",
            "顯示每個 case 的結果變化",
            "正向變化 = improvement，負向 = regression",
          ],
        },
      ],
      acceptanceCriteria: [
        "run_case 正確執行並驗證輸出",
        "run_all 聚合指標計算正確",
        "compare 能檢測改進和退步",
        "所有 Lab 3 測試通過",
      ],
      references: [
        {
          title: "SWE-bench 評測方法論",
          description:
            "了解業界如何評測 coding agent 的能力。",
          url: "https://www.swebench.com/",
        },
        {
          title: "Building Effective Agents — Eval",
          description:
            "Anthropic 對 eval 驅動開發的建議。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
      ],
    },

    // ─── Lesson 4: 整合與回顧 ────────────────────────────────────────
    {
      phaseId: 4,
      lessonId: 4,
      title: "整合與回顧",
      subtitle: "Full Orchestration Integration & Benchmarking",
      type: "項目實踐",
      duration: "4 hrs",
      objectives: [
        "整合 Orchestrator、Evaluator 和 Eval Framework",
        "運行完整的 Eval Suite 並建立 Baseline",
        "用 Evaluator-Optimizer 改進 Agent 輸出",
        "回顧 Phase 4 核心知識點",
      ],
      sections: [
        {
          title: "Phase 4 整合",
          blocks: [
            {
              type: "paragraph",
              text: "將三個模塊整合：用 Orchestrator 處理複雜任務，用 Evaluator 評分和優化，用 Eval Framework 量化 Agent 的整體表現。",
            },
            {
              type: "diagram",
              content:
                "┌───────────────────────────────────────────┐\n│              Phase 4 系統整合              │\n│                                           │\n│  ┌─────────────┐     ┌──────────────┐    │\n│  │Orchestrator │────→│  Evaluator   │    │\n│  │(分解+執行)   │     │  (評分+優化)  │    │\n│  └──────┬──────┘     └──────┬───────┘    │\n│         │                   │            │\n│         └───────┬───────────┘            │\n│                 │                        │\n│         ┌───────▼──────┐                 │\n│         │Eval Framework│                 │\n│         │(量化+對比)    │                 │\n│         └──────────────┘                 │\n└───────────────────────────────────────────┘",
            },
          ],
        },
        {
          title: "回顧與展望",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Phase 4 核心收穫",
            },
            {
              type: "table",
              headers: ["模塊", "核心能力", "對應設計原則"],
              rows: [
                ["Orchestrator", "複雜任務分解和多 Worker 協同", "從簡單開始，按需增加複雜度"],
                ["Evaluator", "自動評分和迭代優化", "用 Eval 驅動開發"],
                ["Eval Framework", "系統化的量化評測", "用 Eval 驅動開發"],
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "下一步：Phase 5 — Ship It",
            },
            {
              type: "paragraph",
              text: "Phase 0-4 完成了 Agent 的所有核心能力。Phase 5 將把它們整合為一個可發布的 CLI 產品：美觀的 UI、完善的配置系統、Session 持久化。你的 Agent 將從實驗室走向用戶手中。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "4.4.1",
          title: "運行全部測試",
          description:
            "運行完整測試套件，確保 Lab 1-3 的所有 TODO 都已正確實現。",
          labFile: "phase_4/",
          hints: [
            "pytest -v 顯示每個測試的詳細結果",
            "pytest -x 遇到第一個失敗就停止",
          ],
          pseudocode: `# 運行所有測試
pytest -v

# 查看成績報告
python scripts/grade.py`,
        },
        {
          id: "4.4.2",
          title: "運行 Eval Suite 建立 Baseline",
          description:
            "使用 Eval Framework 運行 20+ 個測試 case，建立 Agent 的 baseline 數據。",
          labFile: "phase_4/cli.py",
          hints: [
            "先運行 easy cases 確認基本功能",
            "記錄 pass_rate 和 avg_tokens 作為 baseline",
            "分析失敗的 cases，找到改進方向",
          ],
        },
        {
          id: "4.4.3",
          title: "Evaluator-Optimizer 優化循環",
          description:
            "選擇一個 Agent 輸出，用 Evaluator 評分，根據反饋改進，觀察分數提升。",
          labFile: "phase_4/cli.py",
          hints: [
            "先定義一個 code quality rubric",
            "觀察每輪迭代的分數變化",
            "嘗試 voting 機制對比效果",
          ],
        },
      ],
      acceptanceCriteria: [
        "pytest 全部測試通過",
        "grade.py 顯示 100% 完成度",
        "Eval Suite 包含 20+ 個 cases",
        "有 baseline 數據可供對比",
        "Evaluator 迭代後分數可衡量提升",
      ],
      references: [
        {
          title: "pytest 文檔",
          description: "Python 測試框架。",
          url: "https://docs.pytest.org/en/stable/",
        },
        {
          title: "Building Effective Agents",
          description:
            "回顧 Orchestrator-Workers 和 Evaluator-Optimizer 部分。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "SWE-bench Leaderboard",
          description:
            "查看各 Agent 在 SWE-bench 上的表現對比。",
          url: "https://www.swebench.com/",
        },
      ],
    },
  ],
};
