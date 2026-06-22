# Sample Interviews — Food Delivery App Research

Use these files to test **Cursor for Product Managers** without recording real audio.

## What's in this folder

| File | Type | How to use in the app |
|------|------|------------------------|
| `interview-1-sarah-food-app.txt` | Text transcript | **Paste Transcript** tab → copy/paste contents |
| `interview-2-ahmed-food-app.txt` | Text transcript | **Paste Transcript** tab → copy/paste contents |
| `interview-3-priya-food-app.txt` | Text transcript | **Paste Transcript** tab → copy/paste contents |
| `interview-1-sarah-food-app.mp3` | Audio (generated) | **Upload Audio/Video** tab → upload file |
| `interview-2-ahmed-food-app.mp3` | Audio (generated) | **Upload Audio/Video** tab → upload file |
| `interview-3-priya-food-app.mp3` | Audio (generated) | **Upload Audio/Video** tab → upload file |
| `interview-1-sarah-food-app.pdf` | PDF (generated) | Reference only — app expects **paste text**, not PDF upload |
| `interview-2-ahmed-food-app.pdf` | PDF (generated) | Reference only — after paste, app **creates** PDF automatically |

## Quick test flow (text)

1. Create project: **Food Delivery App Research**
2. Open project → **Interviews** tab → **Paste Transcript**
3. Paste **interview-1** → title: `Sarah - User Interview` → Process
4. Repeat for **interview-2** (Ahmed) and **interview-3** (Priya)
5. Go to **Patterns** tab → **Analyze Patterns** (needs 2+ interviews)
6. Go to **PRD** tab → **Generate PRD**

## Quick test flow (audio)

1. Create project: **Food Delivery App Research**
2. Open project → **Interviews** tab → **Upload Audio/Video**
3. Upload `interview-1-sarah-food-app.mp3` → title: `Sarah - User Interview` → Process
4. Repeat for **interview-2** and **interview-3** MP3 files
5. Same **Patterns** and **PRD** steps as above

Each MP3 is ~1.3 MB, ~2–3 minutes, with alternating interviewer (British English) and interviewee (US / AU / IN English) voices.

## Speaker labels in transcripts

Each `.txt` file uses:

- **Interviewer:** = Product Manager / researcher (you)
- **Interviewee:** = End user / client

When you **paste text**, these labels are preserved. The Insight Agent reads them as context.

## Audio uploads

Use the included `.mp3` files, or record your own from the `.txt` transcripts.

The app transcribes audio with Gemini and labels **Interviewer** / **Interviewee** from conversation context — it does not use voice diarization.

## Regenerate files

**PDFs** (from `.txt`):

```bash
cd D:\Fyp\sample-interviews
node generate-pdfs.js
```

**MP3 audio** (from `.txt`, requires Python + internet):

```bash
cd D:\Fyp\sample-interviews
pip install -r requirements-audio.txt
python generate-audio.py
```

Takes ~1–2 minutes per interview (Google TTS API calls).
