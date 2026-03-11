# Phase 5: Ship It — 產品化 CLI 體驗

> 將你的 Agent 打造為一個真正可用的命令列產品：專業的終端渲染、多層配置系統、對話持久化。

## 實驗內容

| Lab | 文件 | 內容 | 測試 |
|-----|------|------|------|
| Lab 1 | `phase_5/cli_app.py` | CLI 渲染器（streaming、diff、progress） | `tests/test_lab1_cli_app.py` |
| Lab 2 | `phase_5/config.py` | 多層配置系統（合併、查詢、驗證） | `tests/test_lab2_config.py` |
| Lab 3 | `phase_5/session.py` | Session 持久化（建立、儲存、載入） | `tests/test_lab3_session.py` |

## 快速開始

```bash
# 安裝依賴
pip install -e ".[dev]"

# 運行測試（初始應全部 FAIL）
pytest

# 查看進度
python scripts/grade.py

# 完成所有 Lab 後運行 CLI
python -m phase_5.cli
```

## 開發流程

1. 閱讀 `phase_5/types.py` 了解所有類型定義
2. 找到 `TODO` 標記的函數，閱讀 docstring 和 HINT
3. 實現代碼，運行對應的測試驗證
4. 使用 `grade.py` 查看整體進度

## 驗收標準

- [ ] CLI 渲染支持串流文字、工具卡片、diff 視圖、進度條
- [ ] 配置系統支持四層合併（default → global → project → cli）
- [ ] Session 可以建立、保存、載入、列出
- [ ] 所有測試通過
