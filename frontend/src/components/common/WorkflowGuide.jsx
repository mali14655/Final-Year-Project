import React from "react";
import { usePreferences } from "../../hooks/usePreferences";
import { getSectionIdForStep } from "./howItWorksContent";

const STEPS = [
  {
    id: "interviews",
    number: 1,
    title: "Interviews",
    short: "Upload & transcribe",
    detail: "Add audio/video or paste transcripts. Each interview is stored separately with its own transcript.",
  },
  {
    id: "insights",
    number: 2,
    title: "Insights",
    short: "Review per interview",
    detail: "Each interview has its own insights tagged as pain, need, opportunity, and more. Extract and refine before pattern analysis.",
  },
  {
    id: "patterns",
    number: 3,
    title: "Patterns",
    short: "Find cross-user themes",
    detail: "Analyze 2+ interviews together to surface recurring themes, critical issues, and trends.",
  },
  {
    id: "prd",
    number: 4,
    title: "PRD",
    short: "Generate requirements",
    detail: "Turn research into a structured PRD with goals, features, and user stories. Edit and export.",
  },
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WorkflowGuide({
  activeStep = "interviews",
  interviewCount = 0,
  hasInsights = false,
  hasPatterns = false,
  hasPrd = false,
  onStepClick,
  onOpenGuide,
  compact = false,
}) {
  const { showWorkflowHints } = usePreferences();
  if (!showWorkflowHints) return null;

  const stepStatus = {
    interviews: interviewCount > 0 ? "complete" : activeStep === "interviews" ? "active" : "pending",
    insights:
      hasInsights ? "complete" : activeStep === "insights" ? "active" : interviewCount > 0 ? "ready" : "pending",
    patterns:
      hasPatterns ? "complete" : activeStep === "patterns" ? "active" : interviewCount >= 2 ? "ready" : "pending",
    prd: hasPrd ? "complete" : activeStep === "prd" ? "active" : hasPatterns ? "ready" : "pending",
  };

  const activeDetail = STEPS.find((s) => s.id === activeStep)?.detail;

  return (
    <div className={`workflow-guide${compact ? " workflow-guide-compact" : ""}`}>
      <div className="workflow-guide-steps" role="list" aria-label="Research workflow">
        {STEPS.map((step, index) => {
          const status = stepStatus[step.id];
          const isClickable = Boolean(onStepClick);

          return (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <div
                  className={`workflow-guide-connector ${stepStatus[STEPS[index - 1].id] === "complete" ? "is-done" : ""}`}
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                role="listitem"
                className={`workflow-guide-step is-${status}${isClickable ? " is-clickable" : ""}`}
                onClick={isClickable ? () => onStepClick(step.id) : undefined}
                disabled={!isClickable}
                aria-current={status === "active" ? "step" : undefined}
              >
                <span className="workflow-guide-step-num">
                  {status === "complete" ? <CheckIcon /> : step.number}
                </span>
                <span className="workflow-guide-step-text">
                  <span className="workflow-guide-step-title">{step.title}</span>
                  {!compact && <span className="workflow-guide-step-short">{step.short}</span>}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
      {!compact && activeDetail && (
        <div className="workflow-guide-footer">
          <p className="workflow-guide-detail">{activeDetail}</p>
          {onOpenGuide && (
            <button
              type="button"
              className="btn btn-secondary btn-sm workflow-guide-learn-btn"
              onClick={() => onOpenGuide(getSectionIdForStep(activeStep))}
            >
              Open full guide
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkflowGuide;
