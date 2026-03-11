# Conversation Summary

## Project: Code Agent 工程實踐課程

A 12-week engineering practicum for building a Claude Code-like AI coding agent from scratch. The project has two layers:

1. **Open-source course content** — Interactive web-based curriculum, roadmap, and scaffolding code (MIT lab style)
2. **Learning platform** (future) — Progress tracking, embedded editor, GitHub integration, eval tools, AI tutor

---

## What Was Built

### 1. Interactive Course Roadmap (`course-roadmap.jsx`)
A React component with 3 tabs:
- **課程路線** — 6 phases as an expandable timeline, each with concepts, readings, deliverables, and acceptance criteria
- **系統架構** — Layered architecture diagram (5 layers mapping to 6 phases) + core data flow
- **設計原則** — 5 design principles from Anthropic's "Building Effective Agents"

### 2. Complete Curriculum (`curriculum.md`)
Detailed course content for all 6 phases (24 lessons total):

| Phase | Title | Duration | Key Deliverable |
|-------|-------|----------|-----------------|
| 0 | Augmented LLM Core | Week 1-2 | `my-llm-core` CLI tool |
| 1 | Tool System & ACI | Week 3-4 | `my-agent-tools` library |
| 2 | Prompt Chaining & Routing | Week 5-6 | `my-agent-workflows` |
| 3 | Agentic Loop | Week 7-8 | `my-agent-core` |
| 4 | Orchestration & Eval | Week 9-10 | `my-agent-advanced` |
| 5 | Productionization | Week 11-12 | `my-code-agent v1.0` |

Each lesson includes: teaching objectives, knowledge points, code exercises, and acceptance criteria.

### 3. Phase 0 Lab Scaffolding (`phase-0-llm-core/`)
MIT-style lab code with framework provided and core logic left as TODOs:

**Files provided (do not modify):**
- `types.ts` — All TypeScript type definitions
- `sample-tools.ts` — 3 pre-built tools (weather, file reader, calculator)
- `cli.ts` — CLI entry point (integration layer)
- `lab1.test.ts`, `lab2.test.ts`, `lab3.test.ts` — Test suites (~20 tests)
- `scripts/grade.ts` — Auto-grading script

**Files for students to implement (find all TODOs):**
- `client.ts` — Lab 1: LLM API client (3 methods: createMessage, streaming, retry)
- `tools.ts` — Lab 2: Tool system (5 methods: registry, executor, tool use loop)
- `context.ts` — Lab 3: Context manager (6 methods: token estimation, truncation, summarization)

---

## Key Design Decisions

1. **Architecture**: Bottom-up layered design — each phase builds one layer, upper layers depend on lower layers
2. **Pedagogy**: MIT lab model — provide skeleton code with tests, students fill in core logic
3. **Reference**: Based on Anthropic's "Building Effective Agents" article patterns (Augmented LLM → Workflows → Agents)
4. **Tech stack**: Node.js/TypeScript, Anthropic Claude API, Vitest, Ink for CLI
5. **Product split**: Open-source course content (web) separate from learning platform (progress/editor/eval)

## Platform Decisions (for learning platform, future)
- **Tech**: Next.js full-stack + Prisma + PostgreSQL
- **MVP features**: Course navigation + progress tracking + AI tutor (Claude)
- **Future**: Embedded code editor, GitHub fork sync, automated eval, collaboration/discussion

---

## What's Next

Priority order:
1. **Phase 1-5 lab scaffolding** — Each phase as an independent npm package building on previous
2. **Open-source course website** — Web-based interactive curriculum and roadmap
3. **Learning platform MVP** — Progress tracking + AI tutor
4. **Platform V2** — Editor, GitHub integration, automated grading, discussion
