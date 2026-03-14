import { useState } from "react";
import { Link } from "react-router-dom";
import { hasLessons } from "../data";
import { getPhases, getPrinciples, getArchitecture } from "../data/phases";
import { useLocale } from "../i18n";
import type { Locale } from "../i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitch from "./ThemeSwitch";
import AgentLoopSimulator from "./simulator/AgentLoopSimulator";

// Tool count per phase (showing progressive complexity growth)
const PHASE_TOOL_COUNT: Record<number, number> = {
  0: 3,  // weather, file-reader, calculator
  1: 6,  // + read_file, write_file, search_files, edit_file, diff, run_command
  2: 8,  // + chain runner, router
  3: 10, // + agent loop, permission system
  4: 14, // + orchestrator, evaluator, eval framework
  5: 16, // + CLI components, config, MCP
};

export default function CourseRoadmap() {
  const [activePhase, setActivePhase] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("roadmap");
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const { t, locale } = useLocale();

  const PHASES = getPhases(locale as Locale);
  const ARCHITECTURE = getArchitecture();
  const principles = getPrinciples(locale as Locale);

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      background: "var(--bg)",
      color: "var(--text)",
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
      transition: "background 0.3s ease, color 0.3s ease",
    }}>
      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(var(--grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 10,
        padding: "48px 32px 24px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: "inline-block",
                padding: "4px 12px",
                background: "rgba(232,69,60,0.15)",
                border: "1px solid rgba(232,69,60,0.3)",
                borderRadius: 4,
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "#E8453C",
                marginBottom: 16,
                textTransform: "uppercase",
              }}>
                {t("header.badge")}
              </div>
              <h1 style={{
                fontSize: 36,
                fontWeight: 700,
                lineHeight: 1.2,
                margin: "0 0 8px",
                background: "linear-gradient(135deg, var(--gradient-text-from) 0%, var(--gradient-text-to) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                {t("header.title")}
              </h1>
              <p style={{
                fontSize: 15,
                color: "var(--text-muted)",
                margin: 0,
                maxWidth: 600,
                lineHeight: 1.6,
              }}>
                {t("header.subtitle1")}<br/>
                {t("header.subtitle2")}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ThemeSwitch />
              <a
                href="https://github.com/catundercar/building-effective-agents"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-hover)";
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-hover)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface)";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, marginTop: 32 }}>
            {[
              { key: "roadmap", label: t("tab.roadmap") },
              { key: "arch", label: t("tab.architecture") },
              { key: "principles", label: t("tab.principles") },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "8px 20px",
                  background: activeTab === tab.key ? "var(--tab-active-bg)" : "transparent",
                  border: "1px solid",
                  borderColor: activeTab === tab.key ? "var(--tab-active-border)" : "transparent",
                  borderRadius: 4,
                  color: activeTab === tab.key ? "var(--text)" : "var(--text-dim)",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ position: "relative", zIndex: 10, maxWidth: 960, margin: "0 auto", padding: "32px 32px 80px" }}>

        {activeTab === "roadmap" && (
          <div>
            {/* Timeline */}
            {PHASES.map((phase, i) => {
              const isOpen = activePhase === phase.id;
              return (
                <div key={phase.id} style={{ position: "relative", marginBottom: 2 }}>
                  {/* Connector line with pulse */}
                  {i < PHASES.length - 1 && (
                    <div style={{
                      position: "absolute",
                      left: 19,
                      top: 44,
                      bottom: -2,
                      width: 2,
                      background: `linear-gradient(to bottom, ${phase.color}44, ${PHASES[i+1].color}44)`,
                      borderRadius: 1,
                    }} />
                  )}

                  {/* Phase header */}
                  <button
                    onClick={() => setActivePhase(isOpen ? null : phase.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      width: "100%",
                      padding: "16px 0",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    {/* Icon dot */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: `${phase.color}18`,
                      border: `1px solid ${phase.color}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                      transition: "all 0.3s",
                      boxShadow: isOpen ? `0 0 20px ${phase.color}33` : "none",
                    }}>
                      {phase.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: phase.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          {phase.week}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                          {phase.duration}
                        </span>
                      </div>
                      <div style={{
                        fontSize: 18,
                        fontWeight: 600,
                        color: "var(--text)",
                        margin: "4px 0 2px",
                        transition: "color 0.2s",
                      }}>
                        {phase.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)", fontStyle: "italic" }}>
                        {phase.subtitle}
                      </div>
                      {/* Complexity badge */}
                      <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 6,
                        padding: "2px 8px",
                        background: `${phase.color}0A`,
                        border: `1px solid ${phase.color}18`,
                        borderRadius: 4,
                        fontSize: 10,
                        color: phase.color,
                        fontWeight: 600,
                      }}>
                        {PHASE_TOOL_COUNT[phase.id]} tools
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <div style={{
                      color: "var(--text-dim)",
                      fontSize: 14,
                      transform: isOpen ? "rotate(90deg)" : "rotate(0)",
                      transition: "transform 0.2s",
                      marginTop: 8,
                    }}>
                      →
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div style={{
                      marginLeft: 56,
                      marginBottom: 24,
                      animation: "fadeIn 0.3s ease",
                    }}>
                      {/* Goal */}
                      <div style={{
                        padding: "16px 20px",
                        background: `${phase.color}08`,
                        borderLeft: `2px solid ${phase.color}66`,
                        borderRadius: "0 8px 8px 0",
                        marginBottom: 24,
                        fontSize: 13,
                        lineHeight: 1.7,
                        color: "var(--text-secondary)",
                      }}>
                        {phase.goal}
                      </div>

                      {/* Three columns */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 16, marginBottom: 20 }}>
                        {/* Concepts */}
                        <div style={{
                          padding: 16,
                          background: "var(--surface-card)",
                          border: "1px solid var(--border-faint)",
                          borderRadius: 8,
                        }}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                            {t("phase.concepts")}
                          </div>
                          {phase.concepts.map((c, j) => (
                            <div key={j} style={{
                              fontSize: 12,
                              color: "var(--text-secondary)",
                              padding: "6px 0",
                              borderBottom: j < phase.concepts.length - 1 ? "1px solid var(--border-faint)" : "none",
                              display: "flex",
                              gap: 8,
                            }}>
                              <span style={{ color: phase.color, opacity: 0.6 }}>›</span>
                              {c}
                            </div>
                          ))}
                        </div>

                        {/* Readings */}
                        <div style={{
                          padding: 16,
                          background: "var(--surface-card)",
                          border: "1px solid var(--border-faint)",
                          borderRadius: 8,
                        }}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                            {t("phase.references")}
                          </div>
                          {phase.readings.map((r, j) => (
                            <div key={j} style={{
                              fontSize: 12,
                              color: "var(--text-secondary)",
                              padding: "6px 0",
                              borderBottom: j < phase.readings.length - 1 ? "1px solid rgba(228,228,231,0.04)" : "none",
                              display: "flex",
                              gap: 8,
                            }}>
                              <span style={{ color: "var(--text-dim)" }}>📄</span>
                              {r}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deliverable */}
                      <div style={{
                        padding: 20,
                        background: `linear-gradient(135deg, ${phase.color}0A, ${phase.accent}06)`,
                        border: `1px solid ${phase.color}22`,
                        borderRadius: 8,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <div style={{
                            fontSize: 10,
                            color: phase.color,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            fontWeight: 700,
                          }}>
                            {t("phase.deliverable")}
                          </div>
                          <code style={{
                            fontSize: 13,
                            color: phase.accent,
                            background: `${phase.color}15`,
                            padding: "2px 8px",
                            borderRadius: 4,
                          }}>
                            {phase.deliverable.name}
                          </code>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: "0 0 16px" }}>
                          {phase.deliverable.desc}
                        </p>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                          {t("phase.acceptance")}
                        </div>
                        {phase.deliverable.acceptance.map((a, j) => (
                          <div key={j} style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            padding: "5px 0",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                          }}>
                            <span style={{
                              display: "inline-block",
                              width: 16,
                              height: 16,
                              borderRadius: 3,
                              border: `1px solid ${phase.color}44`,
                              flexShrink: 0,
                              marginTop: 1,
                            }} />
                            {a}
                          </div>
                        ))}
                      </div>

                      {/* 進入課程按鈕 */}
                      {hasLessons(phase.id) && (
                        <Link
                          to={`/phase/${phase.id}/lesson/1`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 16,
                            padding: "10px 20px",
                            background: `${phase.color}18`,
                            border: `1px solid ${phase.color}44`,
                            borderRadius: 6,
                            color: phase.accent,
                            fontSize: 13,
                            textDecoration: "none",
                            fontFamily: "inherit",
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                        >
                          {t("phase.enter")}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "arch" && (
          <div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32, lineHeight: 1.7 }}>
              {t("arch.desc")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ARCHITECTURE.layers.map((layer, i) => {
                const isActive = activeLayer === i;
                const isDimmed = activeLayer !== null && !isActive;
                return (
                  <div
                    key={i}
                    onClick={() => setActiveLayer(isActive ? null : i)}
                    style={{
                      display: "flex",
                      alignItems: "stretch",
                      gap: 0,
                      borderRadius: 8,
                      overflow: "hidden",
                      border: `1px solid ${isActive ? `${layer.color}66` : `${layer.color}22`}`,
                      cursor: "pointer",
                      transition: "all 0.3s",
                      opacity: isDimmed ? 0.35 : 1,
                      transform: isActive ? "scale(1.01)" : "scale(1)",
                    }}
                  >
                    {/* Layer label */}
                    <div style={{
                      width: 180,
                      padding: "16px 20px",
                      background: isActive ? `${layer.color}22` : `${layer.color}12`,
                      borderRight: `1px solid ${layer.color}22`,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      transition: "background 0.3s",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: layer.color }}>
                        {layer.name}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>
                        Phase {ARCHITECTURE.layers.length - 1 - i}
                      </div>
                    </div>
                    {/* Modules */}
                    <div style={{
                      flex: 1,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      padding: 12,
                      background: "var(--surface-card)",
                      alignItems: "center",
                    }}>
                      {layer.modules.map((mod, j) => (
                        <div key={j} style={{
                          padding: "6px 12px",
                          background: isActive ? `${layer.color}18` : `${layer.color}0A`,
                          border: `1px solid ${isActive ? `${layer.color}33` : `${layer.color}18`}`,
                          borderRadius: 4,
                          fontSize: 11,
                          color: isActive ? layer.color : "var(--text-secondary)",
                          transition: "all 0.3s",
                        }}>
                          {mod}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Data flow */}
            <div style={{
              marginTop: 32,
              padding: 24,
              background: "var(--surface-card)",
              border: "1px solid var(--border-faint)",
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
                {t("arch.dataflow")}
              </div>
              <div style={{ fontFamily: "inherit", fontSize: 12, color: "var(--text-muted)", lineHeight: 2.2 }}>
                <span style={{ color: "#E8453C" }}>User Input</span>
                {" → "}
                <span style={{ color: "#E8453C" }}>CLI Parser</span>
                {" → "}
                <span style={{ color: "#7C3AED" }}>Agent Loop</span>
                {" → "}
                <span style={{ color: "#7C3AED" }}>Planner</span>
                {" → "}
                <span style={{ color: "#059669" }}>Workflow Select</span>
                {" → "}
                <span style={{ color: "#2563EB" }}>LLM Call</span>
                {" → "}
                <span style={{ color: "#D97706" }}>Tool Execute</span>
                {" → "}
                <span style={{ color: "#7C3AED" }}>Observe Result</span>
                {" → "}
                <span style={{ color: "#7C3AED" }}>Loop / Complete</span>
              </div>
            </div>

            {/* Agent Loop Simulator */}
            <div style={{ marginTop: 32 }}>
              <div style={{
                fontSize: 10,
                color: "var(--text-muted)",
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                marginBottom: 12,
                fontWeight: 600,
              }}>
                {t("arch.simulator")}
              </div>
              <AgentLoopSimulator color="#7C3AED" accent="#A78BFA" />
            </div>
          </div>
        )}

        {activeTab === "principles" && (
          <div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32, lineHeight: 1.7 }}>
              {t("principles.desc")}
            </p>
            {principles.map((p, i) => (
              <div key={i} style={{
                display: "flex",
                gap: 20,
                padding: "24px 0",
                borderBottom: i < 4 ? "1px solid var(--border-faint)" : "none",
              }}>
                <div style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: `${p.color}33`,
                  lineHeight: 1,
                  flexShrink: 0,
                  width: 48,
                }}>
                  {p.num}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    {p.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
