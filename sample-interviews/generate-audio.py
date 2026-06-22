"""
Generate MP3 interview audio from .txt transcripts using Google TTS (gTTS).
Uses different English accents for Interviewer vs Interviewee voices.
Concatenates turns with ffmpeg (via imageio-ffmpeg bundle).
"""
import os
import re
import shutil
import subprocess
import tempfile
import time

import imageio_ffmpeg
from gtts import gTTS

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# British English — consistent PM / researcher voice
INTERVIEWER_TLD = "co.uk"

INTERVIEWS = [
    {
        "txt": "interview-1-sarah-food-app.txt",
        "mp3": "interview-1-sarah-food-app.mp3",
        "interviewee_tld": "com",  # Sarah — US English
    },
    {
        "txt": "interview-2-ahmed-food-app.txt",
        "mp3": "interview-2-ahmed-food-app.mp3",
        "interviewee_tld": "com.au",  # Ahmed — Australian English
    },
    {
        "txt": "interview-3-priya-food-app.txt",
        "mp3": "interview-3-priya-food-app.mp3",
        "interviewee_tld": "co.in",  # Priya — Indian English
    },
]

PAUSE_SECONDS = 0.45
GTTS_DELAY = 0.35


def parse_turns(text):
    """Split transcript into (role, spoken_text) turns."""
    turns = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("Interviewer:"):
            turns.append(("interviewer", line.replace("Interviewer:", "", 1).strip()))
        elif line.startswith("Interviewee:"):
            turns.append(("interviewee", line.replace("Interviewee:", "", 1).strip()))
    return turns


def synthesize_turn(text, tld, out_path):
    tts = gTTS(text=text, lang="en", tld=tld)
    tts.save(out_path)
    time.sleep(GTTS_DELAY)


def make_silence_mp3(out_path, duration_sec):
    subprocess.run(
        [
            FFMPEG,
            "-y",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=24000:cl=mono",
            "-t",
            str(duration_sec),
            "-c:a",
            "libmp3lame",
            "-b:a",
            "64k",
            out_path,
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def concat_mp3_files(file_paths, out_path):
    list_path = out_path + ".list.txt"
    with open(list_path, "w", encoding="utf-8") as f:
        for path in file_paths:
            escaped = path.replace("\\", "/").replace("'", "'\\''")
            f.write(f"file '{escaped}'\n")

    try:
        subprocess.run(
            [
                FFMPEG,
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                list_path,
                "-c:a",
                "libmp3lame",
                "-b:a",
                "128k",
                out_path,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    finally:
        if os.path.exists(list_path):
            os.remove(list_path)


def build_interview_mp3(txt_file, mp3_file, interviewee_tld):
    txt_path = os.path.join(SCRIPT_DIR, txt_file)
    out_path = os.path.join(SCRIPT_DIR, mp3_file)

    with open(txt_path, "r", encoding="utf-8") as f:
        turns = parse_turns(f.read())

    if not turns:
        raise ValueError(f"No turns found in {txt_file}")

    temp_dir = tempfile.mkdtemp(prefix="interview-audio-")
    concat_paths = []

    try:
        silence_path = os.path.join(temp_dir, "silence.mp3")
        make_silence_mp3(silence_path, PAUSE_SECONDS)

        for i, (role, text) in enumerate(turns):
            tld = INTERVIEWER_TLD if role == "interviewer" else interviewee_tld
            chunk_path = os.path.join(temp_dir, f"chunk_{i:03d}.mp3")
            synthesize_turn(text, tld, chunk_path)
            concat_paths.append(chunk_path)
            if i < len(turns) - 1:
                concat_paths.append(silence_path)

        concat_mp3_files(concat_paths, out_path)
        size_mb = os.path.getsize(out_path) / (1024 * 1024)
        print(f"Created {mp3_file} ({size_mb:.1f} MB, {len(turns)} turns)")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


def main():
    print("Generating interview audio files (gTTS + ffmpeg)...")
    print(f"Interviewer accent: en-{INTERVIEWER_TLD}")
    print()

    for item in INTERVIEWS:
        build_interview_mp3(item["txt"], item["mp3"], item["interviewee_tld"])

    print()
    print("Done! Upload the .mp3 files via 'Upload Audio/Video' in the app.")


if __name__ == "__main__":
    main()
