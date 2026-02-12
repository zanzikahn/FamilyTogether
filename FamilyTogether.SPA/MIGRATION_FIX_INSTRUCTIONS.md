# Migration Fix - Testing Instructions

**Date**: February 12, 2026
**Status**: ✅ FIXES APPLIED

---

## 🐛 What Was Fixed

### Issue 1: Data Not Migrating
**Symptom**: Profiles appeared briefly then disappeared after page reload
**Cause**: Migration completed but IndexedDB was empty
**Fix**: Handle tasks object format (old localStorage has tasks as object, not array)

### Issue 2: Empty Data Overwrite
**Symptom**: IndexedDB showed keys but no values
**Cause**: Auto-load ran even when IndexedDB was empty, overwriting appState
**Fix**: Check if IndexedDB has data before loading

---

## 🧪 Testing Steps

### Step 1: Reset Migration (If Already Ran)

If you already have the migration flag set but IndexedDB is empty:

```javascript
// In browser console (F12):
await window.FamilyTogetherServices.migration.resetMigration();
// You'll see: ⚠️ Resetting migration - this will clear all IndexedDB data
// Then: ✅ Migration reset complete. Reload page to re-run migration.
```

### Step 2: Reload Page

Press `F5` or `Ctrl+R` to reload the page.

### Step 3: Watch Console for Migration

You should see:
```
🚀 Initializing FamilyTogether services...
✅ IndexedDB: Database initialized successfully
✅ IndexedDB initialized
🔄 Migration: Initializing...
🔄 Migration: Starting localStorage → IndexedDB migration...
📦 Migration: Found localStorage data {
  familyMembers: X,
  tasks: X,
  tasksIsArray: false,  ← Important: shows it detected object format
  rewards: X,
  settings: 'present'
}
✅ Migration: Created family [uuid]
✅ Migration: Migrated member [Name]
✅ Migration: Migrated task [Task Name]
...
✅ Migration: Completed successfully {
  families: 1,
  members: X,
  tasks: X,
  rewards: X,
  errors: []
}
📊 IndexedDB has data, loading...
✅ Loaded from IndexedDB: {members: X, tasks: X, rewards: X}
```

### Step 4: Verify IndexedDB

1. Open DevTools → **Application** tab
2. Expand **IndexedDB** → **FamilyTogetherDB**
3. Click on **members** - Should see your family members
4. Click on **tasks** - Should see your tasks
5. Click on **families** - Should see 1 family record
6. Click on **rewards** - Should see your rewards

**Each record should have**:
- `id`: UUID
- `last_modified`: Timestamp
- `change_id`: UUID
- `sync_version`: 1
- `is_deleted`: false

### Step 5: Verify Data Persists

1. Press `F5` to reload
2. Profiles should still be visible
3. No flash of empty data

**Expected Console:**
```
🚀 Initializing FamilyTogether services...
✅ IndexedDB initialized
🔄 Migration: Initializing...
ℹ️ Migration: Already completed, skipping  ← Should skip on second load
📊 IndexedDB has data, loading...
✅ Loaded from IndexedDB: {members: X, tasks: X, rewards: X}
```

---

## 📊 Verification Commands

Run these in the browser console to verify migration:

### Check Migration Status
```javascript
// Check if migration completed
localStorage.getItem('familyTogether_migrationCompleted');
// Should return: "1.0"
```

### Get DB Stats
```javascript
await window.FamilyTogetherServices.db.getDBStats();
// Expected output:
// {
//   families: 1,
//   members: 3,  (your actual count)
//   tasks: 5,    (your actual count)
//   rewards: 4,  (your actual count)
//   point_transactions: 0,
//   reward_redemptions: 0,
//   sync_queue: 0,
//   pending_sync: 0
// }
```

### Get All Members
```javascript
await window.FamilyTogetherServices.migration.getFamilyMembers();
// Should return array of members in old format:
// [
//   { id: "...", name: "John", isParent: true, points: 100 },
//   { id: "...", name: "Jane", isParent: false, points: 50 }
// ]
```

### Check IndexedDB Directly
```javascript
// Get raw members from IndexedDB
await window.FamilyTogetherServices.db.getAllRecords('members');
// Should return array with sync metadata:
// [
//   {
//     id: "...",
//     family_id: "...",
//     name: "John",
//     role: "parent",
//     total_points: 100,
//     last_modified: 1707738000000,
//     change_id: "...",
//     sync_version: 1,
//     is_deleted: false
//   }
// ]
```

---

## 🚨 Troubleshooting

### Issue: Migration says "No localStorage data found"

**Check if data exists:**
```javascript
localStorage.getItem('familyCleaningTracker');
// Should return JSON string with your data
```

If null, your localStorage data was cleared. You'll need to recreate profiles.

### Issue: Migration runs but IndexedDB still empty

**Check console for errors:**
- Look for red error messages starting with "❌"
- Check if there are errors in `migrationStats.errors` array

**Manually inspect what failed:**
```javascript
// In migration completion log, look for:
// errors: [{entity: "task", name: "...", error: "..."}]
```

### Issue: Profiles appear then disappear

**This means auto-load is running before migration completes.**

Refresh page and check timing:
- Migration should complete BEFORE auto-load runs
- Auto-load now waits 1000ms (increased from 500ms)
- Auto-load checks if IndexedDB has data before loading

### Issue: Tasks show as "0" even though you have tasks

**Your tasks might be stored as an object.**

Check localStorage structure:
```javascript
const data = JSON.parse(localStorage.getItem('familyCleaningTracker'));
console.log('Tasks type:', Array.isArray(data.tasks) ? 'array' : 'object');
console.log('Tasks:', data.tasks);
```

The migration now handles both formats (array and object).

---

## ✅ Success Criteria

Migration is successful if:

1. ✅ Console shows "✅ Migration: Completed successfully"
2. ✅ Migration stats show counts > 0 (families: 1, members: X, tasks: X)
3. ✅ IndexedDB has data in all tables
4. ✅ Each record has sync metadata (last_modified, change_id, etc.)
5. ✅ Profiles visible in UI
6. ✅ Data persists after page reload
7. ✅ No console errors

---

## 📝 What to Report

After testing, please report:

**Success:**
- "Migration worked! X members, Y tasks, Z rewards migrated"
- Screenshot of IndexedDB showing data

**Failure:**
- Console output (copy all migration-related messages)
- Screenshot of IndexedDB (showing empty tables or structure)
- Any error messages

---

## 🔄 Next Steps

Once migration is confirmed working:

1. Continue with TESTING_GUIDE.md tests
2. Test offline functionality
3. Fill out TEST_RESULTS.md
4. Report final testing results

---

**END OF INSTRUCTIONS**
