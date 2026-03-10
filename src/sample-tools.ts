/**
 * 預置工具集
 *
 * 這些工具已經為你實現好了，用於測試你的 Tool 系統。
 * 學習它們的結構，你將在後續 Phase 中設計自己的工具。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ToolHandler } from "./types.js";

// ─── Tool 1: Get Weather (Mock) ─────────────────────────────

export const weatherTool: ToolHandler = {
  definition: {
    name: "get_weather",
    description:
      "Get the current weather for a given city. Returns temperature, condition, and humidity. Use this when the user asks about weather in a specific location.",
    input_schema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description:
            'The city name, e.g. "Tokyo", "San Francisco", "London"',
        },
      },
      required: ["city"],
    },
  },
  execute: async (input) => {
    const city = input.city as string;
    // Mock data — 在真實場景中這會調用天氣 API
    const mockData: Record<string, object> = {
      tokyo: { temp: "22°C", condition: "Partly Cloudy", humidity: "65%" },
      "san francisco": { temp: "18°C", condition: "Foggy", humidity: "78%" },
      london: { temp: "14°C", condition: "Rainy", humidity: "85%" },
      beijing: { temp: "28°C", condition: "Sunny", humidity: "40%" },
    };

    const data = mockData[city.toLowerCase()];
    if (!data) {
      return `Weather data not available for "${city}". Available cities: ${Object.keys(mockData).join(", ")}`;
    }
    return JSON.stringify(data, null, 2);
  },
};

// ─── Tool 2: Read File ──────────────────────────────────────

export const readFileTool: ToolHandler = {
  definition: {
    name: "read_file",
    description:
      "Read the contents of a file at the given absolute path. Returns the file contents as a string. Use this to examine source code, configuration files, or any text file.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "Absolute path to the file to read, e.g. /home/user/project/src/index.ts",
        },
      },
      required: ["path"],
    },
  },
  execute: async (input) => {
    const filePath = input.path as string;

    if (!path.isAbsolute(filePath)) {
      return `Error: Path must be absolute. Got relative path: "${filePath}". Use absolute path like "/home/user/project/file.ts"`;
    }

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      // 附帶行號，方便 LLM 定位
      const numbered = lines
        .map((line, i) => `${String(i + 1).padStart(4)} │ ${line}`)
        .join("\n");
      return `File: ${filePath} (${lines.length} lines)\n${"─".repeat(60)}\n${numbered}`;
    } catch (err: any) {
      return `Error reading file "${filePath}": ${err.message}`;
    }
  },
};

// ─── Tool 3: Calculator ─────────────────────────────────────

export const calculatorTool: ToolHandler = {
  definition: {
    name: "calculator",
    description:
      "Evaluate a mathematical expression and return the result. Supports basic arithmetic (+, -, *, /), parentheses, and common math functions (sqrt, pow, abs, etc). Use this for any calculation the user needs.",
    input_schema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description:
            'The math expression to evaluate, e.g. "2 + 3 * 4", "sqrt(16)", "pow(2, 10)"',
        },
      },
      required: ["expression"],
    },
  },
  execute: async (input) => {
    const expr = input.expression as string;

    // 安全的數學表達式求值（不使用 eval）
    try {
      // 只允許數字、運算符、括號和安全的數學函數
      const sanitized = expr.replace(/\s+/g, "");
      const safePattern =
        /^[\d+\-*/().,%]+$|^(sqrt|pow|abs|ceil|floor|round|min|max|log|sin|cos|tan|PI|E)\b/;

      if (!safePattern.test(sanitized) && !/^[\d\s+\-*/().]+$/.test(expr)) {
        return `Error: Expression contains unsafe characters. Only numbers, operators (+, -, *, /), parentheses, and math functions are allowed.`;
      }

      // 替換數學函數名為 Math. 前綴
      const withMath = expr
        .replace(/\bsqrt\b/g, "Math.sqrt")
        .replace(/\bpow\b/g, "Math.pow")
        .replace(/\babs\b/g, "Math.abs")
        .replace(/\bceil\b/g, "Math.ceil")
        .replace(/\bfloor\b/g, "Math.floor")
        .replace(/\bround\b/g, "Math.round")
        .replace(/\bmin\b/g, "Math.min")
        .replace(/\bmax\b/g, "Math.max")
        .replace(/\blog\b/g, "Math.log")
        .replace(/\bPI\b/g, "Math.PI")
        .replace(/\bE\b/g, "Math.E");

      const result = new Function(`return (${withMath})`)();

      if (typeof result !== "number" || !isFinite(result)) {
        return `Error: Expression "${expr}" resulted in ${result}`;
      }

      return `${expr} = ${result}`;
    } catch (err: any) {
      return `Error evaluating "${expr}": ${err.message}`;
    }
  },
};

// ─── Export All Tools ────────────────────────────────────────

export const allTools: ToolHandler[] = [
  weatherTool,
  readFileTool,
  calculatorTool,
];
