# New Project Workflow - Cards View & Chat Editing

## Overview

The application now features a **project cards view** where you can see all your projects at a glance, and a **detailed project view** with chat-based editing for transcripts and insights.

---

## Main Features

### 1. **Project Cards View**
- Display all projects as cards
- Each card shows:
  - Project name and description
  - Number of interviews
  - PRD status
  - Patterns status
  - Last updated date
- Click a card to open project details
- Create new project button

### 2. **Project Detail View**
- **Tabs**: Interviews, PRD, Patterns
- **Interview Management**:
  - Upload new interviews
  - View all interviews in project
  - Select interview to view/edit
- **Chat-Based Editing**:
  - Edit transcript via chat
  - Edit insights via chat
  - Quick actions (Fix Grammar, Remove Duplicates, etc.)
- **Save Changes**: One-click save for all edits

### 3. **Chat Editor**
- Switch between Transcript and Insights views
- AI-powered editing via natural language
- Quick action buttons
- Real-time updates

---

## Workflow

### Step 1: View Projects
1. App opens to **Project Cards** view
2. See all your projects as cards
3. Each card shows key stats

### Step 2: Open or Create Project
**Option A: Open Existing Project**
- Click on a project card
- Project detail view opens

**Option B: Create New Project**
- Click "+ New Project" button
- Enter project name and description
- Project is created and opened

### Step 3: Upload Interview
1. Go to **Interviews** tab
2. Click "Upload Interview"
3. Select audio/video file
4. Click "Process Interview"
5. Interview is processed and saved to project

### Step 4: Edit Transcript/Insights
1. Select an interview from the list
2. **Chat Editor** appears on the right
3. Switch between "Transcript" and "Insights" tabs
4. Use chat to edit:
   - Type: "Fix grammar in transcript"
   - Type: "Remove duplicate insights"
   - Type: "Change insight 1 category to pain"
5. Changes are applied immediately
6. Click "💾 Save Changes" to persist

### Step 5: Generate PRD
1. Go to **PRD** tab
2. Click "Generate PRD"
3. PRD is generated from insights
4. Edit PRD if needed
5. Save to project

### Step 6: Save Project
- Click "💾 Save Changes" button (top right)
- Saves:
  - Edited transcript
  - Edited insights
  - PRD (if generated)
- All changes persisted to database

---

## Chat Commands Examples

### Transcript Editing
- "Fix grammar and spelling"
- "Remove the part about pricing"
- "Make the transcript more concise"
- "Correct speaker names"
- "Remove filler words"

### Insights Editing
- "Remove duplicate insights"
- "Remove insight about feature X"
- "Change category of insight 1 to pain"
- "Summarize similar insights"
- "Add more detail to insight 2"

---

## Component Structure

```
App.jsx
├── ProjectCards (main view)
│   └── Shows all projects as cards
│
└── ProjectDetail (detail view)
    ├── Tabs: Interviews, PRD, Patterns
    ├── Interview List (left)
    │   └── Upload form
    │   └── Interview cards
    │
    └── ChatEditor (right)
        ├── Transcript view
        ├── Insights view
        └── Chat interface
```

---

## API Endpoints Used

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project with all data
- `POST /api/projects` - Create project
- `POST /api/projects/:id/save` - Save interview to project

### Interviews
- `POST /api/process` - Upload and process interview
- `PUT /api/interviews/:id` - Update transcript/insights

### Chat
- `POST /api/chat/edit` - Edit transcript/insights via chat

---

## Key Features

### ✅ Project Cards View
- Visual card layout
- Quick project overview
- Easy navigation

### ✅ Chat-Based Editing
- Natural language commands
- AI-powered edits
- Quick actions
- Real-time updates

### ✅ Save Functionality
- One-click save
- Tracks unsaved changes
- Saves transcript, insights, PRD

### ✅ Interview Management
- Upload within project
- View all interviews
- Select to edit

---

## UI/UX Improvements

1. **Cards View**: Better visual organization
2. **Tab Navigation**: Easy switching between Interviews/PRD/Patterns
3. **Chat Interface**: Intuitive editing
4. **Save Indicator**: Shows when changes need saving
5. **Quick Actions**: One-click common edits

---

## Data Flow

```
User Action → Frontend → Backend API → Database
     ↓
1. Create Project
   → POST /api/projects
   → Project saved

2. Upload Interview
   → POST /api/process
   → Interview processed & saved
   → POST /api/projects/:id/save
   → Interview linked to project

3. Edit via Chat
   → POST /api/chat/edit
   → AI processes request
   → Changes returned
   → Frontend updates state

4. Save Changes
   → PUT /api/interviews/:id
   → Transcript/insights updated
   → Changes persisted
```

---

## Next Steps

1. **Pattern Analysis**: When multiple interviews exist
2. **PRD Versioning**: Track PRD changes
3. **Export Options**: Export from project view
4. **Collaboration**: Share projects with team

---

**The new workflow is complete!** 🎉

- Cards view for project overview
- Detailed view for editing
- Chat-based editing for easy modifications
- One-click save for all changes
