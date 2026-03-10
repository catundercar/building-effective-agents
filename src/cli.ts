#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 *  Phase 0 CLI — 整合入口
 * ═══════════════════════════════════════════════════════════════
 *
 *  這個文件將你在 Lab 1-3 中實現的模塊組裝成一個可交互的 CLI。
 *  完成所有 Lab 後，運行 `npm run dev` 啟動。
 *
 *  它已經為你寫好了 CLI 的交互邏輯，你只需要確保
 *  client.ts, tools.ts, context.ts 中的 TODO 都已實現。
 *
 * ═══════════════════════════════════════════════════════════════
 */

import * as readline from "node:readline";
import { LLMClient } from "./client.js";
import { ToolRegistry, ToolExecutor, toolUseLoop } from "./tools.js";
import { ContextManager } from "./context.js";
import { allTools } from "./sample-tools.js";
import type { Message, StreamEvent } from "./types.js";

// ─── ANSI Colors ─────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log(`
${c.bold}${c.cyan}╔═══════════════════════════════════════════╗
║   Phase 0 · Augmented LLM Core           ║
║   my-llm-core v0.1.0                     ║
╚═══════════════════════════════════════════╝${c.reset}

${c.dim}Commands:
  /tools    — List registered tools
  /context  — Show context window status
  /clear    — Clear conversation history
  /exit     — Exit${c.reset}
`);

  // ── Initialize Components ──────────────────────────────

  const client = new LLMClient();

  const registry = new ToolRegistry();
  for (const tool of allTools) {
    registry.register(tool);
    console.log(`${c.green}✓${c.reset} Registered tool: ${c.bold}${tool.definition.name}${c.reset}`);
  }
  console.log();

  const executor = new ToolExecutor(registry);

  const contextMgr = new ContextManager({
    maxContextTokens: 200000,
    reservedOutputTokens: 4096,
    summarizationThreshold: 0.75,
  });

  contextMgr.setSystemPrompt(
    "You are a helpful coding assistant. You have access to tools for reading files, checking weather, and performing calculations. Use tools when appropriate to help the user."
  );
  contextMgr.setTools(registry.listDefinitions());

  // ── REPL Loop ──────────────────────────────────────────

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () =>
    new Promise<string>((resolve) => {
      rl.question(`${c.bold}${c.blue}You ›${c.reset} `, resolve);
    });

  while (true) {
    const input = await prompt();
    const trimmed = input.trim();

    if (!trimmed) continue;

    // ── Handle commands ────────────────────────────────
    if (trimmed === "/exit") {
      console.log(`${c.dim}Goodbye!${c.reset}`);
      rl.close();
      process.exit(0);
    }

    if (trimmed === "/tools") {
      console.log(`\n${c.bold}Registered Tools:${c.reset}`);
      for (const def of registry.listDefinitions()) {
        console.log(`  ${c.yellow}${def.name}${c.reset} — ${c.dim}${def.description.slice(0, 80)}...${c.reset}`);
      }
      console.log();
      continue;
    }

    if (trimmed === "/context") {
      const state = contextMgr.getState();
      console.log(`\n${c.bold}Context Window:${c.reset}`);
      console.log(`  Messages:     ${state.messages.length}`);
      console.log(`  Total tokens: ${c.cyan}${state.totalTokens}${c.reset} / 200,000`);
      console.log(`  Near limit:   ${state.isNearLimit ? `${c.red}YES${c.reset}` : `${c.green}NO${c.reset}`}`);
      console.log();
      continue;
    }

    if (trimmed === "/clear") {
      contextMgr.clear();
      console.log(`${c.dim}Conversation cleared.${c.reset}\n`);
      continue;
    }

    // ── Send to LLM ────────────────────────────────────

    contextMgr.addMessage({ role: "user", content: trimmed });

    try {
      // Auto-manage context before sending
      const mgmt = await contextMgr.autoManage(client);
      if (mgmt.action !== "none") {
        console.log(
          `${c.dim}[Context ${mgmt.action}, saved ${mgmt.tokensSaved} tokens]${c.reset}`
        );
      }

      console.log(`\n${c.bold}${c.magenta}Agent ›${c.reset} `);

      // Use tool loop
      const result = await toolUseLoop(
        client,
        executor,
        contextMgr.getMessages(),
        {
          systemPrompt: contextMgr.getState().systemPrompt,
          tools: registry.listDefinitions(),
          maxIterations: 10,
          onIteration: (iter, response) => {
            // 顯示 tool 調用
            for (const block of response.content) {
              if (block.type === "tool_use") {
                console.log(
                  `  ${c.yellow}⚡ ${block.name}${c.reset}${c.dim}(${JSON.stringify(block.input)})${c.reset}`
                );
              }
            }
          },
        }
      );

      // 顯示最終文字回覆
      for (const block of result.response.content) {
        if (block.type === "text") {
          console.log(block.text);
        }
      }

      // 更新 context manager 的 messages
      // (toolUseLoop 返回的 messages 包含完整歷史)
      contextMgr.clear();
      for (const msg of result.messages) {
        contextMgr.addMessage(msg);
      }

      console.log(
        `\n${c.dim}[tokens: in=${result.response.usage.inputTokens} out=${result.response.usage.outputTokens}]${c.reset}\n`
      );
    } catch (err: any) {
      console.error(`\n${c.red}Error: ${err.message}${c.reset}\n`);
    }
  }
}

main().catch(console.error);
