# API Specification Document
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0  
**Base URL**: `https://familytogether-api.up.railway.app` (production)  
**Base URL**: `http://localhost:5000` (development)  
**Date**: February 10, 2026

---

## Table of Contents
1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Formats](#requestresponse-formats)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Versioning](#versioning)

---

## Authentication

### JWT Bearer Token

All API endpoints (except `/api/auth/register` and `/api/auth/login`) require authentication via JWT Bearer token in the `Authorization` header.

**Header Format**:
```
Authorization: Bearer <jwt_token>
```

**Token Structure**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "family_id": "family-uuid",
  "role": "parent",
  "iat": 1707559200,
  "exp": 1707562800
}
```

**Token Expiry**: 60 minutes (configurable)

---

## API Endpoints

### Authentication Endpoints

#### 1. Register New Account

**Endpoint**: `POST /api/auth/register`  
**Authentication**: None (public)  
**Description**: Create a new user account and family

**Request Body**:
```json
{
  "email": "john.smith@example.com",
  "password": "SecurePassword123!",
  "family_name": "The Smith Family",
  "user_name": "John Smith"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.smith@example.com",
      "created_at": "2026-02-10T10:00:00.000Z"
    },
    "family": {
      "id": "650e8400-e29b-41d4-a716-446655440000",
      "name": "The Smith Family",
      "created_at": "2026-02-10T10:00:00.000Z"
    },
    "member": {
      "id": "750e8400-e29b-41d4-a716-446655440000",
      "name": "John Smith",
      "role": "parent",
      "points_balance": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules**:
- Email: Valid email format, unique
- Password: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
- Family Name: 3-255 characters
- User Name: 2-255 characters

**Errors**:
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email already exists

---

#### 2. Login

**Endpoint**: `POST /api/auth/login`  
**Authentication**: None (public)  
**Description**: Authenticate user and receive JWT token

**Request Body**:
```json
{
  "email": "john.smith@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.smith@example.com"
    },
    "family": {
      "id": "650e8400-e29b-41d4-a716-446655440000",
      "name": "The Smith Family"
    },
    "member": {
      "id": "750e8400-e29b-41d4-a716-446655440000",
      "name": "John Smith",
      "role": "parent",
      "points_balance": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2026-02-10T11:00:00.000Z"
  }
}
```

**Errors**:
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid credentials

---

#### 3. Refresh Token

**Endpoint**: `POST /api/auth/refresh`  
**Authentication**: Required (valid JWT)  
**Description**: Get a new JWT token before current one expires

**Request Body**: None

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2026-02-10T12:00:00.000Z"
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or expired token

---

#### 4. Logout

**Endpoint**: `POST /api/auth/logout`  
**Authentication**: Required  
**Description**: Invalidate current JWT token

**Request Body**: None

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

---

### Task Endpoints

#### 5. Get All Tasks

**Endpoint**: `GET /api/tasks`  
**Authentication**: Required  
**Description**: Get all tasks for the authenticated user's family

**Query Parameters**:
- `assigned_to` (optional): Filter by member ID
- `status` (optional): Filter by status (pending, in_progress, awaiting_approval, approved, rejected)
- `include_deleted` (optional): Include deleted tasks (default: false)

**Example**: `GET /api/tasks?assigned_to=750e8400-e29b-41d4-a716-446655440000&status=pending`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "850e8400-e29b-41d4-a716-446655440000",
        "family_id": "650e8400-e29b-41d4-a716-446655440000",
        "title": "Clean your room",
        "description": "Vacuum, dust, and organize closet",
        "points": 20,
        "assigned_to": "750e8400-e29b-41d4-a716-446655440000",
        "assigned_to_name": "John Smith",
        "created_by": "750e8400-e29b-41d4-a716-446655440000",
        "created_by_name": "John Smith",
        "status": "pending",
        "is_recurring": false,
        "recurrence_pattern": null,
        "due_date": "2026-02-11T18:00:00.000Z",
        "completed_at": null,
        "completed_by": null,
        "completion_note": null,
        "completion_photo_url": null,
        "reviewed_at": null,
        "reviewed_by": null,
        "review_note": null,
        "bonus_points": 0,
        "created_at": "2026-02-10T10:00:00.000Z",
        "updated_at": "2026-02-10T10:00:00.000Z",
        "last_modified": 1707559200000
      }
    ],
    "total": 1
  }
}
```

---

#### 6. Create Task

**Endpoint**: `POST /api/tasks`  
**Authentication**: Required  
**Description**: Create a new task

**Request Body**:
```json
{
  "title": "Wash the dishes",
  "description": "Load and run the dishwasher",
  "points": 15,
  "assigned_to": "750e8400-e29b-41d4-a716-446655440000",
  "due_date": "2026-02-11T20:00:00.000Z",
  "is_recurring": false,
  "recurrence_pattern": null,
  "recurrence_day": null
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "950e8400-e29b-41d4-a716-446655440000",
      "family_id": "650e8400-e29b-41d4-a716-446655440000",
      "title": "Wash the dishes",
      "description": "Load and run the dishwasher",
      "points": 15,
      "assigned_to": "750e8400-e29b-41d4-a716-446655440000",
      "created_by": "750e8400-e29b-41d4-a716-446655440000",
      "status": "pending",
      "due_date": "2026-02-11T20:00:00.000Z",
      "created_at": "2026-02-10T10:05:00.000Z",
      "last_modified": 1707559500000,
      "change_id": "a50e8400-e29b-41d4-a716-446655440000",
      "sync_version": 1
    }
  }
}
```

**Validation Rules**:
- Title: 1-500 characters, required
- Description: 0-5000 characters, optional
- Points: Integer >= 0, required
- Assigned To: Valid member ID in family, required
- Due Date: ISO 8601 datetime, optional
- Recurrence Pattern: 'daily' | 'weekly' | 'monthly' | null

**Errors**:
- `400 Bad Request`: Invalid input
- `403 Forbidden`: Not authorized to create tasks for this family
- `404 Not Found`: Assigned member not found

---

#### 7. Update Task

**Endpoint**: `PUT /api/tasks/{taskId}`  
**Authentication**: Required  
**Description**: Update an existing task

**Request Body** (all fields optional):
```json
{
  "title": "Clean your room thoroughly",
  "description": "Vacuum, dust, organize, and make bed",
  "points": 25,
  "status": "in_progress",
  "due_date": "2026-02-11T19:00:00.000Z"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "850e8400-e29b-41d4-a716-446655440000",
      "title": "Clean your room thoroughly",
      "description": "Vacuum, dust, organize, and make bed",
      "points": 25,
      "status": "in_progress",
      "due_date": "2026-02-11T19:00:00.000Z",
      "updated_at": "2026-02-10T10:10:00.000Z",
      "last_modified": 1707559800000,
      "change_id": "b50e8400-e29b-41d4-a716-446655440000",
      "sync_version": 2
    }
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid input
- `403 Forbidden`: Not authorized to update this task
- `404 Not Found`: Task not found
- `409 Conflict`: Task has been modified by another user (sync conflict)

---

#### 8. Delete Task

**Endpoint**: `DELETE /api/tasks/{taskId}`  
**Authentication**: Required  
**Description**: Soft delete a task (marks as deleted)

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Task deleted successfully",
  "data": {
    "task_id": "850e8400-e29b-41d4-a716-446655440000",
    "deleted_at": "2026-02-10T10:15:00.000Z"
  }
}
```

**Errors**:
- `403 Forbidden`: Not authorized to delete this task
- `404 Not Found`: Task not found

---

#### 9. Complete Task

**Endpoint**: `POST /api/tasks/{taskId}/complete`  
**Authentication**: Required  
**Description**: Mark task as complete (user action)

**Request Body**:
```json
{
  "completion_note": "All done! Took about 30 minutes.",
  "completion_photo_url": "https://storage.supabase.co/..."
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "850e8400-e29b-41d4-a716-446655440000",
      "status": "awaiting_approval",
      "completed_at": "2026-02-10T10:20:00.000Z",
      "completed_by": "750e8400-e29b-41d4-a716-446655440000",
      "completion_note": "All done! Took about 30 minutes.",
      "completion_photo_url": "https://storage.supabase.co/...",
      "last_modified": 1707560000000
    }
  }
}
```

**Errors**:
- `400 Bad Request`: Task already completed or not assigned to user
- `403 Forbidden`: Not authorized
- `404 Not Found`: Task not found

---

#### 10. Approve Task

**Endpoint**: `POST /api/tasks/{taskId}/approve`  
**Authentication**: Required (parent/admin only)  
**Description**: Approve completed task and award points

**Request Body**:
```json
{
  "review_note": "Great job!",
  "bonus_points": 5,
  "bonus_reason": "Extra effort on organizing closet"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "850e8400-e29b-41d4-a716-446655440000",
      "status": "approved",
      "reviewed_at": "2026-02-10T10:25:00.000Z",
      "reviewed_by": "750e8400-e29b-41d4-a716-446655440000",
      "review_note": "Great job!",
      "bonus_points": 5,
      "bonus_reason": "Extra effort on organizing closet",
      "last_modified": 1707560300000
    },
    "points_awarded": 25,
    "new_balance": 25
  }
}
```

**Side Effects**:
- Creates point transaction for task completion
- Creates bonus point transaction if bonus_points > 0
- Updates member's points_balance

**Errors**:
- `400 Bad Request`: Task not awaiting approval
- `403 Forbidden`: Not authorized (must be parent/admin)
- `404 Not Found`: Task not found

---

#### 11. Reject Task

**Endpoint**: `POST /api/tasks/{taskId}/reject`  
**Authentication**: Required (parent/admin only)  
**Description**: Reject completed task, no points awarded

**Request Body**:
```json
{
  "review_note": "Room still messy. Please try again."
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "task": {
      "id": "850e8400-e29b-41d4-a716-446655440000",
      "status": "rejected",
      "reviewed_at": "2026-02-10T10:25:00.000Z",
      "reviewed_by": "750e8400-e29b-41d4-a716-446655440000",
      "review_note": "Room still messy. Please try again.",
      "last_modified": 1707560300000
    }
  }
}
```

**Side Effects**:
- Task status changes to 'rejected'
- Task can be reattempted by user

**Errors**:
- `400 Bad Request`: Task not awaiting approval
- `403 Forbidden`: Not authorized (must be parent/admin)
- `404 Not Found`: Task not found

---

### Points Endpoints

#### 12. Get Point Balance

**Endpoint**: `GET /api/points`  
**Authentication**: Required  
**Description**: Get current point balance for authenticated member

**Query Parameters**:
- `member_id` (optional): Get balance for specific member (parent/admin only)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "member_id": "750e8400-e29b-41d4-a716-446655440000",
    "member_name": "John Smith",
    "points_balance": 125,
    "last_updated": "2026-02-10T10:25:00.000Z"
  }
}
```

---

#### 13. Get Point History

**Endpoint**: `GET /api/points/history`  
**Authentication**: Required  
**Description**: Get point transaction history

**Query Parameters**:
- `member_id` (optional): Filter by member
- `limit` (optional): Number of results (default: 50, max: 200)
- `offset` (optional): Pagination offset (default: 0)

**Example**: `GET /api/points/history?member_id=750e8400-e29b-41d4-a716-446655440000&limit=20`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "a50e8400-e29b-41d4-a716-446655440000",
        "member_id": "750e8400-e29b-41d4-a716-446655440000",
        "member_name": "John Smith",
        "amount": 20,
        "transaction_type": "task_completion",
        "description": "Completed task: Clean your room",
        "reference_id": "850e8400-e29b-41d4-a716-446655440000",
        "created_at": "2026-02-10T10:25:00.000Z"
      },
      {
        "id": "b50e8400-e29b-41d4-a716-446655440000",
        "member_id": "750e8400-e29b-41d4-a716-446655440000",
        "member_name": "John Smith",
        "amount": 5,
        "transaction_type": "bonus",
        "description": "Bonus: Extra effort on organizing closet",
        "reference_id": "850e8400-e29b-41d4-a716-446655440000",
        "created_at": "2026-02-10T10:25:00.000Z"
      }
    ],
    "total": 2,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### 14. Adjust Points Manually

**Endpoint**: `POST /api/points/adjust`  
**Authentication**: Required (parent/admin only)  
**Description**: Manually add or remove points

**Request Body**:
```json
{
  "member_id": "750e8400-e29b-41d4-a716-446655440000",
  "amount": 10,
  "description": "Extra credit for helping with groceries"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "c50e8400-e29b-41d4-a716-446655440000",
      "member_id": "750e8400-e29b-41d4-a716-446655440000",
      "amount": 10,
      "transaction_type": "manual_adjustment",
      "description": "Extra credit for helping with groceries",
      "created_by": "750e8400-e29b-41d4-a716-446655440000",
      "created_at": "2026-02-10T10:30:00.000Z"
    },
    "new_balance": 135
  }
}
```

**Validation Rules**:
- Amount: Integer (positive or negative), required
- Description: 1-500 characters, required
- Member ID: Valid member in family, required

**Errors**:
- `400 Bad Request`: Invalid input or insufficient points for negative adjustment
- `403 Forbidden`: Not authorized (must be parent/admin)
- `404 Not Found`: Member not found

---

### Rewards Endpoints

#### 15. Get All Rewards

**Endpoint**: `GET /api/rewards`  
**Authentication**: Required  
**Description**: Get all rewards for family

**Query Parameters**:
- `is_active` (optional): Filter by active status (default: true)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "id": "d50e8400-e29b-41d4-a716-446655440000",
        "family_id": "650e8400-e29b-41d4-a716-446655440000",
        "title": "Extra screen time (30 min)",
        "description": "Get 30 extra minutes of screen time",
        "cost": 50,
        "icon": "📺",
        "is_active": true,
        "requires_approval": true,
        "created_by": "750e8400-e29b-41d4-a716-446655440000",
        "created_at": "2026-02-10T09:00:00.000Z",
        "last_modified": 1707555600000
      }
    ],
    "total": 1
  }
}
```

---

#### 16. Create Reward

**Endpoint**: `POST /api/rewards`  
**Authentication**: Required (parent/admin only)  
**Description**: Create a new reward

**Request Body**:
```json
{
  "title": "Movie night choice",
  "description": "Get to pick the movie for family movie night",
  "cost": 100,
  "icon": "🎬",
  "requires_approval": true
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "reward": {
      "id": "e50e8400-e29b-41d4-a716-446655440000",
      "family_id": "650e8400-e29b-41d4-a716-446655440000",
      "title": "Movie night choice",
      "description": "Get to pick the movie for family movie night",
      "cost": 100,
      "icon": "🎬",
      "is_active": true,
      "requires_approval": true,
      "created_by": "750e8400-e29b-41d4-a716-446655440000",
      "created_at": "2026-02-10T10:35:00.000Z",
      "last_modified": 1707560700000
    }
  }
}
```

**Validation Rules**:
- Title: 1-255 characters, required
- Description: 0-1000 characters, optional
- Cost: Integer > 0, required
- Icon: Single emoji character, optional
- Requires Approval: Boolean, default true

---

#### 17. Update Reward

**Endpoint**: `PUT /api/rewards/{rewardId}`  
**Authentication**: Required (parent/admin only)  
**Description**: Update an existing reward

**Request Body** (all fields optional):
```json
{
  "title": "Movie night choice (updated)",
  "cost": 75,
  "is_active": true
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "reward": {
      "id": "e50e8400-e29b-41d4-a716-446655440000",
      "title": "Movie night choice (updated)",
      "cost": 75,
      "is_active": true,
      "updated_at": "2026-02-10T10:40:00.000Z",
      "last_modified": 1707561000000
    }
  }
}
```

---

#### 18. Delete Reward

**Endpoint**: `DELETE /api/rewards/{rewardId}`  
**Authentication**: Required (parent/admin only)  
**Description**: Soft delete a reward

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Reward deleted successfully",
  "data": {
    "reward_id": "e50e8400-e29b-41d4-a716-446655440000",
    "deleted_at": "2026-02-10T10:45:00.000Z"
  }
}
```

---

#### 19. Redeem Reward

**Endpoint**: `POST /api/rewards/{rewardId}/redeem`  
**Authentication**: Required  
**Description**: Redeem a reward using points

**Request Body**: None

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "redemption": {
      "id": "f50e8400-e29b-41d4-a716-446655440000",
      "reward_id": "d50e8400-e29b-41d4-a716-446655440000",
      "reward_title": "Extra screen time (30 min)",
      "member_id": "750e8400-e29b-41d4-a716-446655440000",
      "status": "pending",
      "points_spent": 50,
      "redeemed_at": "2026-02-10T10:50:00.000Z"
    },
    "new_balance": 85
  }
}
```

**Side Effects**:
- Deducts points from member's balance
- Creates point transaction (negative amount)
- Creates reward redemption record

**Errors**:
- `400 Bad Request`: Insufficient points
- `403 Forbidden`: Not authorized
- `404 Not Found`: Reward not found or inactive

---

### Sync Endpoint

#### 20. Sync Changes

**Endpoint**: `POST /api/sync`  
**Authentication**: Required  
**Description**: Synchronize local changes with server

**Request Body**:
```json
{
  "client_type": "spa",
  "client_version": "1.0.0",
  "last_sync_timestamp": 1707559200000,
  "changes": [
    {
      "table_name": "tasks",
      "operation": "update",
      "record_id": "850e8400-e29b-41d4-a716-446655440000",
      "data": {
        "id": "850e8400-e29b-41d4-a716-446655440000",
        "status": "in_progress",
        "last_modified": 1707559800000,
        "change_id": "g50e8400-e29b-41d4-a716-446655440000",
        "sync_version": 2
      }
    }
  ]
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "sync_timestamp": 1707561600000,
    "accepted_changes": [
      {
        "record_id": "850e8400-e29b-41d4-a716-446655440000",
        "status": "accepted"
      }
    ],
    "rejected_changes": [],
    "server_changes": [
      {
        "table_name": "rewards",
        "operation": "create",
        "record_id": "h50e8400-e29b-41d4-a716-446655440000",
        "data": {
          "id": "h50e8400-e29b-41d4-a716-446655440000",
          "family_id": "650e8400-e29b-41d4-a716-446655440000",
          "title": "New reward",
          "cost": 100,
          "last_modified": 1707561000000,
          "change_id": "i50e8400-e29b-41d4-a716-446655440000",
          "sync_version": 1
        }
      }
    ],
    "conflicts_resolved": 0
  }
}
```

**Conflict Response Example**:
```json
{
  "success": true,
  "data": {
    "sync_timestamp": 1707561600000,
    "accepted_changes": [],
    "rejected_changes": [
      {
        "record_id": "850e8400-e29b-41d4-a716-446655440000",
        "status": "conflict",
        "reason": "server version newer (Last-Write-Wins)",
        "server_data": {
          "id": "850e8400-e29b-41d4-a716-446655440000",
          "status": "approved",
          "last_modified": 1707561000000,
          "change_id": "j50e8400-e29b-41d4-a716-446655440000",
          "sync_version": 3
        }
      }
    ],
    "server_changes": [],
    "conflicts_resolved": 1
  }
}
```

**Validation Rules**:
- Changes: Array, max 100 items per sync
- Table Name: Must be valid table (families, members, tasks, etc.)
- Operation: 'create' | 'update' | 'delete'
- Record ID: Valid UUID

**Errors**:
- `400 Bad Request`: Invalid sync payload
- `401 Unauthorized`: Invalid token
- `413 Payload Too Large`: More than 100 changes

---

#### 21. Get Sync Status

**Endpoint**: `GET /api/sync/status`  
**Authentication**: Required  
**Description**: Get last sync information

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "last_sync": "2026-02-10T10:50:00.000Z",
    "last_sync_timestamp": 1707561600000,
    "pending_changes": 0,
    "sync_version": 15
  }
}
```

---

### Family Management Endpoints

#### 22. Get Family Members

**Endpoint**: `GET /api/family/members`  
**Authentication**: Required  
**Description**: Get all members in family

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "family": {
      "id": "650e8400-e29b-41d4-a716-446655440000",
      "name": "The Smith Family"
    },
    "members": [
      {
        "id": "750e8400-e29b-41d4-a716-446655440000",
        "name": "John Smith",
        "role": "parent",
        "avatar": "👨",
        "points_balance": 0,
        "is_active": true
      },
      {
        "id": "850e8400-e29b-41d4-a716-446655440000",
        "name": "Jane Smith",
        "role": "child",
        "avatar": "👧",
        "points_balance": 135,
        "is_active": true,
        "requires_approval": true,
        "parent_id": "750e8400-e29b-41d4-a716-446655440000"
      }
    ],
    "total": 2
  }
}
```

---

#### 23. Add Family Member

**Endpoint**: `POST /api/family/members`  
**Authentication**: Required (parent/admin only)  
**Description**: Add a new family member (typically a child)

**Request Body**:
```json
{
  "name": "Bobby Smith",
  "role": "child",
  "avatar": "👦",
  "requires_approval": true,
  "parent_id": "750e8400-e29b-41d4-a716-446655440000"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "950e8400-e29b-41d4-a716-446655440000",
      "family_id": "650e8400-e29b-41d4-a716-446655440000",
      "name": "Bobby Smith",
      "role": "child",
      "avatar": "👦",
      "points_balance": 0,
      "is_active": true,
      "requires_approval": true,
      "parent_id": "750e8400-e29b-41d4-a716-446655440000",
      "created_at": "2026-02-10T11:00:00.000Z",
      "last_modified": 1707562200000
    }
  }
}
```

**Validation Rules**:
- Name: 2-255 characters, required
- Role: 'parent' | 'child' | 'admin', required
- Avatar: Single emoji, optional
- Requires Approval: Boolean, default true for children

---

#### 24. Remove Family Member

**Endpoint**: `DELETE /api/family/members/{memberId}`  
**Authentication**: Required (parent/admin only)  
**Description**: Soft delete a family member

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Family member removed successfully",
  "data": {
    "member_id": "950e8400-e29b-41d4-a716-446655440000",
    "deleted_at": "2026-02-10T11:05:00.000Z"
  }
}
```

**Errors**:
- `400 Bad Request`: Cannot remove last parent
- `403 Forbidden`: Not authorized
- `404 Not Found`: Member not found

---

## Request/Response Formats

### Standard Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "data": { ... },        // Present on success
  "error": { ... },       // Present on error
  "message": "...",       // Optional message
  "timestamp": "2026-02-10T10:00:00.000Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "timestamp": "2026-02-10T10:00:00.000Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token |
| `FORBIDDEN` | 403 | User lacks permission for action |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., email exists, sync conflict) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Error Handling

### HTTP Status Codes

- **200 OK**: Successful GET, PUT, PATCH requests
- **201 Created**: Successful POST requests creating resources
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource conflict (email exists, sync conflict)
- **413 Payload Too Large**: Request body too large
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Server temporarily unavailable

### Retry Strategy

For 5xx errors and 429 (rate limit):
1. Wait 1 second, retry
2. Wait 2 seconds, retry
3. Wait 4 seconds, retry
4. Give up, show error to user

For 409 (sync conflict):
1. Apply server data to local storage
2. Mark local change as synced
3. Continue with next change

---

## Rate Limiting

### Limits

- **General**: 100 requests per minute per IP
- **Auth endpoints**: 5 requests per minute per IP
- **Sync endpoint**: 2 requests per minute per user

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1707559260
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 30 seconds.",
    "retry_after": 30
  },
  "timestamp": "2026-02-10T10:00:00.000Z"
}
```

---

## Versioning

### API Version

Current version: **v1**

### Version Strategy

- Version included in base URL: `/api/v1/...` (future)
- Currently: `/api/...` (no version, defaults to v1)
- Breaking changes will increment major version (v2, v3)
- Non-breaking changes maintain version number

### Deprecation Policy

- 6 months notice before deprecation
- Old versions supported for 12 months after deprecation notice
- Deprecation warnings in response headers

---

## Appendix: Example Workflows

### User Registration Flow

```
1. POST /api/auth/register
   → Creates user, family, parent member
   → Returns JWT token

2. Store token in localStorage (SPA) or secure storage (WPF)

3. Use token for all subsequent requests
```

### Task Completion Flow

```
1. Child: POST /api/tasks/{taskId}/complete
   → Task status: pending → awaiting_approval
   → Local: Save to IndexedDB/SQLite
   → Sync: Add to sync queue

2. Background sync: POST /api/sync
   → Upload completed task to server
   → Download any new tasks

3. Parent: POST /api/tasks/{taskId}/approve
   → Task status: awaiting_approval → approved
   → Points added to child's balance
   → Point transaction created

4. Background sync: POST /api/sync
   → Child receives task approval
   → Child receives updated point balance
```

### Offline-to-Online Flow

```
1. User goes offline
   → Local changes saved to IndexedDB/SQLite
   → Changes added to sync queue

2. User makes multiple changes while offline
   → All changes queued locally
   → UI shows "pending sync" indicator

3. User comes back online
   → Auto-sync triggered (or manual sync button)
   → POST /api/sync with all queued changes

4. Server processes changes
   → Resolves conflicts (Last-Write-Wins)
   → Returns accepted/rejected changes

5. Client applies server response
   → Update local storage with server data
   → Clear sync queue for accepted changes
   → Show notification to user
```

---

**END OF API SPECIFICATION DOCUMENT**
