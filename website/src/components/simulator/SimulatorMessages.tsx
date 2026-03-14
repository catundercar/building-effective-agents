import type { SimulatorMessage } from "./types";

interface SimulatorMessagesProps {
  messages: SimulatorMessage[];
  color: string;
  prevMessageCount: number;
}

export default function SimulatorMessages({ messages, color, prevMessageCount }: SimulatorMessagesProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 8,
      maxHeight: 420,
      overflowY: "auto",
      padding: "12px 0",
    }}>
      {/* Header */}
      <div style={{
        fontSize: 10,
        color: "var(--text-dim)",
        letterSpacing: "0.12em",
        textTransform: "uppercase" as const,
        fontWeight: 600,
        padding: "0 4px",
        marginBottom: 4,
      }}>
        messages[] · {messages.length} items
      </div>

      {messages.map((msg, i) => {
        const isNew = i >= prevMessageCount;
        return (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              fontSize: 12,
              lineHeight: 1.7,
              animation: isNew ? "fadeIn 0.3s ease" : undefined,
              ...getMessageStyle(msg, color),
            }}
          >
            {/* Role badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}>
              <span style={{
                padding: "2px 6px",
                borderRadius: 3,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase" as const,
                ...getRoleBadgeStyle(msg, color),
              }}>
                {getRoleLabel(msg)}
              </span>
              {msg.toolName && (
                <code style={{
                  fontSize: 11,
                  color: color,
                  background: `${color}15`,
                  padding: "1px 6px",
                  borderRadius: 3,
                }}>
                  {msg.toolName}
                </code>
              )}
            </div>

            {/* Content */}
            {msg.toolInput ? (
              <pre style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                background: "var(--code-bg)",
                border: "1px solid var(--border-faint)",
                borderRadius: 4,
                padding: "8px 12px",
                margin: 0,
                overflowX: "auto",
                whiteSpace: "pre",
                fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
              }}>
                {msg.toolInput}
              </pre>
            ) : (
              <div style={{
                color: msg.isThinking ? "var(--text-dim)" : "var(--text-secondary)",
                fontStyle: msg.isThinking ? "italic" : "normal",
              }}>
                {msg.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getRoleLabel(msg: SimulatorMessage): string {
  if (msg.role === "user") return "user";
  if (msg.role === "tool_result") return "tool_result";
  if (msg.toolName) return "tool_use";
  if (msg.isThinking) return "thinking";
  return "assistant";
}

function getMessageStyle(msg: SimulatorMessage, color: string): React.CSSProperties {
  if (msg.role === "user") {
    return {
      background: "rgba(37,99,235,0.06)",
      borderLeft: "3px solid rgba(37,99,235,0.4)",
    };
  }
  if (msg.role === "tool_result") {
    return {
      background: "rgba(5,150,105,0.06)",
      borderLeft: "3px solid rgba(5,150,105,0.4)",
    };
  }
  if (msg.toolName) {
    return {
      background: `${color}08`,
      borderLeft: `3px solid ${color}66`,
    };
  }
  if (msg.isThinking) {
    return {
      background: "var(--surface-card)",
      borderLeft: "3px solid var(--border-subtle)",
    };
  }
  return {
    background: "var(--surface-card)",
    borderLeft: `3px solid ${color}44`,
  };
}

function getRoleBadgeStyle(msg: SimulatorMessage, color: string): React.CSSProperties {
  if (msg.role === "user") {
    return { background: "rgba(37,99,235,0.15)", color: "#3B82F6" };
  }
  if (msg.role === "tool_result") {
    return { background: "rgba(5,150,105,0.15)", color: "#10B981" };
  }
  if (msg.toolName) {
    return { background: `${color}18`, color };
  }
  return { background: "var(--surface)", color: "var(--text-dim)" };
}
