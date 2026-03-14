import { useState } from "react";

interface Props {
  color: string;
}

const TOOLS = [
  { name: "read_file", desc: "Read file contents with line numbers", schema: '{ "path": "string", "lines?": "number" }' },
  { name: "write_file", desc: "Create or overwrite a file", schema: '{ "path": "string", "content": "string" }' },
  { name: "search_files", desc: "Search file contents with regex", schema: '{ "pattern": "string", "glob?": "string" }' },
  { name: "run_command", desc: "Execute a shell command", schema: '{ "command": "string", "timeout?": "number" }' },
];

const LIFECYCLE = ["Define", "Register", "Discover", "Validate", "Execute"];

export default function Phase1RegistryViz({ color }: Props) {
  const [selectedTool, setSelectedTool] = useState<number | null>(null);
  const [activePhase, setActivePhase] = useState<number | null>(null);

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
        Tool Registry — Lifecycle & Registration
      </div>

      <div style={{ padding: 16 }}>
        {/* Lifecycle bar */}
        <div style={{
          display: "flex",
          gap: 2,
          marginBottom: 20,
        }}>
          {LIFECYCLE.map((phase, i) => (
            <button
              key={phase}
              onClick={() => setActivePhase(activePhase === i ? null : i)}
              style={{
                flex: 1,
                padding: "8px 4px",
                background: activePhase === i ? `${color}18` : "var(--surface-card)",
                border: `1px solid ${activePhase === i ? `${color}44` : "var(--border-faint)"}`,
                borderRadius: 4,
                color: activePhase === i ? color : "var(--text-dim)",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
                letterSpacing: "0.05em",
                textTransform: "uppercase" as const,
              }}
            >
              {i + 1}. {phase}
            </button>
          ))}
        </div>

        {/* Tool cards */}
        <div style={{
          fontSize: 10,
          color: "var(--text-dim)",
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          marginBottom: 8,
          fontWeight: 600,
        }}>
          Registered Tools
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {TOOLS.map((tool, i) => (
            <button
              key={tool.name}
              onClick={() => setSelectedTool(selectedTool === i ? null : i)}
              style={{
                padding: "10px 12px",
                background: selectedTool === i ? `${color}08` : "var(--surface-card)",
                border: `1px solid ${selectedTool === i ? `${color}33` : "var(--border-faint)"}`,
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left" as const,
                transition: "all 0.2s",
              }}
            >
              <code style={{
                fontSize: 12,
                color: selectedTool === i ? color : "var(--text)",
                fontWeight: 600,
              }}>
                {tool.name}
              </code>
              <div style={{
                fontSize: 11,
                color: "var(--text-dim)",
                marginTop: 4,
              }}>
                {tool.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Selected tool schema */}
        {selectedTool !== null && (
          <div style={{
            marginTop: 12,
            padding: "10px 14px",
            background: "var(--code-bg)",
            border: "1px solid var(--border-faint)",
            borderRadius: 6,
            animation: "fadeIn 0.2s ease",
          }}>
            <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 6, fontWeight: 600 }}>
              input_schema (JSON Schema)
            </div>
            <pre style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              margin: 0,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {TOOLS[selectedTool].schema}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
