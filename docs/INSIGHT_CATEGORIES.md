# Insight Categories Explained

## Overview
When analyzing user interviews, insights are automatically categorized to help you understand different types of feedback. Here's what each category means:

## Category Definitions

### 🔴 **PAIN** (Pain Point)
**What it is:** Problems, frustrations, or challenges that users are currently experiencing.

**Examples:**
- "I struggle to find the right feature in the app"
- "The loading time is too slow"
- "I can't figure out how to export my data"
- "The interface is confusing"

**Why it matters:** Pain points identify what's broken or frustrating, helping you prioritize fixes and improvements.

**Color:** Red badge (#7f1d1d background)

---

### 🔵 **NEED** (User Need)
**What it is:** What users require or want to accomplish their goals, even if they haven't explicitly asked for it.

**Examples:**
- "I need a way to track my progress"
- "I wish I could collaborate with my team"
- "I need better reporting features"
- "I want to customize my dashboard"

**Why it matters:** Needs represent gaps between what users want and what currently exists. These are opportunities to add value.

**Color:** Blue badge (#1e3a8a background)

---

### 🟢 **OPPORTUNITY** (Opportunity)
**What it is:** Positive observations, things that work well, or potential areas for expansion and growth.

**Examples:**
- "I love how easy it is to use"
- "This feature saves me a lot of time"
- "I use this every day"
- "My team would benefit from this"

**Why it matters:** Opportunities show what's working well and where you can build more value or expand features.

**Color:** Green badge (#14532d background)

---

### ⚪ **FEATURE** (Feature Request)
**What it is:** Specific features or capabilities that users explicitly request or suggest.

**Examples:**
- "Can you add dark mode?"
- "I'd like to see a mobile app version"
- "Add a search function here"
- "Include export to PDF option"

**Why it matters:** Feature requests are direct suggestions from users about what to build next. These are actionable items for your product roadmap.

**Color:** Gray badge (default)

---

## How Categories Are Determined

The AI analyzes the interview transcript and categorizes insights based on:
- **Language used** - Negative words → Pain, Positive words → Opportunity
- **Context** - What the user is describing
- **Intent** - What the user is trying to communicate
- **Explicit requests** - Direct feature suggestions → Feature

## Using These Categories

### For Product Planning:
1. **Pain Points** → Fix these first (high priority)
2. **Needs** → Consider for roadmap (medium priority)
3. **Opportunities** → Build on what works (strategic priority)
4. **Feature Requests** → Evaluate for future releases

### For PRD Generation:
- Pain points become problem statements
- Needs become user personas and requirements
- Opportunities become goals and success metrics
- Feature requests become specific features in the PRD

## Visual Indicators

In the UI, each insight shows:
- **Category badge** - Color-coded for quick identification
- **Summary** - Brief description of the insight
- **Quote** - Direct quote from the user (when available)
- **Sentiment score** - Emotional tone (-1 to +1)

## Example Insights

### Pain Point Example:
```
Category: PAIN
Summary: Users struggle to connect insights back to specific features
Quote: "I sometimes struggle to connect insights back to specific features we should build next."
```

### Need Example:
```
Category: NEED
Summary: Strong need for direct feature recommendations from insights
Quote: "Clear feature recommendations or priority suggestions directly from the insights."
```

### Opportunity Example:
```
Category: OPPORTUNITY
Summary: Automated transcription and quote extraction are highly valued
Quote: "The transcription and quotes are super helpful. It saves us a lot of manual note-taking."
```

### Feature Request Example:
```
Category: FEATURE
Summary: Request for mobile app version
Quote: "I'd love to use this on my phone while I'm on the go."
```

---

**Note:** The AI automatically categorizes insights, but you can review and adjust them as needed when generating your PRD.
