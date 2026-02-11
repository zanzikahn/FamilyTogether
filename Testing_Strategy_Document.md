# Testing Strategy Document
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0  
**Date**: February 10, 2026  
**Status**: Pre-Development

---

## Table of Contents
1. [Testing Overview](#testing-overview)
2. [Unit Testing Strategy](#unit-testing-strategy)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Offline Testing Scenarios](#offline-testing-scenarios)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Test Data Management](#test-data-management)

---

## Testing Overview

### Testing Pyramid

```
                  ▲
                 ╱ ╲
                ╱ E2E╲          10% - End-to-End Tests
               ╱───────╲         (Playwright, Manual)
              ╱         ╲
             ╱Integration╲      30% - Integration Tests
            ╱─────────────╲     (API + Database)
           ╱               ╲
          ╱   Unit Tests    ╲   60% - Unit Tests
         ╱───────────────────╲  (xUnit, Jest)
        ╱_____________________╲
```

### Testing Principles

1. **Test Early, Test Often**: Write tests alongside code
2. **Fast Feedback**: Unit tests run in <5 seconds
3. **Isolated Tests**: Each test independent
4. **Realistic Data**: Use realistic test data
5. **Continuous Integration**: Tests run on every commit

### Coverage Goals

| Component | Unit Tests | Integration Tests | E2E Tests | Target Coverage |
|-----------|-----------|-------------------|-----------|-----------------|
| **API** | Services, Repositories | Controllers + DB | Full flows | 80%+ |
| **SPA** | Services, Utils | API integration | User workflows | 70%+ |
| **WPF** | ViewModels, Services | Sync + DB | User workflows | 70%+ |

---

## Unit Testing Strategy

### API Unit Tests (xUnit + C#)

**Framework**: xUnit + Moq + FluentAssertions

**Setup**:
```bash
cd FamilyTogether.API
dotnet new xunit -n FamilyTogether.API.Tests
cd FamilyTogether.API.Tests
dotnet add package Moq
dotnet add package FluentAssertions
dotnet add reference ../FamilyTogether.API/FamilyTogether.API.csproj
```

**Test Structure**:
```
FamilyTogether.API.Tests/
├── Services/
│   ├── TaskServiceTests.cs
│   ├── PointsServiceTests.cs
│   └── SyncServiceTests.cs
├── Repositories/
│   ├── TaskRepositoryTests.cs
│   └── PointTransactionRepositoryTests.cs
├── Helpers/
│   └── ConflictResolverTests.cs
└── Fixtures/
    └── DatabaseFixture.cs
```

**Example Test**: Task Service

```csharp
public class TaskServiceTests
{
    private readonly Mock<ITaskRepository> _taskRepoMock;
    private readonly Mock<IPointsService> _pointsServiceMock;
    private readonly TaskService _sut;  // System Under Test
    
    public TaskServiceTests()
    {
        _taskRepoMock = new Mock<ITaskRepository>();
        _pointsServiceMock = new Mock<IPointsService>();
        _sut = new TaskService(_taskRepoMock.Object, _pointsServiceMock.Object);
    }
    
    [Fact]
    public async Task ApproveTask_WithValidTask_ShouldUpdateStatusAndAwardPoints()
    {
        // Arrange
        var taskId = Guid.NewGuid();
        var reviewerId = Guid.NewGuid();
        var task = new TaskEntity
        {
            Id = taskId,
            Status = TaskStatus.AwaitingApproval,
            Points = 20,
            AssignedTo = Guid.NewGuid()
        };
        
        _taskRepoMock
            .Setup(x => x.GetByIdAsync(taskId))
            .ReturnsAsync(task);
        
        // Act
        var result = await _sut.ApproveTaskAsync(taskId, reviewerId, "Good job!");
        
        // Assert
        result.Status.Should().Be(TaskStatus.Approved);
        result.ReviewedBy.Should().Be(reviewerId);
        result.ReviewNote.Should().Be("Good job!");
        
        _taskRepoMock.Verify(x => x.UpdateTaskAsync(It.IsAny<TaskEntity>()), Times.Once);
        _pointsServiceMock.Verify(x => x.AwardPointsAsync(task.AssignedTo, 20, taskId), Times.Once);
    }
    
    [Fact]
    public async Task ApproveTask_WithNotAwaitingApproval_ShouldThrowException()
    {
        // Arrange
        var task = new TaskEntity { Status = TaskStatus.Pending };
        _taskRepoMock.Setup(x => x.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(task);
        
        // Act
        Func<Task> act = async () => await _sut.ApproveTaskAsync(Guid.NewGuid(), Guid.NewGuid(), "");
        
        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not awaiting approval*");
    }
}
```

**Example Test**: Conflict Resolver

```csharp
public class ConflictResolverTests
{
    [Theory]
    [InlineData(150, 100, true)]   // Client newer: client wins
    [InlineData(100, 150, false)]  // Server newer: server wins
    [InlineData(100, 100, true)]   // Equal: client wins (tie-breaker)
    public void ResolveConflict_LastWriteWins_ShouldReturnCorrectWinner(
        long clientTimestamp,
        long serverTimestamp,
        bool clientShouldWin)
    {
        // Arrange
        var clientData = new { last_modified = clientTimestamp };
        var serverData = new { last_modified = serverTimestamp };
        var resolver = new ConflictResolver();
        
        // Act
        var result = resolver.Resolve(clientData, serverData);
        
        // Assert
        result.ClientWins.Should().Be(clientShouldWin);
        result.ServerWins.Should().Be(!clientShouldWin);
    }
}
```

### SPA Unit Tests (Jest + JavaScript)

**Framework**: Jest

**Setup**:
```bash
cd FamilyTogether.SPA
npm install --save-dev jest @testing-library/jest-dom
```

**package.json**:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Test Structure**:
```
FamilyTogether.SPA/
├── tests/
│   ├── services/
│   │   ├── db.test.js
│   │   ├── sync.test.js
│   │   └── auth.test.js
│   └── utils/
│       ├── validators.test.js
│       └── uuid.test.js
```

**Example Test**: UUID Generator

```javascript
import { generateUUID, isValidUUID } from '../src/utils/uuid.js';

describe('UUID Utilities', () => {
    test('generateUUID should create valid UUID', () => {
        const uuid = generateUUID();
        
        expect(uuid).toBeDefined();
        expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
    
    test('isValidUUID should validate UUIDs correctly', () => {
        const validUUID = '550e8400-e29b-41d4-a716-446655440000';
        const invalidUUID = 'not-a-uuid';
        
        expect(isValidUUID(validUUID)).toBe(true);
        expect(isValidUUID(invalidUUID)).toBe(false);
    });
});
```

**Example Test**: Sync Manager

```javascript
import { SyncManager } from '../src/services/sync.js';

describe('SyncManager', () => {
    let syncManager;
    let mockDb;
    let mockFetch;
    
    beforeEach(() => {
        mockDb = {
            syncQueue: {
                where: jest.fn().mockReturnThis(),
                equals: jest.fn().mockReturnThis(),
                toArray: jest.fn()
            }
        };
        
        mockFetch = jest.fn();
        global.fetch = mockFetch;
        
        syncManager = new SyncManager(mockDb, 'http://api.test', 'fake-token');
    });
    
    test('sync should not run when offline', async () => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        
        await syncManager.sync();
        
        expect(mockFetch).not.toHaveBeenCalled();
    });
    
    test('sync should send pending changes to server', async () => {
        const pendingChanges = [
            { id: 1, table_name: 'tasks', operation: 'create', data_json: '{}' }
        ];
        
        mockDb.syncQueue.toArray.mockResolvedValue(pendingChanges);
        mockFetch.mockResolvedValue({
            json: async () => ({ accepted_changes: [{ record_id: '1', status: 'accepted' }] })
        });
        
        await syncManager.sync();
        
        expect(mockFetch).toHaveBeenCalledWith(
            'http://api.test/api/sync',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer fake-token'
                })
            })
        );
    });
});
```

### WPF Unit Tests (xUnit + C#)

**Framework**: xUnit + Moq

**Test Structure**:
```
FamilyTogether.WPF.Tests/
├── ViewModels/
│   ├── MainViewModelTests.cs
│   └── TasksViewModelTests.cs
├── Services/
│   ├── SyncServiceTests.cs
│   └── TaskServiceTests.cs
```

**Example Test**: TasksViewModel

```csharp
public class TasksViewModelTests
{
    private readonly Mock<ITaskService> _taskServiceMock;
    private readonly TasksViewModel _sut;
    
    public TasksViewModelTests()
    {
        _taskServiceMock = new Mock<ITaskService>();
        _sut = new TasksViewModel(_taskServiceMock.Object);
    }
    
    [Fact]
    public async Task LoadTasks_ShouldPopulateTasksCollection()
    {
        // Arrange
        var tasks = new List<TaskEntity>
        {
            new TaskEntity { Id = Guid.NewGuid(), Title = "Task 1" },
            new TaskEntity { Id = Guid.NewGuid(), Title = "Task 2" }
        };
        
        _taskServiceMock
            .Setup(x => x.GetTasksAsync())
            .ReturnsAsync(tasks);
        
        // Act
        await _sut.LoadTasksCommand.ExecuteAsync(null);
        
        // Assert
        _sut.Tasks.Should().HaveCount(2);
        _sut.Tasks.First().Title.Should().Be("Task 1");
    }
}
```

---

## Integration Testing

### API Integration Tests

**Setup**: Use in-memory SQLite database

```csharp
public class TasksControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;
    
    public TasksControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove real database
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                services.Remove(descriptor);
                
                // Add in-memory database
                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDb");
                });
            });
        });
        
        _client = _factory.CreateClient();
    }
    
    [Fact]
    public async Task CreateTask_WithValidData_ShouldReturn201()
    {
        // Arrange
        var createRequest = new
        {
            title = "Test Task",
            description = "Test description",
            points = 10,
            assigned_to = Guid.NewGuid()
        };
        
        // Act
        var response = await _client.PostAsJsonAsync("/api/tasks", createRequest);
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var task = await response.Content.ReadFromJsonAsync<TaskResponse>();
        task.Should().NotBeNull();
        task.Title.Should().Be("Test Task");
    }
}
```

---

## End-to-End Testing

### Playwright Tests (SPA)

**Setup**:
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**playwright.config.js**:
```javascript
export default {
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:8000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    port: 8000
  }
};
```

**E2E Test**: Complete Task Flow

```javascript
import { test, expect } from '@playwright/test';

test.describe('Task Management Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        
        // Login
        await page.fill('[data-testid="email"]', 'test@example.com');
        await page.fill('[data-testid="password"]', 'Password123!');
        await page.click('[data-testid="login-btn"]');
        
        await page.waitForURL('/dashboard');
    });
    
    test('should create, complete, and approve task', async ({ page }) => {
        // Create task
        await page.click('[data-testid="create-task-btn"]');
        await page.fill('[data-testid="task-title"]', 'Clean room');
        await page.fill('[data-testid="task-points"]', '20');
        await page.click('[data-testid="save-task-btn"]');
        
        await expect(page.locator('text=Clean room')).toBeVisible();
        
        // Complete task
        await page.click('[data-testid="task-item"]:has-text("Clean room")');
        await page.click('[data-testid="complete-btn"]');
        await page.fill('[data-testid="completion-note"]', 'All done!');
        await page.click('[data-testid="submit-completion-btn"]');
        
        await expect(page.locator('text=Awaiting Approval')).toBeVisible();
        
        // Approve task (as parent)
        await page.click('[data-testid="approve-btn"]');
        await page.fill('[data-testid="review-note"]', 'Great job!');
        await page.click('[data-testid="submit-approval-btn"]');
        
        await expect(page.locator('text=Approved')).toBeVisible();
        await expect(page.locator('[data-testid="points-balance"]')).toHaveText('20');
    });
});
```

---

## Offline Testing Scenarios

### Critical Offline Test Scenarios

#### Scenario 1: Offline Create Then Sync

**Steps**:
1. Disconnect from network
2. Create new task
3. Verify task saved locally (IndexedDB/SQLite)
4. Verify task in sync queue
5. Reconnect to network
6. Wait for auto-sync (30 seconds) or trigger manually
7. Verify task synced to server
8. Verify sync queue cleared

**Expected Result**: Task appears in cloud database with correct data

**Test Code** (Playwright):
```javascript
test('offline task creation syncs when online', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Create task
    await page.click('[data-testid="create-task-btn"]');
    await page.fill('[data-testid="task-title"]', 'Offline Task');
    await page.click('[data-testid="save-task-btn"]');
    
    // Verify local save
    const localTask = await page.evaluate(() => {
        return new Promise((resolve) => {
            const request = indexedDB.open('FamilyTogetherDB', 1);
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('tasks', 'readonly');
                const store = tx.objectStore('tasks');
                const getRequest = store.getAll();
                getRequest.onsuccess = () => resolve(getRequest.result);
            };
        });
    });
    
    expect(localTask).toHaveLength(1);
    expect(localTask[0].title).toBe('Offline Task');
    
    // Go online
    await context.setOffline(false);
    
    // Wait for sync
    await page.waitForSelector('[data-testid="sync-status"]:has-text("Synced")');
    
    // Verify on server (check via API)
    const response = await page.request.get('/api/tasks');
    const tasks = await response.json();
    expect(tasks.data.tasks.some(t => t.title === 'Offline Task')).toBeTruthy();
});
```

#### Scenario 2: Conflict Resolution

**Steps**:
1. User A goes offline
2. User A edits task (timestamp: 100)
3. User B (online) edits same task (timestamp: 150)
4. User B's change syncs to server
5. User A comes online
6. User A's sync triggers
7. Server detects conflict (100 < 150)
8. Server sends back version 150 (Server Wins)
9. Client applies server version

**Expected Result**: User A's local copy updated with User B's changes

---

## Performance Testing

### Load Testing (API)

**Tool**: Apache JMeter or k6

**Scenario**: 100 concurrent users syncing

```javascript
// k6 script
import http from 'k6/http';
import { check } from 'k6';

export let options = {
    stages: [
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95% requests < 500ms
        http_req_failed: ['rate<0.01'],    // < 1% failures
    },
};

export default function () {
    const payload = JSON.stringify({
        changes: [
            {
                table_name: 'tasks',
                operation: 'update',
                record_id: '550e8400-e29b-41d4-a716-446655440000',
                data: { status: 'completed' }
            }
        ]
    });
    
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token'
        },
    };
    
    const response = http.post('http://api.test/api/sync', payload, params);
    
    check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });
}
```

### Database Performance Testing

**Query Performance Benchmarks**:

```sql
-- Test: Get tasks for family member (should be < 50ms)
EXPLAIN ANALYZE
SELECT * FROM tasks
WHERE family_id = '550e8400-e29b-41d4-a716-446655440000'
AND assigned_to = '650e8400-e29b-41d4-a716-446655440000'
AND is_deleted = FALSE;

-- Expected: Index Scan using idx_tasks_family_assigned
-- Execution time: ~10-20ms for 1000 tasks
```

---

## Security Testing

### Security Test Checklist

- [ ] **SQL Injection**: Test all inputs with malicious SQL
- [ ] **XSS**: Test all text inputs with `<script>alert('xss')</script>`
- [ ] **CSRF**: Verify JWT required for state-changing operations
- [ ] **JWT Validation**: Test expired, malformed, missing tokens
- [ ] **Authorization**: Test accessing other family's data
- [ ] **Rate Limiting**: Test exceeding rate limits
- [ ] **File Upload**: Test malicious file uploads
- [ ] **Password Security**: Verify bcrypt hashing, minimum complexity

**Example**: Authorization Test

```csharp
[Fact]
public async Task GetTasks_ForDifferentFamily_ShouldReturn403()
{
    // Arrange
    var user1Token = await GetJwtTokenForUser("user1@test.com");
    var user2FamilyId = Guid.Parse("...");  // User 2's family
    
    _client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", user1Token);
    
    // Act
    var response = await _client.GetAsync($"/api/tasks?family_id={user2FamilyId}");
    
    // Assert
    response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
}
```

---

## Test Data Management

### Test Data Setup

**Seed Data Script** (for testing):

```sql
-- Families
INSERT INTO families (id, name, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Test Family 1', 'user-id-1'),
('650e8400-e29b-41d4-a716-446655440000', 'Test Family 2', 'user-id-2');

-- Members
INSERT INTO members (id, family_id, name, role, points_balance) VALUES
('750e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Parent Test', 'parent', 0),
('850e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'Child Test', 'child', 50);

-- Tasks
INSERT INTO tasks (id, family_id, title, points, assigned_to, created_by, status) VALUES
('950e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 
 'Test Task 1', 20, '850e8400-e29b-41d4-a716-446655440000', '750e8400-e29b-41d4-a716-446655440000', 'pending');
```

### Test Data Cleanup

```csharp
public class DatabaseFixture : IDisposable
{
    public AppDbContext Context { get; private set; }
    
    public DatabaseFixture()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        Context = new AppDbContext(options);
        SeedTestData();
    }
    
    private void SeedTestData()
    {
        // Add test data
    }
    
    public void Dispose()
    {
        Context.Database.EnsureDeleted();
        Context.Dispose();
    }
}
```

---

## Continuous Integration

### GitHub Actions Workflow

**.github/workflows/test.yml**:

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '6.0.x'
    
    - name: Restore dependencies
      run: dotnet restore FamilyTogether.API
    
    - name: Build
      run: dotnet build FamilyTogether.API --no-restore
    
    - name: Test
      run: dotnet test FamilyTogether.API.Tests --no-build --verbosity normal --collect:"XPlat Code Coverage"
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
  
  spa-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node
      uses: actions/setup-node@v3
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: npm install
      working-directory: FamilyTogether.SPA
    
    - name: Run tests
      run: npm test
      working-directory: FamilyTogether.SPA
```

---

**END OF TESTING STRATEGY DOCUMENT**
