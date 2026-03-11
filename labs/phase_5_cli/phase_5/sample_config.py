"""範例配置 — 預設值和 .agent.yml 範例。

本文件展示了配置系統的使用方式和預設值。
學生可以參考此文件理解配置的結構。
"""

from __future__ import annotations


# ---------------------------------------------------------------------------
# 預設配置值
# ---------------------------------------------------------------------------

DEFAULT_AGENT_CONFIG = {
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 8192,
    "temperature": 0.0,
    "max_iterations": 20,
    "token_budget": 100_000,
}

DEFAULT_BLOCKED_COMMANDS = [
    "rm -rf /",
    "mkfs",
    "dd if=",
    "chmod -R 777",
    "curl | bash",
    "wget | bash",
]


# ---------------------------------------------------------------------------
# .agent.yml 範例
# ---------------------------------------------------------------------------

EXAMPLE_AGENT_YML = """\
# .agent.yml — 專案級 Agent 配置
#
# 將此文件放在專案根目錄，Agent 啟動時會自動讀取。

# Agent 運行參數
agent:
  model: claude-sonnet-4-20250514
  max_tokens: 8192
  temperature: 0.0
  max_iterations: 30
  token_budget: 150000

# 工具權限
# level: auto (自動執行) | confirm (需確認) | deny (禁止)
permissions:
  - tool_name: read_file
    level: auto
  - tool_name: write_file
    level: confirm
  - tool_name: run_shell
    level: confirm
  - tool_name: delete_file
    level: deny

# 允許訪問的目錄（絕對路徑）
allowed_dirs:
  - /home/user/project
  - /tmp/agent-workspace

# 禁止的命令模式
blocked_commands:
  - rm -rf /
  - mkfs
  - dd if=
  - chmod -R 777
"""


# ---------------------------------------------------------------------------
# ~/.agent/config.yml 範例
# ---------------------------------------------------------------------------

EXAMPLE_GLOBAL_CONFIG_YML = """\
# ~/.agent/config.yml — 使用者全域 Agent 配置
#
# 此配置在所有專案中生效，優先級低於專案級 .agent.yml。

# 預設 Agent 配置
agent:
  model: claude-sonnet-4-20250514
  max_tokens: 8192
  temperature: 0.0
  max_iterations: 20
  token_budget: 100000

# 全域工具權限
permissions:
  - tool_name: run_shell
    level: confirm
"""


# ---------------------------------------------------------------------------
# 配置層級優先級說明
# ---------------------------------------------------------------------------

CONFIG_PRIORITY_DOC = """\
Configuration Layer Priority (low → high):

  ┌─────────────────────────────────────────────────────┐
  │  4. CLI Overrides (--model, --max-tokens, etc.)     │  ← Highest
  ├─────────────────────────────────────────────────────┤
  │  3. Project Config (.agent.yml)                     │
  ├─────────────────────────────────────────────────────┤
  │  2. Global Config (~/.agent/config.yml)             │
  ├─────────────────────────────────────────────────────┤
  │  1. Default Values (built-in)                       │  ← Lowest
  └─────────────────────────────────────────────────────┘

Rules:
  - Higher layers override lower layers
  - For nested dicts: deep merge (both levels preserved)
  - For lists and scalars: full replacement
  - Missing keys in higher layers: inherit from lower layers
"""
