import React from "react";

function getFileType(interview) {
  if (interview?.sourceType === "text") return "text";
  if (interview?.sourceType === "video") return "video";
  return "audio";
}

function FileTypeIcon({ type }) {
  if (type === "video") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M16 10.5 20 8.5v7l-4-2V10.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "text") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 4h10v16H7z" stroke="currentColor" strokeWidth="1.75" />
        <path d="M9 8h6M9 12h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="1.75" />
      <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function InterviewList({ interviews, selectedInterview, onSelect, getInterviewId }) {
  if (!interviews?.length) {
    return null;
  }

  return (
    <div className="interview-list">
      {interviews.map((interview, index) => {
        const id = getInterviewId(interview);
        const isSelected = String(getInterviewId(selectedInterview)) === String(id);
        const insightCount = interview.insights?.length || 0;
        const fileType = getFileType(interview);
        const title = interview.filename || interview.originalName || `Interview ${index + 1}`;

        return (
          <button
            key={id || index}
            type="button"
            onClick={() => onSelect(interview)}
            className={`interview-card ${isSelected ? "is-selected" : ""}`}
          >
            <div className={`interview-card-icon is-${fileType}`}>
              <FileTypeIcon type={fileType} />
            </div>
            <div className="interview-card-content">
              <div className="interview-card-title">{title}</div>
              <div className="interview-card-meta">
                <span className={`insight-tag insight-tag-count ${insightCount > 0 ? "has-count" : ""}`}>
                  {insightCount} insight{insightCount === 1 ? "" : "s"}
                </span>
                <span className="interview-item-date">
                  {new Date(interview.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default InterviewList;
