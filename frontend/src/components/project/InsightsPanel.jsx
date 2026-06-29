import React, { useMemo, useState, useEffect } from "react";
import { api } from "../../services/api";
import { showToast } from "../../utils/toast";
import { getErrorMessage } from "../../utils/errors";
import InsightTag, { getInsightCategoryLabel } from "./InsightTag";

const CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "pain", label: "Pain" },
  { id: "need", label: "Need" },
  { id: "opportunity", label: "Opportunity" },
  { id: "feature", label: "Feature" },
  { id: "quote", label: "Quote" },
  { id: "sentiment", label: "Sentiment" },
];

function InsightsPanel({
  interview,
  insights,
  onInsightsChange,
  onExtractInsights,
  isExtracting,
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    setActiveCategory("all");
    setChatMessages([]);
  }, [interview?.id, interview?._id]);

  const interviewTitle =
    interview?.filename || interview?.originalName || "Selected interview";

  const categoryCounts = useMemo(() => {
    const counts = { all: insights.length };
    insights.forEach((insight) => {
      const key = (insight.category || "pain").toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [insights]);

  const filteredInsights = useMemo(() => {
    if (activeCategory === "all") return insights;
    return insights.filter((insight) => (insight.category || "").toLowerCase() === activeCategory);
  }, [insights, activeCategory]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsProcessing(true);

    const newMessages = [...chatMessages, { role: "user", content: userMessage }];
    setChatMessages(newMessages);

    try {
      const response = await api.post("/api/chat/edit", {
        message: userMessage,
        transcript: interview?.transcript || "",
        insights,
        context: "insights",
      });

      setChatMessages([...newMessages, { role: "assistant", content: response.data.response }]);

      if (response.data.changes?.insights !== undefined) {
        onInsightsChange(response.data.changes.insights);
      }
    } catch (error) {
      const apiError = getErrorMessage(error, "Sorry, I couldn't process that request.");
      setChatMessages([...newMessages, { role: "assistant", content: apiError }]);
      showToast.apiError(error, "AI assistant could not update insights");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAction = (message) => {
    setInputMessage(message);
  };

  if (!interview) {
    return (
      <div className="surface-card interview-detail-empty">
        <p className="heading-md" style={{ margin: "0 0 0.35rem" }}>Select an interview</p>
        <p className="text-muted" style={{ margin: 0, fontSize: "0.9rem" }}>
          Choose an interview from the list to view and edit insights from that conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card interview-detail-panel insights-detail-panel">
      <div className="panel-header-row">
        <div className="panel-header-copy">
          <p className="media-player-label">Insights</p>
          <h3 className="media-player-title">{interviewTitle}</h3>
          <p className="panel-header-desc">
            {insights.length} insight{insights.length === 1 ? "" : "s"} for this interview
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onExtractInsights}
          disabled={isExtracting || !interview?.transcript?.trim()}
        >
          {isExtracting ? "Extracting…" : insights.length > 0 ? "Re-extract" : "Extract insights"}
        </button>
      </div>

      <div className="insight-category-tabs-scroll" role="tablist" aria-label="Filter insights by category">
        <div className="interview-upload-tabs insight-category-tabs">
        {CATEGORY_FILTERS.map((filter) => {
          const count = categoryCounts[filter.id] || 0;
          if (filter.id !== "all" && count === 0) return null;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveCategory(filter.id)}
              className={`interview-upload-tab ${activeCategory === filter.id ? "is-active" : ""}`}
            >
              {filter.label}
              <span className="tab-badge">{count}</span>
            </button>
          );
        })}
        </div>
      </div>

      {filteredInsights.length > 0 ? (
        <div className="insights-list-card">
          {filteredInsights.map((insight, index) => (
            <div key={insight.id || `${insight.summary}-${index}`} className="insight-row">
              <div className="insight-row-top">
                <InsightTag category={insight.category} />
                <span className="insight-row-index">#{index + 1}</span>
              </div>
              <p className="insight-row-summary">{insight.summary}</p>
              {insight.quote && (
                <blockquote className="insight-row-quote">&ldquo;{insight.quote}&rdquo;</blockquote>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="insights-empty-state">
          <p className="insights-empty-title">
            No {activeCategory === "all" ? "" : `${getInsightCategoryLabel(activeCategory)} `}insights yet
          </p>
          <p className="text-muted insights-empty-copy">
            {interview?.transcript?.trim()
              ? "Click Extract insights to analyze this interview's transcript."
              : "Add a transcript to this interview first, then extract insights."}
          </p>
        </div>
      )}

      <div className="transcript-assistant-card">
        <div className="transcript-assistant-header">
          <h4 className="transcript-assistant-title">AI insights assistant</h4>
          <p className="transcript-assistant-desc">
            Remove duplicates, merge similar points, or refine how insights are written.
          </p>
        </div>

        <div className="insights-quick-actions">
          <button type="button" className="chip-btn" onClick={() => handleQuickAction("Remove duplicate insights")}>
            Remove duplicates
          </button>
          <button type="button" className="chip-btn" onClick={() => handleQuickAction("Summarize and consolidate similar insights")}>
            Consolidate
          </button>
          <button type="button" className="chip-btn" onClick={() => handleQuickAction("Improve clarity of all insight summaries")}>
            Improve clarity
          </button>
        </div>

        {chatMessages.length > 0 && (
          <div className="insights-chat-log">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`insights-chat-msg is-${msg.role}`}>
                {msg.content}
              </div>
            ))}
          </div>
        )}

        <div className="insights-chat-input">
          <input
            type="text"
            className="input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask to edit insights for this interview…"
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSendMessage}
            disabled={isProcessing || !inputMessage.trim()}
          >
            {isProcessing ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InsightsPanel;
