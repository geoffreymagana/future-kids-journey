# Future-Ready Kids Learning Platform

A comprehensive web application designed to help parents register their children for AI and technology-focused learning workshops. The platform includes a public landing page with registration capabilities and a full-featured admin dashboard for managing submissions.

---

## Table of Contents

- [Project Overview](#project-overview)
- [App Capabilities](#app-capabilities)
- [Technology Stack](#technology-stack)
- [Resources & Dependencies](#resources--dependencies)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Licenses](#licenses)
- [Hand-Off & Support](#hand-off--support)
- [Service Level Agreements (SLAs)](#service-level-agreements-slas)

---

## Project Overview

### Scope

**Client:** EDCET (Educational & Career Excellence Training)  
**Location:** Luxe Apartments, Meru, 60200, Kenya  
**Contact:** info@edcet.co.ke | WhatsApp: +254 708 788 026

### Project Goals

1. **Lead Generation:** Capture parent registrations for AI and technology learning programs
2. **User Engagement:** Implement referral-based viral growth mechanism
3. **Admin Management:** Provide comprehensive dashboard for lead tracking and management
4. **Legal Compliance:** Include privacy, terms of service, and child protection policies

### What's Included

- 🎯 **Landing Page:** Hero section, benefits, workshop overview, registration form, FAQ
- 📊 **Admin Dashboard:** Lead management, bulk actions, data export (Excel/PDF)
- 🔄 **Real-time Updates:** Live submission counter and recently joined parent names
- 👥 **Referral System:** Unique referral links and share tracking
- 📱 **Mobile Optimized:** Fully responsive design for all devices
- 🔐 **Authentication:** JWT-based admin authentication
- 📋 **Legal Pages:** Privacy Policy, Terms of Service, Child Protection Policy
- ⚠️ **Error Handling:** Global error boundary and professional error pages

---

## App Capabilities

### Public Features

| Feature | Details |
|---------|---------|
| **Hero Section** | Eye-catching introduction with CTA buttons |
| **Problem Statement** | Educational challenges parents face |
| **Approach Section** | Program methodology and benefits |
| **How It Works** | 4-step workshop process with visual stepper |
| **Social Proof** | Real-time registration and share counters |
| **Registration Form** | Parent name, WhatsApp number, child age range |
| **Referral System** | Unique links, multi-platform sharing (WhatsApp, Facebook, Twitter/X, Telegram, LinkedIn) |
| **FAQ Section** | Common questions with expandable answers |
| **Legal Pages** | Privacy Policy, Terms of Service, Child Protection Policy |
| **Footer** | Company contact info, social links, legal navigation |

### Admin Features

| Feature | Details |
|---------|---------|
| **Dashboard Stats** | Total submissions, new leads, contacted count, top visitor source, most shared platform |
| **Submission Table** | Full parent/child data with status tracking, visitor source, sharing platforms |
| **Source Tracking** | Track visitor sources (Facebook, Instagram, Twitter, Reddit, Telegram, WhatsApp, LinkedIn, UTM parameters) |
| **Sharing Analytics** | See which platforms users share referral links to (WhatsApp, Facebook, Telegram, Twitter, LinkedIn, Reddit, Link Copy) |
| **Advanced Filters** | Search by name/number, status, age range, visitor source |
| **Batch Actions** | Multi-select with bulk operations |
| **Status Management** | Mark leads as New, Contacted, Enrolled, No Response |
| **Bulk Export** | Excel (.xlsx) and PDF (.pdf) export with source and sharing data |
| **Bulk Delete** | Remove multiple records with confirmation |
| **Pagination** | Navigate large datasets efficiently |
| **Mobile Responsive** | Hidden columns on mobile, grouped data display |
| **Authentication** | Secure JWT login for admin access |

### Technical Capabilities

- **Real-time Data Polling:** Updates every 5 seconds (60-second window) with fixed infinite loop
- **Smart Counting:** Prevents duplicate parent counting with ref-based deduplication
- **Source Attribution:** Tracks visitor sources via UTM parameters and social referrers (9+ platforms)
- **Share Tracking:** Records all share events to backend with platform-specific recording
- **Visitor Analytics:** Aggregates visitors by source and shares by destination platform
- **Database Persistence:** MongoDB with Mongoose ORM for all tracking data
- **CORS Enabled:** Frontend-backend communication on separate ports
- **Error Boundary:** Graceful error handling with recovery options
- **Password Security:** bcrypt hashing with salt rounds
- **Type Safety:** Full TypeScript implementation, zero implicit any
- **Professional Branding:** Logo ipsum logo displayed in navbar, admin header, and login page

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI framework |
| **TypeScript** | 5.2.2 | Type safety |
| **Vite** | Latest | Build tool & dev server |
| **Tailwind CSS** | Latest | Utility-first CSS |
| **Framer Motion** | Latest | Smooth animations |
| **React Router** | v6 | Client-side routing |
| **Shadcn UI** | Latest | Pre-built components |
| **Sonner** | Latest | Toast notifications |
| **Zod** | 3.22.4 | Form validation |
| **jsPDF** | Latest | PDF generation |
| **XLSX** | Latest | Excel export |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express.js** | 4.18.2 | Web framework |
| **TypeScript** | 5.2.2 | Type safety |
| **MongoDB** | 7.5.0 | Database |
| **Mongoose** | 7.5.0 | ODM |
| **JWT** | 9.0.2 | Authentication |
| **bcryptjs** | 2.4.3 | Password hashing |
| **CORS** | 2.8.17 | Cross-origin requests |
| **Zod** | 3.22.4 | Schema validation |

### DevTools

| Tool | Purpose |
|------|---------|
| **Bun** | Package manager & runtime |
| **ESLint** | Code linting |
| **Vitest** | Unit testing framework |
| **TypeScript** | Static type checking |

---

## Resources & Dependencies

### NPM Packages (Frontend)

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "framer-motion": "latest",
    "tailwindcss": "latest",
    "@shadcn/ui": "latest",
    "sonner": "latest",
    "zod": "^3.22.4",
    "jspdf": "latest",
    "xlsx": "latest",
    "html2canvas": "latest",
    "@tanstack/react-query": "latest"
  }
}
```

### NPM Packages (Backend)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.17",
    "zod": "^3.22.4"
  }
}
```

### External Services

- **MongoDB Atlas:** Cloud database hosting
- **Web Hosting:** Compatible with Vercel, Netlify, Railway, or custom servers
- **Email Service:** (Optional) Configure for notifications

---

## Installation & Setup

### Prerequisites

- Node.js v18+ (or Bun as package manager)
- MongoDB instance (local or cloud)
- Git

### Step 1: Clone Repository

```bash
git clone <YOUR_GIT_URL>
cd future-kids-journey
```

### Step 2: Install Dependencies

**Using Bun (recommended):**
```bash
bun install
```

**Using npm:**
```bash
npm install
```

### Step 3: Environment Configuration

Create `.env` files in both frontend and backend directories:

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend (.env):**
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/future-kids
JWT_SECRET=your-secret-key-here
PORT=5000
CORS_ORIGIN=http://localhost:8080
```

### Step 4: Run Application

**Development mode:**

```bash
# Terminal 1 - Frontend (port 8080)
cd future-kids-journey
bun run dev

# Terminal 2 - Backend (port 5000)
cd server
bun run dev
```

**Production build:**

```bash
# Frontend
bun run build
bun run preview

# Backend
bun run build
bun start
```

### Step 5: Initialize Database

Backend automatically runs migrations on startup. To manually initialize:

```bash
cd server
bun run migrate
```

Default admin credentials:
- Email: `admin@edcet.co.ke`
- Password: `AdminPassword123!` (Change immediately in production)

---

## Usage

### For Parents (Public Site)

1. **Visit Landing Page:** `http://localhost:8080`
2. **Scroll Through Content:** Learn about the program
3. **Register:** Fill form with name, WhatsApp, child's age
4. **Share:** Use modal to share referral link on social media
5. **View FAQ:** Get answers to common questions

### For Admins

1. **Login:** Navigate to `http://localhost:8080/admin/login`
2. **Dashboard:** View stats and submission table
3. **Filter Data:** Use search, status, and age range filters
4. **Manage Leads:**
   - Select items with checkboxes
   - Bulk change status
   - Export to Excel/PDF
   - Delete unwanted entries
5. **View Details:** Individual submission rows show all info

### Referral System

- Each user gets unique referral ID stored in localStorage
- Sharing increments user share count
- New parents joining via referral link increment total count
- Prevents duplicate counting within same session

---

## Licenses

### Open Source Licenses

| Package | License | Link |
|---------|---------|------|
| React | MIT | https://github.com/facebook/react |
| Tailwind CSS | MIT | https://github.com/tailwindlabs/tailwindcss |
| Framer Motion | MIT | https://github.com/framer/motion |
| Shadcn UI | MIT | https://github.com/shadcn/ui |
| Express.js | MIT | https://github.com/expressjs/express |
| Mongoose | MIT | https://github.com/Automattic/mongoose |
| jsPDF | Apache 2.0 | https://github.com/parallax/jsPDF |
| XLSX | Apache 2.0 | https://github.com/SheetJS/sheetjs |

### Project License

This project and all custom code are the property of **EDCET** and subject to their licensing agreements.

All third-party libraries maintain their original open-source licenses as documented above.

---

## Hand-Off & Support

### Knowledge Transfer Documents

- **Architecture Overview:** See `ARCHITECTURE.md` (to be created)
- **API Documentation:** See backend `/docs` endpoint
- **Deployment Guide:** See `DEPLOYMENT.md` (to be created)
- **Database Schema:** MongoDB collections documented in Mongoose models

### Support Contacts

| Area | Contact | Email |
|------|---------|-------|
| **General Inquiries** | EDCET Head Office | info@edcet.co.ke |
| **WhatsApp Support** | Available 24/7 | +254 708 788 026 |
| **Safeguarding** | Safeguarding Team | safeguarding@edcet.co.ke |

### Common Issues & Solutions

**Frontend not loading:**
- Verify Vite dev server running on port 8080
- Check VITE_API_URL environment variable
- Clear browser cache

**Backend connection errors:**
- Verify MongoDB connection string
- Check port 5000 availability
- Confirm CORS_ORIGIN setting

**Authentication failures:**
- Verify JWT_SECRET matches between environments
- Check token expiration (default: 24 hours)
- Clear browser localStorage

**Export not working:**
- Ensure xlsx and jspdf packages installed
- Check browser file download permissions
- Verify selected items exist

### Maintenance Tasks

**Regular (Weekly):**
- Monitor admin dashboard for new submissions
- Review application logs
- Check email/WhatsApp for user inquiries

**Monthly:**
- Backup MongoDB database
- Review referral statistics
- Update status of contacted leads

**Quarterly:**
- Security audit of authentication
- Performance review of API endpoints
- Update dependencies (security patches only)

**Annually:**
- Full security assessment
- Update legal documents (Privacy, Terms, Child Protection)
- Capacity planning for growth

---

## Service Level Agreements (SLAs)

### Availability

| Component | Target | Measurement |
|-----------|--------|-------------|
| **Frontend (Landing Page)** | 99.5% | Monthly uptime |
| **Backend API** | 99.0% | Monthly uptime |
| **Database** | 99.9% | Monthly availability |
| **Admin Dashboard** | 99.0% | During business hours |

### Response Times

| Endpoint | Target | Priority |
|----------|--------|----------|
| **GET /submissions** | < 200ms | High |
| **POST /submit** | < 500ms | Critical |
| **GET /stats** | < 100ms | Medium |
| **Update status** | < 300ms | High |

### Data Protection SLAs

| Aspect | Commitment |
|--------|-----------|
| **Backup Frequency** | Daily (automated) |
| **Backup Retention** | 30 days minimum |
| **Data Recovery Time** | < 4 hours |
| **Encryption at Rest** | AES-256 (MongoDB) |
| **Encryption in Transit** | TLS 1.2+ (HTTPS) |

### Support SLAs

| Issue Type | Response Time | Resolution Target |
|-----------|---------------|--------------------|
| **Critical** (Site Down) | 1 hour | 4 hours |
| **High** (Major Feature) | 4 hours | 1 business day |
| **Medium** (Minor Issue) | 8 hours | 3 business days |
| **Low** (Enhancement) | 24 hours | 5 business days |

### Performance Benchmarks

**Target Metrics:**
- Page load time: < 3 seconds
- Time to interactive: < 5 seconds
- First contentful paint: < 1.5 seconds
- API response time: < 500ms (p95)
- Database query time: < 100ms (p95)

**Monitoring:**
- Uptime monitoring via external service
- Error tracking and alerting
- Performance metrics logging
- Weekly health reports

### Escalation Path

1. **Initial Report** → Acknowledge within 1 hour
2. **Triage** → Classify severity (Critical/High/Medium/Low)
3. **Assessment** → Initial investigation
4. **Resolution** → Implement fix
5. **Verification** → Test and confirm
6. **Communication** → Update stakeholder

---

## Quick Reference

### Important URLs

- **Frontend:** http://localhost:8080
- **Admin Login:** http://localhost:8080/admin/login
- **Admin Dashboard:** http://localhost:8080/admin
- **Backend API:** http://localhost:5000/api
- **Legal Pages:**
  - Privacy: /privacy
  - Terms: /terms
  - Child Protection: /child-protection

### Key Credentials (Development Only)

| Role | Email | Password | Note |
|------|-------|----------|------|
| Admin | admin@edcet.co.ke | AdminPassword123! | **CHANGE IN PRODUCTION** |

### Database Collections

- `admins` - Admin user accounts
- `submissions` - Parent registrations
- `referrals` - Referral tracking (optional)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Feb 2026 | Initial release with landing page and admin dashboard |

---

**Last Updated:** February 4, 2026  
**Maintained By:** EDCET Development Team  
**Status:** Production Ready
