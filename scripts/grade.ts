/**
 * Grade Script — 自動評分
 *
 * 運行: npm run grade
 *
 * 遍歷所有 Lab 測試並輸出成績報告。
 */

import { execSync } from "node:child_process";

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

interface LabResult {
  name: string;
  passed: number;
  failed: number;
  total: number;
}

const labs = [
  { name: "Lab 1: LLM Client", script: "test:lab1" },
  { name: "Lab 2: Tool System", script: "test:lab2" },
  { name: "Lab 3: Context Manager", script: "test:lab3" },
];

console.log(`
${c.bold}${c.cyan}═══════════════════════════════════════════
  Phase 0 · Grading Report
═══════════════════════════════════════════${c.reset}
`);

const results: LabResult[] = [];

for (const lab of labs) {
  try {
    const output = execSync(`npx vitest run --reporter=json src/__tests__/${lab.script.split(":")[1]}.test.ts 2>&1`, {
      encoding: "utf-8",
      cwd: process.cwd(),
    });

    // 嘗試解析 JSON 輸出
    try {
      const jsonMatch = output.match(/\{[\s\S]*"testResults"[\s\S]*\}/);
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[0]);
        const total = json.numTotalTests || 0;
        const passed = json.numPassedTests || 0;
        const failed = json.numFailedTests || 0;
        results.push({ name: lab.name, passed, failed, total });
      } else {
        results.push({ name: lab.name, passed: 0, failed: 0, total: 0 });
      }
    } catch {
      // 如果 JSON 解析失敗，從文本中提取
      const passMatch = output.match(/(\d+) passed/);
      const failMatch = output.match(/(\d+) failed/);
      const passed = passMatch ? parseInt(passMatch[1]) : 0;
      const failed = failMatch ? parseInt(failMatch[1]) : 0;
      results.push({ name: lab.name, passed, failed, total: passed + failed });
    }
  } catch (err: any) {
    // vitest 在有測試失敗時會返回非零退出碼
    const output = err.stdout || err.message || "";
    const passMatch = output.match(/(\d+) passed/);
    const failMatch = output.match(/(\d+) failed/);
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    results.push({
      name: lab.name,
      passed,
      failed,
      total: passed + failed || 1,
    });
  }
}

// ── Print Results ──────────────────────────────────────────

let totalPassed = 0;
let totalTests = 0;

for (const r of results) {
  totalPassed += r.passed;
  totalTests += r.total;

  const pct = r.total > 0 ? Math.round((r.passed / r.total) * 100) : 0;
  const bar = "█".repeat(Math.round(pct / 5)) + "░".repeat(20 - Math.round(pct / 5));
  const color = pct === 100 ? c.green : pct >= 50 ? c.yellow : c.red;

  console.log(`  ${c.bold}${r.name}${c.reset}`);
  console.log(`  ${color}${bar}${c.reset} ${pct}%  (${r.passed}/${r.total} tests)`);
  console.log();
}

const totalPct = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

console.log(`${c.dim}${"─".repeat(45)}${c.reset}`);
console.log(
  `  ${c.bold}Overall: ${totalPassed}/${totalTests} tests passed (${totalPct}%)${c.reset}`
);

if (totalPct === 100) {
  console.log(`\n  ${c.green}${c.bold}🎉 All tests passed! Phase 0 complete.${c.reset}\n`);
} else if (totalPct >= 70) {
  console.log(`\n  ${c.yellow}Almost there! Keep going.${c.reset}\n`);
} else {
  console.log(`\n  ${c.red}Keep working on it. Run individual tests to debug.${c.reset}\n`);
}
