/**
 * Lab 2 Tests: Tool System
 *
 * 運行: npm run test:lab2
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToolRegistry, ToolExecutor, toolUseLoop } from "../tools.js";
import type { ToolHandler, ToolUseBlock, LLMResponse } from "../types.js";

// ─── Test Fixtures ───────────────────────────────────────────

function createMockTool(name: string, result: string): ToolHandler {
  return {
    definition: {
      name,
      description: `A mock tool called ${name}`,
      input_schema: {
        type: "object",
        properties: {
          input: { type: "string", description: "Input value" },
        },
        required: ["input"],
      },
    },
    execute: vi.fn().mockResolvedValue(result),
  };
}

// ─── Registry Tests ──────────────────────────────────────────

describe("Lab 2: ToolRegistry", () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it("should register and retrieve a tool", () => {
    const tool = createMockTool("test_tool", "result");
    registry.register(tool);

    expect(registry.size).toBe(1);
    expect(registry.get("test_tool")).toBe(tool);
    expect(registry.listNames()).toContain("test_tool");
  });

  it("should reject duplicate tool names", () => {
    const tool1 = createMockTool("my_tool", "r1");
    const tool2 = createMockTool("my_tool", "r2");

    registry.register(tool1);
    expect(() => registry.register(tool2)).toThrow();
  });

  it("should reject tools without a name", () => {
    const tool: ToolHandler = {
      definition: {
        name: "",
        description: "No name",
        input_schema: { type: "object", properties: {} },
      },
      execute: async () => "nope",
    };
    expect(() => registry.register(tool)).toThrow();
  });

  it("should reject tools without a description", () => {
    const tool: ToolHandler = {
      definition: {
        name: "bad_tool",
        description: "",
        input_schema: { type: "object", properties: {} },
      },
      execute: async () => "nope",
    };
    expect(() => registry.register(tool)).toThrow();
  });

  it("should unregister a tool", () => {
    const tool = createMockTool("removable", "bye");
    registry.register(tool);
    expect(registry.size).toBe(1);

    registry.unregister("removable");
    expect(registry.size).toBe(0);
    expect(registry.get("removable")).toBeUndefined();
  });

  it("should throw when unregistering non-existent tool", () => {
    expect(() => registry.unregister("ghost")).toThrow();
  });

  it("should list all tool definitions", () => {
    registry.register(createMockTool("tool_a", "a"));
    registry.register(createMockTool("tool_b", "b"));

    const defs = registry.listDefinitions();
    expect(defs).toHaveLength(2);
    expect(defs.map((d) => d.name)).toEqual(
      expect.arrayContaining(["tool_a", "tool_b"])
    );
  });
});

// ─── Executor Tests ──────────────────────────────────────────

describe("Lab 2: ToolExecutor", () => {
  let registry: ToolRegistry;
  let executor: ToolExecutor;

  beforeEach(() => {
    registry = new ToolRegistry();
    executor = new ToolExecutor(registry);
  });

  it("should execute a tool and return result", async () => {
    registry.register(createMockTool("greet", "Hello, World!"));

    const result = await executor.execute({
      type: "tool_use",
      id: "call_1",
      name: "greet",
      input: { input: "World" },
    });

    expect(result.type).toBe("tool_result");
    expect(result.tool_use_id).toBe("call_1");
    expect(result.content).toBe("Hello, World!");
    expect(result.is_error).toBeFalsy();
  });

  it("should return error for unknown tool", async () => {
    const result = await executor.execute({
      type: "tool_use",
      id: "call_2",
      name: "nonexistent",
      input: {},
    });

    expect(result.is_error).toBe(true);
    expect(result.content).toContain("nonexistent");
  });

  it("should catch and return tool execution errors", async () => {
    const failingTool: ToolHandler = {
      definition: {
        name: "fail_tool",
        description: "A tool that always fails",
        input_schema: { type: "object", properties: {} },
      },
      execute: async () => {
        throw new Error("Something went wrong");
      },
    };
    registry.register(failingTool);

    const result = await executor.execute({
      type: "tool_use",
      id: "call_3",
      name: "fail_tool",
      input: {},
    });

    expect(result.is_error).toBe(true);
    expect(result.content).toContain("Something went wrong");
  });

  it("should execute all tool calls from a response", async () => {
    registry.register(createMockTool("tool_a", "result_a"));
    registry.register(createMockTool("tool_b", "result_b"));

    const response: LLMResponse = {
      id: "msg_1",
      content: [
        { type: "text", text: "Let me call some tools." },
        { type: "tool_use", id: "c1", name: "tool_a", input: { input: "a" } },
        { type: "tool_use", id: "c2", name: "tool_b", input: { input: "b" } },
      ],
      model: "test",
      stopReason: "tool_use",
      usage: { inputTokens: 0, outputTokens: 0 },
    };

    const results = await executor.executeAll(response);

    expect(results).toHaveLength(2);
    expect(results[0].tool_use_id).toBe("c1");
    expect(results[0].content).toBe("result_a");
    expect(results[1].tool_use_id).toBe("c2");
    expect(results[1].content).toBe("result_b");
  });
});

// ─── Tool Use Loop Tests ─────────────────────────────────────

describe("Lab 2: toolUseLoop", () => {
  it("should complete immediately if LLM returns end_turn", async () => {
    const registry = new ToolRegistry();
    const executor = new ToolExecutor(registry);

    // Mock client that returns end_turn immediately
    const mockClient = {
      createMessage: vi.fn().mockResolvedValueOnce({
        id: "msg_done",
        content: [{ type: "text", text: "All done!" }],
        model: "test",
        stopReason: "end_turn",
        usage: { inputTokens: 10, outputTokens: 5 },
      }),
    } as any;

    const result = await toolUseLoop(mockClient, executor, [
      { role: "user", content: "Do something" },
    ], { tools: [] });

    expect(result.response.stopReason).toBe("end_turn");
    expect(mockClient.createMessage).toHaveBeenCalledTimes(1);
  });

  it("should loop through tool calls until end_turn", async () => {
    const registry = new ToolRegistry();
    registry.register(createMockTool("calculator", "42"));
    const executor = new ToolExecutor(registry);

    const mockClient = {
      createMessage: vi
        .fn()
        // 第一輪: LLM 要調用 tool
        .mockResolvedValueOnce({
          id: "msg_1",
          content: [
            { type: "tool_use", id: "c1", name: "calculator", input: { input: "6*7" } },
          ],
          model: "test",
          stopReason: "tool_use",
          usage: { inputTokens: 10, outputTokens: 10 },
        })
        // 第二輪: LLM 看到結果，給出最終回答
        .mockResolvedValueOnce({
          id: "msg_2",
          content: [{ type: "text", text: "The answer is 42." }],
          model: "test",
          stopReason: "end_turn",
          usage: { inputTokens: 20, outputTokens: 10 },
        }),
    } as any;

    const result = await toolUseLoop(mockClient, executor, [
      { role: "user", content: "What is 6 * 7?" },
    ], { tools: registry.listDefinitions() });

    expect(result.response.stopReason).toBe("end_turn");
    expect(mockClient.createMessage).toHaveBeenCalledTimes(2);

    // messages 應該包含完整的對話歷史
    expect(result.messages.length).toBeGreaterThanOrEqual(3);
  });

  it("should throw when exceeding max iterations", async () => {
    const registry = new ToolRegistry();
    registry.register(createMockTool("loop_tool", "still going"));
    const executor = new ToolExecutor(registry);

    // LLM 永遠返回 tool_use
    const mockClient = {
      createMessage: vi.fn().mockResolvedValue({
        id: "msg_loop",
        content: [
          { type: "tool_use", id: "c1", name: "loop_tool", input: { input: "x" } },
        ],
        model: "test",
        stopReason: "tool_use",
        usage: { inputTokens: 10, outputTokens: 10 },
      }),
    } as any;

    await expect(
      toolUseLoop(mockClient, executor, [
        { role: "user", content: "Loop forever" },
      ], { tools: registry.listDefinitions(), maxIterations: 3 })
    ).rejects.toThrow();

    // 不應超過 maxIterations 次調用
    expect(mockClient.createMessage.mock.calls.length).toBeLessThanOrEqual(3);
  });
});
