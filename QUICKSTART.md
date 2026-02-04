# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- MongoDB (local or MongoDB Atlas account)

---

## Step 1: Frontend Setup (Terminal 1)

```bash
cd c:\Users\geoff\future-kids-journey

# Install dependencies
npm install

# Create .env.local
echo "VITE_API_URL=http://localhost:5000/api" > .env.local

# Start dev server
npm run dev
```

✅ Frontend running at `http://localhost:8081`

---

## Step 2: Backend Setup (Terminal 2)

```bash
cd c:\Users\geoff\future-kids-journey\server

# Install dependencies
npm install

# Create .env from example
copy .env.example .env

# Edit .env with your MongoDB URI and admin credentials
# (Open with your text editor)

# Initialize database and create super admin
npm run migrate

# Start backend server
npm run dev
```

✅ Backend running at `http://localhost:5000`

---

## Step 3: Access Admin Dashboard

1. Open browser: `http://localhost:8081/admin/login`
2. Login with credentials from `server/.env`:
   - Email: `admin@futurekidsjourney.com` (or what you set)
   - Password: (what you set in `.env`)
3. View all form submissions and manage statuses

---

## 🎯 Test the Flow

### Test Form Submission
1. Go to `http://localhost:8081`
2. Fill out the parent workshop form
3. Submit

### View in Admin Dashboard
1. Go to `http://localhost:8081/admin`
2. See the new submission appear instantly
3. Change status to "contacted" or "enrolled"

---

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `src/services/api.ts` | Frontend API client |
| `src/pages/AdminDashboard.tsx` | Admin panel UI |
| `server/src/server.ts` | Backend API server |
| `server/src/models/FormSubmission.ts` | Form submission schema |
| `server/.env` | Backend configuration |

---

## 🔧 Troubleshooting

### Port Already in Use?
```bash
# Change port in .env
PORT=5001
```

### MongoDB Connection Failed?
- Check MongoDB URI in `server/.env`
- For MongoDB Atlas: Whitelist your IP
- For local: Run `mongod` in another terminal

### Admin Can't Login?
```bash
# Reinitialize database
cd server
npm run migrate
```

---

## 📞 Default Admin Credentials

Edit `server/.env` to change:
```
ADMIN_EMAIL=admin@futurekidsjourney.com
ADMIN_PASSWORD=change_this_password
```

Then run: `npm run migrate`

---

## Next Steps

- Read `SETUP.md` for detailed configuration
- Check API endpoints documentation
- Configure MongoDB Atlas for production
- Deploy to production when ready

---

**Happy coding! 🎉**
