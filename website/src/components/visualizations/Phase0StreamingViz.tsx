import { useState, useEffect, useRef } from "react";

interface Props {
  color: string;
}

const SSE_EVENTS = [
  { type: "message_start", data: '{ "model": "claude-3", "role": "assistant" }', delay: 0 },
  { type: "content_block_start", data: '{ "type": "text", "text": "" }', delay: 300 },
  { type: "content_block_delta", data: '{ "text": "Hello" }', delay: 500 },
  { type: "content_block_delta", data: '{ "text": ", " }', delay: 700 },
  { type: "content_block_delta", data: '{ "text": "World" }', delay: 900 },
  { type: "content_block_delta", data: '{ "text": "!" }', delay: 1100 },
  { type: "content_block_stop", data: "{}", delay: 1300 },
  { type: "message_stop", data: "{}", delay: 1500 },
];

export default function Phase0StreamingViz({ color }: Props) {
  const [visibleEvents, setVisibleEvents] = useState(0);
  const [outputText, setOutputText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const play = () => {
    setVisibleEvents(0);
    setOutputText("");
    setIsPlaying(true);

    SSE_EVENTS.forEach((evt, i) => {
      timerRef.current = setTimeout(() => {
        setVisibleEvents(i + 1);
        if (evt.type === "content_block_delta") {
          const match = evt.data.match(/"text":\s*"([^"]*)"/);
          if (match) setOutputText(prev => prev + match[1]);
        }
        if (i === SSE_EVENTS.length - 1) setIsPlaying(false);
      }, evt.delay);
    });
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div style={{
      borderRadius: 8,
      border: "1px solid var(--border-subtle)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--border-faint)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
          SSE Streaming Flow
        </span>
        <button
          onClick={play}
          disabled={isPlaying}
          style={{
            padding: "4px 12px",
            background: isPlaying ? "var(--surface)" : `${color}18`,
            border: `1px solid ${isPlaying ? "var(--border-subtle)" : `${color}44`}`,
            borderRadius: 4,
            color: isPlaying ? "var(--text-dim)" : color,
            fontSize: 11,
            cursor: isPlaying ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {isPlaying ? "Playing..." : "▶ Play"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 200 }}>
        {/* Left: SSE events */}
        <div style={{
          padding: 14,
          borderRight: "1px solid var(--border-faint)",
          fontSize: 11,
        }}>
          <div style={{
            fontSize: 10,
            color: "var(--text-dim)",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            marginBottom: 8,
            fontWeight: 600,
          }}>
            Server-Sent Events
          </div>
          {SSE_EVENTS.slice(0, visibleEvents).map((evt, i) => (
            <div
              key={i}
              style={{
                padding: "4px 8px",
                marginBottom: 4,
                borderRadius: 4,
                background: evt.type === "content_block_delta" ? `${color}08` : "var(--surface-card)",
                borderLeft: `2px solid ${evt.type === "content_block_delta" ? color : "var(--border-subtle)"}`,
                animation: "fadeIn 0.2s ease",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span style={{ color: color, fontWeight: 600 }}>event: </span>
              <span style={{ color: "var(--text-secondary)" }}>{evt.type}</span>
            </div>
          ))}
        </div>

        {/* Right: Rendered output */}
        <div style={{ padding: 14 }}>
          <div style={{
            fontSize: 10,
            color: "var(--text-dim)",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            marginBottom: 8,
            fontWeight: 600,
          }}>
            Terminal Output
          </div>
          <div style={{
            padding: "12px 16px",
            background: "var(--code-bg)",
            borderRadius: 6,
            minHeight: 60,
            fontSize: 14,
            color: "var(--text)",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {outputText}
            {isPlaying && (
              <span style={{
                display: "inline-block",
                width: 2,
                height: 16,
                background: color,
                marginLeft: 1,
                animation: "pulse 0.8s infinite",
                verticalAlign: "text-bottom",
              }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
