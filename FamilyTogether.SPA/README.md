# FamilyTogether SPA - Phase 2

**Status**: Core Services Implemented ✅
**Deployment**: https://familytogether-chores.netlify.app

---

## Phase 2 Progress

### ✅ Completed Services

1. **IndexedDB Service** (`src/services/db.js`)
   - 7 object stores (families, members, tasks, points, rewards, redemptions, sync_queue)
   - CRUD operations with sync metadata
   - Soft delete support
   - Query by index functionality

2. **API Client** (`src/services/api.js`)
   - Communicates with Railway API: https://charming-magic-production.up.railway.app
   - Authentication, Family, Tasks, Points, Rewards, Sync endpoints
   - Automatic token handling
   - Timeout and error handling

3. **Authentication Service** (`src/services/auth.js`)
   - Supabase Auth integration
   - JWT token management in localStorage
   - Auto-refresh functionality
   - Register, Login, Logout flows

4. **SyncManager** (`src/services/sync.js`)
   - Background sync every 30 seconds
   - Offline queue management
   - Last-Write-Wins conflict resolution
   - Online/offline event listeners
   - Prevents sync loops

5. **Configuration** (`src/services/config.js`)
   - Supabase credentials
   - API URLs (production/local)
   - Feature flags
   - Debug mode

---

## Architecture

### Hybrid Storage Approach

```
┌─────────────────┐
│  localStorage   │ ← Auth tokens, settings, preferences
└─────────────────┘

┌─────────────────┐
│   IndexedDB     │ ← Application data (tasks, rewards, etc.)
└─────────────────┘

┌─────────────────┐
│  Railway API    │ ← Cloud sync & multi-device support
└─────────────────┘

┌─────────────────┐
│ Supabase Auth   │ ← User authentication
└─────────────────┘
```

### Data Flow

1. **User Action** (create/update/delete)
2. **Save to IndexedDB** (immediate, offline-first)
3. **Queue for Sync** (add to sync_queue)
4. **Background Sync** (every 30s when online)
5. **Apply Server Changes** (conflict resolution)

---

## Next Steps

### 🔨 Integration Required

The services are built but need to be wired into `index.html`:

1. **Add Supabase CDN Script**
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```

2. **Import Services as ES Modules**
   ```html
   <script type="module">
     import { initDB } from './src/services/db.js';
     import { initAuth, register, login } from './src/services/auth.js';
     import { initSyncManager } from './src/services/sync.js';
     import { initSupabase } from './src/services/config.js';

     // Initialize on page load
     async function init() {
       initSupabase();
       await initDB();
       const authenticated = await initAuth();
       if (authenticated) {
         initSyncManager();
       }
     }

     init();
   </script>
   ```

3. **Update CRUD Operations**
   - Replace localStorage calls with IndexedDB
   - Add queueSync() after each change
   - Example:
     ```javascript
     // OLD: localStorage
     function createTask(task) {
       tasks.push(task);
       saveToStorage();
     }

     // NEW: IndexedDB + Sync
     async function createTask(task) {
       const saved = await addRecord('tasks', task);
       await queueSync('create', 'tasks', saved.id, saved);
       await refreshUI();
     }
     ```

4. **Add Sync Status UI**
   - Online/offline indicator
   - Pending changes count
   - Last sync timestamp
   - Manual sync button

5. **Update Authentication UI**
   - Use new auth.js functions
   - Handle Supabase registration/login
   - Show loading states

---

## File Structure

```
FamilyTogether.SPA/
├── index.html                  (existing UI - needs integration)
├── netlify.toml                (✅ deployment config)
├── README.md                   (this file)
└── src/
    └── services/
        ├── db.js               (✅ IndexedDB)
        ├── api.js              (✅ Railway API client)
        ├── auth.js             (✅ Supabase auth)
        ├── sync.js             (✅ SyncManager)
        └── config.js           (✅ Configuration)
```

---

## Testing Checklist

Once integrated, test these scenarios:

- [ ] Register new user (Supabase + Railway)
- [ ] Login existing user
- [ ] Create task offline → appears in IndexedDB
- [ ] Create task offline → queued for sync
- [ ] Go online → auto-sync within 30s
- [ ] Verify task in Railway API
- [ ] Create task on device A → appears on device B
- [ ] Edit same task on both devices → Last-Write-Wins
- [ ] Check sync status UI shows pending changes
- [ ] Manual sync button triggers immediate sync
- [ ] Offline indicator shows when disconnected

---

## API Endpoints Available

**Base URL**: https://charming-magic-production.up.railway.app

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/profile`

### Family
- `GET /api/family`
- `GET /api/family/{id}`
- `POST /api/family`
- `POST /api/family/{id}/members`

### Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`
- `POST /api/tasks/{id}/complete`
- `POST /api/tasks/{id}/approve`
- `POST /api/tasks/{id}/reject`

### Sync
- `POST /api/sync`

---

## Deployment

### Netlify
```bash
# Deploy to Netlify
cd FamilyTogether.SPA
netlify deploy --prod --dir=.
```

### Configuration
- No build step required (vanilla JS)
- ES modules enabled
- SPA routing configured
- Security headers added

---

## Troubleshooting

### "Supabase not defined"
- Add Supabase CDN script to `<head>`
- Ensure it loads before ES modules

### "IndexedDB quota exceeded"
- Check browser storage settings
- Clear old data: `clearAllData()` in console

### "Sync not working"
- Check network tab for API calls
- Verify auth token in localStorage
- Check Railway API health: `/health`

### "CORS errors"
- Verify Railway API CORS settings
- Ensure correct API URL in config.js

---

## Debug Commands

Open browser console and run:

```javascript
// Check sync status
const syncManager = getSyncManager();
const status = await syncManager.getSyncStatus();
console.log(status);

// View IndexedDB stats
const stats = await getDBStats();
console.log(stats);

// Force immediate sync
await syncManager.forceSync();

// View environment info
import { getEnvironmentInfo } from './src/services/config.js';
console.log(getEnvironmentInfo());

// Enable debug mode
setDebugMode(true);
```

---

## Phase 2 Completion Criteria

- [✅] IndexedDB service implemented
- [✅] API client service implemented
- [✅] Auth service implemented
- [✅] SyncManager implemented
- [✅] Configuration file created
- [✅] Netlify config created
- [ ] Services integrated into index.html
- [ ] UI updated with sync indicators
- [ ] CRUD operations use IndexedDB
- [ ] Offline/online testing complete
- [ ] Deployed to Netlify

---

**Next Task**: Integrate services into index.html and update UI
