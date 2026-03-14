import { useState, useEffect, useRef, useCallback } from "react";
import SimulatorControls from "./SimulatorControls";
import SimulatorMessages from "./SimulatorMessages";
import { DEMO_SCENARIO } from "./types";
import type { AgentState } from "./types";

interface AgentLoopSimulatorProps {
  color?: string;
  accent?: string;
}

const FLOW_NODES = [
  { id: "user_input", label: "User Input", x: 50, y: 30 },
  { id: "llm_call", label: "LLM Call", x: 50, y: 100 },
  { id: "stop_check", label: "stop_reason?", x: 50, y: 170 },
  { id: "tool_execute", label: "Tool Execute", x: 15, y: 240 },
  { id: "observe", label: "Observe Result", x: 15, y: 310 },
  { id: "complete", label: "Return Text", x: 75, y: 240 },
];

const FLOW_EDGES: Array<{ from: string; to: string; label?: string }> = [
  { from: "user_input", to: "llm_call" },
  { from: "llm_call", to: "stop_check" },
  { from: "stop_check", to: "tool_execute", label: "tool_use" },
  { from: "stop_check", to: "complete", label: "end_turn" },
  { from: "tool_execute", to: "observe" },
  { from: "observe", to: "llm_call" },
];

export default function AgentLoopSimulator({ color = "#7C3AED", accent = "#A78BFA" }: AgentLoopSimulatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [prevMessageCount, setPrevMessageCount] = useState(0);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scenario = DEMO_SCENARIO;
  const currentData = scenario[currentStep];

  const step = useCallback(() => {
    if (currentStep < scenario.length - 1) {
      setPrevMessageCount(scenario[currentStep].messages.length);
      setCurrentStep(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStep, scenario]);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(step, 2000 / speed);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, speed, step]);

  const reset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setPrevMessageCount(0);
  };

  return (
    <div style={{
      borderRadius: 12,
      border: "1px solid var(--border-subtle)",
      background: "var(--bg)",
      overflow: "hidden",
    }}>
      {/* Title bar */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border-faint)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: getStateColor(currentData.state, color),
            boxShadow: `0 0 8px ${getStateColor(currentData.state, color)}66`,
            animation: currentData.state === "thinking" ? "pulse 1.5s infinite" : undefined,
          }} />
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
          }}>
            Agent Loop Simulator
          </span>
        </div>
        <span style={{
          fontSize: 11,
          color: color,
          padding: "3px 8px",
          background: `${color}12`,
          border: `1px solid ${color}22`,
          borderRadius: 4,
        }}>
          {currentData.label}
        </span>
      </div>

      {/* Main content: Flow diagram + Messages */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        minHeight: 400,
      }}>
        {/* Left: Flow diagram */}
        <div style={{
          padding: "20px 16px",
          borderRight: "1px solid var(--border-faint)",
          position: "relative",
        }}>
          <div style={{
            fontSize: 10,
            color: "var(--text-dim)",
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            fontWeight: 600,
            marginBottom: 16,
          }}>
            Flow
          </div>

          <svg width="248" height="360" viewBox="0 0 100 380" style={{ display: "block" }}>
            {/* Edges */}
            {FLOW_EDGES.map((edge, i) => {
              const from = FLOW_NODES.find(n => n.id === edge.from)!;
              const to = FLOW_NODES.find(n => n.id === edge.to)!;
              const isActive = isEdgeActive(edge, currentData.activeNode);
              return (
                <g key={i}>
                  <line
                    x1={from.x}
                    y1={from.y + 18}
                    x2={to.x}
                    y2={to.y - 2}
                    stroke={isActive ? color : "var(--text-dim)"}
                    strokeWidth={isActive ? 1.5 : 0.5}
                    strokeDasharray={isActive ? undefined : "3,3"}
                    opacity={isActive ? 1 : 0.3}
                  />
                  {edge.label && (
                    <text
                      x={(from.x + to.x) / 2 + (edge.label === "end_turn" ? 12 : -12)}
                      y={(from.y + to.y) / 2 + 10}
                      fill={isActive ? color : "var(--text-dim)"}
                      fontSize="6"
                      textAnchor="middle"
                      fontFamily="inherit"
                      opacity={isActive ? 1 : 0.5}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {FLOW_NODES.map(node => {
              const isActive = node.id === currentData.activeNode;
              const nodeColor = isActive ? color : "var(--text-dim)";
              return (
                <g key={node.id}>
                  {node.id === "stop_check" ? (
                    // Diamond shape for decision
                    <polygon
                      points={`${node.x},${node.y - 12} ${node.x + 18},${node.y} ${node.x},${node.y + 12} ${node.x - 18},${node.y}`}
                      fill={isActive ? `${color}18` : "var(--surface-card)"}
                      stroke={nodeColor}
                      strokeWidth={isActive ? 1.5 : 0.5}
                      opacity={isActive ? 1 : 0.5}
                    />
                  ) : (
                    <rect
                      x={node.x - 18}
                      y={node.y - 10}
                      width={36}
                      height={20}
                      rx={node.id === "complete" ? 10 : 4}
                      fill={isActive ? `${color}18` : "var(--surface-card)"}
                      stroke={nodeColor}
                      strokeWidth={isActive ? 1.5 : 0.5}
                      opacity={isActive ? 1 : 0.5}
                    />
                  )}
                  <text
                    x={node.x}
                    y={node.y + 3}
                    fill={nodeColor}
                    fontSize="5"
                    textAnchor="middle"
                    fontFamily="inherit"
                    fontWeight={isActive ? 700 : 400}
                    opacity={isActive ? 1 : 0.6}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}

            {/* Loop-back arrow (observe → llm_call) */}
            <path
              d="M 15 328 L 2 328 L 2 100 L 32 100"
              fill="none"
              stroke={currentData.activeNode === "observe" ? color : "var(--text-dim)"}
              strokeWidth={currentData.activeNode === "observe" ? 1.5 : 0.5}
              strokeDasharray={currentData.activeNode === "observe" ? undefined : "3,3"}
              opacity={currentData.activeNode === "observe" ? 1 : 0.2}
              markerEnd="none"
            />
            <text
              x="2"
              y="215"
              fill={currentData.activeNode === "observe" ? color : "var(--text-dim)"}
              fontSize="5"
              textAnchor="middle"
              fontFamily="inherit"
              opacity={currentData.activeNode === "observe" ? 0.8 : 0.3}
              transform="rotate(-90, 2, 215)"
            >
              loop
            </text>
          </svg>

          {/* State description */}
          <div style={{
            marginTop: 12,
            padding: "10px 12px",
            background: `${color}08`,
            borderLeft: `2px solid ${color}44`,
            borderRadius: "0 4px 4px 0",
            fontSize: 11,
            lineHeight: 1.6,
            color: "var(--text-secondary)",
          }}>
            {currentData.description}
          </div>
        </div>

        {/* Right: Messages panel */}
        <div style={{ padding: "12px 16px" }}>
          <SimulatorMessages
            messages={currentData.messages}
            color={color}
            prevMessageCount={prevMessageCount}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{ borderTop: "1px solid var(--border-faint)" }}>
        <SimulatorControls
          currentStep={currentStep}
          totalSteps={scenario.length}
          isPlaying={isPlaying}
          onStep={step}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onReset={reset}
          speed={speed}
          onSpeedChange={setSpeed}
          color={color}
        />
      </div>
    </div>
  );
}

function getStateColor(state: AgentState, phaseColor: string): string {
  switch (state) {
    case "idle": return "#71717A";
    case "thinking": return "#F59E0B";
    case "tool_calling": return phaseColor;
    case "observing": return "#10B981";
    case "complete": return "#3B82F6";
    default: return "#71717A";
  }
}

function isEdgeActive(edge: { from: string; to: string }, activeNode: string): boolean {
  return edge.to === activeNode;
}
