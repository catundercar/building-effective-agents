export const zhTW: Record<string, string> = {
  // CourseRoadmap - Header
  "header.badge": "Engineering Practicum · 12 Weeks",
  "header.title": "構建 Code Agent",
  "header.subtitle1": "從零實現一個類似 Claude Code 的 AI 編程助手。",
  "header.subtitle2": "每個 Phase 都有可運行的交付物，最終產出一個可發布的 CLI 工具。",

  // CourseRoadmap - Tabs
  "tab.roadmap": "課程路線",
  "tab.architecture": "系統架構",
  "tab.principles": "設計原則",

  // CourseRoadmap - Phase cards
  "phase.concepts": "核心知識點",
  "phase.references": "參考資料",
  "phase.deliverable": "✦ 交付物",
  "phase.acceptance": "驗收標準",
  "phase.enter": "進入課程 →",

  // CourseRoadmap - Architecture tab
  "arch.desc": "整體架構採用分層設計，每一層對應一個 Phase 的交付物。上層依賴下層，但下層不感知上層存在。",
  "arch.dataflow": "核心數據流",

  // CourseRoadmap - Principles tab
  "principles.desc": "源自 Anthropic \"Building Effective Agents\" 的核心設計哲學，貫穿整個課程。",

  // Principle titles and descriptions
  "principle.1.title": "從簡單開始，按需增加複雜度",
  "principle.1.desc": "先用最簡單的方案解決問題。只在有明確需求和度量標準時才增加系統複雜度。",
  "principle.2.title": "透明性優先",
  "principle.2.desc": "讓 Agent 的推理過程對用戶可見。每一步操作都應該可以被審查和理解。",
  "principle.3.title": "在 Tool 上投入比 Prompt 更多的時間",
  "principle.3.desc": "好的工具定義和良好設計的 ACI 比精巧的 prompt 更重要、更可靠。",
  "principle.4.title": "環境反饋是 Agent 的眼睛",
  "principle.4.desc": "利用真實的環境反饋（測試結果、lint 輸出、錯誤信息）來驅動 Agent 行為，而非依賴 LLM 的猜測。",
  "principle.5.title": "用 Eval 驅動開發",
  "principle.5.desc": "建立全面的自動化評估體系。用數據而非直覺來衡量 Agent 的能力和進步。",

  // LessonPage
  "lesson.back": "← 返回課程路線",
  "lesson.prev": "← 上一課",
  "lesson.next": "下一課 →",
  "lesson.complete": "完成 Phase {phaseId} →",
  "lesson.objectives": "學習目標",
  "lesson.content": "課程內容",
  "lesson.exercises": "實戰練習",
  "lesson.criteria": "驗收標準",
  "lesson.references": "參考資料",
  "lesson.showPseudo": "查看偽代碼",
  "lesson.hidePseudo": "隱藏偽代碼",
  "lesson.showHints": "顯示提示",
  "lesson.hideHints": "隱藏提示",
  "lesson.notFound": "課程內容尚未開放",

  // Language switcher
  "lang.zhCN": "简中",
  "lang.zhTW": "繁中",
  "lang.en": "EN",
};
