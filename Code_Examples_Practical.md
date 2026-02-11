# Practical Code Examples
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0
**Date**: February 10, 2026
**Purpose**: Working code examples for common implementation scenarios

---

## Table of Contents
1. [Authentication Flow Examples](#authentication-flow-examples)
2. [Sync Implementation Examples](#sync-implementation-examples)
3. [Offline Queue Management](#offline-queue-management)
4. [Conflict Resolution Examples](#conflict-resolution-examples)
5. [Data Access Patterns](#data-access-patterns)

---

## Authentication Flow Examples

### Complete Authentication Workflow (SPA)

**File**: `src/services/auth.js`

```javascript
import { createClient } from '@supabase/supabase-js';
import CONFIG from '../config.js';

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

export class AuthService {
    constructor() {
        this.currentUser = null;
        this.authToken = null;
    }

    /**
     * Register new user
     */
    async register(email, password, familyName, userName) {
        try {
            // 1. Create auth user in Supabase
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password
            });

            if (error) throw error;

            // 2. Call API to create family and member
            const response = await fetch(`${CONFIG.apiUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.session.access_token}`
                },
                body: JSON.stringify({
                    email: email,
                    family_name: familyName,
                    user_name: userName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create family');
            }

            const result = await response.json();

            // 3. Store token and user info
            this.authToken = data.session.access_token;
            this.currentUser = result.data.user;

            localStorage.setItem('auth_token', this.authToken);
            localStorage.setItem('user', JSON.stringify(this.currentUser));

            return {
                success: true,
                user: this.currentUser,
                token: this.authToken
            };

        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    /**
     * Login user
     */
    async login(email, password) {
        try {
            // 1. Login with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // 2. Store token
            this.authToken = data.session.access_token;
            localStorage.setItem('auth_token', this.authToken);

            // 3. Get user profile from API
            const response = await fetch(`${CONFIG.apiUrl}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.data.user;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
            }

            return {
                success: true,
                user: this.currentUser,
                token: this.authToken
            };

        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local storage
            this.authToken = null;
            this.currentUser = null;
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = localStorage.getItem('auth_token');
        return token !== null;
    }

    /**
     * Get current auth token
     */
    getToken() {
        return localStorage.getItem('auth_token');
    }

    /**
     * Refresh token before expiry
     */
    async refreshToken() {
        try {
            const { data, error } = await supabase.auth.refreshSession();

            if (error) throw error;

            if (data.session) {
                this.authToken = data.session.access_token;
                localStorage.setItem('auth_token', this.authToken);
                return this.authToken;
            }

            return null;

        } catch (error) {
            console.error('Token refresh failed:', error);
            await this.logout();
            return null;
        }
    }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
```

### Authentication Controller (API)

**File**: `FamilyTogether.API/Controllers/AuthController.cs`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FamilyTogether.API.Services;
using FamilyTogether.API.DTOs.Requests;

namespace FamilyTogether.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : BaseController
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                // Validate
                if (string.IsNullOrWhiteSpace(request.Email))
                {
                    return ErrorResponse("Email is required", 400);
                }

                if (string.IsNullOrWhiteSpace(request.FamilyName))
                {
                    return ErrorResponse("Family name is required", 400);
                }

                // Get user ID from JWT (Supabase already created the auth user)
                var userId = GetUserId();

                // Create family and member
                var result = await _authService.RegisterUserAsync(
                    userId,
                    request.Email,
                    request.FamilyName,
                    request.UserName
                );

                _logger.LogInformation("New user registered: {Email}, Family: {FamilyName}",
                    request.Email, request.FamilyName);

                return SuccessResponse(result, "Registration successful");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Registration failed for {Email}", request.Email);
                return ErrorResponse("Registration failed", 500);
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userId = GetUserId();
                var user = await _authService.GetUserProfileAsync(userId);

                if (user == null)
                {
                    return ErrorResponse("User not found", 404);
                }

                return SuccessResponse(new { user = user });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get user profile");
                return ErrorResponse("Failed to get user profile", 500);
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            // Supabase handles token invalidation
            // This endpoint mainly for logging purposes
            var userId = GetUserId();
            _logger.LogInformation("User logged out: {UserId}", userId);

            return SuccessResponse(null, "Logged out successfully");
        }
    }
}
```

---

## Sync Implementation Examples

### Complete Sync Flow (SPA to API)

**SPA Sync Manager** (`src/services/sync.js`):

```javascript
export class SyncManager {
    constructor(apiUrl, authToken) {
        this.apiUrl = apiUrl;
        this.authToken = authToken;
        this.isSyncing = false;
        this.syncInterval = null;
    }

    /**
     * Main sync method - sends local changes to server and receives updates
     */
    async sync() {
        if (!navigator.onLine || this.isSyncing) {
            console.log('Sync skipped:', !navigator.onLine ? 'offline' : 'already syncing');
            return;
        }

        this.isSyncing = true;
        const startTime = Date.now();

        try {
            // 1. Get pending changes from sync queue
            const pendingChanges = await db.getByIndex('sync_queue', 'status', 'pending');

            if (pendingChanges.length === 0) {
                console.log('No pending changes to sync');
                return { success: true, changeCount: 0 };
            }

            console.log(`Syncing ${pendingChanges.length} changes...`);

            // 2. Get last sync timestamp
            const lastSyncMeta = await db.get('sync_metadata', 'last_sync_timestamp');
            const lastSyncTimestamp = lastSyncMeta ? parseInt(lastSyncMeta.value) : 0;

            // 3. Build sync payload
            const payload = {
                client_type: 'spa',
                client_version: '1.0.0',
                last_sync_timestamp: lastSyncTimestamp,
                changes: pendingChanges.map(item => ({
                    table_name: item.table_name,
                    operation: item.operation,
                    record_id: item.record_id,
                    data: JSON.parse(item.data_json)
                }))
            };

            // 4. Send to server
            const response = await fetch(`${this.apiUrl}/api/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Sync failed: ${response.statusText}`);
            }

            const result = await response.json();

            // 5. Process server response
            await this.processAcceptedChanges(result.data.accepted_changes, pendingChanges);
            await this.processRejectedChanges(result.data.rejected_changes, pendingChanges);
            await this.applyServerChanges(result.data.server_changes);

            // 6. Update last sync timestamp
            await db.put('sync_metadata', {
                key: 'last_sync_timestamp',
                value: result.data.sync_timestamp.toString(),
                updated_at: new Date().toISOString()
            });

            const duration = Date.now() - startTime;
            console.log(`✓ Sync completed in ${duration}ms:`, {
                accepted: result.data.accepted_changes.length,
                rejected: result.data.rejected_changes.length,
                serverUpdates: result.data.server_changes.length
            });

            return {
                success: true,
                changeCount: pendingChanges.length,
                duration: duration
            };

        } catch (error) {
            console.error('Sync error:', error);
            throw error;
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Process changes accepted by server
     */
    async processAcceptedChanges(acceptedChanges, pendingChanges) {
        for (const accepted of acceptedChanges) {
            const queueItem = pendingChanges.find(c => c.record_id === accepted.record_id);
            if (queueItem) {
                // Remove from sync queue
                await db.delete('sync_queue', queueItem.id);
            }
        }
    }

    /**
     * Process changes rejected by server (conflicts)
     */
    async processRejectedChanges(rejectedChanges, pendingChanges) {
        for (const rejected of rejectedChanges) {
            if (rejected.status === 'conflict' && rejected.server_data) {
                // Server wins - apply server version
                await this.applyServerChange({
                    table_name: rejected.table_name,
                    operation: 'update',
                    record_id: rejected.record_id,
                    data: rejected.server_data
                });

                // Remove from sync queue
                const queueItem = pendingChanges.find(c => c.record_id === rejected.record_id);
                if (queueItem) {
                    await db.delete('sync_queue', queueItem.id);
                }

                console.warn(`Conflict resolved for ${rejected.table_name}:${rejected.record_id} - server wins`);
            }
        }
    }

    /**
     * Apply changes from server to local storage
     */
    async applyServerChanges(serverChanges) {
        for (const change of serverChanges) {
            await this.applyServerChange(change);
        }
    }

    async applyServerChange(change) {
        const storeName = this.getStoreName(change.table_name);

        try {
            if (change.operation === 'delete') {
                await db.delete(storeName, change.record_id);
            } else {
                // create or update
                await db.put(storeName, change.data);
            }
        } catch (error) {
            console.error(`Failed to apply server change:`, change, error);
        }
    }

    /**
     * Map database table names to IndexedDB store names
     */
    getStoreName(tableName) {
        const mapping = {
            'families': 'families',
            'members': 'members',
            'tasks': 'tasks',
            'point_transactions': 'point_transactions',
            'rewards': 'rewards',
            'reward_redemptions': 'reward_redemptions'
        };

        return mapping[tableName] || tableName;
    }

    /**
     * Start automatic sync every 30 seconds
     */
    startAutoSync() {
        this.stopAutoSync();

        // Initial sync
        this.sync();

        // Periodic sync
        this.syncInterval = setInterval(() => {
            this.sync();
        }, 30000);

        // Sync when coming online
        window.addEventListener('online', () => {
            console.log('Network online, triggering sync');
            this.sync();
        });

        console.log('Auto-sync started (every 30 seconds)');
    }

    /**
     * Stop automatic sync
     */
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
}
```

### Sync Controller (API)

**File**: `FamilyTogether.API/Controllers/SyncController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using FamilyTogether.API.Services;
using FamilyTogether.API.DTOs.Requests;
using FamilyTogether.API.DTOs.Responses;

namespace FamilyTogether.API.Controllers
{
    public class SyncController : BaseController
    {
        private readonly ISyncService _syncService;
        private readonly ILogger<SyncController> _logger;

        public SyncController(ISyncService syncService, ILogger<SyncController> logger)
        {
            _syncService = syncService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> Sync([FromBody] SyncRequest request)
        {
            var userId = GetUserId();
            var startTime = DateTime.UtcNow;

            try
            {
                _logger.LogInformation("Sync started for user {UserId} with {ChangeCount} changes",
                    userId, request.Changes?.Count ?? 0);

                // Validate request
                if (request.Changes == null || request.Changes.Count == 0)
                {
                    // No changes, but still return server updates
                    var emptyResponse = await _syncService.GetServerUpdatesAsync(
                        userId,
                        request.LastSyncTimestamp
                    );

                    return SuccessResponse(emptyResponse);
                }

                // Limit changes per request
                if (request.Changes.Count > 100)
                {
                    return ErrorResponse("Too many changes. Maximum 100 per sync.", 413);
                }

                // Process sync
                var response = await _syncService.ProcessSyncAsync(userId, request);

                var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
                _logger.LogInformation("Sync completed for user {UserId} in {Duration}ms. Accepted: {Accepted}, Rejected: {Rejected}, Server updates: {ServerUpdates}",
                    userId, duration, response.AcceptedChanges.Count, response.RejectedChanges.Count, response.ServerChanges.Count);

                return SuccessResponse(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sync failed for user {UserId}", userId);
                return ErrorResponse("Sync failed", 500);
            }
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetSyncStatus()
        {
            try
            {
                var userId = GetUserId();
                var status = await _syncService.GetSyncStatusAsync(userId);

                return SuccessResponse(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get sync status");
                return ErrorResponse("Failed to get sync status", 500);
            }
        }
    }
}
```

### Sync Service with Conflict Resolution

**File**: `FamilyTogether.API/Services/SyncService.cs`

```csharp
using FamilyTogether.API.Data;
using FamilyTogether.API.DTOs.Requests;
using FamilyTogether.API.DTOs.Responses;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace FamilyTogether.API.Services
{
    public class SyncService : ISyncService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SyncService> _logger;

        public SyncService(AppDbContext context, ILogger<SyncService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<SyncResponse> ProcessSyncAsync(Guid userId, SyncRequest request)
        {
            var response = new SyncResponse
            {
                SyncTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                AcceptedChanges = new List<AcceptedChange>(),
                RejectedChanges = new List<RejectedChange>(),
                ServerChanges = new List<ServerChange>(),
                ConflictsResolved = 0
            };

            // Get user's family ID
            var familyId = await GetUserFamilyIdAsync(userId);
            if (familyId == Guid.Empty)
            {
                throw new Exception("User family not found");
            }

            // Process each client change
            foreach (var change in request.Changes)
            {
                try
                {
                    var result = await ProcessChangeAsync(familyId, change);

                    if (result.IsConflict)
                    {
                        response.RejectedChanges.Add(new RejectedChange
                        {
                            RecordId = change.RecordId,
                            Status = "conflict",
                            Reason = "Server version is newer (Last-Write-Wins)",
                            ServerData = result.ServerData
                        });
                        response.ConflictsResolved++;
                    }
                    else
                    {
                        response.AcceptedChanges.Add(new AcceptedChange
                        {
                            RecordId = change.RecordId,
                            Status = "accepted"
                        });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process change for table {TableName}, record {RecordId}",
                        change.TableName, change.RecordId);

                    response.RejectedChanges.Add(new RejectedChange
                    {
                        RecordId = change.RecordId,
                        Status = "error",
                        Reason = "Server error processing change"
                    });
                }
            }

            // Get server updates since last sync
            response.ServerChanges = await GetServerUpdatesAsync(familyId, request.LastSyncTimestamp);

            // Save sync log
            await SaveSyncLogAsync(userId, familyId, request, response);

            return response;
        }

        private async Task<(bool IsConflict, object? ServerData)> ProcessChangeAsync(
            Guid familyId,
            SyncChange change)
        {
            switch (change.TableName)
            {
                case "tasks":
                    return await ProcessTaskChangeAsync(familyId, change);

                case "members":
                    return await ProcessMemberChangeAsync(familyId, change);

                // Add other tables...

                default:
                    throw new NotImplementedException($"Sync for table '{change.TableName}' not implemented");
            }
        }

        private async Task<(bool IsConflict, object? ServerData)> ProcessTaskChangeAsync(
            Guid familyId,
            SyncChange change)
        {
            // Parse client data
            var clientData = JsonSerializer.Deserialize<JsonElement>(change.Data.ToString()!);
            var clientLastModified = clientData.GetProperty("last_modified").GetInt64();

            // Get server version
            var serverTask = await _context.Tasks.FindAsync(change.RecordId);

            if (change.Operation == "create")
            {
                // New task - no conflict possible
                var newTask = JsonSerializer.Deserialize<TaskEntity>(change.Data.ToString()!);
                if (newTask != null)
                {
                    newTask.FamilyId = familyId; // Ensure correct family
                    _context.Tasks.Add(newTask);
                    await _context.SaveChangesAsync();
                }
                return (false, null);
            }

            if (change.Operation == "update")
            {
                if (serverTask == null)
                {
                    // Record doesn't exist on server - conflict
                    return (true, null);
                }

                // Check for conflict (Last-Write-Wins)
                if (clientLastModified > serverTask.LastModified)
                {
                    // Client wins - apply client changes
                    var updatedTask = JsonSerializer.Deserialize<TaskEntity>(change.Data.ToString()!);
                    if (updatedTask != null)
                    {
                        _context.Entry(serverTask).CurrentValues.SetValues(updatedTask);
                        await _context.SaveChangesAsync();
                    }
                    return (false, null);
                }
                else
                {
                    // Server wins - reject client change
                    return (true, serverTask);
                }
            }

            if (change.Operation == "delete")
            {
                if (serverTask != null)
                {
                    serverTask.IsDeleted = true;
                    serverTask.LastModified = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    await _context.SaveChangesAsync();
                }
                return (false, null);
            }

            return (false, null);
        }

        private async Task<List<ServerChange>> GetServerUpdatesAsync(
            Guid familyId,
            long sinceTimestamp)
        {
            var updates = new List<ServerChange>();

            // Get updated tasks
            var updatedTasks = await _context.Tasks
                .Where(t => t.FamilyId == familyId && t.LastModified > sinceTimestamp)
                .ToListAsync();

            updates.AddRange(updatedTasks.Select(t => new ServerChange
            {
                TableName = "tasks",
                Operation = t.IsDeleted ? "delete" : "update",
                RecordId = t.Id,
                Data = t
            }));

            // Get other updated entities...

            return updates;
        }

        private async Task<Guid> GetUserFamilyIdAsync(Guid userId)
        {
            var member = await _context.Members
                .Where(m => m.UserId == userId && !m.IsDeleted)
                .FirstOrDefaultAsync();

            return member?.FamilyId ?? Guid.Empty;
        }

        private async Task SaveSyncLogAsync(Guid userId, Guid familyId, SyncRequest request, SyncResponse response)
        {
            var log = new SyncLog
            {
                UserId = userId,
                FamilyId = familyId,
                SyncTimestamp = DateTime.UtcNow,
                ChangesUploaded = request.Changes.Count,
                ChangesDownloaded = response.ServerChanges.Count,
                ConflictsResolved = response.ConflictsResolved,
                ClientType = request.ClientType,
                ClientVersion = request.ClientVersion
            };

            _context.SyncLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task<SyncStatusResponse> GetSyncStatusAsync(Guid userId)
        {
            var lastSync = await _context.SyncLogs
                .Where(sl => sl.UserId == userId)
                .OrderByDescending(sl => sl.SyncTimestamp)
                .FirstOrDefaultAsync();

            return new SyncStatusResponse
            {
                LastSync = lastSync?.SyncTimestamp,
                LastSyncTimestamp = lastSync != null
                    ? new DateTimeOffset(lastSync.SyncTimestamp).ToUnixTimeMilliseconds()
                    : 0,
                PendingChanges = 0, // Client-side only
                SyncVersion = 1
            };
        }
    }
}
```

---

## Offline Queue Management

### Queueing Changes for Sync (SPA)

```javascript
// src/services/taskService.js

import db from './db.js';
import { generateUUID } from '../utils/uuid.js';

export class TaskService {
    /**
     * Create a new task (works offline)
     */
    async createTask(taskData) {
        try {
            const now = Date.now();
            const task = {
                id: generateUUID(),
                family_id: taskData.family_id,
                title: taskData.title,
                description: taskData.description || '',
                points: taskData.points,
                assigned_to: taskData.assigned_to,
                created_by: taskData.created_by,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_modified: now,
                is_deleted: false,
                change_id: generateUUID(),
                sync_version: 1
            };

            // 1. Save to local IndexedDB
            await db.add('tasks', task);

            // 2. Queue for sync
            await db.queueSync('create', 'tasks', task.id, task);

            console.log('Task created locally:', task.id);

            return task;

        } catch (error) {
            console.error('Failed to create task:', error);
            throw error;
        }
    }

    /**
     * Update a task (works offline)
     */
    async updateTask(taskId, updates) {
        try {
            // 1. Get existing task
            const task = await db.get('tasks', taskId);
            if (!task) {
                throw new Error('Task not found');
            }

            // 2. Apply updates
            const updatedTask = {
                ...task,
                ...updates,
                updated_at: new Date().toISOString(),
                last_modified: Date.now(),
                change_id: generateUUID(),
                sync_version: task.sync_version + 1
            };

            // 3. Save to IndexedDB
            await db.put('tasks', updatedTask);

            // 4. Queue for sync
            await db.queueSync('update', 'tasks', taskId, updatedTask);

            console.log('Task updated locally:', taskId);

            return updatedTask;

        } catch (error) {
            console.error('Failed to update task:', error);
            throw error;
        }
    }

    /**
     * Delete a task (soft delete, works offline)
     */
    async deleteTask(taskId) {
        try {
            // 1. Get existing task
            const task = await db.get('tasks', taskId);
            if (!task) {
                throw new Error('Task not found');
            }

            // 2. Mark as deleted
            const deletedTask = {
                ...task,
                is_deleted: true,
                updated_at: new Date().toISOString(),
                last_modified: Date.now(),
                change_id: generateUUID(),
                sync_version: task.sync_version + 1
            };

            // 3. Save to IndexedDB
            await db.put('tasks', deletedTask);

            // 4. Queue for sync
            await db.queueSync('delete', 'tasks', taskId, deletedTask);

            console.log('Task deleted locally:', taskId);

            return deletedTask;

        } catch (error) {
            console.error('Failed to delete task:', error);
            throw error;
        }
    }

    /**
     * Get all tasks (from local IndexedDB)
     */
    async getAllTasks(familyId) {
        try {
            const tasks = await db.getByIndex('tasks', 'family_id', familyId);

            // Filter out deleted tasks
            return tasks.filter(t => !t.is_deleted);

        } catch (error) {
            console.error('Failed to get tasks:', error);
            throw error;
        }
    }

    /**
     * Get tasks assigned to a specific member
     */
    async getTasksByMember(memberId) {
        try {
            const tasks = await db.getByIndex('tasks', 'assigned_to', memberId);

            // Filter out deleted tasks
            return tasks.filter(t => !t.is_deleted);

        } catch (error) {
            console.error('Failed to get tasks:', error);
            throw error;
        }
    }
}

// Export singleton
const taskService = new TaskService();
export default taskService;
```

---

## Conflict Resolution Examples

### Last-Write-Wins Implementation

```csharp
// FamilyTogether.API/Helpers/ConflictResolver.cs

public class ConflictResolver
{
    public ConflictResolutionResult Resolve<T>(T clientData, T serverData)
        where T : BaseEntity
    {
        // Last-Write-Wins: Compare timestamps
        if (clientData.LastModified > serverData.LastModified)
        {
            // Client wins
            return new ConflictResolutionResult
            {
                ClientWins = true,
                ServerWins = false,
                ResolvedData = clientData,
                Reason = "Client timestamp is newer"
            };
        }
        else if (clientData.LastModified < serverData.LastModified)
        {
            // Server wins
            return new ConflictResolutionResult
            {
                ClientWins = false,
                ServerWins = true,
                ResolvedData = serverData,
                Reason = "Server timestamp is newer"
            };
        }
        else
        {
            // Equal timestamps - server wins (tie-breaker)
            return new ConflictResolutionResult
            {
                ClientWins = false,
                ServerWins = true,
                ResolvedData = serverData,
                Reason = "Equal timestamps - server wins (tie-breaker)"
            };
        }
    }
}

public class ConflictResolutionResult
{
    public bool ClientWins { get; set; }
    public bool ServerWins { get; set; }
    public object ResolvedData { get; set; }
    public string Reason { get; set; }
}
```

---

## Data Access Patterns

### Repository Pattern (API)

```csharp
// Generic repository
public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id);
    Task<List<T>> GetAllAsync();
    Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T> AddAsync(T entity);
    Task<T> UpdateAsync(T entity);
    Task DeleteAsync(Guid id);
}

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    private readonly AppDbContext _context;
    private readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<List<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    public async Task<T> AddAsync(T entity)
    {
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;
        entity.LastModified = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<T> UpdateAsync(T entity)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        entity.LastModified = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        entity.SyncVersion++;

        _dbSet.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null)
        {
            entity.IsDeleted = true;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.LastModified = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            await _context.SaveChangesAsync();
        }
    }
}
```

---

**END OF PRACTICAL CODE EXAMPLES**
