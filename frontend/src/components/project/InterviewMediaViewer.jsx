import React, { useEffect, useState } from "react";
import { api } from "../../services/api";

function InterviewMediaViewer({ interview }) {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loadError, setLoadError] = useState("");

  const interviewId = interview?.id || interview?._id;
  const sourceType = interview?.sourceType;

  useEffect(() => {
    if (!interview?.hasStoredFile && !interview?.gridfsFileId) {
      return undefined;
    }

    let objectUrl;

    const loadMedia = async () => {
      try {
        setLoadError("");
        const response = await api.get(`/api/interviews/${interviewId}/file`, {
          responseType: "blob",
        });
        objectUrl = URL.createObjectURL(response.data);
        setMediaUrl(objectUrl);
      } catch (error) {
        setLoadError("Could not load interview file");
      }
    };

    loadMedia();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [interview?.hasStoredFile, interview?.gridfsFileId, interviewId]);

  if (!interview?.hasStoredFile && !interview?.gridfsFileId) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#030712",
        borderRadius: "0.5rem",
        padding: "1rem",
        border: "1px solid #1f2937",
        marginBottom: "0.5rem",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          color: "#9ca3af",
          fontWeight: 600,
          marginBottom: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {sourceType === "text" ? "Saved Transcript (PDF)" : sourceType === "video" ? "Interview Video" : "Interview Audio"}
      </div>

      {loadError ? (
        <p style={{ color: "#fca5a5", fontSize: "0.875rem" }}>{loadError}</p>
      ) : !mediaUrl ? (
        <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Loading media...</p>
      ) : sourceType === "text" ? (
        <iframe
          src={mediaUrl}
          title="Interview transcript PDF"
          style={{
            width: "100%",
            height: "320px",
            border: "1px solid #374151",
            borderRadius: "0.5rem",
            backgroundColor: "#fff",
          }}
        />
      ) : sourceType === "video" ? (
        <video
          controls
          src={mediaUrl}
          style={{
            width: "100%",
            maxHeight: "280px",
            borderRadius: "0.5rem",
            backgroundColor: "#000",
          }}
        >
          Your browser does not support video playback.
        </video>
      ) : (
        <audio
          controls
          src={mediaUrl}
          style={{
            width: "100%",
          }}
        >
          Your browser does not support audio playback.
        </audio>
      )}
    </div>
  );
}

export default InterviewMediaViewer;
