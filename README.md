# Cursor for PMs — Final Year Project

MERN app that turns user interviews into insights, cross-interview patterns, and a PRD using Google Gemini.

## Structure

```
├── frontend/     React app (deploy to Vercel)
├── backend/      Express API (deploy to Vercel, Railway, or Render)
├── sample-interviews/
└── docs/
```

## Local development

### Backend

```bash
cd backend
cp .env.example .env   # then fill in values
npm install
npm run dev
```

Runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

Runs on `http://localhost:3000`.

## Deploy from one GitHub repo

**Yes — you can use a single repo and deploy frontend and backend as separate projects.**

On [Vercel](https://vercel.com), create **two projects** from the same repository:

| Project | Root directory | Build command | Output |
|---------|----------------|---------------|--------|
| Frontend | `frontend` | `npm run build` | `build` |
| Backend | `backend` | (none — serverless) | — |

### Frontend (Vercel)

1. Import repo → set **Root Directory** to `frontend`
2. Framework preset: **Create React App**
3. Environment variable:
   - `REACT_APP_API_BASE_URL` = your backend URL (e.g. `https://your-api.vercel.app`)

### Backend (Vercel)

1. Import repo again → set **Root Directory** to `backend`
2. Add environment variables from `backend/.env.example`
3. Set `FRONTEND_ORIGIN` to your frontend Vercel URL (for CORS + cookies)
4. Use **MongoDB Atlas** for `MONGODB_URI`

> **Note:** File uploads and long AI jobs can hit Vercel serverless limits (timeout, body size). For heavy production use, host the backend on [Railway](https://railway.app) or [Render](https://render.com) instead — same repo, different root directory and start command: `npm start`.

## Environment variables

See `backend/.env.example` and `frontend/.env.example`.

Never commit `.env` files.
