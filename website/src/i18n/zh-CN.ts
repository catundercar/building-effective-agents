export const zhCN: Record<string, string> = {
  // CourseRoadmap - Header
  "header.badge": "Engineering Practicum · 12 Weeks",
  "header.title": "构建 Code Agent",
  "header.subtitle1": "从零实现一个类似 Claude Code 的 AI 编程助手。",
  "header.subtitle2": "每个 Phase 都有可运行的交付物，最终产出一个可发布的 CLI 工具。",

  // CourseRoadmap - Tabs
  "tab.roadmap": "课程路线",
  "tab.architecture": "系统架构",
  "tab.principles": "设计原则",

  // CourseRoadmap - Phase cards
  "phase.concepts": "核心知识点",
  "phase.references": "参考资料",
  "phase.deliverable": "✦ 交付物",
  "phase.acceptance": "验收标准",
  "phase.enter": "进入课程 →",

  // CourseRoadmap - Architecture tab
  "arch.desc": "整体架构采用分层设计，每一层对应一个 Phase 的交付物。上层依赖下层，但下层不感知上层存在。",
  "arch.dataflow": "核心数据流",
  "arch.simulator": "交互式模拟器",

  // CourseRoadmap - Principles tab
  "principles.desc": "源自 Anthropic \"Building Effective Agents\" 的核心设计哲学，贯穿整个课程。",

  // Principle titles and descriptions
  "principle.1.title": "从简单开始，按需增加复杂度",
  "principle.1.desc": "先用最简单的方案解决问题。只在有明确需求和度量标准时才增加系统复杂度。",
  "principle.2.title": "透明性优先",
  "principle.2.desc": "让 Agent 的推理过程对用户可见。每一步操作都应该可以被审查和理解。",
  "principle.3.title": "在 Tool 上投入比 Prompt 更多的时间",
  "principle.3.desc": "好的工具定义和良好设计的 ACI 比精巧的 prompt 更重要、更可靠。",
  "principle.4.title": "环境反馈是 Agent 的眼睛",
  "principle.4.desc": "利用真实的环境反馈（测试结果、lint 输出、错误信息）来驱动 Agent 行为，而非依赖 LLM 的猜测。",
  "principle.5.title": "用 Eval 驱动开发",
  "principle.5.desc": "建立全面的自动化评估体系。用数据而非直觉来衡量 Agent 的能力和进步。",

  // LessonPage
  "lesson.back": "← 返回课程路线",
  "lesson.prev": "← 上一课",
  "lesson.next": "下一课 →",
  "lesson.complete": "完成 Phase {phaseId} →",
  "lesson.objectives": "学习目标",
  "lesson.content": "课程内容",
  "lesson.visualization": "交互式图解",
  "lesson.exercises": "实战练习",
  "lesson.criteria": "验收标准",
  "lesson.references": "参考资料",
  "lesson.showPseudo": "查看伪代码",
  "lesson.hidePseudo": "隐藏伪代码",
  "lesson.showHints": "显示提示",
  "lesson.hideHints": "隐藏提示",
  "lesson.notFound": "课程内容尚未开放",

  // Language switcher
  "lang.zhCN": "简中",
  "lang.zhTW": "繁中",
  "lang.en": "EN",
};
