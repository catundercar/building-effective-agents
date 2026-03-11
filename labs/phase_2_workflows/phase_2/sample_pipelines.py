"""示範 Pipeline — 預建的 Chain 和 Route 範例供測試與學習使用。

這些 Pipeline 展示了 Prompt Chaining 和 Routing 的典型應用場景：
- Code Review Pipeline: 四步串行分析程式碼
- Translation Pipeline: 三步翻譯流程
- Route Handlers: 四種意圖的處理函數

學生可以參考這些範例來設計自己的 Pipeline。
"""

from __future__ import annotations

from .types import ChainStep, Route


# ---------------------------------------------------------------------------
# Pipeline 1: Code Review Pipeline
# ---------------------------------------------------------------------------

def code_review_pipeline() -> list[ChainStep]:
    """建立 Code Review Pipeline。

    四步串行流程：
    1. 讀取並分析代碼結構
    2. Gate 驗證分析結果格式
    3. 針對每個問題生成修復建議
    4. 彙整最終報告

    Returns:
        list[ChainStep]: 四步組成的 Chain
    """

    def analysis_gate(output: str) -> tuple[bool, str]:
        """檢查分析結果是否包含必要的部分。"""
        required_keywords = ["function", "issue", "suggestion"]
        output_lower = output.lower()
        missing = [kw for kw in required_keywords if kw not in output_lower]
        if missing:
            return False, f"Analysis missing sections: {', '.join(missing)}"
        return True, "Analysis contains all required sections"

    def report_transform(output: str) -> str:
        """為報告添加標題格式。"""
        return f"=== Code Review Report ===\n{output}\n=== End Report ==="

    return [
        ChainStep(
            name="step_1_analyze",
            prompt_template=(
                "You are a code reviewer. Analyze the following code carefully.\n\n"
                "Code:\n```\n{input}\n```\n\n"
                "Provide a structured analysis with these sections:\n"
                "1. **Function**: What does this code do?\n"
                "2. **Issue**: What bugs or problems exist?\n"
                "3. **Suggestion**: How should it be fixed?\n"
            ),
        ),
        ChainStep(
            name="step_2_validate",
            prompt_template=(
                "Review this code analysis for completeness. "
                "Ensure it covers Function, Issue, and Suggestion:\n\n{input}"
            ),
            gate=analysis_gate,
        ),
        ChainStep(
            name="step_3_fix",
            prompt_template=(
                "Based on this analysis, provide corrected code:\n\n{input}\n\n"
                "Show the fixed code with comments explaining each change."
            ),
        ),
        ChainStep(
            name="step_4_report",
            prompt_template=(
                "Create a concise code review report:\n\n{input}\n\n"
                "Include: Summary, Issues Found, Fixes Applied."
            ),
            transform=report_transform,
        ),
    ]


# ---------------------------------------------------------------------------
# Pipeline 2: Translation Pipeline
# ---------------------------------------------------------------------------

def translation_pipeline() -> list[ChainStep]:
    """建立翻譯 Pipeline。

    三步串行流程：
    1. 翻譯原文
    2. 自我審查翻譯品質
    3. 潤飾最終譯文

    Returns:
        list[ChainStep]: 三步組成的 Chain
    """

    def quality_gate(output: str) -> tuple[bool, str]:
        """檢查翻譯審查結果是否表明品質合格。"""
        negative_signals = ["poor", "incorrect", "wrong", "mistranslat"]
        output_lower = output.lower()
        for signal in negative_signals:
            if signal in output_lower:
                return False, f"Translation quality issue detected: contains '{signal}'"
        return True, "Translation quality acceptable"

    return [
        ChainStep(
            name="translate",
            prompt_template=(
                "Translate the following text to Traditional Chinese. "
                "Maintain technical accuracy:\n\n{input}"
            ),
        ),
        ChainStep(
            name="review_translation",
            prompt_template=(
                "Review this translation for accuracy and naturalness. "
                "Note any issues:\n\n{input}"
            ),
            gate=quality_gate,
        ),
        ChainStep(
            name="polish",
            prompt_template=(
                "Polish and finalize this translation. Make it read naturally "
                "in Traditional Chinese:\n\n{input}"
            ),
        ),
    ]


# ---------------------------------------------------------------------------
# Route Handlers
# ---------------------------------------------------------------------------

def explain_code_handler(user_input: str) -> str:
    """處理「解釋程式碼」意圖。

    實際使用時會調用 LLM 分析程式碼。
    此處為示範用的簡化版本。

    Args:
        user_input: 用戶的原始輸入

    Returns:
        str: 處理結果
    """
    return (
        f"[Code Explanation Pipeline]\n"
        f"Input received: {user_input[:100]}...\n"
        f"Analysis: This code defines a function that processes data.\n"
        f"Key components: function definition, data processing, return value."
    )


def edit_file_handler(user_input: str) -> str:
    """處理「修改文件」意圖。

    Args:
        user_input: 用戶的原始輸入

    Returns:
        str: 處理結果
    """
    return (
        f"[File Edit Pipeline]\n"
        f"Input received: {user_input[:100]}...\n"
        f"Action: Preparing file modifications based on request.\n"
        f"Status: Ready to apply changes."
    )


def run_command_handler(user_input: str) -> str:
    """處理「執行命令」意圖。

    Args:
        user_input: 用戶的原始輸入

    Returns:
        str: 處理結果
    """
    return (
        f"[Command Execution Pipeline]\n"
        f"Input received: {user_input[:100]}...\n"
        f"Action: Preparing to execute shell command.\n"
        f"Status: Command queued for execution."
    )


def chat_handler(user_input: str) -> str:
    """處理「一般對話」意圖。

    Args:
        user_input: 用戶的原始輸入

    Returns:
        str: 處理結果
    """
    return (
        f"[Chat Handler]\n"
        f"Input received: {user_input[:100]}...\n"
        f"Response: I'm happy to help with your question!"
    )


# ---------------------------------------------------------------------------
# Convenience: sample routes
# ---------------------------------------------------------------------------

def create_sample_routes() -> list[Route]:
    """建立示範路由列表。

    Returns:
        list[Route]: 四條示範路由
    """
    return [
        Route(
            name="explain_code",
            description="解釋程式碼的功能和邏輯",
            handler=explain_code_handler,
            classifier_hint="User asks to explain, understand, or analyze code",
        ),
        Route(
            name="edit_file",
            description="修改、編輯或重構文件內容",
            handler=edit_file_handler,
            classifier_hint="User asks to modify, edit, fix, or refactor a file",
        ),
        Route(
            name="run_command",
            description="執行 shell 命令或腳本",
            handler=run_command_handler,
            classifier_hint="User asks to run, execute, or test something",
        ),
        Route(
            name="chat",
            description="一般對話、問答或閒聊",
            handler=chat_handler,
            classifier_hint="General conversation, greetings, or questions not about code",
        ),
    ]
