# Error Handling & Logging Standards
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0
**Date**: February 10, 2026
**Purpose**: Define consistent error handling and logging practices across all components

---

## Table of Contents
1. [Error Handling Philosophy](#error-handling-philosophy)
2. [API Error Handling](#api-error-handling)
3. [SPA Error Handling](#spa-error-handling)
4. [WPF Error Handling](#wpf-error-handling)
5. [Logging Standards](#logging-standards)
6. [Error Response Formats](#error-response-formats)
7. [Monitoring & Alerting](#monitoring--alerting)

---

## Error Handling Philosophy

### Core Principles

1. **Fail Fast, Fail Safe**: Detect errors early and handle them gracefully
2. **User-Friendly Messages**: Never expose technical details to end users
3. **Comprehensive Logging**: Log all errors with context for debugging
4. **Graceful Degradation**: App continues working when possible
5. **Consistent Patterns**: Same error handling approach across all components

### Error Categories

| Category | Description | User Action | Log Level |
|----------|-------------|-------------|-----------|
| **Validation Error** | Invalid user input | Show inline error, allow correction | Warning |
| **Authentication Error** | Invalid credentials, expired token | Prompt login, clear session | Warning |
| **Authorization Error** | Insufficient permissions | Show "Access Denied" message | Warning |
| **Not Found Error** | Resource doesn't exist | Show "Not Found" message | Information |
| **Conflict Error** | Data conflict (e.g., sync) | Auto-resolve or prompt user | Warning |
| **Network Error** | No internet, API unreachable | Show offline mode, queue changes | Warning |
| **Server Error** | API 500 errors | Show generic error, retry | Error |
| **Client Error** | JavaScript/C# exceptions | Show error page, log details | Error |

---

## API Error Handling

### Standard Error Response Format

```csharp
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
    public string Code { get; set; } = string.Empty;        // Machine-readable error code
    public string Message { get; set; } = string.Empty;     // User-friendly message
    public List<ValidationError>? Details { get; set; }     // Validation errors (optional)
}

public class ValidationError
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
```

### Error Codes

```csharp
public static class ErrorCodes
{
    // Client Errors (400-499)
    public const string VALIDATION_ERROR = "VALIDATION_ERROR";
    public const string UNAUTHORIZED = "UNAUTHORIZED";
    public const string FORBIDDEN = "FORBIDDEN";
    public const string NOT_FOUND = "NOT_FOUND";
    public const string CONFLICT = "CONFLICT";
    public const string RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED";

    // Server Errors (500-599)
    public const string INTERNAL_ERROR = "INTERNAL_ERROR";
    public const string DATABASE_ERROR = "DATABASE_ERROR";
    public const string SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE";
}
```

### Global Error Handling Middleware

**File**: `FamilyTogether.API/Middleware/ErrorHandlingMiddleware.cs`

```csharp
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;

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
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            // Log the exception with full details
            _logger.LogError(exception, "Unhandled exception occurred. Path: {Path}, Method: {Method}",
                context.Request.Path, context.Request.Method);

            // Determine status code and error code
            var (statusCode, errorCode, userMessage) = GetErrorDetails(exception);

            // Build error response
            var response = new
            {
                success = false,
                error = new
                {
                    code = errorCode,
                    message = userMessage,
                    details = GetErrorDetails(exception)
                },
                timestamp = DateTime.UtcNow
            };

            // Send response
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }

        private (HttpStatusCode statusCode, string errorCode, string userMessage) GetErrorDetails(Exception exception)
        {
            return exception switch
            {
                UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "UNAUTHORIZED", "Authentication required. Please log in."),
                ArgumentException or ArgumentNullException => (HttpStatusCode.BadRequest, "VALIDATION_ERROR", "Invalid input. Please check your data."),
                InvalidOperationException => (HttpStatusCode.BadRequest, "INVALID_OPERATION", exception.Message),
                KeyNotFoundException => (HttpStatusCode.NotFound, "NOT_FOUND", "The requested resource was not found."),
                DbUpdateConcurrencyException => (HttpStatusCode.Conflict, "CONFLICT", "Data was modified by another user. Please refresh and try again."),
                _ => (HttpStatusCode.InternalServerError, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.")
            };
        }

        private object? GetErrorDetails(Exception exception)
        {
            // In development, return exception details
            // In production, return null for security
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                return new
                {
                    type = exception.GetType().Name,
                    message = exception.Message,
                    stackTrace = exception.StackTrace
                };
            }

            return null;
        }
    }
}
```

### Controller Error Handling Pattern

```csharp
[HttpPost]
public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequest request)
{
    try
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return ErrorResponse("Title is required", 400);
        }

        // Business logic
        var userId = GetUserId();
        var task = await _taskService.CreateTaskAsync(userId, request);

        // Success response
        return SuccessResponse(task, "Task created successfully");
    }
    catch (UnauthorizedAccessException ex)
    {
        _logger.LogWarning(ex, "Unauthorized access attempt");
        return ErrorResponse("Access denied", 403);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to create task");
        return ErrorResponse("Failed to create task", 500);
    }
}

// Helper methods in BaseController
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

protected IActionResult ErrorResponse(string message, int statusCode = 400, string? errorCode = null)
{
    return StatusCode(statusCode, new
    {
        success = false,
        error = new
        {
            code = errorCode ?? GetDefaultErrorCode(statusCode),
            message = message
        },
        timestamp = DateTime.UtcNow
    });
}

private string GetDefaultErrorCode(int statusCode)
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
```

### Validation Error Handling

```csharp
using FluentValidation;

public class CreateTaskValidator : AbstractValidator<CreateTaskRequest>
{
    public CreateTaskValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(500).WithMessage("Title cannot exceed 500 characters");

        RuleFor(x => x.Points)
            .GreaterThanOrEqualTo(0).WithMessage("Points must be non-negative");

        RuleFor(x => x.AssignedTo)
            .NotEmpty().WithMessage("AssignedTo is required");
    }
}

// In controller
[HttpPost]
public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequest request)
{
    // Validate
    var validator = new CreateTaskValidator();
    var validationResult = await validator.ValidateAsync(request);

    if (!validationResult.IsValid)
    {
        var errors = validationResult.Errors.Select(e => new ValidationError
        {
            Field = e.PropertyName,
            Message = e.ErrorMessage
        }).ToList();

        return BadRequest(new
        {
            success = false,
            error = new
            {
                code = "VALIDATION_ERROR",
                message = "Validation failed",
                details = errors
            },
            timestamp = DateTime.UtcNow
        });
    }

    // Continue with business logic...
}
```

---

## SPA Error Handling

### Error Handling Strategy

```javascript
// src/utils/errorHandler.js

export class ErrorHandler {
    static handle(error, context = '') {
        console.error(`[${context}]`, error);

        // Determine error type
        if (error instanceof NetworkError) {
            return this.handleNetworkError(error);
        } else if (error instanceof ValidationError) {
            return this.handleValidationError(error);
        } else if (error instanceof AuthError) {
            return this.handleAuthError(error);
        } else {
            return this.handleUnknownError(error);
        }
    }

    static handleNetworkError(error) {
        if (!navigator.onLine) {
            return {
                type: 'network',
                userMessage: 'You are offline. Changes will sync when you reconnect.',
                canRetry: false
            };
        }

        return {
            type: 'network',
            userMessage: 'Network error. Please check your connection and try again.',
            canRetry: true
        };
    }

    static handleValidationError(error) {
        return {
            type: 'validation',
            userMessage: error.message,
            fields: error.fields,
            canRetry: false
        };
    }

    static handleAuthError(error) {
        // Clear invalid token
        localStorage.removeItem('auth_token');

        return {
            type: 'auth',
            userMessage: 'Your session has expired. Please log in again.',
            canRetry: false,
            redirectToLogin: true
        };
    }

    static handleUnknownError(error) {
        return {
            type: 'unknown',
            userMessage: 'An unexpected error occurred. Please try again.',
            canRetry: true,
            technicalMessage: error.message
        };
    }

    static displayError(errorInfo) {
        // Show user-friendly error message
        const errorContainer = document.getElementById('error-container');
        if (!errorContainer) return;

        errorContainer.innerHTML = `
            <div class="error-message ${errorInfo.type}">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${errorInfo.userMessage}</span>
                ${errorInfo.canRetry ? '<button class="retry-btn">Retry</button>' : ''}
                <button class="close-btn">×</button>
            </div>
        `;

        errorContainer.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
}

// Custom error classes
export class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class ValidationError extends Error {
    constructor(message, fields = {}) {
        super(message);
        this.name = 'ValidationError';
        this.fields = fields;
    }
}

export class AuthError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthError';
    }
}
```

### API Client with Error Handling

```javascript
// src/services/api.js

import { ErrorHandler, NetworkError, AuthError } from '../utils/errorHandler.js';

export class ApiClient {
    constructor(baseUrl, authToken) {
        this.baseUrl = baseUrl;
        this.authToken = authToken;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);

            // Handle HTTP errors
            if (!response.ok) {
                await this.handleHttpError(response);
            }

            // Parse and return data
            const data = await response.json();
            return data;

        } catch (error) {
            // Handle network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new NetworkError('Network request failed. Please check your connection.');
            }

            // Re-throw other errors
            throw error;
        }
    }

    async handleHttpError(response) {
        const errorData = await response.json().catch(() => ({}));

        switch (response.status) {
            case 400:
                throw new ValidationError(
                    errorData.error?.message || 'Invalid request',
                    errorData.error?.details
                );

            case 401:
                throw new AuthError('Authentication required');

            case 403:
                throw new Error('Access denied');

            case 404:
                throw new Error('Resource not found');

            case 409:
                throw new Error('Conflict: ' + (errorData.error?.message || 'Data conflict'));

            case 500:
                throw new Error('Server error. Please try again later.');

            default:
                throw new Error(errorData.error?.message || 'Request failed');
        }
    }

    // Helper methods
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}
```

### Try-Catch Pattern for Async Operations

```javascript
// Example: Task creation with error handling

async function createTask(taskData) {
    try {
        // Show loading
        showLoading('Creating task...');

        // Validate locally first
        validateTask(taskData);

        // Save to IndexedDB
        await db.add('tasks', taskData);

        // Queue for sync
        await db.queueSync('create', 'tasks', taskData.id, taskData);

        // Show success
        showSuccess('Task created successfully');

        return taskData;

    } catch (error) {
        // Handle and display error
        const errorInfo = ErrorHandler.handle(error, 'createTask');
        ErrorHandler.displayError(errorInfo);

        // Log to monitoring service
        if (window.Sentry) {
            Sentry.captureException(error);
        }

        throw error; // Re-throw for caller to handle if needed
    } finally {
        // Always hide loading
        hideLoading();
    }
}
```

---

## WPF Error Handling

### Global Exception Handling

**File**: `App.xaml.cs`

```csharp
public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        // Handle unhandled exceptions
        AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
        DispatcherUnhandledException += OnDispatcherUnhandledException;
        TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;

        // ... rest of startup code
    }

    private void OnUnhandledException(object sender, UnhandledExceptionEventArgs e)
    {
        var exception = e.ExceptionObject as Exception;
        LogException(exception, "UnhandledException");
        ShowErrorDialog(exception);
    }

    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        LogException(e.Exception, "DispatcherUnhandledException");
        ShowErrorDialog(e.Exception);
        e.Handled = true; // Prevent app from crashing
    }

    private void OnUnobservedTaskException(object sender, UnobservedTaskExceptionEventArgs e)
    {
        LogException(e.Exception, "UnobservedTaskException");
        e.SetObserved(); // Prevent app from crashing
    }

    private void LogException(Exception? exception, string source)
    {
        if (exception == null) return;

        var logger = ServiceProvider.GetRequiredService<ILogger<App>>();
        logger.LogError(exception, "Unhandled exception from {Source}", source);
    }

    private void ShowErrorDialog(Exception? exception)
    {
        if (exception == null) return;

        var message = GetUserFriendlyMessage(exception);

        MessageBox.Show(
            message,
            "Error",
            MessageBoxButton.OK,
            MessageBoxImage.Error
        );
    }

    private string GetUserFriendlyMessage(Exception exception)
    {
        return exception switch
        {
            UnauthorizedAccessException => "Access denied. Please check your permissions.",
            HttpRequestException => "Network error. Please check your internet connection.",
            DbUpdateException => "Database error. Please try again.",
            _ => "An unexpected error occurred. The error has been logged."
        };
    }
}
```

### Try-Catch Pattern in ViewModels

```csharp
public class TasksViewModel : BaseViewModel
{
    private readonly ITaskService _taskService;
    private readonly ILogger<TasksViewModel> _logger;

    public ICommand CreateTaskCommand { get; }

    public TasksViewModel(ITaskService taskService, ILogger<TasksViewModel> logger)
    {
        _taskService = taskService;
        _logger = logger;
        CreateTaskCommand = new RelayCommand(async () => await CreateTaskAsync());
    }

    private async Task CreateTaskAsync()
    {
        try
        {
            IsLoading = true;
            ErrorMessage = null;

            // Validation
            if (string.IsNullOrWhiteSpace(NewTaskTitle))
            {
                ErrorMessage = "Title is required";
                return;
            }

            // Create task
            var task = new TaskEntity
            {
                Title = NewTaskTitle,
                Points = NewTaskPoints,
                // ... other properties
            };

            await _taskService.CreateTaskAsync(task);

            // Success
            StatusMessage = "Task created successfully";
            ClearForm();

        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation error creating task");
            ErrorMessage = ex.Message;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Network error creating task");
            ErrorMessage = "Network error. Please check your connection.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create task");
            ErrorMessage = "Failed to create task. Please try again.";
        }
        finally
        {
            IsLoading = false;
        }
    }
}
```

---

## Logging Standards

### Log Levels

| Level | When to Use | Examples |
|-------|-------------|----------|
| **Trace** | Very detailed debugging | "Entering method X with params Y" |
| **Debug** | Debugging information | "Loaded 50 tasks from database" |
| **Information** | General informational messages | "User logged in", "Sync completed" |
| **Warning** | Recoverable errors or warnings | "Retry attempt 2 of 3", "Validation failed" |
| **Error** | Errors that need attention | "API call failed", "Database connection lost" |
| **Critical** | Critical failures | "App crash", "Data corruption" |

### Logging Configuration

**File**: `appsettings.json`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning",
      "FamilyTogether": "Debug"
    },
    "Console": {
      "IncludeScopes": true,
      "TimestampFormat": "yyyy-MM-dd HH:mm:ss "
    },
    "File": {
      "Path": "Logs/app-.log",
      "RollingInterval": "Day",
      "FileSizeLimitBytes": 10485760,
      "RetainedFileCountLimit": 7
    }
  }
}
```

### Structured Logging Examples

```csharp
// API Controller
_logger.LogInformation("Sync request received from user {UserId} with {ChangeCount} changes",
    userId, request.Changes.Count);

// Service
_logger.LogWarning("Conflict detected for task {TaskId}. Client timestamp: {ClientTime}, Server timestamp: {ServerTime}",
    taskId, clientTimestamp, serverTimestamp);

// Error with exception
_logger.LogError(exception, "Failed to save task {TaskId} to database", taskId);

// Performance logging
using (_logger.BeginScope("SyncOperation for User {UserId}", userId))
{
    var stopwatch = Stopwatch.StartNew();

    // ... sync logic ...

    stopwatch.Stop();
    _logger.LogInformation("Sync completed in {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);
}
```

### JavaScript Console Logging

```javascript
// Structured logging for SPA
const log = {
    debug: (message, data = {}) => {
        if (CONFIG.enableDebugMode) {
            console.log(`[DEBUG] ${message}`, data);
        }
    },

    info: (message, data = {}) => {
        console.log(`[INFO] ${message}`, data);
    },

    warn: (message, data = {}) => {
        console.warn(`[WARN] ${message}`, data);
    },

    error: (message, error, data = {}) => {
        console.error(`[ERROR] ${message}`, error, data);

        // Send to monitoring service
        if (window.Sentry) {
            Sentry.captureException(error, {
                extra: { message, ...data }
            });
        }
    }
};

// Usage
log.info('Sync started', { changeCount: pendingChanges.length });
log.error('Sync failed', error, { userId, changeCount });
```

---

## Error Response Formats

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Clean room",
    "points": 20
  },
  "message": "Task created successfully",
  "timestamp": "2026-02-10T10:30:00.000Z"
}
```

### Validation Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      },
      {
        "field": "points",
        "message": "Points must be greater than 0"
      }
    ]
  },
  "timestamp": "2026-02-10T10:30:00.000Z"
}
```

### Server Error Response

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  },
  "timestamp": "2026-02-10T10:30:00.000Z"
}
```

---

## Monitoring & Alerting

### Sentry Integration (Optional)

**API (Program.cs)**:
```csharp
builder.Services.AddSentry(options =>
{
    options.Dsn = builder.Configuration["Sentry:Dsn"];
    options.Environment = builder.Environment.EnvironmentName;
    options.TracesSampleRate = 0.1; // 10% of transactions
    options.Debug = builder.Environment.IsDevelopment();
});

app.UseSentryTracing();
```

**SPA**:
```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
    dsn: "https://your-dsn@sentry.io/project-id",
    environment: CONFIG.environment,
    tracesSampleRate: 0.1
});
```

### Key Metrics to Monitor

1. **Error Rate**: Errors per minute
2. **API Response Time**: p50, p95, p99
3. **Sync Success Rate**: % successful syncs
4. **Database Query Time**: Average query duration
5. **User Sessions**: Active users, session duration

### Alert Thresholds

- Error rate > 10 errors/minute
- API response time p95 > 1000ms
- Sync failure rate > 5%
- Database connection failures > 3 in 5 minutes

---

## Best Practices Checklist

### API

- [ ] All exceptions logged with context
- [ ] User-friendly error messages (never expose stack traces)
- [ ] Consistent error response format
- [ ] HTTP status codes used correctly
- [ ] Validation errors include field details
- [ ] Global error handling middleware configured

### SPA

- [ ] Try-catch around all async operations
- [ ] Network errors handled gracefully
- [ ] Offline mode supported
- [ ] Error messages displayed to users
- [ ] Errors logged to console and monitoring service
- [ ] Loading and error states managed

### WPF

- [ ] Global exception handlers configured
- [ ] User-friendly error dialogs
- [ ] All async operations wrapped in try-catch
- [ ] Errors logged to file
- [ ] Network errors handled with retry logic

### Logging

- [ ] Structured logging used (named parameters)
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] Log levels used appropriately
- [ ] Performance metrics logged
- [ ] Log rotation configured
- [ ] Monitoring service integrated

---

**END OF ERROR HANDLING & LOGGING STANDARDS**
