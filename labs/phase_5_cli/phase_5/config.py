"""Lab 2: 配置系統 — 多層級配置合併與管理。

本模組實現了多層配置系統，支持：
- 四層配置優先級：default < global < project < cli
- 深度合併（deep merge）
- 點號路徑查詢（dotted key path）
- 配置驗證

配置層級：
  1. default  — 程式碼中的預設值（最低優先級）
  2. global   — ~/.agent/config.yml 使用者全域配置
  3. project  — .agent.yml 專案級配置
  4. cli      — 命令列參數覆蓋（最高優先級）

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from .types import (
    AgentConfig,
    ConfigEntry,
    ConfigLayer,
    ProjectConfig,
    ToolPermission,
)


class ConfigManager:
    """多層級配置管理器。"""

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def __init__(self, cli_overrides: dict[str, Any] | None = None) -> None:
        """初始化配置管理器。

        建立配置層的字典結構，每一層都是一個普通 dict。
        cli_overrides 是從命令列傳入的覆蓋參數。

        Args:
            cli_overrides: 命令列傳入的覆蓋配置，可為 None
        """
        # HINT: 1. 初始化 self._layers: dict[ConfigLayer, dict] 為空的四層結構
        #          {"default": {}, "global": {}, "project": {}, "cli": {}}
        # HINT: 2. 將 _default_config() 的結果設為 "default" 層
        # HINT: 3. 如果 cli_overrides 不為 None，設為 "cli" 層
        # HINT: 4. 儲存 cli_overrides 到 self._cli_overrides 方便後續使用
        raise NotImplementedError("TODO: Implement __init__")

    def load(self) -> ProjectConfig:
        """載入並合併所有配置層，返回最終的 ProjectConfig。

        依序載入 global 和 project 配置，然後將四層配置合併。
        合併順序: default → global → project → cli
        較高層的值覆蓋較低層的值。

        Returns:
            ProjectConfig: 合併後的專案配置
        """
        # HINT: 1. 呼叫 _load_global_config() 取得全域配置，存入 "global" 層
        # HINT: 2. 呼叫 _load_project_config() 取得專案配置，存入 "project" 層
        # HINT: 3. 用 _merge_configs 合併四層: default, global, project, cli
        # HINT: 4. 從合併結果建構 ProjectConfig:
        #          - agent_dict = merged.get("agent", {})
        #          - AgentConfig(**agent_dict)
        #          - permissions = [ToolPermission(**p) for p in merged.get("permissions", [])]
        #          - allowed_dirs = merged.get("allowed_dirs", [])
        #          - blocked_commands = merged.get("blocked_commands", [])
        # HINT: 5. 返回 ProjectConfig
        raise NotImplementedError("TODO: Implement load")

    def _load_global_config(self) -> dict:
        """讀取全域配置 ~/.agent/config.yml。

        如果文件不存在，返回空字典。
        使用簡單的 YAML 解析（只支持頂層 key: value）。

        Returns:
            dict: 全域配置字典
        """
        # HINT: 1. 構建路徑: Path.home() / ".agent" / "config.yml"
        # HINT: 2. 如果文件不存在，返回 {}
        # HINT: 3. 讀取文件內容
        # HINT: 4. 使用 _parse_simple_yaml() 解析（已提供）
        # HINT: 5. 返回解析結果
        raise NotImplementedError("TODO: Implement _load_global_config")

    def _load_project_config(self) -> dict:
        """讀取專案級配置 .agent.yml。

        從當前目錄向上搜尋 .agent.yml 文件。
        如果找不到，返回空字典。

        Returns:
            dict: 專案配置字典
        """
        # HINT: 1. 使用 _find_project_root() 尋找包含 .agent.yml 的目錄
        # HINT: 2. 如果找不到，返回 {}
        # HINT: 3. 讀取 .agent.yml 文件
        # HINT: 4. 使用 _parse_simple_yaml() 解析
        # HINT: 5. 返回解析結果
        raise NotImplementedError("TODO: Implement _load_project_config")

    def _merge_configs(self, *layers: dict) -> dict:
        """深度合併多個配置字典。

        後面的字典覆蓋前面的字典。對於巢狀字典，遞迴合併。
        對於列表和其他類型，直接覆蓋。

        Args:
            *layers: 按優先級從低到高排列的配置字典

        Returns:
            dict: 合併後的配置字典

        Example:
            >>> _merge_configs(
            ...     {"agent": {"model": "a", "temperature": 0.0}},
            ...     {"agent": {"model": "b"}},
            ... )
            {"agent": {"model": "b", "temperature": 0.0}}
        """
        # HINT: 1. 從空字典 result = {} 開始
        # HINT: 2. 遍歷每一層 layer
        # HINT: 3. 遍歷 layer 的每個 key-value
        # HINT: 4. 如果 result[key] 和 value 都是 dict → 遞迴合併
        # HINT: 5. 否則直接覆蓋: result[key] = value
        # HINT: 6. 返回 result
        raise NotImplementedError("TODO: Implement _merge_configs")

    def get(self, key: str, default: Any = None) -> Any:
        """使用點號路徑取得配置值。

        支持 "agent.model" 這樣的巢狀路徑查詢。

        Args:
            key: 點號分隔的配置鍵路徑，例如 "agent.model"
            default: 如果找不到配置值時的預設返回值

        Returns:
            找到的配置值，或 default
        """
        # HINT: 1. 合併所有層: merged = _merge_configs(...)
        # HINT: 2. 按 "." 分割 key
        # HINT: 3. 逐層深入字典:
        #          current = merged
        #          for part in parts:
        #              if isinstance(current, dict) and part in current:
        #                  current = current[part]
        #              else:
        #                  return default
        # HINT: 4. 返回 current
        raise NotImplementedError("TODO: Implement get")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    def _parse_simple_yaml(self, content: str) -> dict:
        """簡易 YAML 解析器。（已實現）

        只支持基本的 key: value 格式和簡單的巢狀結構。
        生產環境應使用 PyYAML，這裡為了減少依賴使用簡化實現。

        Args:
            content: YAML 格式的字串

        Returns:
            解析後的字典
        """
        result: dict[str, Any] = {}
        current_section: dict[str, Any] | None = None
        current_key: str | None = None

        for line in content.split("\n"):
            stripped = line.strip()

            # Skip empty lines and comments
            if not stripped or stripped.startswith("#"):
                continue

            # Check indentation level
            indent = len(line) - len(line.lstrip())

            if indent == 0 and ":" in stripped:
                # Top-level key
                key, _, value = stripped.partition(":")
                key = key.strip()
                value = value.strip()

                if value:
                    # Simple key: value
                    result[key] = self._parse_yaml_value(value)
                    current_section = None
                    current_key = None
                else:
                    # Section header (key with no value = nested dict)
                    result[key] = {}
                    current_section = result[key]
                    current_key = key

            elif indent > 0 and current_section is not None and ":" in stripped:
                # Nested key: value
                key, _, value = stripped.partition(":")
                key = key.strip()
                value = value.strip()

                if value.startswith("- "):
                    # It's a list starting inline — treat as single item
                    current_section[key] = [self._parse_yaml_value(value[2:])]
                elif value:
                    current_section[key] = self._parse_yaml_value(value)
                else:
                    current_section[key] = {}

            elif indent > 0 and stripped.startswith("- "):
                # List item under current section
                if current_key and current_key in result:
                    if not isinstance(result[current_key], list):
                        result[current_key] = []
                    result[current_key].append(
                        self._parse_yaml_value(stripped[2:])
                    )

        return result

    def _parse_yaml_value(self, value: str) -> Any:
        """解析 YAML 值為 Python 類型。（已實現）"""
        if value.lower() == "true":
            return True
        if value.lower() == "false":
            return False
        if value.lower() == "null" or value.lower() == "none":
            return None
        try:
            return int(value)
        except ValueError:
            pass
        try:
            return float(value)
        except ValueError:
            pass
        # Strip quotes
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            return value[1:-1]
        return value


def _default_config() -> dict:
    """返回預設配置。（已實現）"""
    return {
        "agent": {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 8192,
            "temperature": 0.0,
            "max_iterations": 20,
            "token_budget": 100_000,
        },
        "permissions": [],
        "allowed_dirs": [],
        "blocked_commands": ["rm -rf /", "mkfs", "dd if="],
    }


def _find_project_root() -> Path | None:
    """從當前目錄向上搜尋包含 .agent.yml 的目錄。（已實現）

    Returns:
        找到的專案根目錄路徑，或 None
    """
    current = Path.cwd()
    while True:
        if (current / ".agent.yml").exists():
            return current
        parent = current.parent
        if parent == current:
            return None
        current = parent


def validate_config(config: ProjectConfig) -> list[str]:
    """驗證配置是否合法。（已實現）

    Args:
        config: 要驗證的專案配置

    Returns:
        錯誤訊息列表，空列表表示驗證通過
    """
    errors: list[str] = []

    if config.agent.max_tokens < 1:
        errors.append("agent.max_tokens must be positive")

    if config.agent.temperature < 0.0 or config.agent.temperature > 1.0:
        errors.append("agent.temperature must be between 0.0 and 1.0")

    if config.agent.max_iterations < 1:
        errors.append("agent.max_iterations must be positive")

    if config.agent.token_budget < 1000:
        errors.append("agent.token_budget must be at least 1000")

    valid_levels = {"auto", "confirm", "deny"}
    for perm in config.permissions:
        if perm.level not in valid_levels:
            errors.append(
                f"Invalid permission level '{perm.level}' for tool '{perm.tool_name}'"
            )
        if not perm.tool_name:
            errors.append("Permission must have a tool_name")

    return errors
