# Development Setup Guide
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0  
**Date**: February 10, 2026  
**Target Audience**: Developers setting up local development environment

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [API Setup (ASP.NET Core)](#api-setup)
4. [SPA Setup (Browser)](#spa-setup)
5. [WPF Setup (Desktop)](#wpf-setup)
6. [Environment Configuration](#environment-configuration)
7. [Verification & Testing](#verification--testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose | Download Link |
|----------|---------|---------|--------------|
| **.NET SDK** | 6.0+ | API and WPF development | https://dot.net |
| **Node.js** | 16+ | SPA development (optional) | https://nodejs.org |
| **Git** | Latest | Version control | https://git-scm.com |
| **Visual Studio 2022** | Latest | WPF development (optional) | https://visualstudio.com |
| **VS Code** | Latest | Code editor | https://code.visualstudio.com |

### System Requirements

- **OS**: Windows 10/11, macOS, or Linux
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB free space
- **Internet**: Required for initial setup

---

## Supabase Setup

### Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended)
4. Verify email

### Step 2: Create New Project

1. Click "New Project"
2. Configure:
   - **Name**: FamilyTogether
   - **Database Password**: Generate strong password (SAVE THIS!)
   - **Region**: US West (recommended)
   - **Pricing**: Free
3. Wait 2-3 minutes for provisioning

### Step 3: Get API Credentials

1. Go to Project Settings → API
2. Save these values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc... (keep secret!)
   JWT Secret: (in Settings → API → JWT Settings)
   ```

### Step 4: Run Database Migration

1. Go to SQL Editor
2. Click "New Query"
3. Copy entire PostgreSQL migration from `Database_Schema_Design.md`
4. Execute (F5)
5. Verify all tables created

### Step 5: Enable Row Level Security

Run RLS policies from `Database_Schema_Design.md`

### Step 6: Configure Authentication

1. Go to Authentication → Providers
2. Enable Email provider
3. Turn OFF "Confirm email" for development
4. Save

---

## API Setup (ASP.NET Core)

### Step 1: Create Project

```bash
mkdir FamilyTogether
cd FamilyTogether

dotnet new webapi -n FamilyTogether.API
cd FamilyTogether.API
```

### Step 2: Install NuGet Packages

```bash
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 6.0.8
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 6.0.12
dotnet add package Microsoft.EntityFrameworkCore.Design --version 6.0.12
dotnet add package Supabase --version 0.9.3
dotnet add package Newtonsoft.Json --version 13.0.3
```

### Step 3: Configure appsettings.json

```json
{
  "ConnectionStrings": {
    "Supabase": "Host=db.xxxxx.supabase.co;Database=postgres;Username=postgres;Password=YOUR_PASSWORD"
  },
  "Supabase": {
    "Url": "https://xxxxx.supabase.co",
    "Key": "YOUR_ANON_KEY",
    "JwtSecret": "YOUR_JWT_SECRET"
  },
  "Jwt": {
    "Issuer": "https://xxxxx.supabase.co/auth/v1",
    "Audience": "authenticated",
    "ExpiryMinutes": 60
  }
}
```

### Step 4: Run API

```bash
dotnet run
# Visit https://localhost:5001/swagger
```

---

## SPA Setup (Browser)

### Step 1: Create Structure

```bash
mkdir FamilyTogether.SPA
cd FamilyTogether.SPA

mkdir src src/services src/components src/utils
```

### Step 2: Create index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FamilyTogether</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="src/app.js"></script>
</body>
</html>
```

### Step 3: Run Locally

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx http-server -p 8000

# Visit http://localhost:8000
```

---

## WPF Setup (Desktop)

### Step 1: Create Project

```bash
dotnet new wpf -n FamilyTogether.WPF
cd FamilyTogether.WPF
```

### Step 2: Install Packages

```bash
dotnet add package Microsoft.EntityFrameworkCore.Sqlite --version 6.0.12
dotnet add package Microsoft.EntityFrameworkCore.Design --version 6.0.12
dotnet add package Newtonsoft.Json --version 13.0.3
```

### Step 3: Run

```bash
dotnet run
```

---

## Environment Configuration

### API (.env or appsettings.Development.json)

```json
{
  "ConnectionStrings": {
    "Supabase": "YOUR_CONNECTION_STRING"
  },
  "Supabase": {
    "Url": "YOUR_PROJECT_URL",
    "Key": "YOUR_ANON_KEY",
    "JwtSecret": "YOUR_JWT_SECRET"
  }
}
```

### SPA (config.js)

```javascript
const CONFIG = {
    supabaseUrl: 'https://xxxxx.supabase.co',
    supabaseKey: 'your_anon_key',
    apiUrl: 'http://localhost:5000'
};
```

### Git (.gitignore)

```
.env
.env.local
appsettings.Development.json
bin/
obj/
node_modules/
*.db
.vs/
```

---

## Verification & Testing

### 1. Test Supabase Connection

```sql
-- In Supabase SQL Editor
SELECT * FROM families;
-- Should return empty (no error)
```

### 2. Test API

```bash
dotnet run
# Visit https://localhost:5001/swagger
# Try health endpoint
```

### 3. Test IndexedDB (Browser Console)

```javascript
indexedDB.databases().then(dbs => console.log(dbs))
```

---

## Troubleshooting

### "Cannot connect to Supabase"
- Verify project URL correct
- Check anon key
- Ensure RLS policies allow access

### "CORS error"
```csharp
// In Program.cs
app.UseCors("AllowAll");
```

### "JWT validation failed"
- Verify JWT secret matches
- Check token expiry
- Ensure audience/issuer correct

### "Entity Framework migration fails"
```bash
rm -rf Migrations/
dotnet ef migrations add InitialCreate
dotnet ef database update
```

---

## Next Steps

After setup complete:

1. ✅ Verify all components running
2. ✅ Test authentication
3. ✅ Create test data
4. → Proceed to Implementation_Roadmap.md

---

**END OF DEVELOPMENT SETUP GUIDE**
