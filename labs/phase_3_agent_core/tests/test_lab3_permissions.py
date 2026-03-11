"""Lab 3 測試: Permissions — 權限檢查、規則匹配、風險評估、用戶確認。

測試覆蓋:
- check_permission: 自動批准讀取、確認模式、拒絕模式
- _match_rule: glob 模式匹配
- _assess_risk: 高風險（delete）、低風險（read）
- request_approval: 用戶接受、用戶拒絕
- default_rules: 默認規則應用
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared"))

from phase_3.permissions import (
    PermissionManager,
    create_default_rules,
    format_permission_request,
)
from phase_3.types import (
    PermissionConfig,
    PermissionRequest,
    PermissionResult,
    PermissionRule,
)


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def default_config():
    """Create a PermissionConfig with default rules."""
    return PermissionConfig(
        default_level="confirm",
        rules=create_default_rules(),
        auto_approve_read=True,
    )


@pytest.fixture
def manager(default_config):
    """Create a PermissionManager with default config and auto-reject callback."""
    return PermissionManager(
        config=default_config,
        user_input_fn=lambda desc: False,  # Default: reject
    )


@pytest.fixture
def approving_manager(default_config):
    """Create a PermissionManager that auto-approves confirmations."""
    return PermissionManager(
        config=default_config,
        user_input_fn=lambda desc: True,  # Always approve
    )


# ======================================================================
# check_permission tests
# ======================================================================


class TestCheckPermission:
    """Tests for PermissionManager.check_permission."""

    def test_auto_approve_read_operations(self, manager):
        """讀取操作應被自動批准。"""
        request = PermissionRequest(
            tool_name="read_file",
            tool_input={"path": "/tmp/test.py"},
            risk_level="low",
            description="讀取文件內容",
        )

        result = manager.check_permission(request)

        assert isinstance(result, PermissionResult)
        assert result.allowed is True

    def test_confirm_mode_calls_user_input(self, approving_manager):
        """確認模式應調用用戶輸入回調。"""
        request = PermissionRequest(
            tool_name="write_file",
            tool_input={"path": "/tmp/out.py", "content": "hello"},
            risk_level="medium",
            description="寫入文件",
        )

        result = approving_manager.check_permission(request)

        assert result.allowed is True

    def test_deny_mode_blocks_operation(self, manager):
        """拒絕模式的規則應阻止操作。"""
        request = PermissionRequest(
            tool_name="sudo_exec",
            tool_input={"command": "rm -rf /"},
            risk_level="high",
            description="執行超級用戶命令",
        )

        result = manager.check_permission(request)

        assert result.allowed is False

    def test_default_level_applied(self):
        """沒有匹配規則時應使用默認等級。"""
        config = PermissionConfig(
            default_level="deny",
            rules=[],  # No rules
            auto_approve_read=False,
        )
        mgr = PermissionManager(config=config, user_input_fn=lambda d: True)

        request = PermissionRequest(
            tool_name="unknown_tool",
            tool_input={},
            risk_level="medium",
            description="Unknown operation",
        )

        result = mgr.check_permission(request)

        assert result.allowed is False


# ======================================================================
# _match_rule tests
# ======================================================================


class TestMatchRule:
    """Tests for PermissionManager._match_rule."""

    def test_match_rule_glob_pattern(self, manager):
        """glob 模式應正確匹配工具名稱。"""
        rule = manager._match_rule("read_file")

        assert rule is not None
        assert rule.tool_pattern == "read_*"
        assert rule.level == "auto"

    def test_match_rule_no_match(self):
        """沒有匹配的規則時應返回 None。"""
        config = PermissionConfig(
            default_level="confirm",
            rules=[
                PermissionRule(tool_pattern="very_specific_tool", level="auto", reason="test"),
            ],
        )
        mgr = PermissionManager(config=config)

        result = mgr._match_rule("some_other_tool")

        assert result is None

    def test_match_rule_first_match_wins(self):
        """多個規則匹配時，第一個應生效。"""
        config = PermissionConfig(
            default_level="confirm",
            rules=[
                PermissionRule(tool_pattern="read_*", level="deny", reason="deny first"),
                PermissionRule(tool_pattern="read_file", level="auto", reason="allow second"),
            ],
        )
        mgr = PermissionManager(config=config)

        rule = mgr._match_rule("read_file")

        assert rule is not None
        assert rule.level == "deny"  # First match wins


# ======================================================================
# _assess_risk tests
# ======================================================================


class TestAssessRisk:
    """Tests for PermissionManager._assess_risk."""

    def test_assess_risk_high_for_delete(self, manager):
        """刪除操作應被評為高風險。"""
        risk = manager._assess_risk("delete_file", {"path": "/tmp/important.py"})

        assert risk == "high"

    def test_assess_risk_low_for_read(self, manager):
        """讀取操作應被評為低風險。"""
        risk = manager._assess_risk("read_file", {"path": "/tmp/test.py"})

        assert risk == "low"

    def test_assess_risk_medium_for_write(self, manager):
        """寫入操作應被評為中等風險。"""
        risk = manager._assess_risk("write_file", {"path": "/tmp/out.py"})

        assert risk == "medium"

    def test_assess_risk_high_for_exec(self, manager):
        """執行命令應被評為高風險。"""
        risk = manager._assess_risk("exec_command", {"command": "ls"})

        assert risk == "high"


# ======================================================================
# request_approval tests
# ======================================================================


class TestRequestApproval:
    """Tests for PermissionManager.request_approval."""

    def test_request_approval_user_accepts(self, approving_manager):
        """用戶接受時應返回 allowed=True。"""
        request = PermissionRequest(
            tool_name="write_file",
            tool_input={"path": "/tmp/out.py"},
            risk_level="medium",
            description="寫入文件",
        )

        result = approving_manager.request_approval(request)

        assert result.allowed is True

    def test_request_approval_user_rejects(self, manager):
        """用戶拒絕時應返回 allowed=False。"""
        request = PermissionRequest(
            tool_name="write_file",
            tool_input={"path": "/tmp/out.py"},
            risk_level="medium",
            description="寫入文件",
        )

        result = manager.request_approval(request)

        assert result.allowed is False


# ======================================================================
# Default rules tests
# ======================================================================


class TestDefaultRules:
    """Tests for create_default_rules and their application."""

    def test_default_rules_applied(self):
        """默認規則應包含常見的讀取和寫入規則。"""
        rules = create_default_rules()

        assert len(rules) > 0

        # Should have auto rules for read operations
        auto_rules = [r for r in rules if r.level == "auto"]
        assert len(auto_rules) > 0

        # Should have confirm rules for write operations
        confirm_rules = [r for r in rules if r.level == "confirm"]
        assert len(confirm_rules) > 0

        # Should have deny rules for dangerous operations
        deny_rules = [r for r in rules if r.level == "deny"]
        assert len(deny_rules) > 0

    def test_format_permission_request(self):
        """格式化函數應生成人類可讀的描述。"""
        request = PermissionRequest(
            tool_name="delete_file",
            tool_input={"path": "/tmp/important.py"},
            risk_level="high",
            description="刪除重要文件",
        )

        output = format_permission_request(request)

        assert "delete_file" in output
        assert "HIGH RISK" in output
        assert "important.py" in output
