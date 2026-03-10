/**
 * ═══════════════════════════════════════════════════════════════
 *  Lab 2: Tool System
 * ═══════════════════════════════════════════════════════════════
 *
 *  你的任務是實現 Tool 的註冊、發現和執行循環。
 *  完成後運行 `npm run test:lab2` 驗證。
 *
 *  學習目標:
 *  - 理解 Anthropic Tool Use 的 API 協議
 *  - 實現 Tool 的註冊和管理
 *  - 實現 LLM ↔ Tool 的交互循環
 *
 * ═══════════════════════════════════════════════════════════════
 */

import type {
  ToolDefinition,
  ToolHandler,
  Message,
  ContentBlock,
  ToolUseBlock,
  ToolResultBlock,
  LLMResponse,
} from "./types.js";
import { LLMClient } from "./client.js";

// ─── Tool Registry ───────────────────────────────────────────

export class ToolRegistry {
  private tools: Map<string, ToolHandler> = new Map();

  /**
   * 註冊一個工具
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 1. 驗證 handler 包含有效的 definition（name 非空、有 description）
   * 2. 驗證 name 唯一（不允許重複註冊）
   * 3. 驗證 input_schema 是一個合法的 object schema
   * 4. 通過驗證後存入 this.tools Map
   *
   * 出錯時拋出 Error 並附帶清晰的錯誤信息。
   */
  register(handler: ToolHandler): void {
    // TODO: 驗證 + 存儲
    throw new Error("TODO: Implement register");
  }

  /**
   * 取消註冊一個工具
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 1. 如果工具不存在，拋出 Error
   * 2. 存在則從 Map 中刪除
   */
  unregister(name: string): void {
    // TODO: 刪除
    throw new Error("TODO: Implement unregister");
  }

  /**
   * 獲取一個工具
   */
  get(name: string): ToolHandler | undefined {
    return this.tools.get(name);
  }

  /**
   * 列出所有工具的定義（傳給 LLM API 的格式）
   */
  listDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((h) => h.definition);
  }

  /**
   * 列出所有工具名稱
   */
  listNames(): string[] {
    return Array.from(this.tools.keys());
  }

  get size(): number {
    return this.tools.size;
  }
}

// ─── Tool Executor ───────────────────────────────────────────

export class ToolExecutor {
  constructor(private registry: ToolRegistry) {}

  /**
   * 執行一個 tool 調用
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 1. 從 registry 中找到對應的 tool handler
   * 2. 如果找不到，返回 ToolResultBlock 包含錯誤信息（is_error: true）
   * 3. 調用 handler.execute(input)
   * 4. 如果執行成功，返回 ToolResultBlock 包含結果
   * 5. 如果執行拋出異常，返回 ToolResultBlock 包含錯誤信息（is_error: true）
   *
   * HINT: ToolResultBlock 的結構：
   *   { type: "tool_result", tool_use_id: string, content: string, is_error?: boolean }
   */
  async execute(toolCall: ToolUseBlock): Promise<ToolResultBlock> {
    // TODO: 查找 tool → 執行 → 返回結果
    throw new Error("TODO: Implement execute");
  }

  /**
   * 批量執行多個 tool 調用
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 1. 從 LLMResponse 的 content 中篩選出所有 tool_use blocks
   * 2. 依次調用 this.execute() 執行每個 tool
   * 3. 返回所有 ToolResultBlock 的數組
   *
   * 注意: 按順序執行（不是並行），因為 tool 之間可能有依賴
   */
  async executeAll(response: LLMResponse): Promise<ToolResultBlock[]> {
    // TODO: 篩選 tool_use blocks → 依次執行
    throw new Error("TODO: Implement executeAll");
  }
}

// ─── Tool Use Loop ───────────────────────────────────────────

/**
 * Tool Use 循環：持續 LLM ↔ Tool 交互直到 LLM 停止調用工具
 *
 * TODO: 實現此函數
 *
 * 這是 Lab 2 的核心挑戰。你需要實現一個循環：
 *
 * 1. 將當前 messages 和 tool definitions 發送給 LLM
 * 2. 檢查 response 的 stopReason:
 *    - 如果是 "end_turn" → LLM 完成了，返回最終結果
 *    - 如果是 "tool_use" → LLM 想調用工具，繼續步驟 3
 *    - 如果是 "max_tokens" → 異常情況，可以拋錯或返回
 * 3. 執行 LLM 請求的所有 tool 調用
 * 4. 將 assistant message（包含 tool_use）和 tool results 加入 messages
 * 5. 回到步驟 1
 *
 * 安全機制:
 * - maxIterations 防止無限循環（默認 10）
 * - 超過最大迭代次數時拋出 Error
 *
 * HINT: messages 的構建方式
 *   每一輪循環後，messages 應該像這樣增長：
 *
 *   [...之前的 messages,
 *    { role: "assistant", content: response.content },     // LLM 的回應（含 tool_use）
 *    { role: "user", content: [toolResult1, toolResult2] } // Tool 的執行結果
 *   ]
 *
 * HINT: 為什麼 tool results 的 role 是 "user"？
 *   在 Anthropic API 中，tool 結果作為 user message 發回給 LLM。
 *   這是 API 的約定，不是直覺上的 "系統" 消息。
 *
 * @returns 最終的 LLMResponse（stopReason 為 "end_turn" 的那個）
 */
export async function toolUseLoop(
  client: LLMClient,
  executor: ToolExecutor,
  initialMessages: Message[],
  options: {
    systemPrompt?: string;
    tools: ToolDefinition[];
    maxIterations?: number;
    /** 每輪回調，用於日誌/UI */
    onIteration?: (iteration: number, response: LLMResponse) => void;
  }
): Promise<{ response: LLMResponse; messages: Message[] }> {
  const maxIterations = options.maxIterations ?? 10;

  // 你的工作：維護一個 messages 數組，在循環中不斷追加
  const messages: Message[] = [...initialMessages];

  // TODO: 實現 tool use 循環
  throw new Error("TODO: Implement toolUseLoop");
}
