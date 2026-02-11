-- FamilyTogether Database Schema - Initial Migration
-- Run this in Supabase SQL Editor after creating your project
-- Version: 1.0
-- Date: 2026-02-11

-- ======================================
-- 1. ENABLE EXTENSIONS
-- ======================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================================
-- 2. CREATE TABLES
-- ======================================

-- Table: families
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

-- Table: members
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

-- Table: tasks
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
    recurrence_day INTEGER CHECK (recurrence_day BETWEEN 0 AND 31),
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

-- Table: point_transactions
CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL
        CHECK (transaction_type IN ('task_completion', 'reward_redemption', 'manual_adjustment', 'bonus')),
    reference_id UUID,
    description TEXT NOT NULL,
    created_by UUID REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified BIGINT NOT NULL DEFAULT extract(epoch from NOW())::BIGINT * 1000,
    is_deleted BOOLEAN DEFAULT FALSE,

    -- Sync metadata
    change_id UUID DEFAULT gen_random_uuid(),
    sync_version INTEGER DEFAULT 1
);

-- Table: rewards
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL CHECK (cost > 0),
    icon VARCHAR(10),
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

-- Table: reward_redemptions
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

-- Table: sync_logs
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

-- ======================================
-- 3. CREATE INDEXES
-- ======================================

-- Families indexes
CREATE INDEX idx_families_created_by ON families(created_by);
CREATE INDEX idx_families_last_modified ON families(last_modified);
CREATE INDEX idx_families_is_deleted ON families(is_deleted);

-- Members indexes
CREATE INDEX idx_members_family_id ON members(family_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_last_modified ON members(last_modified);
CREATE INDEX idx_members_is_deleted ON members(is_deleted);
CREATE INDEX idx_members_role ON members(role);

-- Tasks indexes
CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_last_modified ON tasks(last_modified);
CREATE INDEX idx_tasks_is_deleted ON tasks(is_deleted);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);

-- Point transactions indexes
CREATE INDEX idx_point_transactions_family_id ON point_transactions(family_id);
CREATE INDEX idx_point_transactions_member_id ON point_transactions(member_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_last_modified ON point_transactions(last_modified);
CREATE INDEX idx_point_transactions_is_deleted ON point_transactions(is_deleted);

-- Rewards indexes
CREATE INDEX idx_rewards_family_id ON rewards(family_id);
CREATE INDEX idx_rewards_is_active ON rewards(is_active);
CREATE INDEX idx_rewards_last_modified ON rewards(last_modified);
CREATE INDEX idx_rewards_is_deleted ON rewards(is_deleted);

-- Reward redemptions indexes
CREATE INDEX idx_reward_redemptions_family_id ON reward_redemptions(family_id);
CREATE INDEX idx_reward_redemptions_member_id ON reward_redemptions(member_id);
CREATE INDEX idx_reward_redemptions_status ON reward_redemptions(status);
CREATE INDEX idx_reward_redemptions_last_modified ON reward_redemptions(last_modified);
CREATE INDEX idx_reward_redemptions_is_deleted ON reward_redemptions(is_deleted);

-- Sync logs indexes
CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_family_id ON sync_logs(family_id);
CREATE INDEX idx_sync_logs_sync_timestamp ON sync_logs(sync_timestamp DESC);

-- Composite indexes for common queries
CREATE INDEX idx_tasks_family_assigned ON tasks(family_id, assigned_to, is_deleted);
CREATE INDEX idx_tasks_status_family ON tasks(status, family_id, is_deleted);
CREATE INDEX idx_pt_member_date ON point_transactions(member_id, created_at DESC, is_deleted);

-- Sync optimization indexes
CREATE INDEX idx_families_sync ON families(last_modified, is_deleted);
CREATE INDEX idx_members_sync ON members(last_modified, is_deleted);
CREATE INDEX idx_tasks_sync ON tasks(last_modified, is_deleted);
CREATE INDEX idx_rewards_sync ON rewards(last_modified, is_deleted);

-- ======================================
-- 4. CREATE TRIGGERS
-- ======================================

-- Function to automatically update updated_at and last_modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_modified = extract(epoch from NOW())::BIGINT * 1000;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ======================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Note: sync_logs table does NOT have RLS enabled (admin only)

-- ======================================
-- MIGRATION COMPLETE
-- ======================================
-- Next step: Run 002_rls_policies.sql to configure security policies
