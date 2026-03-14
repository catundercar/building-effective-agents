import { useState } from "react";

interface Props {
  color: string;
}

const ROUTES = [
  { name: "Explain Code", icon: "📖", keywords: ["explain", "what does", "how does"], model: "claude-3-haiku", confidence: 0.95 },
  { name: "Edit File", icon: "✏️", keywords: ["modify", "change", "fix", "update"], model: "claude-3-sonnet", confidence: 0.88 },
  { name: "Run Command", icon: "⚡", keywords: ["run", "execute", "test", "build"], model: "claude-3-sonnet", confidence: 0.92 },
  { name: "Chat", icon: "💬", keywords: ["hello", "thanks", "help"], model: "claude-3-haiku", confidence: 0.97 },
];

const TEST_INPUTS = [
  "Explain what the login function does",
  "Fix the bug in auth.py line 42",
  "Run the test suite",
  "Thanks for your help!",
];

export default function Phase2RouterViz({ color }: Props) {
  const [selectedInput, setSelectedInput] = useState<number | null>(null);

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
        Intent Router — Classify & Dispatch
      </div>

      <div style={{ padding: 16 }}>
        {/* Test inputs */}
        <div style={{
          fontSize: 10,
          color: "var(--text-dim)",
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          marginBottom: 8,
          fontWeight: 600,
        }}>
          Try an input
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {TEST_INPUTS.map((input, i) => (
            <button
              key={i}
              onClick={() => setSelectedInput(i)}
              style={{
                padding: "8px 12px",
                background: selectedInput === i ? `${color}08` : "var(--surface-card)",
                border: `1px solid ${selectedInput === i ? `${color}33` : "var(--border-faint)"}`,
                borderRadius: 6,
                color: selectedInput === i ? "var(--text)" : "var(--text-secondary)",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left" as const,
                transition: "all 0.2s",
              }}
            >
              "{input}"
            </button>
          ))}
        </div>

        {/* Routes */}
        <div style={{
          fontSize: 10,
          color: "var(--text-dim)",
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          marginBottom: 8,
          fontWeight: 600,
        }}>
          Routes
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {ROUTES.map((route, i) => {
            const isMatched = selectedInput === i;
            return (
              <div
                key={route.name}
                style={{
                  padding: "10px 12px",
                  background: isMatched ? `${color}12` : "var(--surface-card)",
                  border: `1px solid ${isMatched ? `${color}44` : "var(--border-faint)"}`,
                  borderRadius: 6,
                  transition: "all 0.3s",
                  transform: isMatched ? "scale(1.02)" : "scale(1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span>{route.icon}</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isMatched ? color : "var(--text)",
                  }}>
                    {route.name}
                  </span>
                </div>
                {isMatched && (
                  <div style={{ animation: "fadeIn 0.2s ease" }}>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 6 }}>
                      Model: <code style={{ color: color }}>{route.model}</code>
                    </div>
                    <div style={{
                      marginTop: 4,
                      height: 4,
                      borderRadius: 2,
                      background: "var(--border-faint)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${route.confidence * 100}%`,
                        height: "100%",
                        background: color,
                        borderRadius: 2,
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2, textAlign: "right" as const }}>
                      {(route.confidence * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
