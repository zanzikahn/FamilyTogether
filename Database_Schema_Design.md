# Database Schema Design Document
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0  
**Date**: February 10, 2026  
**Status**: Pre-Development

---

## Table of Contents
1. [Overview](#overview)
2. [PostgreSQL Schema (Supabase - Cloud)](#postgresql-schema)
3. [SQLite Schema (WPF - Local Desktop)](#sqlite-schema)
4. [IndexedDB Structure (SPA - Browser)](#indexeddb-structure)
5. [Data Synchronization Design](#data-synchronization-design)
6. [Migration Scripts](#migration-scripts)
7. [Indexes & Optimization](#indexes--optimization)
8. [Security & RLS Policies](#security--rls-policies)

---

## Overview

### Multi-Database Architecture

The FamilyTogether platform uses **three different database systems** working in harmony:

1. **Supabase PostgreSQL** (Cloud) - Source of truth, handles conflicts
2. **SQLite** (WPF Local) - Desktop app local storage
3. **IndexedDB** (SPA Browser) - Web app local storage

### Data Flow

```
┌─────────────────┐          ┌──────────────────┐          ┌─────────────────┐
│   IndexedDB     │          │   PostgreSQL     │          │     SQLite      │
│   (Browser)     │◄────────►│   (Supabase)     │◄────────►│   (Desktop)     │
│                 │   Sync   │   Source of      │   Sync   │                 │
│   Local Data    │          │   Truth          │          │   Local Data    │
└─────────────────┘          └──────────────────┘          └─────────────────┘
```

### Design Principles

1. **Schema Parity**: All three databases maintain identical logical schemas
2. **Offline-First**: Local databases are fully functional without cloud connection
3. **Conflict Resolution**: PostgreSQL handles conflicts using Last-Write-Wins
4. **Audit Trail**: All changes tracked with timestamps and change IDs
5. **Soft Deletes**: Records marked as deleted, not physically removed (for sync)

---

## PostgreSQL Schema (Supabase - Cloud)

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    users    │◄───────┤   families  │────────►│   members   │
│             │         │             │         │             │
│  (Supabase  │         │             │         │             │
│   Auth)     │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
                               │                       │
                               │                       │
                               ▼                       ▼
                        ┌─────────────┐         ┌─────────────┐
                        │    tasks    │         │   points    │
                        │             │         │transactions │
                        └─────────────┘         └─────────────┘
                               │
                               │
                               ▼
                        ┌─────────────┐
                        │   rewards   │
                        │             │
                        └─────────────┘
```

### Table Definitions

#### 1. users (Managed by Supabase Auth)

**Note**: This table is automatically created and managed by Supabase Auth. We reference it but don't create it manually.

```sql
-- Supabase Auth automatically creates:
-- - id (UUID, Primary Key)
-- - email (TEXT)
-- - encrypted_password (TEXT)
-- - email_confirmed_at (TIMESTAMP)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
```

#### 2. families

```sql
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified BIGINT NOT NULL DEFAULT extract(epoch from NOW())::BIGINT * 1000,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Sync metadata
    change_id UUID DEFAULT gen_random_uuid(),
    sync_version INTEGER DEFAULT 1
);

CREATE INDEX idx_families_created_by ON families(created_by);
CREATE INDEX idx_families_last_modified ON families(last_modified);
CREATE INDEX idx_families_is_deleted ON families(is_deleted);
```

**Columns Explained**:
- `id`: Unique identifier for the family
- `name`: Family name (e.g., "The Smith Family")
- `created_by`: User who created the family (family owner)
- `created_at`, `updated_at`: Standard timestamps
- `last_modified`: Unix timestamp in milliseconds for conflict resolution
- `is_deleted`: Soft delete flag
- `change_id`: Unique identifier for this version of the record
- `sync_version`: Incremented on each change

#### 3. members

```sql
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('parent', 'child', 'admin')),
    avatar VARCHAR(10), -- Emoji or icon identifier
    points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified BIGINT NOT NULL DEFAULT extract(epoch from NOW())::BIGINT * 1000,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Sync metadata
    change_id UUID DEFAULT gen_random_uuid(),
    sync_version INTEGER DEFAULT 1,
    
    -- Child-specific fields (NULL for parents)
    requires_approval BOOLEAN DEFAULT TRUE,
    parent_id UUID REFERENCES members(id) ON DELETE SET NULL
);

CREATE INDEX idx_members_family_id ON members(family_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_last_modified ON members(last_modified);
CREATE INDEX idx_members_is_deleted ON members(is_deleted);
CREATE INDEX idx_members_role ON members(role);
```

**Columns Explained**:
- `user_id`: Link to Supabase Auth user (NULL for child accounts without login)
- `role`: parent | child | admin
- `avatar`: Emoji character for visual identification
- `points_balance`: Current point total (cached for performance)
- `requires_approval`: If TRUE, tasks need parent approval
- `parent_id`: Which parent manages this child account

#### 4. tasks

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL CHECK (points >= 0),
    assigned_to UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'awaiting_approval', 'approved', 'rejected')),
    
    -- Recurring task fields
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50) CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', NULL)),
    recurrence_day INTEGER CHECK (recurrence_day BETWEEN 0 AND 31), -- Day of week (0-6) or month (1-31)
    last_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Due date
    due_date TIMESTAMP WITH TIME ZONE,
    
    -- Completion tracking
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES members(id) ON DELETE SET NULL,
    completion_note TEXT,
    completion_photo_url VARCHAR(500),
    
    -- Approval tracking
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES members(id) ON DELETE SET NULL,
    review_note TEXT,
    
    -- Bonus system
    bonus_points INTEGER DEFAULT 0,
    bonus_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified BIGINT NOT NULL DEFAULT extract(epoch from NOW())::BIGINT * 1000,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Sync metadata
    change_id UUID DEFAULT gen_random_uuid(),
    sync_version INTEGER DEFAULT 1
);

CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_last_modified ON tasks(last_modified);
CREATE INDEX idx_tasks_is_deleted ON tasks(is_deleted);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
```

**Task Status Flow**:
1. **pending** → Task created, not started
2. **in_progress** → User marks as working on it
3. **awaiting_approval** → User marks complete, needs parent review
4. **approved** → Parent approves, points awarded
5. **rejected** → Parent rejects, goes back to pending

#### 5. point_transactions

```sql
CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for earning, negative for spending
    transaction_type VARCHAR(50) NOT NULL 
        CHECK (transaction_type IN ('task_completion', 'reward_redemption', 'manual_adjustment', 'bonus')),
    reference_id UUID, -- ID of task or reward
    description TEXT NOT NULL,
    created_by UUID REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified BIGINT NOT NULL DEFAULT extract(epoch from NOW())::BIGINT * 1000,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Sync metadata
    change_id UUID DEFAULT gen_random_uuid(),
    sync_version INTEGER DEFAULT 1
);

CREATE INDEX idx_point_transactions_family_id ON point_transactions(family_id);
CREATE INDEX idx_point_transactions_member_id ON point_transactions(member_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_last_modified ON point_transactions(last_modified);
CREATE INDEX idx_point_transactions_is_deleted ON point_transactions(is_deleted);
```

**Transaction Types**:
- `task_completion`: Points earned from completing tasks
- `reward_redemption`: Points spent on rewards
- `manual_adjustment`: Parent manually adds/removes points
- `bonus`: Bonus points (streaks, special achievements)

#### 6. rewards

```sql
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL CHECK (cost > 0),
    icon VARCHAR(10), -- Emoji
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified BIGINT NOT NULL DEFAULT extract(epoch from NOW())::BIGINT * 1000,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Sync metadata
    change_id UUID DEFAULT gen_random_uuid(),
    sync_version INTEGER DEFAULT 1
);

CREATE INDEX idx_rewards_family_id ON rewards(family_id);
CREATE INDEX idx_rewards_is_active ON rewards(is_active);
CREATE INDEX idx_rewards_last_modified ON rewards(last_modified);
CREATE INDEX idx_rewards_is_deleted ON rewards(is_deleted);
```

#### 7. reward_redemptions

```sql
CREATE TABLE reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'denied')),
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES members(id) ON DELETE SET NULL,
    review_note TEXT,
    points_spent INTEGER NOT NULL CHECK (points_spent > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified BIGINT NOT NULL DEFAULT extract(epoch from NOW())::BIGINT * 1000,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Sync metadata
    change_id UUID DEFAULT gen_random_uuid(),
    sync_version INTEGER DEFAULT 1
);

CREATE INDEX idx_reward_redemptions_family_id ON reward_redemptions(family_id);
CREATE INDEX idx_reward_redemptions_member_id ON reward_redemptions(member_id);
CREATE INDEX idx_reward_redemptions_status ON reward_redemptions(status);
CREATE INDEX idx_reward_redemptions_last_modified ON reward_redemptions(last_modified);
CREATE INDEX idx_reward_redemptions_is_deleted ON reward_redemptions(is_deleted);
```

#### 8. sync_logs

```sql
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    sync_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changes_uploaded INTEGER DEFAULT 0,
    changes_downloaded INTEGER DEFAULT 0,
    conflicts_resolved INTEGER DEFAULT 0,
    errors TEXT[],
    client_type VARCHAR(20) CHECK (client_type IN ('spa', 'wpf', 'api')),
    client_version VARCHAR(50)
);

CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_family_id ON sync_logs(family_id);
CREATE INDEX idx_sync_logs_sync_timestamp ON sync_logs(sync_timestamp DESC);
```

**Purpose**: Audit trail for all sync operations, helps with debugging sync issues.

---

## SQLite Schema (WPF - Local Desktop)

### Schema Overview

SQLite schema **mirrors** the PostgreSQL schema but is stored locally as a file. Key differences:
- Uses `INTEGER` for IDs instead of `UUID` (with string UUID storage)
- Simplified foreign key constraints
- Local-only tables for sync queue

### Complete SQLite Migration

```sql
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- 1. Families
CREATE TABLE families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_modified INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER DEFAULT 0,
    change_id TEXT NOT NULL,
    sync_version INTEGER DEFAULT 1
);

CREATE INDEX idx_families_created_by ON families(created_by);
CREATE INDEX idx_families_last_modified ON families(last_modified);

-- 2. Members
CREATE TABLE members (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    user_id TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'child', 'admin')),
    avatar TEXT,
    points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),
    is_active INTEGER DEFAULT 1,
    requires_approval INTEGER DEFAULT 1,
    parent_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_modified INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER DEFAULT 0,
    change_id TEXT NOT NULL,
    sync_version INTEGER DEFAULT 1,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES members(id) ON DELETE SET NULL
);

CREATE INDEX idx_members_family_id ON members(family_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_last_modified ON members(last_modified);

-- 3. Tasks
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL CHECK (points >= 0),
    assigned_to TEXT NOT NULL,
    created_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'awaiting_approval', 'approved', 'rejected')),
    is_recurring INTEGER DEFAULT 0,
    recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', NULL)),
    recurrence_day INTEGER,
    last_generated_at TEXT,
    due_date TEXT,
    completed_at TEXT,
    completed_by TEXT,
    completion_note TEXT,
    completion_photo_url TEXT,
    reviewed_at TEXT,
    reviewed_by TEXT,
    review_note TEXT,
    bonus_points INTEGER DEFAULT 0,
    bonus_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_modified INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER DEFAULT 0,
    change_id TEXT NOT NULL,
    sync_version INTEGER DEFAULT 1,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_last_modified ON tasks(last_modified);

-- 4. Point Transactions
CREATE TABLE point_transactions (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL 
        CHECK (transaction_type IN ('task_completion', 'reward_redemption', 'manual_adjustment', 'bonus')),
    reference_id TEXT,
    description TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_modified INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER DEFAULT 0,
    change_id TEXT NOT NULL,
    sync_version INTEGER DEFAULT 1,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX idx_point_transactions_family_id ON point_transactions(family_id);
CREATE INDEX idx_point_transactions_member_id ON point_transactions(member_id);
CREATE INDEX idx_point_transactions_last_modified ON point_transactions(last_modified);

-- 5. Rewards
CREATE TABLE rewards (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL CHECK (cost > 0),
    icon TEXT,
    is_active INTEGER DEFAULT 1,
    requires_approval INTEGER DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_modified INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER DEFAULT 0,
    change_id TEXT NOT NULL,
    sync_version INTEGER DEFAULT 1,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX idx_rewards_family_id ON rewards(family_id);
CREATE INDEX idx_rewards_last_modified ON rewards(last_modified);

-- 6. Reward Redemptions
CREATE TABLE reward_redemptions (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    reward_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'denied')),
    redeemed_at TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_at TEXT,
    reviewed_by TEXT,
    review_note TEXT,
    points_spent INTEGER NOT NULL CHECK (points_spent > 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_modified INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    is_deleted INTEGER DEFAULT 0,
    change_id TEXT NOT NULL,
    sync_version INTEGER DEFAULT 1,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX idx_reward_redemptions_family_id ON reward_redemptions(family_id);
CREATE INDEX idx_reward_redemptions_member_id ON reward_redemptions(member_id);
CREATE INDEX idx_reward_redemptions_last_modified ON reward_redemptions(last_modified);

-- 7. Sync Queue (Local Only - Not Synced)
CREATE TABLE sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    data_json TEXT NOT NULL,
    timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT
);

CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_timestamp ON sync_queue(timestamp);

-- 8. Sync Metadata (Local Only)
CREATE TABLE sync_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert initial metadata
INSERT INTO sync_metadata (key, value) VALUES 
    ('last_sync_timestamp', '0'),
    ('sync_version', '1'),
    ('client_type', 'wpf'),
    ('client_version', '1.0.0');
```

---

## IndexedDB Structure (SPA - Browser)

### Database Configuration

```javascript
const DB_NAME = 'FamilyTogetherDB';
const DB_VERSION = 1;

const OBJECT_STORES = {
    families: 'families',
    members: 'members',
    tasks: 'tasks',
    pointTransactions: 'point_transactions',
    rewards: 'rewards',
    rewardRedemptions: 'reward_redemptions',
    syncQueue: 'sync_queue',
    syncMetadata: 'sync_metadata'
};
```

### Object Store Definitions

```javascript
// Initialize IndexedDB with all object stores
function initializeDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // 1. Families Object Store
            if (!db.objectStoreNames.contains('families')) {
                const familiesStore = db.createObjectStore('families', { keyPath: 'id' });
                familiesStore.createIndex('created_by', 'created_by', { unique: false });
                familiesStore.createIndex('last_modified', 'last_modified', { unique: false });
                familiesStore.createIndex('is_deleted', 'is_deleted', { unique: false });
            }
            
            // 2. Members Object Store
            if (!db.objectStoreNames.contains('members')) {
                const membersStore = db.createObjectStore('members', { keyPath: 'id' });
                membersStore.createIndex('family_id', 'family_id', { unique: false });
                membersStore.createIndex('user_id', 'user_id', { unique: false });
                membersStore.createIndex('last_modified', 'last_modified', { unique: false });
                membersStore.createIndex('is_deleted', 'is_deleted', { unique: false });
                membersStore.createIndex('role', 'role', { unique: false });
            }
            
            // 3. Tasks Object Store
            if (!db.objectStoreNames.contains('tasks')) {
                const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
                tasksStore.createIndex('family_id', 'family_id', { unique: false });
                tasksStore.createIndex('assigned_to', 'assigned_to', { unique: false });
                tasksStore.createIndex('status', 'status', { unique: false });
                tasksStore.createIndex('last_modified', 'last_modified', { unique: false });
                tasksStore.createIndex('is_deleted', 'is_deleted', { unique: false });
                tasksStore.createIndex('due_date', 'due_date', { unique: false });
            }
            
            // 4. Point Transactions Object Store
            if (!db.objectStoreNames.contains('point_transactions')) {
                const ptStore = db.createObjectStore('point_transactions', { keyPath: 'id' });
                ptStore.createIndex('family_id', 'family_id', { unique: false });
                ptStore.createIndex('member_id', 'member_id', { unique: false });
                ptStore.createIndex('last_modified', 'last_modified', { unique: false });
                ptStore.createIndex('is_deleted', 'is_deleted', { unique: false });
                ptStore.createIndex('created_at', 'created_at', { unique: false });
            }
            
            // 5. Rewards Object Store
            if (!db.objectStoreNames.contains('rewards')) {
                const rewardsStore = db.createObjectStore('rewards', { keyPath: 'id' });
                rewardsStore.createIndex('family_id', 'family_id', { unique: false });
                rewardsStore.createIndex('last_modified', 'last_modified', { unique: false });
                rewardsStore.createIndex('is_deleted', 'is_deleted', { unique: false });
                rewardsStore.createIndex('is_active', 'is_active', { unique: false });
            }
            
            // 6. Reward Redemptions Object Store
            if (!db.objectStoreNames.contains('reward_redemptions')) {
                const rrStore = db.createObjectStore('reward_redemptions', { keyPath: 'id' });
                rrStore.createIndex('family_id', 'family_id', { unique: false });
                rrStore.createIndex('member_id', 'member_id', { unique: false });
                rrStore.createIndex('status', 'status', { unique: false });
                rrStore.createIndex('last_modified', 'last_modified', { unique: false });
                rrStore.createIndex('is_deleted', 'is_deleted', { unique: false });
            }
            
            // 7. Sync Queue Object Store (Local Only)
            if (!db.objectStoreNames.contains('sync_queue')) {
                const syncQueueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
                syncQueueStore.createIndex('status', 'status', { unique: false });
                syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
                syncQueueStore.createIndex('table_name', 'table_name', { unique: false });
            }
            
            // 8. Sync Metadata Object Store (Local Only)
            if (!db.objectStoreNames.contains('sync_metadata')) {
                db.createObjectStore('sync_metadata', { keyPath: 'key' });
            }
        };
    });
}
```

### Example Data Structure (JavaScript)

```javascript
// Family Object
const family = {
    id: 'uuid-string',
    name: 'The Smith Family',
    created_by: 'user-uuid',
    created_at: '2026-02-10T10:00:00.000Z',
    updated_at: '2026-02-10T10:00:00.000Z',
    last_modified: 1707559200000, // Unix timestamp in ms
    is_deleted: false,
    change_id: 'change-uuid',
    sync_version: 1
};

// Member Object
const member = {
    id: 'uuid-string',
    family_id: 'family-uuid',
    user_id: 'user-uuid', // null for children without login
    name: 'John Smith',
    role: 'parent', // 'parent' | 'child' | 'admin'
    avatar: '👨',
    points_balance: 150,
    is_active: true,
    requires_approval: false,
    parent_id: null,
    created_at: '2026-02-10T10:00:00.000Z',
    updated_at: '2026-02-10T10:00:00.000Z',
    last_modified: 1707559200000,
    is_deleted: false,
    change_id: 'change-uuid',
    sync_version: 1
};

// Task Object
const task = {
    id: 'uuid-string',
    family_id: 'family-uuid',
    title: 'Clean your room',
    description: 'Vacuum, dust, and organize',
    points: 20,
    assigned_to: 'member-uuid',
    created_by: 'parent-uuid',
    status: 'pending', // 'pending' | 'in_progress' | 'awaiting_approval' | 'approved' | 'rejected'
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_day: null,
    last_generated_at: null,
    due_date: '2026-02-11T18:00:00.000Z',
    completed_at: null,
    completed_by: null,
    completion_note: null,
    completion_photo_url: null,
    reviewed_at: null,
    reviewed_by: null,
    review_note: null,
    bonus_points: 0,
    bonus_reason: null,
    created_at: '2026-02-10T10:00:00.000Z',
    updated_at: '2026-02-10T10:00:00.000Z',
    last_modified: 1707559200000,
    is_deleted: false,
    change_id: 'change-uuid',
    sync_version: 1
};

// Sync Queue Item (Local Only)
const syncQueueItem = {
    id: 1, // Auto-increment
    operation: 'create', // 'create' | 'update' | 'delete'
    table_name: 'tasks',
    record_id: 'task-uuid',
    data_json: JSON.stringify(task),
    timestamp: 1707559200000,
    status: 'pending', // 'pending' | 'completed' | 'failed'
    retry_count: 0,
    error_message: null
};
```

---

## Data Synchronization Design

### Sync Protocol

#### 1. Client-to-Server Sync (Upload)

**Request Payload**:
```json
{
  "client_type": "spa",
  "client_version": "1.0.0",
  "last_sync_timestamp": 1707559200000,
  "changes": [
    {
      "table_name": "tasks",
      "operation": "create",
      "record_id": "uuid-123",
      "data": {
        "id": "uuid-123",
        "title": "New Task",
        "last_modified": 1707559300000,
        "change_id": "change-uuid-456",
        ...
      }
    },
    {
      "table_name": "tasks",
      "operation": "update",
      "record_id": "uuid-789",
      "data": {
        "id": "uuid-789",
        "status": "completed",
        "last_modified": 1707559400000,
        "change_id": "change-uuid-def",
        ...
      }
    }
  ]
}
```

**Response Payload**:
```json
{
  "sync_timestamp": 1707559500000,
  "accepted_changes": [
    {
      "record_id": "uuid-123",
      "status": "accepted"
    }
  ],
  "rejected_changes": [
    {
      "record_id": "uuid-789",
      "status": "conflict",
      "reason": "server version newer",
      "server_data": {
        "id": "uuid-789",
        "status": "approved",
        "last_modified": 1707559450000,
        ...
      }
    }
  ],
  "server_changes": [
    {
      "table_name": "rewards",
      "operation": "create",
      "record_id": "uuid-abc",
      "data": { ... }
    }
  ]
}
```

#### 2. Conflict Resolution Algorithm

```javascript
function resolveConflict(clientData, serverData) {
    // Last-Write-Wins strategy
    if (clientData.last_modified > serverData.last_modified) {
        // Client wins
        return {
            winner: 'client',
            data: clientData,
            action: 'update_server'
        };
    } else {
        // Server wins
        return {
            winner: 'server',
            data: serverData,
            action: 'update_client'
        };
    }
}
```

#### 3. Sync Queue Processing

**Client-side pseudocode**:
```javascript
async function processSyncQueue() {
    // 1. Get all pending changes
    const pendingChanges = await db.syncQueue
        .where('status').equals('pending')
        .toArray();
    
    if (pendingChanges.length === 0) return;
    
    // 2. Batch changes (max 100 per sync)
    const batch = pendingChanges.slice(0, 100);
    
    // 3. Prepare payload
    const payload = {
        client_type: 'spa',
        client_version: '1.0.0',
        last_sync_timestamp: await getLastSyncTimestamp(),
        changes: batch.map(item => ({
            table_name: item.table_name,
            operation: item.operation,
            record_id: item.record_id,
            data: JSON.parse(item.data_json)
        }))
    };
    
    // 4. Send to server
    const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    // 5. Process accepted changes
    for (const accepted of result.accepted_changes) {
        await db.syncQueue
            .where('record_id').equals(accepted.record_id)
            .modify({ status: 'completed' });
    }
    
    // 6. Process rejected changes (conflicts)
    for (const rejected of result.rejected_changes) {
        if (rejected.status === 'conflict') {
            // Update local data with server version
            await updateLocalRecord(
                rejected.table_name,
                rejected.record_id,
                rejected.server_data
            );
            
            // Mark sync queue item as completed
            await db.syncQueue
                .where('record_id').equals(rejected.record_id)
                .modify({ status: 'completed' });
        }
    }
    
    // 7. Apply server changes
    for (const serverChange of result.server_changes) {
        await applyServerChange(serverChange);
    }
    
    // 8. Update last sync timestamp
    await setLastSyncTimestamp(result.sync_timestamp);
}
```

---

## Migration Scripts

### PostgreSQL Migration (Supabase)

```sql
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run all table creation scripts from above
-- (families, members, tasks, point_transactions, rewards, reward_redemptions, sync_logs)

-- Enable Row Level Security on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (see Security section below)

-- Create triggers for updated_at and last_modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_modified = extract(epoch from NOW())::BIGINT * 1000;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### C# Entity Framework Migration (WPF)

```csharp
// Run in Package Manager Console:
// Add-Migration InitialCreate
// Update-Database

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "families",
            columns: table => new
            {
                id = table.Column<string>(type: "TEXT", nullable: false),
                name = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                created_by = table.Column<string>(type: "TEXT", nullable: false),
                created_at = table.Column<string>(type: "TEXT", nullable: false),
                updated_at = table.Column<string>(type: "TEXT", nullable: false),
                last_modified = table.Column<long>(type: "INTEGER", nullable: false),
                is_deleted = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                change_id = table.Column<string>(type: "TEXT", nullable: false),
                sync_version = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 1)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_families", x => x.id);
            });
        
        // ... (Continue with other tables)
    }
    
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "families");
        // ... (Drop other tables)
    }
}
```

---

## Indexes & Optimization

### PostgreSQL Performance Indexes

```sql
-- Composite indexes for common queries

-- Get tasks for a family member
CREATE INDEX idx_tasks_family_assigned ON tasks(family_id, assigned_to, is_deleted);

-- Get pending tasks
CREATE INDEX idx_tasks_status_family ON tasks(status, family_id, is_deleted);

-- Get recent point transactions
CREATE INDEX idx_pt_member_date ON point_transactions(member_id, created_at DESC, is_deleted);

-- Sync queries (get changes since timestamp)
CREATE INDEX idx_families_sync ON families(last_modified, is_deleted);
CREATE INDEX idx_members_sync ON members(last_modified, is_deleted);
CREATE INDEX idx_tasks_sync ON tasks(last_modified, is_deleted);
CREATE INDEX idx_rewards_sync ON rewards(last_modified, is_deleted);
```

### Query Optimization Tips

1. **Always include is_deleted filter**:
```sql
SELECT * FROM tasks 
WHERE family_id = $1 AND is_deleted = FALSE;
```

2. **Use last_modified for sync**:
```sql
SELECT * FROM tasks 
WHERE last_modified > $1 AND is_deleted = FALSE;
```

3. **Batch inserts for performance**:
```sql
INSERT INTO tasks (id, family_id, title, ...) 
VALUES 
    ('uuid1', 'family1', 'Task 1', ...),
    ('uuid2', 'family1', 'Task 2', ...),
    ('uuid3', 'family1', 'Task 3', ...);
```

---

## Security & RLS Policies

### Supabase Row Level Security (RLS)

```sql
-- FAMILIES: Users can only see families they created or are members of
CREATE POLICY "Users can view their families"
ON families FOR SELECT
USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = families.id
        AND members.user_id = auth.uid()
        AND members.is_deleted = FALSE
    )
);

CREATE POLICY "Users can insert families"
ON families FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Family owners can update families"
ON families FOR UPDATE
USING (auth.uid() = created_by);

-- MEMBERS: Users can see members in their families
CREATE POLICY "Users can view family members"
ON members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM families
        WHERE families.id = members.family_id
        AND (
            families.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM members m2
                WHERE m2.family_id = families.id
                AND m2.user_id = auth.uid()
                AND m2.is_deleted = FALSE
            )
        )
    )
);

CREATE POLICY "Parents can insert members"
ON members FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM members m
        WHERE m.family_id = members.family_id
        AND m.user_id = auth.uid()
        AND m.role IN ('parent', 'admin')
        AND m.is_deleted = FALSE
    )
);

-- TASKS: Users can see tasks in their families
CREATE POLICY "Users can view family tasks"
ON tasks FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = tasks.family_id
        AND members.user_id = auth.uid()
        AND members.is_deleted = FALSE
    )
);

CREATE POLICY "Family members can create tasks"
ON tasks FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.id = tasks.created_by
        AND members.user_id = auth.uid()
        AND members.is_deleted = FALSE
    )
);

CREATE POLICY "Users can update their tasks"
ON tasks FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = tasks.family_id
        AND members.user_id = auth.uid()
        AND members.is_deleted = FALSE
    )
);

-- Similar policies for point_transactions, rewards, reward_redemptions
```

### Security Best Practices

1. **JWT Token Validation**: All API requests must include valid JWT token
2. **Input Validation**: Validate all user inputs on server-side
3. **SQL Injection Prevention**: Use parameterized queries only
4. **Rate Limiting**: Implement rate limiting (100 req/min per IP)
5. **Data Encryption**: HTTPS for all traffic, encrypt sensitive data at rest
6. **Audit Logging**: Log all data modifications in sync_logs table

---

## Data Retention & Cleanup

### Soft Delete Strategy

All records use `is_deleted` flag instead of physical deletion:
- Allows sync to propagate deletions
- Maintains audit trail
- Can implement "undo delete" feature

### Cleanup Policy

```sql
-- Delete records older than 90 days that are marked as deleted
DELETE FROM tasks 
WHERE is_deleted = TRUE 
AND updated_at < NOW() - INTERVAL '90 days';

-- Similar for other tables
```

### Storage Estimates

| Users | Database Size | IndexedDB per User | SQLite per Family |
|-------|---------------|--------------------|--------------------|
| 100 | ~10 MB | ~1 MB | ~2 MB |
| 1,000 | ~100 MB | ~1 MB | ~2 MB |
| 10,000 | ~1 GB | ~1 MB | ~2 MB |
| 100,000 | ~10 GB | ~1 MB | ~2 MB |

**Note**: Local storage remains constant per user regardless of total users.

---

## Appendix: Sample Queries

### Common Query Patterns

```sql
-- 1. Get all active tasks for a family member
SELECT * FROM tasks
WHERE assigned_to = $member_id
AND is_deleted = FALSE
AND (status = 'pending' OR status = 'in_progress')
ORDER BY due_date ASC NULLS LAST;

-- 2. Get point balance for a member
SELECT SUM(amount) as balance
FROM point_transactions
WHERE member_id = $member_id
AND is_deleted = FALSE;

-- 3. Get tasks awaiting parent approval
SELECT t.*, m.name as assigned_to_name
FROM tasks t
JOIN members m ON t.assigned_to = m.id
WHERE t.family_id = $family_id
AND t.status = 'awaiting_approval'
AND t.is_deleted = FALSE
ORDER BY t.completed_at DESC;

-- 4. Get changes since last sync
SELECT * FROM tasks
WHERE family_id = $family_id
AND last_modified > $last_sync_timestamp;

-- 5. Get point transaction history
SELECT pt.*, m.name as member_name
FROM point_transactions pt
JOIN members m ON pt.member_id = m.id
WHERE pt.family_id = $family_id
AND pt.is_deleted = FALSE
ORDER BY pt.created_at DESC
LIMIT 100;
```

---

**END OF DATABASE SCHEMA DESIGN DOCUMENT**
