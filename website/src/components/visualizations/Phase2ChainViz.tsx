import { useState } from "react";

interface Props {
  color: string;
}

const CHAIN_STEPS = [
  { name: "Read Code", input: "src/auth.py", output: "File content (342 lines)", status: "pass", gate: null },
  { name: "Analyze Structure", input: "File content", output: "{ functions: 12, classes: 3, issues: 4 }", status: "pass", gate: "Has required fields?" },
  { name: "Generate Fixes", input: "4 issues found", output: "4 fix suggestions with diffs", status: "pass", gate: "Valid syntax?" },
  { name: "Apply & Verify", input: "Fix suggestions", output: "All tests pass ✓", status: "pass", gate: "Tests pass?" },
];

export default function Phase2ChainViz({ color }: Props) {
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
        Prompt Chaining — Code Review Pipeline
      </div>

      <div style={{ padding: 16 }}>
        {/* Chain visualization */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {CHAIN_STEPS.map((step, i) => (
            <div key={i}>
              {/* Step card */}
              <button
                onClick={() => setActiveStep(activeStep === i ? null : i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 14px",
                  background: activeStep === i ? `${color}08` : "var(--surface-card)",
                  border: `1px solid ${activeStep === i ? `${color}33` : "var(--border-faint)"}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left" as const,
                  transition: "all 0.2s",
                }}
              >
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: color,
                  background: `${color}15`,
                  padding: "2px 8px",
                  borderRadius: 4,
                  flexShrink: 0,
                }}>
                  Step {i + 1}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", flex: 1 }}>
                  {step.name}
                </span>
                <span style={{
                  fontSize: 10,
                  color: "#10B981",
                  padding: "2px 6px",
                  background: "rgba(16,185,129,0.1)",
                  borderRadius: 3,
                }}>
                  ✓
                </span>
              </button>

              {/* Expanded detail */}
              {activeStep === i && (
                <div style={{
                  margin: "4px 0 4px 20px",
                  padding: "10px 14px",
                  borderLeft: `2px solid ${color}44`,
                  animation: "fadeIn 0.2s ease",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 11 }}>
                    <div>
                      <div style={{ color: "var(--text-dim)", fontWeight: 600, marginBottom: 4, fontSize: 10, textTransform: "uppercase" as const }}>Input</div>
                      <div style={{ color: "var(--text-secondary)" }}>{step.input}</div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-dim)", fontWeight: 600, marginBottom: 4, fontSize: 10, textTransform: "uppercase" as const }}>Output</div>
                      <div style={{ color: "var(--text-secondary)" }}>{step.output}</div>
                    </div>
                  </div>
                  {step.gate && (
                    <div style={{
                      marginTop: 8,
                      padding: "4px 8px",
                      background: "rgba(16,185,129,0.06)",
                      borderRadius: 4,
                      fontSize: 10,
                      color: "#10B981",
                    }}>
                      Gate: {step.gate} → PASS
                    </div>
                  )}
                </div>
              )}

              {/* Connector */}
              {i < CHAIN_STEPS.length - 1 && (
                <div style={{
                  height: 12,
                  marginLeft: 28,
                  borderLeft: `1px dashed ${color}33`,
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
