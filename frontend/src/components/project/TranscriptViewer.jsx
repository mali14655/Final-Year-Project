import React from "react";
import { parseTranscriptTurns, formatSpeakerLabel } from "../../utils/transcriptFormat";

function TranscriptViewer({ transcript }) {
  const turns = parseTranscriptTurns(transcript);

  return (
    <div className="transcript-viewer transcript-viewer-simple">
      <div className="transcript-viewer-header">
        <p className="eyebrow" style={{ margin: 0 }}>
          Transcript
        </p>
      </div>

      {turns.length > 0 ? (
        <div className="transcript-simple-body">
          {turns.map((turn, index) => (
            <p key={`${turn.speaker}-${index}`} className="transcript-line">
              {turn.speaker && (
                <span className={`speaker-label-inline is-${turn.role}`}>
                  {formatSpeakerLabel(turn.speaker)}:
                </span>
              )}{" "}
              <span className="transcript-line-text">{turn.text}</span>
            </p>
          ))}
        </div>
      ) : (
        <div className="transcript-empty">
          <p className="text-muted" style={{ margin: 0, fontSize: "0.9rem" }}>
            No transcript yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default TranscriptViewer;
