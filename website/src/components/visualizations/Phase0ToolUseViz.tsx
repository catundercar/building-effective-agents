import { useState } from "react";

interface Props {
  color: string;
}

const MESSAGES = [
  { role: "user", label: "1. User Message", content: "What's the weather in Tokyo?", color: "#3B82F6" },
  { role: "assistant", label: "2. Assistant → tool_use", content: 'tool_use: get_weather\n{ "city": "Tokyo" }', color: "#7C3AED" },
  { role: "tool", label: "3. Tool Result", content: '{ "temp": "22°C", "condition": "Sunny" }', color: "#10B981" },
  { role: "assistant", label: "4. Assistant → end_turn", content: "The weather in Tokyo is 22°C and sunny!", color: "#F59E0B" },
];

export default function Phase0ToolUseViz({ color }: Props) {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div style={{
      borderRadius: 8,
      border: "1px solid var(--border-subtle)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--border-faint)",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text)",
      }}>
        Tool Use Message Sequence
      </div>

      <div style={{ padding: 16 }}>
        {/* Flow diagram */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 16,
          flexWrap: "wrap",
        }}>
          {MESSAGES.map((msg, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{
                  padding: "6px 12px",
                  background: activeStep === i ? `${msg.color}18` : "var(--surface-card)",
                  border: `1px solid ${activeStep === i ? `${msg.color}44` : "var(--border-subtle)"}`,
                  borderRadius: 6,
                  color: activeStep === i ? msg.color : "var(--text-secondary)",
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: activeStep === i ? 600 : 400,
                  transition: "all 0.2s",
                }}
              >
                {msg.role}
              </button>
              {i < MESSAGES.length - 1 && (
                <span style={{ color: "var(--text-dim)", fontSize: 12 }}>→</span>
              )}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {activeStep !== null && (
          <div style={{
            padding: "12px 16px",
            background: `${MESSAGES[activeStep].color}06`,
            borderLeft: `3px solid ${MESSAGES[activeStep].color}66`,
            borderRadius: "0 6px 6px 0",
            animation: "fadeIn 0.2s ease",
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: MESSAGES[activeStep].color,
              marginBottom: 8,
            }}>
              {MESSAGES[activeStep].label}
            </div>
            <pre style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              margin: 0,
              whiteSpace: "pre-wrap",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {MESSAGES[activeStep].content}
            </pre>
          </div>
        )}

        {activeStep === null && (
          <div style={{
            padding: 16,
            textAlign: "center",
            color: "var(--text-dim)",
            fontSize: 12,
          }}>
            Click a step to see message details
          </div>
        )}
      </div>
    </div>
  );
}
