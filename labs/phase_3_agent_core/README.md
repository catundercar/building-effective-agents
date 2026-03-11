# Phase 3: Agentic Loop 核心引擎

> 實現 Agent 的核心推理-行動循環，讓 LLM 自主規劃、執行、觀察、反思，直到完成任務。

## 實驗內容

| Lab | 文件 | 內容 | 測試 |
|-----|------|------|------|
| Lab 1 | `phase_3/agent_loop.py` | ReAct 循環（Think → Act → Observe） | `tests/test_lab1_agent_loop.py` |
| Lab 2 | `phase_3/error_recovery.py` | 錯誤分類、重試策略、自我修正 | `tests/test_lab2_error_recovery.py` |
| Lab 3 | `phase_3/permissions.py` | Human-in-the-loop 權限控制 | `tests/test_lab3_permissions.py` |

## 快速開始

```bash
# 安裝依賴
pip install -e ".[dev]"

# 運行測試（初始應全部 FAIL）
pytest

# 查看進度
python scripts/grade.py

# 完成所有 Lab 後運行 CLI
python -m phase_3.cli
```

## 開發流程

1. 閱讀 `phase_3/types.py` 了解所有類型定義
2. 找到 `TODO` 標記的函數，閱讀 docstring 和 HINT
3. 實現代碼，運行對應的測試驗證
4. 使用 `grade.py` 查看整體進度

## 建議完成順序

1. **Lab 1** — 先實現 `_build_system_prompt` 和 `_check_budget`（最簡單的）
2. **Lab 1** — 再實現 `_execute_tool` 和 `_process_response`
3. **Lab 1** — 最後實現核心的 `run` 方法（最複雜）
4. **Lab 2** — 從 `categorize_error` 和 `record_error` 開始
5. **Lab 2** — 實現 `should_retry` 和 `get_recovery_strategy`
6. **Lab 2** — 最後實現 `build_retry_prompt`
7. **Lab 3** — 先實現 `_match_rule` 和 `_assess_risk`
8. **Lab 3** — 再實現 `check_permission` 和 `request_approval`

## 驗收標準

- [ ] Agent 能在循環中自主選擇和調用 tools
- [ ] 達到最大迭代或 budget 時 graceful 停止
- [ ] Agent 遇到錯誤能自動重試或換策略
- [ ] 不會在同一種錯誤上無限重試
- [ ] 危險操作前有確認提示
- [ ] 所有測試通過
