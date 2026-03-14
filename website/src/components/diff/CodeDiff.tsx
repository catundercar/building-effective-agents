interface CodeDiffProps {
  oldCode: string;
  newCode: string;
  oldLabel?: string;
  newLabel?: string;
  color: string;
}

export default function CodeDiff({ oldCode, newCode, oldLabel = "Before", newLabel = "After", color }: CodeDiffProps) {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");

  // Simple diff: find added/removed lines
  const oldSet = new Set(oldLines.map(l => l.trim()));
  const newSet = new Set(newLines.map(l => l.trim()));

  return (
    <div style={{
      borderRadius: 8,
      border: "1px solid var(--border-subtle)",
      overflow: "hidden",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* Old */}
        <div style={{ borderRight: "1px solid var(--border-faint)" }}>
          <div style={{
            padding: "8px 14px",
            background: "rgba(239,68,68,0.06)",
            borderBottom: "1px solid var(--border-faint)",
            fontSize: 11,
            color: "#EF4444",
            fontWeight: 600,
          }}>
            {oldLabel}
          </div>
          <div style={{
            overflowX: "auto",
            background: "var(--code-bg)",
            padding: "8px 0",
          }}>
            {oldLines.map((line, i) => {
              const isRemoved = !newSet.has(line.trim()) && line.trim() !== "";
              return (
                <div key={i} style={{
                  padding: "1px 16px",
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  whiteSpace: "pre",
                  color: isRemoved ? "#EF4444" : "var(--text-secondary)",
                  background: isRemoved ? "rgba(239,68,68,0.08)" : "transparent",
                }}>
                  <span style={{ color: "var(--text-dim)", marginRight: 12, fontSize: 11, display: "inline-block", width: 24, textAlign: "right" as const }}>
                    {i + 1}
                  </span>
                  {isRemoved && <span style={{ color: "#EF4444", marginRight: 8 }}>-</span>}
                  {line}
                </div>
              );
            })}
          </div>
        </div>

        {/* New */}
        <div>
          <div style={{
            padding: "8px 14px",
            background: "rgba(16,185,129,0.06)",
            borderBottom: "1px solid var(--border-faint)",
            fontSize: 11,
            color: "#10B981",
            fontWeight: 600,
          }}>
            {newLabel}
          </div>
          <div style={{
            overflowX: "auto",
            background: "var(--code-bg)",
            padding: "8px 0",
          }}>
            {newLines.map((line, i) => {
              const isAdded = !oldSet.has(line.trim()) && line.trim() !== "";
              return (
                <div key={i} style={{
                  padding: "1px 16px",
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  whiteSpace: "pre",
                  color: isAdded ? "#10B981" : "var(--text-secondary)",
                  background: isAdded ? "rgba(16,185,129,0.08)" : "transparent",
                }}>
                  <span style={{ color: "var(--text-dim)", marginRight: 12, fontSize: 11, display: "inline-block", width: 24, textAlign: "right" as const }}>
                    {i + 1}
                  </span>
                  {isAdded && <span style={{ color: "#10B981", marginRight: 8 }}>+</span>}
                  {line}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
