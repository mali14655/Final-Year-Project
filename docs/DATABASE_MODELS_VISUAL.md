# Database Models - Visual Guide

## Database Structure Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CURSOR-FOR-PMS DATABASE                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│    USERS     │  ← User accounts
├──────────────┤
│ _id          │
│ email        │  ← Login identifier
│ password     │  ← Hashed password
│ name         │  ← Display name
│ createdAt    │
│ updatedAt    │
└──────────────┘
       │
       │ (1:Many)
       │
       ▼
┌──────────────┐
│  PROJECTS    │  ← Organize interviews
├──────────────┤
│ _id          │
│ name         │  ← "Q1 Discovery"
│ description  │
│ userId       │  ──→ User (owner)
│ interviews[] │  ──→ [Interview IDs]
│              │
│ patterns: {  │  ← Cross-interview analysis
│   identifiedAt│
│   patterns[]  │
│   summary    │
│ }            │
│              │
│ prd: {       │  ← Generated PRD
│   generatedAt│
│   document   │
│ }            │
│ createdAt    │
│ updatedAt    │
└──────────────┘
       │
       │ (1:Many)
       │
       ▼
┌──────────────┐
│ INTERVIEWS   │  ← Processed interviews
├──────────────┤
│ _id          │
│ filename     │  ← "interview_20240115.mp3"
│ originalName │
│ mimeType     │  ← "audio/mpeg"
│ fileSize     │  ← 5242880 bytes
│              │
│ transcript   │  ← Full text transcript
│              │
│ speakers: [  │  ← Who said what
│   {id, name} │
│ ]            │
│              │
│ insights: [  │  ← Extracted insights
│   {          │
│     id       │
│     type     │  ← "pain_point", "feature_request"
│     summary  │
│     category │  ← "pain", "need", "opportunity"
│     quote    │  ← Direct user quote
│     sentiment│  ← -1 to 1
│     priority │  ← "high", "medium", "low"
│   }          │
│ ]            │
│              │
│ overallSentiment: {
│   score      │  ← Overall interview sentiment
│   label      │  ← "positive", "negative"
│   summary    │
│ }            │
│              │
│ projectId    │  ──→ Project (optional)
│ userId       │  ──→ User (owner)
│              │
│ metadata: {  │
│   processedAt│  ← When AI finished
│   duration   │  ← Interview length
│ }            │
│ createdAt    │
│ updatedAt    │
└──────────────┘
```

---

## Data Relationships

```
USER
 │
 ├─→ Creates PROJECTS (1:Many)
 │   │
 │   └─→ Contains INTERVIEWS (1:Many)
 │       │
 │       └─→ Has INSIGHTS (1:Many)
 │
 └─→ Owns INTERVIEWS (1:Many)
     │
     └─→ Has INSIGHTS (1:Many)
```

---

## Why Each Model Exists

### 1. **User Model**
**Purpose:** Authentication & Authorization
- Who can access what
- Track ownership
- Multi-user support

**Saves:**
- Login credentials
- User profile info

---

### 2. **Interview Model**
**Purpose:** Store processed interview data
- Raw interview content (transcript)
- AI-processed insights
- Metadata for tracking

**Saves:**
- Full transcript (for search/reference)
- Pre-computed insights (avoid re-processing)
- File information
- Sentiment analysis

**Why pre-compute insights?**
- AI processing is expensive (time + API costs)
- Users view insights multiple times
- Faster response times
- Can analyze across interviews

---

### 3. **Project Model**
**Purpose:** Organize & analyze multiple interviews
- Group related interviews
- Store cross-interview analysis
- Store generated PRD

**Saves:**
- Interview references (not full data)
- Pattern analysis results
- PRD documents

**Why separate from Interview?**
- Projects = Analysis level (multiple interviews)
- Interviews = Data level (single interview)
- Can have projects without interviews (planning)
- Can have interviews without projects (unorganized)

---

## Data Flow Example

### Scenario: User uploads interview

```
1. User uploads "user_interview.mp3"
   ↓
2. Backend processes:
   - Transcribe audio → transcript
   - Extract insights → insights array
   - Identify speakers → speakers array
   - Analyze sentiment → overallSentiment
   ↓
3. Create Interview document:
   {
     filename: "user_interview.mp3",
     transcript: "Product manager: Thanks...",
     insights: [
       {
         category: "pain",
         summary: "Users struggle...",
         quote: "I sometimes struggle..."
       }
     ],
     speakers: [...],
     overallSentiment: {...}
   }
   ↓
4. Save to Interviews collection
   ↓
5. Return interview ID to frontend
```

### Scenario: User creates project and adds interviews

```
1. User creates "Q1 Discovery" project
   ↓
2. Create Project document:
   {
     name: "Q1 Discovery",
     userId: "user123",
     interviews: []
   }
   ↓
3. User adds interviews to project
   ↓
4. Update Project:
   {
     interviews: ["interview1", "interview2"]
   }
   ↓
5. Run pattern analysis
   ↓
6. Update Project:
   {
     patterns: {
       patterns: [...],
       summary: {...}
     }
   }
   ↓
7. Generate PRD
   ↓
8. Update Project:
   {
     prd: {
       document: {...}
     }
   }
```

---

## Storage Size Estimates

### Per Interview:
- **Transcript:** ~10-50 KB (depends on length)
- **Insights:** ~1-5 KB (5-10 insights)
- **Metadata:** ~0.5 KB
- **Total:** ~15-60 KB per interview

### Per Project:
- **Basic info:** ~0.5 KB
- **Patterns:** ~5-20 KB (depends on analysis)
- **PRD:** ~10-50 KB (depends on complexity)
- **Total:** ~15-70 KB per project

### Example:
- 100 interviews = ~1.5-6 MB
- 10 projects = ~150-700 KB
- **Total for active user:** ~2-7 MB

**Very manageable!** MongoDB can handle millions of documents.

---

## Index Strategy

**Why indexes?**
Make queries fast by creating "lookup tables"

**Our indexes:**

1. **User.email** → Fast login
2. **Interview.projectId** → Fast "get project interviews"
3. **Interview.userId** → Fast "get my interviews"
4. **Interview.createdAt** → Fast "show recent"
5. **Interview.insights.category** → Fast "show pain points"

**Trade-off:**
- Indexes make queries faster
- But use extra storage space
- Worth it for our use case!

---

## Security Considerations

### What's Safe to Store:
✅ Transcripts (user data)
✅ Insights (processed data)
✅ Projects (user organization)
✅ PRD documents (generated content)

### What to Protect:
🔒 User passwords (must be hashed with bcrypt)
🔒 API keys (in .env, never in code)
🔒 Database connection strings (in .env)

### Access Control:
- Users can only see their own interviews/projects
- Use `userId` field to filter queries
- Never return other users' data

---

## Backup Strategy

### Recommended:
1. **MongoDB Atlas:** Automatic backups (free tier)
2. **Local MongoDB:** Manual backups or scheduled scripts
3. **Export:** Use `mongoexport` for JSON backups

### Backup Command:
```bash
mongoexport --db cursor-for-pms --collection interviews --out interviews_backup.json
```

---

**Database is well-structured and ready for production!** 🚀
