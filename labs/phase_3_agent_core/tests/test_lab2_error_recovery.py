"""Lab 2 測試: Error Recovery — 錯誤分類、重試判斷、策略選擇、提示增強。

測試覆蓋:
- categorize_error: 可重試錯誤、致命錯誤、需換策略錯誤
- should_retry: 限制內允許重試、超限拒絕重試
- get_recovery_strategy: 首次失敗、多次重試後
- build_retry_prompt: 包含錯誤歷史
- record_error: 追蹤歷史記錄
- _detect_repeated_failures: 重複失敗檢測
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "shared"))

from phase_3.error_recovery import ErrorRecovery
from phase_3.types import (
    ErrorRecord,
    RecoveryConfig,
    RecoveryStrategy,
)


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def recovery():
    """Create an ErrorRecovery with default config."""
    return ErrorRecovery(RecoveryConfig(
        max_retries=3,
        max_strategy_changes=2,
        retry_delay_ms=1,  # 1ms for fast tests
    ))


@pytest.fixture
def strict_recovery():
    """Create an ErrorRecovery with strict limits."""
    return ErrorRecovery(RecoveryConfig(
        max_retries=1,
        max_strategy_changes=1,
        retry_delay_ms=1,
    ))


# ======================================================================
# categorize_error tests
# ======================================================================


class TestCategorizeError:
    """Tests for ErrorRecovery.categorize_error."""

    def test_categorize_retryable_error(self, recovery):
        """包含 timeout/rate limit 等關鍵字的錯誤應歸類為 retryable。"""
        record = recovery.categorize_error(
            TimeoutError("Connection timeout after 30s"),
            context={"url": "https://api.example.com"},
        )

        assert isinstance(record, ErrorRecord)
        assert record.category == "retryable"
        assert record.error_type == "TimeoutError"
        assert "timeout" in record.message.lower()

    def test_categorize_fatal_error(self, recovery):
        """包含 permission denied/authentication 的錯誤應歸類為 fatal。"""
        record = recovery.categorize_error(
            PermissionError("Permission denied: /etc/shadow"),
        )

        assert record.category == "fatal"
        assert record.error_type == "PermissionError"

    def test_categorize_strategy_change(self, recovery):
        """不匹配 retryable 和 fatal 的錯誤應歸類為 strategy_change。"""
        record = recovery.categorize_error(
            ValueError("Invalid format for input data"),
        )

        assert record.category == "strategy_change"
        assert record.error_type == "ValueError"

    def test_categorize_string_error(self, recovery):
        """字串類型的錯誤也應能正確分類。"""
        record = recovery.categorize_error(
            "rate limit exceeded, please wait",
        )

        assert record.category == "retryable"

    def test_categorize_with_context(self, recovery):
        """上下文信息應被保存在錯誤記錄中。"""
        ctx = {"tool": "read_file", "path": "/tmp/test.py"}
        record = recovery.categorize_error(
            FileNotFoundError("File not found"),
            context=ctx,
        )

        assert record.context == ctx


# ======================================================================
# should_retry tests
# ======================================================================


class TestShouldRetry:
    """Tests for ErrorRecovery.should_retry."""

    def test_should_retry_under_limit(self, recovery):
        """重試次數在限制內時應允許重試。"""
        record = ErrorRecord(
            error_type="TimeoutError",
            message="Connection timeout",
            category="retryable",
            attempt=1,
        )

        assert recovery.should_retry(record) is True

    def test_should_retry_over_limit(self, strict_recovery):
        """重試次數超過限制時應拒絕重試。"""
        record = ErrorRecord(
            error_type="TimeoutError",
            message="Connection timeout",
            category="retryable",
            attempt=5,  # Over max_retries=1
        )

        assert strict_recovery.should_retry(record) is False

    def test_should_not_retry_fatal(self, recovery):
        """致命錯誤不應重試。"""
        record = ErrorRecord(
            error_type="PermissionError",
            message="Permission denied",
            category="fatal",
            attempt=1,
        )

        assert recovery.should_retry(record) is False

    def test_should_retry_strategy_change(self, recovery):
        """strategy_change 在策略切換次數限制內應允許。"""
        record = ErrorRecord(
            error_type="ValueError",
            message="Invalid input",
            category="strategy_change",
            attempt=1,
        )

        assert recovery.should_retry(record) is True


# ======================================================================
# get_recovery_strategy tests
# ======================================================================


class TestGetRecoveryStrategy:
    """Tests for ErrorRecovery.get_recovery_strategy."""

    def test_get_recovery_strategy_first_failure(self, recovery):
        """首次失敗時應返回簡單重試策略。"""
        records = [
            ErrorRecord(
                error_type="TimeoutError",
                message="Connection timeout",
                category="retryable",
                attempt=1,
            ),
        ]

        strategy = recovery.get_recovery_strategy(records)

        assert isinstance(strategy, RecoveryStrategy)
        assert strategy.name == "simple_retry"

    def test_get_recovery_strategy_after_retries(self, recovery):
        """多次同類型失敗後應返回不同策略。"""
        records = [
            ErrorRecord(
                error_type="ValueError",
                message="Invalid format",
                category="strategy_change",
                attempt=1,
            ),
            ErrorRecord(
                error_type="ValueError",
                message="Invalid format again",
                category="strategy_change",
                attempt=2,
            ),
            ErrorRecord(
                error_type="ValueError",
                message="Still invalid format",
                category="strategy_change",
                attempt=3,
            ),
        ]

        strategy = recovery.get_recovery_strategy(records)

        assert isinstance(strategy, RecoveryStrategy)
        # Should switch to alternative approach after repeated failures
        assert strategy.name == "alternative_approach"

    def test_get_recovery_strategy_empty_records(self, recovery):
        """空記錄列表應返回簡單重試策略。"""
        strategy = recovery.get_recovery_strategy([])

        assert isinstance(strategy, RecoveryStrategy)
        assert strategy.name == "simple_retry"


# ======================================================================
# build_retry_prompt tests
# ======================================================================


class TestBuildRetryPrompt:
    """Tests for ErrorRecovery.build_retry_prompt."""

    def test_build_retry_prompt_includes_history(self, recovery):
        """重試提示應包含錯誤歷史。"""
        records = [
            ErrorRecord(
                error_type="FileNotFoundError",
                message="File /tmp/test.py not found",
                category="retryable",
                attempt=1,
            ),
        ]

        prompt = recovery.build_retry_prompt(
            "Read and analyze the file",
            records,
        )

        assert isinstance(prompt, str)
        assert "Read and analyze the file" in prompt
        assert "FileNotFoundError" in prompt or "not found" in prompt.lower()

    def test_build_retry_prompt_empty_records(self, recovery):
        """空錯誤記錄時應返回原始提示。"""
        original = "Do something"
        prompt = recovery.build_retry_prompt(original, [])

        assert prompt == original

    def test_build_retry_prompt_multiple_errors(self, recovery):
        """多個錯誤記錄都應包含在提示中。"""
        records = [
            ErrorRecord(
                error_type="TimeoutError",
                message="Attempt 1 timed out",
                category="retryable",
                attempt=1,
            ),
            ErrorRecord(
                error_type="ValueError",
                message="Attempt 2 bad format",
                category="strategy_change",
                attempt=2,
            ),
        ]

        prompt = recovery.build_retry_prompt("Original task", records)

        assert "Attempt 1" in prompt or "TimeoutError" in prompt
        assert "Attempt 2" in prompt or "ValueError" in prompt


# ======================================================================
# record_error tests
# ======================================================================


class TestRecordError:
    """Tests for ErrorRecovery.record_error."""

    def test_record_error_tracks_history(self, recovery):
        """記錄錯誤後應出現在歷史列表中。"""
        record = ErrorRecord(
            error_type="RuntimeError",
            message="Something broke",
            category="retryable",
            attempt=1,
        )

        recovery.record_error(record)

        assert len(recovery.error_history) == 1
        assert recovery.error_history[0] is record

    def test_record_multiple_errors(self, recovery):
        """應能記錄多個錯誤。"""
        for i in range(3):
            recovery.record_error(ErrorRecord(
                error_type="Error",
                message=f"Error {i}",
                category="retryable",
                attempt=i + 1,
            ))

        assert len(recovery.error_history) == 3


# ======================================================================
# _detect_repeated_failures tests
# ======================================================================


class TestDetectRepeatedFailures:
    """Tests for ErrorRecovery._detect_repeated_failures."""

    def test_detect_repeated_failures(self, recovery):
        """相同類型的錯誤出現多次應被檢測。"""
        records = [
            ErrorRecord(error_type="ValueError", message="err1", attempt=1),
            ErrorRecord(error_type="ValueError", message="err2", attempt=2),
        ]

        assert ErrorRecovery._detect_repeated_failures(records) is True

    def test_no_repeated_failures(self, recovery):
        """不同類型的錯誤不應被視為重複。"""
        records = [
            ErrorRecord(error_type="ValueError", message="err1", attempt=1),
            ErrorRecord(error_type="TypeError", message="err2", attempt=1),
        ]

        assert ErrorRecovery._detect_repeated_failures(records) is False

    def test_empty_records_no_repeat(self, recovery):
        """空列表或單條記錄不應被視為重複。"""
        assert ErrorRecovery._detect_repeated_failures([]) is False
        assert ErrorRecovery._detect_repeated_failures([
            ErrorRecord(error_type="Error", message="e", attempt=1),
        ]) is False
