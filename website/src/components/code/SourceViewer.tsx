import { useState } from "react";

interface SourceViewerProps {
  code: string;
  filePath: string;
  language?: string;
  color: string;
}

// Simple Python syntax highlighting
function highlightPython(code: string): Array<{ text: string; className: string }> {
  const tokens: Array<{ text: string; className: string }> = [];
  const keywords = /\b(def|class|return|if|elif|else|for|while|import|from|try|except|finally|with|as|raise|pass|break|continue|yield|lambda|and|or|not|in|is|None|True|False|self|async|await)\b/g;
  const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
  const comments = /#.*/g;
  const decorators = /@\w+/g;
  const todos = /(TODO|FIXME|HINT|XXX)(\s*:?\s*.*)/g;

  // For simplicity, we just return the code as-is and apply line-level highlighting
  return [{ text: code, className: "" }];
}

export default function SourceViewer({ code, filePath, language = "python", color }: SourceViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const lines = code.split("\n");
  const displayLines = isExpanded ? lines : lines.slice(0, 20);
  const hasMore = lines.length > 20;

  return (
    <div style={{
      borderRadius: 8,
      border: "1px solid var(--border-subtle)",
      overflow: "hidden",
    }}>
      {/* File header */}
      <div style={{
        padding: "8px 14px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border-faint)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.6 }}>📄</span>
          <code style={{
            fontSize: 12,
            color: color,
            fontWeight: 600,
          }}>
            {filePath}
          </code>
        </div>
        <span style={{
          fontSize: 10,
          color: "var(--text-dim)",
          padding: "2px 6px",
          background: "var(--surface-card)",
          borderRadius: 3,
        }}>
          {language} · {lines.length} lines
        </span>
      </div>

      {/* Code content */}
      <div style={{
        overflowX: "auto",
        background: "var(--code-bg)",
      }}>
        <table style={{
          borderCollapse: "collapse",
          width: "100%",
          fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
          fontSize: 12,
          lineHeight: 1.6,
        }}>
          <tbody>
            {displayLines.map((line, i) => {
              const isTodo = /TODO|FIXME/.test(line);
              const isHint = /HINT/.test(line);
              const isComment = line.trimStart().startsWith("#");
              return (
                <tr key={i}>
                  <td style={{
                    padding: "0 12px",
                    textAlign: "right" as const,
                    color: "var(--text-dim)",
                    userSelect: "none" as const,
                    width: 48,
                    fontSize: 11,
                    borderRight: "1px solid var(--border-faint)",
                    opacity: 0.6,
                  }}>
                    {i + 1}
                  </td>
                  <td style={{
                    padding: "0 16px",
                    whiteSpace: "pre",
                    color: isComment ? "var(--text-dim)" : "var(--text-secondary)",
                    background: isTodo ? "rgba(234,179,8,0.08)" : isHint ? "rgba(59,130,246,0.06)" : "transparent",
                  }}>
                    {highlightLine(line, color)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show more / less */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: "100%",
            padding: "8px",
            background: "var(--surface)",
            border: "none",
            borderTop: "1px solid var(--border-faint)",
            color: color,
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 600,
          }}
        >
          {isExpanded ? `▲ Show less` : `▼ Show all ${lines.length} lines`}
        </button>
      )}
    </div>
  );
}

function highlightLine(line: string, color: string): JSX.Element {
  // Highlight TODO/FIXME/HINT markers
  if (/TODO|FIXME/.test(line)) {
    return <span>{line.replace(/(TODO|FIXME)/, (m) => `⚠️ ${m}`)}</span>;
  }
  if (/HINT/.test(line)) {
    return <span style={{ color: "#3B82F6" }}>{line}</span>;
  }
  // Highlight Python keywords inline (simplified)
  const keywords = ["def ", "class ", "return ", "import ", "from ", "if ", "elif ", "else:", "for ", "while ", "try:", "except ", "with ", "raise ", "pass", "None", "True", "False", "self", "async ", "await "];
  let result = line;
  for (const kw of keywords) {
    if (line.includes(kw)) {
      // Just color the whole line slightly different for keyword lines
      return <span style={{ color: "var(--text)" }}>{line}</span>;
    }
  }
  return <span>{line}</span>;
}
