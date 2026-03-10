/**
 * ═══════════════════════════════════════════════════════════════
 *  Phase 0 · Type Definitions
 *  這些類型定義是你整個 Lab 的基石，請先仔細閱讀每個類型的含義。
 * ═══════════════════════════════════════════════════════════════
 */

// ─── LLM Client Types ────────────────────────────────────────

/** 一條消息 */
export interface Message {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

/** 內容塊：可以是文字、工具調用、或工具結果 */
export type ContentBlock =
  | TextBlock
  | ToolUseBlock
  | ToolResultBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

/** API 調用選項 */
export interface LLMClientOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  tools?: ToolDefinition[];
}

/** API 響應 */
export interface LLMResponse {
  id: string;
  content: ContentBlock[];
  model: string;
  stopReason: "end_turn" | "tool_use" | "max_tokens";
  usage: TokenUsage;
}

/** Token 使用量 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/** Streaming 事件 */
export type StreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_use_start"; id: string; name: string }
  | { type: "tool_use_delta"; input: string }
  | { type: "message_complete"; response: LLMResponse }
  | { type: "error"; error: Error };

// ─── Tool System Types ───────────────────────────────────────

/** 工具定義（傳給 API 的格式） */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: JSONSchema;
}

/** JSON Schema 子集 */
export interface JSONSchema {
  type: "object";
  properties: Record<string, {
    type: string;
    description: string;
    enum?: string[];
  }>;
  required?: string[];
}

/** 工具處理器 */
export interface ToolHandler {
  definition: ToolDefinition;
  execute: (input: Record<string, unknown>) => Promise<string>;
}

// ─── Context Management Types ────────────────────────────────

/** Context Window 管理配置 */
export interface ContextManagerConfig {
  maxContextTokens: number;       // context window 上限（如 200000）
  reservedOutputTokens: number;   // 為輸出預留的 token 數
  summarizationThreshold: number; // 觸發摘要的閾值（0-1 比例）
}

/** Context 狀態 */
export interface ContextState {
  messages: Message[];
  systemPrompt: string;
  tools: ToolDefinition[];
  totalTokens: number;
  isNearLimit: boolean;
}

// ─── Retry Types ─────────────────────────────────────────────

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatusCodes: number[];
}
