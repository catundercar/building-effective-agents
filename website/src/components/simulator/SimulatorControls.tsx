interface SimulatorControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onStep: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  color: string;
}

export default function SimulatorControls({
  currentStep,
  totalSteps,
  isPlaying,
  onStep,
  onPlay,
  onPause,
  onReset,
  speed,
  onSpeedChange,
  color,
}: SimulatorControlsProps) {
  const isComplete = currentStep >= totalSteps - 1;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "12px 16px",
      background: "var(--surface-card)",
      border: "1px solid var(--border-faint)",
      borderRadius: 8,
      flexWrap: "wrap",
    }}>
      {/* Step button */}
      <button
        onClick={onStep}
        disabled={isComplete}
        style={{
          padding: "6px 14px",
          background: isComplete ? "var(--surface)" : `${color}18`,
          border: `1px solid ${isComplete ? "var(--border-subtle)" : `${color}44`}`,
          borderRadius: 4,
          color: isComplete ? "var(--text-dim)" : color,
          fontSize: 12,
          cursor: isComplete ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          fontWeight: 600,
          transition: "all 0.2s",
        }}
      >
        Step →
      </button>

      {/* Play/Pause */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        disabled={isComplete}
        style={{
          padding: "6px 14px",
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 4,
          color: isComplete ? "var(--text-dim)" : "var(--text-secondary)",
          fontSize: 12,
          cursor: isComplete ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s",
        }}
      >
        {isPlaying ? "⏸ Pause" : "▶ Play"}
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        style={{
          padding: "6px 14px",
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 4,
          color: "var(--text-secondary)",
          fontSize: 12,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "all 0.2s",
        }}
      >
        ↺ Reset
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Speed control */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        color: "var(--text-dim)",
      }}>
        <span>Speed:</span>
        {[1, 2, 3].map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            style={{
              padding: "3px 8px",
              background: speed === s ? `${color}18` : "transparent",
              border: `1px solid ${speed === s ? `${color}33` : "var(--border-subtle)"}`,
              borderRadius: 3,
              color: speed === s ? color : "var(--text-dim)",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Progress indicator */}
      <div style={{
        fontSize: 11,
        color: "var(--text-dim)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {currentStep + 1} / {totalSteps}
      </div>
    </div>
  );
}
