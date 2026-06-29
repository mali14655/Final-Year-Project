export function getSpeakerRole(speaker) {
  const label = (speaker || "").toLowerCase().trim();
  if (!label) return "neutral";
  if (
    label.includes("interviewee") ||
    label.includes("participant") ||
    label.includes("customer") ||
    label.includes("user")
  ) {
    return "interviewee";
  }
  if (
    label.includes("interviewer") ||
    label.includes("moderator") ||
    label.includes("researcher") ||
    label === "pm"
  ) {
    return "interviewer";
  }
  return "neutral";
}

export function parseTranscriptTurns(transcript) {
  if (!transcript?.trim()) return [];

  const lines = transcript.split("\n");
  const turns = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    turns.push({
      ...current,
      text: current.text.trim(),
    });
    current = null;
  };

  lines.forEach((line) => {
    const match = line.match(/^([^:]{1,40}):\s*(.*)$/);
    if (match) {
      pushCurrent();
      current = {
        speaker: match[1].trim(),
        role: getSpeakerRole(match[1]),
        text: match[2] || "",
      };
      return;
    }

    if (!current) {
      current = { speaker: null, role: "neutral", text: line };
      return;
    }

    current.text = current.text ? `${current.text}\n${line}` : line;
  });

  pushCurrent();
  return turns.filter((turn) => turn.text || turn.speaker);
}

export function formatSpeakerLabel(speaker) {
  if (!speaker) return "Speaker";
  return speaker;
}
