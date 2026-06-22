# Cursor for Product Managers

## Full Project Specification Document

---

**Project Title:** Cursor for Product Managers (Cursor for PMS)

**Project Type:** Final Year Project (FYP)

**Technology Stack:** MERN (MongoDB, Express, React, Node.js) + Google Gemini AI

**Document Version:** 1.0

**Date:** June 2025

**Author:** FYP Development Team

---

<div style="page-break-after: always;"></div>

## Table of Contents

1. Executive Summary
2. Problem Statement and Solution
3. System Architecture
4. Core User Journey
5. Feature Breakdown
6. AI Agents
7. How Key Features Work
8. Database Schema
9. API Reference
10. Frontend Structure
11. Setup and Environment
12. Future Scope and Conclusion

---

<div style="page-break-after: always;"></div>

## 1. Executive Summary

**Cursor for Product Managers** is an AI-powered web application designed to help Product Managers transform raw user interview data into actionable product insights and professional Product Requirements Documents (PRDs).

The application addresses a critical bottleneck in product discovery: after conducting user interviews, PMs spend hours manually transcribing recordings, highlighting pain points, comparing feedback across users, and drafting requirement documents. This tool automates that workflow using five specialized AI agents powered by Google Gemini (`gemini-2.5-flash`).

### What the System Does

| Stage | Input | Output |
|-------|-------|--------|
| 1. Ingest | Audio, video, or pasted text transcript | Structured interview record |
| 2. Analyze | Transcript text | Pain points, feature requests, quotes, sentiment |
| 3. Compare | Multiple interviews in one project | Cross-interview patterns and trends |
| 4. Document | Insights + patterns + project context | Full PRD with personas, features, timeline |
| 5. Refine | Natural language chat commands | Edited transcript, insights, or PRD |

### Target Users

- Product Managers conducting user research
- UX Researchers synthesizing interview findings
- Startup founders validating product ideas through customer interviews
- FYP evaluators reviewing an end-to-end AI + MERN stack application

### Key Differentiator

Unlike generic AI chat tools, Cursor for PMs is **project-centric**: all interviews, patterns, and PRDs are organized under named projects (e.g., "Mobile Banking App Research"), enabling multi-interview synthesis and a single authoritative PRD per product effort.

---

<div style="page-break-after: always;"></div>

## 2. Problem Statement and Solution

### 2.1 The Problem

Product Managers regularly conduct user interviews to understand customer needs. The post-interview workflow is labor-intensive:

1. **Transcription** — Manually typing or correcting auto-transcripts from audio/video recordings
2. **Insight extraction** — Reading transcripts to identify pain points, feature requests, and notable quotes
3. **Cross-interview synthesis** — Comparing multiple interviews to find recurring themes
4. **PRD authoring** — Writing structured requirement documents from scattered notes
5. **Iteration** — Revising transcripts and insights based on review feedback

This process can take days for a set of 5–10 interviews, delaying product decisions.

### 2.2 The Solution

Cursor for PMs provides a unified workspace where PMs can:

- Upload interview recordings **or paste existing transcripts**
- Automatically receive AI-extracted insights
- Chat-edit results using natural language ("Fix grammar", "Remove duplicate insights")
- Analyze patterns across multiple interviews in one project
- Generate a comprehensive PRD in one click
- Export the PRD as Markdown or PDF

### 2.3 Design Principles

- **Synchronous processing** — No background queue required for FYP scope; user waits on upload screen
- **Project as container** — One project = one product research effort with many interviews
- **AI agents as specialists** — Each task (transcribe, insight, pattern, PRD, chat) has a dedicated agent
- **Human in the loop** — All AI output is editable before saving; nothing is auto-committed without user action

---

<div style="page-break-after: always;"></div>

## 3. System Architecture

### 3.1 High-Level Architecture

```
+------------------------------------------------------------------+
|                     REACT FRONTEND (Port 3000)                    |
|  +-------------+  +--------------+  +-------------------------+  |
|  | ProjectCards|  |ProjectDetail |  | PRDGenerator / ChatEditor|  |
|  +------+------+  +------+-------+  +------------+------------+  |
|         |                |                        |               |
|         +----------------+------------------------+               |
|                          | HTTP/REST (axios)                     |
+------------------------------------------------------------------+
                           |
                           v
+------------------------------------------------------------------+
|                   EXPRESS BACKEND (Port 5000)                     |
|  +----------------------------------------------------------+    |
|  |                      server.js                            |    |
|  |  /api/process  /api/process-text  /api/generate-prd  ... |    |
|  +---------------------------+------------------------------+    |
|                              |                                    |
|  +---------------------------v------------------------------+    |
|  |              AI Service (aiService/)                      |    |
|  |  Transcriber | Insight | Pattern | PRD | Chat Agents     |    |
|  +---------------------------+------------------------------+    |
|                              |                                    |
+------------------------------------------------------------------+
                               |
              +----------------+----------------+
              |                                 |
              v                                 v
    +-------------------+             +-------------------+
    |     MongoDB       |             |  Google Gemini    |
    |  Projects         |             |  gemini-2.5-flash |
    |  Interviews       |             |  (Multimodal AI)  |
    |  Users (schema)   |             +-------------------+
    +-------------------+
```

### 3.2 Request Flow — Audio Interview Upload

```
User selects audio file
        |
        v
POST /api/process (multipart/form-data)
        |
        v
Transcriber Agent (Gemini multimodal: audio -> text)
        |
        v
Insight Agent (transcript -> structured insights)
        |
        v
Save Interview document to MongoDB
        |
        v
POST /api/projects/:id/save (link interview to project)
        |
        v
Frontend reloads project, auto-selects new interview
```

### 3.3 Request Flow — Text Transcript Paste

```
User pastes transcript text
        |
        v
POST /api/process-text { transcript, title?, projectId? }
        |
        v
Insight Agent ONLY (skip transcription)
        |
        v
Save Interview + link to project (if projectId provided)
        |
        v
Frontend reloads project, auto-selects new interview
```

### 3.4 Technology Stack

| Layer | Technology | Version / Notes |
|-------|------------|-----------------|
| Frontend | React | 18.x, functional components |
| Frontend HTTP | Axios | REST API calls |
| Backend | Express.js | ES modules, Node.js |
| Database | MongoDB | Mongoose ODM |
| AI | Google Generative AI | @google/generative-ai, gemini-2.5-flash |
| File Upload | Multer | In-memory storage, 100MB limit |
| Dev Backend | Nodemon | Hot reload |

### 3.5 Explicitly Excluded (Current Scope)

The following were planned in early architecture but are **not implemented** and **excluded** from current scope:

| Component | Reason for Exclusion |
|-----------|---------------------|
| Bull/Redis queue | Synchronous processing sufficient for FYP |
| Socket.io | No real-time progress needed yet |
| GridFS | Audio processed in memory; originals not persisted |
| User authentication | User model exists; login/register not wired |

---

<div style="page-break-after: always;"></div>

## 4. Core User Journey

### Step-by-Step Workflow

**Step 1 — Create a Project**

The user creates a named project with an optional description. Example: "Food Delivery App — User Research Q2 2025". Projects are stored in MongoDB and appear on the project cards dashboard.

**Step 2 — Add Interviews**

Two input modes are available in the Interviews tab:

- **Upload Audio/Video** — Accepts audio/* and video/* files up to 100MB. Runs Transcriber + Insight agents.
- **Paste Transcript** — User pastes existing text. Runs Insight agent only. Optional title field.

Each interview is saved as a separate MongoDB document and linked to the project.

**Step 3 — Review and Edit**

The user selects an interview from the list. The Chat Editor displays:

- **Transcript tab** — Full text, editable manually or via AI chat
- **Insights tab** — Structured insight cards with category badges (pain, need, opportunity)

Quick actions: Fix Grammar, Remove Duplicates, Summarize.

Changes are held in local React state until the user clicks **Save Changes** (calls PUT /api/interviews/:id).

**Step 4 — Analyze Patterns (2+ interviews required)**

When a project has two or more interviews, the Patterns tab appears. Clicking **Analyze Patterns** sends all interview IDs to the Pattern Agent, which identifies recurring themes, frequency percentages, severity, and recommendations. Results are saved to `project.patterns`.

**Step 5 — Generate PRD**

In the PRD tab, click **Generate PRD**. The system:

- Merges insights from all project interviews (when multiple exist)
- Auto-runs pattern analysis if patterns are not already saved
- Sends combined data to the PRD Agent
- Saves result to `project.prd.document`

**Step 6 — Edit and Export**

The generated PRD is displayed in an editable viewer. Users can:

- Edit sections inline (executive summary, problem statement, personas, features)
- Save to project
- Export as Markdown (.md file download)
- Export as PDF (browser print dialog)

---

<div style="page-break-after: always;"></div>

## 5. Feature Breakdown

| Feature | Description | Status |
|---------|-------------|--------|
| Project management | Create, list, open projects | **Done** |
| Project cards dashboard | Grid view with interview count, PRD/pattern indicators | **Done** |
| Audio/video upload | Transcribe via Gemini multimodal + extract insights | **Done** |
| Text transcript paste | Skip transcription; insight extraction only | **Done** |
| Interview list per project | Select, view transcript and insights per interview | **Done** |
| Chat Editor — transcript | AI-assisted transcript editing via natural language | **Done** |
| Chat Editor — insights | AI-assisted insight array editing | **Done** |
| Save interview edits | Persist transcript/insight changes to database | **Done** |
| Pattern analysis | Cross-interview theme detection with frequency | **Done** |
| Patterns tab UI | Analyze button, pattern cards, summary themes | **Done** |
| PRD generation | Full structured PRD from insights + patterns | **Done** |
| PRD tab — always accessible | Generate on first use (not blocked) | **Done** |
| Multi-interview PRD | Uses all project interviews when 2+ exist | **Done** |
| PRD inline editing | Edit all PRD sections in browser | **Done** |
| PRD export Markdown | Download .md file | **Done** |
| PRD export PDF | Browser print-to-PDF | **Done** |
| Project delete | Delete button on cards | **Not built** (shows "coming soon") |
| User authentication | Login, register, protected routes | **Not built** (stubs exist) |
| Background job queue | Bull/Redis async processing | **Excluded** |
| Real-time progress | Socket.io upload progress | **Excluded** |
| GridFS file storage | Persist original audio/video | **Excluded** |
| Speaker diarization | Identify speakers in transcript | **Partial** (schema exists; agent returns empty) |

---

<div style="page-break-after: always;"></div>

## 6. AI Agents

All agents live under `backend/src/services/aiService/agents/` and use **Google Gemini `gemini-2.5-flash`** via a shared client (`geminiClient.js`). Each agent has a dedicated prompt file under `prompts/`.

### 6.1 Transcriber Agent

**File:** `transcriberAgent.js`

**Purpose:** Convert uploaded audio or video interview recordings into plain text transcripts.

**Input:** Multer file object (buffer, mimetype, originalname, size)

**Process:**
1. Convert file buffer to base64
2. Send multimodal request to Gemini: text prompt + inline audio/video data
3. Return clean transcript text

**Output Schema:**
```json
{
  "transcript": "Interviewer: ...\nInterviewee: ...",
  "speakers": [],
  "metadata": {
    "originalName": "user1.mp3",
    "mimeType": "audio/mpeg",
    "size": 1234567,
    "generatedAt": "2025-06-21T..."
  }
}
```

**Note:** Speaker diarization is planned but not yet implemented; `speakers` array is currently empty.

---

### 6.2 Insight Agent

**File:** `insightAgent.js`

**Purpose:** Extract actionable product insights from interview transcript text.

**Input:** String transcript (from Transcriber Agent or pasted text)

**Extracts:**
- Pain points — problems and frustrations users face
- Feature requests — specific capabilities users want
- Quotes — direct impactful statements from users
- Sentiment — emotional tone per insight and overall

**Output Schema:**
```json
{
  "insights": [
    {
      "id": 1,
      "type": "pain_point",
      "summary": "Checkout process is too slow",
      "category": "pain",
      "quote": "I always abandon my cart because it takes forever",
      "sentiment": -0.7,
      "context": "Discussing e-commerce experience",
      "priority": "high"
    }
  ],
  "overallSentiment": {
    "score": -0.3,
    "label": "mixed",
    "summary": "User is frustrated with current tools but optimistic about improvements"
  }
}
```

**Fallback:** If Gemini returns non-JSON text, a text parser extracts structured insights from bullet points.

---

### 6.3 Pattern Agent

**File:** `patternAgent.js`

**Purpose:** Identify recurring themes across multiple interviews within a project.

**Input:** Array of interview objects, each with `id`, `transcript`, `insights`, `metadata`

**Analyzes:**
- Common themes across interviews
- Frequency (how many interviews mention each issue)
- Severity and priority
- Supporting quotes and user segments
- Actionable recommendations

**Output Schema:**
```json
{
  "patterns": [
    {
      "id": 1,
      "name": "Slow Checkout Flow",
      "type": "pain_point",
      "description": "Multiple users report abandoning purchases due to lengthy checkout",
      "frequency": 4,
      "frequencyPercentage": 80,
      "severity": "high",
      "affectedInterviews": ["id1", "id2", "id3", "id4"],
      "supportingQuotes": ["I always abandon my cart...", "Checkout takes 5 minutes"],
      "userSegments": ["Mobile shoppers", "Repeat customers"],
      "recommendations": ["Implement one-click checkout", "Add guest checkout option"]
    }
  ],
  "summary": {
    "totalInterviews": 5,
    "topThemes": ["Checkout friction", "Missing dark mode", "Poor search"],
    "criticalIssues": ["Payment failures", "Account lockouts"],
    "emergingTrends": ["Voice search interest", "Social login preference"]
  }
}
```

**Trigger:** Manual via Patterns tab UI, or automatically during PRD generation when 2+ interviews exist and no patterns are saved.

---

### 6.4 PRD Agent

**File:** `prdAgent.js`

**Purpose:** Generate a comprehensive Product Requirements Document from insights, patterns, and project context.

**Input:**
```json
{
  "insights": [...],
  "patterns": [...],
  "projectContext": { "name": "Project Name", "description": "..." }
}
```

**Output — PRD Sections:**

| Section | Content |
|---------|---------|
| title, version, date | Document metadata |
| executiveSummary | High-level product overview |
| problemStatement | problem, impact, currentState, desiredState |
| userPersonas | name, description, needs[], painPoints[] |
| goals | goal, metric, target |
| features | id, name, description, priority, userStories[], dependencies[], risks[] |
| timeline | phases with duration, features, milestones |
| successMetrics | primary[], secondary[] |

**Example Use:** After 3 food delivery app interviews, generates a PRD with personas ("Busy Professional", "Budget Student"), prioritized features (P0: faster checkout, P1: order tracking), and a 3-phase timeline.

---

### 6.5 Chat Agent

**File:** `chatAgent.js`

**Purpose:** Apply natural language edit requests to transcript, insights, or PRD data.

**Two Endpoints:**

1. **`POST /api/chat/edit`** — Used by ChatEditor UI
   - Context: `"transcript"` or `"insights"`
   - Returns updated transcript text or insights JSON array

2. **`POST /api/projects/:projectId/chat`** — Project-level edits (API ready; UI not wired)
   - Can modify transcript, insights, or PRD in one request

**Example Commands:**
- "Fix grammar and spelling in the transcript"
- "Remove duplicate insights"
- "Summarize and consolidate similar insights"
- "Change category of insight 3 to pain"

---

<div style="page-break-after: always;"></div>

## 7. How Key Features Work

### 7.1 Chat Editor — Detailed Flow

The Chat Editor (`frontend/src/components/project/ChatEditor.jsx`) operates on **one selected interview** at a time.

```
1. User opens project -> selects interview from list
2. ChatEditor receives transcript + insights as props
3. User switches tab: "Transcript" or "Insights"
4. User types message OR clicks quick action (Fix Grammar, etc.)
5. Frontend POST /api/chat/edit:
   { message, transcript, insights, context: "transcript"|"insights" }
6. Backend builds Gemini prompt with current data + user request
7. Gemini returns updated transcript (plain text) or insights (JSON array)
8. Backend responds: { response: "I've updated...", changes: { transcript|insights } }
9. Frontend calls onTranscriptChange / onInsightsChange (updates local React state)
10. User clicks "Save Changes" in project header
11. Frontend PUT /api/interviews/:id with edited transcript + insights
12. MongoDB interview document updated
```

**Important:** Chat edits are NOT auto-saved. The user must explicitly click Save Changes.

---

### 7.2 Multiple Interviews in One Project

A project is a **container** for one product research effort. Multiple interviews represent different users interviewed about the same product.

**Data Relationship:**
```
Project "Mobile Banking App"
  |
  +-- interviews[] = [ObjectId("...1"), ObjectId("...2"), ObjectId("...3")]
  |
  +-- Each ObjectId points to a separate Interview document:
        Interview 1: User A transcript + insights
        Interview 2: User B transcript + insights (pasted text)
        Interview 3: User C transcript + insights (audio upload)
```

**Save Flow (per interview):**
1. `POST /api/process` or `POST /api/process-text` creates Interview document
2. `POST /api/projects/:id/save` with `{ interviewId }`:
   - Sets `interview.projectId = projectId`
   - Appends `interviewId` to `project.interviews[]` (if not already present)
3. `GET /api/projects/:id` populates full interview data for display

**Repeating uploads adds new interviews; existing interviews are never overwritten.**

---

### 7.3 Pattern Analysis — How It Finds Patterns

When the user clicks **Analyze Patterns** (requires 2+ interviews):

1. Frontend collects all interview IDs from the project
2. `POST /api/analyze-patterns { interviewIds: [...], projectId }`
3. Backend loads all interviews from MongoDB
4. Pattern Agent receives combined data:
   - First 500 chars of each transcript
   - Full insights JSON for each interview
5. Gemini analyzes with PATTERN_PROMPT instructions
6. Returns patterns with frequency counts and percentages
7. Backend saves to `project.patterns`:
   - `patterns.identifiedAt` = current timestamp
   - `patterns.patterns` = array of pattern objects
   - `patterns.summary` = topThemes, criticalIssues, emergingTrends
8. Frontend reloads project and switches to Patterns tab

**Example:** If 4 out of 5 users mention "confusing navigation", the Pattern Agent creates:
- name: "Confusing Navigation"
- frequency: 4
- frequencyPercentage: 80
- severity: "high"

---

### 7.4 PRD Generation — Full Pipeline

**Single Interview:**
```
interviewId -> load insights -> patterns = [] -> PRD Agent -> save to project.prd
```

**Multiple Interviews:**
```
interviewIds -> merge all insights
             -> if no saved patterns: run Pattern Agent automatically
             -> PRD Agent (insights + patterns + projectContext)
             -> save to project.prd.document
```

**PRD Agent prompt includes:**
- Project name and description
- Numbered list of all insights with categories and quotes
- Numbered list of patterns with frequency percentages
- Instructions to output structured JSON matching PRD schema

**After generation:** User can edit any section, save, export Markdown, or print PDF.

---

### 7.5 Text Transcript Path

For users who already have transcripts (from Otter.ai, manual notes, etc.):

```
POST /api/process-text
Body: { transcript: "...", title?: "User 2 Interview", projectId?: "..." }

1. Validate transcript (minimum 20 characters)
2. extractInsights(transcript) — Insight Agent only
3. Save Interview:
   - mimeType: "text/plain"
   - fileSize: transcript.length
   - filename: title or auto-generated name
4. If projectId: linkInterviewToProject()
5. Return { id, transcript, insights, linkedToProject: true }
```

This skips the Transcriber Agent entirely, saving API cost and processing time.

---

<div style="page-break-after: always;"></div>

## 8. Database Schema

### 8.1 Entity Relationship

```
+------------------+       1:N        +------------------+
|     Project      |----------------->|    Interview     |
|------------------|                  |------------------|
| _id              |                  | _id              |
| name             |                  | filename         |
| description      |                  | transcript       |
| userId (optional)|                  | insights[]       |
| interviews[]     |<--- projectId ---| speakers[]       |
| patterns{}       |                  | overallSentiment |
| prd{}            |                  | projectId        |
| createdAt        |                  | createdAt        |
| updatedAt        |                  +------------------+
+------------------+

Patterns and PRD are EMBEDDED in Project (not separate collections).
```

### 8.2 Project Collection

**Model:** `backend/src/models/Project.js`

| Field | Type | Description |
|-------|------|-------------|
| name | String (required) | Project display name |
| description | String | Optional project description |
| userId | ObjectId ref User | Optional; for future auth |
| interviews | [ObjectId ref Interview] | Array of linked interview IDs |
| patterns.identifiedAt | Date | When patterns were last analyzed |
| patterns.patterns[] | Array | Pattern objects (name, frequency, severity, etc.) |
| patterns.summary | Object | topThemes, criticalIssues, emergingTrends |
| prd.generatedAt | Date | When PRD was last generated |
| prd.document | Object | Full PRD structure (see PRD Agent output) |
| timestamps | createdAt, updatedAt | Auto-managed by Mongoose |

**Indexes:** userId, createdAt (descending)

### 8.3 Interview Collection

**Model:** `backend/src/models/Interview.js`

| Field | Type | Description |
|-------|------|-------------|
| filename | String (required) | Display filename |
| originalName | String (required) | Original upload name |
| mimeType | String (required) | e.g. audio/mpeg, text/plain |
| fileSize | Number (required) | Bytes (or char count for text) |
| transcript | String (required) | Full interview text |
| insights[] | Array | Embedded insight sub-documents |
| speakers[] | Array | Speaker identification (future) |
| overallSentiment | Object | score (-1 to 1), label, summary |
| projectId | ObjectId ref Project | Back-reference to parent project |
| userId | ObjectId ref User | Optional; for future auth |
| metadata | Object | processedAt, duration, source |

**Insight Sub-Schema:**

| Field | Type | Values |
|-------|------|--------|
| id | Number | Auto-assigned |
| type | String | pain_point, feature_request, quote, sentiment |
| summary | String (required) | Brief insight description |
| category | String | pain, need, opportunity, feature, quote, sentiment |
| quote | String | Direct user quote |
| sentiment | Number | -1 to 1 |
| context | String | Background context |
| priority | String | high, medium, low |

**Indexes:** projectId, userId, createdAt, insights.category

### 8.4 User Collection (Schema Only)

**Model:** `backend/src/models/User.js`

Fields: email (unique), password, name, timestamps.

**Status:** Schema defined; authentication not implemented.

---

<div style="page-break-after: always;"></div>

## 9. API Reference

Base URL: `http://localhost:5000`

### 9.1 Interview Processing

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | /api/process | multipart file | Upload audio/video; transcribe + extract insights + save |
| POST | /api/process-text | { transcript, title?, projectId? } | Paste text; extract insights + save + optional link |

### 9.2 Interviews CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/interviews | List all interviews (limit 100) |
| GET | /api/interviews/:id | Get single interview with full data |
| PUT | /api/interviews/:id | Update transcript, insights, speakers, sentiment |

### 9.3 AI Analysis

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | /api/analyze-patterns | { interviewIds[], projectId? } | Cross-interview pattern analysis |
| POST | /api/generate-prd | { interviewId?, interviewIds?, insights?, projectId?, projectContext } | Generate PRD |

### 9.4 Projects

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | /api/projects | { name, description? } | Create project |
| GET | /api/projects | — | List all projects with counts |
| GET | /api/projects/:id | — | Get project with populated interviews, patterns, PRD |
| POST | /api/projects/:id/save | { interviewId?, prd? } | Link interview and/or save PRD |
| PUT | /api/projects/:id/prd | { prd } | Update PRD document |

### 9.5 Chat / Edit

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | /api/chat/edit | { message, transcript, insights, context } | Edit transcript or insights via AI |
| POST | /api/projects/:projectId/chat | { message, interviewId? } | Project-level AI edit (transcript/insights/PRD) |

### 9.6 Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | Health check { status: "ok" } |
| GET | /api/models | List available Gemini models |

---

<div style="page-break-after: always;"></div>

## 10. Frontend Structure

### 10.1 Application Entry

**File:** `frontend/src/App.jsx`

Simple view router:
- `"projects"` view → ProjectCards (dashboard)
- `"detail"` view → ProjectDetail (workspace)
- Modal → ProjectSelector (create new project)

### 10.2 Active Components

| Component | Path | Purpose |
|-----------|------|---------|
| ProjectCards | components/project/ProjectCards.jsx | Grid of all projects; create new |
| ProjectSelector | components/project/ProjectSelector.jsx | Create/select project modal |
| ProjectDetail | components/project/ProjectDetail.jsx | Main workspace: Interviews, PRD, Patterns tabs |
| ChatEditor | components/project/ChatEditor.jsx | Transcript/insights view + AI chat |
| PRDGenerator | components/prd/PRDGenerator.jsx | Generate, save, export PRD |
| EditablePRD | components/prd/EditablePRD.jsx | Inline PRD section editing |
| PRDPreview | components/prd/PRDPreview.jsx | Read-only PRD display |

### 10.3 ProjectDetail Tabs

| Tab | Visible When | Features |
|-----|-------------|----------|
| Interviews | Always | Upload audio/text, interview list, ChatEditor |
| PRD | Always | PRDGenerator (generate or view existing) |
| Patterns | 2+ interviews | Analyze Patterns button, pattern cards, summary |

### 10.4 Stub Components (Not Wired)

These files exist but are not used in the current App.jsx:

- `components/auth/` — Login, Register, ProtectedRoute
- `components/dashboard/` — Dashboard, ProjectList, CreateProject
- `components/insights/` — InsightsDashboard, InsightsList
- `components/common/` — Navbar, Sidebar, LoadingSpinner
- `store/` — Redux slices (authSlice, projectSlice) — App uses local state instead

---

<div style="page-break-after: always;"></div>

## 11. Setup and Environment

### 11.1 Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Google Gemini API key

### 11.2 Environment Variables

**Backend (`backend/.env`):**
```
MONGODB_URI=mongodb://localhost:27017/cursor-for-pms
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
FRONTEND_ORIGIN=http://localhost:3000
```

**Frontend (optional):**
```
REACT_APP_API_BASE_URL=http://localhost:5000
```

### 11.3 Running the Application

**Terminal 1 — Backend:**
```
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```
cd frontend
npm install
npm start
```

Open `http://localhost:3000` in the browser.

### 11.4 Project Directory Structure

```
D:\Fyp\
├── backend/
│   ├── server.js                 # Main Express server (all routes)
│   ├── src/
│   │   ├── models/               # Project, Interview, User
│   │   ├── services/
│   │   │   └── aiService/        # 5 AI agents + prompts
│   │   ├── controllers/          # Stubs (logic in server.js)
│   │   ├── routes/               # Stubs
│   │   └── utils/                # db.js (MongoDB connection)
│   └── .env
├── frontend/
│   └── src/
│       ├── App.jsx               # Main app
│       └── components/
│           ├── project/          # Active UI
│           └── prd/              # PRD generation/editing
└── docs/
    └── PROJECT_SPECIFICATION.md  # This document
```

---

<div style="page-break-after: always;"></div>

## 12. Future Scope and Conclusion

### 12.1 Planned Future Enhancements

| Enhancement | Benefit |
|-------------|---------|
| User authentication (JWT) | Multi-user support, private projects |
| Bull/Redis job queue | Async processing for large audio files |
| Socket.io progress updates | Real-time upload/transcription progress bar |
| GridFS storage | Persist and replay original recordings |
| Speaker diarization | Label Interviewer vs Interviewee in transcript |
| Project delete | Remove projects and orphaned interviews |
| Split server.js | Proper routes/controllers/services architecture |
| PRD chat editing in UI | Wire `/api/projects/:id/chat` to PRD tab |

### 12.2 Current Completion Estimate

| Area | Completion |
|------|------------|
| Core AI pipeline (transcribe → insights → patterns → PRD) | ~95% |
| Project + interview management | ~90% |
| Frontend UX (upload, edit, export) | ~85% |
| Infrastructure (auth, queue, storage) | ~10% |
| **Overall FYP deliverable** | **~70–75%** |

### 12.3 Conclusion

Cursor for Product Managers is a functional AI-powered tool that demonstrates:

- A complete MERN stack application with MongoDB persistence
- Multi-agent AI architecture using Google Gemini
- Real-world PM workflow automation (interviews → insights → patterns → PRD)
- Human-in-the-loop editing with natural language chat
- Flexible input (audio/video OR pasted text transcripts)
- Professional document export (Markdown and PDF)

The system is suitable for FYP demonstration, supervisor review, and as a foundation for production enhancements (authentication, async processing, file storage).

---

**End of Document**

*Cursor for Product Managers — Full Project Specification v1.0*
