# Quick Database Setup Instructions

## Step 1: Choose MongoDB Option

### Option A: MongoDB Atlas (Cloud - Easiest) ⭐ Recommended

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free account
3. Create a free cluster (M0 - Free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Add to `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cursor-for-pms?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB

1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Install MongoDB
3. Start MongoDB service (usually automatic on Windows)
4. Add to `backend/.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/cursor-for-pms
   ```

## Step 2: Create .env File

Create `backend/.env` file with:
```env
MONGODB_URI=mongodb://localhost:27017/cursor-for-pms
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cursor-for-pms

GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
FRONTEND_ORIGIN=http://localhost:3000
```

## Step 3: Verify Setup

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Look for this message:
   ```
   MongoDB connected successfully
   Server is running on port 5000
   ```

3. If you see connection errors, check:
   - MongoDB is running (local) or cluster is active (Atlas)
   - MONGODB_URI is correct in .env
   - No typos in connection string

## Step 4: Test Database

Upload an interview file through the frontend. Check your database:
- **Atlas:** Go to Collections tab, you should see `interviews` collection
- **Local:** Use MongoDB Compass or mongosh to view `cursor-for-pms` database

---

**That's it!** Your database is ready. All interviews will be automatically saved. 🎉
