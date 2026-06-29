import React from "react";

function PRDPreview({ prd, projectName, onRegenerate }) {
  const exportToMarkdown = () => {
    const markdown = generateMarkdown(prd, projectName);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_prd.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generatePrintHTML = (prd, projectName) => {
    let html = `<h1>${prd.title || projectName || "Product Requirements Document"}</h1>`;
    html += `<p><strong>Version:</strong> ${prd.version || "1.0"} • <strong>Date:</strong> ${prd.date || new Date().toISOString().split("T")[0]}</p>`;
    html += `<hr>`;

    // Executive Summary
    if (prd.executiveSummary) {
      html += `<section><h2>Executive Summary</h2><p>${prd.executiveSummary}</p></section>`;
    }

    // Problem Statement
    if (prd.problemStatement) {
      html += `<section><h2>Problem Statement</h2>`;
      if (prd.problemStatement.problem) {
        html += `<div><h3>Problem</h3><p>${prd.problemStatement.problem}</p></div>`;
      }
      if (prd.problemStatement.impact) {
        html += `<div><h3>Impact</h3><p>${prd.problemStatement.impact}</p></div>`;
      }
      if (prd.problemStatement.currentState) {
        html += `<div><h3>Current State</h3><p>${prd.problemStatement.currentState}</p></div>`;
      }
      if (prd.problemStatement.desiredState) {
        html += `<div><h3>Desired State</h3><p>${prd.problemStatement.desiredState}</p></div>`;
      }
      html += `</section>`;
    }

    // User Personas
    if (prd.userPersonas && prd.userPersonas.length > 0) {
      html += `<section><h2>User Personas</h2>`;
      prd.userPersonas.forEach((persona, index) => {
        html += `<div class="section-block">`;
        html += `<h3>${persona.name || `Persona ${index + 1}`}</h3>`;
        if (persona.basedOnInterview) html += `<p><em>Based on: ${persona.basedOnInterview}</em></p>`;
        if (persona.description) html += `<p>${persona.description}</p>`;
        if (persona.needs && persona.needs.length > 0) {
          html += `<p><strong>Needs:</strong></p><ul>`;
          persona.needs.forEach((need) => html += `<li>${need}</li>`);
          html += `</ul>`;
        }
        if (persona.painPoints && persona.painPoints.length > 0) {
          html += `<p><strong>Pain Points:</strong></p><ul>`;
          persona.painPoints.forEach((pain) => html += `<li>${pain}</li>`);
          html += `</ul>`;
        }
        html += `</div>`;
      });
      html += `</section>`;
    }

    // Goals
    if (prd.goals && prd.goals.length > 0) {
      html += `<section><h2>Goals & Success Metrics</h2>`;
      prd.goals.forEach((goal, index) => {
        html += `<div class="section-block">`;
        html += `<p><strong>${index + 1}. ${goal.goal}</strong></p>`;
        if (goal.metric) html += `<p>Metric: ${goal.metric}</p>`;
        if (goal.target) html += `<p>Target: ${goal.target}</p>`;
        html += `</div>`;
      });
      html += `</section>`;
    }

    // Features
    if (prd.features && prd.features.length > 0) {
      html += `<section><h2>Features & Requirements</h2>`;
      prd.features.forEach((feature, index) => {
        html += `<div class="section-block">`;
        html += `<h3>${feature.name || `Feature ${index + 1}`} <span class="priority-badge">${feature.priority || "P2"}</span></h3>`;
        if (feature.description) html += `<p>${feature.description}</p>`;

        if (feature.userStories && feature.userStories.length > 0) {
          html += `<p><strong>User Stories:</strong></p><ul>`;
          feature.userStories.forEach((story) => {
            html += `<li>${story.story}`;
            if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
              html += `<ul>`;
              story.acceptanceCriteria.forEach((criteria) => html += `<li>${criteria}</li>`);
              html += `</ul>`;
            }
            html += `</li>`;
          });
          html += `</ul>`;
        }

        if (feature.dependencies && feature.dependencies.length > 0) {
          html += `<p><strong>Dependencies:</strong> ${feature.dependencies.join(", ")}</p>`;
        }

        if (feature.risks && feature.risks.length > 0) {
          html += `<p><strong>Risks:</strong></p><ul>`;
          feature.risks.forEach((risk) => html += `<li>${risk}</li>`);
          html += `</ul>`;
        }
        html += `</div>`;
      });
      html += `</section>`;
    }

    // Timeline
    if (prd.timeline && prd.timeline.phases && prd.timeline.phases.length > 0) {
      html += `<section><h2>Timeline</h2>`;
      prd.timeline.phases.forEach((phase) => {
        html += `<div class="section-block">`;
        html += `<p><strong>${phase.phase}</strong>`;
        if (phase.duration) html += ` (${phase.duration})`;
        html += `</p>`;
        if (phase.milestones && phase.milestones.length > 0) {
          html += `<ul>`;
          phase.milestones.forEach((milestone) => html += `<li>${milestone}</li>`);
          html += `</ul>`;
        }
        html += `</div>`;
      });
      html += `</section>`;
    }

    // Success Metrics
    if (prd.successMetrics) {
      html += `<section><h2>Success Metrics</h2>`;
      if (prd.successMetrics.primary && prd.successMetrics.primary.length > 0) {
        html += `<p><strong>Primary Metrics:</strong></p><ul>`;
        prd.successMetrics.primary.forEach((metric) => html += `<li>${metric}</li>`);
        html += `</ul>`;
      }
      if (prd.successMetrics.secondary && prd.successMetrics.secondary.length > 0) {
        html += `<p><strong>Secondary Metrics:</strong></p><ul>`;
        prd.successMetrics.secondary.forEach((metric) => html += `<li>${metric}</li>`);
        html += `</ul>`;
      }
      html += `</section>`;
    }

    return html;
  };

  const exportToPDF = () => {
    // Create a new window with clean HTML for printing
    const printWindow = window.open("", "_blank");
    const printContent = generatePrintHTML(prd, projectName);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${prd.title || projectName || "PRD"}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              line-height: 1.6;
              color: #000;
              background: #fff;
              padding: 2rem;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              font-size: 2rem;
              margin-bottom: 0.5rem;
              color: #000;
              page-break-after: avoid;
            }
            h2 {
              font-size: 1.5rem;
              margin-top: 2rem;
              margin-bottom: 1rem;
              color: #000;
              page-break-after: avoid;
            }
            h3 {
              font-size: 1.25rem;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
              color: #000;
              page-break-after: avoid;
            }
            p {
              margin-bottom: 1rem;
              color: #000;
            }
            ul, ol {
              margin-left: 1.5rem;
              margin-bottom: 1rem;
              color: #000;
            }
            li {
              margin-bottom: 0.5rem;
            }
            section {
              margin-bottom: 2rem;
              page-break-inside: avoid;
            }
            hr {
              margin: 2rem 0;
              border: none;
              border-top: 1px solid #ccc;
            }
            .section-block {
              background: #f9fafb;
              padding: 1rem;
              border-radius: 0.5rem;
              margin-bottom: 1rem;
              border: 1px solid #e5e7eb;
            }
            .priority-badge {
              display: inline-block;
              padding: 0.25rem 0.5rem;
              border-radius: 0.25rem;
              font-size: 0.75rem;
              font-weight: 600;
              margin-left: 0.5rem;
              background: #e5e7eb;
              color: #000;
            }
            @media print {
              body {
                padding: 1rem;
              }
              .section-block {
                background: #fff;
                border: 1px solid #000;
                page-break-inside: avoid;
              }
              section {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const generateMarkdown = (prd, projectName) => {
    let md = `# ${prd.title || projectName || "Product Requirements Document"}\n\n`;
    md += `**Version:** ${prd.version || "1.0"}\n`;
    md += `**Date:** ${prd.date || new Date().toISOString().split("T")[0]}\n\n`;
    md += `---\n\n`;

    // Executive Summary
    if (prd.executiveSummary) {
      md += `## Executive Summary\n\n${prd.executiveSummary}\n\n`;
    }

    // Problem Statement
    if (prd.problemStatement) {
      md += `## Problem Statement\n\n`;
      if (prd.problemStatement.problem) {
        md += `### Problem\n${prd.problemStatement.problem}\n\n`;
      }
      if (prd.problemStatement.impact) {
        md += `### Impact\n${prd.problemStatement.impact}\n\n`;
      }
      if (prd.problemStatement.currentState) {
        md += `### Current State\n${prd.problemStatement.currentState}\n\n`;
      }
      if (prd.problemStatement.desiredState) {
        md += `### Desired State\n${prd.problemStatement.desiredState}\n\n`;
      }
    }

    // User Personas
    if (prd.userPersonas && prd.userPersonas.length > 0) {
      md += `## User Personas\n\n`;
      prd.userPersonas.forEach((persona, index) => {
        md += `### ${persona.name || `Persona ${index + 1}`}\n\n`;
        if (persona.basedOnInterview) md += `*Based on: ${persona.basedOnInterview}*\n\n`;
        if (persona.description) md += `${persona.description}\n\n`;
        if (persona.needs && persona.needs.length > 0) {
          md += `**Needs:**\n`;
          persona.needs.forEach((need) => {
            md += `- ${need}\n`;
          });
          md += `\n`;
        }
        if (persona.painPoints && persona.painPoints.length > 0) {
          md += `**Pain Points:**\n`;
          persona.painPoints.forEach((pain) => {
            md += `- ${pain}\n`;
          });
          md += `\n`;
        }
      });
    }

    // Goals
    if (prd.goals && prd.goals.length > 0) {
      md += `## Goals & Success Metrics\n\n`;
      prd.goals.forEach((goal, index) => {
        md += `${index + 1}. **${goal.goal || "Goal"}**\n`;
        if (goal.metric) md += `   - Metric: ${goal.metric}\n`;
        if (goal.target) md += `   - Target: ${goal.target}\n`;
        md += `\n`;
      });
    }

    // Features
    if (prd.features && prd.features.length > 0) {
      md += `## Features & Requirements\n\n`;
      prd.features.forEach((feature) => {
        md += `### ${feature.name || "Feature"}\n\n`;
        md += `**Priority:** ${feature.priority || "P2"}\n\n`;
        if (feature.description) {
          md += `${feature.description}\n\n`;
        }

        // User Stories
        if (feature.userStories && feature.userStories.length > 0) {
          md += `#### User Stories\n\n`;
          feature.userStories.forEach((story) => {
            if (story.story) md += `- ${story.story}\n`;
            if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
              story.acceptanceCriteria.forEach((criteria) => {
                md += `  - ${criteria}\n`;
              });
            }
          });
          md += `\n`;
        }

        // Dependencies
        if (feature.dependencies && feature.dependencies.length > 0) {
          md += `**Dependencies:** ${feature.dependencies.join(", ")}\n\n`;
        }

        // Risks
        if (feature.risks && feature.risks.length > 0) {
          md += `**Risks:**\n`;
          feature.risks.forEach((risk) => {
            md += `- ${risk}\n`;
          });
          md += `\n`;
        }

        md += `---\n\n`;
      });
    }

    // Timeline
    if (prd.timeline && prd.timeline.phases && prd.timeline.phases.length > 0) {
      md += `## Timeline\n\n`;
      prd.timeline.phases.forEach((phase) => {
        md += `### ${phase.phase || "Phase"}\n`;
        if (phase.duration) md += `**Duration:** ${phase.duration}\n`;
        if (phase.milestones && phase.milestones.length > 0) {
          md += `**Milestones:**\n`;
          phase.milestones.forEach((milestone) => {
            md += `- ${milestone}\n`;
          });
        }
        md += `\n`;
      });
    }

    // Success Metrics
    if (prd.successMetrics) {
      md += `## Success Metrics\n\n`;
      if (prd.successMetrics.primary && prd.successMetrics.primary.length > 0) {
        md += `### Primary Metrics\n`;
        prd.successMetrics.primary.forEach((metric) => {
          md += `- ${metric}\n`;
        });
        md += `\n`;
      }
      if (prd.successMetrics.secondary && prd.successMetrics.secondary.length > 0) {
        md += `### Secondary Metrics\n`;
        prd.successMetrics.secondary.forEach((metric) => {
          md += `- ${metric}\n`;
        });
        md += `\n`;
      }
    }

    return md;
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#0f172a",
          }}
        >
          PRD Generated Successfully
        </h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={exportToMarkdown}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              color: "#0f172a",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Export MD
          </button>
          <button
            onClick={exportToPDF}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              color: "#0f172a",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Export PDF
          </button>
          <button
            onClick={onRegenerate}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              color: "#0f172a",
              fontSize: "0.85rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Regenerate
          </button>
        </div>
      </div>

      <div
        id="prd-content"
        className="prd-print-content"
        style={{
          maxHeight: "600px",
          overflowY: "auto",
          padding: "1rem",
          backgroundColor: "#f8fafc",
          borderRadius: "0.5rem",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            color: "#334155",
            fontSize: "0.9rem",
            lineHeight: "1.6",
          }}
        >
          {/* Title */}
          <h1 style={{ color: "#0f172a", marginBottom: "0.5rem" }}>
            {prd.title || projectName || "Product Requirements Document"}
          </h1>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
            Version {prd.version || "1.0"} • {prd.date || new Date().toISOString().split("T")[0]}
          </p>

          {/* Executive Summary */}
          {prd.executiveSummary && (
            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#0f172a", marginBottom: "0.75rem" }}>Executive Summary</h2>
              <p>{prd.executiveSummary}</p>
            </section>
          )}

          {/* Problem Statement */}
          {prd.problemStatement && (
            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#0f172a", marginBottom: "0.75rem" }}>Problem Statement</h2>
              {prd.problemStatement.problem && (
                <div style={{ marginBottom: "1rem" }}>
                  <h3 style={{ color: "#334155", fontSize: "1rem", marginBottom: "0.5rem" }}>
                    Problem
                  </h3>
                  <p>{prd.problemStatement.problem}</p>
                </div>
              )}
              {prd.problemStatement.impact && (
                <div style={{ marginBottom: "1rem" }}>
                  <h3 style={{ color: "#334155", fontSize: "1rem", marginBottom: "0.5rem" }}>
                    Impact
                  </h3>
                  <p>{prd.problemStatement.impact}</p>
                </div>
              )}
              {prd.problemStatement.currentState && (
                <div style={{ marginBottom: "1rem" }}>
                  <h3 style={{ color: "#334155", fontSize: "1rem", marginBottom: "0.5rem" }}>
                    Current State
                  </h3>
                  <p>{prd.problemStatement.currentState}</p>
                </div>
              )}
              {prd.problemStatement.desiredState && (
                <div>
                  <h3 style={{ color: "#334155", fontSize: "1rem", marginBottom: "0.5rem" }}>
                    Desired State
                  </h3>
                  <p>{prd.problemStatement.desiredState}</p>
                </div>
              )}
            </section>
          )}

          {/* User Personas */}
          {prd.userPersonas && prd.userPersonas.length > 0 && (
            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#0f172a", marginBottom: "0.75rem" }}>User Personas</h2>
              {prd.userPersonas.map((persona, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                    backgroundColor: "#f8fafc",
                    borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h3 style={{ color: "#0f172a", marginBottom: "0.5rem" }}>
                    {persona.name || `Persona ${index + 1}`}
                  </h3>
                  {persona.basedOnInterview && (
                    <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                      Based on: {persona.basedOnInterview}
                    </p>
                  )}
                  {persona.description && <p style={{ marginBottom: "0.75rem" }}>{persona.description}</p>}
                  {persona.needs && persona.needs.length > 0 && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <strong style={{ color: "#334155" }}>Needs:</strong>
                      <ul style={{ marginLeft: "1.5rem", marginTop: "0.25rem" }}>
                        {persona.needs.map((need, i) => (
                          <li key={i}>{need}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {persona.painPoints && persona.painPoints.length > 0 && (
                    <div>
                      <strong style={{ color: "#334155" }}>Pain Points:</strong>
                      <ul style={{ marginLeft: "1.5rem", marginTop: "0.25rem" }}>
                        {persona.painPoints.map((pain, i) => (
                          <li key={i}>{pain}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Goals */}
          {prd.goals && prd.goals.length > 0 && (
            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#0f172a", marginBottom: "0.75rem" }}>Goals & Success Metrics</h2>
              {prd.goals.map((goal, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "1rem",
                    padding: "0.75rem",
                    backgroundColor: "#f8fafc",
                    borderRadius: "0.5rem",
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>{index + 1}. {goal.goal}</strong>
                  {goal.metric && (
                    <div style={{ marginTop: "0.25rem", fontSize: "0.85rem", color: "#64748b" }}>
                      Metric: {goal.metric}
                    </div>
                  )}
                  {goal.target && (
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      Target: {goal.target}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Features */}
          {prd.features && prd.features.length > 0 && (
            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#0f172a", marginBottom: "0.75rem" }}>Features & Requirements</h2>
              {prd.features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                    backgroundColor: "#f8fafc",
                    borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                    <h3 style={{ color: "#0f172a" }}>{feature.name || `Feature ${index + 1}`}</h3>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        backgroundColor: feature.priority === "P0" ? "#7f1d1d" : feature.priority === "P1" ? "#92400e" : "#1e3a8a",
                        color: "#fff",
                        fontWeight: 600,
                      }}
                    >
                      {feature.priority || "P2"}
                    </span>
                  </div>
                  {feature.description && <p style={{ marginBottom: "0.75rem" }}>{feature.description}</p>}

                  {feature.userStories && feature.userStories.length > 0 && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <strong style={{ color: "#334155" }}>User Stories:</strong>
                      <ul style={{ marginLeft: "1.5rem", marginTop: "0.25rem" }}>
                        {feature.userStories.map((story, i) => (
                          <li key={i} style={{ marginBottom: "0.5rem" }}>
                            <div>{story.story}</div>
                            {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
                              <ul style={{ marginLeft: "1rem", marginTop: "0.25rem", fontSize: "0.85rem", color: "#64748b" }}>
                                {story.acceptanceCriteria.map((criteria, j) => (
                                  <li key={j}>{criteria}</li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feature.dependencies && feature.dependencies.length > 0 && (
                    <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem", color: "#64748b" }}>
                      <strong>Dependencies:</strong> {feature.dependencies.join(", ")}
                    </div>
                  )}

                  {feature.risks && feature.risks.length > 0 && (
                    <div style={{ fontSize: "0.85rem" }}>
                      <strong style={{ color: "#334155" }}>Risks:</strong>
                      <ul style={{ marginLeft: "1.5rem", marginTop: "0.25rem", color: "#64748b" }}>
                        {feature.risks.map((risk, i) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Timeline */}
          {prd.timeline && prd.timeline.phases && prd.timeline.phases.length > 0 && (
            <section style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#0f172a", marginBottom: "0.75rem" }}>Timeline</h2>
              {prd.timeline.phases.map((phase, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "1rem",
                    padding: "0.75rem",
                    backgroundColor: "#f8fafc",
                    borderRadius: "0.5rem",
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>{phase.phase}</strong>
                  {phase.duration && (
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem", color: "#64748b" }}>
                      ({phase.duration})
                    </span>
                  )}
                  {phase.milestones && phase.milestones.length > 0 && (
                    <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem", fontSize: "0.85rem", color: "#64748b" }}>
                      {phase.milestones.map((milestone, i) => (
                        <li key={i}>{milestone}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Success Metrics */}
          {prd.successMetrics && (
            <section>
              <h2 style={{ color: "#0f172a", marginBottom: "0.75rem" }}>Success Metrics</h2>
              {prd.successMetrics.primary && prd.successMetrics.primary.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <strong style={{ color: "#334155" }}>Primary Metrics:</strong>
                  <ul style={{ marginLeft: "1.5rem", marginTop: "0.25rem" }}>
                    {prd.successMetrics.primary.map((metric, i) => (
                      <li key={i}>{metric}</li>
                    ))}
                  </ul>
                </div>
              )}
              {prd.successMetrics.secondary && prd.successMetrics.secondary.length > 0 && (
                <div>
                  <strong style={{ color: "#334155" }}>Secondary Metrics:</strong>
                  <ul style={{ marginLeft: "1.5rem", marginTop: "0.25rem" }}>
                    {prd.successMetrics.secondary.map((metric, i) => (
                      <li key={i}>{metric}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default PRDPreview;
