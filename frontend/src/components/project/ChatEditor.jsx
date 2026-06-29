import React, { useState } from "react";
import { api } from "../../services/api";
import TranscriptViewer from "./TranscriptViewer";
import { showToast } from "../../utils/toast";
import { getErrorMessage } from "../../utils/errors";

function ChatEditor({ transcript, onTranscriptChange }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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
        transcript,
        insights: [],
        context: "transcript",
      });

      setChatMessages([...newMessages, { role: "assistant", content: response.data.response }]);

      if (response.data.changes?.transcript !== undefined) {
        onTranscriptChange(response.data.changes.transcript);
      }
    } catch (error) {
      const apiError = getErrorMessage(error, "Sorry, I couldn't process that request. Please try again.");
      setChatMessages([...newMessages, { role: "assistant", content: apiError }]);
      showToast.apiError(error, "AI assistant could not edit the transcript");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAction = (message) => {
    setInputMessage(message);
  };

  return (
    <div className="transcript-editor">
      <TranscriptViewer transcript={transcript} />

      <div className="transcript-assistant-card">
        <div className="transcript-assistant-header">
          <h4 className="transcript-assistant-title">AI transcript assistant</h4>
          <p className="transcript-assistant-desc">Fix grammar, improve clarity, or ask for specific edits.</p>
        </div>

        <div className="insights-quick-actions">
          <button type="button" onClick={() => handleQuickAction("Fix grammar and spelling in the transcript")} className="chip-btn">
            Fix grammar
          </button>
          <button type="button" onClick={() => handleQuickAction("Improve clarity and readability of the transcript")} className="chip-btn">
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
            placeholder="Ask to edit this transcript…"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={isProcessing || !inputMessage.trim()}
            className="btn btn-primary"
          >
            {isProcessing ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatEditor;
