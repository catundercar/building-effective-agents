import { useState } from "react";

interface Props {
  color: string;
}

const TASK_TREE = {
  name: "Refactor auth module",
  children: [
    {
      name: "Worker 1: Update models",
      files: ["models/user.py", "models/session.py"],
      status: "complete" as const,
    },
    {
      name: "Worker 2: Update API routes",
      files: ["routes/auth.py", "routes/middleware.py"],
      status: "complete" as const,
    },
    {
      name: "Worker 3: Update tests",
      files: ["tests/test_auth.py", "tests/test_session.py", "tests/conftest.py"],
      status: "running" as const,
    },
  ],
};

export default function Phase4OrchestratorViz({ color }: Props) {
  const [expandedWorker, setExpandedWorker] = useState<number | null>(null);

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
        Orchestrator-Workers — Task Decomposition
      </div>

      <div style={{ padding: 16 }}>
        {/* Orchestrator node */}
        <div style={{
          padding: "12px 16px",
          background: `${color}10`,
          border: `1px solid ${color}33`,
          borderRadius: 8,
          marginBottom: 4,
          textAlign: "center" as const,
        }}>
          <div style={{ fontSize: 10, color: color, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
            Orchestrator
          </div>
          <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, marginTop: 4 }}>
            {TASK_TREE.name}
          </div>
        </div>

        {/* Connector */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: 1, height: 20, background: `${color}44` }} />
        </div>

        {/* Workers */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TASK_TREE.children.map((worker, i) => {
            const isExpanded = expandedWorker === i;
            const statusColor = worker.status === "complete" ? "#10B981" : "#F59E0B";
            return (
              <button
                key={i}
                onClick={() => setExpandedWorker(isExpanded ? null : i)}
                style={{
                  flex: 1,
                  minWidth: 160,
                  padding: "10px 12px",
                  background: isExpanded ? `${statusColor}08` : "var(--surface-card)",
                  border: `1px solid ${isExpanded ? `${statusColor}33` : "var(--border-faint)"}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left" as const,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>
                    {worker.name}
                  </span>
                  <span style={{
                    fontSize: 9,
                    padding: "2px 6px",
                    borderRadius: 3,
                    background: `${statusColor}15`,
                    color: statusColor,
                    fontWeight: 600,
                    textTransform: "uppercase" as const,
                  }}>
                    {worker.status === "complete" ? "✓ Done" : "⟳ Running"}
                  </span>
                </div>
                {isExpanded && (
                  <div style={{ animation: "fadeIn 0.2s ease", marginTop: 8 }}>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 4, fontWeight: 600 }}>
                      Files:
                    </div>
                    {worker.files.map((file, j) => (
                      <div key={j} style={{
                        fontSize: 11,
                        color: "var(--text-secondary)",
                        padding: "2px 0",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        📁 {file}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Global validation */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 4,
        }}>
          <div style={{ width: 1, height: 16, background: "var(--border-subtle)" }} />
        </div>
        <div style={{
          padding: "8px 12px",
          background: "rgba(16,185,129,0.06)",
          border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 6,
          textAlign: "center" as const,
          fontSize: 11,
          color: "#10B981",
          fontWeight: 600,
        }}>
          Global Validation: Compile + Test
        </div>
      </div>
    </div>
  );
}
