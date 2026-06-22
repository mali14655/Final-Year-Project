# AI Service - Agent Documentation

This service provides four specialized AI agents for processing user interviews and generating product insights.

## Agents Overview

### 1. Transcriber Agent
Converts audio/video interviews into text with speaker identification.

**Usage:**
```javascript
import { transcribeInterview } from './services/aiService/index.js';

const result = await transcribeInterview(file);
// Returns: { transcript: string, speakers: Array, metadata: Object }
```

### 2. Insight Agent
Extracts pain points, feature requests, quotes, and sentiment from interview transcripts.

**Usage:**
```javascript
import { extractInsights } from './services/aiService/index.js';

const result = await extractInsights(transcript);
// Returns: { insights: Array, overallSentiment: Object }
```

### 3. Pattern Agent
Identifies trends and common themes across multiple interviews.

**Usage:**
```javascript
import { identifyPatterns } from './services/aiService/index.js';

const interviews = [
  { id: 1, transcript: "...", insights: [...] },
  { id: 2, transcript: "...", insights: [...] }
];

const result = await identifyPatterns(interviews);
// Returns: { patterns: Array, summary: Object }
```

### 4. PRD Agent
Converts insights and patterns into a structured Product Requirements Document.

**Usage:**
```javascript
import { generatePRD } from './services/aiService/index.js';

const data = {
  insights: [...],
  patterns: [...],
  projectContext: { name: "Project Name", description: "..." }
};

const prd = await generatePRD(data);
// Returns: Structured PRD object
```

## Complete Workflow Example

```javascript
import {
  transcribeInterview,
  extractInsights,
  identifyPatterns,
  generatePRD
} from './services/aiService/index.js';

// Step 1: Transcribe interview
const transcription = await transcribeInterview(uploadedFile);

// Step 2: Extract insights
const insights = await extractInsights(transcription.transcript);

// Step 3: Identify patterns (after multiple interviews)
const patterns = await identifyPatterns([
  { id: 1, transcript: transcription.transcript, insights: insights.insights }
]);

// Step 4: Generate PRD
const prd = await generatePRD({
  insights: insights.insights,
  patterns: patterns.patterns,
  projectContext: { name: "My Product", description: "..." }
});
```

## Environment Variables

Make sure to set `GEMINI_API_KEY` in your `.env` file:
```
GEMINI_API_KEY=your_api_key_here
```
