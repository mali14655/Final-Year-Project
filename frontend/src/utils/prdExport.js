const LOGO_PATH = "/assets/parseai-wordmark-transparent.png";

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function priorityClass(priority) {
  const level = (priority || "P2").toUpperCase();
  if (level === "P0") return "prd-priority prd-priority-p0";
  if (level === "P1") return "prd-priority prd-priority-p1";
  return "prd-priority prd-priority-p2";
}

function getTimelinePhaseTitle(phase, index) {
  return (
    phase?.phase ||
    phase?.name ||
    phase?.title ||
    (phase?.milestones?.length ? `Phase ${index + 1}` : "")
  );
}

function getMeaningfulTimelinePhases(phases) {
  if (!Array.isArray(phases)) return [];
  return phases
    .map((phase, index) => ({ phase, index, title: getTimelinePhaseTitle(phase, index) }))
    .filter(({ phase, title }) => title || phase?.milestones?.length > 0);
}

export function getPrdLogoUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${LOGO_PATH}`;
  }
  return LOGO_PATH;
}

export function generatePrdBodyHTML(prd, projectName) {
  const title = escapeHtml(prd.title || projectName || "Product Requirements Document");
  const version = escapeHtml(prd.version || "1.0");
  const date = escapeHtml(prd.date || new Date().toISOString().split("T")[0]);
  let html = "";

  html += `<header class="prd-doc-header">`;
  html += `<p class="prd-doc-eyebrow">Product Requirements Document</p>`;
  html += `<h1>${title}</h1>`;
  html += `<div class="prd-doc-meta"><span>Version ${version}</span><span>${date}</span></div>`;
  html += `</header>`;

  if (prd.executiveSummary) {
    html += `<section class="prd-doc-section"><h2>Executive Summary</h2><p>${escapeHtml(prd.executiveSummary)}</p></section>`;
  }

  if (prd.problemStatement) {
    html += `<section class="prd-doc-section"><h2>Problem Statement</h2>`;
    if (prd.problemStatement.problem) {
      html += `<div class="prd-doc-card"><h3>Problem</h3><p>${escapeHtml(prd.problemStatement.problem)}</p></div>`;
    }
    if (prd.problemStatement.impact) {
      html += `<div class="prd-doc-card"><h3>Impact</h3><p>${escapeHtml(prd.problemStatement.impact)}</p></div>`;
    }
    if (prd.problemStatement.currentState) {
      html += `<div class="prd-doc-card"><h3>Current State</h3><p>${escapeHtml(prd.problemStatement.currentState)}</p></div>`;
    }
    if (prd.problemStatement.desiredState) {
      html += `<div class="prd-doc-card"><h3>Desired State</h3><p>${escapeHtml(prd.problemStatement.desiredState)}</p></div>`;
    }
    html += `</section>`;
  }

  if (prd.userPersonas?.length > 0) {
    html += `<section class="prd-doc-section"><h2>User Personas</h2>`;
    prd.userPersonas.forEach((persona, index) => {
      html += `<div class="prd-doc-card">`;
      html += `<h3>${escapeHtml(persona.name || `Persona ${index + 1}`)}</h3>`;
      if (persona.basedOnInterview) {
        html += `<p class="prd-doc-muted">Based on: ${escapeHtml(persona.basedOnInterview)}</p>`;
      }
      if (persona.description) html += `<p>${escapeHtml(persona.description)}</p>`;
      html += `</div>`;
      if (persona.needs?.length) {
        html += `<div class="prd-doc-card prd-doc-card-continued"><p class="prd-doc-label">Needs</p><ul>${persona.needs.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul></div>`;
      }
      if (persona.painPoints?.length) {
        html += `<div class="prd-doc-card prd-doc-card-continued"><p class="prd-doc-label">Pain Points</p><ul>${persona.painPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul></div>`;
      }
    });
    html += `</section>`;
  }

  if (prd.goals?.length > 0 || prd.successMetrics) {
    html += `<section class="prd-doc-section"><h2>Goals &amp; Success Metrics</h2>`;
    prd.goals?.forEach((goal, index) => {
      html += `<div class="prd-doc-card">`;
      html += `<p class="prd-doc-goal-title">${index + 1}. ${escapeHtml(goal.goal)}</p>`;
      if (goal.metric) html += `<p class="prd-doc-muted">Metric: ${escapeHtml(goal.metric)}</p>`;
      if (goal.target) html += `<p class="prd-doc-muted">Target: ${escapeHtml(goal.target)}</p>`;
      html += `</div>`;
    });
    if (prd.successMetrics?.primary?.length) {
      html += `<div class="prd-doc-card"><p class="prd-doc-label">Primary Metrics</p><ul>${prd.successMetrics.primary.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul></div>`;
    }
    if (prd.successMetrics?.secondary?.length) {
      html += `<div class="prd-doc-card"><p class="prd-doc-label">Secondary Metrics</p><ul>${prd.successMetrics.secondary.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul></div>`;
    }
    html += `</section>`;
  }

  if (prd.features?.length > 0) {
    html += `<section class="prd-doc-section"><h2>Features &amp; Requirements</h2>`;
    prd.features.forEach((feature, index) => {
      const pri = (feature.priority || "P2").toUpperCase();
      html += `<div class="prd-doc-card">`;
      html += `<div class="prd-doc-card-head"><h3>${escapeHtml(feature.name || `Feature ${index + 1}`)}</h3>`;
      html += `<span class="${priorityClass(pri)}">${pri}</span></div>`;
      if (feature.description) html += `<p>${escapeHtml(feature.description)}</p>`;
      html += `</div>`;

      if (feature.userStories?.length) {
        feature.userStories.forEach((story, storyIdx) => {
          html += `<div class="prd-doc-card prd-doc-card-continued">`;
          if (storyIdx === 0) html += `<p class="prd-doc-label">User Stories</p>`;
          html += `<p>${escapeHtml(story.story)}</p>`;
          html += `</div>`;

          if (story.acceptanceCriteria?.length) {
            story.acceptanceCriteria.forEach((criterion, criterionIdx) => {
              html += `<div class="prd-doc-card prd-doc-card-continued prd-doc-card-nested">`;
              if (criterionIdx === 0) html += `<p class="prd-doc-label">Acceptance Criteria</p>`;
              html += `<p>${escapeHtml(criterion)}</p>`;
              html += `</div>`;
            });
          }
        });
      }

      if (feature.dependencies?.length || feature.risks?.length) {
        html += `<div class="prd-doc-card prd-doc-card-continued">`;
        if (feature.dependencies?.length) {
          html += `<p class="prd-doc-muted"><strong>Dependencies:</strong> ${escapeHtml(feature.dependencies.join(", "))}</p>`;
        }
        if (feature.risks?.length) {
          html += `<p class="prd-doc-label">Risks</p><ul>${feature.risks.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>`;
        }
        html += `</div>`;
      }
    });
    html += `</section>`;
  }

  const timelinePhases = getMeaningfulTimelinePhases(prd.timeline?.phases);
  if (timelinePhases.length > 0) {
    html += `<section class="prd-doc-section"><h2>Timeline</h2>`;
    timelinePhases.forEach(({ phase, index, title }) => {
      html += `<div class="prd-doc-card">`;
      html += `<p class="prd-doc-goal-title">${escapeHtml(title)}`;
      if (phase.duration) html += ` <span class="prd-doc-muted">(${escapeHtml(phase.duration)})</span>`;
      html += `</p>`;
      if (phase.milestones?.length) {
        html += `<ul>${phase.milestones.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul>`;
      }
      html += `</div>`;
    });
    html += `</section>`;
  }

  return html;
}

export function getPrdPrintStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 0.55in 0.65in 0.55in 0.65in;
    }

    html, body {
      width: 100%;
      height: auto;
    }

    body {
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.55;
      color: #0f172a;
      background: #fff;
      padding: 0;
      margin: 0;
      font-size: 10.5pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .prd-print-layout {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
    }

    .prd-print-layout thead,
    .prd-print-layout tfoot,
    .prd-print-layout tbody {
      display: table-row-group;
    }

    .prd-print-layout thead {
      display: table-header-group;
    }

    .prd-print-layout tfoot {
      display: table-footer-group;
    }

    .prd-print-layout td {
      border: 0;
      padding: 0;
      vertical-align: top;
    }

    .prd-print-top-spacer {
      height: 0;
    }

    /* Reserved on every printed page — content cannot flow here */
    .prd-print-bottom-reserve {
      height: 1.15in;
      position: relative;
      overflow: hidden;
      pointer-events: none;
    }

    .prd-print-footer-logo {
      position: absolute;
      right: 0;
      bottom: 0.22in;
      height: 28px;
      width: auto;
      display: block;
      opacity: 0.92;
    }

    .prd-print-main {
      width: 100%;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }

    .prd-doc-card-nested {
      padding: 0.5rem 0.65rem;
      margin-bottom: 0.4rem;
    }

    .prd-doc-header {
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #0ea5e9;
      break-after: avoid;
      page-break-after: avoid;
    }

    .prd-doc-eyebrow {
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #0284c7;
      margin-bottom: 0.35rem;
    }

    h1 {
      font-size: 1.45rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0f172a;
      margin-bottom: 0.35rem;
      line-height: 1.2;
      break-after: avoid;
      page-break-after: avoid;
    }

    h2 {
      font-size: 12pt;
      font-weight: 650;
      color: #0284c7;
      margin: 1rem 0 0.55rem;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid #e0f2fe;
      break-after: avoid;
      page-break-after: avoid;
    }

    .prd-doc-section > h2 {
      margin-top: 0.85rem;
    }

    .prd-doc-section:first-of-type > h2 {
      margin-top: 0;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 0.35rem;
      break-after: avoid;
      page-break-after: avoid;
    }

    p {
      margin-bottom: 0.5rem;
      color: #334155;
      orphans: 3;
      widows: 3;
    }

    ul, ol {
      margin: 0 0 0.55rem 1.15rem;
      color: #334155;
      padding-left: 0.2rem;
    }

    li {
      margin-bottom: 0.25rem;
      orphans: 2;
      widows: 2;
    }

    .prd-doc-meta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 9pt;
      color: #64748b;
    }

    .prd-doc-section {
      margin-bottom: 0.65rem;
      break-inside: auto;
      page-break-inside: auto;
    }

    .prd-doc-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #38bdf8;
      border-radius: 6px;
      padding: 0.65rem 0.75rem;
      margin-bottom: 0.55rem;
      break-inside: avoid;
      page-break-inside: avoid;
      -webkit-column-break-inside: avoid;
    }

    .prd-doc-card-continued {
      margin-top: -0.15rem;
    }

    .prd-doc-card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.65rem;
      margin-bottom: 0.25rem;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .prd-doc-muted {
      font-size: 9.5pt;
      color: #64748b;
      margin-bottom: 0.35rem;
    }

    .prd-doc-label {
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0369a1;
      margin: 0.35rem 0 0.2rem;
      break-after: avoid;
      page-break-after: avoid;
    }

    .prd-doc-goal-title {
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }

    .prd-priority {
      display: inline-block;
      font-size: 7pt;
      font-weight: 700;
      padding: 0.12rem 0.4rem;
      border-radius: 999px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .prd-priority-p0 { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .prd-priority-p1 { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .prd-priority-p2 { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }

    @media print {
      .prd-doc-card {
        background: #f8fafc !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .prd-print-layout thead {
        display: table-header-group;
      }

      .prd-print-layout tfoot {
        display: table-footer-group;
      }

      .prd-print-layout tbody {
        display: table-row-group;
      }

      .prd-print-bottom-reserve {
        height: 1.15in;
      }
    }

    @media screen {
      body {
        padding: 1.25rem 1.5rem 1.5rem;
        max-width: 820px;
        margin: 0 auto;
      }

      .prd-print-bottom-reserve {
        height: 0.9in;
      }
    }
  `;
}

export function buildPrdPrintDocument(prd, projectName) {
  const logoUrl = getPrdLogoUrl();
  const title = escapeHtml(prd.title || projectName || "PRD");
  const body = generatePrdBodyHTML(prd, projectName);

  return `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8">
    <style>${getPrdPrintStyles()}</style>
  </head>
  <body>
    <table class="prd-print-layout">
      <thead>
        <tr><td><div class="prd-print-top-spacer"></div></td></tr>
      </thead>
      <tfoot>
        <tr>
          <td>
            <div class="prd-print-bottom-reserve" aria-hidden="true">
              <img class="prd-print-footer-logo" src="${logoUrl}" alt="ParseAi" />
            </div>
          </td>
        </tr>
      </tfoot>
      <tbody>
        <tr>
          <td>
            <main class="prd-print-main">${body}</main>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
}

export function openPrdPrintWindow(prd, projectName) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(buildPrdPrintDocument(prd, projectName));
  printWindow.document.close();

  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  const logoImg = printWindow.document.querySelector(".prd-print-footer-logo");
  if (logoImg && !logoImg.complete) {
    logoImg.addEventListener("load", () => setTimeout(triggerPrint, 150), { once: true });
    logoImg.addEventListener("error", () => setTimeout(triggerPrint, 150), { once: true });
    setTimeout(triggerPrint, 1200);
  } else {
    setTimeout(triggerPrint, 350);
  }
}

export function generatePrdMarkdown(prd, projectName) {
  let md = `# ${prd.title || projectName || "Product Requirements Document"}\n\n`;
  md += `**Version:** ${prd.version || "1.0"}  \n`;
  md += `**Date:** ${prd.date || new Date().toISOString().split("T")[0]}\n\n`;
  md += `---\n\n`;

  if (prd.executiveSummary) md += `## Executive Summary\n\n${prd.executiveSummary}\n\n`;

  if (prd.problemStatement) {
    md += `## Problem Statement\n\n`;
    if (prd.problemStatement.problem) md += `### Problem\n${prd.problemStatement.problem}\n\n`;
    if (prd.problemStatement.impact) md += `### Impact\n${prd.problemStatement.impact}\n\n`;
    if (prd.problemStatement.currentState) md += `### Current State\n${prd.problemStatement.currentState}\n\n`;
    if (prd.problemStatement.desiredState) md += `### Desired State\n${prd.problemStatement.desiredState}\n\n`;
  }

  if (prd.userPersonas?.length) {
    md += `## User Personas\n\n`;
    prd.userPersonas.forEach((persona, index) => {
      md += `### ${persona.name || `Persona ${index + 1}`}\n\n`;
      if (persona.basedOnInterview) md += `*Based on: ${persona.basedOnInterview}*\n\n`;
      if (persona.description) md += `${persona.description}\n\n`;
      if (persona.needs?.length) {
        md += `**Needs:**\n${persona.needs.map((n) => `- ${n}`).join("\n")}\n\n`;
      }
      if (persona.painPoints?.length) {
        md += `**Pain Points:**\n${persona.painPoints.map((p) => `- ${p}`).join("\n")}\n\n`;
      }
    });
  }

  if (prd.goals?.length) {
    md += `## Goals & Success Metrics\n\n`;
    prd.goals.forEach((goal, index) => {
      md += `${index + 1}. **${goal.goal}**\n`;
      if (goal.metric) md += `   - Metric: ${goal.metric}\n`;
      if (goal.target) md += `   - Target: ${goal.target}\n`;
      md += `\n`;
    });
  }

  if (prd.features?.length) {
    md += `## Features & Requirements\n\n`;
    prd.features.forEach((feature) => {
      md += `### ${feature.name || "Feature"}\n\n`;
      md += `**Priority:** ${feature.priority || "P2"}\n\n`;
      if (feature.description) md += `${feature.description}\n\n`;
      if (feature.userStories?.length) {
        md += `#### User Stories\n\n`;
        feature.userStories.forEach((story) => {
          if (story.story) md += `- ${story.story}\n`;
          story.acceptanceCriteria?.forEach((c) => {
            md += `  - ${c}\n`;
          });
        });
        md += `\n`;
      }
      if (feature.dependencies?.length) md += `**Dependencies:** ${feature.dependencies.join(", ")}\n\n`;
      if (feature.risks?.length) md += `**Risks:**\n${feature.risks.map((r) => `- ${r}`).join("\n")}\n\n`;
      md += `---\n\n`;
    });
  }

  if (prd.timeline?.phases?.length) {
    md += `## Timeline\n\n`;
    prd.timeline.phases.forEach((phase) => {
      md += `### ${phase.phase || "Phase"}\n`;
      if (phase.duration) md += `**Duration:** ${phase.duration}\n`;
      phase.milestones?.forEach((m) => {
        md += `- ${m}\n`;
      });
      md += `\n`;
    });
  }

  if (prd.successMetrics) {
    md += `## Success Metrics\n\n`;
    if (prd.successMetrics.primary?.length) {
      md += `### Primary Metrics\n${prd.successMetrics.primary.map((m) => `- ${m}`).join("\n")}\n\n`;
    }
    if (prd.successMetrics.secondary?.length) {
      md += `### Secondary Metrics\n${prd.successMetrics.secondary.map((m) => `- ${m}`).join("\n")}\n\n`;
    }
  }

  md += `---\n\n*Generated with ParseAi — interview research, patterns, and PRD generation*\n`;
  return md;
}

export function downloadPrdMarkdown(prd, projectName) {
  const markdown = generatePrdMarkdown(prd, projectName);
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(prd.title || projectName || "prd").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_prd.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { priorityClass };
