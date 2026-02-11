# Environment Configuration Templates
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0
**Date**: February 10, 2026
**Purpose**: Provide complete environment configuration templates for all components

---

## Table of Contents
1. [API Environment Configuration](#api-environment-configuration)
2. [SPA Environment Configuration](#spa-environment-configuration)
3. [WPF Environment Configuration](#wpf-environment-configuration)
4. [Development vs Production Configurations](#development-vs-production-configurations)
5. [Security Best Practices](#security-best-practices)

---

## API Environment Configuration

### appsettings.json (Base Configuration)

**File**: `FamilyTogether.API/appsettings.json`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ApplicationInsights": {
    "InstrumentationKey": ""
  }
}
```

### appsettings.Development.json (Local Development)

**File**: `FamilyTogether.API/appsettings.Development.json`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  },
  "ConnectionStrings": {
    "Supabase": "Host=db.xxxxxxxxxxxxx.supabase.co;Database=postgres;Username=postgres;Password=YOUR_DEV_PASSWORD_HERE"
  },
  "Supabase": {
    "Url": "https://xxxxxxxxxxxxx.supabase.co",
    "AnonKey": "YOUR_SUPABASE_ANON_KEY_HERE",
    "ServiceRoleKey": "YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE",
    "JwtSecret": "YOUR_SUPABASE_JWT_SECRET_HERE"
  },
  "Jwt": {
    "Issuer": "https://xxxxxxxxxxxxx.supabase.co/auth/v1",
    "Audience": "authenticated",
    "ExpiryMinutes": 60,
    "ValidateIssuer": true,
    "ValidateAudience": true,
    "ValidateLifetime": true,
    "ValidateIssuerSigningKey": true
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:8000",
      "http://localhost:3000",
      "http://127.0.0.1:8000"
    ]
  },
  "RateLimit": {
    "Enabled": false,
    "GeneralLimit": 100,
    "AuthLimit": 5,
    "SyncLimit": 2,
    "WindowMinutes": 1
  },
  "Sync": {
    "MaxChangesPerRequest": 100,
    "ConflictResolutionStrategy": "LastWriteWins",
    "EnableDetailedLogging": true
  }
}
```

### appsettings.Production.json (Production)

**File**: `FamilyTogether.API/appsettings.Production.json`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Error"
    }
  },
  "ConnectionStrings": {
    "Supabase": "Host=db.xxxxxxxxxxxxx.supabase.co;Database=postgres;Username=postgres;Password=PRODUCTION_PASSWORD_REPLACE_ME"
  },
  "Supabase": {
    "Url": "https://xxxxxxxxxxxxx.supabase.co",
    "AnonKey": "PRODUCTION_ANON_KEY_REPLACE_ME",
    "ServiceRoleKey": "PRODUCTION_SERVICE_ROLE_KEY_REPLACE_ME",
    "JwtSecret": "PRODUCTION_JWT_SECRET_REPLACE_ME"
  },
  "Jwt": {
    "Issuer": "https://xxxxxxxxxxxxx.supabase.co/auth/v1",
    "Audience": "authenticated",
    "ExpiryMinutes": 60,
    "ValidateIssuer": true,
    "ValidateAudience": true,
    "ValidateLifetime": true,
    "ValidateIssuerSigningKey": true
  },
  "Cors": {
    "AllowedOrigins": [
      "https://familytogether.netlify.app",
      "https://www.yourdomainhere.com"
    ]
  },
  "RateLimit": {
    "Enabled": true,
    "GeneralLimit": 100,
    "AuthLimit": 5,
    "SyncLimit": 2,
    "WindowMinutes": 1
  },
  "Sync": {
    "MaxChangesPerRequest": 100,
    "ConflictResolutionStrategy": "LastWriteWins",
    "EnableDetailedLogging": false
  },
  "Sentry": {
    "Dsn": "https://your-sentry-dsn-here.ingest.sentry.io/project-id",
    "Environment": "production",
    "TracesSampleRate": 0.1
  }
}
```

### .env.example (Alternative Environment Variables)

**File**: `FamilyTogether.API/.env.example`

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Database Connection
DATABASE_CONNECTION_STRING=Host=db.xxxxxxxxxxxxx.supabase.co;Database=postgres;Username=postgres;Password=your_password_here

# JWT Configuration
JWT_ISSUER=https://xxxxxxxxxxxxx.supabase.co/auth/v1
JWT_AUDIENCE=authenticated
JWT_EXPIRY_MINUTES=60

# CORS Configuration (comma-separated)
CORS_ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000

# Application Settings
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5000;https://localhost:5001

# Rate Limiting
RATE_LIMIT_ENABLED=false
RATE_LIMIT_GENERAL=100
RATE_LIMIT_AUTH=5
RATE_LIMIT_SYNC=2

# Sync Settings
SYNC_MAX_CHANGES_PER_REQUEST=100
SYNC_CONFLICT_RESOLUTION=LastWriteWins
SYNC_DETAILED_LOGGING=true

# Monitoring (Optional)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
```

### Railway.app Environment Variables

**Configure these in Railway Dashboard**:

```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
SUPABASE_JWT_SECRET=<your_jwt_secret>
DATABASE_CONNECTION_STRING=<your_connection_string>
JWT_ISSUER=https://xxxxxxxxxxxxx.supabase.co/auth/v1
JWT_AUDIENCE=authenticated
JWT_EXPIRY_MINUTES=60
CORS_ALLOWED_ORIGINS=https://familytogether.netlify.app
ASPNETCORE_ENVIRONMENT=Production
RATE_LIMIT_ENABLED=true
SENTRY_DSN=<optional_sentry_dsn>
```

---

## SPA Environment Configuration

### config.js (Base Configuration)

**File**: `FamilyTogether.SPA/src/config.js`

```javascript
const CONFIG = {
    // Supabase Configuration
    supabaseUrl: 'https://xxxxxxxxxxxxx.supabase.co',
    supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY_HERE',

    // API Configuration
    apiUrl: 'http://localhost:5000',
    apiTimeout: 30000, // 30 seconds

    // Sync Configuration
    syncIntervalMs: 30000, // 30 seconds
    syncRetryAttempts: 3,
    syncRetryDelayMs: 1000, // Start with 1 second, exponential backoff
    maxChangesPerSync: 100,

    // IndexedDB Configuration
    dbName: 'FamilyTogetherDB',
    dbVersion: 1,

    // Storage Configuration
    maxLocalStorageMB: 50,
    enableOfflineMode: true,

    // UI Configuration
    defaultTheme: 'light',
    enableDebugMode: false,

    // Feature Flags
    features: {
        offlineMode: true,
        autoSync: true,
        pushNotifications: false,
        analytics: false
    }
};

// Freeze to prevent modification
Object.freeze(CONFIG);

export default CONFIG;
```

### config.development.js (Development Override)

**File**: `FamilyTogether.SPA/src/config.development.js`

```javascript
const DEV_CONFIG = {
    // Override base config for development
    apiUrl: 'http://localhost:5000',
    enableDebugMode: true,

    // More frequent sync for testing
    syncIntervalMs: 10000, // 10 seconds

    // Enable all features for development
    features: {
        offlineMode: true,
        autoSync: true,
        pushNotifications: true,
        analytics: true
    }
};

export default DEV_CONFIG;
```

### config.production.js (Production Override)

**File**: `FamilyTogether.SPA/src/config.production.js`

```javascript
const PROD_CONFIG = {
    // Override base config for production
    apiUrl: 'https://familytogether-api.up.railway.app',
    enableDebugMode: false,

    // Standard sync interval
    syncIntervalMs: 30000, // 30 seconds

    // Disable experimental features
    features: {
        offlineMode: true,
        autoSync: true,
        pushNotifications: false, // Enable when ready
        analytics: true // Enable with analytics service
    }
};

export default PROD_CONFIG;
```

### .env.example (Netlify Environment Variables)

**File**: `FamilyTogether.SPA/.env.example`

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# API Configuration
VITE_API_URL=http://localhost:5000

# Application Settings
VITE_APP_NAME=FamilyTogether
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_AUTO_SYNC=true
VITE_ENABLE_DEBUG=true
```

### netlify.toml (Netlify Configuration)

**File**: `FamilyTogether.SPA/netlify.toml`

```toml
[build]
  publish = "."
  command = ""

# Production environment
[context.production]
  [context.production.environment]
    VITE_API_URL = "https://familytogether-api.up.railway.app"
    VITE_ENVIRONMENT = "production"
    VITE_ENABLE_DEBUG = "false"

# Development branch environment
[context.develop]
  [context.develop.environment]
    VITE_API_URL = "https://dev-familytogether-api.up.railway.app"
    VITE_ENVIRONMENT = "development"
    VITE_ENABLE_DEBUG = "true"

# Redirects for SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security Headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

# Cache static assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## WPF Environment Configuration

### App.config (Application Configuration)

**File**: `FamilyTogether.WPF/App.config`

```xml
<?xml version="1.0" encoding="utf-8" ?>
<configuration>
  <appSettings>
    <!-- Supabase Configuration -->
    <add key="SupabaseUrl" value="https://xxxxxxxxxxxxx.supabase.co" />
    <add key="SupabaseAnonKey" value="YOUR_SUPABASE_ANON_KEY_HERE" />

    <!-- API Configuration -->
    <add key="ApiUrl" value="http://localhost:5000" />
    <add key="ApiTimeout" value="30000" />

    <!-- Database Configuration -->
    <add key="DatabasePath" value="%APPDATA%\FamilyTogether\app.db" />

    <!-- Sync Configuration -->
    <add key="SyncIntervalMs" value="30000" />
    <add key="SyncRetryAttempts" value="3" />
    <add key="MaxChangesPerSync" value="100" />

    <!-- Application Settings -->
    <add key="EnableOfflineMode" value="true" />
    <add key="EnableDebugMode" value="false" />
    <add key="AutoStartSync" value="true" />

    <!-- Logging -->
    <add key="LogLevel" value="Information" />
    <add key="LogPath" value="%APPDATA%\FamilyTogether\Logs" />
  </appSettings>

  <connectionStrings>
    <add name="LocalDatabase"
         connectionString="Data Source=%APPDATA%\FamilyTogether\app.db"
         providerName="Microsoft.EntityFrameworkCore.Sqlite" />
  </connectionStrings>
</configuration>
```

### appsettings.json (Alternative .NET 6 Style)

**File**: `FamilyTogether.WPF/appsettings.json`

```json
{
  "Supabase": {
    "Url": "https://xxxxxxxxxxxxx.supabase.co",
    "AnonKey": "YOUR_SUPABASE_ANON_KEY_HERE"
  },
  "Api": {
    "Url": "http://localhost:5000",
    "Timeout": 30000
  },
  "Database": {
    "Path": "%APPDATA%\\FamilyTogether\\app.db"
  },
  "Sync": {
    "IntervalMs": 30000,
    "RetryAttempts": 3,
    "MaxChangesPerSync": 100
  },
  "Application": {
    "EnableOfflineMode": true,
    "EnableDebugMode": false,
    "AutoStartSync": true
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    },
    "LogPath": "%APPDATA%\\FamilyTogether\\Logs"
  }
}
```

### appsettings.Production.json (WPF Production)

**File**: `FamilyTogether.WPF/appsettings.Production.json`

```json
{
  "Api": {
    "Url": "https://familytogether-api.up.railway.app",
    "Timeout": 30000
  },
  "Application": {
    "EnableDebugMode": false
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft": "Error"
    }
  }
}
```

---

## Development vs Production Configurations

### Configuration Comparison Table

| Setting | Development | Production |
|---------|-------------|------------|
| **API URL** | `http://localhost:5000` | `https://familytogether-api.up.railway.app` |
| **CORS Origins** | `localhost:8000, localhost:3000` | `familytogether.netlify.app` |
| **Log Level** | `Debug` / `Information` | `Warning` / `Error` |
| **Rate Limiting** | Disabled | Enabled |
| **JWT Expiry** | 60 minutes | 60 minutes |
| **Sync Interval** | 10-30 seconds | 30 seconds |
| **Debug Mode** | Enabled | Disabled |
| **Detailed Logging** | Enabled | Disabled |
| **EF Logging** | `Information` | `Error` |

### Environment Detection Strategy

**API (Program.cs)**:
```csharp
var environment = builder.Environment.EnvironmentName;

if (environment == "Development")
{
    // Development-specific configuration
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Development", policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    });
}
else
{
    // Production-specific configuration
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Production", policy =>
        {
            policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>())
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });
}
```

**SPA (main.js)**:
```javascript
// Detect environment
const environment = import.meta.env.MODE || 'production';

// Load appropriate config
let config;
if (environment === 'development') {
    config = { ...CONFIG, ...DEV_CONFIG };
} else {
    config = { ...CONFIG, ...PROD_CONFIG };
}

console.log(`Running in ${environment} mode`);
```

**WPF (App.xaml.cs)**:
```csharp
public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        // Detect environment from command line args or config
        var isDevelopment = e.Args.Contains("--dev") ||
                           ConfigurationManager.AppSettings["EnableDebugMode"] == "true";

        if (isDevelopment)
        {
            // Load development settings
            ConfigurationManager.AppSettings["ApiUrl"] = "http://localhost:5000";
        }
    }
}
```

---

## Security Best Practices

### 1. Never Commit Secrets

**Add to .gitignore**:
```
# API
appsettings.Development.json
appsettings.Production.json
.env
.env.local
.env.production

# SPA
.env
.env.local
.env.development.local
.env.production.local
config.production.js

# WPF
App.config
appsettings.json
appsettings.Production.json
```

### 2. Use Environment Variables

**API (Program.cs)**:
```csharp
// Read from environment variables (Railway, Azure, etc.)
builder.Configuration.AddEnvironmentVariables();

var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL")
                  ?? builder.Configuration["Supabase:Url"];
```

**SPA (config.js)**:
```javascript
// Read from Vite environment variables
const CONFIG = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'fallback-url',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000'
};
```

### 3. Rotate Secrets Regularly

**Rotation Schedule**:
- JWT Secret: Every 90 days
- Supabase Service Role Key: Every 6 months
- Database Password: Every 90 days

### 4. Validate Configuration on Startup

**API (Program.cs)**:
```csharp
// Validate required configuration
var requiredSettings = new[] {
    "Supabase:Url",
    "Supabase:AnonKey",
    "Supabase:JwtSecret",
    "ConnectionStrings:Supabase"
};

foreach (var setting in requiredSettings)
{
    if (string.IsNullOrEmpty(builder.Configuration[setting]))
    {
        throw new InvalidOperationException($"Required configuration '{setting}' is missing");
    }
}
```

---

## Configuration Checklist

### Before Development Starts

- [ ] Copy `.env.example` to `.env` (API & SPA)
- [ ] Copy `appsettings.json.example` to `appsettings.Development.json` (API)
- [ ] Replace all `YOUR_*_HERE` placeholders with actual values
- [ ] Verify Supabase project URL and keys
- [ ] Test database connection string
- [ ] Confirm CORS origins for local development
- [ ] Add `.env` and sensitive config files to `.gitignore`

### Before Production Deployment

- [ ] Create `appsettings.Production.json` with production values
- [ ] Configure Railway environment variables
- [ ] Configure Netlify environment variables
- [ ] Set production CORS origins
- [ ] Enable rate limiting
- [ ] Disable debug mode
- [ ] Set appropriate log levels
- [ ] Configure Sentry DSN (optional)
- [ ] Test production API URL from SPA
- [ ] Verify JWT token validation
- [ ] Test file upload to Supabase Storage

---

## Troubleshooting

### Issue: "Cannot connect to Supabase"

**Check**:
1. Supabase URL format: `https://xxxxx.supabase.co`
2. Anon key is correct (not service role key)
3. Project is not paused (Supabase free tier)

### Issue: "CORS error in browser"

**Check**:
1. API CORS policy includes SPA origin
2. `UseCors()` called before `UseAuthorization()` in Program.cs
3. Netlify URL matches exactly (trailing slash matters)

### Issue: "JWT validation failed"

**Check**:
1. JWT Secret matches Supabase project
2. Issuer format: `https://xxxxx.supabase.co/auth/v1`
3. Audience is `"authenticated"`
4. Token hasn't expired (check client clock)

### Issue: "Configuration not loading"

**Check**:
1. File naming: `appsettings.Development.json` (capital D)
2. File in correct directory (project root)
3. "Copy to Output Directory" = "Copy if newer"
4. Environment variable `ASPNETCORE_ENVIRONMENT` set correctly

---

## Quick Reference

### Get Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy:
   - Project URL
   - anon public key
   - service_role key (keep secret!)
5. Settings → API → JWT Settings
6. Copy: JWT Secret

### Set Railway Environment Variables

```bash
# Via Railway CLI
railway variables set SUPABASE_URL=https://xxxxx.supabase.co
railway variables set SUPABASE_ANON_KEY=your_key_here

# Or via Dashboard
# Project → Variables → Add Variable
```

### Set Netlify Environment Variables

```bash
# Via Netlify CLI
netlify env:set VITE_API_URL https://your-api.railway.app

# Or via Dashboard
# Site → Site settings → Environment variables
```

---

**END OF ENVIRONMENT CONFIGURATION TEMPLATES**
