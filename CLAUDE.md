# CLAUDE.md - Developer Guide
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0
**Date**: February 10, 2026

---

## 🎯 Project Overview

This is a **local-first SaaS platform** with three components:
- **API**: ASP.NET Core 6.0, deployed on Railway.app
- **SPA**: Vanilla JavaScript with IndexedDB, deployed on Netlify
- **WPF**: .NET 6.0 desktop app with SQLite for Windows

**Core Principle**: Data lives on the client first, syncs to cloud when online. Offline functionality is NOT optional - it's the primary design.

---

## 🚀 Quick Start Commands

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd FamilyTogether

# Install .NET SDK 6.0+
# Download from: https://dot.net

# Create .NET solution
dotnet new sln -n FamilyTogether

# Create API project
dotnet new webapi -n FamilyTogether.API
dotnet sln add FamilyTogether.API

# Create WPF project
dotnet new wpf -n FamilyTogether.WPF
dotnet sln add FamilyTogether.WPF

# Install API dependencies
cd FamilyTogether.API
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 6.0.8
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 6.0.12
dotnet add package Microsoft.EntityFrameworkCore.Design --version 6.0.12
dotnet add package Supabase --version 0.9.3

# Install WPF dependencies
cd ../FamilyTogether.WPF
dotnet add package Microsoft.EntityFrameworkCore.Sqlite --version 6.0.12
dotnet add package Microsoft.EntityFrameworkCore.Design --version 6.0.12
dotnet add package Newtonsoft.Json --version 13.0.3

# Create SPA directory structure
mkdir -p FamilyTogether.SPA/src/{services,components,utils,styles}
```

### Development Commands

```bash
# Run API locally
cd FamilyTogether.API
dotnet run
# API available at: https://localhost:5001
# Swagger UI at: https://localhost:5001/swagger

# Run WPF locally (Windows only)
cd FamilyTogether.WPF
dotnet run

# Serve SPA locally
cd FamilyTogether.SPA
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx http-server -p 8000

# Visit: http://localhost:8000
```

### Testing Commands

```bash
# Run API tests
cd FamilyTogether.API.Tests
dotnet test --verbosity normal

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage

# Run WPF tests
cd FamilyTogether.WPF.Tests
dotnet test --verbosity normal

# Run SPA tests (if using Jest)
cd FamilyTogether.SPA
npm test

# Run E2E tests (Playwright)
cd tests/FamilyTogether.E2E
npx playwright test
npx playwright test --headed  # With browser UI
npx playwright show-report    # View results
```

### Database Commands

```bash
# Create Entity Framework migration
cd FamilyTogether.API
dotnet ef migrations add InitialCreate
dotnet ef database update

# Drop database and recreate
dotnet ef database drop
dotnet ef database update

# Generate SQL script from migrations
dotnet ef migrations script > migration.sql

# WPF SQLite migrations
cd FamilyTogether.WPF
dotnet ef migrations add InitialCreate --context AppDbContext
dotnet ef database update --context AppDbContext
```

### Deployment Commands

```bash
# Deploy API to Railway
railway login
railway link
railway up

# Deploy SPA to Netlify
netlify login
netlify deploy --prod --dir=FamilyTogether.SPA

# Build WPF for release
cd FamilyTogether.WPF
dotnet publish --configuration Release --output ./publish --self-contained false

# Create GitHub release
gh release create v1.0.0 ./publish/FamilyTogether-WPF.zip --title "Release v1.0.0"
```

### Utility Commands

```bash
# Check for vulnerable packages
dotnet list package --vulnerable

# Update all NuGet packages
dotnet list package --outdated
dotnet add package <PackageName> --version <NewVersion>

# Format code
dotnet format

# Clean build artifacts
dotnet clean
rm -rf bin/ obj/

# View Railway logs
railway logs --tail 100

# View Netlify logs
netlify logs
```

---

## 📝 Code Style Rules

### C# (.NET API & WPF)

**Naming Conventions**:
```csharp
// Classes: PascalCase
public class TaskService { }

// Interfaces: IPascalCase
public interface ITaskService { }

// Methods: PascalCase
public async Task<TaskEntity> CreateTaskAsync() { }

// Private fields: _camelCase
private readonly ILogger<TaskService> _logger;

// Parameters & locals: camelCase
public void ProcessTask(Guid taskId) { }

// Constants: PascalCase
public const int MaxTasksPerSync = 100;

// Async methods: MUST end with "Async"
public async Task<bool> ValidateUserAsync(Guid userId) { }
```

**Entity Framework Conventions**:
```csharp
// Entity classes inherit from BaseEntity
public class TaskEntity : BaseEntity
{
    // Navigation properties: virtual
    public virtual Family? Family { get; set; }

    // Required fields: [Required] attribute
    [Required]
    public string Title { get; set; } = string.Empty;

    // Max length: [MaxLength] attribute
    [MaxLength(500)]
    public string? Description { get; set; }
}

// Always use .ToListAsync(), .FirstOrDefaultAsync(), etc.
var tasks = await _context.Tasks
    .Where(t => t.FamilyId == familyId)
    .ToListAsync();  // NOT .ToList()

// Global query filters MUST check is_deleted
modelBuilder.Entity<TaskEntity>()
    .HasQueryFilter(e => !e.IsDeleted);
```

**Controller Conventions**:
```csharp
// All controllers inherit from BaseController
public class TasksController : BaseController
{
    // Use dependency injection in constructor
    private readonly ITaskService _taskService;
    private readonly ILogger<TasksController> _logger;

    // All endpoints EXCEPT register/login require [Authorize]
    [HttpPost]
    [Authorize]  // <-- REQUIRED
    public async Task<IActionResult> CreateTask() { }

    // Use helper methods for responses
    return SuccessResponse(data, "Task created");
    return ErrorResponse("Invalid input", 400);

    // Get user ID from JWT
    var userId = GetUserId();

    // Always log important actions
    _logger.LogInformation("Task created by user {UserId}", userId);
}
```

**Async/Await Rules**:
```csharp
// ALWAYS await async methods
var result = await _taskService.CreateTaskAsync();

// NEVER use .Result or .Wait()
// BAD: var result = _taskService.CreateTaskAsync().Result;

// ConfigureAwait(false) NOT needed in ASP.NET Core

// Wrap in try-catch
try
{
    await _taskService.CreateTaskAsync();
}
catch (Exception ex)
{
    _logger.LogError(ex, "Operation failed");
    throw;  // Re-throw to let middleware handle
}
```

### JavaScript (SPA)

**Naming Conventions**:
```javascript
// Variables & functions: camelCase
const taskService = new TaskService();
function createTask() { }

// Classes: PascalCase
class TaskService { }

// Constants: UPPER_SNAKE_CASE
const MAX_TASKS_PER_SYNC = 100;

// Private fields: #camelCase (ES2022+)
class TaskService {
    #apiUrl;
    #authToken;
}

// Async functions: async keyword required
async function createTask() {
    await db.add('tasks', task);
}
```

**IndexedDB Conventions**:
```javascript
// Always use try-catch with IndexedDB
try {
    await db.add('tasks', task);
} catch (error) {
    console.error('Failed to save task:', error);
    throw error;
}

// Object store names: lowercase with underscores
const stores = {
    tasks: 'tasks',
    sync_queue: 'sync_queue'
};

// Always queue changes for sync
await db.add('tasks', task);
await db.queueSync('create', 'tasks', task.id, task);

// Use descriptive index names
tasksStore.createIndex('family_id', 'family_id', { unique: false });
```

**API Client Conventions**:
```javascript
// Always include Authorization header
const response = await fetch(`${apiUrl}/api/sync`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(payload)
});

// Always check response.ok
if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
}

// Handle network errors
try {
    await apiClient.post('/api/sync', data);
} catch (error) {
    if (!navigator.onLine) {
        // Queue for later sync
    } else {
        throw error;
    }
}
```

**Sync Conventions**:
```javascript
// Sync operations MUST be idempotent
// Last-Write-Wins is the conflict resolution strategy

// Always include timestamps
const task = {
    id: generateUUID(),
    last_modified: Date.now(),
    change_id: generateUUID(),
    sync_version: 1
};

// Increment sync_version on updates
task.sync_version++;
task.last_modified = Date.now();
```

---

## 🧪 Testing Instructions

### Test Coverage Requirements

- **API**: 80%+ coverage on services and repositories
- **SPA**: 70%+ coverage on services and utilities
- **WPF**: 70%+ coverage on ViewModels and services

### API Testing (xUnit)

```bash
# Run all tests
dotnet test

# Run specific test class
dotnet test --filter "FullyQualifiedName~TaskServiceTests"

# Run with code coverage
dotnet test --collect:"XPlat Code Coverage"

# Generate coverage report
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:"coverage/**/coverage.cobertura.xml" -targetdir:"coverage/report"
```

**Test Structure**:
```csharp
public class TaskServiceTests
{
    // Use descriptive test names: MethodName_Scenario_ExpectedResult
    [Fact]
    public async Task CreateTask_WithValidData_ShouldSucceed()
    {
        // Arrange
        var mockRepo = new Mock<ITaskRepository>();
        var service = new TaskService(mockRepo.Object);

        // Act
        var result = await service.CreateTaskAsync(validTask);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test Task", result.Title);
    }

    // Test exception scenarios
    [Fact]
    public async Task CreateTask_WithNullTitle_ShouldThrowException()
    {
        // Arrange & Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateTaskAsync(invalidTask)
        );
    }
}
```

### SPA Testing (Jest - if used)

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- taskService.test.js

# Watch mode
npm test -- --watch
```

**Test Structure**:
```javascript
describe('TaskService', () => {
    let taskService;

    beforeEach(() => {
        taskService = new TaskService();
    });

    test('createTask should save to IndexedDB', async () => {
        const task = { title: 'Test Task' };

        const result = await taskService.createTask(task);

        expect(result).toBeDefined();
        expect(result.id).toBeTruthy();
    });

    test('createTask should queue for sync', async () => {
        const task = { title: 'Test Task' };

        await taskService.createTask(task);

        const syncQueue = await db.getAll('sync_queue');
        expect(syncQueue.length).toBeGreaterThan(0);
    });
});
```

### E2E Testing (Playwright)

```bash
# Run all E2E tests
npx playwright test

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/auth.spec.js

# Debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

### Critical Test Scenarios

**MUST TEST**:
1. **Offline → Online Sync**: Create data offline, verify syncs when online
2. **Conflict Resolution**: Two devices edit same record, verify Last-Write-Wins
3. **Authentication Flow**: Register → Login → Logout → Token refresh
4. **Authorization**: User cannot access other family's data
5. **Sync Queue**: Changes queued offline, cleared after successful sync

---

## 🌳 Repository Etiquette

### Branch Naming

```bash
# Feature branches
feature/task-creation
feature/sync-implementation
feature/offline-mode

# Bug fixes
fix/sync-conflict-resolution
fix/auth-token-refresh

# Hotfixes
hotfix/critical-sync-bug
hotfix/security-patch

# Releases
release/v1.0.0
release/v1.1.0
```

### Commit Message Convention

```bash
# Format: <type>: <description>

# Types:
feat: Add task approval functionality
fix: Resolve sync conflict issue
docs: Update API documentation
test: Add unit tests for TaskService
refactor: Simplify conflict resolution logic
chore: Update dependencies
style: Format code with dotnet format
perf: Optimize database queries

# Examples:
git commit -m "feat: Implement Last-Write-Wins conflict resolution"
git commit -m "fix: Handle network errors during sync"
git commit -m "test: Add E2E tests for offline mode"
```

### Pull Request Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/task-creation
   ```

2. **Make Changes & Commit**
   ```bash
   git add .
   git commit -m "feat: Add task creation endpoint"
   ```

3. **Push to Remote**
   ```bash
   git push origin feature/task-creation
   ```

4. **Create Pull Request**
   - Title: Clear, descriptive (e.g., "Add task creation functionality")
   - Description: What, why, how
   - Link to related issues
   - Add screenshots if UI changes

5. **PR Checklist** (include in PR template):
   ```markdown
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] No console errors/warnings
   - [ ] Tested offline functionality
   - [ ] Code formatted (dotnet format)
   - [ ] No secrets committed
   ```

6. **Merge Strategy**
   - Use "Squash and merge" for feature branches
   - Use "Rebase and merge" for hotfixes
   - Delete branch after merge

### Git Workflow

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/new-feature

# Work on feature...

# Before pushing, rebase on latest main
git fetch origin
git rebase origin/main

# Resolve conflicts if any
git add .
git rebase --continue

# Push
git push origin feature/new-feature

# After PR merged, delete local branch
git checkout main
git pull origin main
git branch -d feature/new-feature
```

---

## 🏗️ Architectural Decisions

### 1. Local-First Architecture (NON-NEGOTIABLE)

**Key Principle**: Data MUST live on the client first. Cloud is for sync only.

```
Client (Source of Truth) → Cloud (Sync & Backup) → Other Clients
```

**Implementation Requirements**:
- All CRUD operations work offline
- Sync is background, non-blocking
- UI never waits for API calls (except auth)
- Optimistic updates always

**Example - Creating a Task**:
```javascript
// CORRECT: Immediate local save, async sync
async function createTask(taskData) {
    // 1. Save locally (instant)
    await db.add('tasks', task);

    // 2. Update UI immediately
    updateTaskList();

    // 3. Queue for background sync
    await db.queueSync('create', 'tasks', task.id, task);

    // 4. Sync happens in background
    // User doesn't wait
}

// INCORRECT: Wait for API
async function createTask(taskData) {
    // BAD: User waits for network
    await apiClient.post('/api/tasks', taskData);
    await db.add('tasks', task);  // This is backwards!
}
```

### 2. Conflict Resolution: Last-Write-Wins

**Strategy**: Server compares `last_modified` timestamps. Newest wins.

```csharp
// Server-side conflict resolution
if (clientData.LastModified > serverData.LastModified)
{
    // Client wins - apply client changes
    ApplyClientChanges(clientData);
}
else
{
    // Server wins - reject client changes, send server data back
    return ConflictResponse(serverData);
}
```

**Client Behavior**:
```javascript
// Client receives conflict response
if (rejected.status === 'conflict') {
    // Accept server version (Last-Write-Wins)
    await db.put(storeName, rejected.server_data);

    // Remove from sync queue
    await db.delete('sync_queue', queueItem.id);

    console.warn('Conflict resolved: server wins');
}
```

### 3. Sync Protocol

**Sync Request**:
```json
{
  "client_type": "spa",
  "last_sync_timestamp": 1707559200000,
  "changes": [
    {
      "table_name": "tasks",
      "operation": "create",
      "record_id": "uuid",
      "data": { ... }
    }
  ]
}
```

**Sync Response**:
```json
{
  "sync_timestamp": 1707559500000,
  "accepted_changes": [...],
  "rejected_changes": [...],
  "server_changes": [...]
}
```

**Sync Rules**:
- Max 100 changes per sync request
- Sync every 30 seconds when online
- Sync on `online` event
- Batch all pending changes

### 4. Authentication Flow

**Supabase Auth** handles user management, **API** handles family/member data.

```javascript
// Registration flow
1. Create auth user (Supabase)
2. Get JWT token
3. Call API to create family & member
4. Store token locally
5. Initialize sync

// Login flow
1. Login with Supabase
2. Get JWT token
3. Call API for user profile
4. Store token locally
5. Start sync manager
```

### 5. Database Schema Parity

**CRITICAL**: All three databases MUST have identical logical schemas.

- PostgreSQL (Supabase): Source of truth
- SQLite (WPF): Local replica
- IndexedDB (SPA): Local replica

**Sync Metadata** (on all tables):
```
- last_modified: BIGINT (Unix timestamp in milliseconds)
- change_id: UUID (unique per change)
- sync_version: INTEGER (incremented on each change)
- is_deleted: BOOLEAN (soft delete flag)
```

### 6. Technology Stack (FIXED)

**DO NOT CHANGE** without approval:
- Backend: ASP.NET Core 6.0
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- API Hosting: Railway.app
- SPA Hosting: Netlify
- SPA Storage: IndexedDB
- WPF Storage: SQLite
- Conflict Resolution: Last-Write-Wins

---

## ⚠️ Common Gotchas

### 1. Sync Loop Prevention

**Problem**: Client change syncs to server, server sends it back, client syncs again → infinite loop

**Solution**: Check `change_id` before queuing
```javascript
async function applyServerChange(change) {
    const existing = await db.get(storeName, change.record_id);

    // Don't queue if this is the same change
    if (existing && existing.change_id === change.data.change_id) {
        // Just update, don't queue
        await db.put(storeName, change.data);
        return;  // DON'T call queueSync
    }

    await db.put(storeName, change.data);
}
```

### 2. Entity Framework Tracking Issues

**Problem**: EF Core tracks entities, causing conflicts

**Solution**: Use `AsNoTracking()` for read-only queries
```csharp
// Read-only query
var tasks = await _context.Tasks
    .AsNoTracking()  // <-- Important for performance
    .Where(t => t.FamilyId == familyId)
    .ToListAsync();

// Update existing entity
var task = await _context.Tasks.FindAsync(taskId);
task.Status = "completed";
await _context.SaveChangesAsync();  // EF tracks this
```

### 3. JWT Token Expiry

**Problem**: Token expires (60 minutes), API calls fail

**Solution**: Refresh before expiry or handle 401 globally
```javascript
// Check token expiry before API calls
function isTokenExpired(token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
}

// Refresh if needed
if (isTokenExpired(authToken)) {
    authToken = await authService.refreshToken();
}
```

### 4. IndexedDB Transaction Modes

**Problem**: Wrong transaction mode causes errors

**Solution**: Use correct mode
```javascript
// Read operations: 'readonly'
const tx = db.transaction('tasks', 'readonly');
const tasks = await tx.objectStore('tasks').getAll();

// Write operations: 'readwrite'
const tx = db.transaction('tasks', 'readwrite');
await tx.objectStore('tasks').add(task);

// Multiple stores
const tx = db.transaction(['tasks', 'sync_queue'], 'readwrite');
```

### 5. Supabase RLS Policies

**Problem**: Queries fail silently due to RLS policies

**Solution**: Always include family_id validation
```sql
-- Ensure RLS policy includes family check
CREATE POLICY "Users can view family tasks"
ON tasks FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = tasks.family_id
        AND members.user_id = auth.uid()
    )
);
```

### 6. Railway Environment Variables

**Problem**: Environment variables not loading

**Solution**: Use Railway CLI or dashboard, NOT .env files
```bash
# Set via CLI
railway variables set SUPABASE_URL=https://xxxxx.supabase.co

# Or in Railway Dashboard → Variables
```

### 7. CORS Issues

**Problem**: SPA cannot call API

**Solution**: Configure CORS properly in API
```csharp
// In Program.cs
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(builder.Configuration["Cors:AllowedOrigins"])
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// USE before UseAuthorization
app.UseCors();
app.UseAuthorization();
```

### 8. WPF SQLite Database Path

**Problem**: Database file not found

**Solution**: Use AppData folder
```csharp
var databasePath = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
    "FamilyTogether",
    "app.db"
);

// Ensure directory exists
Directory.CreateDirectory(Path.GetDirectoryName(databasePath));
```

### 9. Async Void Methods

**Problem**: Exceptions in async void methods crash the app

**Solution**: NEVER use async void except for event handlers
```csharp
// BAD
private async void LoadTasks()
{
    await _taskService.GetTasksAsync();
}

// GOOD
private async Task LoadTasksAsync()
{
    await _taskService.GetTasksAsync();
}

// EXCEPTION: Event handlers
private async void Button_Click(object sender, EventArgs e)
{
    try
    {
        await LoadTasksAsync();
    }
    catch (Exception ex)
    {
        // MUST catch exceptions in async void
        _logger.LogError(ex, "Failed to load tasks");
    }
}
```

### 10. Soft Deletes in Queries

**Problem**: Deleted records appear in results

**Solution**: Always filter by `is_deleted = false` OR use global query filter
```csharp
// Option 1: Manual filter (tedious)
var tasks = await _context.Tasks
    .Where(t => !t.IsDeleted)
    .ToListAsync();

// Option 2: Global query filter (recommended)
modelBuilder.Entity<TaskEntity>()
    .HasQueryFilter(e => !e.IsDeleted);

// Now this automatically excludes deleted
var tasks = await _context.Tasks.ToListAsync();
```

---

## 🔧 Developer Environment Quirks

### Windows-Specific (WPF)

- WPF requires Windows OS - cannot build on Mac/Linux
- Use Visual Studio 2022 or VS Code with C# extension
- SQLite database stores in `%APPDATA%\FamilyTogether\`
- Requires .NET 6.0 Desktop Runtime

### Railway Deployment

- Uses Nixpacks builder (automatic .NET detection)
- Environment variables set via CLI or dashboard
- Logs accessed via `railway logs` command
- Free tier: $5 credit/month, 512MB RAM
- Health check endpoint MUST be `/health`

### Netlify Deployment

- Vanilla JS requires NO build step
- Redirects configured in `netlify.toml`
- Environment variables prefixed with `VITE_` or custom
- Free tier: 100GB bandwidth, 300 build minutes
- Deploy previews for PRs automatically created

### Supabase Quirks

- RLS policies MUST be correct or queries silently fail
- Connection pooling: max 60 connections on free tier
- JWT secret changes require API redeployment
- Anonymous key is PUBLIC - safe to expose
- Service role key is SECRET - never expose to client

---

## 📚 Essential Documentation References

When working on this project, refer to these documents IN ORDER:

1. **First Time Setup**: `Development_Setup_Guide.md`
2. **Understanding Architecture**: `Technical_Architecture_Document.md`
3. **Code Templates**: `Code_Scaffolding_Templates.md`
4. **Implementation Guidance**: `Code_Examples_Practical.md`
5. **Deployment**: `Deployment_Checklists_Scripts.md`
6. **Security**: `Security_Checklist.md`
7. **Testing**: `Testing_Strategy_Document.md`
8. **API Reference**: `API_Specification.md`

---

## 🚨 Critical Rules for AI Assistants

### DO:
- ✅ Read existing documentation before coding
- ✅ Follow local-first architecture principles
- ✅ Always queue changes for sync
- ✅ Include error handling and logging
- ✅ Write tests for new functionality
- ✅ Use async/await properly
- ✅ Validate inputs server-side
- ✅ Check user authorization on every API call
- ✅ Handle offline scenarios gracefully
- ✅ Follow naming conventions strictly

### DON'T:
- ❌ Invent new features not in PRD
- ❌ Change technology stack without approval
- ❌ Add external services/libraries without approval
- ❌ Make UI wait for API calls (except auth)
- ❌ Use client-side only authorization
- ❌ Commit secrets or credentials
- ❌ Skip error handling
- ❌ Use synchronous database operations
- ❌ Ignore offline functionality
- ❌ Hard-code configuration values

### When in Doubt:
1. Check the documentation first
2. Look at existing code examples
3. Ask for clarification
4. Default to the safest, most secure option

---

## 🎯 Success Criteria

Your implementation is correct if:

1. **Works offline**: All CRUD operations function without internet
2. **Syncs properly**: Changes sync when online, conflicts resolve
3. **Secure**: Authentication required, authorization enforced
4. **Fast**: UI operations feel instant (no network waiting)
5. **Tested**: Tests pass, coverage meets requirements
6. **Consistent**: Follows code style and conventions
7. **Documented**: Comments explain non-obvious behavior
8. **Logged**: Important operations logged appropriately

---

## 📞 Getting Help

- **Documentation**: Check the 16 documentation files in this repository
- **Architecture Questions**: Refer to `Technical_Architecture_Document.md`
- **API Questions**: Refer to `API_Specification.md`
- **Security Questions**: Refer to `Security_Checklist.md`
- **Deployment Issues**: Refer to `Deployment_Checklists_Scripts.md`

---

**END OF CLAUDE.md**

**Remember**: This is a local-first platform. If you're not sure whether something should work offline, the answer is YES - it must work offline.
