# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All admin endpoints require JWT authentication via Bearer token in the `Authorization` header.

### Header Example
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 🔐 Authentication Routes

#### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "admin@futurekidsjourney.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@futurekidsjourney.com",
      "fullName": "Admin Name",
      "role": "super_admin"
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid email or password
- `401` - Invalid credentials

---

#### Register Admin (Super Admin Only)
```
POST /auth/register
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "newadmin@futurekidsjourney.com",
  "password": "securepassword",
  "fullName": "New Admin",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "email": "newadmin@futurekidsjourney.com",
    "fullName": "New Admin",
    "role": "admin"
  }
}
```

**Status Codes:**
- `201` - Admin created
- `400` - Invalid data
- `403` - Unauthorized (not super_admin)
- `409` - Email already in use

---

#### Get Current Admin
```
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Admin retrieved",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "admin@futurekidsjourney.com",
    "fullName": "Admin Name",
    "role": "super_admin",
    "isActive": true,
    "lastLogin": "2024-02-03T11:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-02-03T11:30:00Z"
  }
}
```

---

#### Logout
```
POST /auth/logout
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {}
}
```

---

### 📋 Form Submission Routes

#### Submit Form (Public)
```
POST /forms/submit
```

**Request Body:**
```json
{
  "name": "John Doe",
  "whatsapp": "+254712345678",
  "ageRange": "5-7"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "message": "Thank you! We will be in touch soon."
  }
}
```

**Validation:**
- `name`: 2-100 characters
- `whatsapp`: 10-15 characters
- `ageRange`: "5-7" | "8-10" | "11-14"

**Status Codes:**
- `201` - Form submitted
- `400` - Invalid form data
- `500` - Server error

---

#### Get All Submissions
```
GET /forms/submissions
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): "new" | "contacted" | "enrolled" | "no_response"
- `ageRange` (optional): "5-7" | "8-10" | "11-14"
- `page` (optional): page number, default 1
- `limit` (optional): items per page, default 50
- `sort` (optional): "-submittedAt" (default) | "submittedAt" | "-parentName" | etc.

**Example:**
```
GET /forms/submissions?status=new&ageRange=5-7&page=1&limit=20&sort=-submittedAt
```

**Response:**
```json
{
  "success": true,
  "message": "Submissions retrieved",
  "data": {
    "submissions": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "parentName": "John Doe",
        "whatsappNumber": "+254712345678",
        "childAgeRange": "5-7",
        "status": "new",
        "notes": null,
        "referralLink": null,
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "submittedAt": "2024-02-03T11:00:00Z",
        "createdAt": "2024-02-03T11:00:00Z",
        "updatedAt": "2024-02-03T11:00:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "pages": 8,
      "current": 1,
      "limit": 20
    }
  }
}
```

---

#### Get Single Submission
```
GET /forms/submissions/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Submission retrieved",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "parentName": "John Doe",
    "whatsappNumber": "+254712345678",
    "childAgeRange": "5-7",
    "status": "new",
    "notes": null,
    "submittedAt": "2024-02-03T11:00:00Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Submission not found

---

#### Update Submission
```
PATCH /forms/submissions/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "contacted",
  "notes": "Parent called, very interested in program"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Submission updated",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "parentName": "John Doe",
    "whatsappNumber": "+254712345678",
    "childAgeRange": "5-7",
    "status": "contacted",
    "notes": "Parent called, very interested in program",
    "submittedAt": "2024-02-03T11:00:00Z",
    "updatedAt": "2024-02-03T12:30:00Z"
  }
}
```

**Status Values:**
- `new` - Just submitted
- `contacted` - Parent has been reached
- `enrolled` - Child enrolled in program
- `no_response` - No response from parent

---

#### Get Statistics
```
GET /forms/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Statistics retrieved",
  "data": {
    "totalSubmissions": 150,
    "byStatus": [
      { "_id": "new", "count": 45 },
      { "_id": "contacted", "count": 60 },
      { "_id": "enrolled", "count": 30 },
      { "_id": "no_response", "count": 15 }
    ],
    "byAgeRange": [
      { "_id": "5-7", "count": 50 },
      { "_id": "8-10", "count": 60 },
      { "_id": "11-14", "count": 40 }
    ],
    "recentSubmissions": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "parentName": "John Doe",
        "whatsappNumber": "+254712345678",
        "childAgeRange": "5-7",
        "status": "new",
        "submittedAt": "2024-02-03T11:00:00Z"
      }
    ]
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `500` - Internal Server Error

---

## Rate Limiting (Recommended for Production)

- Form submission: 5 requests per minute per IP
- Admin endpoints: 100 requests per minute per token

---

## CORS Configuration

The API accepts requests from:
- `http://localhost:8081` (development)
- Configure `FRONTEND_URL` in `.env` for other domains

---

## Example Usage with JavaScript

```javascript
// Login
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@futurekidsjourney.com',
    password: 'password'
  })
});

const { data: { token } } = await loginResponse.json();
localStorage.setItem('authToken', token);

// Get submissions
const response = await fetch(
  'http://localhost:5000/api/forms/submissions?status=new&limit=20',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { data } = await response.json();
console.log(data.submissions);
```

---

## Database Schema

### FormSubmission
```
{
  _id: ObjectId
  parentName: String (required, 2-100 chars)
  whatsappNumber: String (required, 10-15 chars)
  childAgeRange: String (required, enum: ['5-7', '8-10', '11-14'])
  status: String (enum: ['new', 'contacted', 'enrolled', 'no_response'], default: 'new')
  notes: String (optional)
  referralLink: String (optional)
  ipAddress: String (optional)
  userAgent: String (optional)
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}
```

### Admin
```
{
  _id: ObjectId
  email: String (required, unique, lowercase)
  password: String (required, hashed, min 8 chars)
  fullName: String (required)
  role: String (enum: ['super_admin', 'admin', 'viewer'], default: 'admin')
  isActive: Boolean (default: true)
  lastLogin: Date (optional)
  createdAt: Date
  updatedAt: Date
}
```

---

## Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@futurekidsjourney.com","password":"password"}'

# Get submissions (replace TOKEN with actual token)
curl -X GET "http://localhost:5000/api/forms/submissions?limit=5" \
  -H "Authorization: Bearer TOKEN"

# Submit form
curl -X POST http://localhost:5000/api/forms/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","whatsapp":"+254712345678","ageRange":"5-7"}'
```

---

## Support & Debugging

Enable debug logging in development:
```env
NODE_ENV=development
```

Check server logs for detailed error messages.
