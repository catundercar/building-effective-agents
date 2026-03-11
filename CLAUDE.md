# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **12-week engineering practicum** for building an AI coding agent (similar to Claude Code) from scratch. Two deliverables:

1. **Web interactive learning tool** — A React-based course website with visual roadmap, architecture diagrams, and interactive content. UI style follows `course-roadmap.jsx` (dark theme, monospace font, `#0A0A0B` background, layered card design).
2. **Course scaffolding code** — Python-based lab framework where students implement core agent functionality. Each phase is a self-contained Python package with tests, TODO markers, and auto-grading.

## Product Direction

- The **web tool** is the primary product — an interactive learning experience, NOT a static documentation site
- Course **framework/scaffolding is implemented in Python** (not TypeScript — the existing `src/` TS code in phase-0 is legacy from an earlier direction)
- Core priority: **content design and completion for each phase**, plus the Python scaffolding that students work through
- Target audience is Chinese-speaking developers; Chinese for UI/curriculum text, English for code/comments/technical docs

## Architecture

The agent students build follows a 5-layer bottom-up architecture:

```
Layer 5 · CLI Interface         → Phase 5 (Week 11-12)
Layer 4 · Agent Core            → Phase 3-4 (Week 7-10)
Layer 3 · Workflow Engine       → Phase 2 (Week 5-6)
Layer 2 · Tool System           → Phase 1 (Week 3-4)
Layer 1 · LLM Core              → Phase 0 (Week 1-2)
```

Each layer is independent. Upper layers depend on lower layers only. See `course-roadmap.jsx` for the full phase definitions (concepts, readings, deliverables, acceptance criteria).

## Key Files

- `course-roadmap.jsx` — **Reference design**: React component defining all 6 phases, architecture layers, and design principles. This is the UI style guide for the web tool.
- `curriculum.md` — Full 24-lesson curriculum with detailed knowledge points, exercises, and acceptance criteria per phase
- `SUMMARY.md` — Conversation history and decisions from prior sessions

## Lab Scaffolding Design (Python)

Each phase lab should follow this pattern:
- **Provided files** (students do NOT modify): type definitions, test suites, sample data, integration entry points
- **Student files** (contain `TODO` markers): core logic with function signatures, docstrings, `HINT` comments
- **Grading**: automated test runner that outputs a progress report
- Tests use mocked API responses — no real API key needed for testing
- Tool definitions follow Anthropic's tool use format (JSON Schema for `input_schema`)
- File paths in tools must always be absolute (Anthropic SWE-bench lesson)

## Design Principles (from Anthropic's "Building Effective Agents")

1. Start simple, add complexity only when needed
2. Transparency first — make agent reasoning visible
3. Invest more time in tool design than prompt engineering
4. Environment feedback (ground truth) drives agent intelligence
5. Eval-driven development — measure everything

## Web Tool UI Conventions

Follow `course-roadmap.jsx` style:
- Dark theme: `#0A0A0B` background, `#E4E4E7` text, `#71717A` secondary text
- Font: JetBrains Mono / SF Mono / Fira Code (monospace)
- Phase colors: `#E8453C` (P0), `#D97706` (P1), `#059669` (P2), `#7C3AED` (P3), `#2563EB` (P4), `#DC2626` (P5)
- Subtle grid background, card-based layout with `rgba` borders
- Animations: `fadeIn` for expanded content
