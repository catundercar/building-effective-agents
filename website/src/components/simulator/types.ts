export type AgentState = "idle" | "thinking" | "tool_calling" | "observing" | "complete";

export interface SimulatorMessage {
  role: "user" | "assistant" | "tool_result";
  content: string;
  toolName?: string;
  toolInput?: string;
  isThinking?: boolean;
}

export interface SimulatorStep {
  state: AgentState;
  label: string;
  description: string;
  messages: SimulatorMessage[];
  activeNode: string; // which flow node is highlighted
}

// Pre-built scenario: "Create a file called hello.py"
export const DEMO_SCENARIO: SimulatorStep[] = [
  {
    state: "idle",
    label: "User Input",
    description: "User sends a task to the agent",
    activeNode: "user_input",
    messages: [
      { role: "user", content: "Create a file called hello.py that prints 'Hello, World!'" },
    ],
  },
  {
    state: "thinking",
    label: "LLM Reasoning",
    description: "Model analyzes the request and decides to use a tool",
    activeNode: "llm_call",
    messages: [
      { role: "user", content: "Create a file called hello.py that prints 'Hello, World!'" },
      { role: "assistant", content: "I need to create a Python file. Let me use the write_file tool.", isThinking: true },
    ],
  },
  {
    state: "tool_calling",
    label: "Tool Use → write_file",
    description: "stop_reason: tool_use — Model calls write_file with the file content",
    activeNode: "tool_execute",
    messages: [
      { role: "user", content: "Create a file called hello.py that prints 'Hello, World!'" },
      { role: "assistant", content: "I'll create the file with the print statement.", isThinking: true },
      { role: "assistant", content: "write_file", toolName: "write_file", toolInput: '{\n  "path": "/project/hello.py",\n  "content": "print(\'Hello, World!\')"\n}' },
    ],
  },
  {
    state: "observing",
    label: "Tool Result",
    description: "Tool execution result is appended to messages[]",
    activeNode: "observe",
    messages: [
      { role: "user", content: "Create a file called hello.py that prints 'Hello, World!'" },
      { role: "assistant", content: "I'll create the file with the print statement.", isThinking: true },
      { role: "assistant", content: "write_file", toolName: "write_file", toolInput: '{\n  "path": "/project/hello.py",\n  "content": "print(\'Hello, World!\')"\n}' },
      { role: "tool_result", content: "File created successfully: /project/hello.py (28 bytes)", toolName: "write_file" },
    ],
  },
  {
    state: "thinking",
    label: "LLM Reasoning (Loop 2)",
    description: "Model sees the result and decides to verify by running the file",
    activeNode: "llm_call",
    messages: [
      { role: "user", content: "Create a file called hello.py that prints 'Hello, World!'" },
      { role: "assistant", content: "I'll create the file with the print statement.", isThinking: true },
      { role: "assistant", content: "write_file", toolName: "write_file", toolInput: '{\n  "path": "/project/hello.py",\n  "content": "print(\'Hello, World!\')"\n}' },
      { role: "tool_result", content: "File created successfully: /project/hello.py (28 bytes)", toolName: "write_file" },
      { role: "assistant", content: "File created. Let me verify it works by running it.", isThinking: true },
    ],
  },
  {
    state: "tool_calling",
    label: "Tool Use → run_command",
    description: "stop_reason: tool_use — Model runs the file to verify",
    activeNode: "tool_execute",
    messages: [
      { role: "user", content: "Create a file called hello.py that prints 'Hello, World!'" },
      { role: "assistant", content: "I'll create the file with the print statement.", isThinking: true },
      { role: "assistant", content: "write_file", toolName: "write_file", toolInput: '{\n  "path": "/project/hello.py",\n  "content": "print(\'Hello, World!\')"\n}' },
      { role: "tool_result", content: "File created successfully: /project/hello.py (28 bytes)", toolName: "write_file" },
      { role: "assistant", content: "Let me verify it works.", isThinking: true },
      { role: "assistant", content: "run_command", toolName: "run_command", toolInput: '{\n  "command": "python hello.py"\n}' },
    ],
  },
  {
    state: "observing",
    label: "Tool Result",
    description: "Command output confirms the file works correctly",
    activeNode: "observe",
    messages: [
      { role: "user", content: "Create a file called hello.py that prints 'Hello, World!'" },
      { role: "assistant", content: "I'll create the file with the print statement.", isThinking: true },
      { role: "assistant", content: "write_file", toolName: "write_file", toolInput: '{\n  "path": "/project/hello.py",\n  "content": "print(\'Hello, World!\')"\n}' },
      { role: "tool_result", content: "File created successfully: /project/hello.py (28 bytes)", toolName: "write_file" },
      { role: "assistant", content: "Let me verify it works.", isThinking: true },
      { role: "assistant", content: "run_command", toolName: "run_command", toolInput: '{\n  "command": "python hello.py"\n}' },
      { role: "tool_result", content: "Hello, World!\n\n(exit code: 0)", toolName: "run_command" },
    ],
  },
  {
    state: "complete",
    label: "Task Complete",
    description: "stop_reason: end_turn — Model responds with final text, loop exits",
    activeNode: "complete",
    messages: [
      { role: "user", content: "Create a file called hello.py that prints 'Hello, World!'" },
      { role: "assistant", content: "I'll create the file with the print statement.", isThinking: true },
      { role: "assistant", content: "write_file", toolName: "write_file", toolInput: '{\n  "path": "/project/hello.py",\n  "content": "print(\'Hello, World!\')"\n}' },
      { role: "tool_result", content: "File created successfully: /project/hello.py (28 bytes)", toolName: "write_file" },
      { role: "assistant", content: "Let me verify it works.", isThinking: true },
      { role: "assistant", content: "run_command", toolName: "run_command", toolInput: '{\n  "command": "python hello.py"\n}' },
      { role: "tool_result", content: "Hello, World!\n\n(exit code: 0)", toolName: "run_command" },
      { role: "assistant", content: "Done! I've created hello.py with a print statement. The file runs correctly and outputs 'Hello, World!'." },
    ],
  },
];
