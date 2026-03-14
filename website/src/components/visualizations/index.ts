export { default as Phase0StreamingViz } from "./Phase0StreamingViz";
export { default as Phase0ToolUseViz } from "./Phase0ToolUseViz";
export { default as Phase1RegistryViz } from "./Phase1RegistryViz";
export { default as Phase2ChainViz } from "./Phase2ChainViz";
export { default as Phase2RouterViz } from "./Phase2RouterViz";
export { default as Phase3ReactViz } from "./Phase3ReactViz";
export { default as Phase4OrchestratorViz } from "./Phase4OrchestratorViz";
export { default as Phase5CLIViz } from "./Phase5CLIViz";

// Map visualization IDs to components
export const VISUALIZATION_MAP: Record<string, React.ComponentType<{ color: string }>> = {
  "phase0-streaming": Phase0StreamingViz,
  "phase0-tool-use": Phase0ToolUseViz,
  "phase1-registry": Phase1RegistryViz,
  "phase2-chain": Phase2ChainViz,
  "phase2-router": Phase2RouterViz,
  "phase3-react": Phase3ReactViz,
  "phase4-orchestrator": Phase4OrchestratorViz,
  "phase5-cli": Phase5CLIViz,
};
