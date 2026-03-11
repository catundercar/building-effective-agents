"""Lab 3 測試: Session 管理 — 建立、儲存、載入、列表、追加消息。

測試覆蓋:
- create_session: 生成 ID、設置欄位
- save + load: 序列化/反序列化往返驗證
- list_sessions: 列出所有 Session 摘要
- add_message: 追加消息、自動保存
- load_nonexistent: 找不到 Session 拋出異常
- cleanup: 清理超出上限的舊 Session
- session summary: preview 文字生成
"""

from __future__ import annotations

import json
import time
import tempfile
from pathlib import Path

import pytest

from phase_5.session import SessionManager
from phase_5.types import Session, SessionConfig, SessionMessage, SessionSummary


# ======================================================================
# Fixtures
# ======================================================================


@pytest.fixture
def tmp_storage(tmp_path):
    """Create a temporary storage directory."""
    return str(tmp_path / "sessions")


@pytest.fixture
def session_mgr(tmp_storage):
    """Create a SessionManager with temporary storage."""
    config = SessionConfig(
        storage_dir=tmp_storage,
        max_sessions=50,
        auto_save=True,
    )
    return SessionManager(config)


@pytest.fixture
def session_mgr_no_autosave(tmp_storage):
    """Create a SessionManager with auto_save disabled."""
    config = SessionConfig(
        storage_dir=tmp_storage,
        max_sessions=50,
        auto_save=False,
    )
    return SessionManager(config)


# ======================================================================
# create_session tests
# ======================================================================


class TestCreateSession:
    """Tests for SessionManager.create_session."""

    def test_create_session_generates_id(self, session_mgr):
        """建立的 Session 應有唯一 ID。"""
        session = session_mgr.create_session(
            project_dir="/home/user/project",
            model="claude-sonnet-4-20250514",
        )

        assert session.id != ""
        assert session.id.startswith("ses_")

    def test_create_session_sets_fields(self, session_mgr):
        """建立的 Session 應正確設置所有欄位。"""
        before = time.time()
        session = session_mgr.create_session(
            project_dir="/home/user/project",
            model="claude-sonnet-4-20250514",
        )
        after = time.time()

        assert session.project_dir == "/home/user/project"
        assert session.model == "claude-sonnet-4-20250514"
        assert session.messages == []
        assert session.total_tokens == 0
        assert before <= session.created_at <= after
        assert before <= session.updated_at <= after


# ======================================================================
# save and load tests
# ======================================================================


class TestSaveAndLoad:
    """Tests for SessionManager.save_session and load_session."""

    def test_save_and_load_roundtrip(self, session_mgr):
        """保存後載入的 Session 應與原始 Session 一致。"""
        session = session_mgr.create_session(
            project_dir="/test/project",
            model="claude-sonnet-4-20250514",
        )
        session.messages.append(
            SessionMessage(
                role="user",
                content="Hello there",
                timestamp=time.time(),
                tool_calls=[],
            )
        )
        session.messages.append(
            SessionMessage(
                role="assistant",
                content="Hi! How can I help?",
                timestamp=time.time(),
                tool_calls=[{"name": "read_file", "input": {"path": "/test"}}],
            )
        )

        session_mgr.save_session(session)
        loaded = session_mgr.load_session(session.id)

        assert loaded.id == session.id
        assert loaded.project_dir == session.project_dir
        assert loaded.model == session.model
        assert len(loaded.messages) == 2
        assert loaded.messages[0].role == "user"
        assert loaded.messages[0].content == "Hello there"
        assert loaded.messages[1].role == "assistant"
        assert loaded.messages[1].content == "Hi! How can I help?"
        assert loaded.messages[1].tool_calls == [
            {"name": "read_file", "input": {"path": "/test"}}
        ]

    def test_load_nonexistent_raises(self, session_mgr):
        """載入不存在的 Session 應拋出 FileNotFoundError。"""
        with pytest.raises(FileNotFoundError):
            session_mgr.load_session("ses_nonexistent_0000")

    def test_save_updates_timestamp(self, session_mgr):
        """保存時應更新 updated_at 時間戳。"""
        session = session_mgr.create_session(
            project_dir="/test",
            model="test-model",
        )
        original_updated = session.updated_at

        time.sleep(0.01)  # Tiny delay to ensure different timestamp
        session_mgr.save_session(session)

        assert session.updated_at >= original_updated


# ======================================================================
# list_sessions tests
# ======================================================================


class TestListSessions:
    """Tests for SessionManager.list_sessions."""

    def test_list_sessions_returns_summaries(self, session_mgr):
        """列出的 Session 應返回 SessionSummary 列表。"""
        # Create and save a few sessions
        s1 = session_mgr.create_session("/proj1", "model-a")
        s1.messages.append(
            SessionMessage(role="user", content="First session message", timestamp=time.time())
        )
        session_mgr.save_session(s1)

        time.sleep(0.01)

        s2 = session_mgr.create_session("/proj2", "model-b")
        s2.messages.append(
            SessionMessage(role="user", content="Second session msg", timestamp=time.time())
        )
        session_mgr.save_session(s2)

        summaries = session_mgr.list_sessions()

        assert len(summaries) == 2
        assert all(isinstance(s, SessionSummary) for s in summaries)
        # Most recent should be first
        assert summaries[0].created_at >= summaries[1].created_at

    def test_list_sessions_empty(self, tmp_storage):
        """沒有 Session 時應返回空列表。"""
        config = SessionConfig(storage_dir=tmp_storage)
        mgr = SessionManager(config)

        summaries = mgr.list_sessions()

        assert summaries == []

    def test_session_summary_preview(self, session_mgr):
        """Session 摘要的 preview 應包含第一條用戶消息的前綴。"""
        session = session_mgr.create_session("/test", "model")
        session.messages.append(
            SessionMessage(
                role="user",
                content="This is a very long message that should be truncated in the preview",
                timestamp=time.time(),
            )
        )
        session_mgr.save_session(session)

        summaries = session_mgr.list_sessions()

        assert len(summaries) == 1
        assert "This is a very long message" in summaries[0].preview
        assert summaries[0].message_count == 1


# ======================================================================
# add_message tests
# ======================================================================


class TestAddMessage:
    """Tests for SessionManager.add_message."""

    def test_add_message_appends(self, session_mgr_no_autosave):
        """追加消息應增加 messages 列表長度。"""
        session = session_mgr_no_autosave.create_session("/test", "model")

        session_mgr_no_autosave.add_message(session, "user", "Hello")
        session_mgr_no_autosave.add_message(session, "assistant", "Hi!")

        assert len(session.messages) == 2
        assert session.messages[0].role == "user"
        assert session.messages[0].content == "Hello"
        assert session.messages[1].role == "assistant"
        assert session.messages[1].content == "Hi!"

    def test_add_message_auto_saves(self, session_mgr):
        """啟用 auto_save 時，追加消息後應自動保存到磁碟。"""
        session = session_mgr.create_session("/test", "model")
        session_mgr.save_session(session)  # Initial save

        session_mgr.add_message(session, "user", "auto-saved message")

        # Verify the file was updated by loading it
        loaded = session_mgr.load_session(session.id)
        assert len(loaded.messages) == 1
        assert loaded.messages[0].content == "auto-saved message"

    def test_add_message_with_tool_calls(self, session_mgr_no_autosave):
        """追加帶有工具調用的消息。"""
        session = session_mgr_no_autosave.create_session("/test", "model")

        tool_calls = [
            {"name": "read_file", "input": {"path": "/src/main.py"}},
        ]
        session_mgr_no_autosave.add_message(
            session, "assistant", "Let me read that file.",
            tool_calls=tool_calls,
        )

        assert len(session.messages) == 1
        assert session.messages[0].tool_calls == tool_calls

    def test_add_message_updates_timestamp(self, session_mgr_no_autosave):
        """追加消息應更新 session.updated_at。"""
        session = session_mgr_no_autosave.create_session("/test", "model")
        original = session.updated_at

        time.sleep(0.01)
        session_mgr_no_autosave.add_message(session, "user", "update ts")

        assert session.updated_at >= original


# ======================================================================
# cleanup tests
# ======================================================================


class TestCleanup:
    """Tests for SessionManager._cleanup_old_sessions."""

    def test_cleanup_old_sessions(self, tmp_storage):
        """超出上限時應清理最舊的 Session。"""
        config = SessionConfig(storage_dir=tmp_storage, max_sessions=2)
        mgr = SessionManager(config)

        # Create 4 sessions
        for i in range(4):
            s = mgr.create_session(f"/proj{i}", "model")
            s.messages.append(
                SessionMessage(role="user", content=f"msg {i}", timestamp=time.time())
            )
            mgr.save_session(s)
            time.sleep(0.01)  # Ensure different mtime

        # Cleanup
        removed = mgr._cleanup_old_sessions()

        assert removed == 2
        # Only 2 session files should remain
        remaining = list(Path(tmp_storage).glob("*.json"))
        assert len(remaining) == 2
