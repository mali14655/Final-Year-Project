import React from "react";
import { StepEyebrow } from "../../hooks/usePreferences";

function PatternsPanel({
  interviewCount,
  patterns,
  hasPatterns,
  isAnalyzing,
  onAnalyze,
  onGoToInterviews,
}) {
  if (interviewCount < 2) {
    return (
      <div className="surface-card patterns-panel">
        <div className="interview-detail-empty">
          <StepEyebrow step={3} label="Step 3" />
          <p className="heading-md" style={{ margin: "0 0 0.35rem" }}>
            Cross-interview patterns
          </p>
          <p className="text-muted" style={{ margin: 0, fontSize: "0.9rem", maxWidth: "28rem" }}>
            Add at least two interviews, then analyze them together to surface recurring themes and pain points across participants.
          </p>
          <button
            type="button"
            onClick={onGoToInterviews}
            className="btn btn-secondary"
            style={{ marginTop: "1.25rem" }}
          >
            Go to interviews
          </button>
        </div>
      </div>
    );
  }

  const summary = patterns?.summary;

  return (
    <div className="surface-card patterns-panel">
      <div className="panel-header-row">
        <div className="panel-header-copy">
          <StepEyebrow step={3} label="Step 3" />
          <h3 className="heading-md">Patterns &amp; trends</h3>
          <p className="panel-header-desc">
            AI groups similar insights from {interviewCount} interviews into recurring themes with frequency scores.
          </p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="btn btn-primary btn-sm"
        >
          {isAnalyzing ? "Analyzing…" : hasPatterns ? "Re-analyze" : "Analyze patterns"}
        </button>
      </div>

      {summary && (summary.topThemes?.length > 0 || summary.criticalIssues?.length > 0 || summary.emergingTrends?.length > 0) && (
        <div className="patterns-summary-card">
          {summary.topThemes?.length > 0 && (
            <div className="patterns-summary-row">
              <span className="patterns-summary-label is-theme">Top themes</span>
              <p className="patterns-summary-value">{summary.topThemes.join(", ")}</p>
            </div>
          )}
          {summary.criticalIssues?.length > 0 && (
            <div className="patterns-summary-row">
              <span className="patterns-summary-label is-critical">Critical issues</span>
              <p className="patterns-summary-value">{summary.criticalIssues.join(", ")}</p>
            </div>
          )}
          {summary.emergingTrends?.length > 0 && (
            <div className="patterns-summary-row">
              <span className="patterns-summary-label is-trend">Emerging trends</span>
              <p className="patterns-summary-value">{summary.emergingTrends.join(", ")}</p>
            </div>
          )}
        </div>
      )}

      {hasPatterns ? (
        <div className="patterns-list">
          {patterns.patterns.map((pattern, index) => (
            <article key={pattern.name || index} className="pattern-card">
              <div className="pattern-card-header">
                <h4 className="pattern-card-title">{pattern.name}</h4>
                <span className="pattern-frequency-badge">{pattern.frequencyPercentage}%</span>
              </div>
              <p className="pattern-card-desc">{pattern.description}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="patterns-empty-state">
          <p className="heading-md" style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>
            Ready to analyze
          </p>
          <p className="text-muted" style={{ margin: 0, fontSize: "0.875rem" }}>
            No patterns yet. Click &quot;Analyze patterns&quot; to find recurring themes across your {interviewCount} interviews.
          </p>
        </div>
      )}
    </div>
  );
}

export default PatternsPanel;
