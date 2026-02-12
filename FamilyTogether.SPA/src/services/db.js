/**
 * IndexedDB Service for FamilyTogether SPA
 * Local-First Architecture: All application data stored in IndexedDB
 *
 * Object Stores:
 * - families: Family data
 * - members: Family member profiles
 * - tasks: Task records with sync metadata
 * - point_transactions: Point transaction history
 * - rewards: Available rewards
 * - reward_redemptions: Redemption history
 * - sync_queue: Pending changes waiting to sync
 *
 * Sync Metadata (on all records):
 * - last_modified: Unix timestamp (milliseconds)
 * - change_id: UUID for deduplication
 * - sync_version: Incremented on each change
 * - is_deleted: Soft delete flag
 */

const DB_NAME = 'FamilyTogetherDB';
const DB_VERSION = 1;

let dbInstance = null;

/**
 * Initialize IndexedDB and create object stores
 * @returns {Promise<IDBDatabase>}
 */
export async function initDB() {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('❌ IndexedDB: Failed to open database', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            console.log('✅ IndexedDB: Database initialized successfully');
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            console.log('🔄 IndexedDB: Upgrading database schema...');

            // Families Object Store
            if (!db.objectStoreNames.contains('families')) {
                const familiesStore = db.createObjectStore('families', { keyPath: 'id' });
                familiesStore.createIndex('created_at', 'created_at', { unique: false });
                familiesStore.createIndex('last_modified', 'last_modified', { unique: false });
                console.log('  ✅ Created: families');
            }

            // Members Object Store
            if (!db.objectStoreNames.contains('members')) {
                const membersStore = db.createObjectStore('members', { keyPath: 'id' });
                membersStore.createIndex('family_id', 'family_id', { unique: false });
                membersStore.createIndex('user_id', 'user_id', { unique: false });
                membersStore.createIndex('role', 'role', { unique: false });
                membersStore.createIndex('last_modified', 'last_modified', { unique: false });
                console.log('  ✅ Created: members');
            }

            // Tasks Object Store
            if (!db.objectStoreNames.contains('tasks')) {
                const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
                tasksStore.createIndex('family_id', 'family_id', { unique: false });
                tasksStore.createIndex('assigned_to', 'assigned_to', { unique: false });
                tasksStore.createIndex('created_by', 'created_by', { unique: false });
                tasksStore.createIndex('status', 'status', { unique: false });
                tasksStore.createIndex('due_date', 'due_date', { unique: false });
                tasksStore.createIndex('last_modified', 'last_modified', { unique: false });
                tasksStore.createIndex('is_deleted', 'is_deleted', { unique: false });
                console.log('  ✅ Created: tasks');
            }

            // Point Transactions Object Store
            if (!db.objectStoreNames.contains('point_transactions')) {
                const pointsStore = db.createObjectStore('point_transactions', { keyPath: 'id' });
                pointsStore.createIndex('member_id', 'member_id', { unique: false });
                pointsStore.createIndex('task_id', 'task_id', { unique: false });
                pointsStore.createIndex('transaction_type', 'transaction_type', { unique: false });
                pointsStore.createIndex('created_at', 'created_at', { unique: false });
                pointsStore.createIndex('last_modified', 'last_modified', { unique: false });
                console.log('  ✅ Created: point_transactions');
            }

            // Rewards Object Store
            if (!db.objectStoreNames.contains('rewards')) {
                const rewardsStore = db.createObjectStore('rewards', { keyPath: 'id' });
                rewardsStore.createIndex('family_id', 'family_id', { unique: false });
                rewardsStore.createIndex('points_cost', 'points_cost', { unique: false });
                rewardsStore.createIndex('is_active', 'is_active', { unique: false });
                rewardsStore.createIndex('last_modified', 'last_modified', { unique: false });
                rewardsStore.createIndex('is_deleted', 'is_deleted', { unique: false });
                console.log('  ✅ Created: rewards');
            }

            // Reward Redemptions Object Store
            if (!db.objectStoreNames.contains('reward_redemptions')) {
                const redemptionsStore = db.createObjectStore('reward_redemptions', { keyPath: 'id' });
                redemptionsStore.createIndex('member_id', 'member_id', { unique: false });
                redemptionsStore.createIndex('reward_id', 'reward_id', { unique: false });
                redemptionsStore.createIndex('status', 'status', { unique: false });
                redemptionsStore.createIndex('redeemed_at', 'redeemed_at', { unique: false });
                redemptionsStore.createIndex('last_modified', 'last_modified', { unique: false });
                console.log('  ✅ Created: reward_redemptions');
            }

            // Sync Queue Object Store
            if (!db.objectStoreNames.contains('sync_queue')) {
                const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
                syncStore.createIndex('table_name', 'table_name', { unique: false });
                syncStore.createIndex('operation', 'operation', { unique: false });
                syncStore.createIndex('record_id', 'record_id', { unique: false });
                syncStore.createIndex('status', 'status', { unique: false });
                syncStore.createIndex('created_at', 'created_at', { unique: false });
                console.log('  ✅ Created: sync_queue');
            }

            console.log('✅ IndexedDB: Schema upgrade complete');
        };
    });
}

/**
 * Generate UUID v4
 * @returns {string}
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Add sync metadata to a record
 * @param {Object} record - Record to augment
 * @returns {Object} Record with sync metadata
 */
export function addSyncMetadata(record) {
    const now = Date.now();
    return {
        ...record,
        id: record.id || generateUUID(),
        last_modified: now,
        change_id: generateUUID(),
        sync_version: (record.sync_version || 0) + 1,
        is_deleted: record.is_deleted || false,
        created_at: record.created_at || now
    };
}

/**
 * Get a single record by ID
 * @param {string} storeName - Object store name
 * @param {string} id - Record ID
 * @returns {Promise<Object|null>}
 */
export async function getRecord(storeName, id) {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => {
            const record = request.result;
            // Filter out soft-deleted records
            resolve(record && !record.is_deleted ? record : null);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all records from a store
 * @param {string} storeName - Object store name
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
export async function getAllRecords(storeName, options = {}) {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            let records = request.result || [];

            // Filter out soft-deleted records
            records = records.filter(r => !r.is_deleted);

            // Apply index filter if specified
            if (options.indexName && options.indexValue !== undefined) {
                records = records.filter(r => r[options.indexName] === options.indexValue);
            }

            resolve(records);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Query records by index
 * @param {string} storeName - Object store name
 * @param {string} indexName - Index name
 * @param {*} indexValue - Index value to match
 * @returns {Promise<Array>}
 */
export async function queryByIndex(storeName, indexName, indexValue) {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(indexValue);

        request.onsuccess = () => {
            let records = request.result || [];
            // Filter out soft-deleted records
            records = records.filter(r => !r.is_deleted);
            resolve(records);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Add a new record
 * @param {string} storeName - Object store name
 * @param {Object} record - Record to add
 * @returns {Promise<Object>} The added record with sync metadata
 */
export async function addRecord(storeName, record) {
    const db = await initDB();
    const recordWithMetadata = addSyncMetadata(record);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(recordWithMetadata);

        request.onsuccess = () => {
            console.log(`✅ IndexedDB: Added record to ${storeName}`, recordWithMetadata.id);
            resolve(recordWithMetadata);
        };

        request.onerror = () => {
            console.error(`❌ IndexedDB: Failed to add record to ${storeName}`, request.error);
            reject(request.error);
        };
    });
}

/**
 * Update an existing record
 * @param {string} storeName - Object store name
 * @param {Object} record - Record to update (must have id)
 * @returns {Promise<Object>} The updated record
 */
export async function updateRecord(storeName, record) {
    const db = await initDB();
    const recordWithMetadata = addSyncMetadata(record);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(recordWithMetadata);

        request.onsuccess = () => {
            console.log(`✅ IndexedDB: Updated record in ${storeName}`, recordWithMetadata.id);
            resolve(recordWithMetadata);
        };

        request.onerror = () => {
            console.error(`❌ IndexedDB: Failed to update record in ${storeName}`, request.error);
            reject(request.error);
        };
    });
}

/**
 * Soft delete a record (sets is_deleted = true)
 * @param {string} storeName - Object store name
 * @param {string} id - Record ID
 * @returns {Promise<Object>} The deleted record
 */
export async function deleteRecord(storeName, id) {
    const db = await initDB();
    const record = await getRecord(storeName, id);

    if (!record) {
        throw new Error(`Record ${id} not found in ${storeName}`);
    }

    record.is_deleted = true;
    return updateRecord(storeName, record);
}

/**
 * Hard delete a record (permanently removes from database)
 * Use only for cleanup, not for user-facing deletes
 * @param {string} storeName - Object store name
 * @param {string} id - Record ID
 * @returns {Promise<void>}
 */
export async function hardDeleteRecord(storeName, id) {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log(`✅ IndexedDB: Hard deleted record from ${storeName}`, id);
            resolve();
        };

        request.onerror = () => {
            console.error(`❌ IndexedDB: Failed to hard delete record from ${storeName}`, request.error);
            reject(request.error);
        };
    });
}

/**
 * Queue a change for sync
 * @param {string} operation - 'create', 'update', or 'delete'
 * @param {string} tableName - Table name
 * @param {string} recordId - Record ID
 * @param {Object} data - Record data
 * @returns {Promise<void>}
 */
export async function queueSync(operation, tableName, recordId, data) {
    const db = await initDB();

    const syncItem = {
        table_name: tableName,
        operation: operation,
        record_id: recordId,
        data: data,
        status: 'pending',
        created_at: Date.now()
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('sync_queue', 'readwrite');
        const store = transaction.objectStore('sync_queue');
        const request = store.add(syncItem);

        request.onsuccess = () => {
            console.log(`✅ IndexedDB: Queued ${operation} for ${tableName}/${recordId}`);
            resolve();
        };

        request.onerror = () => {
            console.error(`❌ IndexedDB: Failed to queue sync`, request.error);
            reject(request.error);
        };
    });
}

/**
 * Get all pending sync items
 * @returns {Promise<Array>}
 */
export async function getPendingSyncItems() {
    return queryByIndex('sync_queue', 'status', 'pending');
}

/**
 * Mark sync item as completed
 * @param {number} syncItemId - Sync item ID
 * @returns {Promise<void>}
 */
export async function markSyncCompleted(syncItemId) {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('sync_queue', 'readwrite');
        const store = transaction.objectStore('sync_queue');
        const getRequest = store.get(syncItemId);

        getRequest.onsuccess = () => {
            const syncItem = getRequest.result;
            if (!syncItem) {
                reject(new Error(`Sync item ${syncItemId} not found`));
                return;
            }

            syncItem.status = 'completed';
            syncItem.completed_at = Date.now();

            const updateRequest = store.put(syncItem);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * Remove a sync item from queue (after successful sync)
 * @param {number} syncItemId - Sync item ID
 * @returns {Promise<void>}
 */
export async function removeSyncItem(syncItemId) {
    return hardDeleteRecord('sync_queue', syncItemId);
}

/**
 * Clear all data (for testing/reset)
 * @returns {Promise<void>}
 */
export async function clearAllData() {
    const db = await initDB();
    const storeNames = ['families', 'members', 'tasks', 'point_transactions', 'rewards', 'reward_redemptions', 'sync_queue'];

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeNames, 'readwrite');

        storeNames.forEach(storeName => {
            const store = transaction.objectStore(storeName);
            store.clear();
        });

        transaction.oncomplete = () => {
            console.log('✅ IndexedDB: All data cleared');
            resolve();
        };

        transaction.onerror = () => {
            console.error('❌ IndexedDB: Failed to clear data', transaction.error);
            reject(transaction.error);
        };
    });
}

/**
 * Get database statistics
 * @returns {Promise<Object>}
 */
export async function getDBStats() {
    const db = await initDB();
    const storeNames = ['families', 'members', 'tasks', 'point_transactions', 'rewards', 'reward_redemptions', 'sync_queue'];
    const stats = {};

    for (const storeName of storeNames) {
        const records = await getAllRecords(storeName);
        stats[storeName] = records.length;
    }

    const pendingSync = await getPendingSyncItems();
    stats.pending_sync = pendingSync.length;

    return stats;
}

// Auto-initialize on module load
initDB().catch(err => {
    console.error('❌ IndexedDB: Failed to auto-initialize', err);
});
