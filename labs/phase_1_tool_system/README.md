# Phase 1: Tool 系統與 ACI 設計

> 設計並實現一套高質量的工具系統，這是 Agent 與外部世界交互的接口層。

## 實驗內容

| Lab | 文件 | 內容 | 測試 |
|-----|------|------|------|
| Lab 1 | `phase_1/registry.py` | Tool Registry 設計模式（註冊、驗證、發現） | `tests/test_lab1_registry.py` |
| Lab 2 | `phase_1/file_tools.py` | 文件系統工具套件（讀、寫、搜索、編輯） | `tests/test_lab2_file_tools.py` |
| Lab 3 | `phase_1/shell_tools.py` | Shell 執行器與沙箱（超時、黑名單、安全） | `tests/test_lab3_shell_tools.py` |

## 快速開始

```bash
# 安裝依賴
pip install -e ".[dev]"

# 運行測試（初始應全部 FAIL）
pytest

# 查看進度
python scripts/grade.py

# 完成所有 Lab 後運行 demo
python -m phase_1.demo
```

## 開發流程

1. 閱讀 `phase_1/types.py` 了解所有類型定義
2. 找到 `TODO` 標記的函數，閱讀 docstring 和 HINT
3. 實現代碼，運行對應的測試驗證
4. 使用 `grade.py` 查看整體進度

## 驗收標準

- [ ] Tool Registry 支持動態增刪，有 validation
- [ ] 文件工具使用絕對路徑（避免相對路徑 bug）
- [ ] Shell 工具有 timeout、黑名單命令過濾
- [ ] 所有測試通過
