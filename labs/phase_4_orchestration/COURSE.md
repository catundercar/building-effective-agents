# Phase 4 — 進化：高階模式與質量保障

> **Week 9-10 · Orchestration & Evaluation**
> 你的 Agent 已經有了穩固的基礎——能對話、能使用工具、能規劃工作流。
> 現在，是時候讓它進化了。本 Phase 將教你兩個強大的高階模式，
> 以及如何系統性地衡量 Agent 的能力。

---

## 4.0 Phase 導讀：為什麼需要高階模式

### 單 Agent 的瓶頸

回顧你在 Phase 3 構建的 Agent：它有一個 Agentic Loop，能自主規劃和執行任務。但當任務變得複雜時，你會遇到這些問題：

```
問題 1：任務太大
  用戶：「重構整個認證模塊，改用 JWT，更新所有相關測試」
  → 涉及 5+ 個文件，10+ 個函數修改
  → 單一 Agent 容易在長任務中迷失方向

問題 2：質量不穩定
  相同的任務，Agent 每次生成的代碼質量不一
  → 沒有系統性的評估方式
  → 無法知道 Agent 是在進步還是退步

問題 3：無法驗證
  Agent 說「完成了」，但如何確認質量？
  → 需要自動化的評估框架
  → 需要可量化的指標
```

### 兩個高階模式

Anthropic 在 "Building Effective Agents" 中定義了兩個關鍵的高階模式：

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  模式 1: Orchestrator-Workers                           │
│                                                         │
│  ┌──────────────┐                                       │
│  │ Orchestrator  │ ← 分析任務，分解為子任務              │
│  └──────┬───────┘                                       │
│         │                                               │
│    ┌────┼────┐                                          │
│    │    │    │                                           │
│    ▼    ▼    ▼                                           │
│  ┌───┐┌───┐┌───┐                                        │
│  │ W1 ││ W2 ││ W3 │ ← 每個 Worker 獨立完成子任務        │
│  └───┘└───┘└───┘                                        │
│    │    │    │                                           │
│    └────┼────┘                                          │
│         ▼                                               │
│  ┌──────────────┐                                       │
│  │   合併結果    │ ← 衝突檢測 + 全局驗證                 │
│  └──────────────┘                                       │
│                                                         │
│  模式 2: Evaluator-Optimizer                            │
│                                                         │
│  ┌──────────┐    feedback    ┌───────────┐              │
│  │ Evaluator │ ────────────→ │ Generator  │              │
│  │ (LLM 評分) │              │ (LLM 生成) │              │
│  │           │ ←──────────── │           │              │
│  └──────────┘  improved code └───────────┘              │
│       ↑                                                 │
│       │ rubric (評分標準)                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 第三根支柱：Eval 體系

除了這兩個模式，本 Phase 還有一個同樣重要的主題：**Eval（評測）體系**。

Eval 是衡量 Agent 能力的系統性方法：

```
Eval 體系 = 評測用例 + 自動驗證 + 指標追蹤

就像軟體測試一樣：
  - 單元測試 → 測試函數是否正確
  - Eval    → 測試 Agent 是否能完成任務
```

為什麼 Eval 如此重要？Anthropic 的第五條設計原則是：

> **Eval-driven development — measure everything**
> 
> 如果你無法衡量 Agent 的能力，你就無法改進它。
> 每次修改 prompt、工具或邏輯後，都應該跑 eval 來確認
> 修改是改進還是退步。

### 本 Phase 結構

```
Lesson 4.1: Orchestrator-Workers 模式    → Lab 1
Lesson 4.2: Evaluator-Optimizer 循環     → Lab 2
Lesson 4.3: Eval 體系建設               → Lab 3
Lesson 4.4: Phase 4 整合
```

---

## 4.1 概念課：Orchestrator-Workers 模式

### 為什麼需要任務分解

想像一個資深工程師接到一個大需求。他會怎麼做？

```
1. 分析需求，理解全局
2. 拆分為可獨立完成的子任務
3. 確定子任務之間的依賴關係
4. 分配給團隊成員執行
5. 收集結果，解決衝突，整合驗證
```

Orchestrator-Workers 模式就是讓 LLM 扮演這個「資深工程師」的角色。

### 架構詳解

```
                    ┌──────────────────────┐
                    │      用戶任務         │
                    │  "重構 auth 模塊，    │
                    │   改用 JWT tokens"    │
                    └──────────┬───────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │         Orchestrator            │
              │                                │
              │  1. 分析任務和文件結構           │
              │  2. 生成子任務計劃               │
              │  3. 拓撲排序確定執行順序         │
              │  4. 調度 Worker 執行             │
              │  5. 合併結果，解決衝突           │
              │  6. 全局驗證                     │
              └───────┬────────┬────────┬──────┘
                      │        │        │
              ┌───────┼────────┼────────┼──────┐
              │       │        │        │      │
              ▼       ▼        ▼        ▼      │
          ┌──────┐┌──────┐┌──────┐┌──────┐    │
          │ W-1  ││ W-2  ││ W-3  ││ W-4  │    │
          │      ││      ││      ││      │    │
          │JWT   ││Login ││Auth  ││Tests │    │
          │工具  ││端點  ││中間件 ││更新  │    │
          └──┬───┘└──┬───┘└──┬───┘└──┬───┘    │
              │       │       │       │        │
              └───────┼───────┼───────┘        │
                      │       │                │
                      ▼       ▼                │
              ┌────────────────────┐           │
              │   結果合併與驗證    │           │
              │                    │           │
              │  - 衝突檢測        │           │
              │  - 編譯測試        │           │
              │  - 整合驗證        │           │
              └────────────────────┘           │
              │                                │
              └────────────────────────────────┘
```

### 關鍵概念：子任務分解

好的任務分解遵循這些原則：

| 原則 | 說明 | 例子 |
|------|------|------|
| 單一職責 | 每個子任務只做一件事 | "創建 JWT 工具函數" 而非 "創建 JWT 並更新登入" |
| 明確邊界 | 子任務之間的文件不重疊 | Worker A 修改 auth.py，Worker B 修改 test_auth.py |
| 可驗證 | 每個子任務有明確的完成標準 | "函數通過指定測試" |
| 合理粒度 | 不太大也不太小 | 3-7 個子任務為宜 |

### 關鍵概念：依賴管理

子任務之間的依賴關係形成一個 DAG（有向無環圖）：

```
subtask_1 (JWT工具) ─────────────────────┐
      │                                  │
      ├───→ subtask_2 (更新登入端點) ──┐  │
      │                               │  │
      └───→ subtask_3 (認證中間件) ──┐ │  │
                                     │ │  │
                                     ▼ ▼  │
                              subtask_4   │
                              (更新測試) ──┘

拓撲排序結果: [subtask_1, subtask_2, subtask_3, subtask_4]
注意: subtask_2 和 subtask_3 沒有相互依賴，可以並行
```

我們使用 **Kahn's Algorithm**（拓撲排序）來確定執行順序。這個演算法已經在 `_resolve_dependencies()` 中為你實現了。

### 關鍵概念：衝突檢測

當多個 Worker 修改同一個文件時，就產生了衝突：

```
Worker 1 修改了: [auth.py, tokens.py]
Worker 2 修改了: [auth.py, middleware.py]
                  ^^^^^^^^^
                  衝突！兩個 Worker 都修改了 auth.py
```

在真實系統中，解決衝突需要：
1. 使用版本控制（git merge）
2. 讓 Orchestrator 用 LLM 合併修改
3. 或者設計子任務時避免文件重疊

在我們的 Lab 中，你只需要**檢測**衝突並報告，不需要自動解決。

### Lab 1 實戰指引

打開 `phase_4/orchestrator.py`，你會看到 6 個 TODO。建議的實現順序：

#### Step 1: `__init__()` — 初始化

最簡單的開始：

```
偽代碼:
self.llm_client = llm_client
self.tools = tools or []
self.config = config or OrchestratorConfig()
```

#### Step 2: `_validate()` — 全局驗證

從最簡單的方法開始：

```
偽代碼:
if not results:
    return False
return all(r.success for r in results)
```

#### Step 3: `_merge_results()` — 合併結果

```
偽代碼:
file_owners: dict[str, list[str]] = {}

for result in results:
    for file_path in result.files_modified:
        if file_path not in file_owners:
            file_owners[file_path] = []
        file_owners[file_path].append(result.subtask_id)

all_files = list(file_owners.keys())
conflicts = []

for file_path, owners in file_owners.items():
    if len(owners) > 1:
        conflict_msg = (
            f"File {file_path} modified by "
            + " and ".join(owners)
        )
        conflicts.append(conflict_msg)

return (all_files, conflicts)
```

#### Step 4: `_run_worker()` — 運行 Worker

```
偽代碼:
try:
    prompt = (
        f"Complete this subtask:\n{subtask.description}\n"
        f"Target files: {subtask.target_files}"
    )
    messages = [{"role": "user", "content": prompt}]

    response = self.llm_client.create_message(messages)

    # 提取回應文本
    output = ""
    for block in response.content:
        if hasattr(block, "text"):
            output += block.text

    return WorkerResult(
        subtask_id=subtask.id,
        success=True,
        output=output,
        files_modified=subtask.target_files,
        tokens_used=getattr(response.usage, "output_tokens", 0)
    )
except Exception as e:
    return WorkerResult(
        subtask_id=subtask.id,
        success=False,
        output=str(e),
        tokens_used=0
    )
```

注意：在測試中 `llm_client.create_message` 是被 mock 的，所以你需要處理 mock 對象的特殊行為。上述偽代碼展示的是真實使用場景中的邏輯。測試中只需確保調用 `create_message` 並返回正確的 `WorkerResult` 即可。

#### Step 5: `plan()` — 任務分解

```
偽代碼:
if not task:
    raise ValueError("Task description cannot be empty")

prompt = (
    "Decompose this task into subtasks.\n"
    f"Task: {task}\n"
    f"Files: {file_list}\n"
    f"Max subtasks: {self.config.max_subtasks}\n"
    "Return a JSON array of subtasks:\n"
    '[{"id": "st_1", "description": "...", '
    '"target_files": [...], "dependencies": [...]}]'
)

messages = [Message(role="user", content=prompt)]
response = self.llm_client.create_message(messages)

# 解析 JSON
text = response.content[0].text
subtasks_data = json.loads(text)

# 限制數量
subtasks_data = subtasks_data[:self.config.max_subtasks]

subtasks = [
    SubTask(
        id=item["id"],
        description=item["description"],
        target_files=item.get("target_files", []),
        dependencies=item.get("dependencies", []),
    )
    for item in subtasks_data
]

return OrchestratorPlan(
    task_description=task,
    subtasks=subtasks,
    created_at=time.time(),
)
```

#### Step 6: `execute_plan()` — 執行計劃

```
偽代碼:
sorted_subtasks = self._resolve_dependencies(plan.subtasks)
worker_results = []

# 追蹤已完成的 subtask id
completed_ids = set()

for subtask in sorted_subtasks:
    # 檢查依賴是否都完成
    deps_met = all(dep in completed_ids for dep in subtask.dependencies)

    if not deps_met:
        subtask.status = "failed"
        worker_results.append(WorkerResult(
            subtask_id=subtask.id,
            success=False,
            output="Dependencies not met",
        ))
        continue

    subtask.status = "running"
    result = self._run_worker(subtask)
    worker_results.append(result)

    if result.success:
        subtask.status = "completed"
        completed_ids.add(subtask.id)
    else:
        subtask.status = "failed"

all_files, conflicts = self._merge_results(worker_results)
validation_passed = self._validate(worker_results)

return OrchestratorResult(
    success=validation_passed and len(conflicts) == 0,
    plan=plan,
    worker_results=worker_results,
    conflicts=conflicts,
    validation_passed=validation_passed,
)
```

### 測試你的實現

```bash
pytest tests/test_lab1_orchestrator.py -v
```

---

## 4.2 概念課：Evaluator-Optimizer 循環

### 為什麼需要自動評估

人工代碼審查太慢，但不審查又無法保證質量。Evaluator-Optimizer 模式用 LLM 來做自動化的結構化評估：

```
傳統流程:
  Agent 生成代碼 → 人工審查 → 反饋 → 修改 → 人工審查 → ...
  速度：每輪 30 分鐘到數小時

Evaluator-Optimizer:
  Agent 生成代碼 → LLM 評分 → 自動反饋 → 重新生成 → LLM 評分 → ...
  速度：每輪 10-30 秒
```

### 架構詳解

```
┌───────────────────────────────────────────────────┐
│              Evaluator-Optimizer 循環              │
│                                                   │
│   初始代碼                                        │
│      │                                            │
│      ▼                                            │
│   ┌──────────────┐                                │
│   │  Evaluator    │ ← Rubric (評分標準)            │
│   │              │                                │
│   │  對每個評分項  │                                │
│   │  使用 LLM     │                                │
│   │  打 0-5 分    │                                │
│   └──────┬───────┘                                │
│          │                                        │
│          ▼                                        │
│   ┌──────────────┐      ┌──────────────┐          │
│   │   達到目標?   │ Yes  │   返回結果   │          │
│   │   score ≥ 4  │ ───→ │   最佳代碼    │          │
│   └──────┬───────┘      └──────────────┘          │
│          │ No                                     │
│          ▼                                        │
│   ┌──────────────┐                                │
│   │  生成反饋     │                                │
│   │              │                                │
│   │  低分項目的   │                                │
│   │  改進建議     │                                │
│   └──────┬───────┘                                │
│          │                                        │
│          ▼                                        │
│   ┌──────────────┐                                │
│   │  Generator   │                                │
│   │              │                                │
│   │  根據反饋     │                                │
│   │  重新生成     │                                │
│   └──────┬───────┘                                │
│          │                                        │
│          └────→ 回到 Evaluator (下一輪)            │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 關鍵概念：Rubric（評分標準）

Rubric 是結構化的評分標準。它把「好不好」這個主觀問題，分解為多個可量化的維度：

```
Rubric: "Code Quality"
┌──────────────────────────────────────────────────────┐
│ Item        │ Description                │ Weight │ Max │
├──────────────────────────────────────────────────────┤
│ Readability │ 清晰的命名和結構            │  1.0   │  5  │
│ Error       │ 邊界情況和錯誤處理          │  1.5   │  5  │
│ Handling    │                            │        │     │
│ Performance │ 高效的算法和數據結構         │  1.0   │  5  │
│ Docs        │ 文檔和類型標註              │  0.5   │  5  │
└──────────────────────────────────────────────────────┘

總分計算：
  weighted_sum = (readability * 1.0 + error * 1.5 + perf * 1.0 + docs * 0.5)
  max_possible = (5 * 1.0 + 5 * 1.5 + 5 * 1.0 + 5 * 0.5) = 20.0
  normalized = weighted_sum / (weight_sum) = weighted_sum / 4.0
```

### 關鍵概念：投票機制

有時候，讓 LLM 生成多個候選方案，然後投票選最好的，比只生成一個然後迭代更有效：

```
生成 3 個候選方案:
  Candidate A → Score: 3.2
  Candidate B → Score: 4.1  ← Winner
  Candidate C → Score: 3.8

這就是 vote() 方法的用途。
```

### 關鍵概念：優化循環的停止條件

optimize() 需要知道什麼時候停止。有三個停止條件：

```
1. 達到目標分數 (target_score)
   → 質量已經夠好了

2. 改進不足 (improvement_threshold)
   → 繼續迭代也不會有顯著提升
   → 避免浪費 token

3. 超過最大迭代次數 (max_iterations)
   → 防止無限循環
```

### Lab 2 實戰指引

打開 `phase_4/evaluator.py`，你會看到 6 個 TODO。建議的實現順序：

#### Step 1: `__init__()` — 初始化

```
偽代碼:
self.llm_client = llm_client
self.config = config or OptimizerConfig()
```

#### Step 2: `_score_item()` — 單項打分

```
偽代碼:
prompt = (
    f"Score the following code on '{item.name}'.\n"
    f"Criteria: {item.description}\n"
    f"Score range: 0 to {item.max_score}\n\n"
    f"Code:\n```\n{code}\n```\n\n"
    "Return JSON: "
    '{"score": N, "reasoning": "...", "suggestions": [...]}'
)

messages = [Message(role="user", content=prompt)]
response = self.llm_client.create_message(messages)

text = response.content[0].text
data = json.loads(text)

score = max(0, min(data["score"], item.max_score))  # clamp

return ScoreResult(
    rubric_item=item.name,
    score=score,
    reasoning=data.get("reasoning", ""),
    suggestions=data.get("suggestions", []),
)
```

#### Step 3: `evaluate()` — 完整評估

```
偽代碼:
scores = []
for item in rubric.items:
    score = self._score_item(code, item)
    scores.append(score)

# 計算加權總分
total_weighted = sum(s.score * item.weight
                     for s, item in zip(scores, rubric.items))
total_weight = sum(item.weight for item in rubric.items)
total_score = total_weighted / total_weight if total_weight > 0 else 0

max_possible = sum(item.max_score * item.weight
                   for item in rubric.items) / total_weight if total_weight > 0 else 0

eval_result = EvalResult(
    rubric_name=rubric.name,
    scores=scores,
    total_score=total_score,
    max_possible=max_possible,
    feedback="",
)

eval_result.feedback = self._generate_feedback(eval_result)
return eval_result
```

#### Step 4: `_generate_feedback()` — 生成反饋

```
偽代碼:
parts = []
has_improvement = False

for score in eval_result.scores:
    if score.score < 5:  # 不是滿分的項目
        has_improvement = True
        parts.append(f"- [{score.rubric_item}]: 得分 {score.score}")
        parts.append(f"  原因：{score.reasoning}")
        if score.suggestions:
            for s in score.suggestions:
                parts.append(f"  建議：{s}")

if not has_improvement:
    return "所有項目均已達到最高標準。"

return "改進建議：\n" + "\n".join(parts)
```

#### Step 5: `vote()` — 投票選擇最佳

```
偽代碼:
if not candidates:
    raise ValueError("Candidates list cannot be empty")

all_results = []
for candidate in candidates:
    result = self.evaluate(candidate, rubric)
    all_results.append(result)

# 找到最高分
best_idx = 0
for i, result in enumerate(all_results):
    if result.total_score > all_results[best_idx].total_score:
        best_idx = i

return (candidates[best_idx], all_results)
```

#### Step 6: `optimize()` — 迭代優化

```
偽代碼:
best_code = code
history = []

for i in range(self.config.max_iterations):
    eval_result = self.evaluate(best_code, rubric)
    history.append(eval_result)

    # 檢查是否達到目標
    if eval_result.total_score >= self.config.target_score:
        break

    # 檢查改進幅度（從第二輪開始）
    if i > 0:
        prev_score = history[-2].total_score
        improvement = eval_result.total_score - prev_score
        if improvement < self.config.improvement_threshold:
            break

    # 生成反饋和改進
    feedback = self._generate_feedback(eval_result)
    best_code = generator_fn(best_code, feedback)

return (best_code, history)
```

### 測試你的實現

```bash
pytest tests/test_lab2_evaluator.py -v
```

---

## 4.3 概念課：Eval 體系建設

### 為什麼 Eval 至關重要

Anthropic 的團隊在開發 Claude 時，有一句內部格言：

> "If you can't measure it, you can't improve it."

Eval 體系是 AI Agent 開發的基礎設施，就像軟體工程中的測試框架一樣重要。但 Eval 和傳統測試有一個關鍵區別：

```
傳統軟體測試:
  assert add(2, 3) == 5      ← 確定性輸出

Agent Eval:
  assert "hello" in agent("打個招呼")  ← 非確定性輸出
  assert len(agent("寫代碼")) > 50     ← 需要啟發式驗證
```

因為 LLM 的輸出是非確定性的，Eval 需要設計更靈活的驗證方式。

### Eval 體系的三個層次

```
Layer 3: Eval Suite (套件)
  ┌──────────────────────────────────────┐
  │  Suite: "Agent Basic Capability"     │
  │  pass_rate: 85%                      │
  │  avg_tokens: 2,340                   │
  │  avg_duration: 1,200ms               │
  └──────────────────────────────────────┘
            │
            │  由多個 Case 組成
            ▼
Layer 2: Eval Case (用例)
  ┌──────────────────────────────────────┐
  │  Case: "Can solve simple math"       │
  │  task: "What is 2+3?"               │
  │  validator: lambda o: "5" in o       │
  │  difficulty: "easy"                  │
  └──────────────────────────────────────┘
            │
            │  運行後產生
            ▼
Layer 1: Eval Run Result (結果)
  ┌──────────────────────────────────────┐
  │  passed: True                        │
  │  actual_output: "The answer is 5"    │
  │  tokens_used: 42                     │
  │  duration_ms: 850                    │
  └──────────────────────────────────────┘
```

### 關鍵概念：Validator 設計

Validator 是 Eval 的核心——它決定了一個用例是否通過。好的 Validator 應該：

| 特性 | 好的 Validator | 壞的 Validator |
|------|----------------|----------------|
| 容錯性 | 接受多種表達方式 | 只接受精確匹配 |
| 語義性 | 檢查語義正確性 | 只檢查格式 |
| 可維護 | 簡潔清晰 | 複雜難懂 |

```python
# 壞的 validator：過於嚴格
validator=lambda o: o == "5"  # 只接受 "5"，不接受 "The answer is 5"

# 好的 validator：語義驗證
validator=lambda o: "5" in o  # 接受包含 "5" 的任何回應

# 更好的 validator：多條件
validator=lambda o: (
    "5" in o                       # 包含正確答案
    and len(o) < 200               # 不會太長（防止胡言亂語）
)
```

### 關鍵概念：難度分級

將 Eval 用例分為不同難度級別，有助於定位 Agent 的能力邊界：

```
Easy   (基礎能力):
  - 簡單問答
  - 基本指令跟隨
  - 格式遵守
  → 預期通過率: 95%+

Medium (一般能力):
  - 需要推理的問題
  - 代碼理解
  - 多步驟任務
  → 預期通過率: 70-90%

Hard   (進階能力):
  - 複雜代碼生成
  - 架構分析
  - 調試挑戰
  → 預期通過率: 40-70%
```

### 關鍵概念：版本比較

Eval 最強大的用途是**版本比較**——當你修改了 Agent 的 prompt 或邏輯後，跑 Eval 看看是變好了還是變差了：

```
=== Eval Comparison ===
Pass Rate: 80% → 85% (+5%)

Regressions (退步):
  - tc_7: PASS → FAIL  ← 需要調查！
  - tc_12: PASS → FAIL

Improvements (改進):
  + tc_3: FAIL → PASS
  + tc_5: FAIL → PASS
  + tc_9: FAIL → PASS

結論: 整體提升，但有 2 個回歸需要修復
```

**回歸（Regression）** 是最需要關注的——一個之前通過的用例現在失敗了，意味著你的修改可能引入了 bug。

### Lab 3 實戰指引

打開 `phase_4/eval_framework.py`，你會看到 5 個 TODO。建議的實現順序：

#### Step 1: `__init__()` — 初始化

```
偽代碼:
self.name = name
self.cases = cases
self.config = config or EvalConfig()
```

#### Step 2: `_validate_output()` — 驗證輸出

```
偽代碼:
try:
    return case.validator(output)
except Exception:
    return False
```

#### Step 3: `run_case()` — 運行單個用例

```
偽代碼:
start_time = time.time()

try:
    output = agent_fn(case.task)
    end_time = time.time()
    duration_ms = (end_time - start_time) * 1000

    passed = self._validate_output(case, output)
    tokens_used = len(output) // 4  # 粗略估算

    return EvalRunResult(
        case_id=case.id,
        passed=passed,
        actual_output=output,
        tokens_used=tokens_used,
        duration_ms=duration_ms,
        error=None,
    )
except Exception as e:
    end_time = time.time()
    duration_ms = (end_time - start_time) * 1000

    return EvalRunResult(
        case_id=case.id,
        passed=False,
        actual_output="",
        tokens_used=0,
        duration_ms=duration_ms,
        error=str(e),
    )
```

#### Step 4: `run_all()` — 運行全部用例

```
偽代碼:
results = []
for case in self.cases:
    result = self.run_case(case, agent_fn)
    results.append(result)

total = len(results)
passed = sum(1 for r in results if r.passed)
pass_rate = passed / total if total > 0 else 0.0

total_tokens = sum(r.tokens_used for r in results)
total_duration = sum(r.duration_ms for r in results)
avg_tokens = total_tokens / total if total > 0 else 0.0
avg_duration = total_duration / total if total > 0 else 0.0

return EvalSuiteResult(
    suite_name=self.name,
    results=results,
    pass_rate=pass_rate,
    avg_tokens=avg_tokens,
    avg_duration_ms=avg_duration,
)
```

#### Step 5: `compare()` — 版本比較

```
偽代碼:
rate_diff = current.pass_rate - baseline.pass_rate
sign = "+" if rate_diff >= 0 else ""

# 建立映射
baseline_map = {r.case_id: r.passed for r in baseline.results}
current_map = {r.case_id: r.passed for r in current.results}

# 找回歸和改進
regressions = []
improvements = []

all_ids = set(baseline_map.keys()) | set(current_map.keys())
for case_id in sorted(all_ids):
    was_pass = baseline_map.get(case_id, False)
    now_pass = current_map.get(case_id, False)
    if was_pass and not now_pass:
        regressions.append(case_id)
    elif not was_pass and now_pass:
        improvements.append(case_id)

lines = [
    "=== Eval Comparison ===",
    f"Pass Rate: {baseline.pass_rate:.0%} → {current.pass_rate:.0%} "
    f"({sign}{rate_diff:.0%})",
    "",
]

if regressions:
    lines.append("Regressions:")
    for cid in regressions:
        lines.append(f"  - {cid}: PASS → FAIL")
else:
    lines.append("Regressions: None")

lines.append("")

if improvements:
    lines.append("Improvements:")
    for cid in improvements:
        lines.append(f"  + {cid}: FAIL → PASS")
else:
    lines.append("Improvements: None")

return "\n".join(lines)
```

### 測試你的實現

```bash
pytest tests/test_lab3_eval_framework.py -v
```

---

## 4.4 整合：Phase 4 的完整能力

當 Lab 1-3 的測試全部通過後，你就可以啟動 CLI 了：

```bash
# 設置 API Key
export ANTHROPIC_API_KEY=sk-ant-...

# 啟動 CLI
python -m phase_4.cli
```

### 試試這些命令

1. **任務分解**：
   ```
   phase4> /plan
   ```
   觀察 Orchestrator 如何把一個複雜任務分解為子任務。

2. **代碼評估**：
   ```
   phase4> /eval
   ```
   觀察 Evaluator 如何用 Rubric 對代碼打分。

3. **方案比較**：
   ```
   phase4> /compare
   ```
   觀察好代碼和差代碼的評分差異。

4. **評測套件**：
   ```
   phase4> /suite
   ```
   觀察 Eval 框架運行測試用例並計算通過率。

### 查看成績

```bash
python scripts/grade.py
```

你應該看到類似這樣的輸出：

```
╔════════════════════════════════════════════════════╗
║   Phase 4: Orchestration & Evaluation — 評分     ║
╚════════════════════════════════════════════════════╝

  Lab 1: Orchestrator
  Source: phase_4/orchestrator.py
  [████████████████████████████████] 9/9 (100%)

  Lab 2: Evaluator
  Source: phase_4/evaluator.py
  [████████████████████████████████] 9/9 (100%)

  Lab 3: Eval Framework
  Source: phase_4/eval_framework.py
  [████████████████████████████████] 9/9 (100%)

──────────────────────────────────────────────────────
  Overall Progress
  [████████████████████████████████] 27/27 (100%)

  ★ 全部通過！ — 27/27 tests passing (100%)
```

---

## 4.5 回顧與展望

### 你在這個 Phase 學到了什麼

| 概念 | 你學到的 | 為什麼重要 |
|------|----------|-----------|
| Orchestrator-Workers | 任務分解、依賴管理、Worker 調度 | 處理複雜多文件任務 |
| 衝突檢測 | 識別多 Worker 修改同一文件 | 防止並行修改導致的問題 |
| 拓撲排序 | Kahn's Algorithm、DAG 依賴解析 | 正確的任務執行順序 |
| Evaluator | 基於 Rubric 的結構化評分 | 量化 LLM 輸出質量 |
| Optimizer | 迭代式評估-反饋-改進循環 | 自動提升生成質量 |
| Vote | 多候選方案比較選擇 | 降低 LLM 輸出的隨機性 |
| Eval Suite | 用例設計、自動驗證 | 系統性衡量 Agent 能力 |
| Regression | 版本比較、回歸檢測 | 防止改動引入新問題 |

### 你構建了什麼

```
┌──────────────────────────────────────────────────┐
│  Phase 4: Orchestration & Evaluation              │
│                                                   │
│  ┌────────────────────┐  ┌─────────────────────┐ │
│  │   Orchestrator      │  │   Evaluator          │ │
│  │  · plan()           │  │  · evaluate()        │ │
│  │  · execute_plan()   │  │  · _score_item()     │ │
│  │  · _run_worker()    │  │  · optimize()        │ │
│  │  · _merge_results() │  │  · _generate_feedback│ │
│  │  · _validate()      │  │  · vote()            │ │
│  └────────────────────┘  └─────────────────────┘ │
│                                                   │
│  ┌────────────────────┐  ┌─────────────────────┐ │
│  │   Eval Framework    │  │   Sample Tasks      │ │
│  │  · run_case()       │  │  · orchestrator     │ │
│  │  · run_all()        │  │  · rubrics           │ │
│  │  · _validate_output│  │  · eval cases        │ │
│  │  · compare()        │  │  · code samples     │ │
│  └────────────────────┘  └─────────────────────┘ │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │  CLI (Interactive Commands)                   │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 完整的五層架構

加上 Phase 4，你現在已經構建了四層：

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Layer 5 · CLI Interface            → Phase 5 (Week 11-12) │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Layer 4 · Orchestration & Eval   → Phase 4 ✅       │    │
│  │  Orchestrator-Workers, Evaluator-Optimizer, Eval    │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ Layer 3-4 · Agent Core           → Phase 3         │    │
│  │  Agentic Loop, Self-Correction, Permission         │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ Layer 3 · Workflow Engine        → Phase 2         │    │
│  │  Prompt Chaining, Routing, Parallel                │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ Layer 2 · Tool System            → Phase 1         │    │
│  │  File System, Shell, Search                        │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ Layer 1 · LLM Core              → Phase 0         │    │
│  │  Client, Streaming, Retry, Context                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 下一步：Phase 5 預告

你的 Agent 現在有了完整的能力——從基礎 LLM 交互到高階編排和質量保障。在最後的 Phase 5 中，你將：

- 構建完整的 **CLI 介面**——終端 UI、互動式對話、進度顯示
- 實現 **Session 管理**——對話持久化、歷史回放
- 添加 **Configuration 系統**——用戶偏好、模型設定
- 把所有 Phase 的模組**整合為一個完整的 Agent**

你的 Agent 將從「一堆獨立的模組」蛻變為「一個可交付的產品」。

---

## 參考資料

### 必讀
1. [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic 原文，重點閱讀 Orchestrator-Workers 和 Evaluator-Optimizer 章節
2. [Anthropic Eval Guide](https://docs.anthropic.com/en/docs/build-with-claude/develop-tests) — 官方評測指南

### 深入閱讀
3. [SWE-bench](https://swe-bench.github.io/) — 軟體工程 Agent 的標準評測集，理解 Eval 設計的參考
4. [HumanEval](https://github.com/openai/human-eval) — 代碼生成的經典 Eval 集
5. [DAG and Topological Sort](https://en.wikipedia.org/wiki/Topological_sorting) — 理解依賴管理的數學基礎

### 擴展思考
- Orchestrator-Workers 模式中，如何動態調整子任務數量？（提示：根據任務複雜度和 token 預算）
- Evaluator-Optimizer 循環中，如何避免 LLM 給自己的輸出打高分的偏差？（提示：使用不同的 LLM 做評估）
- Eval 用例的 validator 應該多嚴格？太嚴格會有假陰性，太寬鬆會有假陽性——如何平衡？
- 在生產環境中，Eval 應該在什麼時候運行？（提示：CI/CD pipeline、prompt 變更時、模型升級時）
