"""Lab 3: Session 管理 — 對話持久化與恢復。

本模組實現了 Session 管理器，支持：
- 建立新的對話 Session
- 將 Session 持久化到磁碟（JSON 格式）
- 從磁碟載入 Session
- 列出所有已保存的 Session
- 追加消息並自動保存

學生需要實現標記為 TODO 的方法。
已標記為 PROVIDED 的方法已經實現，可供參考和調用。
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

from .types import Session, SessionConfig, SessionMessage, SessionSummary


class SessionManager:
    """Session 管理器，負責對話的建立、持久化和恢復。"""

    # ------------------------------------------------------------------
    # TODO: 學生需要實現以下方法
    # ------------------------------------------------------------------

    def __init__(self, config: SessionConfig | None = None) -> None:
        """初始化 Session 管理器。

        設置儲存目錄並確保目錄存在。

        Args:
            config: 可選的 Session 配置，為 None 時使用預設值
        """
        # HINT: 1. 如果 config 為 None，建立預設的 SessionConfig
        # HINT: 2. 儲存 config 到 self.config
        # HINT: 3. 展開 storage_dir 中的 "~" (使用 Path.expanduser())
        # HINT: 4. 將展開後的路徑儲存到 self.storage_dir (Path 物件)
        # HINT: 5. 建立儲存目錄 (使用 mkdir(parents=True, exist_ok=True))
        raise NotImplementedError("TODO: Implement __init__")

    def create_session(self, project_dir: str, model: str) -> Session:
        """建立一個新的 Session。

        生成唯一 ID，設置時間戳和初始參數。

        Args:
            project_dir: 專案的工作目錄路徑
            model: 使用的 LLM 模型名稱

        Returns:
            Session: 新建的 Session 物件
        """
        # HINT: 1. 使用 _generate_session_id() 生成唯一 ID
        # HINT: 2. 取得當前時間戳: time.time()
        # HINT: 3. 建立 Session 物件，設置所有欄位
        # HINT: 4. 返回 Session
        raise NotImplementedError("TODO: Implement create_session")

    def save_session(self, session: Session) -> None:
        """將 Session 持久化到磁碟。

        以 JSON 格式儲存 Session 資料到 storage_dir/{session_id}.json。

        Args:
            session: 要儲存的 Session 物件
        """
        # HINT: 1. 使用 _session_path(session.id) 取得檔案路徑
        # HINT: 2. 更新 session.updated_at 為當前時間
        # HINT: 3. 將 Session 轉為可序列化的字典:
        #          - session.messages 中的每條 SessionMessage 也要轉為 dict
        # HINT: 4. 使用 json.dumps() 序列化（ensure_ascii=False, indent=2）
        # HINT: 5. 寫入檔案
        raise NotImplementedError("TODO: Implement save_session")

    def load_session(self, session_id: str) -> Session:
        """從磁碟載入 Session。

        讀取 JSON 檔案並重建 Session 物件。

        Args:
            session_id: 要載入的 Session ID

        Returns:
            Session: 載入的 Session 物件

        Raises:
            FileNotFoundError: 當 Session 檔案不存在時
        """
        # HINT: 1. 使用 _session_path(session_id) 取得檔案路徑
        # HINT: 2. 如果檔案不存在，拋出 FileNotFoundError
        # HINT: 3. 讀取並解析 JSON
        # HINT: 4. 重建 SessionMessage 列表:
        #          messages = [SessionMessage(**m) for m in data["messages"]]
        # HINT: 5. 建立並返回 Session 物件
        raise NotImplementedError("TODO: Implement load_session")

    def list_sessions(self) -> list[SessionSummary]:
        """列出所有已保存的 Session 摘要。

        掃描 storage_dir 中的所有 .json 檔案，
        為每個 Session 生成摘要信息。
        按建立時間降序排列（最新的在前）。

        Returns:
            list[SessionSummary]: Session 摘要列表
        """
        # HINT: 1. 使用 self.storage_dir.glob("*.json") 列出所有 JSON 檔案
        # HINT: 2. 對每個檔案:
        #          a. 讀取並解析 JSON
        #          b. 提取 id, created_at, messages, project_dir
        #          c. 計算 message_count
        #          d. 生成 preview: 取第一條 user 消息的前 80 個字元
        #          e. 建立 SessionSummary
        # HINT: 3. 按 created_at 降序排序
        # HINT: 4. 返回列表
        raise NotImplementedError("TODO: Implement list_sessions")

    def add_message(
        self,
        session: Session,
        role: str,
        content: str,
        tool_calls: list[dict] | None = None,
    ) -> None:
        """追加消息到 Session 並自動保存。

        建立 SessionMessage，追加到 session.messages，
        更新 session.updated_at，如果 auto_save 為 True 則自動保存。

        Args:
            session: 目標 Session
            role: 消息角色 ("user" 或 "assistant")
            content: 消息內容
            tool_calls: 可選的工具調用記錄列表
        """
        # HINT: 1. 建立 SessionMessage，設置 role, content, timestamp, tool_calls
        # HINT: 2. 追加到 session.messages
        # HINT: 3. 更新 session.updated_at
        # HINT: 4. 如果 self.config.auto_save 為 True，呼叫 save_session(session)
        raise NotImplementedError("TODO: Implement add_message")

    # ------------------------------------------------------------------
    # PROVIDED: 以下方法已經實現
    # ------------------------------------------------------------------

    def _generate_session_id(self) -> str:
        """生成唯一的 Session ID。（已實現）

        格式: "ses_{timestamp_hex}_{counter_hex}"
        使用時間戳確保唯一性。

        Returns:
            str: 唯一的 Session ID
        """
        timestamp = int(time.time() * 1000)
        counter = len(list(self.storage_dir.glob("*.json")))
        return f"ses_{timestamp:x}_{counter:04x}"

    def _session_path(self, session_id: str) -> Path:
        """取得 Session 檔案的路徑。（已實現）

        Args:
            session_id: Session ID

        Returns:
            Path: Session JSON 檔案的完整路徑
        """
        return self.storage_dir / f"{session_id}.json"

    def _cleanup_old_sessions(self) -> int:
        """清理超出上限的舊 Session。（已實現）

        保留最新的 max_sessions 個 Session，刪除其餘的。

        Returns:
            int: 被刪除的 Session 數量
        """
        session_files = sorted(
            self.storage_dir.glob("*.json"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )

        removed = 0
        for old_file in session_files[self.config.max_sessions :]:
            old_file.unlink()
            removed += 1

        return removed
