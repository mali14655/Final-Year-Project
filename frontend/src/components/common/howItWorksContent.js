export const HOW_IT_WORKS_SECTIONS = [
  {
    id: "overview",
    step: null,
    title: "Overview",
    subtitle: "How ParseAi fits together",
    content: [
      {
        type: "paragraph",
        text: "ParseAi turns user interview research into structured insights, cross-interview patterns, and a Product Requirements Document (PRD). Everything lives inside projects — one project per product or research initiative.",
      },
      {
        type: "list",
        title: "The 4-step workflow",
        items: [
          "Interviews — upload conversations and get transcripts.",
          "Insights — extract tagged findings from each interview individually.",
          "Patterns — find themes that repeat across 2 or more interviews.",
          "PRD — generate a requirements document you can edit and export.",
        ],
      },
      {
        type: "list",
        title: "What you can do in any project",
        items: [
          "Upload audio, video, or paste a transcript manually.",
          "Play back interview media and review labeled transcripts.",
          "Use AI assistants to refine transcripts and insights (no manual typing required).",
          "Save changes to keep edits in the project.",
          "Export your PRD as Markdown or PDF.",
        ],
      },
    ],
  },
  {
    id: "interviews",
    step: 1,
    title: "Interviews",
    subtitle: "Upload, transcribe, and review conversations",
    content: [
      {
        type: "paragraph",
        text: "Each interview is stored separately in your project. You can add as many as you need. Every interview gets its own transcript, media file (if uploaded), and later its own insight set.",
      },
      {
        type: "list",
        title: "What you do on this step",
        items: [
          "Upload an audio or video file, or switch to Text mode and paste a transcript.",
          "Click Process to transcribe audio/video automatically.",
          "Select an interview from the list to play media and read the transcript.",
          "Use the AI transcript assistant to fix grammar or improve clarity.",
          "Click Save changes in the project header when the AI updates your transcript.",
        ],
      },
      {
        type: "terms",
        title: "Key terms",
        items: [
          {
            term: "Interview",
            definition: "A single user research conversation — one participant, one session. Stored as its own record with a title, transcript, and optional media file.",
          },
          {
            term: "Transcript",
            definition: "The full text of the conversation. Speaker turns are labeled Interviewer (blue) and Interviewee (purple) so you can scan who said what.",
          },
          {
            term: "Process / Transcribe",
            definition: "Runs speech-to-text on uploaded audio or video and saves the result as the interview transcript.",
          },
          {
            term: "AI transcript assistant",
            definition: "A chat tool that edits the transcript for you — e.g. fix grammar, improve readability — without manual copy-paste editing.",
          },
          {
            term: "Text interview",
            definition: "An interview added by pasting a transcript directly, without uploading a media file.",
          },
        ],
      },
    ],
  },
  {
    id: "insights",
    step: 2,
    title: "Insights",
    subtitle: "Tagged findings from each interview",
    content: [
      {
        type: "paragraph",
        text: "Insights are structured takeaways pulled from a transcript. Important: each interview has its own insight list — insights from Interview A are not mixed with Interview B. Review and refine them before running pattern analysis.",
      },
      {
        type: "list",
        title: "What you do on this step",
        items: [
          "Select an interview from the sidebar.",
          "Click Extract insights (or Re-extract) to analyze that interview's transcript.",
          "Filter insights by category using the pill tabs.",
          "Use the AI insights assistant to remove duplicates, consolidate similar points, or improve wording.",
          "Save changes after AI edits so they persist in the project.",
        ],
      },
      {
        type: "terms",
        title: "Insight categories — what each tag means",
        items: [
          {
            term: "Pain",
            definition: "A problem, frustration, or obstacle the user faces. Example: \"I spend 20 minutes every morning finding the right report.\"",
          },
          {
            term: "Need",
            definition: "Something the user requires to accomplish a goal — a job to be done or capability they lack. Example: \"I need to compare last week's numbers side by side.\"",
          },
          {
            term: "Opportunity",
            definition: "A gap, unmet need, or area where the product could create value. Often points to something worth building or improving.",
          },
          {
            term: "Feature",
            definition: "A specific product capability or feature the user explicitly asked for. Example: \"I wish there was a bulk export button.\"",
          },
          {
            term: "Quote",
            definition: "A direct, memorable quote from the participant that captures an important moment. Shown in italics under the insight summary.",
          },
          {
            term: "Sentiment",
            definition: "The emotional tone around a topic — positive, negative, neutral, or mixed. Helps you gauge intensity and satisfaction.",
          },
        ],
      },
      {
        type: "list",
        title: "Each insight card contains",
        items: [
          "A category tag (Pain, Need, etc.).",
          "A short summary written in plain language.",
          "An optional direct quote from the participant.",
        ],
      },
    ],
  },
  {
    id: "patterns",
    step: 3,
    title: "Patterns",
    subtitle: "Themes that repeat across interviews",
    content: [
      {
        type: "paragraph",
        text: "Pattern analysis compares insights from multiple interviews to find what shows up again and again. You need at least 2 interviews in the project before this step unlocks. Patterns inform prioritization — if 5 of 6 users mention the same pain, that is stronger evidence than a one-off comment.",
      },
      {
        type: "list",
        title: "What you do on this step",
        items: [
          "Upload and extract insights for at least 2 interviews first.",
          "Open the Patterns tab and click Analyze patterns.",
          "Review the summary (top themes, critical issues, emerging trends).",
          "Read each pattern card for name, frequency, and description.",
          "Click Re-analyze after adding new interviews to refresh results.",
        ],
      },
      {
        type: "terms",
        title: "Pattern analysis terms",
        items: [
          {
            term: "Pattern",
            definition: "A recurring theme across multiple interviews — a shared pain, need, or request that appears in more than one conversation.",
          },
          {
            term: "Frequency %",
            definition: "The percentage of interviews that mentioned this pattern. Higher % means more participants brought it up.",
          },
          {
            term: "Top themes",
            definition: "The most common topics or concerns surfaced across all interviews in the summary block.",
          },
          {
            term: "Critical issues",
            definition: "High-impact or urgent problems that appeared repeatedly and may need immediate product attention.",
          },
          {
            term: "Emerging trends",
            definition: "New or growing themes — topics that are gaining traction across participants and worth watching.",
          },
          {
            term: "Pattern type",
            definition: "How the AI classifies a pattern internally — e.g. theme, trend, pain point, feature request, or user segment.",
          },
          {
            term: "Severity",
            definition: "How serious or impactful a pattern is rated (high, medium, low), based on language intensity and frequency.",
          },
          {
            term: "Supporting quotes",
            definition: "Direct evidence from interviews that backs up why this pattern was identified.",
          },
          {
            term: "User segments",
            definition: "Groups of users who share similar behaviors or needs related to a pattern (e.g. power users vs. new users).",
          },
        ],
      },
    ],
  },
  {
    id: "prd",
    step: 4,
    title: "PRD",
    subtitle: "Product Requirements Document",
    content: [
      {
        type: "paragraph",
        text: "A PRD (Product Requirements Document) is a structured specification that describes what to build and why. This app generates one from your interview research and saved patterns, then lets you edit, save, and export it.",
      },
      {
        type: "list",
        title: "What you do on this step",
        items: [
          "Confirm interviews are processed and insights look accurate.",
          "Optionally run Patterns first (recommended with 2+ interviews).",
          "Click Generate PRD — the AI uses your project data as input.",
          "Click Edit PRD to change any section inline.",
          "Save to project to persist your edits.",
          "Export as Markdown (.md) or use Print / PDF to download.",
          "Regenerate if you add new interviews or re-run pattern analysis.",
        ],
      },
      {
        type: "terms",
        title: "PRD sections — what each part means",
        items: [
          {
            term: "Executive summary",
            definition: "A short overview for stakeholders — what the product is, who it is for, and the main problem it solves.",
          },
          {
            term: "Problem statement",
            definition: "Defines the problem in depth: the core issue, its business/user impact, the current state (how things work today), and the desired state (what success looks like).",
          },
          {
            term: "User personas",
            definition: "Archetypal users based on your interviews — each persona has a name, description, needs, and pain points grounded in real research.",
          },
          {
            term: "Goals",
            definition: "Measurable objectives the product should achieve, often with metrics and targets.",
          },
          {
            term: "Features & requirements",
            definition: "The capabilities to build — each feature has a name, description, and may include user stories (\"As a user, I want…\") and acceptance criteria.",
          },
          {
            term: "User story",
            definition: "A short statement of who wants what and why, e.g. \"As a PM, I want to export insights so I can share them with my team.\"",
          },
          {
            term: "Acceptance criteria",
            definition: "Specific, testable conditions that define when a feature is done correctly.",
          },
          {
            term: "Timeline & phases",
            definition: "Optional rollout plan grouping features into phases with durations and milestones.",
          },
          {
            term: "Success metrics",
            definition: "How you will measure whether the product succeeded — primary and secondary KPIs.",
          },
        ],
      },
    ],
  },
  {
    id: "workspace",
    step: null,
    title: "Workspace & settings",
    subtitle: "Projects, saving, and preferences",
    content: [
      {
        type: "terms",
        title: "Workspace terms",
        items: [
          {
            term: "Project",
            definition: "A workspace for one product or research effort. Holds all interviews, patterns, and the PRD for that initiative.",
          },
          {
            term: "Save changes",
            definition: "Appears in the project header when you edit a transcript or insights via AI. Saves those edits to the database.",
          },
          {
            term: "Workflow guide",
            definition: "The stepper at the top of a project (Interviews → Insights → Patterns → PRD) showing progress. Click a step to jump to that tab.",
          },
          {
            term: "Tab hints",
            definition: "Short context tips under the tabs explaining what each tab is for. Turn off in Settings → Preferences → Workflow hints.",
          },
          {
            term: "Compact view",
            definition: "A denser layout with less padding. Enable in Settings → Preferences.",
          },
        ],
      },
      {
        type: "list",
        title: "Account & settings",
        items: [
          "Profile — update your name, email, and profile photo.",
          "Security — change your password.",
          "Preferences — toggle workflow hints and compact view.",
        ],
      },
    ],
  },
];

export function getSectionIdForStep(stepId) {
  const map = {
    interviews: "interviews",
    insights: "insights",
    patterns: "patterns",
    prd: "prd",
  };
  return map[stepId] || "overview";
}
