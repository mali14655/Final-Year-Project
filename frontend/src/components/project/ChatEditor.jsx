import React, { useState } from "react";
import { api } from "../../services/api";

function ChatEditor({ transcript, insights, onTranscriptChange, onInsightsChange }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState("transcript"); // transcript, insights

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsProcessing(true);

    // Add user message to chat
    const newMessages = [...chatMessages, { role: "user", content: userMessage }];
    setChatMessages(newMessages);

    try {
      // Send to backend for AI processing
      const response = await api.post("/api/chat/edit", {
        message: userMessage,
        transcript: transcript,
        insights: insights,
        context: activeView, // "transcript" or "insights"
      });

      const aiResponse = response.data.response;
      const changes = response.data.changes;

      // Add AI response to chat
      setChatMessages([...newMessages, { role: "assistant", content: aiResponse }]);

      // Apply changes
      if (changes) {
        if (changes.transcript !== undefined) {
          onTranscriptChange(changes.transcript);
        }
        if (changes.insights !== undefined) {
          onInsightsChange(changes.insights);
        }
      }
    } catch (error) {
      console.error("Error processing chat:", error);
      const apiError =
        error.response?.data?.error ||
        "Sorry, I couldn't process that request. Please try again.";
      setChatMessages([
        ...newMessages,
        {
          role: "assistant",
          content: apiError,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAction = (action) => {
    let message = "";
    switch (action) {
      case "remove_duplicates":
        message = "Remove duplicate insights";
        break;
      case "fix_grammar":
        message = "Fix grammar and spelling in the transcript";
        break;
      case "summarize_insights":
        message = "Summarize and consolidate similar insights";
        break;
      case "improve_clarity":
        message = "Improve clarity and readability of the transcript";
        break;
      default:
        return;
    }
    setInputMessage(message);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "1rem" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #1f2937" }}>
        <button
          onClick={() => setActiveView("transcript")}
          style={{
            padding: "0.75rem 1rem",
            border: "none",
            borderBottom: activeView === "transcript" ? "2px solid #3b82f6" : "2px solid transparent",
            backgroundColor: "transparent",
            color: activeView === "transcript" ? "#3b82f6" : "#9ca3af",
            fontSize: "0.875rem",
            cursor: "pointer",
            fontWeight: activeView === "transcript" ? 600 : 400,
          }}
        >
          Transcript
        </button>
        <button
          onClick={() => setActiveView("insights")}
          style={{
            padding: "0.75rem 1rem",
            border: "none",
            borderBottom: activeView === "insights" ? "2px solid #3b82f6" : "2px solid transparent",
            backgroundColor: "transparent",
            color: activeView === "insights" ? "#3b82f6" : "#9ca3af",
            fontSize: "0.875rem",
            cursor: "pointer",
            fontWeight: activeView === "insights" ? 600 : 400,
          }}
        >
          Insights ({insights.length})
        </button>
      </div>

      {/* Content View */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          minHeight: "400px",
        }}
      >
        {/* Content Display */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#030712",
            borderRadius: "0.5rem",
            padding: "1rem",
            overflowY: "auto",
            border: "1px solid #1f2937",
          }}
        >
          {activeView === "transcript" ? (
            <div>
              <h4 style={{ color: "#e5e7eb", marginBottom: "0.75rem", fontSize: "0.875rem", fontWeight: 600 }}>
                Transcript
              </h4>
              <textarea
                value={transcript}
                onChange={(e) => onTranscriptChange(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "200px",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #374151",
                  backgroundColor: "#0f172a",
                  color: "#e5e7eb",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
                placeholder="Transcript will appear here..."
              />
            </div>
          ) : (
            <div>
              <h4 style={{ color: "#e5e7eb", marginBottom: "0.75rem", fontSize: "0.875rem", fontWeight: 600 }}>
                Insights
              </h4>
              {insights.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {insights.map((insight, index) => {
                    const getCategoryColor = (category) => {
                      switch (category?.toLowerCase()) {
                        case "pain":
                          return { bg: "#7f1d1d", color: "#fca5a5" };
                        case "need":
                          return { bg: "#1e3a8a", color: "#93c5fd" };
                        case "opportunity":
                          return { bg: "#14532d", color: "#86efac" };
                        default:
                          return { bg: "#374151", color: "#e5e7eb" };
                      }
                    };
                    const categoryStyle = getCategoryColor(insight.category);

                    return (
                      <div
                        key={insight.id || index}
                        style={{
                          padding: "0.75rem",
                          backgroundColor: "#0f172a",
                          borderRadius: "0.5rem",
                          border: "1px solid #1f2937",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                          <span style={{ color: "#e5e7eb", fontSize: "0.875rem", flex: 1 }}>
                            {insight.summary}
                          </span>
                          {insight.category && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                textTransform: "uppercase",
                                padding: "0.25rem 0.5rem",
                                borderRadius: "999px",
                                backgroundColor: categoryStyle.bg,
                                color: categoryStyle.color,
                                fontWeight: 600,
                                marginLeft: "0.5rem",
                              }}
                            >
                              {insight.category}
                            </span>
                          )}
                        </div>
                        {insight.quote && (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "#9ca3af",
                              fontStyle: "italic",
                              paddingLeft: "0.75rem",
                              borderLeft: "3px solid #3b82f6",
                              marginTop: "0.5rem",
                            }}
                          >
                            "{insight.quote}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No insights yet</p>
              )}
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div
          style={{
            backgroundColor: "#030712",
            borderRadius: "0.5rem",
            padding: "1rem",
            border: "1px solid #1f2937",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}>AI Assistant</div>
          
          {/* Quick Actions */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => handleQuickAction("fix_grammar")}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                backgroundColor: "#0f172a",
                color: "#e5e7eb",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Fix Grammar
            </button>
            <button
              onClick={() => handleQuickAction("remove_duplicates")}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                backgroundColor: "#0f172a",
                color: "#e5e7eb",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Remove Duplicates
            </button>
            <button
              onClick={() => handleQuickAction("summarize_insights")}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                backgroundColor: "#0f172a",
                color: "#e5e7eb",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Summarize
            </button>
          </div>

          {/* Chat Messages */}
          {chatMessages.length > 0 && (
            <div
              style={{
                maxHeight: "150px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                padding: "0.75rem",
                backgroundColor: "#0f172a",
                borderRadius: "0.5rem",
              }}
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: msg.role === "user" ? "#1e3a8a" : "#374151",
                    color: "#e5e7eb",
                    fontSize: "0.8rem",
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                  }}
                >
                  {msg.content}
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask to edit ${activeView}... (e.g., "Remove duplicate insights", "Fix grammar")`}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                backgroundColor: "#0f172a",
                color: "#e5e7eb",
                fontSize: "0.875rem",
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isProcessing || !inputMessage.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                background: isProcessing || !inputMessage.trim() ? "#374151" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "#fff",
                fontSize: "0.875rem",
                cursor: isProcessing || !inputMessage.trim() ? "default" : "pointer",
                fontWeight: 600,
              }}
            >
              {isProcessing ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatEditor;
