## Backend Connection Error - Resolution Guide

The frontend is showing `net::ERR_CONNECTION_REFUSED` errors on all API calls to `http://localhost:5000`. This means the backend server is not running.

### Root Cause
The backend development server needs to be started on port 5000.

### Prerequisites
You need to have **one of these** installed on your Windows system (NOT in WSL):

1. **Node.js + npm** (Recommended)
   - Download from: https://nodejs.org/
   - Choose LTS version
   - npm comes bundled with Node.js

2. **Bun** (Alternative)
   - Download from: https://bun.sh
   - Faster package manager and runtime

### Solution - Start the Backend Server

**Choose ONE option based on what's installed on your Windows machine:**

#### Option 1: Using Node.js/npm (most common)

1. Open Windows Command Prompt or PowerShell (NOT WSL)
2. Navigate to the server directory:
```bash
cd c:\Users\geoff\future-kids-journey\server
```

3. Install dependencies (only needed once):
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

You should see output like:
```
✅ Connected to MongoDB
✅ Server running on http://localhost:5000
```

#### Option 2: Using Bun

1. Open Windows Command Prompt or PowerShell (NOT WSL)
2. Navigate to the server directory:
```bash
cd c:\Users\geoff\future-kids-journey\server
```

3. Install dependencies (only needed once):
```bash
bun install
```

4. Start the development server:
```bash
bun run dev
```

### Starting the Frontend

In a separate terminal (also in Windows, not WSL):

1. Navigate to the project root:
```bash
cd c:\Users\geoff\future-kids-journey
```

2. Install dependencies (only needed once):
```bash
npm install
# or
bun install
```

3. Start the frontend development server:
```bash
npm run dev
# or
bun run dev
```

Access the application at: http://localhost:5173

### Verify Both Servers are Running

- Backend API: http://localhost:5000/health (should show `{"status":"OK",...}`)
- Frontend App: http://localhost:5173 (or 8081)

### Troubleshooting

**Port 5000 already in use:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with the process ID)
taskkill /PID <PID> /F
```

**MongoDB Connection Error:**
- Ensure MongoDB is running on your system
- Check the MONGODB_URI in server/.env or environment variables
- Default: `mongodb://localhost:27017/future-kids-journey`

**Still getting connection errors:**
1. Check that backend shows "Server running on http://localhost:5000"
2. Make sure frontend VITE_API_URL env variable is set correctly
3. Clear browser cache and reload the page

### Environment Variables Needed

**Frontend** - Create `.env.local` in project root:
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend** - Create `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/future-kids-journey
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123
JWT_SECRET=your-jwt-secret-here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Important Notes

- **Do NOT use WSL** for running the servers - use Windows native Node.js/bun
- Keep **both backend and frontend** servers running while developing
- The backend must be running before accessing the frontend admin dashboard
- All data is persisted in MongoDB - make sure it's running too

### Next Steps

1. Install Node.js or Bun on Windows (if not already installed)
2. Start the backend server in one terminal
3. Start the frontend server in another terminal
4. Navigate to http://localhost:5173 in your browser
5. Login to the admin dashboard
6. All API calls should now work without connection refused errors

---

**If you still have issues:**
- Check console logs in both frontend and backend terminals
- Verify MongoDB is accessible at the configured URI
- Make sure ports 5000 and 5173 are not blocked by firewall
- Try restarting both servers
