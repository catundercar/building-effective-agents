# Phase 4: Orchestration & Evaluation 高階模式與質量保障

> 掌握多 Agent 協調模式與系統性質量評估，讓你的 Agent 能分解複雜任務、自我評估並持續改進。

## 實驗內容

| Lab | 文件 | 內容 | 測試 |
|-----|------|------|------|
| Lab 1 | `phase_4/orchestrator.py` | Orchestrator-Workers 模式（任務分解、worker 執行、衝突檢測） | `tests/test_lab1_orchestrator.py` |
| Lab 2 | `phase_4/evaluator.py` | Evaluator-Optimizer 循環（評分、反饋、迭代優化、投票） | `tests/test_lab2_evaluator.py` |
| Lab 3 | `phase_4/eval_framework.py` | Eval 體系建設（用例定義、套件運行、版本比較） | `tests/test_lab3_eval_framework.py` |

## 快速開始

```bash
# 安裝依賴
pip install -e ".[dev]"

# 運行測試（初始應全部 FAIL）
pytest

# 查看進度
python scripts/grade.py

# 完成所有 Lab 後運行 CLI
python -m phase_4.cli
```

## 開發流程

1. 閱讀 `phase_4/types.py` 了解所有類型定義
2. 找到 `TODO` 標記的函數，閱讀 docstring 和 HINT
3. 實現代碼，運行對應的測試驗證
4. 使用 `grade.py` 查看整體進度

## 驗收標準

- [ ] Orchestrator 能將任務分解為多個子任務
- [ ] Worker 能按依賴順序執行子任務
- [ ] 衝突檢測正確識別多 worker 修改同一文件
- [ ] Evaluator 能基於 Rubric 對代碼評分
- [ ] Optimize 循環能迭代改進代碼質量
- [ ] Eval 框架能運行測試套件並計算通過率
- [ ] Compare 能正確識別回歸和改進
- [ ] 所有測試通過
