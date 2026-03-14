import { useState, useEffect, useRef } from "react";

interface Props {
  color: string;
}

const REACT_STEPS = [
  { phase: "Think", icon: "🧠", text: "I need to create a function that calculates fibonacci. Let me start by writing the code.", color: "#F59E0B" },
  { phase: "Act", icon: "⚡", text: "write_file(path='fib.py', content='def fib(n):\\n  if n <= 1: return n\\n  return fib(n-1) + fib(n-2)')", color: "#7C3AED" },
  { phase: "Observe", icon: "👁", text: "File created: fib.py (62 bytes)", color: "#10B981" },
  { phase: "Think", icon: "🧠", text: "File created. Let me run the tests to verify it works correctly.", color: "#F59E0B" },
  { phase: "Act", icon: "⚡", text: "run_command(command='python -m pytest test_fib.py -v')", color: "#7C3AED" },
  { phase: "Observe", icon: "👁", text: "FAILED: test_fib_large — RecursionError: maximum recursion depth exceeded", color: "#EF4444" },
  { phase: "Think", icon: "🧠", text: "The recursive approach is too slow for large inputs. I should use dynamic programming instead.", color: "#F59E0B" },
  { phase: "Act", icon: "⚡", text: "write_file(path='fib.py', content='def fib(n):\\n  a, b = 0, 1\\n  for _ in range(n):\\n    a, b = b, a+b\\n  return a')", color: "#7C3AED" },
  { phase: "Observe", icon: "👁", text: "All 5 tests passed ✓", color: "#10B981" },
];

export default function Phase3ReactViz({ color }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= REACT_STEPS.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  const reset = () => { setCurrentStep(0); setIsPlaying(false); };

  return (
    <div style={{
      borderRadius: 8,
      border: "1px solid var(--border-subtle)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--border-faint)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
          ReAct Loop — Think → Act → Observe
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => currentStep < REACT_STEPS.length - 1 && setCurrentStep(prev => prev + 1)}
            style={btnStyle(color)}
          >
            Step →
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={btnStyle(color)}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={reset} style={btnStyle(color)}>↺</button>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Phase indicator */}
        <div style={{
          display: "flex",
          gap: 4,
          marginBottom: 16,
        }}>
          {["Think", "Act", "Observe"].map(phase => {
            const isActive = REACT_STEPS[currentStep].phase === phase;
            const phaseColor = phase === "Think" ? "#F59E0B" : phase === "Act" ? "#7C3AED" : "#10B981";
            return (
              <div
                key={phase}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: isActive ? `${phaseColor}15` : "var(--surface-card)",
                  border: `1px solid ${isActive ? `${phaseColor}44` : "var(--border-faint)"}`,
                  borderRadius: 6,
                  textAlign: "center" as const,
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? phaseColor : "var(--text-dim)",
                  transition: "all 0.3s",
                }}
              >
                {phase}
              </div>
            );
          })}
        </div>

        {/* Steps timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {REACT_STEPS.slice(0, currentStep + 1).map((step, i) => (
            <div
              key={i}
              style={{
                padding: "8px 12px",
                borderLeft: `3px solid ${step.color}`,
                background: i === currentStep ? `${step.color}08` : "transparent",
                borderRadius: "0 4px 4px 0",
                fontSize: 12,
                color: i === currentStep ? "var(--text-secondary)" : "var(--text-dim)",
                animation: i === currentStep ? "fadeIn 0.3s ease" : undefined,
                lineHeight: 1.6,
              }}
            >
              <span style={{ fontWeight: 600, color: step.color, marginRight: 6 }}>
                {step.icon} {step.phase}
              </span>
              {step.text}
            </div>
          ))}
        </div>

        {/* Iteration counter */}
        <div style={{
          marginTop: 12,
          fontSize: 10,
          color: "var(--text-dim)",
          textAlign: "right" as const,
        }}>
          Iteration {Math.floor(currentStep / 3) + 1} · Step {currentStep + 1}/{REACT_STEPS.length}
        </div>
      </div>
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return {
    padding: "4px 10px",
    background: "var(--surface)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 4,
    color: "var(--text-secondary)",
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}
