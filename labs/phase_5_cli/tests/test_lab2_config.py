"""Lab 2 測試: 配置系統 — 多層配置載入、合併、查詢。

測試覆蓋:
- load: 返回 ProjectConfig、預設值正確
- merge: 全域配置合併、專案配置合併、CLI 覆蓋最高優先
- deep merge: 巢狀字典深度合併
- get: 點號路徑查詢、缺失 key 返回預設值
- validate: 不合法配置被拒絕
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

from phase_5.config import ConfigManager, _default_config, validate_config
from phase_5.types import AgentConfig, ProjectConfig, ToolPermission


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def config_manager():
    """Create a ConfigManager with no overrides."""
    return ConfigManager()


@pytest.fixture
def config_manager_with_overrides():
    """Create a ConfigManager with CLI overrides."""
    return ConfigManager(cli_overrides={"agent": {"model": "claude-opus-4-20250514"}})


# ======================================================================
# load tests
# ======================================================================


class TestLoad:
    """Tests for ConfigManager.load."""

    def test_load_returns_project_config(self, config_manager):
        """load() 應返回 ProjectConfig 實例。"""
        # Patch file reads to avoid filesystem dependency
        with patch.object(config_manager, "_load_global_config", return_value={}):
            with patch.object(config_manager, "_load_project_config", return_value={}):
                result = config_manager.load()

        assert isinstance(result, ProjectConfig)

    def test_load_default_values(self, config_manager):
        """載入預設配置時，值應與 _default_config() 一致。"""
        with patch.object(config_manager, "_load_global_config", return_value={}):
            with patch.object(config_manager, "_load_project_config", return_value={}):
                result = config_manager.load()

        defaults = _default_config()
        assert result.agent.model == defaults["agent"]["model"]
        assert result.agent.max_tokens == defaults["agent"]["max_tokens"]
        assert result.agent.temperature == defaults["agent"]["temperature"]
        assert result.agent.max_iterations == defaults["agent"]["max_iterations"]

    def test_load_merges_global_config(self, config_manager):
        """全域配置應覆蓋預設值。"""
        global_cfg = {"agent": {"model": "claude-opus-4-20250514", "temperature": 0.5}}

        with patch.object(config_manager, "_load_global_config", return_value=global_cfg):
            with patch.object(config_manager, "_load_project_config", return_value={}):
                result = config_manager.load()

        assert result.agent.model == "claude-opus-4-20250514"
        assert result.agent.temperature == 0.5
        # Default values should still be present
        assert result.agent.max_tokens == 8192

    def test_load_merges_project_config(self, config_manager):
        """專案配置應覆蓋全域和預設值。"""
        global_cfg = {"agent": {"model": "claude-opus-4-20250514"}}
        project_cfg = {"agent": {"model": "claude-sonnet-4-20250514", "max_iterations": 50}}

        with patch.object(config_manager, "_load_global_config", return_value=global_cfg):
            with patch.object(config_manager, "_load_project_config", return_value=project_cfg):
                result = config_manager.load()

        # Project config should win over global
        assert result.agent.model == "claude-sonnet-4-20250514"
        assert result.agent.max_iterations == 50

    def test_cli_overrides_take_priority(self, config_manager_with_overrides):
        """CLI 覆蓋應具有最高優先級。"""
        project_cfg = {"agent": {"model": "claude-sonnet-4-20250514"}}

        with patch.object(config_manager_with_overrides, "_load_global_config", return_value={}):
            with patch.object(
                config_manager_with_overrides, "_load_project_config", return_value=project_cfg
            ):
                result = config_manager_with_overrides.load()

        # CLI override should win
        assert result.agent.model == "claude-opus-4-20250514"


# ======================================================================
# merge tests
# ======================================================================


class TestMerge:
    """Tests for ConfigManager._merge_configs."""

    def test_merge_deep_nested(self, config_manager):
        """深度巢狀字典應遞迴合併。"""
        base = {
            "agent": {"model": "a", "temperature": 0.0},
            "extra": {"nested": {"deep_key": "base_value", "keep": True}},
        }
        override = {
            "agent": {"model": "b"},
            "extra": {"nested": {"deep_key": "override_value"}},
        }

        result = config_manager._merge_configs(base, override)

        assert result["agent"]["model"] == "b"
        assert result["agent"]["temperature"] == 0.0  # preserved from base
        assert result["extra"]["nested"]["deep_key"] == "override_value"
        assert result["extra"]["nested"]["keep"] is True  # preserved from base

    def test_merge_empty_layers(self, config_manager):
        """空的覆蓋層不應影響結果。"""
        base = {"agent": {"model": "test"}}
        result = config_manager._merge_configs(base, {}, {})

        assert result["agent"]["model"] == "test"

    def test_merge_list_replacement(self, config_manager):
        """列表值應完全替換，不是合併。"""
        base = {"blocked_commands": ["rm -rf /", "mkfs"]}
        override = {"blocked_commands": ["dd if="]}

        result = config_manager._merge_configs(base, override)

        assert result["blocked_commands"] == ["dd if="]


# ======================================================================
# get tests
# ======================================================================


class TestGet:
    """Tests for ConfigManager.get."""

    def test_get_dotted_key(self, config_manager):
        """使用點號路徑應取得巢狀值。"""
        result = config_manager.get("agent.model")

        defaults = _default_config()
        assert result == defaults["agent"]["model"]

    def test_get_missing_key_returns_default(self, config_manager):
        """不存在的 key 應返回指定的預設值。"""
        result = config_manager.get("nonexistent.path", default="fallback")

        assert result == "fallback"

    def test_get_top_level_key(self, config_manager):
        """頂層 key 應直接返回。"""
        result = config_manager.get("blocked_commands")

        assert isinstance(result, list)


# ======================================================================
# validate tests
# ======================================================================


class TestValidate:
    """Tests for validate_config."""

    def test_validate_config_rejects_invalid(self):
        """不合法的配置應返回錯誤列表。"""
        bad_config = ProjectConfig(
            agent=AgentConfig(
                max_tokens=-1,
                temperature=2.0,
                max_iterations=0,
                token_budget=100,
            ),
            permissions=[
                ToolPermission(tool_name="", level="auto"),
            ],
        )

        errors = validate_config(bad_config)

        assert len(errors) > 0
        # Should catch: max_tokens, temperature, max_iterations, token_budget, empty tool_name
        assert any("max_tokens" in e for e in errors)
        assert any("temperature" in e for e in errors)
        assert any("max_iterations" in e for e in errors)
        assert any("token_budget" in e for e in errors)
        assert any("tool_name" in e for e in errors)

    def test_validate_config_accepts_valid(self):
        """合法的配置應返回空列表。"""
        good_config = ProjectConfig(
            agent=AgentConfig(),
            permissions=[
                ToolPermission(tool_name="read_file", level="auto"),
            ],
        )

        errors = validate_config(good_config)

        assert errors == []
