# Database Save Troubleshooting Guide

## Issue: Interviews not saving to database

### What I Fixed:

1. **Made insight `id` field optional** - Some insights might not have IDs
2. **Added connection status check** - Verifies DB is connected before saving
3. **Added better error logging** - See exactly what's failing
4. **Ensured IDs exist** - Auto-generates IDs for insights/speakers if missing

### How to Debug:

#### Step 1: Check Server Logs

When you upload an interview, you should now see:
```
Attempting to save interview to database...
Database connection status: 1
Interview object created, saving...
Interview saved successfully! ID: 507f1f77bcf86cd799439011
```

If you see errors, they'll be logged with details.

#### Step 2: Test Database Connection

Run the test script:
```bash
cd backend
node TEST_DB_SAVE.js
```

This will:
- Test database connection
- Try to save a test interview
- Verify it was saved
- Show any errors

#### Step 3: Check Common Issues

**Issue 1: Database not connected**
- Look for: `Database connection status: 0` (disconnected)
- Fix: Check MongoDB is running and MONGODB_URI is correct

**Issue 2: Validation error**
- Look for: `ValidationError` in logs
- Fix: Check that all required fields are present

**Issue 3: Connection string wrong**
- Look for: `MongoServerError` or connection timeout
- Fix: Verify MONGODB_URI in `.env` file

#### Step 4: Verify Data in Database

**MongoDB Atlas:**
1. Go to your cluster
2. Click "Browse Collections"
3. Look for `interviews` collection
4. Should see your saved interviews

**Local MongoDB:**
```bash
# Using mongosh
mongosh cursor-for-pms
> db.interviews.find().pretty()
```

**MongoDB Compass:**
1. Connect to your database
2. Navigate to `cursor-for-pms` database
3. Check `interviews` collection

### What to Check in Logs:

When uploading an interview, watch for:

✅ **Good signs:**
- "MongoDB connected successfully" (on server start)
- "Attempting to save interview to database..."
- "Database connection status: 1" (1 = connected)
- "Interview saved successfully! ID: ..."

❌ **Bad signs:**
- "Database connection status: 0" (not connected)
- "Error saving interview to database:"
- "ValidationError"
- "MongoServerError"

### Manual Test:

Try this in your browser console or Postman:

```javascript
// GET request to check if interviews exist
GET http://localhost:5000/api/interviews

// Should return:
{
  "interviews": [...],
  "count": X
}
```

### If Still Not Working:

1. **Check .env file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/cursor-for-pms
   # Make sure this is correct!
   ```

2. **Check MongoDB is running:**
   - Local: `mongod` should be running
   - Atlas: Cluster should be active

3. **Check server console:**
   - Look for any error messages
   - Check if "MongoDB connected successfully" appears

4. **Run test script:**
   ```bash
   node TEST_DB_SAVE.js
   ```
   This will show exactly what's wrong.

### Expected Behavior:

After uploading an interview:
1. ✅ Processing happens (transcript + insights)
2. ✅ "Attempting to save interview to database..." appears
3. ✅ "Interview saved successfully!" appears
4. ✅ Interview ID is returned in response
5. ✅ Interview appears in database

If any step fails, check the logs for the specific error!
