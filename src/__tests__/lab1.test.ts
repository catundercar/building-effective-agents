/**
 * Lab 1 Tests: LLM Client
 *
 * 運行: npm run test:lab1
 *
 * 這些測試使用 mock 來避免真實 API 調用。
 * 你的實現需要通過所有測試。
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { LLMClient } from "../client.js";

// ─── Mock Anthropic SDK ──────────────────────────────────────

// 我們 mock 掉 Anthropic SDK，這樣測試不需要真實 API key
vi.mock("@anthropic-ai/sdk", () => {
  const mockCreate = vi.fn();
  const mockStream = vi.fn();

  return {
    default: class MockAnthropic {
      messages = {
        create: mockCreate,
        stream: mockStream,
      };
    },
    __mockCreate: mockCreate,
    __mockStream: mockStream,
  };
});

// 獲取 mock 函數的引用
async function getMocks() {
  const mod = await import("@anthropic-ai/sdk");
  return {
    mockCreate: (mod as any).__mockCreate as ReturnType<typeof vi.fn>,
    mockStream: (mod as any).__mockStream as ReturnType<typeof vi.fn>,
  };
}

// ─── Tests ───────────────────────────────────────────────────

describe("Lab 1: LLM Client", () => {
  let client: LLMClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new LLMClient("test-api-key");
  });

  // ── createMessage ──────────────────────────────────────

  describe("createMessage", () => {
    it("should send a basic message and return LLMResponse", async () => {
      const { mockCreate } = await getMocks();

      mockCreate.mockResolvedValueOnce({
        id: "msg_test_123",
        content: [{ type: "text", text: "Hello! How can I help?" }],
        model: "claude-sonnet-4-20250514",
        stop_reason: "end_turn",
        usage: { input_tokens: 10, output_tokens: 8 },
      });

      const response = await client.createMessage([
        { role: "user", content: "Hello" },
      ]);

      expect(response.id).toBe("msg_test_123");
      expect(response.content).toHaveLength(1);
      expect(response.content[0]).toEqual({
        type: "text",
        text: "Hello! How can I help?",
      });
      expect(response.stopReason).toBe("end_turn");
      expect(response.usage.inputTokens).toBe(10);
      expect(response.usage.outputTokens).toBe(8);
    });

    it("should pass system prompt and tools to the API", async () => {
      const { mockCreate } = await getMocks();

      mockCreate.mockResolvedValueOnce({
        id: "msg_test_456",
        content: [{ type: "text", text: "OK" }],
        model: "claude-sonnet-4-20250514",
        stop_reason: "end_turn",
        usage: { input_tokens: 20, output_tokens: 2 },
      });

      await client.createMessage(
        [{ role: "user", content: "What's the weather?" }],
        {
          systemPrompt: "You are a helpful assistant.",
          tools: [
            {
              name: "get_weather",
              description: "Get weather",
              input_schema: {
                type: "object",
                properties: {
                  city: { type: "string", description: "City name" },
                },
                required: ["city"],
              },
            },
          ],
        }
      );

      // 驗證 API 調用參數
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.system).toBe("You are a helpful assistant.");
      expect(callArgs.tools).toHaveLength(1);
      expect(callArgs.tools[0].name).toBe("get_weather");
    });

    it("should correctly map tool_use responses", async () => {
      const { mockCreate } = await getMocks();

      mockCreate.mockResolvedValueOnce({
        id: "msg_tool",
        content: [
          {
            type: "tool_use",
            id: "toolu_123",
            name: "get_weather",
            input: { city: "Tokyo" },
          },
        ],
        model: "claude-sonnet-4-20250514",
        stop_reason: "tool_use",
        usage: { input_tokens: 30, output_tokens: 15 },
      });

      const response = await client.createMessage([
        { role: "user", content: "What's the weather in Tokyo?" },
      ]);

      expect(response.stopReason).toBe("tool_use");
      expect(response.content[0]).toEqual({
        type: "tool_use",
        id: "toolu_123",
        name: "get_weather",
        input: { city: "Tokyo" },
      });
    });
  });

  // ── callWithRetry ──────────────────────────────────────

  describe("retry mechanism", () => {
    it("should retry on 429 (rate limit) errors", async () => {
      const { mockCreate } = await getMocks();

      // 前兩次返回 429，第三次成功
      const rateLimitError = new Error("Rate limited") as any;
      rateLimitError.status = 429;

      mockCreate
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          id: "msg_retry",
          content: [{ type: "text", text: "Success!" }],
          model: "claude-sonnet-4-20250514",
          stop_reason: "end_turn",
          usage: { input_tokens: 10, output_tokens: 5 },
        });

      // 使用短延遲的配置加速測試
      const fastClient = new LLMClient("test-key", {
        maxRetries: 3,
        baseDelayMs: 10,
        maxDelayMs: 50,
      });

      const response = await fastClient.createMessage([
        { role: "user", content: "Hello" },
      ]);

      expect(response.content[0]).toEqual({
        type: "text",
        text: "Success!",
      });
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it("should NOT retry on 400 (bad request) errors", async () => {
      const { mockCreate } = await getMocks();

      const badRequestError = new Error("Bad request") as any;
      badRequestError.status = 400;

      mockCreate.mockRejectedValueOnce(badRequestError);

      const fastClient = new LLMClient("test-key", {
        baseDelayMs: 10,
      });

      await expect(
        fastClient.createMessage([{ role: "user", content: "Hello" }])
      ).rejects.toThrow("Bad request");

      // 不應重試
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it("should throw after exceeding max retries", async () => {
      const { mockCreate } = await getMocks();

      const serverError = new Error("Server error") as any;
      serverError.status = 500;

      mockCreate.mockRejectedValue(serverError);

      const fastClient = new LLMClient("test-key", {
        maxRetries: 2,
        baseDelayMs: 10,
        maxDelayMs: 20,
      });

      await expect(
        fastClient.createMessage([{ role: "user", content: "Hello" }])
      ).rejects.toThrow("Server error");

      // 初始調用 + 2 次重試 = 3 次
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });
  });

  // ── streaming ──────────────────────────────────────────

  describe("createStreamingMessage", () => {
    it("should yield text delta events", async () => {
      const { mockStream } = await getMocks();

      // 模擬 stream 返回
      const mockStreamObj = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            type: "content_block_start",
            index: 0,
            content_block: { type: "text", text: "" },
          };
          yield {
            type: "content_block_delta",
            index: 0,
            delta: { type: "text_delta", text: "Hello" },
          };
          yield {
            type: "content_block_delta",
            index: 0,
            delta: { type: "text_delta", text: " world" },
          };
          yield { type: "message_stop" };
        },
        finalMessage: async () => ({
          id: "msg_stream",
          content: [{ type: "text", text: "Hello world" }],
          model: "claude-sonnet-4-20250514",
          stop_reason: "end_turn",
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      };

      mockStream.mockReturnValueOnce(mockStreamObj);

      const events: any[] = [];
      for await (const event of client.createStreamingMessage([
        { role: "user", content: "Hi" },
      ])) {
        events.push(event);
      }

      // 應該有 text delta 事件
      const textDeltas = events.filter((e) => e.type === "text_delta");
      expect(textDeltas.length).toBeGreaterThanOrEqual(2);
      expect(textDeltas[0].text).toBe("Hello");
      expect(textDeltas[1].text).toBe(" world");

      // 最後應該有 message_complete 事件
      const complete = events.find((e) => e.type === "message_complete");
      expect(complete).toBeDefined();
      expect(complete.response.id).toBe("msg_stream");
    });
  });
});
