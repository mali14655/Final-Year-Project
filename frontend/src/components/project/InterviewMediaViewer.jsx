import React, { useEffect, useRef, useState } from "react";
import { api } from "../../services/api";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function MediaIcon({ type }) {
  if (type === "video") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M17 9.5 21 7v10l-4-2.5V9.5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "text") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 4h10v16H7z" stroke="currentColor" strokeWidth="1.75" />
        <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="1.75" />
      <path d="M19 11a7 7 0 0 1-14 0M12 18v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function InterviewMediaViewer({ interview }) {
  const mediaRef = useRef(null);
  const blobUrlRef = useRef(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const interviewId = interview?.id || interview?._id;
  const sourceType = interview?.sourceType || "audio";
  const hasFile = Boolean(interview?.hasStoredFile || interview?.gridfsFileId);
  const displayName = interview?.filename || interview?.originalName || "Interview recording";

  useEffect(() => {
    if (!hasFile) {
      setMediaUrl(null);
      return undefined;
    }

    let active = true;

    const loadMedia = async () => {
      try {
        setLoadError("");
        const response = await api.get(`/api/interviews/${interviewId}/file`, {
          responseType: "blob",
        });
        if (!active) return;

        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }

        const objectUrl = URL.createObjectURL(response.data);
        blobUrlRef.current = objectUrl;
        setMediaUrl(objectUrl);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      } catch {
        if (active) setLoadError("Could not load interview file");
      }
    };

    loadMedia();

    return () => {
      active = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [hasFile, interviewId]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [mediaUrl]);

  const togglePlay = async () => {
    const el = mediaRef.current;
    if (!el) return;

    if (el.paused) {
      try {
        await el.play();
        setIsPlaying(true);
      } catch {
        setLoadError("Playback was blocked. Press play again.");
      }
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const el = mediaRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    if (Number.isFinite(el.duration)) {
      setDuration(el.duration);
    }
  };

  const handleSeek = (event) => {
    const el = mediaRef.current;
    if (!el || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    el.currentTime = ratio * duration;
    setCurrentTime(el.currentTime);
  };

  if (!hasFile) {
    return null;
  }

  const mediaLabel =
    sourceType === "text" ? "Saved transcript" : sourceType === "video" ? "Video interview" : "Audio interview";

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="media-player-card">
      <div className="media-player-top">
        <div className={`media-player-icon is-${sourceType}`}>
          <MediaIcon type={sourceType} />
        </div>
        <div className="media-player-meta">
          <p className="media-player-label">{mediaLabel}</p>
          <h4 className="media-player-title">{displayName}</h4>
        </div>
      </div>

      {loadError ? (
        <p className="text-error" style={{ fontSize: "0.875rem", margin: 0 }}>
          {loadError}
        </p>
      ) : !mediaUrl ? (
        <div className="media-player-loading">Loading media…</div>
      ) : sourceType === "text" ? (
        <iframe src={mediaUrl} title="Interview transcript PDF" className="media-player-pdf" />
      ) : (
        <>
          {sourceType === "video" ? (
            <video
              ref={mediaRef}
              src={mediaUrl}
              className="media-player-video"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <audio
              ref={mediaRef}
              src={mediaUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}

          <div className="media-player-controls">
            <button
              type="button"
              className="media-play-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                </svg>
              )}
            </button>

            <div className="media-progress-wrap">
              <button
                type="button"
                className="media-progress-bar"
                onClick={handleSeek}
                aria-label="Seek"
              >
                <span className="media-progress-fill" style={{ width: `${progress}%` }} />
              </button>
              <div className="media-time">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default InterviewMediaViewer;
