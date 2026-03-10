/**
 * Lab 3 Tests: Context Window Manager
 *
 * 運行: npm run test:lab3
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContextManager } from "../context.js";
import type { Message } from "../types.js";

describe("Lab 3: ContextManager", () => {
  let ctx: ContextManager;

  beforeEach(() => {
    ctx = new ContextManager({
      maxContextTokens: 1000, // 使用小數值方便測試
      reservedOutputTokens: 100,
      summarizationThreshold: 0.75,
    });
  });

  // ── Token Estimation ─────────────────────────────────

  describe("estimateTokens", () => {
    it("should estimate English text tokens", () => {
      // "Hello world" ≈ 11 chars / 4 ≈ 3 tokens
      const tokens = ctx.estimateTokens("Hello world");
      expect(tokens).toBeGreaterThanOrEqual(2);
      expect(tokens).toBeLessThanOrEqual(5);
    });

    it("should estimate Chinese text tokens", () => {
      // "你好世界" ≈ 4 chars / 1.5 ≈ 3 tokens
      const tokens = ctx.estimateTokens("你好世界");
      expect(tokens).toBeGreaterThanOrEqual(2);
      expect(tokens).toBeLessThanOrEqual(5);
    });

    it("should estimate mixed content tokens", () => {
      const tokens = ctx.estimateTokens("Hello 你好 World 世界");
      expect(tokens).toBeGreaterThan(0);
      // 合理範圍：4-10 tokens
      expect(tokens).toBeGreaterThanOrEqual(4);
      expect(tokens).toBeLessThanOrEqual(12);
    });

    it("should handle empty string", () => {
      expect(ctx.estimateTokens("")).toBe(0);
    });

    it("should handle long text proportionally", () => {
      const shortText = "Hello";
      const longText = "Hello ".repeat(100);
      const shortTokens = ctx.estimateTokens(shortText);
      const longTokens = ctx.estimateTokens(longText);

      // 長文本的 token 數應該大致是短文本的 100 倍
      expect(longTokens).toBeGreaterThan(shortTokens * 50);
    });
  });

  // ── Message Token Estimation ─────────────────────────

  describe("estimateMessageTokens", () => {
    it("should estimate string content message", () => {
      const tokens = ctx.estimateMessageTokens({
        role: "user",
        content: "Hello, how are you?",
      });
      expect(tokens).toBeGreaterThan(0);
    });

    it("should estimate ContentBlock array message", () => {
      const msg: Message = {
        role: "assistant",
        content: [
          { type: "text", text: "Let me check." },
          {
            type: "tool_use",
            id: "t1",
            name: "get_weather",
            input: { city: "Tokyo" },
          },
        ],
      };
      const tokens = ctx.estimateMessageTokens(msg);
      expect(tokens).toBeGreaterThan(0);
    });

    it("should estimate tool_result message", () => {
      const msg: Message = {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: "t1",
            content: "Sunny, 25°C",
          },
        ],
      };
      const tokens = ctx.estimateMessageTokens(msg);
      expect(tokens).toBeGreaterThan(0);
    });
  });

  // ── Total Token Calculation ──────────────────────────

  describe("getTotalTokens", () => {
    it("should include system prompt tokens", () => {
      const before = ctx.getTotalTokens();
      ctx.setSystemPrompt("You are a helpful coding assistant.");
      const after = ctx.getTotalTokens();
      expect(after).toBeGreaterThan(before);
    });

    it("should include tool definition tokens", () => {
      const before = ctx.getTotalTokens();
      ctx.setTools([
        {
          name: "read_file",
          description: "Read the contents of a file at the given path",
          input_schema: {
            type: "object",
            properties: {
              path: { type: "string", description: "File path" },
            },
            required: ["path"],
          },
        },
      ]);
      const after = ctx.getTotalTokens();
      expect(after).toBeGreaterThan(before);
    });

    it("should include message tokens", () => {
      const before = ctx.getTotalTokens();
      ctx.addMessage({ role: "user", content: "Help me write a function" });
      const after = ctx.getTotalTokens();
      expect(after).toBeGreaterThan(before);
    });

    it("should include reserved output tokens", () => {
      // 即使沒有 messages，也應該包含 reservedOutputTokens
      const total = ctx.getTotalTokens();
      expect(total).toBeGreaterThanOrEqual(100); // reservedOutputTokens
    });
  });

  // ── Context State ────────────────────────────────────

  describe("getState", () => {
    it("should report isNearLimit when approaching threshold", () => {
      // 填充大量 messages 直到接近限制
      // maxContextTokens = 1000, threshold = 0.75, 所以 750+ tokens 觸發
      const longMsg = "x".repeat(3000); // 估算 ~750 tokens
      ctx.addMessage({ role: "user", content: longMsg });

      const state = ctx.getState();
      expect(state.isNearLimit).toBe(true);
    });

    it("should report not near limit when usage is low", () => {
      ctx.addMessage({ role: "user", content: "Hi" });
      const state = ctx.getState();
      expect(state.isNearLimit).toBe(false);
    });
  });

  // ── Truncation ───────────────────────────────────────

  describe("truncate", () => {
    it("should not truncate when within limits", () => {
      ctx.addMessage({ role: "user", content: "Short message" });
      const removed = ctx.truncate();
      expect(removed).toBe(0);
    });

    it("should remove oldest messages when over limit", () => {
      // 添加大量 messages 超過限制
      for (let i = 0; i < 20; i++) {
        ctx.addMessage({
          role: i % 2 === 0 ? "user" : "assistant",
          content: "A".repeat(200), // 每條 ~50 tokens
        });
      }

      const before = ctx.getMessages().length;
      const removed = ctx.truncate();
      const after = ctx.getMessages().length;

      expect(removed).toBeGreaterThan(0);
      expect(after).toBeLessThan(before);
      expect(ctx.getTotalTokens()).toBeLessThanOrEqual(1000);
    });

    it("should preserve the first user message", () => {
      const firstMsg = "This is my initial task description";
      ctx.addMessage({ role: "user", content: firstMsg });

      for (let i = 0; i < 30; i++) {
        ctx.addMessage({
          role: i % 2 === 0 ? "assistant" : "user",
          content: "B".repeat(200),
        });
      }

      ctx.truncate();
      const messages = ctx.getMessages();

      // 第一條 message 應該被保留
      expect(messages[0].role).toBe("user");
      expect(messages[0].content).toBe(firstMsg);
    });
  });

  // ── Summarization ────────────────────────────────────

  describe("summarize", () => {
    it("should not summarize when message count <= 4", async () => {
      ctx.addMessage({ role: "user", content: "Hello" });
      ctx.addMessage({ role: "assistant", content: "Hi!" });

      const mockClient = { createMessage: vi.fn() } as any;
      const saved = await ctx.summarize(mockClient);

      expect(saved).toBe(0);
      expect(mockClient.createMessage).not.toHaveBeenCalled();
    });

    it("should compress old messages into a summary", async () => {
      // 添加 8 條 messages
      for (let i = 0; i < 8; i++) {
        ctx.addMessage({
          role: i % 2 === 0 ? "user" : "assistant",
          content: `Message number ${i} with some content to make it longer`,
        });
      }

      const mockClient = {
        createMessage: vi.fn().mockResolvedValueOnce({
          id: "summary",
          content: [
            {
              type: "text",
              text: "Summary: User and assistant discussed 8 messages about various topics.",
            },
          ],
          model: "test",
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 20 },
        }),
      } as any;

      const beforeCount = ctx.getMessages().length;
      await ctx.summarize(mockClient);
      const afterCount = ctx.getMessages().length;

      // 壓縮後 messages 數量應該減少
      expect(afterCount).toBeLessThan(beforeCount);

      // 應該調用了 LLM 生成摘要
      expect(mockClient.createMessage).toHaveBeenCalledTimes(1);

      // 最近的 messages 應該被保留
      const messages = ctx.getMessages();
      const lastOriginal = `Message number 7 with some content to make it longer`;
      const hasRecentMessage = messages.some(
        (m) => typeof m.content === "string" && m.content === lastOriginal
      );
      expect(hasRecentMessage).toBe(true);
    });
  });

  // ── Auto Management ──────────────────────────────────

  describe("autoManage", () => {
    it("should return 'none' when not near limit", async () => {
      ctx.addMessage({ role: "user", content: "Short" });
      const mockClient = { createMessage: vi.fn() } as any;

      const result = await ctx.autoManage(mockClient);
      expect(result.action).toBe("none");
    });

    it("should truncate or summarize when near limit", async () => {
      // 填充到接近限制
      for (let i = 0; i < 30; i++) {
        ctx.addMessage({
          role: i % 2 === 0 ? "user" : "assistant",
          content: "C".repeat(200),
        });
      }

      const mockClient = {
        createMessage: vi.fn().mockResolvedValue({
          id: "s",
          content: [{ type: "text", text: "Summary of conversation." }],
          model: "test",
          stopReason: "end_turn",
          usage: { inputTokens: 50, outputTokens: 10 },
        }),
      } as any;

      const result = await ctx.autoManage(mockClient);
      expect(["truncated", "summarized"]).toContain(result.action);
      expect(result.tokensSaved).toBeGreaterThan(0);
    });
  });
});
