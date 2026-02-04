# Render Deployment Fix - Out of Memory Error

## Problem
Deployment to Render was failing with a JavaScript heap out of memory error after running for about 2 minutes:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

## Root Cause
The render.yaml was configured to run `npm run dev` in production, which uses `tsx watch` (development watcher). This is too memory-intensive for Render's free tier (512MB RAM limit).

- **Development mode**: `tsx watch` - watches files and recompiles on changes (~250MB+ RAM)
- **Production mode**: Pre-compiled `dist` files - much lighter weight (~50-100MB RAM)

## Solution Applied

### Changed render.yaml Backend Service
**Before:**
```yaml
buildCommand: npm install
startCommand: npm run dev
```

**After:**
```yaml
buildCommand: npm install && npm run build
startCommand: npm start
```

### How It Works
1. **Build Phase**: `npm install && npm run build`
   - Installs dependencies
   - Compiles TypeScript to JavaScript (`tsc` → `dist/` folder)
   - Creates optimized output for production

2. **Start Phase**: `npm start`
   - Runs `node dist/server.js` (pre-compiled code)
   - Much lighter memory footprint
   - No file watchers or development tools

### Key Files
- **TypeScript Config**: [server/tsconfig.json](server/tsconfig.json)
  - Outputs to `./dist` folder
  - Configured for ES2020 target
  
- **Package Scripts**: [server/package.json](server/package.json#L7-L9)
  - `build`: Compiles TypeScript
  - `start`: Runs compiled code
  - `dev`: Used locally only (tsx watch)

## Deployment Flow
```
1. Render clones repo
2. Builds backend:
   - npm install (installs dependencies)
   - npm run build (tsc compiles src/ → dist/)
   - Artifacts: dist/ folder with .js files
3. Starts backend:
   - node dist/server.js (lightweight startup)
   - Server runs in production mode
4. Frontend deploys separately with bun
```

## Testing Locally
You can simulate the production build locally:

```bash
cd server
npm run build          # Compiles TypeScript
npm start             # Runs compiled version
```

## Environment Variables on Render
Make sure these are set in your Render service settings:
- `MONGODB_URI` - from database connection
- `JWT_SECRET` - secret key
- `NODE_ENV` - set to "production"
- `PORT` - 5000
- `FRONTEND_URL` - your frontend's Render URL

## If Deployment Still Fails
1. **Check service has enough memory**: Free tier = 0.5 GB RAM
   - If still OOM, consider upgrading to paid tier
   
2. **Verify build output**: After deployment starts, check the logs for:
   ```
   > tsc
   > node dist/server.js
   ✅ Connected to MongoDB
   ✅ Server running on http://localhost:5000
   ```

3. **Clear deployment cache**: 
   - In Render dashboard: Settings → Clear build cache → Redeploy

## Next Steps for Frontend
The frontend is already optimized with `bun run preview` which serves pre-built static files (very lightweight).
