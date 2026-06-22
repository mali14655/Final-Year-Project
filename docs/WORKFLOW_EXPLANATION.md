# Complete Workflow Explanation: Interview Processing System

## Overview
This document explains how the interview processing system works end-to-end, from file upload to displaying insights.

## Architecture Flow

```
Frontend (React) → Backend API → AI Agents → Gemini AI → Response Processing → Frontend Display
```

## Step-by-Step Process

### 1. **File Upload (Frontend)**
- User selects an audio/video file in `App.jsx`
- File is added to FormData and sent via POST to `/api/process`
- Frontend shows loading state: "Processing interview..."

**Code Location:** `frontend/src/App.jsx` (lines 24-74)

### 2. **Backend Receives File**
- Express server receives the file via Multer middleware
- File is stored in memory (buffer)
- Server logs file metadata (name, type, size)

**Code Location:** `backend/server.js` (lines 112-125)

### 3. **AI Processing Pipeline**

#### Step 3a: Transcription (Transcriber Agent)
- **Agent:** `transcriberAgent.js`
- **Input:** Audio/Video file buffer
- **Process:**
  1. Converts file to base64
  2. Sends to Gemini AI with transcription prompt
  3. Receives transcript with speaker identification
  4. Extracts speaker names (Interviewer, Interviewee, etc.)
- **Output:** 
  ```javascript
  {
    transcript: "Full transcript text...",
    speakers: [{ id: 1, name: "Interviewer" }, ...],
    metadata: { mimeType, fileSize, processedAt }
  }
  ```

**Code Location:** `backend/src/services/aiService/agents/transcriberAgent.js`

#### Step 3b: Insight Extraction (Insight Agent)
- **Agent:** `insightAgent.js`
- **Input:** Transcript text from Step 3a
- **Process:**
  1. Sends transcript to Gemini AI with insight extraction prompt
  2. AI analyzes transcript for:
     - Pain points (problems, frustrations)
     - Feature requests (what users want)
     - Direct quotes (user statements)
     - Sentiment analysis (emotional tone)
  3. Parses JSON response (handles markdown code blocks)
  4. Normalizes data structure
- **Output:**
  ```javascript
  {
    insights: [
      {
        id: 1,
        type: "pain_point",
        summary: "Brief summary",
        category: "pain" | "need" | "opportunity",
        quote: "Direct user quote",
        sentiment: 0.5, // -1 to 1
        context: "Additional context",
        priority: "high" | "medium" | "low"
      },
      ...
    ],
    overallSentiment: {
      score: 0.3,
      label: "mixed",
      summary: "Overall sentiment"
    }
  }
  ```

**Code Location:** `backend/src/services/aiService/agents/insightAgent.js`

### 4. **Response Processing**
- Backend combines transcription and insights
- Ensures data structure is correct:
  - `transcript` is always a string
  - `insights` is always an array
  - Handles empty arrays gracefully
- Logs result for debugging

**Code Location:** `backend/server.js` (lines 82-110, 127-144)

### 5. **Frontend Receives Response**
- Axios receives JSON response
- Data is extracted:
  ```javascript
  const transcriptData = response.data.transcript || "";
  const insightsData = Array.isArray(response.data.insights) 
    ? response.data.insights 
    : [];
  ```
- State is updated:
  - `setTranscript(transcriptData)`
  - `setInsights(insightsData)`

**Code Location:** `frontend/src/App.jsx` (lines 51-65)

### 6. **Display in UI**

#### Transcript Display
- Shows in scrollable container
- Displays full transcript text
- If empty, shows placeholder message

**Code Location:** `frontend/src/App.jsx` (lines 248-291)

#### Insights Display
- Header shows count: `Insights ({insights.length})`
- If empty array: Shows placeholder message
- If insights exist: Maps through array and displays:
  - **Summary** (main text)
  - **Category badge** (color-coded):
    - Pain: Red background (#7f1d1d)
    - Need: Blue background (#1e3a8a)
    - Opportunity: Green background (#14532d)
  - **Quote** (if available, shown in italic with left border)

**Code Location:** `frontend/src/App.jsx` (lines 293-424)

## Data Structure Examples

### Example API Response
```json
{
  "transcript": "Product manager: Thanks for taking the time...",
  "insights": [
    {
      "id": 1,
      "summary": "Users leverage the insights dashboard...",
      "category": "opportunity",
      "quote": "I upload our interview recordings..."
    },
    {
      "id": 2,
      "summary": "Automated transcription is highly valued...",
      "category": "opportunity",
      "quote": "The transcription and quotes are super helpful..."
    },
    {
      "id": 3,
      "summary": "Users struggle to translate insights...",
      "category": "pain",
      "quote": "I sometimes struggle to connect insights..."
    },
    {
      "id": 4,
      "summary": "Need for direct feature recommendations...",
      "category": "need",
      "quote": "Clear feature recommendations..."
    }
  ],
  "speakers": [
    { "id": 1, "name": "Product manager" },
    { "id": 2, "name": "Client" }
  ],
  "metadata": {
    "mimeType": "audio/mpeg",
    "fileSize": 1234567,
    "processedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

## Common Issues & Solutions

### Issue: "Insights (0)" showing but data exists
**Possible Causes:**
1. JSON parsing failed (response wrapped in markdown)
2. Insights array is not properly structured
3. Frontend state not updating

**Solutions Implemented:**
- Enhanced JSON parsing to handle markdown code blocks
- Normalization functions ensure consistent structure
- Array checks before setting state
- Debug logging in backend

### Issue: Empty insights array
**Possible Causes:**
1. Transcript is empty or too short
2. AI couldn't extract meaningful insights
3. JSON parsing error

**Solutions:**
- Fallback parsing if JSON fails
- Error handling with empty array fallback
- Validation checks at each step

## Testing the Flow

1. **Upload a test file:**
   ```bash
   curl -X POST http://localhost:5000/api/process \
     -F "file=@interview.mp3"
   ```

2. **Check backend logs:**
   - File received
   - Processing result (transcript length, insights count)
   - Any errors

3. **Check browser console:**
   - Response received
   - Transcript length
   - Insights count
   - State updates

## Next Steps (Future Enhancements)

1. **Pattern Agent:** Analyze multiple interviews for trends
2. **PRD Agent:** Generate Product Requirements Document
3. **Database Storage:** Save interviews and insights
4. **User Authentication:** Secure access
5. **Real-time Updates:** WebSocket for progress updates

## File Structure

```
backend/
├── server.js                    # Main Express server
└── src/
    └── services/
        └── aiService/
            ├── index.js         # Export all agents
            ├── agents/
            │   ├── transcriberAgent.js
            │   ├── insightAgent.js
            │   ├── patternAgent.js
            │   └── prdAgent.js
            ├── prompts/
            │   ├── transcriber.js
            │   ├── insight.js
            │   ├── pattern.js
            │   └── prd.js
            └── utils/
                └── geminiClient.js

frontend/
└── src/
    └── App.jsx                  # Main React component
```

## Environment Variables

**Backend (.env):**
```
GEMINI_API_KEY=your_api_key_here
PORT=5000
FRONTEND_ORIGIN=http://localhost:3000
```

**Frontend (.env):**
```
REACT_APP_API_BASE_URL=http://localhost:5000
```
