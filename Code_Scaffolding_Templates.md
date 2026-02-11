# Code Scaffolding Templates
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0
**Date**: February 10, 2026
**Purpose**: Provide starter code templates for rapid project initialization

---

## Table of Contents
1. [API Project Scaffolding](#api-project-scaffolding)
2. [SPA Project Scaffolding](#spa-project-scaffolding)
3. [WPF Project Scaffolding](#wpf-project-scaffolding)
4. [Shared Models & DTOs](#shared-models--dtos)
5. [Project Creation Commands](#project-creation-commands)

---

## API Project Scaffolding

### Project Structure

```
FamilyTogether.API/
├── Controllers/
│   ├── AuthController.cs
│   ├── SyncController.cs
│   ├── TasksController.cs
│   ├── PointsController.cs
│   ├── RewardsController.cs
│   └── FamilyController.cs
├── Services/
│   ├── Interfaces/
│   │   ├── ISyncService.cs
│   │   ├── ITaskService.cs
│   │   └── IPointsService.cs
│   ├── SyncService.cs
│   ├── TaskService.cs
│   └── PointsService.cs
├── Data/
│   ├── AppDbContext.cs
│   ├── Entities/
│   │   ├── Family.cs
│   │   ├── Member.cs
│   │   ├── TaskEntity.cs
│   │   ├── PointTransaction.cs
│   │   └── Reward.cs
│   └── Repositories/
│       ├── IRepository.cs
│       └── Repository.cs
├── DTOs/
│   ├── Requests/
│   │   ├── SyncRequest.cs
│   │   ├── CreateTaskRequest.cs
│   │   └── LoginRequest.cs
│   └── Responses/
│       ├── ApiResponse.cs
│       ├── SyncResponse.cs
│       └── TaskResponse.cs
├── Middleware/
│   ├── ErrorHandlingMiddleware.cs
│   └── RequestLoggingMiddleware.cs
├── Helpers/
│   ├── ConflictResolver.cs
│   └── JwtHelper.cs
├── Program.cs
├── appsettings.json
└── FamilyTogether.API.csproj
```

### Program.cs (Complete Startup Configuration)

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FamilyTogether.API.Data;
using FamilyTogether.API.Services;
using FamilyTogether.API.Middleware;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// Database Context
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Supabase");
    options.UseNpgsql(connectionString);
});

// JWT Authentication
var jwtSecret = builder.Configuration["Supabase:JwtSecret"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };
});

// CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "*" };
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Application Services
builder.Services.AddScoped<ISyncService, SyncService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IPointsService, PointsService>();

// Repository Pattern
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "FamilyTogether API", Version = "v1" });

    // Add JWT Bearer support to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Custom Middleware (order matters!)
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();
```

### AppDbContext.cs (Entity Framework Core)

```csharp
using Microsoft.EntityFrameworkCore;
using FamilyTogether.API.Data.Entities;

namespace FamilyTogether.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Family> Families { get; set; }
        public DbSet<Member> Members { get; set; }
        public DbSet<TaskEntity> Tasks { get; set; }
        public DbSet<PointTransaction> PointTransactions { get; set; }
        public DbSet<Reward> Rewards { get; set; }
        public DbSet<RewardRedemption> RewardRedemptions { get; set; }
        public DbSet<SyncLog> SyncLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Family Configuration
            modelBuilder.Entity<Family>(entity =>
            {
                entity.ToTable("families");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
                entity.Property(e => e.LastModified).IsRequired();
                entity.HasIndex(e => e.LastModified);
                entity.HasQueryFilter(e => !e.IsDeleted);
            });

            // Member Configuration
            modelBuilder.Entity<Member>(entity =>
            {
                entity.ToTable("members");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PointsBalance).HasDefaultValue(0);
                entity.HasIndex(e => e.FamilyId);
                entity.HasIndex(e => e.LastModified);
                entity.HasQueryFilter(e => !e.IsDeleted);
            });

            // Task Configuration
            modelBuilder.Entity<TaskEntity>(entity =>
            {
                entity.ToTable("tasks");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.FamilyId);
                entity.HasIndex(e => e.AssignedTo);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.LastModified);
                entity.HasQueryFilter(e => !e.IsDeleted);
            });

            // Point Transaction Configuration
            modelBuilder.Entity<PointTransaction>(entity =>
            {
                entity.ToTable("point_transactions");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TransactionType).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.MemberId);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasQueryFilter(e => !e.IsDeleted);
            });

            // Reward Configuration
            modelBuilder.Entity<Reward>(entity =>
            {
                entity.ToTable("rewards");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Cost).IsRequired();
                entity.HasIndex(e => e.FamilyId);
                entity.HasQueryFilter(e => !e.IsDeleted);
            });

            // Reward Redemption Configuration
            modelBuilder.Entity<RewardRedemption>(entity =>
            {
                entity.ToTable("reward_redemptions");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.MemberId);
                entity.HasQueryFilter(e => !e.IsDeleted);
            });

            // Sync Log Configuration
            modelBuilder.Entity<SyncLog>(entity =>
            {
                entity.ToTable("sync_logs");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.SyncTimestamp);
            });
        }
    }
}
```

### Base Entity Class

```csharp
using System.ComponentModel.DataAnnotations;

namespace FamilyTogether.API.Data.Entities
{
    public abstract class BaseEntity
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public long LastModified { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        public bool IsDeleted { get; set; } = false;

        public Guid ChangeId { get; set; } = Guid.NewGuid();

        public int SyncVersion { get; set; } = 1;
    }
}
```

### TaskEntity.cs (Example Entity)

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FamilyTogether.API.Data.Entities
{
    public class TaskEntity : BaseEntity
    {
        [Required]
        public Guid FamilyId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public int Points { get; set; }

        [Required]
        public Guid AssignedTo { get; set; }

        [Required]
        public Guid CreatedBy { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "pending"; // pending, in_progress, awaiting_approval, approved, rejected

        public bool IsRecurring { get; set; } = false;

        [MaxLength(50)]
        public string? RecurrencePattern { get; set; } // daily, weekly, monthly

        public int? RecurrenceDay { get; set; }

        public DateTime? LastGeneratedAt { get; set; }

        public DateTime? DueDate { get; set; }

        public DateTime? CompletedAt { get; set; }

        public Guid? CompletedBy { get; set; }

        public string? CompletionNote { get; set; }

        [MaxLength(500)]
        public string? CompletionPhotoUrl { get; set; }

        public DateTime? ReviewedAt { get; set; }

        public Guid? ReviewedBy { get; set; }

        public string? ReviewNote { get; set; }

        public int BonusPoints { get; set; } = 0;

        public string? BonusReason { get; set; }

        // Navigation properties
        [ForeignKey("FamilyId")]
        public virtual Family? Family { get; set; }
    }
}
```

### Base Controller

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FamilyTogether.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public abstract class BaseController : ControllerBase
    {
        protected Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid user ID in token");
            }

            return userId;
        }

        protected string GetUserEmail()
        {
            return User.FindFirst(ClaimTypes.Email)?.Value
                ?? User.FindFirst("email")?.Value
                ?? throw new UnauthorizedAccessException("Email not found in token");
        }

        protected IActionResult SuccessResponse<T>(T data, string? message = null)
        {
            return Ok(new
            {
                success = true,
                data = data,
                message = message,
                timestamp = DateTime.UtcNow
            });
        }

        protected IActionResult ErrorResponse(string message, int statusCode = 400)
        {
            return StatusCode(statusCode, new
            {
                success = false,
                error = new
                {
                    code = GetErrorCode(statusCode),
                    message = message
                },
                timestamp = DateTime.UtcNow
            });
        }

        private string GetErrorCode(int statusCode)
        {
            return statusCode switch
            {
                400 => "BAD_REQUEST",
                401 => "UNAUTHORIZED",
                403 => "FORBIDDEN",
                404 => "NOT_FOUND",
                409 => "CONFLICT",
                500 => "INTERNAL_ERROR",
                _ => "UNKNOWN_ERROR"
            };
        }
    }
}
```

### SyncController.cs (Example Controller)

```csharp
using Microsoft.AspNetCore.Mvc;
using FamilyTogether.API.Services;
using FamilyTogether.API.DTOs.Requests;

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
            try
            {
                var userId = GetUserId();
                _logger.LogInformation("Sync request from user {UserId} with {ChangeCount} changes",
                    userId, request.Changes?.Count ?? 0);

                var response = await _syncService.ProcessSyncAsync(userId, request);

                return SuccessResponse(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sync failed");
                return ErrorResponse(ex.Message, 500);
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
                return ErrorResponse(ex.Message, 500);
            }
        }
    }
}
```

### ISyncService.cs (Service Interface)

```csharp
using FamilyTogether.API.DTOs.Requests;
using FamilyTogether.API.DTOs.Responses;

namespace FamilyTogether.API.Services
{
    public interface ISyncService
    {
        Task<SyncResponse> ProcessSyncAsync(Guid userId, SyncRequest request);
        Task<SyncStatusResponse> GetSyncStatusAsync(Guid userId);
    }
}
```

### ErrorHandlingMiddleware.cs

```csharp
using System.Net;
using System.Text.Json;

namespace FamilyTogether.API.Middleware
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception occurred");
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var code = HttpStatusCode.InternalServerError;
            var errorCode = "INTERNAL_ERROR";

            if (exception is UnauthorizedAccessException)
            {
                code = HttpStatusCode.Unauthorized;
                errorCode = "UNAUTHORIZED";
            }
            else if (exception is ArgumentException || exception is InvalidOperationException)
            {
                code = HttpStatusCode.BadRequest;
                errorCode = "BAD_REQUEST";
            }

            var result = JsonSerializer.Serialize(new
            {
                success = false,
                error = new
                {
                    code = errorCode,
                    message = exception.Message
                },
                timestamp = DateTime.UtcNow
            });

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)code;

            return context.Response.WriteAsync(result);
        }
    }
}
```

---

## SPA Project Scaffolding

### Project Structure

```
FamilyTogether.SPA/
├── index.html
├── src/
│   ├── app.js (main entry point)
│   ├── config.js
│   ├── services/
│   │   ├── db.js (IndexedDB wrapper)
│   │   ├── sync.js (SyncManager)
│   │   ├── auth.js (Supabase Auth)
│   │   ├── api.js (API client)
│   │   └── storage.js (LocalStorage helpers)
│   ├── components/
│   │   ├── tasks/
│   │   │   ├── TaskList.js
│   │   │   └── TaskForm.js
│   │   ├── auth/
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   └── common/
│   │       ├── Loading.js
│   │       └── ErrorMessage.js
│   ├── utils/
│   │   ├── uuid.js
│   │   ├── validators.js
│   │   └── dateHelpers.js
│   └── styles/
│       └── main.css
├── netlify.toml
└── package.json
```

### index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FamilyTogether - Local-First Task Management</title>
    <link rel="stylesheet" href="src/styles/main.css">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
    <div id="app">
        <div id="loading">Loading...</div>
    </div>

    <script type="module" src="src/app.js"></script>
</body>
</html>
```

### src/services/db.js (IndexedDB Wrapper)

```javascript
// IndexedDB Database Service
const DB_NAME = 'FamilyTogetherDB';
const DB_VERSION = 1;

class LocalDB {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Families Object Store
                if (!db.objectStoreNames.contains('families')) {
                    const familiesStore = db.createObjectStore('families', { keyPath: 'id' });
                    familiesStore.createIndex('created_by', 'created_by', { unique: false });
                    familiesStore.createIndex('last_modified', 'last_modified', { unique: false });
                }

                // Members Object Store
                if (!db.objectStoreNames.contains('members')) {
                    const membersStore = db.createObjectStore('members', { keyPath: 'id' });
                    membersStore.createIndex('family_id', 'family_id', { unique: false });
                    membersStore.createIndex('user_id', 'user_id', { unique: false });
                    membersStore.createIndex('last_modified', 'last_modified', { unique: false });
                }

                // Tasks Object Store
                if (!db.objectStoreNames.contains('tasks')) {
                    const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
                    tasksStore.createIndex('family_id', 'family_id', { unique: false });
                    tasksStore.createIndex('assigned_to', 'assigned_to', { unique: false });
                    tasksStore.createIndex('status', 'status', { unique: false });
                    tasksStore.createIndex('last_modified', 'last_modified', { unique: false });
                }

                // Sync Queue Object Store
                if (!db.objectStoreNames.contains('sync_queue')) {
                    const syncQueueStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
                    syncQueueStore.createIndex('status', 'status', { unique: false });
                    syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Sync Metadata Object Store
                if (!db.objectStoreNames.contains('sync_metadata')) {
                    db.createObjectStore('sync_metadata', { keyPath: 'key' });
                }
            };
        });
    }

    async add(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);

        return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async queueSync(operation, tableName, recordId, data) {
        const syncItem = {
            operation, // 'create', 'update', 'delete'
            table_name: tableName,
            record_id: recordId,
            data_json: JSON.stringify(data),
            timestamp: Date.now(),
            status: 'pending'
        };

        return this.add('sync_queue', syncItem);
    }
}

// Export singleton instance
const db = new LocalDB();
export default db;
```

### src/services/sync.js (Sync Manager)

```javascript
import db from './db.js';
import CONFIG from '../config.js';

export class SyncManager {
    constructor(apiUrl, authToken) {
        this.apiUrl = apiUrl;
        this.authToken = authToken;
        this.isSyncing = false;
        this.syncInterval = null;
    }

    async sync() {
        if (!navigator.onLine || this.isSyncing) {
            console.log('Sync skipped: offline or already syncing');
            return;
        }

        this.isSyncing = true;

        try {
            // Get pending changes from sync queue
            const pendingChanges = await db.getByIndex('sync_queue', 'status', 'pending');

            if (pendingChanges.length === 0) {
                console.log('No pending changes to sync');
                return;
            }

            // Get last sync timestamp
            const lastSyncMeta = await db.get('sync_metadata', 'last_sync_timestamp');
            const lastSyncTimestamp = lastSyncMeta ? parseInt(lastSyncMeta.value) : 0;

            // Prepare sync payload
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

            // Send to server
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

            // Process accepted changes
            for (const accepted of result.data.accepted_changes) {
                const queueItem = pendingChanges.find(c => c.record_id === accepted.record_id);
                if (queueItem) {
                    await db.delete('sync_queue', queueItem.id);
                }
            }

            // Process rejected changes (conflicts)
            for (const rejected of result.data.rejected_changes) {
                if (rejected.status === 'conflict' && rejected.server_data) {
                    // Apply server version
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
                }
            }

            // Apply server changes
            for (const serverChange of result.data.server_changes) {
                await this.applyServerChange(serverChange);
            }

            // Update last sync timestamp
            await db.put('sync_metadata', {
                key: 'last_sync_timestamp',
                value: result.data.sync_timestamp.toString(),
                updated_at: new Date().toISOString()
            });

            console.log(`Sync completed: ${result.data.accepted_changes.length} accepted, ${result.data.rejected_changes.length} rejected`);
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    async applyServerChange(change) {
        const storeName = this.getStoreName(change.table_name);

        if (change.operation === 'delete') {
            await db.delete(storeName, change.record_id);
        } else {
            await db.put(storeName, change.data);
        }
    }

    getStoreName(tableName) {
        // Map database table names to IndexedDB store names
        const mapping = {
            'families': 'families',
            'members': 'members',
            'tasks': 'tasks',
            'point_transactions': 'point_transactions',
            'rewards': 'rewards'
        };

        return mapping[tableName] || tableName;
    }

    startAutoSync() {
        this.stopAutoSync(); // Clear any existing interval

        this.syncInterval = setInterval(() => {
            this.sync();
        }, CONFIG.syncIntervalMs);

        // Sync on online event
        window.addEventListener('online', () => {
            console.log('Network online, triggering sync');
            this.sync();
        });

        // Initial sync
        this.sync();
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
}

export default SyncManager;
```

### src/app.js (Main Entry Point)

```javascript
import CONFIG from './config.js';
import db from './services/db.js';
import { SyncManager } from './services/sync.js';

// Initialize application
async function initApp() {
    try {
        console.log('Initializing FamilyTogether...');

        // Initialize IndexedDB
        await db.init();
        console.log('IndexedDB initialized');

        // Check if user is logged in
        const authToken = localStorage.getItem('auth_token');

        if (authToken) {
            // Initialize sync manager
            const syncManager = new SyncManager(CONFIG.apiUrl, authToken);
            syncManager.startAutoSync();
            console.log('Auto-sync started');

            // Show main app
            showMainApp();
        } else {
            // Show login screen
            showLoginScreen();
        }
    } catch (error) {
        console.error('Failed to initialize app:', error);
        document.getElementById('app').innerHTML = `
            <div class="error">
                <h1>Initialization Error</h1>
                <p>${error.message}</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

function showMainApp() {
    document.getElementById('app').innerHTML = `
        <div class="main-app">
            <h1>FamilyTogether</h1>
            <p>Main application goes here...</p>
        </div>
    `;
}

function showLoginScreen() {
    document.getElementById('app').innerHTML = `
        <div class="login-screen">
            <h1>Welcome to FamilyTogether</h1>
            <p>Please log in to continue</p>
        </div>
    `;
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
```

---

## WPF Project Scaffolding

### Project Structure

```
FamilyTogether.WPF/
├── App.xaml
├── App.xaml.cs
├── MainWindow.xaml
├── MainWindow.xaml.cs
├── Data/
│   ├── AppDbContext.cs
│   ├── Entities/
│   │   ├── TaskEntity.cs
│   │   ├── Member.cs
│   │   └── SyncQueueItem.cs
│   └── Migrations/
├── Services/
│   ├── Interfaces/
│   │   ├── ISyncService.cs
│   │   └── ITaskService.cs
│   ├── SyncService.cs
│   ├── TaskService.cs
│   └── ApiClient.cs
├── ViewModels/
│   ├── BaseViewModel.cs
│   ├── MainViewModel.cs
│   └── TasksViewModel.cs
├── Views/
│   ├── TasksView.xaml
│   └── LoginView.xaml
├── Commands/
│   └── RelayCommand.cs
├── Helpers/
│   └── ObservableObject.cs
└── appsettings.json
```

### App.xaml.cs

```csharp
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Windows;
using FamilyTogether.WPF.Data;
using FamilyTogether.WPF.Services;

namespace FamilyTogether.WPF
{
    public partial class App : Application
    {
        public IServiceProvider ServiceProvider { get; private set; }
        public IConfiguration Configuration { get; private set; }

        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            // Build configuration
            var builder = new ConfigurationBuilder()
                .SetBasePath(AppDomain.CurrentDomain.BaseDirectory)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{GetEnvironment()}.json", optional: true, reloadOnChange: true);

            Configuration = builder.Build();

            // Configure services
            var serviceCollection = new ServiceCollection();
            ConfigureServices(serviceCollection);

            ServiceProvider = serviceCollection.BuildServiceProvider();

            // Run database migrations
            using (var scope = ServiceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                dbContext.Database.Migrate();
            }

            // Show main window
            var mainWindow = ServiceProvider.GetRequiredService<MainWindow>();
            mainWindow.Show();
        }

        private void ConfigureServices(IServiceCollection services)
        {
            // Configuration
            services.AddSingleton(Configuration);

            // Database
            var databasePath = Configuration["Database:Path"]
                ?.Replace("%APPDATA%", Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData))
                ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "FamilyTogether", "app.db");

            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite($"Data Source={databasePath}"));

            // Services
            services.AddSingleton<ISyncService, SyncService>();
            services.AddScoped<ITaskService, TaskService>();

            // ViewModels
            services.AddTransient<MainViewModel>();

            // Views
            services.AddTransient<MainWindow>();
        }

        private string GetEnvironment()
        {
            return Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? "Production";
        }
    }
}
```

### RelayCommand.cs

```csharp
using System;
using System.Windows.Input;

namespace FamilyTogether.WPF.Commands
{
    public class RelayCommand : ICommand
    {
        private readonly Action<object?> _execute;
        private readonly Predicate<object?>? _canExecute;

        public RelayCommand(Action<object?> execute, Predicate<object?>? canExecute = null)
        {
            _execute = execute ?? throw new ArgumentNullException(nameof(execute));
            _canExecute = canExecute;
        }

        public event EventHandler? CanExecuteChanged
        {
            add { CommandManager.RequerySuggested += value; }
            remove { CommandManager.RequerySuggested -= value; }
        }

        public bool CanExecute(object? parameter)
        {
            return _canExecute == null || _canExecute(parameter);
        }

        public void Execute(object? parameter)
        {
            _execute(parameter);
        }
    }

    public class RelayCommand<T> : ICommand
    {
        private readonly Action<T?> _execute;
        private readonly Predicate<T?>? _canExecute;

        public RelayCommand(Action<T?> execute, Predicate<T?>? canExecute = null)
        {
            _execute = execute ?? throw new ArgumentNullException(nameof(execute));
            _canExecute = canExecute;
        }

        public event EventHandler? CanExecuteChanged
        {
            add { CommandManager.RequerySuggested += value; }
            remove { CommandManager.RequerySuggested -= value; }
        }

        public bool CanExecute(object? parameter)
        {
            return _canExecute == null || _canExecute((T?)parameter);
        }

        public void Execute(object? parameter)
        {
            _execute((T?)parameter);
        }
    }
}
```

### ObservableObject.cs

```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace FamilyTogether.WPF.Helpers
{
    public abstract class ObservableObject : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        protected bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
        {
            if (EqualityComparer<T>.Default.Equals(field, value))
            {
                return false;
            }

            field = value;
            OnPropertyChanged(propertyName);
            return true;
        }
    }
}
```

---

## Shared Models & DTOs

### ApiResponse.cs

```csharp
namespace FamilyTogether.API.DTOs.Responses
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
        public ErrorDetails? Error { get; set; }
        public string? Message { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class ErrorDetails
    {
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public object? Details { get; set; }
    }
}
```

### SyncRequest.cs

```csharp
namespace FamilyTogether.API.DTOs.Requests
{
    public class SyncRequest
    {
        public string ClientType { get; set; } = "spa"; // spa, wpf
        public string ClientVersion { get; set; } = "1.0.0";
        public long LastSyncTimestamp { get; set; }
        public List<SyncChange> Changes { get; set; } = new();
    }

    public class SyncChange
    {
        public string TableName { get; set; } = string.Empty;
        public string Operation { get; set; } = string.Empty; // create, update, delete
        public Guid RecordId { get; set; }
        public object Data { get; set; } = new();
    }
}
```

### SyncResponse.cs

```csharp
namespace FamilyTogether.API.DTOs.Responses
{
    public class SyncResponse
    {
        public long SyncTimestamp { get; set; }
        public List<AcceptedChange> AcceptedChanges { get; set; } = new();
        public List<RejectedChange> RejectedChanges { get; set; } = new();
        public List<ServerChange> ServerChanges { get; set; } = new();
        public int ConflictsResolved { get; set; }
    }

    public class AcceptedChange
    {
        public Guid RecordId { get; set; }
        public string Status { get; set; } = "accepted";
    }

    public class RejectedChange
    {
        public Guid RecordId { get; set; }
        public string Status { get; set; } = "conflict";
        public string Reason { get; set; } = string.Empty;
        public object? ServerData { get; set; }
    }

    public class ServerChange
    {
        public string TableName { get; set; } = string.Empty;
        public string Operation { get; set; } = string.Empty;
        public Guid RecordId { get; set; }
        public object Data { get; set; } = new();
    }
}
```

---

## Project Creation Commands

### Create API Project

```bash
# Create solution
dotnet new sln -n FamilyTogether

# Create API project
dotnet new webapi -n FamilyTogether.API
dotnet sln add FamilyTogether.API

# Navigate to API project
cd FamilyTogether.API

# Add NuGet packages
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 6.0.8
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 6.0.12
dotnet add package Microsoft.EntityFrameworkCore.Design --version 6.0.12
dotnet add package Supabase --version 0.9.3
dotnet add package Newtonsoft.Json --version 13.0.3

# Create folder structure
mkdir Controllers Services Data DTOs Middleware Helpers
mkdir Data/Entities Data/Repositories
mkdir DTOs/Requests DTOs/Responses

# Run project
dotnet run
```

### Create WPF Project

```bash
# Create WPF project
dotnet new wpf -n FamilyTogether.WPF
dotnet sln add FamilyTogether.WPF

# Navigate to WPF project
cd FamilyTogether.WPF

# Add NuGet packages
dotnet add package Microsoft.EntityFrameworkCore.Sqlite --version 6.0.12
dotnet add package Microsoft.EntityFrameworkCore.Design --version 6.0.12
dotnet add package Newtonsoft.Json --version 13.0.3
dotnet add package Microsoft.Extensions.Configuration.Json --version 6.0.0
dotnet add package Microsoft.Extensions.DependencyInjection --version 6.0.0

# Create folder structure
mkdir Data Services ViewModels Views Commands Helpers
mkdir Data/Entities Data/Migrations

# Run project
dotnet run
```

### Create SPA Project

```bash
# Create SPA directory
mkdir FamilyTogether.SPA
cd FamilyTogether.SPA

# Create folder structure
mkdir src
mkdir src/services src/components src/utils src/styles
mkdir src/components/tasks src/components/auth src/components/common

# Create package.json (optional)
npm init -y

# Install dependencies (if using build tools)
npm install @supabase/supabase-js

# Or use CDN in HTML (no build step required)
```

---

**END OF CODE SCAFFOLDING TEMPLATES**
