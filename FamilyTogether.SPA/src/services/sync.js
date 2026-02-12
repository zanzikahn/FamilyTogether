/**
 * SyncManager for FamilyTogether SPA
 * Handles offline-first synchronization with Railway API
 *
 * Local-First Architecture:
 * 1. All changes saved to IndexedDB immediately
 * 2. Changes queued for sync
 * 3. Background sync every 30 seconds when online
 * 4. Sync on page load and when coming online
 * 5. Last-Write-Wins conflict resolution
 *
 * Sync Flow:
 * 1. Get pending changes from sync_queue
 * 2. POST to /api/sync with changes
 * 3. Server processes changes (conflict detection)
 * 4. Server returns: accepted, rejected, and server_changes
 * 5. Apply server changes to local database
 * 6. Remove accepted changes from queue
 * 7. Handle rejected changes (apply server version)
 */

import { syncChanges } from './api.js';
import {
    getPendingSyncItems,
    removeSyncItem,
    updateRecord,
    getAllRecords,
    addRecord
} from './db.js';

// Sync configuration
const SYNC_CONFIG = {
    intervalMs: 30000, // 30 seconds
    maxChangesPerSync: 100, // Limit payload size
    retryDelayMs: 5000 // 5 seconds retry on failure
};

/**
 * SyncManager Class
 * Manages background synchronization between local IndexedDB and Railway API
 */
export class SyncManager {
    constructor() {
        this.isSyncing = false;
        this.syncIntervalId = null;
        this.lastSyncTimestamp = this.getLastSyncTimestamp();
        this.isOnline = navigator.onLine;
        this.listeners = []; // Event listeners for sync status

        // Bind methods
        this.sync = this.sync.bind(this);
        this.handleOnline = this.handleOnline.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
    }

    /**
     * Start automatic background sync
     */
    start() {
        console.log('🔄 SyncManager: Starting...');

        // Initial sync
        this.sync();

        // Start interval timer
        this.syncIntervalId = setInterval(this.sync, SYNC_CONFIG.intervalMs);

        // Listen for online/offline events
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);

        console.log(`✅ SyncManager: Started (interval: ${SYNC_CONFIG.intervalMs}ms)`);
    }

    /**
     * Stop automatic sync
     */
    stop() {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
            this.syncIntervalId = null;
        }

        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);

        console.log('✅ SyncManager: Stopped');
    }

    /**
     * Handle online event
     */
    handleOnline() {
        console.log('🌐 SyncManager: Device is online');
        this.isOnline = true;
        this.notifyListeners('online');

        // Sync immediately when coming online
        setTimeout(() => this.sync(), 1000);
    }

    /**
     * Handle offline event
     */
    handleOffline() {
        console.log('📴 SyncManager: Device is offline');
        this.isOnline = false;
        this.notifyListeners('offline');
    }

    /**
     * Add event listener for sync status changes
     * @param {Function} callback - Callback function
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove event listener
     * @param {Function} callback - Callback function to remove
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    /**
     * Notify all listeners of sync events
     * @param {string} event - Event type
     * @param {Object} data - Event data
     */
    notifyListeners(event, data = {}) {
        this.listeners.forEach(callback => {
            try {
                callback({ event, data, timestamp: Date.now() });
            } catch (error) {
                console.error('❌ SyncManager: Listener error', error);
            }
        });
    }

    /**
     * Get last sync timestamp from localStorage
     * @returns {number} Unix timestamp in milliseconds
     */
    getLastSyncTimestamp() {
        const stored = localStorage.getItem('last_sync_timestamp');
        return stored ? parseInt(stored, 10) : 0;
    }

    /**
     * Set last sync timestamp in localStorage
     * @param {number} timestamp - Unix timestamp in milliseconds
     */
    setLastSyncTimestamp(timestamp) {
        this.lastSyncTimestamp = timestamp;
        localStorage.setItem('last_sync_timestamp', timestamp.toString());
    }

    /**
     * Main sync function - syncs local changes with server
     * @returns {Promise<Object>} Sync result
     */
    async sync() {
        // Don't sync if already syncing
        if (this.isSyncing) {
            console.log('⏳ SyncManager: Sync already in progress, skipping...');
            return { skipped: true };
        }

        // Don't sync if offline
        if (!this.isOnline || !navigator.onLine) {
            console.log('📴 SyncManager: Offline, skipping sync');
            return { offline: true };
        }

        this.isSyncing = true;
        this.notifyListeners('sync_start');

        try {
            console.log('🔄 SyncManager: Starting sync...');

            // Step 1: Get pending changes from sync queue
            const pendingItems = await getPendingSyncItems();

            if (pendingItems.length === 0) {
                console.log('✅ SyncManager: No pending changes');
                this.isSyncing = false;
                this.notifyListeners('sync_complete', { changes: 0 });
                return { success: true, changes: 0 };
            }

            // Limit number of changes per sync
            const itemsToSync = pendingItems.slice(0, SYNC_CONFIG.maxChangesPerSync);

            console.log(`📤 SyncManager: Syncing ${itemsToSync.length} changes`);

            // Step 2: Build sync payload
            const changes = itemsToSync.map(item => ({
                table_name: item.table_name,
                operation: item.operation,
                record_id: item.record_id,
                data: item.data
            }));

            const payload = {
                client_type: 'spa',
                last_sync_timestamp: this.lastSyncTimestamp,
                changes: changes
            };

            // Step 3: Call sync API
            const response = await syncChanges(payload);

            console.log(`✅ SyncManager: Server responded with ${response.server_changes?.length || 0} server changes`);

            // Step 4: Process server response
            await this.processServerResponse(response, itemsToSync);

            // Step 5: Update last sync timestamp
            if (response.sync_timestamp) {
                this.setLastSyncTimestamp(response.sync_timestamp);
            }

            // Step 6: If there are more pending items, schedule another sync
            if (pendingItems.length > SYNC_CONFIG.maxChangesPerSync) {
                console.log(`⏳ SyncManager: ${pendingItems.length - SYNC_CONFIG.maxChangesPerSync} more changes pending, scheduling next sync...`);
                setTimeout(() => this.sync(), 2000);
            }

            this.isSyncing = false;
            this.notifyListeners('sync_complete', {
                changes: itemsToSync.length,
                serverChanges: response.server_changes?.length || 0
            });

            return {
                success: true,
                changes: itemsToSync.length,
                serverChanges: response.server_changes?.length || 0
            };

        } catch (error) {
            console.error('❌ SyncManager: Sync failed', error);
            this.isSyncing = false;
            this.notifyListeners('sync_error', { error: error.message });

            // Retry after delay if network error
            if (!navigator.onLine) {
                console.log('📴 SyncManager: Network error, will retry when online');
            } else {
                console.log(`🔄 SyncManager: Retrying in ${SYNC_CONFIG.retryDelayMs}ms...`);
                setTimeout(() => this.sync(), SYNC_CONFIG.retryDelayMs);
            }

            return { error: error.message };
        }
    }

    /**
     * Process server response after sync
     * @param {Object} response - Server response
     * @param {Array} syncedItems - Items that were synced
     * @returns {Promise<void>}
     */
    async processServerResponse(response, syncedItems) {
        const { accepted_changes = [], rejected_changes = [], server_changes = [] } = response;

        console.log(`📊 SyncManager: Accepted: ${accepted_changes.length}, Rejected: ${rejected_changes.length}, Server: ${server_changes.length}`);

        // Remove accepted changes from sync queue
        for (const change of accepted_changes) {
            const syncItem = syncedItems.find(item => item.record_id === change.record_id);
            if (syncItem) {
                await removeSyncItem(syncItem.id);
                console.log(`✅ Removed from queue: ${change.table_name}/${change.record_id}`);
            }
        }

        // Handle rejected changes (apply server version - Last-Write-Wins)
        for (const rejection of rejected_changes) {
            const syncItem = syncedItems.find(item => item.record_id === rejection.record_id);
            if (syncItem) {
                // Remove from queue
                await removeSyncItem(syncItem.id);

                // Apply server version to local database
                if (rejection.server_data) {
                    await this.applyServerChange(rejection.table_name, rejection.server_data);
                    console.log(`🔄 Applied server version (conflict): ${rejection.table_name}/${rejection.record_id}`);
                }
            }
        }

        // Apply server changes to local database
        for (const serverChange of server_changes) {
            await this.applyServerChange(serverChange.table_name, serverChange.data);
        }

        if (server_changes.length > 0) {
            console.log(`✅ Applied ${server_changes.length} server changes`);
        }
    }

    /**
     * Apply server change to local database
     * Prevents sync loops by checking change_id
     * @param {string} tableName - Table name
     * @param {Object} data - Server data
     * @returns {Promise<void>}
     */
    async applyServerChange(tableName, data) {
        try {
            // Map table names from snake_case to object store names
            const storeNameMap = {
                families: 'families',
                members: 'members',
                tasks: 'tasks',
                point_transactions: 'point_transactions',
                rewards: 'rewards',
                reward_redemptions: 'reward_redemptions'
            };

            const storeName = storeNameMap[tableName];
            if (!storeName) {
                console.warn(`⚠️ Unknown table name: ${tableName}`);
                return;
            }

            // Check if this change already exists locally (by change_id)
            const existingRecords = await getAllRecords(storeName);
            const existing = existingRecords.find(r => r.change_id === data.change_id);

            if (existing) {
                // This is the same change we made - don't create sync loop
                console.log(`⏭️ Skipping duplicate change: ${storeName}/${data.id}`);
                return;
            }

            // Apply server change without queuing for sync
            // (We don't want to sync this back to server)
            await updateRecord(storeName, data);

            console.log(`📥 Applied server change: ${storeName}/${data.id}`);

        } catch (error) {
            console.error(`❌ Failed to apply server change: ${tableName}`, error);
        }
    }

    /**
     * Force immediate sync (e.g., when user manually triggers)
     * @returns {Promise<Object>}
     */
    async forceSync() {
        console.log('🔄 SyncManager: Force sync triggered');
        this.notifyListeners('sync_manual');
        return this.sync();
    }

    /**
     * Get sync status information
     * @returns {Promise<Object>}
     */
    async getSyncStatus() {
        const pendingItems = await getPendingSyncItems();

        return {
            isOnline: this.isOnline,
            isSyncing: this.isSyncing,
            pendingChanges: pendingItems.length,
            lastSyncTimestamp: this.lastSyncTimestamp,
            lastSyncDate: this.lastSyncTimestamp ? new Date(this.lastSyncTimestamp).toLocaleString() : 'Never'
        };
    }
}

// Singleton instance
let syncManagerInstance = null;

/**
 * Get SyncManager singleton instance
 * @returns {SyncManager}
 */
export function getSyncManager() {
    if (!syncManagerInstance) {
        syncManagerInstance = new SyncManager();
    }
    return syncManagerInstance;
}

/**
 * Initialize and start SyncManager
 * @returns {SyncManager}
 */
export function initSyncManager() {
    const manager = getSyncManager();
    manager.start();
    return manager;
}

/**
 * Stop SyncManager
 */
export function stopSyncManager() {
    if (syncManagerInstance) {
        syncManagerInstance.stop();
    }
}
