# FamilyTogether API Endpoints

**Base URL (Local)**: `https://localhost:7290` or `http://localhost:5178`
**Swagger UI**: `https://localhost:7290/swagger`

---

## Authentication Endpoints

### 1. Register New User
**Endpoint**: `POST /api/auth/register`
**Auth Required**: No
**Description**: Register a new user, create a family, and return auth tokens

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "familyName": "The Doe Family"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-string",
    "expiresAt": "2026-02-11T12:00:00Z",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "family": {
      "id": "uuid",
      "name": "The Doe Family",
      "createdAt": "2026-02-11T11:00:00Z"
    },
    "member": {
      "id": "uuid",
      "name": "John Doe",
      "role": "parent",
      "pointsBalance": 0,
      "avatar": "👤"
    }
  },
  "message": "Registration successful. Welcome to FamilyTogether!",
  "timestamp": "2026-02-11T11:00:00Z"
}
```

---

### 2. Login
**Endpoint**: `POST /api/auth/login`
**Auth Required**: No
**Description**: Login with email and password

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-string",
    "expiresAt": "2026-02-11T12:00:00Z",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "family": {
      "id": "uuid",
      "name": "The Doe Family",
      "createdAt": "2026-02-11T11:00:00Z"
    },
    "member": {
      "id": "uuid",
      "name": "John Doe",
      "role": "parent",
      "pointsBalance": 0,
      "avatar": "👤"
    }
  },
  "message": "Login successful. Welcome back!",
  "timestamp": "2026-02-11T11:00:00Z"
}
```

---

### 3. Logout
**Endpoint**: `POST /api/auth/logout`
**Auth Required**: Yes (Bearer Token)
**Description**: Logout the current user

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully",
  "timestamp": "2026-02-11T11:00:00Z"
}
```

---

### 4. Get User Profile
**Endpoint**: `GET /api/auth/profile`
**Auth Required**: Yes (Bearer Token)
**Description**: Get current user's profile

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "",
    "name": "John Doe"
  },
  "timestamp": "2026-02-11T11:00:00Z"
}
```

---

## Health Check

### Health Status
**Endpoint**: `GET /health`
**Auth Required**: No
**Description**: Check API health status

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2026-02-11T11:00:00Z",
  "environment": "Development",
  "version": "1.0.0"
}
```

---

## Testing with cURL

### Register
```bash
curl -X POST https://localhost:7290/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "familyName": "Test Family"
  }'
```

### Login
```bash
curl -X POST https://localhost:7290/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### Get Profile (with token)
```bash
curl -X GET https://localhost:7290/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": ["Email is required", "Password must be at least 6 characters"]
  },
  "timestamp": "2026-02-11T11:00:00Z"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  },
  "timestamp": "2026-02-11T11:00:00Z"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  },
  "timestamp": "2026-02-11T11:00:00Z"
}
```

---

## Next: Family Endpoints (Coming Soon)
- GET /api/families - List user's families
- POST /api/families - Create a new family
- GET /api/families/{id} - Get family details
- POST /api/families/{familyId}/members - Add family member
