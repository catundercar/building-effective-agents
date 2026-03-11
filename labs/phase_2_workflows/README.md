# Phase 2: Prompt Chaining 與 Routing

> 實現兩種基礎 Workflow 模式，學會在確定性流程中編排 LLM 調用。

## 實驗內容

| Lab | 文件 | 內容 | 測試 |
|-----|------|------|------|
| Lab 1 | `phase_2/chain.py` | Prompt Chaining 引擎（串行、Gate、重試） | `tests/test_lab1_chain.py` |
| Lab 2 | `phase_2/router.py` | 意圖分類與智能路由 | `tests/test_lab2_router.py` |
| Lab 3 | `phase_2/tracing.py` | 結構化 Trace 與可觀測性 | `tests/test_lab3_tracing.py` |

## 快速開始

```bash
# 安裝依賴
pip install -e ".[dev]"

# 運行測試（初始應全部 FAIL）
pytest

# 查看進度
python scripts/grade.py

# 完成所有 Lab 後運行 CLI
python -m phase_2.cli
```

## 開發流程

1. 閱讀 `phase_2/types.py` 了解所有類型定義
2. 找到 `TODO` 標記的函數，閱讀 docstring 和 HINT
3. 實現代碼，運行對應的測試驗證
4. 使用 `grade.py` 查看整體進度

## 實驗順序建議

### Lab 1: Prompt Chaining (`chain.py`)
最基礎的 Workflow 模式。建議實現順序：
1. `__init__` — 初始化
2. `_apply_gate` — Gate 檢查邏輯
3. `run_step` — 單步驟執行
4. `_retry_step` — 重試機制
5. `run_chain` — 串行編排

### Lab 2: Router (`router.py`)
意圖分類與路由分發。建議實現順序：
1. `__init__` — 初始化與路由表
2. `_build_classification_prompt` — 構建分類 prompt
3. `_parse_classification` — 解析 LLM 分類結果
4. `classify` — 完整分類流程
5. `route` — 分類 + 分發

### Lab 3: Tracing (`tracing.py`)
可觀測性追蹤系統。建議實現順序：
1. `__init__` — 初始化
2. `start_trace` — 建立 Trace
3. `start_span` — 建立子 Span
4. `end_span` — 結束 Span
5. `end_trace` — 結束 Trace 並計算統計
6. `format_trace` — 格式化輸出

## 驗收標準

- [ ] Chain 中任一步驟失敗可 graceful fallback
- [ ] Gate 檢查失敗時自動重試（最多 2 次）
- [ ] Router 能正確分類並路由到對應 handler
- [ ] 低置信度時使用 fallback 路由
- [ ] 每次請求自動生成完整的結構化 trace
- [ ] 終端可以美觀地展示 trace 樹
- [ ] 所有測試通過
