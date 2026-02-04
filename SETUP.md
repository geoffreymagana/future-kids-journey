# Future Kids Journey - Full Stack Setup

## Overview

This project consists of:
- **Frontend**: React + Vite + TypeScript (main application + admin dashboard)
- **Backend**: Express.js + MongoDB + TypeScript (API server)
- **Admin Dashboard**: Built into the frontend for managing form submissions

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd c:\Users\geoff\future-kids-journey
npm install
# or
bun install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Server

```bash
npm run dev
# or
bun run dev
```

The frontend will be available at `http://localhost:8081`

---

## Backend Setup

### 1. Install Dependencies

```bash
cd server
npm install
# or
bun install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory (or copy from `.env.example`):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/future-kids-journey

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

# Admin Credentials (for initial setup)
ADMIN_EMAIL=admin@futurekidsjourney.com
ADMIN_PASSWORD=change_this_password

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:8081
```

### 3. Set Up MongoDB

If using MongoDB Atlas:
1. Create an account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

For local MongoDB:
```bash
# Make sure MongoDB is running
mongod
```

### 4. Initialize Database

Run the migration script to create the super admin:

```bash
cd server
npm run migrate
# or
bun run migrate
```

This will:
- Connect to MongoDB
- Create indexes
- Create a super admin user with credentials from `.env`

### 5. Run Backend Server

```bash
npm run dev
# or
bun run dev
```

The API will be available at `http://localhost:5000`

---

## API Endpoints

### Form Submissions

- **POST** `/api/forms/submit` - Submit a form (public)
  ```json
  {
    "name": "Parent Name",
    "whatsapp": "+254712345678",
    "ageRange": "5-7"
  }
  ```

- **GET** `/api/forms/submissions` - Get all submissions (requires auth)
  - Query params: `status`, `ageRange`, `page`, `limit`, `sort`

- **GET** `/api/forms/submissions/:id` - Get single submission (requires auth)

- **PATCH** `/api/forms/submissions/:id` - Update submission (requires auth)
  ```json
  {
    "status": "contacted",
    "notes": "Parent expressed interest"
  }
  ```

- **GET** `/api/forms/stats` - Get statistics (requires auth)

### Authentication

- **POST** `/api/auth/login` - Admin login
  ```json
  {
    "email": "admin@futurekidsjourney.com",
    "password": "password"
  }
  ```

- **GET** `/api/auth/me` - Get current admin (requires auth)

- **POST** `/api/auth/register` - Create new admin (super_admin only, requires auth)

- **POST** `/api/auth/logout` - Logout (requires auth)

---

## Admin Dashboard

### Access the Dashboard

1. Start both frontend and backend servers
2. Navigate to `http://localhost:8081/admin/login`
3. Login with your admin credentials

### Features

- **Dashboard Overview**: View key statistics
  - Total submissions
  - New leads
  - Contacted count
  
- **Submissions Management**
  - View all form submissions
  - Filter by status, age range
  - Search by parent name or WhatsApp number
  - Update submission status (new, contacted, enrolled, no_response)
  - Pagination (20 items per page)

- **Statistics**
  - Breakdown by status
  - Breakdown by age range
  - Recent submissions

---

## Submission Status Workflow

1. **New** - Just submitted the form
2. **Contacted** - Parent has been reached out to
3. **Enrolled** - Child has been enrolled in the program
4. **No Response** - Parent didn't respond

---

## Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminLayout.tsx
│   │   ├── landing/
│   │   └── ui/
│   ├── pages/
│   │   ├── Index.tsx (main landing page)
│   │   ├── AdminLogin.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── NotFound.tsx
│   ├── services/
│   │   └── api.ts (API client)
│   ├── hooks/
│   ├── App.tsx
│   └── main.tsx
│
├── server/
│   ├── src/
│   │   ├── models/
│   │   │   ├── FormSubmission.ts
│   │   │   └── Admin.ts
│   │   ├── routes/
│   │   │   ├── forms.ts
│   │   │   └── auth.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── utils/
│   │   │   ├── helpers.ts
│   │   │   └── analytics.ts
│   │   ├── migrations/
│   │   │   └── init.ts
│   │   └── server.ts
│   ├── .env
│   └── package.json
│
└── package.json
```

---

## Troubleshooting

### CORS Error
- Ensure `FRONTEND_URL` in server `.env` matches your frontend URL
- Default: `http://localhost:8081`

### MongoDB Connection Error
- Verify MongoDB URI is correct
- Check if MongoDB is running (for local setup)
- Ensure network access is allowed (for MongoDB Atlas)

### Admin Login Not Working
- Run `npm run migrate` to create super admin
- Check credentials in `.env`
- Clear browser localStorage and try again

### Form Submission Fails
- Check network tab in browser DevTools
- Ensure backend server is running
- Verify API_URL is correct in frontend

---

## Deployment

### Backend Deployment (e.g., Heroku, Railway, Render)

1. Set environment variables on the hosting platform
2. Update `FRONTEND_URL` to your deployed frontend URL
3. Deploy the server folder

### Frontend Deployment (e.g., Vercel, Netlify)

1. Update `VITE_API_URL` to your deployed backend URL
2. Deploy the root folder (or use appropriate build settings)

---

## Security Notes

- Change JWT_SECRET in production
- Use strong admin passwords
- Enable HTTPS in production
- Use environment variables for sensitive data
- Implement rate limiting for API endpoints
- Add input validation and sanitization

---

## Support

For issues or questions, check the API server logs and browser console for error messages.
