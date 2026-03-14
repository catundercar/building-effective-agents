import { useState } from "react";

export interface WhatsNewItem {
  category: string;
  items: string[];
}

interface WhatsNewProps {
  phaseId: number;
  data: WhatsNewItem[];
  color: string;
}

export const WHATS_NEW_DATA: Record<number, WhatsNewItem[]> = {
  0: [
    { category: "New Capabilities", items: ["LLM API client with streaming", "Tool/Function calling protocol", "Context window management"] },
  ],
  1: [
    { category: "New Tools", items: ["Tool Registry with dynamic loading", "File system tools (read/write/search/edit)", "Shell executor with sandbox"] },
    { category: "Built On", items: ["Phase 0's LLM Core for API calls"] },
  ],
  2: [
    { category: "New Patterns", items: ["Prompt Chaining with gate checks", "Intent Router for task dispatch", "Structured tracing & logging"] },
    { category: "Built On", items: ["Phase 0's LLM Core", "Phase 1's Tool System"] },
  ],
  3: [
    { category: "Key Upgrade", items: ["ReAct agent loop (Think → Act → Observe)", "Self-correction from environment feedback", "Human-in-the-loop permission system"] },
    { category: "Paradigm Shift", items: ["From predefined workflows → LLM-driven dynamic execution"] },
  ],
  4: [
    { category: "Advanced Patterns", items: ["Orchestrator-Workers for complex tasks", "Evaluator-Optimizer quality loop", "Comprehensive eval framework (20+ cases)"] },
  ],
  5: [
    { category: "Productionization", items: ["Terminal UI with themes", "Layered configuration system", "MCP integration & plugin system", "v1.0 release packaging"] },
  ],
};

export default function WhatsNew({ phaseId, data, color }: WhatsNewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (data.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          background: `${color}08`,
          border: `1px solid ${color}22`,
          borderRadius: 6,
          color: color,
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s",
        }}
      >
        <span style={{
          transform: isExpanded ? "rotate(90deg)" : "rotate(0)",
          transition: "transform 0.2s",
          display: "inline-block",
        }}>→</span>
        What's New in Phase {phaseId}
      </button>

      {isExpanded && (
        <div style={{
          marginTop: 8,
          padding: "12px 16px",
          background: "var(--surface-card)",
          border: "1px solid var(--border-faint)",
          borderRadius: 8,
          animation: "fadeIn 0.2s ease",
        }}>
          {data.map((group, i) => (
            <div key={i} style={{ marginBottom: i < data.length - 1 ? 12 : 0 }}>
              <div style={{
                fontSize: 10,
                color: color,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                marginBottom: 6,
              }}>
                {group.category}
              </div>
              {group.items.map((item, j) => (
                <div key={j} style={{
                  display: "flex",
                  gap: 8,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  padding: "3px 0",
                }}>
                  <span style={{ color: color, flexShrink: 0 }}>+</span>
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
