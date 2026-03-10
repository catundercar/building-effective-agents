/**
 * ═══════════════════════════════════════════════════════════════
 *  Lab 3: Context Window Manager
 * ═══════════════════════════════════════════════════════════════
 *
 *  你的任務是實現 Context Window 管理，防止 token 溢出。
 *  完成後運行 `npm run test:lab3` 驗證。
 *
 *  學習目標:
 *  - 理解 Context Window 的組成和限制
 *  - 實現 token 計數和估算
 *  - 實現截斷和摘要壓縮策略
 *
 *  背景知識:
 *  Claude 的 context window 有 200K tokens 的上限。
 *  每次 API 調用的 token 消耗 = system prompt + tools 定義 +
 *  所有歷史 messages + 預留的 max_tokens。
 *  當歷史 messages 太多時，需要截斷或壓縮。
 *
 * ═══════════════════════════════════════════════════════════════
 */

import type {
  Message,
  ToolDefinition,
  ContextManagerConfig,
  ContextState,
  LLMClientOptions,
} from "./types.js";
import { LLMClient } from "./client.js";

// ─── Default Config ──────────────────────────────────────────

const DEFAULT_CONFIG: ContextManagerConfig = {
  maxContextTokens: 200000,
  reservedOutputTokens: 4096,
  summarizationThreshold: 0.75, // 當使用超過 75% 時觸發
};

// ─── Context Manager ─────────────────────────────────────────

export class ContextManager {
  private config: ContextManagerConfig;
  private messages: Message[] = [];
  private systemPrompt: string = "";
  private tools: ToolDefinition[] = [];

  constructor(config?: Partial<ContextManagerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ─── Setup ───────────────────────────────────────────────

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  setTools(tools: ToolDefinition[]): void {
    this.tools = tools;
  }

  // ─── Message Management ──────────────────────────────────

  addMessage(message: Message): void {
    this.messages.push(message);
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
  }

  // ─── Token Estimation ────────────────────────────────────

  /**
   * 估算一段文本的 token 數
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 使用簡單的啟發式估算（不需要精確的 tokenizer）：
   * - 英文: 大約每 4 個字符 = 1 token
   * - 中文: 大約每 1.5 個字符 = 1 token
   * - 混合內容: 可以使用加權平均
   *
   * HINT: 一個簡單但合理的做法:
   *   1. 計算文本中的 ASCII 字符數 (asciiCount)
   *   2. 計算文本中的非 ASCII 字符數 (nonAsciiCount)
   *   3. tokens ≈ asciiCount / 4 + nonAsciiCount / 1.5
   *   4. 向上取整
   *
   * 注意: 這不需要完美精確，5-10% 的誤差是可接受的。
   */
  estimateTokens(text: string): number {
    // TODO: 實現 token 估算
    throw new Error("TODO: Implement estimateTokens");
  }

  /**
   * 估算單條 message 的 token 數
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 1. 如果 content 是 string，直接用 estimateTokens
   * 2. 如果 content 是 ContentBlock[]，累加每個 block 的 token:
   *    - TextBlock: 估算 text 字段
   *    - ToolUseBlock: 估算 name + JSON.stringify(input)
   *    - ToolResultBlock: 估算 content 字段
   * 3. 加上 message 的 overhead（role 等元數據，約 4 tokens）
   */
  estimateMessageTokens(message: Message): number {
    // TODO: 實現 message token 估算
    throw new Error("TODO: Implement estimateMessageTokens");
  }

  /**
   * 計算當前 context 的總 token 使用量
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 1. 計算 system prompt 的 tokens
   * 2. 計算所有 tool definitions 的 tokens
   *    (每個 tool: name + description + JSON.stringify(input_schema))
   * 3. 計算所有 messages 的 tokens
   * 4. 加上 reservedOutputTokens
   * 5. 返回總和
   */
  getTotalTokens(): number {
    // TODO: 計算所有組成部分的 token 總和
    throw new Error("TODO: Implement getTotalTokens");
  }

  // ─── Context State ───────────────────────────────────────

  /**
   * 獲取當前 context 狀態
   */
  getState(): ContextState {
    const totalTokens = this.getTotalTokens();
    return {
      messages: this.getMessages(),
      systemPrompt: this.systemPrompt,
      tools: this.tools,
      totalTokens,
      isNearLimit:
        totalTokens >
        this.config.maxContextTokens * this.config.summarizationThreshold,
    };
  }

  // ─── Truncation ──────────────────────────────────────────

  /**
   * 滑動窗口截斷：移除最早的 messages 直到 token 數在限制內
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 1. 如果當前 token 數未超限，不做任何操作
   * 2. 從最早的 message 開始移除（保留最新的）
   * 3. 但始終保留第一條 user message（任務描述）
   * 4. 移除直到 getTotalTokens() < maxContextTokens
   * 5. 返回被移除的 message 數量
   *
   * HINT: 注意不要移除成對的 assistant-user messages 中的一半
   *   如果一條 assistant message 包含 tool_use，那它後面的
   *   user message（包含 tool_result）也必須一起移除。
   */
  truncate(): number {
    // TODO: 實現滑動窗口截斷
    throw new Error("TODO: Implement truncate");
  }

  // ─── Summarization ───────────────────────────────────────

  /**
   * 將舊的 messages 壓縮為一條摘要
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 1. 如果 messages 數量 <= 4，不做操作（太少不值得壓縮）
   * 2. 選擇要壓縮的範圍：保留最近 4 條 messages，壓縮其餘
   * 3. 將要壓縮的 messages 格式化為一段文字
   * 4. 調用 LLM 生成摘要（使用簡短的 prompt）
   * 5. 用一條包含摘要的 user message 替換被壓縮的 messages
   *
   * HINT: 壓縮後 messages 應該變成:
   *   [
   *     { role: "user", content: "[Conversation Summary]\n{摘要}" },
   *     { role: "assistant", content: "I understand the context. Let me continue." },
   *     ...最近的 4 條 messages
   *   ]
   *
   * 注意: 摘要中應保留關鍵信息：任務目標、已完成的步驟、重要決策
   *
   * @param client LLM 客戶端，用於生成摘要
   * @returns 壓縮前後的 token 差異（正數表示節省了多少）
   */
  async summarize(client: LLMClient): Promise<number> {
    // TODO: 實現摘要壓縮
    throw new Error("TODO: Implement summarize");
  }

  // ─── Auto Management ─────────────────────────────────────

  /**
   * 自動管理 context：先嘗試截斷，不夠再摘要
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 1. 檢查 isNearLimit
   * 2. 如果接近限制，先嘗試 truncate()
   * 3. 如果截斷後仍然超限，調用 summarize(client)
   * 4. 返回操作類型和結果
   */
  async autoManage(
    client: LLMClient
  ): Promise<{
    action: "none" | "truncated" | "summarized";
    tokensSaved: number;
  }> {
    // TODO: 實現自動管理邏輯
    throw new Error("TODO: Implement autoManage");
  }
}
