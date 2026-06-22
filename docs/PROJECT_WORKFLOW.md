# Project Workflow Guide

## New Workflow: Project-Based Interview Processing

### Overview
The system now works with **Projects** that organize interviews, insights, and PRDs. Here's the complete workflow:

```
1. Create/Select Project
   ↓
2. Upload Interview (processes with 4 agents)
   ↓
3. View Transcript + Insights
   ↓
4. Generate PRD
   ↓
5. Edit PRD (optional)
   ↓
6. Save to Project (saves interview + insights + PRD)
   ↓
7. Open Project Later (fetches all saved data)
```

---

## Step-by-Step Workflow

### Step 1: Create or Select Project

**Option A: Create New Project**
1. Click "+ New Project" button
2. Enter project name (required)
3. Enter description (optional)
4. Click "Create Project"
5. Project is automatically selected

**Option B: Select Existing Project**
1. Use dropdown to select from existing projects
2. Project data loads automatically (interviews, PRD if exists)

**API Endpoints:**
- `POST /api/projects` - Create project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get specific project with all data

---

### Step 2: Upload and Process Interview

1. Select interview file (audio/video)
2. Click "Generate transcript & insights"
3. **4 AI Agents process the file:**
   - **Transcriber Agent** → Converts audio to text with speakers
   - **Insight Agent** → Extracts pain points, needs, opportunities, features
   - (Pattern Agent - for multiple interviews later)
   - (PRD Agent - generates PRD in next step)

**What happens:**
- Interview is processed
- Transcript is generated
- Insights are extracted
- Interview is saved to database (with interview ID returned)

**API Endpoint:**
- `POST /api/process` - Upload and process interview

---

### Step 3: View Results

After processing, you see:
- **Transcript** - Full interview text with speaker identification
- **Insights** - Categorized insights (Pain, Need, Opportunity, Feature)

**Data is displayed but NOT yet saved to project.**

---

### Step 4: Generate PRD

1. Scroll to "4. Generate PRD" section
2. If project is selected, project name is auto-filled
3. If no project, enter project name
4. Click "Generate PRD"
5. **PRD Agent** generates structured PRD document

**What's generated:**
- Executive Summary
- Problem Statement
- User Personas
- Goals & Success Metrics
- Features & Requirements
- Timeline
- Success Metrics

**API Endpoint:**
- `POST /api/generate-prd` - Generate PRD from insights

---

### Step 5: Edit PRD (Optional)

1. Click "Edit PRD" button
2. Click on any field to edit:
   - Title, Version, Date
   - Executive Summary
   - Problem Statement (Problem, Impact, Current/Desired State)
   - User Personas
   - Features
3. Click "Remove" to delete sections you don't want
4. Changes are saved in memory (not to database yet)

**Features:**
- ✅ Edit any text field
- ✅ Remove entire sections
- ✅ Multi-line editing for descriptions
- ✅ Real-time updates

---

### Step 6: Save to Project

1. Click "Save to Project" button
2. **What gets saved:**
   - Interview (transcript, insights, speakers, sentiment)
   - PRD document (full edited version)
   - Links interview to project

**API Endpoints:**
- `POST /api/projects/:id/save` - Save interview + PRD to project
- `PUT /api/projects/:id/prd` - Update PRD in project

**What's saved:**
```javascript
Project {
  interviews: [interviewId],  // Interview linked to project
  prd: {
    generatedAt: Date,
    document: { ...full PRD... }  // Your edited PRD
  }
}
```

---

### Step 7: Open Project Later

1. Select project from dropdown
2. **System automatically loads:**
   - All interviews in project
   - Transcript and insights from interviews
   - Saved PRD document
3. You can continue editing or add more interviews

**API Endpoint:**
- `GET /api/projects/:id` - Get project with all data

---

## Database Models Explained

### Project Model
**Stores:**
- Project name and description
- Array of interview IDs (references)
- Pattern analysis results (for multiple interviews)
- PRD document (full structure)

**Why:**
- Organize related interviews
- Store project-level analysis
- Keep PRD version history

### Interview Model
**Stores:**
- Full transcript
- Extracted insights (pre-computed)
- Speakers information
- Sentiment analysis
- File metadata
- Project reference (projectId)

**Why:**
- Pre-compute insights (don't re-run AI)
- Fast access to interview data
- Link to projects for organization

---

## API Endpoints Summary

### Projects
- `POST /api/projects` - Create new project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get specific project with all data
- `POST /api/projects/:id/save` - Save interview + PRD to project
- `PUT /api/projects/:id/prd` - Update PRD in project

### Interviews
- `POST /api/process` - Upload and process interview (saves to DB)
- `GET /api/interviews` - Get all interviews
- `GET /api/interviews/:id` - Get specific interview

### PRD
- `POST /api/generate-prd` - Generate PRD from insights/interviews

---

## Workflow Examples

### Example 1: New Project with Single Interview

```
1. Create "Q1 Discovery" project
   → Project ID: abc123

2. Upload interview.mp3
   → Processed, Interview ID: xyz789
   → Transcript + Insights displayed

3. Generate PRD
   → PRD generated and displayed

4. Edit PRD
   → Remove "Timeline" section
   → Edit "Problem Statement"

5. Save to Project
   → Interview xyz789 linked to project abc123
   → PRD saved to project abc123
   → Everything persisted in database
```

### Example 2: Open Existing Project

```
1. Select "Q1 Discovery" project
   → System loads project data
   → Shows existing interview
   → Shows saved PRD

2. Can:
   - View/edit existing PRD
   - Add new interview
   - Export PRD
   - Continue working
```

---

## Key Features

### ✅ Project Management
- Create multiple projects
- Organize interviews by project
- Track project-level analysis

### ✅ Editable PRD
- Edit any section
- Remove unwanted sections
- Real-time editing
- Changes saved when you click "Save to Project"

### ✅ Save Functionality
- One-click save
- Saves interview + insights + PRD
- Links everything to project
- Can reopen and continue editing

### ✅ Export Options
- Export as Markdown (.md)
- Export as PDF (print dialog)
- Available from PRD editor

---

## Data Flow

```
User Action → Frontend → Backend API → Database
     ↓
1. Create Project
   → POST /api/projects
   → Project saved
   → Project ID returned

2. Upload Interview
   → POST /api/process
   → AI Agents process
   → Interview saved
   → Interview ID returned

3. Generate PRD
   → POST /api/generate-prd
   → PRD Agent generates
   → PRD returned (not saved yet)

4. Edit PRD
   → Frontend editing
   → Changes in memory

5. Save to Project
   → POST /api/projects/:id/save
   → Interview linked
   → PRD saved to project

6. Open Project
   → GET /api/projects/:id
   → All data loaded
   → Displayed in UI
```

---

## Why This Structure?

### Projects vs Interviews
- **Project** = Container for analysis (multiple interviews, patterns, PRD)
- **Interview** = Single data point (one interview, its insights)

### Why Save Separately?
- **Interview** saved immediately after processing (so you don't lose data)
- **PRD** saved when you're ready (after editing)
- **Project** links everything together

### Benefits
- ✅ Don't lose work (interview saved immediately)
- ✅ Edit PRD before committing
- ✅ Organize multiple interviews per project
- ✅ Reopen projects and continue work

---

## Next Steps (Future)

1. **Pattern Analysis** - When you have multiple interviews in a project
2. **PRD Versioning** - Track PRD changes over time
3. **Collaboration** - Share projects with team
4. **Templates** - PRD templates for different product types

---

**The workflow is now complete!** Create project → Process interview → Generate PRD → Edit → Save → Reopen later! 🚀
