/**
 * Migration Service for FamilyTogether SPA
 * Handles migration from localStorage to IndexedDB
 * Provides backward compatibility layer
 */

import { initDB, addRecord, updateRecord, getAllRecords, queryByIndex, queueSync, generateUUID } from './db.js';

const STORAGE_KEY = 'familyCleaningTracker';
const MIGRATION_FLAG_KEY = 'familyTogether_migrationCompleted';
const MIGRATION_VERSION = '1.0';

/**
 * Check if migration has been completed
 * @returns {boolean}
 */
export function isMigrationCompleted() {
    const flag = localStorage.getItem(MIGRATION_FLAG_KEY);
    return flag === MIGRATION_VERSION;
}

/**
 * Mark migration as completed
 */
function markMigrationCompleted() {
    localStorage.setItem(MIGRATION_FLAG_KEY, MIGRATION_VERSION);
    console.log('✅ Migration: Marked as completed');
}

/**
 * Migrate localStorage data to IndexedDB
 * @returns {Promise<Object>} Migration result
 */
export async function migrateLocalStorageToIndexedDB() {
    try {
        console.log('🔄 Migration: Starting localStorage → IndexedDB migration...');

        // Check if already migrated
        if (isMigrationCompleted()) {
            console.log('ℹ️ Migration: Already completed, skipping');
            return { success: true, skipped: true };
        }

        // Initialize IndexedDB
        await initDB();

        // Get localStorage data
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            console.log('ℹ️ Migration: No localStorage data found, skipping (will retry later if data appears)');
            // DON'T mark as completed - allow future migration if data appears
            return { success: true, noData: true, skipped: false };
        }

        const oldData = JSON.parse(stored);
        console.log('📦 Migration: Found localStorage data', {
            familyMembers: oldData.familyMembers?.length || 0,
            tasks: oldData.tasks?.length || 0,
            rewards: oldData.rewards?.length || 0
        });

        let migrationStats = {
            families: 0,
            members: 0,
            tasks: 0,
            rewards: 0,
            errors: []
        };

        // Create a default family if there's data but no family
        let familyId = null;
        if (oldData.familyMembers && oldData.familyMembers.length > 0) {
            try {
                const family = {
                    id: generateUUID(),
                    name: oldData.settings?.familyName || 'My Family',
                    created_by: null, // Will be set when user logs in
                    created_at: Date.now()
                };

                await addRecord('families', family);
                familyId = family.id;
                migrationStats.families++;
                console.log('✅ Migration: Created family', family.id);
            } catch (error) {
                console.error('❌ Migration: Failed to create family', error);
                migrationStats.errors.push({ entity: 'family', error: error.message });
            }
        }

        // Migrate family members
        if (oldData.familyMembers && familyId) {
            for (const oldMember of oldData.familyMembers) {
                try {
                    const member = {
                        id: oldMember.id || generateUUID(),
                        family_id: familyId,
                        user_id: null, // Not linked to auth yet
                        name: oldMember.name,
                        role: oldMember.isParent ? 'parent' : 'child',
                        total_points: oldMember.points || 0,
                        avatar_url: null,
                        created_at: Date.now()
                    };

                    await addRecord('members', member);
                    migrationStats.members++;
                    console.log(`✅ Migration: Migrated member ${member.name}`);
                } catch (error) {
                    console.error(`❌ Migration: Failed to migrate member ${oldMember.name}`, error);
                    migrationStats.errors.push({ entity: 'member', name: oldMember.name, error: error.message });
                }
            }
        }

        // Migrate tasks
        if (oldData.tasks && familyId) {
            for (const oldTask of oldData.tasks) {
                try {
                    const task = {
                        id: oldTask.id || generateUUID(),
                        family_id: familyId,
                        title: oldTask.name,
                        description: oldTask.description || null,
                        points_value: oldTask.points || 0,
                        status: oldTask.completed ? 'completed' : 'pending',
                        assigned_to: oldTask.assignedTo || null,
                        created_by: null,
                        due_date: oldTask.dueDate ? new Date(oldTask.dueDate).getTime() : null,
                        completed_at: oldTask.completedDate ? new Date(oldTask.completedDate).getTime() : null,
                        approved_at: oldTask.approvedDate ? new Date(oldTask.approvedDate).getTime() : null,
                        approved_by: oldTask.approvedBy || null,
                        created_at: oldTask.createdDate ? new Date(oldTask.createdDate).getTime() : Date.now()
                    };

                    await addRecord('tasks', task);
                    migrationStats.tasks++;
                    console.log(`✅ Migration: Migrated task ${task.title}`);
                } catch (error) {
                    console.error(`❌ Migration: Failed to migrate task ${oldTask.name}`, error);
                    migrationStats.errors.push({ entity: 'task', name: oldTask.name, error: error.message });
                }
            }
        }

        // Migrate rewards
        if (oldData.rewards && familyId) {
            for (const oldReward of oldData.rewards) {
                try {
                    const reward = {
                        id: oldReward.id || generateUUID(),
                        family_id: familyId,
                        title: oldReward.name,
                        description: oldReward.description || null,
                        points_cost: oldReward.cost || 0,
                        is_active: true,
                        icon: oldReward.icon || '🎁',
                        created_at: Date.now()
                    };

                    await addRecord('rewards', reward);
                    migrationStats.rewards++;
                    console.log(`✅ Migration: Migrated reward ${reward.title}`);
                } catch (error) {
                    console.error(`❌ Migration: Failed to migrate reward ${oldReward.name}`, error);
                    migrationStats.errors.push({ entity: 'reward', name: oldReward.name, error: error.message });
                }
            }
        }

        // Mark migration as completed
        markMigrationCompleted();

        console.log('✅ Migration: Completed successfully', migrationStats);
        return {
            success: true,
            stats: migrationStats,
            familyId: familyId
        };

    } catch (error) {
        console.error('❌ Migration: Failed', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Adapter: Get all family members (backward compatible with old code)
 * @returns {Promise<Array>}
 */
export async function getFamilyMembers() {
    try {
        const members = await getAllRecords('members');

        // Transform to old format for backward compatibility
        return members.map(m => ({
            id: m.id,
            name: m.name,
            isParent: m.role === 'parent',
            points: m.total_points || 0,
            // Add any other fields the old code expects
        }));
    } catch (error) {
        console.error('❌ Adapter: Failed to get family members', error);
        return [];
    }
}

/**
 * Adapter: Get all tasks (backward compatible with old code)
 * @returns {Promise<Array>}
 */
export async function getTasks() {
    try {
        const tasks = await getAllRecords('tasks');

        // Transform to old format
        return tasks.map(t => ({
            id: t.id,
            name: t.title,
            description: t.description,
            points: t.points_value,
            completed: t.status === 'completed',
            assignedTo: t.assigned_to,
            dueDate: t.due_date ? new Date(t.due_date).toISOString() : null,
            completedDate: t.completed_at ? new Date(t.completed_at).toISOString() : null,
            approvedDate: t.approved_at ? new Date(t.approved_at).toISOString() : null,
            approvedBy: t.approved_by,
            createdDate: t.created_at ? new Date(t.created_at).toISOString() : null
        }));
    } catch (error) {
        console.error('❌ Adapter: Failed to get tasks', error);
        return [];
    }
}

/**
 * Adapter: Get all rewards (backward compatible with old code)
 * @returns {Promise<Array>}
 */
export async function getRewards() {
    try {
        const rewards = await getAllRecords('rewards');

        // Transform to old format
        return rewards.map(r => ({
            id: r.id,
            name: r.title,
            description: r.description,
            cost: r.points_cost,
            icon: r.icon || '🎁'
        }));
    } catch (error) {
        console.error('❌ Adapter: Failed to get rewards', error);
        return [];
    }
}

/**
 * Adapter: Save family member (backward compatible with old code)
 * @param {Object} member - Member data in old format
 * @returns {Promise<Object>}
 */
export async function saveFamilyMember(member) {
    try {
        // Get the current family (assume first family for now)
        const families = await getAllRecords('families');
        const familyId = families[0]?.id;

        if (!familyId) {
            throw new Error('No family found. Please create a family first.');
        }

        const memberData = {
            id: member.id || generateUUID(),
            family_id: familyId,
            user_id: null,
            name: member.name,
            role: member.isParent ? 'parent' : 'child',
            total_points: member.points || 0,
            avatar_url: null
        };

        let result;
        if (member.id) {
            // Update existing
            result = await updateRecord('members', memberData);
            await queueSync('update', 'members', memberData.id, memberData);
        } else {
            // Create new
            result = await addRecord('members', memberData);
            await queueSync('create', 'members', result.id, result);
        }

        return result;
    } catch (error) {
        console.error('❌ Adapter: Failed to save family member', error);
        throw error;
    }
}

/**
 * Adapter: Save task (backward compatible with old code)
 * @param {Object} task - Task data in old format
 * @returns {Promise<Object>}
 */
export async function saveTask(task) {
    try {
        const families = await getAllRecords('families');
        const familyId = families[0]?.id;

        if (!familyId) {
            throw new Error('No family found. Please create a family first.');
        }

        const taskData = {
            id: task.id || generateUUID(),
            family_id: familyId,
            title: task.name,
            description: task.description || null,
            points_value: task.points || 0,
            status: task.completed ? 'completed' : 'pending',
            assigned_to: task.assignedTo || null,
            created_by: null,
            due_date: task.dueDate ? new Date(task.dueDate).getTime() : null,
            completed_at: task.completedDate ? new Date(task.completedDate).getTime() : null,
            approved_at: task.approvedDate ? new Date(task.approvedDate).getTime() : null,
            approved_by: task.approvedBy || null
        };

        let result;
        if (task.id) {
            result = await updateRecord('tasks', taskData);
            await queueSync('update', 'tasks', taskData.id, taskData);
        } else {
            result = await addRecord('tasks', taskData);
            await queueSync('create', 'tasks', result.id, result);
        }

        return result;
    } catch (error) {
        console.error('❌ Adapter: Failed to save task', error);
        throw error;
    }
}

/**
 * Adapter: Save reward (backward compatible with old code)
 * @param {Object} reward - Reward data in old format
 * @returns {Promise<Object>}
 */
export async function saveReward(reward) {
    try {
        const families = await getAllRecords('families');
        const familyId = families[0]?.id;

        if (!familyId) {
            throw new Error('No family found. Please create a family first.');
        }

        const rewardData = {
            id: reward.id || generateUUID(),
            family_id: familyId,
            title: reward.name,
            description: reward.description || null,
            points_cost: reward.cost || 0,
            is_active: true,
            icon: reward.icon || '🎁'
        };

        let result;
        if (reward.id) {
            result = await updateRecord('rewards', rewardData);
            await queueSync('update', 'rewards', rewardData.id, rewardData);
        } else {
            result = await addRecord('rewards', rewardData);
            await queueSync('create', 'rewards', result.id, result);
        }

        return result;
    } catch (error) {
        console.error('❌ Adapter: Failed to save reward', error);
        throw error;
    }
}

/**
 * Get current family ID (helper function)
 * @returns {Promise<string|null>}
 */
export async function getCurrentFamilyId() {
    const families = await getAllRecords('families');
    return families[0]?.id || null;
}

/**
 * Initialize migration on app startup
 * @returns {Promise<Object>}
 */
export async function initMigration() {
    console.log('🚀 Migration: Initializing...');

    try {
        const result = await migrateLocalStorageToIndexedDB();

        if (result.success) {
            if (result.skipped) {
                console.log('ℹ️ Migration: Already completed');
            } else if (result.noData) {
                console.log('ℹ️ Migration: No data to migrate');
            } else {
                console.log('✅ Migration: Successfully migrated data', result.stats);
            }
        } else {
            console.error('❌ Migration: Failed', result.error);
        }

        return result;
    } catch (error) {
        console.error('❌ Migration: Initialization failed', error);
        return { success: false, error: error.message };
    }
}
