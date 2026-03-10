/**
 * ═══════════════════════════════════════════════════════════════
 *  Lab 1: LLM API Client
 * ═══════════════════════════════════════════════════════════════
 *
 *  你的任務是實現一個健壯的 Claude API 客戶端。
 *  完成後運行 `npm run test:lab1` 驗證。
 *
 *  學習目標:
 *  - 理解 Anthropic Messages API 的請求/響應結構
 *  - 實現 streaming 和 non-streaming 兩種調用方式
 *  - 實現帶指數退避的錯誤重試機制
 *
 *  提示:
 *  - 閱讀 types.ts 了解所有類型定義
 *  - 標記為 TODO 的地方是你需要實現的核心邏輯
 *  - 標記為 HINT 的地方有實現提示
 *  - 不要修改函數簽名和已有的結構代碼
 *
 * ═══════════════════════════════════════════════════════════════
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  Message,
  ContentBlock,
  LLMClientOptions,
  LLMResponse,
  StreamEvent,
  ToolDefinition,
  RetryConfig,
} from "./types.js";

// ─── Default Configuration ───────────────────────────────────

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 4096;

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatusCodes: [429, 500, 502, 503, 529],
};

// ─── LLM Client Class ───────────────────────────────────────

export class LLMClient {
  private client: Anthropic;
  private retryConfig: RetryConfig;

  constructor(apiKey?: string, retryConfig?: Partial<RetryConfig>) {
    // Anthropic SDK 會自動讀取 ANTHROPIC_API_KEY 環境變量
    this.client = new Anthropic({ apiKey });
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * 非 streaming 方式調用 LLM
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 1. 使用 this.client.messages.create() 發送請求
   * 2. 將 Anthropic SDK 的響應轉換為我們的 LLMResponse 格式
   * 3. 使用 this.callWithRetry() 包裝調用以支持重試
   *
   * HINT: Anthropic SDK 的 create() 方法接受的參數格式：
   *   {
   *     model: string,
   *     max_tokens: number,
   *     system?: string,
   *     messages: Array<{ role: string, content: string | Array }>,
   *     tools?: Array<ToolDefinition>,
   *     temperature?: number
   *   }
   *
   * HINT: SDK 響應的結構：
   *   {
   *     id: string,
   *     content: Array<{ type: "text", text: string } | { type: "tool_use", ... }>,
   *     model: string,
   *     stop_reason: "end_turn" | "tool_use" | "max_tokens",
   *     usage: { input_tokens: number, output_tokens: number }
   *   }
   */
  async createMessage(
    messages: Message[],
    options: LLMClientOptions = {}
  ): Promise<LLMResponse> {
    // TODO: 實現非 streaming API 調用
    // 步驟 1: 構建請求參數
    // 步驟 2: 用 callWithRetry 包裝 this.client.messages.create()
    // 步驟 3: 將 SDK 響應轉換為 LLMResponse 格式

    throw new Error("TODO: Implement createMessage");
  }

  /**
   * Streaming 方式調用 LLM
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 1. 使用 this.client.messages.stream() 創建 streaming 連接
   * 2. 用 async generator 逐步 yield StreamEvent
   * 3. 處理所有事件類型：text delta、tool_use、message complete
   *
   * HINT: Anthropic SDK 的 stream() 方法返回一個可迭代對象
   *   const stream = this.client.messages.stream({...});
   *   for await (const event of stream) { ... }
   *
   * HINT: stream 事件類型包括:
   *   - "content_block_start": 新的內容塊開始
   *   - "content_block_delta": 內容增量（文字或工具輸入）
   *   - "message_stop": 消息結束
   *
   * HINT: stream.finalMessage() 可以獲取完整的最終消息
   */
  async *createStreamingMessage(
    messages: Message[],
    options: LLMClientOptions = {}
  ): AsyncGenerator<StreamEvent> {
    // TODO: 實現 streaming API 調用
    // 步驟 1: 構建請求參數（同 createMessage）
    // 步驟 2: 調用 this.client.messages.stream()
    // 步驟 3: 遍歷 stream events，轉換為 StreamEvent 並 yield
    // 步驟 4: 最後 yield 一個 message_complete 事件

    throw new Error("TODO: Implement createStreamingMessage");
  }

  /**
   * 帶指數退避的重試機制
   *
   * TODO: 實現此方法
   *
   * 要求:
   * 1. 嘗試執行 fn()
   * 2. 如果失敗且錯誤是可重試的，等待後重試
   * 3. 等待時間使用指數退避: delay = baseDelay * 2^attempt
   * 4. 加入 jitter（隨機抖動）避免雷鳥效應
   * 5. 超過最大重試次數後拋出最後一個錯誤
   *
   * HINT: 判斷是否可重試：
   *   - 檢查 error.status 是否在 retryableStatusCodes 中
   *   - 如果 error 沒有 status 屬性，視為不可重試
   *
   * HINT: 指數退避公式：
   *   delay = min(baseDelay * 2^attempt, maxDelay)
   *   jitteredDelay = delay * (0.5 + Math.random() * 0.5)
   */
  private async callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    // TODO: 實現指數退避重試
    // 步驟 1: 在循環中嘗試調用 fn()
    // 步驟 2: 捕獲錯誤，判斷是否可重試
    // 步驟 3: 計算退避延遲（帶 jitter）
    // 步驟 4: await sleep(delay) 後繼續循環
    // 步驟 5: 超過最大次數時拋出錯誤

    throw new Error("TODO: Implement callWithRetry");
  }

  // ─── Helper: 構建 API 請求參數 ─────────────────────────────
  // 這個方法已經為你實現好了，供 createMessage 和
  // createStreamingMessage 使用。

  private buildRequestParams(
    messages: Message[],
    options: LLMClientOptions
  ) {
    const params: Record<string, unknown> = {
      model: options.model ?? DEFAULT_MODEL,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    if (options.systemPrompt) {
      params.system = options.systemPrompt;
    }
    if (options.tools && options.tools.length > 0) {
      params.tools = options.tools;
    }
    if (options.temperature !== undefined) {
      params.temperature = options.temperature;
    }

    return params;
  }

  // ─── Helper: 轉換 SDK 響應為 LLMResponse ──────────────────
  // 這個方法也已經為你實現好了。

  private mapResponse(raw: Anthropic.Message): LLMResponse {
    return {
      id: raw.id,
      content: raw.content.map((block): ContentBlock => {
        if (block.type === "text") {
          return { type: "text", text: block.text };
        }
        if (block.type === "tool_use") {
          return {
            type: "tool_use",
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          };
        }
        // 不應到達這裡，但提供 fallback
        return { type: "text", text: JSON.stringify(block) };
      }),
      model: raw.model,
      stopReason: raw.stop_reason as LLMResponse["stopReason"],
      usage: {
        inputTokens: raw.usage.input_tokens,
        outputTokens: raw.usage.output_tokens,
      },
    };
  }
}

// ─── Utility ─────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
