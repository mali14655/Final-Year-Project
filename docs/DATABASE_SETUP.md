# Database Setup & Model Explanation Guide

## Overview

This project uses **MongoDB** (NoSQL database) with **Mongoose** (ODM - Object Document Mapper) to store:
- User interviews and their insights
- Projects that organize multiple interviews
- User accounts
- Pattern analysis results
- Generated PRD documents

---

## Database Connection Setup

### Step 1: Install MongoDB

**Option A: Local MongoDB**
```bash
# Download and install from: https://www.mongodb.com/try/download/community
# Or use MongoDB Compass (GUI tool)
```

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster (free tier available)
4. Get connection string

### Step 2: Set Environment Variable

Create or update `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/cursor-for-pms
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cursor-for-pms
```

### Step 3: Verify Connection

The database connects automatically when the server starts. You should see:
```
MongoDB connected successfully
```

---

## Database Models Explained

### 1. User Model (`User.js`)

**Purpose:** Store user account information for authentication and authorization.

**Fields:**
```javascript
{
  email: String (required, unique),    // User's email address
  password: String (required),         // Hashed password (never store plain text!)
  name: String (required),             // User's full name
  createdAt: Date (auto),              // When account was created
  updatedAt: Date (auto)                // Last update time
}
```

**Why we save this:**
- **Email:** Used for login and account identification
- **Password:** Authentication (must be hashed with bcrypt)
- **Name:** Display name in the UI
- **Timestamps:** Track when accounts are created/updated

**Indexes:**
- `email: 1` - Fast lookups by email (login queries)

**Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "pm@example.com",
  "password": "$2b$10$hashedpassword...",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### 2. Interview Model (`Interview.js`)

**Purpose:** Store processed interview data including transcript, insights, and metadata.

**Fields:**

#### Basic File Information
```javascript
{
  filename: String (required),         // Stored filename
  originalName: String (required),     // Original upload filename
  mimeType: String (required),        // File type (audio/mpeg, video/mp4, etc.)
  fileSize: Number (required)          // File size in bytes
}
```

**Why we save this:**
- **filename/originalName:** Track which file was uploaded
- **mimeType:** Know file format for processing
- **fileSize:** Monitor storage usage, validate uploads

#### Interview Content
```javascript
{
  transcript: String (required),       // Full interview transcript
  speakers: [Speaker],                 // Array of identified speakers
  insights: [Insight]                 // Array of extracted insights
}
```

**Why we save this:**
- **transcript:** Full text for search, reference, and re-analysis
- **speakers:** Track who said what (Interviewer vs Interviewee)
- **insights:** Pre-processed insights for quick access (don't need to re-run AI)

#### Insight Schema (Nested)
```javascript
{
  id: Number,                          // Unique ID within interview
  type: "pain_point" | "feature_request" | "quote" | "sentiment",
  summary: String,                    // Brief insight summary
  category: "pain" | "need" | "opportunity" | "feature",
  quote: String,                      // Direct user quote
  sentiment: Number (-1 to 1),        // Sentiment score
  context: String,                     // Additional context
  priority: "high" | "medium" | "low" // Insight priority
}
```

**Why we save insights:**
- **Pre-computed:** Don't re-run AI every time user views insights
- **Searchable:** Can search across all insights
- **Analyzable:** Use for pattern analysis across interviews
- **Traceable:** Link back to original quotes and context

#### Sentiment Analysis
```javascript
{
  overallSentiment: {
    score: Number (-1 to 1),          // Overall sentiment score
    label: String,                    // "positive", "negative", "neutral"
    summary: String                    // Sentiment summary text
  }
}
```

**Why we save this:**
- **Quick overview:** See interview tone at a glance
- **Filtering:** Filter interviews by sentiment
- **Trends:** Track sentiment changes over time

#### Relationships
```javascript
{
  projectId: ObjectId (ref: Project), // Which project this belongs to
  userId: ObjectId (ref: User)       // Who uploaded/owns this
}
```

**Why we save this:**
- **Organization:** Group interviews by project
- **Access control:** Show only user's interviews
- **Analytics:** Track per-user and per-project usage

#### Metadata
```javascript
{
  metadata: {
    processedAt: Date,                // When AI processing completed
    duration: Number                 // Interview duration (if available)
  },
  createdAt: Date (auto),             // Upload time
  updatedAt: Date (auto)              // Last update time
}
```

**Why we save this:**
- **Processing tracking:** Know when processing finished
- **Duration:** Useful for analytics and billing
- **Timestamps:** Sort by date, track changes

**Indexes:**
- `projectId: 1` - Fast queries for project's interviews
- `userId: 1` - Fast queries for user's interviews
- `createdAt: -1` - Fast sorting by date (newest first)
- `insights.category: 1` - Fast filtering by insight category

**Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "filename": "interview_20240115.mp3",
  "originalName": "user_interview.mp3",
  "mimeType": "audio/mpeg",
  "fileSize": 5242880,
  "transcript": "Product manager: Thanks for taking the time...",
  "speakers": [
    { "id": 1, "name": "Product manager", "label": "Interviewer" },
    { "id": 2, "name": "Client", "label": "Interviewee" }
  ],
  "insights": [
    {
      "id": 1,
      "type": "pain_point",
      "summary": "Users struggle to connect insights to features",
      "category": "pain",
      "quote": "I sometimes struggle to connect insights...",
      "sentiment": -0.3,
      "context": "Feature prioritization challenge",
      "priority": "high"
    }
  ],
  "overallSentiment": {
    "score": 0.2,
    "label": "mixed",
    "summary": "Generally positive with some concerns"
  },
  "projectId": "507f1f77bcf86cd799439013",
  "userId": "507f1f77bcf86cd799439011",
  "metadata": {
    "processedAt": "2024-01-15T10:35:00Z",
    "duration": 1800
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

---

### 3. Project Model (`Project.js`)

**Purpose:** Organize multiple interviews into projects and store project-level analysis (patterns, PRD).

**Fields:**

#### Basic Project Info
```javascript
{
  name: String (required),            // Project name
  description: String,                 // Project description
  userId: ObjectId (ref: User)        // Project owner
}
```

**Why we save this:**
- **Organization:** Group related interviews together
- **Context:** Provide project context for analysis
- **Ownership:** Track who created the project

#### Interview References
```javascript
{
  interviews: [ObjectId (ref: Interview)]  // Array of interview IDs
}
```

**Why we save this:**
- **Relationships:** Link interviews to projects
- **Quick access:** Get all interviews for a project
- **Analysis:** Run pattern analysis on project interviews

#### Pattern Analysis Results
```javascript
{
  patterns: {
    identifiedAt: Date,               // When patterns were analyzed
    patterns: [{                      // Array of identified patterns
      id: Number,
      name: String,                   // Pattern name
      type: String,                   // "theme", "trend", "pain_point"
      description: String,             // Pattern description
      frequency: Number,               // How many interviews mention it
      frequencyPercentage: Number,     // Percentage of interviews
      severity: String,                // "high", "medium", "low"
      affectedInterviews: [ObjectId],  // Which interviews
      supportingQuotes: [String],      // Evidence quotes
      userSegments: [String],          // Affected user groups
      recommendations: [String]        // Action recommendations
    }],
    summary: {
      totalInterviews: Number,        // Total analyzed
      topThemes: [String],            // Most common themes
      criticalIssues: [String],       // Critical problems
      emergingTrends: [String]         // New trends
    }
  }
}
```

**Why we save patterns:**
- **Pre-computed:** Don't re-analyze every time
- **Historical:** Track how patterns change over time
- **Reference:** Use in PRD generation
- **Insights:** Understand trends across interviews

#### PRD Document
```javascript
{
  prd: {
    generatedAt: Date,                 // When PRD was generated
    document: {                        // Full PRD structure
      title: String,
      version: String,
      date: String,
      executiveSummary: String,
      problemStatement: { ... },
      userPersonas: [ ... ],
      goals: [ ... ],
      features: [ ... ],
      timeline: { ... },
      successMetrics: { ... }
    }
  }
}
```

**Why we save PRD:**
- **Version history:** Keep track of PRD versions
- **Quick access:** Don't regenerate every time
- **Sharing:** Share PRD with team members
- **Updates:** Update PRD as new interviews come in

**Indexes:**
- `userId: 1` - Fast queries for user's projects
- `createdAt: -1` - Fast sorting by date

**Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "name": "Product Discovery Q1 2024",
  "description": "User interviews for new feature planning",
  "userId": "507f1f77bcf86cd799439011",
  "interviews": [
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439014"
  ],
  "patterns": {
    "identifiedAt": "2024-01-20T14:00:00Z",
    "patterns": [
      {
        "id": 1,
        "name": "Feature Recommendation Need",
        "type": "theme",
        "description": "Users consistently request automated feature suggestions",
        "frequency": 5,
        "frequencyPercentage": 83.3,
        "severity": "high",
        "affectedInterviews": ["507f1f77bcf86cd799439012"],
        "supportingQuotes": ["Clear feature recommendations..."],
        "userSegments": ["Product Managers"],
        "recommendations": ["Build automated recommendation engine"]
      }
    ],
    "summary": {
      "totalInterviews": 6,
      "topThemes": ["Feature Recommendations", "Priority Suggestions"],
      "criticalIssues": ["Manual insight-to-feature translation"],
      "emergingTrends": ["AI-powered product planning"]
    }
  },
  "prd": {
    "generatedAt": "2024-01-25T10:00:00Z",
    "document": {
      "title": "Feature Recommendation Engine PRD",
      "version": "1.0",
      "date": "2024-01-25",
      "executiveSummary": "...",
      "problemStatement": { ... },
      "features": [ ... ]
    }
  },
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-25T10:00:00Z"
}
```

---

## Database Relationships

```
User (1) ──→ (Many) Projects
  │
  └──→ (Many) Interviews

Project (1) ──→ (Many) Interviews
  │
  ├──→ Patterns (1:1)
  └──→ PRD (1:1)
```

**Why this structure:**
- **User owns Projects:** Each project belongs to one user
- **Project contains Interviews:** Group related interviews
- **User owns Interviews:** Track who uploaded what
- **Project has Patterns/PRD:** Project-level analysis results

---

## Why We Save Each Field

### Interview Model Fields

| Field | Why Save It |
|-------|-------------|
| `transcript` | Full text for search, re-analysis, reference |
| `insights` | Pre-computed to avoid re-running expensive AI calls |
| `speakers` | Track who said what, useful for analysis |
| `overallSentiment` | Quick overview, filtering, trend analysis |
| `projectId` | Organize interviews by project |
| `userId` | Access control, user-specific views |
| `metadata.processedAt` | Track processing status, debugging |
| `fileSize` | Storage monitoring, billing |

### Project Model Fields

| Field | Why Save It |
|-------|-------------|
| `interviews` | Link interviews to projects, run analysis |
| `patterns` | Pre-computed cross-interview analysis |
| `prd` | Generated PRD document, version history |
| `name/description` | Project context and organization |

### User Model Fields

| Field | Why Save It |
|-------|-------------|
| `email` | Login, account identification |
| `password` | Authentication (hashed) |
| `name` | Display name in UI |

---

## Database Indexes Explained

**What are indexes?**
Indexes make database queries faster by creating a "table of contents" for your data.

**Our indexes:**

1. **`email: 1` (User)**
   - **Why:** Login queries need to be fast
   - **Query:** "Find user with email X"

2. **`projectId: 1` (Interview)**
   - **Why:** Get all interviews for a project
   - **Query:** "Show all interviews in project X"

3. **`userId: 1` (Interview, Project)**
   - **Why:** Show user's own data
   - **Query:** "Show my interviews/projects"

4. **`createdAt: -1` (Interview, Project)**
   - **Why:** Sort by newest first
   - **Query:** "Show recent interviews"

5. **`insights.category: 1` (Interview)**
   - **Why:** Filter by insight type
   - **Query:** "Show all pain points"

---

## Data Flow

```
1. User uploads interview file
   ↓
2. AI processes: Transcription + Insights
   ↓
3. Save to Interview collection
   - transcript
   - insights (pre-computed)
   - speakers
   - sentiment
   ↓
4. User creates/selects Project
   ↓
5. Link Interview to Project
   ↓
6. Run Pattern Analysis (multiple interviews)
   ↓
7. Save Patterns to Project
   ↓
8. Generate PRD from Insights + Patterns
   ↓
9. Save PRD to Project
```

**Why this flow:**
- **Interview = Raw data** (one interview)
- **Project = Analysis** (multiple interviews, patterns, PRD)
- **Separation:** Keep raw data separate from analysis

---

## Storage Considerations

### What Takes Space:
1. **Transcripts** - Can be large (10-50KB per interview)
2. **PRD Documents** - Structured but detailed (5-20KB)
3. **Patterns** - Small (1-5KB)
4. **Insights** - Small (1-2KB per insight)

### Optimization:
- **Indexes:** Fast queries, but use extra space
- **References:** Store ObjectIds, not full documents
- **GridFS:** For large files (audio/video) - not implemented yet

---

## Next Steps

1. **Set up MongoDB** (local or Atlas)
2. **Add MONGODB_URI to .env**
3. **Start server** - Connection happens automatically
4. **Verify:** Check console for "MongoDB connected successfully"

---

## Common Queries

### Get all interviews for a project:
```javascript
const interviews = await Interview.find({ projectId: projectId });
```

### Get user's projects:
```javascript
const projects = await Project.find({ userId: userId });
```

### Get interviews with pain points:
```javascript
const interviews = await Interview.find({ 
  "insights.category": "pain" 
});
```

### Get project with patterns:
```javascript
const project = await Project.findById(projectId)
  .populate('interviews');
```

---

**Database is ready to use!** Once MongoDB is running and connected, all interview data will be automatically saved. 🚀
