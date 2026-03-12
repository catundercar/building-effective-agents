import type { PhaseContent } from "./types";

export const phase3Content: PhaseContent = {
  phaseId: 3,
  color: "#7C3AED",
  accent: "#A78BFA",
  lessons: [
    // ─── Lesson 1: ReAct 循環實現 ────────────────────────────────────
    {
      phaseId: 3,
      lessonId: 1,
      title: "ReAct 循環與 Agent Loop",
      subtitle: "Building the Reasoning Engine",
      type: "概念 + 實踐",
      duration: "3.5 hrs",
      objectives: [
        "理解從 Workflow 到 Agent 的質變：流程由 LLM 動態決定",
        "掌握 ReAct 模式：Think → Act → Observe → Loop",
        "實現完整的 Agent Loop（接收任務 → 自主規劃 → 循環執行）",
        "設計停止條件：任務完成、最大迭代、Budget 耗盡",
        "實現 Token Budget 控制和思考過程可視化",
      ],
      sections: [
        {
          title: "Phase 導讀：從 Workflow 到 Agent 的質變",
          blocks: [
            {
              type: "callout",
              variant: "quote",
              text: "Week 7-8 · The Reasoning Engine\n在 Phase 2 中，你學會了用代碼編排 LLM 調用。\n現在，是時候放手——讓 LLM 自己決定該做什麼、怎麼做了。",
            },
            {
              type: "heading",
              level: 3,
              text: "Workflow vs Agent：關鍵轉變",
            },
            {
              type: "paragraph",
              text: "Anthropic 在 \"Building Effective Agents\" 中明確區分了 Workflow 和 Agent：",
            },
            {
              type: "table",
              headers: ["維度", "Workflow (Phase 2)", "Agent (Phase 3)"],
              rows: [
                ["流程控制", "代碼預定義每一步", "LLM 動態決定下一步"],
                ["適用場景", "結構化、可預測的任務", "開放式、探索性任務"],
                ["核心模式", "Chain / Route", "ReAct Loop"],
                ["複雜度", "低——步驟固定", "高——行為不可預測"],
                ["能力上限", "取決於你的設計", "取決於 LLM 的推理能力"],
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "你在構建什麼",
            },
            {
              type: "diagram",
              content:
                "┌─────────────────────────────────────────────────────┐\n│                 Agent Core (Phase 3)                │\n│                                                     │\n│   ┌────────────┐  ┌──────────────┐  ┌───────────┐  │\n│   │ Agent Loop │  │Error Recovery│  │Permissions│  │\n│   │ ReAct 循環  │  │  自我修正     │  │ 人機交互   │  │\n│   └─────┬──────┘  └──────┬───────┘  └─────┬─────┘  │\n│         │                │                │         │\n│         └────────────────┼────────────────┘         │\n│                          │                          │\n│              ┌───────────┴───────────┐              │\n│              │  Workflow + Tools     │              │\n│              │    (Phase 0-2)        │              │\n│              └───────────────────────┘              │\n└─────────────────────────────────────────────────────┘",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "Agent Loop：ReAct 循環——讓 LLM 自主推理和行動（Lab 1）",
                "Error Recovery：錯誤感知與自我修正機制（Lab 2）",
                "Permissions：Human-in-the-loop 安全機制（Lab 3）",
              ],
            },
          ],
        },
        {
          title: "ReAct 模式核心概念",
          blocks: [
            {
              type: "paragraph",
              text: "ReAct（Reason + Act）是目前最流行的 Agent 架構模式。它的核心循環非常簡單：",
            },
            {
              type: "diagram",
              content:
                "          ┌─────────────┐\n          │   Task      │\n          │  (用戶任務)  │\n          └──────┬──────┘\n                 │\n          ┌──────▼──────┐\n     ┌───→│   Think     │\n     │    │  (推理規劃)  │\n     │    └──────┬──────┘\n     │           │\n     │    ┌──────▼──────┐\n     │    │    Act      │\n     │    │  (調用工具)  │\n     │    └──────┬──────┘\n     │           │\n     │    ┌──────▼──────┐\n     │    │  Observe    │\n     │    │ (觀察結果)   │\n     │    └──────┬──────┘\n     │           │\n     │      完成了？──── No ───┐\n     │           │              │\n     │          Yes             │\n     │           │              │\n     │    ┌──────▼──────┐      │\n     │    │   Output    │      │\n     │    │  (最終結果)  │      │\n     │    └─────────────┘      │\n     │                         │\n     └─────────────────────────┘",
            },
            {
              type: "heading",
              level: 3,
              text: "與 Anthropic Tool Use 的天然契合",
            },
            {
              type: "paragraph",
              text: "ReAct 模式與 Anthropic 的 Tool Use API 天然契合。在 API 層面，Agent Loop 其實就是：",
            },
            {
              type: "code",
              language: "python",
              code: `# Agent Loop 的本質
while True:
    response = llm.create_message(messages, tools=tools)

    if response.stop_reason == "end_turn":
        # LLM 認為任務完成了
        break
    elif response.stop_reason == "tool_use":
        # LLM 想使用工具 → 執行工具 → 把結果加入 messages
        for tool_call in response.tool_uses:
            result = execute_tool(tool_call)
            messages.append(tool_result_message(result))
        # 繼續循環

    if iteration > max_iterations:
        break  # 安全閥`,
            },
            {
              type: "callout",
              variant: "tip",
              text: "關鍵洞察：Tool Use 的 stop_reason 是自然的循環信號。end_turn = 停止，tool_use = 繼續。你只需要加上 budget 控制和錯誤處理就是完整的 Agent。",
            },
          ],
        },
        {
          title: "Lab 1: Agent Loop 實現",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "學習目標",
            },
            {
              type: "list",
              ordered: false,
              items: [
                "實現完整的 ReAct 循環",
                "解析 LLM 回應為思考和行動",
                "執行 Tool 調用並將結果回饋 LLM",
                "實現 Token Budget 控制",
                "可視化推理過程",
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "Lab 1 實戰指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: run() — 主循環",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def run(self, task):
    # 1. 初始化狀態
    self.state = AgentState(messages=[
        {"role": "user", "content": task}
    ])
    system_prompt = self._build_system_prompt(task)
    steps = []

    # 2. 主循環
    while self.state.status == "running":
        # 檢查預算
        if self._check_budget():
            self.state.status = "budget_exceeded"
            break

        # 檢查迭代次數
        if self.state.iteration_count >= self.config.max_iterations:
            self.state.status = "max_iterations"
            break

        # 調用 LLM
        response = self.llm_client.create_message(
            messages=self.state.messages,
            system_prompt=system_prompt,
            tools=self.tools,
        )

        # 處理回應
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
              text: "Step 2: _process_response() — 解析回應",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def _process_response(self, response):
    step = AgentStep(iteration=self.state.iteration_count)

    if response.stop_reason == "end_turn":
        # 任務完成
        step.thought = extract_text(response)
        self.state.status = "completed"

    elif response.stop_reason == "tool_use":
        # 提取思考和工具調用
        for block in response.content:
            if block.type == "text":
                step.thought = block.text
            elif block.type == "tool_use":
                step.tool_name = block.name
                step.tool_input = block.input

                # 執行工具
                result = self._execute_tool(block.name, block.input)
                step.observation = result

                # 將結果加入消息
                self.state.messages.append(tool_result_msg(result))

    return step`,
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
pytest tests/test_lab1_agent_loop.py -v`,
            },
            {
              type: "callout",
              variant: "info",
              text: "測試使用 MagicMock 模擬 LLM 和 Tools，不需要 API Key。Agent 的行為完全由 mock 控制。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "3.1.1",
          title: "實現 run() 主循環",
          description:
            "實現 AgentLoop.run() 方法——Agent 的核心。接收任務描述，循環調用 LLM 和 Tools，直到任務完成或達到限制。",
          labFile: "phase_3/agent_loop.py",
          hints: [
            "初始化 AgentState，設置 status='running'",
            "每輪循環前檢查 budget 和 iteration 限制",
            "根據 stop_reason 決定是繼續還是停止",
            "記錄每步的 AgentStep 用於 trace",
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
          title: "實現 _process_response()",
          description:
            "解析 LLM 回應，提取思考內容和工具調用。如果是 tool_use，執行工具並將結果加入消息歷史。",
          labFile: "phase_3/agent_loop.py",
          hints: [
            "遍歷 response.content 區分 text 和 tool_use",
            "tool_use 時調用 _execute_tool()",
            "end_turn 時設置 status='completed'",
          ],
        },
        {
          id: "3.1.3",
          title: "實現 _execute_tool() 和 _check_budget()",
          description:
            "安全地執行工具調用，處理工具不存在的情況。實現 token budget 檢查。",
          labFile: "phase_3/agent_loop.py",
          hints: [
            "在 tools dict 中查找對應工具",
            "工具不存在時返回錯誤信息（不要拋異常）",
            "比較 total_tokens_used 和 max_tokens_budget",
          ],
        },
      ],
      acceptanceCriteria: [
        "Agent 能自主循環調用 LLM 和 Tools",
        "到達 max_iterations 或 budget 時安全停止",
        "每步的思考和行動都有記錄",
        "工具不存在時返回錯誤而非崩潰",
        "所有 Lab 1 測試通過",
      ],
      references: [
        {
          title: "Building Effective Agents — Agents",
          description:
            "Anthropic 對 Agent 模式的定義和設計建議。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "ReAct: Synergizing Reasoning and Acting",
          description:
            "ReAct 論文——Agent 循環的理論基礎。",
          url: "https://arxiv.org/abs/2210.03629",
        },
        {
          title: "Anthropic Tool Use 文檔",
          description:
            "Tool Use API 的完整參考，Agent Loop 的底層機制。",
          url: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use",
        },
      ],
    },

    // ─── Lesson 2: 環境反饋與自我修正 ──────────────────────────────────
    {
      phaseId: 3,
      lessonId: 2,
      title: "環境反饋與自我修正",
      subtitle: "Error Recovery & Strategy Adaptation",
      type: "概念 + 實踐",
      duration: "2.5 hrs",
      objectives: [
        "理解 Ground Truth 的重要性：環境反饋是 Agent 的眼睛",
        "掌握錯誤分類：可重試 vs 需換策略 vs 致命錯誤",
        "實現自動重試與策略切換機制",
        "設計帶錯誤上下文的重試 Prompt",
        "避免 Agent 在同一錯誤上無限重試",
      ],
      sections: [
        {
          title: "環境反饋：Agent 的眼睛",
          blocks: [
            {
              type: "paragraph",
              text: "Anthropic 的第四個設計原則：「環境反饋是 Agent 的眼睛」。Agent 的智能不僅來自 LLM 的推理能力，更來自對環境反饋的正確理解和響應。",
            },
            {
              type: "callout",
              variant: "quote",
              text: "Agent 寫了一段代碼 → 運行測試 → 測試失敗 → 讀取錯誤信息 → 修改代碼 → 重新測試 → 通過\n\n這個循環的關鍵在於「測試失敗」這個環境反饋。沒有它，Agent 就是盲目的。",
            },
            {
              type: "heading",
              level: 3,
              text: "錯誤的分類",
            },
            {
              type: "table",
              headers: ["類別", "例子", "處理策略"],
              rows: [
                ["可重試 (retryable)", "文件暫時鎖定、網路超時", "等待後重試同一操作"],
                ["需換策略 (strategy_change)", "方法 A 連續失敗 2 次", "嘗試完全不同的方法"],
                ["致命 (fatal)", "權限不足、依賴缺失", "向用戶報告，停止執行"],
              ],
            },
          ],
        },
        {
          title: "Lab 2: Error Recovery 實現",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 2 實戰指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: categorize_error() — 錯誤分類",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def categorize_error(self, error, context):
    error_str = str(error).lower()

    # 致命錯誤
    if "permission denied" in error_str or "401" in error_str or "403" in error_str:
        return "fatal"

    # 可重試錯誤
    if "timeout" in error_str or "connection" in error_str:
        return "retryable"

    # 檢查是否同一錯誤重複出現
    if self._detect_repeated_failures(self.history):
        return "strategy_change"

    return "retryable"  # 默認可重試`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: build_retry_prompt() — 增強 Prompt",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def build_retry_prompt(self, original_prompt, error_records):
    error_summary = "\\n".join([
        f"嘗試 {r.attempt}: {r.message}" for r in error_records
    ])
    return f"""{original_prompt}

之前的嘗試失敗了。以下是錯誤歷史：
{error_summary}

請嘗試不同的方法來完成任務。不要重複之前失敗的方法。"""`,
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
pytest tests/test_lab2_error_recovery.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "3.2.1",
          title: "實現 categorize_error()",
          description:
            "根據錯誤內容和上下文，將錯誤分類為 retryable、strategy_change 或 fatal。",
          labFile: "phase_3/error_recovery.py",
          hints: [
            "分析錯誤字串中的關鍵詞",
            "檢查歷史中是否有重複的相同錯誤",
            "致命錯誤應立即識別，不要重試",
          ],
        },
        {
          id: "3.2.2",
          title: "實現 should_retry() 和 get_recovery_strategy()",
          description:
            "判斷是否應該重試，以及選擇什麼恢復策略。需要考慮重試次數和策略切換次數的限制。",
          labFile: "phase_3/error_recovery.py",
          hints: [
            "比較當前重試次數和 max_retries",
            "策略切換次數超過 max_strategy_changes 時返回 fatal",
            "從 _default_strategies() 中選擇策略",
          ],
        },
        {
          id: "3.2.3",
          title: "實現 build_retry_prompt()",
          description:
            "構建帶錯誤歷史的重試 prompt。讓 LLM 知道之前嘗試了什麼、為什麼失敗、應該換什麼方法。",
          labFile: "phase_3/error_recovery.py",
          hints: [
            "包含所有失敗歷史的摘要",
            "明確告訴 LLM 不要重複失敗的方法",
            "如果是 strategy_change，附加新策略的描述",
          ],
        },
      ],
      acceptanceCriteria: [
        "錯誤被正確分類為三個類別",
        "重試次數限制生效",
        "策略切換在同類錯誤重複出現時觸發",
        "重試 prompt 包含完整的錯誤上下文",
        "所有 Lab 2 測試通過",
      ],
      references: [
        {
          title: "Building Effective Agents — Ground Truth",
          description:
            "環境反饋在 Agent 系統中的重要性。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "Exponential Backoff",
          description:
            "重試策略中指數退避算法的設計理念。",
          url: "https://en.wikipedia.org/wiki/Exponential_backoff",
        },
      ],
    },

    // ─── Lesson 3: Human-in-the-loop ─────────────────────────────────
    {
      phaseId: 3,
      lessonId: 3,
      title: "Human-in-the-loop 設計",
      subtitle: "Permission System & Safety Controls",
      type: "設計 + 實踐",
      duration: "2.5 hrs",
      objectives: [
        "設計安全的人機交互點：哪些操作需要確認",
        "實現三級權限模型：auto / confirm / deny",
        "設計操作預覽機制：diff、命令預覽",
        "理解 Agent 安全的核心挑戰",
      ],
      sections: [
        {
          title: "為什麼需要 Human-in-the-loop",
          blocks: [
            {
              type: "paragraph",
              text: "Agent 能自主行動是強大的能力，但也帶來風險。一個沒有安全閥的 Agent 可能會刪除重要文件、執行危險命令、甚至修改生產環境。",
            },
            {
              type: "callout",
              variant: "warning",
              text: "Claude Code 的設計原則：危險操作（文件刪除、外部命令、git push）默認需要用戶確認。只有用戶明確授權的操作才能自動執行。",
            },
            {
              type: "heading",
              level: 3,
              text: "三級權限模型",
            },
            {
              type: "table",
              headers: ["級別", "行為", "適用場景"],
              rows: [
                ["auto", "自動執行，不詢問", "讀取文件、搜索代碼"],
                ["confirm", "顯示操作詳情，等待確認", "寫入文件、執行命令"],
                ["deny", "直接拒絕，不執行", "rm -rf、sudo 等危險操作"],
              ],
            },
          ],
        },
        {
          title: "Lab 3: Permission Manager 實現",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Lab 3 實戰指引",
            },
            {
              type: "heading",
              level: 4,
              text: "Step 1: check_permission() — 權限檢查",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def check_permission(self, request):
    # 1. 查找匹配的規則
    rule = self._match_rule(request.tool_name)

    if rule:
        if rule.level == "auto":
            return PermissionResult(allowed=True, reason="Auto-approved")
        elif rule.level == "deny":
            return PermissionResult(allowed=False, reason=rule.reason)
        else:  # confirm
            return self.request_approval(request)
    else:
        # 使用默認級別
        if self.config.default_level == "auto":
            return PermissionResult(allowed=True)
        return self.request_approval(request)`,
            },
            {
              type: "heading",
              level: 4,
              text: "Step 2: request_approval() — 用戶確認",
            },
            {
              type: "code",
              language: "python",
              code: `# 偽代碼
def request_approval(self, request):
    # 格式化操作描述
    description = format_permission_request(request)

    # 調用用戶輸入回調
    user_response = self.user_input_fn(description)

    if user_response.lower() in ("y", "yes"):
        return PermissionResult(allowed=True, reason="User approved")
    else:
        return PermissionResult(allowed=False, reason="User denied")`,
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
pytest tests/test_lab3_permissions.py -v`,
            },
          ],
        },
      ],
      exercises: [
        {
          id: "3.3.1",
          title: "實現 check_permission()",
          description:
            "根據規則檢查工具調用的權限。匹配規則 → 根據級別決定自動通過、拒絕或請求確認。",
          labFile: "phase_3/permissions.py",
          hints: [
            "用 _match_rule() 找到匹配的規則",
            "沒有匹配規則時使用 default_level",
            "auto_approve_read 可以跳過讀操作的確認",
          ],
        },
        {
          id: "3.3.2",
          title: "實現 _match_rule() 和 _assess_risk()",
          description:
            "實現工具名稱的 glob 匹配和風險評估。",
          labFile: "phase_3/permissions.py",
          hints: [
            "使用 fnmatch.fnmatch() 進行 glob 匹配",
            "寫入/刪除操作 = high risk",
            "讀取操作 = low risk",
          ],
        },
        {
          id: "3.3.3",
          title: "實現 request_approval()",
          description:
            "向用戶展示操作詳情並等待確認。支持 approve、reject 兩種回應。",
          labFile: "phase_3/permissions.py",
          hints: [
            "使用 format_permission_request() 格式化展示",
            "調用 self.user_input_fn() 獲取用戶輸入",
            "處理各種用戶回應格式（y/yes/Y/YES）",
          ],
        },
      ],
      acceptanceCriteria: [
        "auto 模式直接通過不詢問",
        "deny 模式直接拒絕",
        "confirm 模式正確調用用戶確認",
        "glob 規則匹配正確",
        "所有 Lab 3 測試通過",
      ],
      references: [
        {
          title: "Claude Code Permission Model",
          description:
            "Claude Code 的權限設計，包含 auto/confirm/deny 三級模型。",
          url: "https://docs.anthropic.com/en/docs/claude-code",
        },
        {
          title: "Python fnmatch",
          description:
            "Python 的 Unix filename pattern matching，用於 glob 規則匹配。",
          url: "https://docs.python.org/3/library/fnmatch.html",
        },
      ],
    },

    // ─── Lesson 4: 整合與回顧 ────────────────────────────────────────
    {
      phaseId: 3,
      lessonId: 4,
      title: "整合與回顧",
      subtitle: "Full Agent Integration & Testing",
      type: "項目實踐",
      duration: "4 hrs",
      objectives: [
        "將 Agent Loop、Error Recovery、Permissions 整合",
        "用 5 個預設編程任務測試 Agent",
        "記錄每個任務的 token 消耗和 trace",
        "回顧 Phase 3 核心知識點",
        "預覽 Phase 4 的高階模式",
      ],
      sections: [
        {
          title: "Phase 3 整合",
          blocks: [
            {
              type: "paragraph",
              text: "現在把三個模塊整合：Agent Loop 負責核心循環，Error Recovery 負責錯誤處理，Permissions 負責安全控制。",
            },
            {
              type: "heading",
              level: 3,
              text: "5 個測試任務",
            },
            {
              type: "table",
              headers: ["#", "任務", "難度", "涉及技能"],
              rows: [
                ["1", "創建 TODO API (CRUD + 測試)", "中", "多文件讀寫、命令執行"],
                ["2", "重構 buggy 計算器函數", "低", "讀取、分析、修改"],
                ["3", "為模塊生成 docstring", "低", "讀取、生成文字"],
                ["4", "callback → async/await 重寫", "中", "理解代碼、重構"],
                ["5", "修復 SQL injection 漏洞", "高", "安全分析、精確修改"],
              ],
            },
          ],
        },
        {
          title: "回顧與展望",
          blocks: [
            {
              type: "heading",
              level: 3,
              text: "Phase 3 核心收穫",
            },
            {
              type: "table",
              headers: ["模塊", "核心能力", "對應設計原則"],
              rows: [
                ["Agent Loop", "LLM 自主推理和行動", "從簡單開始，按需增加複雜度"],
                ["Error Recovery", "錯誤感知與自我修正", "環境反饋是 Agent 的眼睛"],
                ["Permissions", "安全的人機交互", "透明性優先"],
              ],
            },
            {
              type: "heading",
              level: 3,
              text: "下一步：Phase 4",
            },
            {
              type: "paragraph",
              text: "Phase 3 的 Agent 是單線程的——一次只能做一件事。Phase 4 將引入 Orchestrator-Workers 模式，讓 Agent 能分解複雜任務、分派子任務、並行處理。同時引入 Evaluator 機制，讓 Agent 能自我評估和優化。",
            },
          ],
        },
      ],
      exercises: [
        {
          id: "3.4.1",
          title: "運行全部測試",
          description:
            "運行完整測試套件，確保 Lab 1-3 的所有 TODO 都已正確實現。\n\n目標：全部測試通過，grade.py 顯示 100%。",
          labFile: "phase_3/",
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
          id: "3.4.2",
          title: "用 5 個任務測試 Agent",
          description:
            "啟動 CLI，依次測試 5 個預設任務。記錄每個任務的完成情況、token 消耗、是否需要人工干預。",
          labFile: "phase_3/cli.py",
          hints: [
            "先嘗試簡單任務（重構計算器）",
            "觀察 Agent 遇到錯誤時的自我修正",
            "注意哪些操作觸發了 permission 確認",
          ],
          pseudocode: `# 啟動 CLI
python -m phase_3.cli

# 試試這些任務：
# 1. "創建一個簡單的 TODO class，包含 add/remove/list 方法"
# 2. "修復 sample_tasks.py 中的 buggy_calculator"
# 3. "為 agent_loop.py 的所有 public 方法添加 docstring"`,
        },
        {
          id: "3.4.3",
          title: "分析 Agent 行為",
          description:
            "回顧 Agent 在各個任務中的表現，分析成功和失敗的原因。",
          labFile: "phase_3/cli.py",
          hints: [
            "對比 token 消耗高和低的任務",
            "分析 Agent 在哪些地方做了不必要的操作",
            "思考如何通過 prompt 優化來改善行為",
          ],
        },
      ],
      acceptanceCriteria: [
        "pytest 全部測試通過",
        "grade.py 顯示 100% 完成度",
        "Agent 能獨立完成至少 3 個測試任務",
        "危險操作觸發 permission 確認",
        "遇到錯誤能自動重試或換策略",
      ],
      references: [
        {
          title: "pytest 文檔",
          description: "Python 測試框架 pytest 的完整文檔。",
          url: "https://docs.pytest.org/en/stable/",
        },
        {
          title: "Building Effective Agents",
          description:
            "回顧 Agent 部分——你剛剛實現了一個完整的 Agent。",
          url: "https://www.anthropic.com/engineering/building-effective-agents",
        },
        {
          title: "ReAct Paper",
          description:
            "深入閱讀 ReAct 論文，理解理論基礎。",
          url: "https://arxiv.org/abs/2210.03629",
        },
      ],
    },
  ],
};
