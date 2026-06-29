import React, { useEffect, useRef, useState } from "react";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function InterviewUpload({
  uploadMode,
  onUploadModeChange,
  file,
  onFileChange,
  onFileUpload,
  isUploading,
  textTitle,
  onTextTitleChange,
  textTranscript,
  onTextTranscriptChange,
  onTextUpload,
}) {
  const previewRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [previewTime, setPreviewTime] = useState(0);

  const isVideo = file?.type?.startsWith("video/");
  const isAudio = file?.type?.startsWith("audio/");

  useEffect(() => {
    if (!file || (!isAudio && !isVideo)) {
      setPreviewUrl(null);
      setIsPreviewPlaying(false);
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsPreviewPlaying(false);
    setPreviewTime(0);
    setPreviewDuration(0);

    return () => URL.revokeObjectURL(url);
  }, [file, isAudio, isVideo]);

  const togglePreviewPlay = async () => {
    const el = previewRef.current;
    if (!el) return;

    if (el.paused) {
      try {
        await el.play();
        setIsPreviewPlaying(true);
      } catch {
        // ignore
      }
    } else {
      el.pause();
      setIsPreviewPlaying(false);
    }
  };

  const handlePreviewTimeUpdate = () => {
    const el = previewRef.current;
    if (!el) return;
    setPreviewTime(el.currentTime);
    if (Number.isFinite(el.duration)) setPreviewDuration(el.duration);
  };

  return (
    <div className="interview-upload-card">
      <div className="interview-upload-tabs">
        <button
          type="button"
          onClick={() => onUploadModeChange("audio")}
          className={`interview-upload-tab ${uploadMode === "audio" ? "is-active" : ""}`}
        >
          Upload file
        </button>
        <button
          type="button"
          onClick={() => onUploadModeChange("text")}
          className={`interview-upload-tab ${uploadMode === "text" ? "is-active" : ""}`}
        >
          Paste transcript
        </button>
      </div>

      {uploadMode === "audio" ? (
        <form onSubmit={onFileUpload} className="interview-upload-form">
          <label htmlFor="interviewFile" className="upload-zone interview-upload-zone">
            <input
              id="interviewFile"
              type="file"
              accept="audio/*,video/*"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              className="interview-upload-input"
            />
            <span className="upload-zone-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v10M8 9l4-4 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 19h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </span>
            <span className="upload-zone-title">{file ? "Change file" : "Upload interview"}</span>
            <span className="upload-zone-hint">
              {file ? file.name : "Audio or video · MP3, WAV, MP4, MOV"}
            </span>
          </label>

          {file && previewUrl && (isAudio || isVideo) && (
            <div className="upload-preview-card">
              {isVideo ? (
                <video
                  ref={previewRef}
                  src={previewUrl}
                  className="upload-preview-video"
                  onTimeUpdate={handlePreviewTimeUpdate}
                  onLoadedMetadata={handlePreviewTimeUpdate}
                  onEnded={() => setIsPreviewPlaying(false)}
                />
              ) : (
                <audio
                  ref={previewRef}
                  src={previewUrl}
                  onTimeUpdate={handlePreviewTimeUpdate}
                  onLoadedMetadata={handlePreviewTimeUpdate}
                  onEnded={() => setIsPreviewPlaying(false)}
                />
              )}

              <div className="upload-preview-controls">
                <button type="button" className="media-play-btn" onClick={togglePreviewPlay} aria-label="Preview play">
                  {isPreviewPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                    </svg>
                  )}
                </button>
                <div className="upload-preview-meta">
                  <span className="upload-preview-name">{file.name}</span>
                  <span className="upload-preview-time">
                    {formatTime(previewTime)} / {formatTime(previewDuration)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={!file || isUploading} className="btn btn-primary btn-block">
            {isUploading ? "Processing interview…" : "Process interview"}
          </button>
        </form>
      ) : (
        <form onSubmit={onTextUpload} className="interview-upload-form">
          <input
            type="text"
            value={textTitle}
            onChange={(e) => onTextTitleChange(e.target.value)}
            placeholder="Interview title (optional)"
            className="input"
          />
          <textarea
            value={textTranscript}
            onChange={(e) => onTextTranscriptChange(e.target.value)}
            placeholder="Paste your interview transcript here…"
            rows={6}
            className="textarea"
          />
          <button
            type="submit"
            disabled={isUploading || !textTranscript.trim()}
            className="btn btn-primary btn-block"
          >
            {isUploading ? "Processing transcript…" : "Process transcript"}
          </button>
        </form>
      )}
    </div>
  );
}

export default InterviewUpload;
