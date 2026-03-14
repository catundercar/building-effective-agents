import { useState } from "react";

interface Props {
  color: string;
}

const LAYERS = [
  {
    name: "CLI Interface",
    components: ["Terminal UI", "Input Handler", "Theme Engine", "Config Loader"],
    color: "#DC2626",
  },
  {
    name: "Agent Core",
    components: ["Agent Loop", "Planner", "Permission System", "Session Manager"],
    color: "#7C3AED",
  },
  {
    name: "Workflow Engine",
    components: ["Chain Runner", "Router", "Evaluator", "Tracer"],
    color: "#059669",
  },
  {
    name: "Tool System",
    components: ["Registry", "File Tools", "Shell Executor", "MCP Client"],
    color: "#D97706",
  },
  {
    name: "LLM Core",
    components: ["API Client", "Streaming", "Context Manager", "Token Counter"],
    color: "#E8453C",
  },
];

export default function Phase5CLIViz({ color }: Props) {
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);

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
        Final Architecture — 5-Layer Stack
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {LAYERS.map((layer, i) => {
            const isSelected = selectedLayer === i;
            const dimmed = selectedLayer !== null && !isSelected;
            return (
              <button
                key={layer.name}
                onClick={() => setSelectedLayer(isSelected ? null : i)}
                style={{
                  padding: "10px 14px",
                  background: isSelected ? `${layer.color}10` : "var(--surface-card)",
                  border: `1px solid ${isSelected ? `${layer.color}33` : "var(--border-faint)"}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left" as const,
                  transition: "all 0.2s",
                  opacity: dimmed ? 0.4 : 1,
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: layer.color,
                      padding: "2px 6px",
                      background: `${layer.color}15`,
                      borderRadius: 3,
                    }}>
                      L{LAYERS.length - i}
                    </span>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isSelected ? layer.color : "var(--text)",
                    }}>
                      {layer.name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 10,
                    color: "var(--text-dim)",
                  }}>
                    Phase {LAYERS.length - 1 - i}
                  </span>
                </div>

                {isSelected && (
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 10,
                    animation: "fadeIn 0.2s ease",
                  }}>
                    {layer.components.map(comp => (
                      <span
                        key={comp}
                        style={{
                          padding: "4px 10px",
                          background: `${layer.color}0A`,
                          border: `1px solid ${layer.color}22`,
                          borderRadius: 4,
                          fontSize: 11,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
