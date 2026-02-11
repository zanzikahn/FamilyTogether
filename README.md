# FamilyTogether

> Local-first SaaS platform for family task management with points, rewards, and offline-first sync

[![Deploy to Railway](https://img.shields.io/badge/Deploy-Railway-blueviolet)](https://railway.app)
[![.NET 6.0](https://img.shields.io/badge/.NET-6.0-512BD4)](https://dotnet.microsoft.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Live Demo

- **Production API**: [https://charming-magic-production.up.railway.app](https://charming-magic-production.up.railway.app)
- **Health Check**: [https://charming-magic-production.up.railway.app/health](https://charming-magic-production.up.railway.app/health)

## 📋 Overview

FamilyTogether is a **local-first SaaS platform** designed for families to manage tasks, track points, and redeem rewards. The platform works offline-first and syncs when online, ensuring your family data is always available.

### Key Features

- ✅ **Offline-First**: All functionality works without internet connection
- 🔐 **Secure Authentication**: JWT-based auth via Supabase
- 👨‍👩‍👧‍👦 **Family Management**: Create families, add members with roles
- 📱 **Cross-Platform**: Web (SPA), Desktop (WPF), Mobile-ready API
- 🔄 **Automatic Sync**: Background sync with conflict resolution
- 🎯 **Task Management**: Assign tasks, earn points, redeem rewards

## 🏗️ Architecture

### Components

1. **API** (.NET 6.0) - ASP.NET Core Web API deployed on Railway
2. **SPA** (Vanilla JavaScript) - Single-page app with IndexedDB for offline storage
3. **WPF** (.NET 6.0) - Windows desktop application with SQLite

### Tech Stack

- **Backend**: ASP.NET Core 6.0, Entity Framework Core
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (JWT via JWKS)
- **Deployment**: Railway.app (API), Netlify (SPA)
- **Storage**: PostgreSQL (cloud), IndexedDB (web), SQLite (desktop)

## 🚦 Getting Started

### Prerequisites

- [.NET 6.0 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)
- [Node.js](https://nodejs.org/) (for Railway CLI)
- [Supabase Account](https://supabase.com/) (free tier)
- [Railway Account](https://railway.app/) (optional for deployment)

### 1. Clone Repository

```bash
git clone https://github.com/zanzikahn/FamilyTogether.git
cd FamilyTogether
```

### 2. Setup Supabase Database

1. Create a Supabase project
2. Run migrations from `migrations/` folder:
   - `001_initial_schema.sql` - Creates tables, indexes, triggers
   - `002_rls_policies.sql` - Sets up Row Level Security

See [SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md) for detailed instructions.

### 3. Configure API

```bash
cd FamilyTogether.API

# Copy and configure settings
cp appsettings.json appsettings.Development.json
```

Edit `appsettings.Development.json` with your Supabase credentials:

```json
{
  "ConnectionStrings": {
    "Supabase": "Host=db.YOUR_PROJECT_ID.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true"
  },
  "Supabase": {
    "Url": "https://YOUR_PROJECT_ID.supabase.co",
    "PublishableKey": "YOUR_PUBLISHABLE_KEY",
    "SecretKey": "YOUR_SECRET_KEY",
    "JwtKeyId": "YOUR_JWT_KEY_ID",
    "JwtDiscoveryUrl": "https://YOUR_PROJECT_ID.supabase.co/auth/v1/.well-known/jwks.json"
  }
}
```

### 4. Run API Locally

```bash
dotnet restore
dotnet build
dotnet run

# API available at:
# - https://localhost:7290
# - Swagger UI: https://localhost:7290/swagger
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user and create family
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - Sign out user
- `GET /api/auth/profile` - Get user profile

### Family Management

- `GET /api/families` - List all families for authenticated user
- `GET /api/families/{id}` - Get single family details
- `POST /api/families` - Create new family
- `POST /api/families/{familyId}/members` - Add family member

See [API_ENDPOINTS.md](FamilyTogether.API/API_ENDPOINTS.md) for detailed documentation.

## 🚀 Deployment

### Deploy to Railway

This repository includes automatic deployment via GitHub Actions.

1. **Get Railway Token**:
   ```bash
   railway login
   railway whoami --token
   ```

2. **Add GitHub Secret**:
   - Go to repository **Settings → Secrets → Actions**
   - Add secret: `RAILWAY_TOKEN` = your token

3. **Deploy**:
   - Push to `main` branch triggers automatic deployment
   - Or manually trigger via Actions tab

### Manual Railway Deployment

```bash
cd FamilyTogether.API
railway login
railway link
railway up
```

## 📚 Documentation

- [CLAUDE.md](CLAUDE.md) - Developer guide and code conventions
- [INITIATE_DEVELOPMENT.md](INITIATE_DEVELOPMENT.md) - Development roadmap
- [Technical_Architecture_Document.md](Technical_Architecture_Document.md) - Architecture details
- [Database_Schema_Design.md](Database_Schema_Design.md) - Database schema
- [Security_Checklist.md](Security_Checklist.md) - Security considerations

## 🧪 Testing

```bash
# Run API tests
cd FamilyTogether.API.Tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## 🔐 Security

- All secrets stored in Railway environment variables
- JWT authentication with automatic token refresh
- Row Level Security (RLS) on all database tables
- CORS configured for specific origins
- Input validation on all endpoints

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📧 Support

For support, email zanzikahn@hotmail.com or open an issue on GitHub.

---

**Built with** ❤️ **using [Claude Code](https://claude.com/claude-code)**
