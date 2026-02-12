# SPA Integration Testing Guide
## FamilyTogether - IndexedDB & Sync Testing

**Date**: February 12, 2026
**Phase**: 2.6 - SPA Integration Testing
**Status**: 🧪 Testing in Progress

---

## 🎯 Testing Objectives

Verify that:
1. ✅ IndexedDB initializes correctly
2. ✅ localStorage data migrates to IndexedDB
3. ✅ CRUD operations save to IndexedDB + queue for sync
4. ✅ Data persists across page reloads
5. ✅ Offline mode works (no network required)
6. ✅ Sync queue populates correctly
7. ✅ Background sync works when authenticated

---

## 📋 Pre-Test Checklist

- [ ] All code committed to GitHub
- [ ] No console errors during file load
- [ ] Browser supports IndexedDB (Chrome, Firefox, Edge, Safari)
- [ ] DevTools open and ready
- [ ] Existing localStorage data backed up (if any)

---

## 🚀 Test Setup

### Step 1: Start Local HTTP Server

**Option A: Python (Recommended)**
```bash
cd C:\Users\Zanzi\TOOLS\SaaS(SoftwareAsAService)\FamilyTogether.SPA
python -m http.server 8000
```

**Option B: Node.js**
```bash
cd C:\Users\Zanzi\TOOLS\SaaS(SoftwareAsAService)\FamilyTogether.SPA
npx http-server -p 8000
```

**Expected Output:**
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

### Step 2: Open in Browser

Navigate to: **http://localhost:8000**

### Step 3: Open DevTools

- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
- **Firefox**: Press `F12` or `Ctrl+Shift+K`

---

## 🧪 Test Suite

### Test 1: Service Initialization ✅

**What to Check:**
1. Open **Console** tab in DevTools
2. Look for initialization messages

**Expected Console Output:**
```
🚀 Initializing FamilyTogether services...
✅ IndexedDB: Database initialized successfully
✅ IndexedDB initialized
🔄 Migration: Initializing...
[One of the following:]
  - ℹ️ Migration: Already completed, skipping
  - ℹ️ Migration: No localStorage data found, marking as completed
  - 🔄 Migration: Starting localStorage → IndexedDB migration...
    ✅ Migration: Created family [uuid]
    ✅ Migration: Migrated member [name]
    ✅ Migration: Migrated task [name]
    ✅ Migration: Migrated reward [name]
    ✅ Migration: Completed successfully
ℹ️ User not authenticated, sync manager not started
✅ All services initialized successfully
📦 FamilyTogether services exposed on window.FamilyTogetherServices
💾 IndexedDB helper functions exposed on window.FamilyTogetherIndexedDB
📥 Loading data from IndexedDB...
✅ Loaded from IndexedDB: {members: X, tasks: X, rewards: X}
```

**Pass Criteria:**
- ✅ No red errors in console
- ✅ All services initialized successfully
- ✅ Migration completed (or skipped if already done)
- ✅ Data loaded from IndexedDB

**If Failed:**
- Check for JavaScript errors
- Verify all service files are accessible (check Network tab)
- Check Supabase CDN loaded successfully

---

### Test 2: IndexedDB Structure Verification ✅

**Steps:**
1. In DevTools, go to **Application** tab
2. Expand **IndexedDB** → **FamilyTogetherDB**
3. Check all object stores exist

**Expected Object Stores:**
- ✅ `families`
- ✅ `members`
- ✅ `tasks`
- ✅ `point_transactions`
- ✅ `rewards`
- ✅ `reward_redemptions`
- ✅ `sync_queue`

**For Each Store:**
1. Click on store name
2. Verify structure matches schema

**Example: `tasks` Store**
```javascript
{
  id: "uuid",
  family_id: "uuid",
  title: "Task name",
  description: null,
  points_value: 10,
  status: "pending",
  assigned_to: null,
  created_by: null,
  due_date: null,
  completed_at: null,
  approved_at: null,
  approved_by: null,
  created_at: 1707738000000,
  last_modified: 1707738000000,
  change_id: "uuid",
  sync_version: 1,
  is_deleted: false
}
```

**Pass Criteria:**
- ✅ All 7 stores exist
- ✅ Records have sync metadata (last_modified, change_id, sync_version, is_deleted)
- ✅ Data structure matches normalized schema

---

### Test 3: Data Migration Verification ✅

**Prerequisites:**
- Have existing localStorage data OR
- Create new data in the app

**Steps:**
1. In DevTools **Application** tab → **Local Storage** → `http://localhost:8000`
2. Check for `familyCleaningTracker` key
3. If exists, note the data structure
4. In **Application** tab → **IndexedDB** → **FamilyTogetherDB**
5. Verify data migrated correctly

**Migration Mapping:**

| Old (localStorage) | New (IndexedDB) | Notes |
|-------------------|-----------------|-------|
| `familyMembers[].id` | `members.id` | Same UUID |
| `familyMembers[].name` | `members.name` | Direct copy |
| `familyMembers[].isParent` | `members.role` | `true` → "parent", `false` → "child" |
| `familyMembers[].points` | `members.total_points` | Direct copy |
| `tasks[].id` | `tasks.id` | Same UUID |
| `tasks[].name` | `tasks.title` | Renamed field |
| `tasks[].points` | `tasks.points_value` | Renamed field |
| `tasks[].completed` | `tasks.status` | `true` → "completed", `false` → "pending" |
| `rewards[].id` | `rewards.id` | Same UUID |
| `rewards[].name` | `rewards.title` | Renamed field |
| `rewards[].cost` | `rewards.points_cost` | Renamed field |

**Pass Criteria:**
- ✅ All family members migrated
- ✅ All tasks migrated
- ✅ All rewards migrated
- ✅ Family record created
- ✅ Migration flag set: `familyTogether_migrationCompleted` = "1.0"

---

### Test 4: Global Service Access ✅

**Steps:**
1. Open **Console** tab
2. Type and execute the following commands

**Test Commands:**
```javascript
// Check services are exposed
console.log('Services:', window.FamilyTogetherServices);
console.log('IndexedDB Helpers:', window.FamilyTogetherIndexedDB);

// Check Supabase client
console.log('Supabase Client:', window.supabaseClient);

// Test adapter functions
await window.FamilyTogetherServices.migration.getFamilyMembers();
await window.FamilyTogetherServices.migration.getTasks();
await window.FamilyTogetherServices.migration.getRewards();

// Check current family
await window.FamilyTogetherServices.migration.getCurrentFamilyId();

// Get IndexedDB stats
await window.FamilyTogetherServices.db.getDBStats();
```

**Expected Results:**
```javascript
// Services object exists
{
  db: { initDB, addRecord, updateRecord, ... },
  auth: { login, register, logout, ... },
  sync: { initSyncManager, startSync, ... },
  migration: { getFamilyMembers, getTasks, ... }
}

// IndexedDB helpers exist
{
  load: ƒ,
  saveMember: ƒ,
  saveTask: ƒ,
  saveReward: ƒ,
  saveAll: ƒ
}

// Supabase client initialized
Object { ... }

// Adapter functions return data in old format
getFamilyMembers() → [{ id, name, isParent, points }]
getTasks() → [{ id, name, points, completed }]
getRewards() → [{ id, name, cost, icon }]

// Family ID exists
getCurrentFamilyId() → "uuid-string"

// DB stats
{
  families: 1,
  members: 3,
  tasks: 5,
  rewards: 4,
  point_transactions: 0,
  reward_redemptions: 0,
  sync_queue: 0,
  pending_sync: 0
}
```

**Pass Criteria:**
- ✅ All service objects accessible
- ✅ Functions execute without errors
- ✅ Data returned in correct format
- ✅ DB stats match expected counts

---

### Test 5: CRUD Operations with IndexedDB ✅

**Test 5A: Create Member**

**Steps:**
1. Use the app UI to add a new family member
2. Watch **Console** for logs
3. Check **IndexedDB** → `members` table
4. Check **IndexedDB** → `sync_queue` table

**Expected Console Output:**
```
✅ IndexedDB: Added record to members [uuid]
✅ IndexedDB: Queued create for members/[uuid]
✅ Saved family member to IndexedDB: [name]
```

**Expected IndexedDB Changes:**
- New record in `members` table with:
  - `id`: UUID
  - `last_modified`: Current timestamp
  - `change_id`: UUID
  - `sync_version`: 1
  - `is_deleted`: false
- New record in `sync_queue` table with:
  - `table_name`: "members"
  - `operation`: "create"
  - `status`: "pending"

**Pass Criteria:**
- ✅ Member appears in UI
- ✅ Member saved to IndexedDB
- ✅ Sync queue item created
- ✅ No console errors

---

**Test 5B: Update Task**

**Steps:**
1. Edit an existing task (change title or points)
2. Watch console and IndexedDB

**Expected Console Output:**
```
✅ IndexedDB: Updated record in tasks [uuid]
✅ IndexedDB: Queued update for tasks/[uuid]
✅ Saved task to IndexedDB: [name]
```

**Expected IndexedDB Changes:**
- Updated record in `tasks` table:
  - `last_modified`: New timestamp (greater than before)
  - `sync_version`: Incremented by 1
  - `change_id`: New UUID
- New record in `sync_queue` with operation "update"

**Pass Criteria:**
- ✅ Task updates in UI
- ✅ IndexedDB record updated
- ✅ Sync metadata updated (version incremented, timestamp changed)
- ✅ Sync queue item created

---

**Test 5C: Delete Reward (Soft Delete)**

**Steps:**
1. Delete a reward from the app
2. Check IndexedDB

**Expected Behavior:**
- Record in `rewards` table:
  - `is_deleted`: true
  - `last_modified`: Updated
  - `sync_version`: Incremented
- Record NOT removed from IndexedDB (soft delete)
- Sync queue item created with operation "update" or "delete"

**Pass Criteria:**
- ✅ Reward removed from UI
- ✅ Record still in IndexedDB with `is_deleted: true`
- ✅ Sync queue item created

---

### Test 6: Data Persistence ✅

**Steps:**
1. Create a new task in the app
2. Note the task details
3. Refresh the page (`F5` or `Ctrl+R`)
4. Check if task still exists

**Expected Behavior:**
- Page reloads
- Services re-initialize
- Migration skipped (already completed)
- `loadFromIndexedDB()` runs automatically after 500ms
- Task appears in UI with same details

**Pass Criteria:**
- ✅ Task persists after reload
- ✅ All data intact (members, tasks, rewards)
- ✅ No data loss

---

### Test 7: Offline Functionality ✅

**Steps:**
1. Open DevTools **Network** tab
2. Click **Offline** checkbox (top of Network tab)
3. Verify "No internet" icon appears in browser
4. In the app, create a new task
5. Check if task saves
6. Check sync queue

**Expected Behavior:**
- Task saves to IndexedDB successfully
- Task appears in UI
- Console shows: `✅ Saved task to IndexedDB`
- Sync queue populates with pending change
- No network errors (app works fully offline)

**Expected IndexedDB:**
- `sync_queue` table has new pending item:
  ```javascript
  {
    id: 1,
    table_name: "tasks",
    operation: "create",
    record_id: "uuid",
    data: { ... },
    status: "pending",
    created_at: 1707738000000
  }
  ```

**Pass Criteria:**
- ✅ Task created successfully while offline
- ✅ Task saved to IndexedDB
- ✅ Sync queue item created
- ✅ App fully functional without network

---

### Test 8: Sync Queue Inspection ✅

**Steps:**
1. While still offline, create 2-3 more tasks
2. In **Console**, run:

```javascript
// Get all pending sync items
const pending = await window.FamilyTogetherServices.db.getAllRecords('sync_queue');
console.log('Pending sync items:', pending);
console.log('Total pending:', pending.length);

// Check each item
pending.forEach((item, index) => {
  console.log(`[${index}] ${item.operation} ${item.table_name}/${item.record_id} - ${item.status}`);
});
```

**Expected Output:**
```
Pending sync items: Array(3)
  [0]: {id: 1, table_name: "tasks", operation: "create", status: "pending", ...}
  [1]: {id: 2, table_name: "tasks", operation: "create", status: "pending", ...}
  [2]: {id: 3, table_name: "tasks", operation: "create", status: "pending", ...}
Total pending: 3
[0] create tasks/[uuid-1] - pending
[1] create tasks/[uuid-2] - pending
[2] create tasks/[uuid-3] - pending
```

**Pass Criteria:**
- ✅ All offline changes queued
- ✅ Each has status "pending"
- ✅ Correct operation type (create, update, delete)
- ✅ Full record data stored in queue

---

### Test 9: Return Online (No Auth) ✅

**Steps:**
1. In DevTools **Network** tab, uncheck **Offline**
2. Verify internet connection restored
3. Observe console (sync won't happen without auth)

**Expected Behavior:**
- Network restored
- App continues to work
- Sync does NOT run automatically (user not authenticated)
- Pending items remain in `sync_queue`

**Console Output:**
```
ℹ️ User not authenticated, sync manager not started
```

**Pass Criteria:**
- ✅ App works when back online
- ✅ No automatic sync (correct - not authenticated)
- ✅ Pending items preserved in queue
- ✅ No errors

---

### Test 10: Manual Data Load ✅

**Steps:**
1. In **Console**, run:

```javascript
// Manual load from IndexedDB
await window.FamilyTogetherIndexedDB.load();
```

**Expected Output:**
```
📥 Loading data from IndexedDB...
✅ Loaded from IndexedDB: {members: 3, tasks: 8, rewards: 4}
```

**Pass Criteria:**
- ✅ Data loads successfully
- ✅ UI updates with loaded data
- ✅ Counts match IndexedDB

---

### Test 11: Batch Save ✅

**Steps:**
1. Make several changes in the app (add member, create task, add reward)
2. In **Console**, run:

```javascript
// Save all current app state to IndexedDB
await window.FamilyTogetherIndexedDB.saveAll();
```

**Expected Output:**
```
💾 Saving all data to IndexedDB...
✅ IndexedDB: Updated record in members [uuid]
✅ IndexedDB: Queued update for members/[uuid]
✅ IndexedDB: Updated record in tasks [uuid]
✅ IndexedDB: Queued update for tasks/[uuid]
... (for all changed records)
✅ All data saved to IndexedDB
```

**Pass Criteria:**
- ✅ All changes saved
- ✅ Sync queue updated
- ✅ No errors

---

### Test 12: Clear and Reset (Optional) ✅

**Steps:**
1. In **Console**, run:

```javascript
// Clear all IndexedDB data
await window.FamilyTogetherServices.db.clearAllData();

// Clear migration flag to test re-migration
localStorage.removeItem('familyTogether_migrationCompleted');

// Reload page
location.reload();
```

**Expected Behavior:**
- All IndexedDB data cleared
- Page reloads
- Migration runs again
- localStorage data re-migrated to IndexedDB

**Pass Criteria:**
- ✅ Data cleared successfully
- ✅ Migration runs on reload
- ✅ Data restored from localStorage

---

## 📊 Test Results Summary

### Automated Checklist

Copy this to track your testing:

```
Test Suite Results:
[ ] Test 1: Service Initialization
[ ] Test 2: IndexedDB Structure Verification
[ ] Test 3: Data Migration Verification
[ ] Test 4: Global Service Access
[ ] Test 5A: Create Member (CRUD)
[ ] Test 5B: Update Task (CRUD)
[ ] Test 5C: Delete Reward (CRUD)
[ ] Test 6: Data Persistence
[ ] Test 7: Offline Functionality
[ ] Test 8: Sync Queue Inspection
[ ] Test 9: Return Online (No Auth)
[ ] Test 10: Manual Data Load
[ ] Test 11: Batch Save
[ ] Test 12: Clear and Reset (Optional)

Overall Status: [ ] PASS / [ ] FAIL
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "Supabase library not loaded"
**Cause**: Supabase CDN script failed to load
**Fix**: Check Network tab, verify CDN URL is accessible, check firewall

### Issue 2: IndexedDB not initializing
**Cause**: Browser doesn't support IndexedDB or private browsing mode
**Fix**: Use normal browsing mode, try different browser

### Issue 3: Migration not running
**Cause**: Migration flag already set
**Fix**: Clear flag with `localStorage.removeItem('familyTogether_migrationCompleted')` and reload

### Issue 4: Sync queue not populating
**Cause**: Not using adapter functions
**Fix**: Ensure saves go through `window.FamilyTogetherIndexedDB.save*()` functions

### Issue 5: Data not persisting
**Cause**: Not calling save functions
**Fix**: Verify save functions are called after CRUD operations

---

## ✅ Success Criteria

Testing is successful if:

1. ✅ All services initialize without errors
2. ✅ IndexedDB structure is correct (7 stores)
3. ✅ Data migrates from localStorage correctly
4. ✅ CRUD operations save to IndexedDB + queue for sync
5. ✅ Data persists across page reloads
6. ✅ App works fully offline
7. ✅ Sync queue populates correctly
8. ✅ No console errors or warnings

---

## 📝 Next Steps After Testing

1. **If All Tests Pass:**
   - Document test results
   - Update CHANGELOG.md
   - Prepare for Netlify deployment
   - Test authentication flow (next session)

2. **If Tests Fail:**
   - Document failures
   - Create bug fixes
   - Re-test
   - Commit fixes

3. **After Successful Testing:**
   - Deploy to Netlify
   - Test production deployment
   - Begin Phase 3 (WPF Development) or test auth flow

---

**END OF TESTING GUIDE**
