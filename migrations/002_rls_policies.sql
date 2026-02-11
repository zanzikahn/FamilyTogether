-- FamilyTogether Row Level Security Policies
-- Run this AFTER 001_initial_schema.sql
-- Version: 1.0
-- Date: 2026-02-11

-- ======================================
-- FAMILIES POLICIES
-- ======================================

-- Users can view families they created or are members of
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

-- Users can insert families (automatically becomes creator)
CREATE POLICY "Users can insert families"
ON families FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Family owners can update their families
CREATE POLICY "Family owners can update families"
ON families FOR UPDATE
USING (auth.uid() = created_by);

-- Family owners can delete their families
CREATE POLICY "Family owners can delete families"
ON families FOR DELETE
USING (auth.uid() = created_by);

-- ======================================
-- MEMBERS POLICIES
-- ======================================

-- Users can view members in their families
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

-- Parents/admins can insert members to their family
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

-- Parents/admins can update members in their family
CREATE POLICY "Parents can update members"
ON members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM members m
        WHERE m.family_id = members.family_id
        AND m.user_id = auth.uid()
        AND m.role IN ('parent', 'admin')
        AND m.is_deleted = FALSE
    )
);

-- Parents/admins can delete members from their family
CREATE POLICY "Parents can delete members"
ON members FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM members m
        WHERE m.family_id = members.family_id
        AND m.user_id = auth.uid()
        AND m.role IN ('parent', 'admin')
        AND m.is_deleted = FALSE
    )
);

-- ======================================
-- TASKS POLICIES
-- ======================================

-- Users can view tasks in their families
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

-- Family members can create tasks (must be a valid member)
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

-- Users can update tasks in their family
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

-- Users can delete tasks in their family (parents only or task creator)
CREATE POLICY "Users can delete tasks"
ON tasks FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = tasks.family_id
        AND members.user_id = auth.uid()
        AND (
            members.role IN ('parent', 'admin') OR
            members.id = tasks.created_by
        )
        AND members.is_deleted = FALSE
    )
);

-- ======================================
-- POINT TRANSACTIONS POLICIES
-- ======================================

-- Users can view point transactions in their families
CREATE POLICY "Users can view family point transactions"
ON point_transactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = point_transactions.family_id
        AND members.user_id = auth.uid()
        AND members.is_deleted = FALSE
    )
);

-- System/parents can create point transactions
CREATE POLICY "System can create point transactions"
ON point_transactions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = point_transactions.family_id
        AND members.user_id = auth.uid()
        AND members.is_deleted = FALSE
    )
);

-- Only admins can update point transactions (rare)
CREATE POLICY "Admins can update point transactions"
ON point_transactions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = point_transactions.family_id
        AND members.user_id = auth.uid()
        AND members.role = 'admin'
        AND members.is_deleted = FALSE
    )
);

-- ======================================
-- REWARDS POLICIES
-- ======================================

-- Users can view rewards in their families
CREATE POLICY "Users can view family rewards"
ON rewards FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = rewards.family_id
        AND members.user_id = auth.uid()
        AND members.is_deleted = FALSE
    )
);

-- Parents/admins can create rewards
CREATE POLICY "Parents can create rewards"
ON rewards FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.id = rewards.created_by
        AND members.user_id = auth.uid()
        AND members.role IN ('parent', 'admin')
        AND members.is_deleted = FALSE
    )
);

-- Parents/admins can update rewards
CREATE POLICY "Parents can update rewards"
ON rewards FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = rewards.family_id
        AND members.user_id = auth.uid()
        AND members.role IN ('parent', 'admin')
        AND members.is_deleted = FALSE
    )
);

-- Parents/admins can delete rewards
CREATE POLICY "Parents can delete rewards"
ON rewards FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = rewards.family_id
        AND members.user_id = auth.uid()
        AND members.role IN ('parent', 'admin')
        AND members.is_deleted = FALSE
    )
);

-- ======================================
-- REWARD REDEMPTIONS POLICIES
-- ======================================

-- Users can view reward redemptions in their families
CREATE POLICY "Users can view family reward redemptions"
ON reward_redemptions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = reward_redemptions.family_id
        AND members.user_id = auth.uid()
        AND members.is_deleted = FALSE
    )
);

-- Family members can create reward redemptions
CREATE POLICY "Members can create reward redemptions"
ON reward_redemptions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.id = reward_redemptions.member_id
        AND members.user_id = auth.uid()
        AND members.is_deleted = FALSE
    )
);

-- Parents/admins can update reward redemptions (for approval)
CREATE POLICY "Parents can update reward redemptions"
ON reward_redemptions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = reward_redemptions.family_id
        AND members.user_id = auth.uid()
        AND members.role IN ('parent', 'admin')
        AND members.is_deleted = FALSE
    )
);

-- ======================================
-- RLS POLICIES COMPLETE
-- ======================================
-- All tables now have Row Level Security enabled
-- Users can only access data within their own families
