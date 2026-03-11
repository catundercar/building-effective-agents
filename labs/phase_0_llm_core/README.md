# Phase 0: Augmented LLM 核心模組

> 理解並實現一個可與 LLM API 穩定交互的核心引擎，這是整個 Agent 的心臟。

## 實驗內容

| Lab | 文件 | 內容 | 測試 |
|-----|------|------|------|
| Lab 1 | `phase_0/client.py` | LLM API 客戶端（streaming + 重試） | `tests/test_lab1_client.py` |
| Lab 2 | `phase_0/tools.py` | Tool 註冊、執行、Tool Use 循環 | `tests/test_lab2_tools.py` |
| Lab 3 | `phase_0/context.py` | Token 估算、截斷、摘要壓縮 | `tests/test_lab3_context.py` |

## 快速開始

```bash
# 安裝依賴
pip install -e ".[dev]"

# 運行測試（初始應全部 FAIL）
pytest

# 查看進度
python scripts/grade.py

# 完成所有 Lab 後運行 CLI
python -m phase_0.cli
```

## 開發流程

1. 閱讀 `phase_0/types.py` 了解所有類型定義
2. 找到 `TODO` 標記的函數，閱讀 docstring 和 HINT
3. 實現代碼，運行對應的測試驗證
4. 使用 `grade.py` 查看整體進度

## 驗收標準

- [ ] 支持至少 3 個自定義 Tool
- [ ] streaming 輸出正常工作
- [ ] context window 溢出時自動 truncate + summarize
- [ ] 所有測試通過
