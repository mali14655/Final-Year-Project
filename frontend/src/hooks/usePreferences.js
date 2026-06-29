import { useAuth } from "../context/AuthContext";

const DEFAULT_PREFERENCES = {
  showWorkflowHints: true,
  compactView: false,
};

export function usePreferences() {
  const { user } = useAuth();
  const prefs = user?.preferences;

  return {
    showWorkflowHints: prefs?.showWorkflowHints ?? DEFAULT_PREFERENCES.showWorkflowHints,
    compactView: prefs?.compactView ?? DEFAULT_PREFERENCES.compactView,
  };
}

function HintIcon() {
  return (
    <svg className="workflow-tip-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function StepEyebrow({ step, label }) {
  const { showWorkflowHints } = usePreferences();
  if (!showWorkflowHints) return null;

  return <p className="eyebrow workflow-step-eyebrow">{label || `Step ${step}`}</p>;
}

export function WorkflowTip({ children, className = "", variant = "default", title }) {
  const { showWorkflowHints } = usePreferences();
  if (!showWorkflowHints || !children) return null;

  const classes = ["workflow-tip", `workflow-tip-${variant}`, className].filter(Boolean).join(" ");

  return (
    <div className={classes} role="note">
      <HintIcon />
      <div className="workflow-tip-body">
        {title && <div className="workflow-tip-title">{title}</div>}
        <div className="workflow-tip-text">{children}</div>
      </div>
    </div>
  );
}

export function WorkflowHintList({ title, items = [], className = "" }) {
  const { showWorkflowHints } = usePreferences();
  if (!showWorkflowHints || items.length === 0) return null;

  return (
    <div className={`workflow-hint-list ${className}`.trim()} role="note">
      {title && <div className="workflow-hint-list-title">{title}</div>}
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export const TAB_HINTS = {
  interviews:
    "Upload interview audio/video or paste a transcript. Each interview is saved separately with its own transcript and media.",
  insights:
    "Review insights for each interview individually. Filter by Pain, Need, Opportunity, and other tags. Extract or refine before moving to Patterns.",
  patterns:
    "With at least 2 interviews saved, run pattern analysis to find themes that repeat across participants before writing your PRD.",
  prd:
    "Generate a full product requirements document from your interviews and patterns. Edit sections, save to the project, and export as Markdown or PDF.",
};

export const WORKSPACE_HINTS = [
  "Each project is a workspace for your product research and PRD.",
  "Open a project to upload interviews, review insights, and generate deliverables.",
  "Use Settings to upload a profile photo, update your account, or hide workflow hints.",
];
