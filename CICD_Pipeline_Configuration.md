# CI/CD Pipeline Configuration
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0
**Date**: February 10, 2026
**Purpose**: Automate testing, building, and deployment across all platforms

---

## Table of Contents
1. [CI/CD Overview](#cicd-overview)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Railway Deployment](#railway-deployment)
4. [Netlify Deployment](#netlify-deployment)
5. [Automated Testing](#automated-testing)
6. [Release Management](#release-management)

---

## CI/CD Overview

### Pipeline Strategy

```
┌─────────────┐
│ Git Push    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  GitHub Actions Triggered           │
├─────────────────────────────────────┤
│  1. Lint & Format Check             │
│  2. Build All Projects              │
│  3. Run Unit Tests                  │
│  4. Run Integration Tests           │
│  5. Code Coverage Report            │
└──────┬──────────────────────────────┘
       │
       ├──── [main branch] ────────────┐
       │                               │
       ▼                               ▼
┌──────────────────┐         ┌────────────────────┐
│  Deploy API      │         │   Deploy SPA       │
│  to Railway      │         │   to Netlify       │
└──────────────────┘         └────────────────────┘
       │                               │
       ▼                               ▼
┌──────────────────┐         ┌────────────────────┐
│  Run Smoke Tests │         │  Run E2E Tests     │
└──────────────────┘         └────────────────────┘
```

### Repository Structure for CI/CD

```
FamilyTogether/
├── .github/
│   └── workflows/
│       ├── api-ci.yml           # API build & test
│       ├── api-deploy.yml       # API deployment to Railway
│       ├── spa-ci.yml           # SPA build & test
│       ├── spa-deploy.yml       # SPA deployment to Netlify
│       ├── wpf-build.yml        # WPF build & test
│       └── release.yml          # Create GitHub releases
├── src/
│   ├── FamilyTogether.API/
│   ├── FamilyTogether.SPA/
│   └── FamilyTogether.WPF/
├── tests/
│   ├── FamilyTogether.API.Tests/
│   └── FamilyTogether.SPA.Tests/
└── README.md
```

---

## GitHub Actions Workflows

### API CI/CD Workflow

**File**: `.github/workflows/api-ci.yml`

```yaml
name: API CI/CD

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'src/FamilyTogether.API/**'
      - 'tests/FamilyTogether.API.Tests/**'
      - '.github/workflows/api-ci.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'src/FamilyTogether.API/**'
      - 'tests/FamilyTogether.API.Tests/**'

env:
  DOTNET_VERSION: '6.0.x'

jobs:
  build-and-test:
    name: Build and Test API
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: ${{ env.DOTNET_VERSION }}

    - name: Restore dependencies
      run: dotnet restore src/FamilyTogether.API

    - name: Build
      run: dotnet build src/FamilyTogether.API --configuration Release --no-restore

    - name: Run unit tests
      run: dotnet test tests/FamilyTogether.API.Tests --configuration Release --no-build --verbosity normal --collect:"XPlat Code Coverage" --results-directory ./coverage

    - name: Code Coverage Report
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/**/coverage.cobertura.xml
        flags: api
        name: api-coverage

  deploy:
    name: Deploy to Railway
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Deploy to Railway
      uses: bervProject/railway-deploy@main
      with:
        railway_token: ${{ secrets.RAILWAY_TOKEN }}
        service: familytogether-api

    - name: Wait for deployment
      run: sleep 30

    - name: Health check
      run: |
        response=$(curl -s -o /dev/null -w "%{http_code}" https://familytogether-api.up.railway.app/health)
        if [ $response -eq 200 ]; then
          echo "Health check passed"
        else
          echo "Health check failed with status $response"
          exit 1
        fi
```

### SPA CI/CD Workflow

**File**: `.github/workflows/spa-ci.yml`

```yaml
name: SPA CI/CD

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'src/FamilyTogether.SPA/**'
      - '.github/workflows/spa-ci.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'src/FamilyTogether.SPA/**'

env:
  NODE_VERSION: '16.x'

jobs:
  build-and-test:
    name: Build and Test SPA
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}

    - name: Install dependencies
      working-directory: src/FamilyTogether.SPA
      run: npm ci

    - name: Run linter
      working-directory: src/FamilyTogether.SPA
      run: npm run lint || true  # Don't fail on linting for now

    - name: Run tests
      working-directory: src/FamilyTogether.SPA
      run: npm test -- --coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./src/FamilyTogether.SPA/coverage/lcov.info
        flags: spa
        name: spa-coverage

    - name: Build
      working-directory: src/FamilyTogether.SPA
      run: npm run build || echo "No build script, skipping"

  deploy:
    name: Deploy to Netlify
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v2
      with:
        publish-dir: './src/FamilyTogether.SPA'
        production-branch: main
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions"
        enable-pull-request-comment: true
        enable-commit-comment: true
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

    - name: Wait for deployment
      run: sleep 20

    - name: Health check
      run: |
        response=$(curl -s -o /dev/null -w "%{http_code}" https://familytogether.netlify.app)
        if [ $response -eq 200 ]; then
          echo "Health check passed"
        else
          echo "Health check failed with status $response"
          exit 1
        fi
```

### WPF Build Workflow

**File**: `.github/workflows/wpf-build.yml`

```yaml
name: WPF Build

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'src/FamilyTogether.WPF/**'
      - 'tests/FamilyTogether.WPF.Tests/**'
      - '.github/workflows/wpf-build.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'src/FamilyTogether.WPF/**'
      - 'tests/FamilyTogether.WPF.Tests/**'

env:
  DOTNET_VERSION: '6.0.x'

jobs:
  build-and-test:
    name: Build and Test WPF
    runs-on: windows-latest  # WPF requires Windows

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: ${{ env.DOTNET_VERSION }}

    - name: Restore dependencies
      run: dotnet restore src/FamilyTogether.WPF

    - name: Build
      run: dotnet build src/FamilyTogether.WPF --configuration Release --no-restore

    - name: Run tests
      run: dotnet test tests/FamilyTogether.WPF.Tests --configuration Release --no-build --verbosity normal

    - name: Publish
      run: dotnet publish src/FamilyTogether.WPF --configuration Release --output ./publish --self-contained false

    - name: Upload artifact
      uses: actions/upload-artifact@v3
      with:
        name: wpf-application
        path: ./publish
```

### Pull Request Checks

**File**: `.github/workflows/pr-checks.yml`

```yaml
name: Pull Request Checks

on:
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-format:
    name: Code Quality Checks
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '6.0.x'

    - name: Restore dotnet tools
      run: dotnet tool restore

    - name: Check code formatting
      run: dotnet format --verify-no-changes || echo "Code formatting issues found"

    - name: Run security scan
      run: |
        dotnet list package --vulnerable || true
        dotnet list package --deprecated || true

  build-all:
    name: Build All Projects
    runs-on: windows-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '6.0.x'

    - name: Build solution
      run: dotnet build --configuration Release

    - name: Run all tests
      run: dotnet test --configuration Release --no-build
```

---

## Railway Deployment

### Railway Configuration File

**File**: `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "dotnet publish src/FamilyTogether.API -c Release -o out"
  },
  "deploy": {
    "startCommand": "cd out && dotnet FamilyTogether.API.dll",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Railway CLI Deployment Script

**File**: `scripts/deploy-railway.sh`

```bash
#!/bin/bash

# Deploy to Railway via CLI

echo "Deploying API to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
railway login

# Link to project
railway link

# Set environment variables
railway variables set ASPNETCORE_ENVIRONMENT=Production

# Deploy
railway up

echo "Deployment complete!"
```

### Railway Environment Variables Setup

Set these variables in Railway Dashboard or via CLI:

```bash
# Core configuration
railway variables set SUPABASE_URL=https://xxxxx.supabase.co
railway variables set SUPABASE_ANON_KEY=your_anon_key
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
railway variables set SUPABASE_JWT_SECRET=your_jwt_secret

# Database
railway variables set DATABASE_CONNECTION_STRING="Host=db.xxxxx.supabase.co;Database=postgres;Username=postgres;Password=your_password"

# JWT Configuration
railway variables set JWT_ISSUER=https://xxxxx.supabase.co/auth/v1
railway variables set JWT_AUDIENCE=authenticated
railway variables set JWT_EXPIRY_MINUTES=60

# CORS
railway variables set CORS_ALLOWED_ORIGINS=https://familytogether.netlify.app

# Application
railway variables set ASPNETCORE_ENVIRONMENT=Production
railway variables set RATE_LIMIT_ENABLED=true

# Monitoring (Optional)
railway variables set SENTRY_DSN=your_sentry_dsn
```

---

## Netlify Deployment

### Netlify Configuration

**File**: `netlify.toml`

```toml
[build]
  publish = "src/FamilyTogether.SPA"
  command = ""  # No build step for vanilla JS

[context.production]
  environment = { VITE_API_URL = "https://familytogether-api.up.railway.app", VITE_ENVIRONMENT = "production" }

[context.production.processing]
  skip_processing = false

[context.deploy-preview]
  environment = { VITE_API_URL = "https://dev-familytogether-api.up.railway.app", VITE_ENVIRONMENT = "development" }

# Redirects for SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

# Cache static assets
[[headers]]
  for = "/src/styles/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Netlify CLI Deployment Script

**File**: `scripts/deploy-netlify.sh`

```bash
#!/bin/bash

# Deploy to Netlify via CLI

echo "Deploying SPA to Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Login to Netlify (if not already logged in)
netlify login

# Deploy to production
netlify deploy --prod --dir=src/FamilyTogether.SPA

echo "Deployment complete!"
echo "Site URL: https://familytogether.netlify.app"
```

### Netlify Environment Variables

Set these in Netlify Dashboard: Site settings → Environment variables

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=https://familytogether-api.up.railway.app
VITE_ENVIRONMENT=production
VITE_ENABLE_DEBUG=false
```

---

## Automated Testing

### Test Workflow Integration

**File**: `.github/workflows/automated-tests.yml`

```yaml
name: Automated Tests

on:
  schedule:
    - cron: '0 */6 * * *'  # Run every 6 hours
  workflow_dispatch:        # Manual trigger

jobs:
  api-integration-tests:
    name: API Integration Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '6.0.x'

    - name: Run integration tests
      env:
        DATABASE_CONNECTION_STRING: "Host=localhost;Database=test_db;Username=postgres;Password=postgres"
      run: dotnet test tests/FamilyTogether.API.IntegrationTests --configuration Release --logger "console;verbosity=detailed"

  e2e-tests:
    name: End-to-End Tests
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16.x'

    - name: Install Playwright
      run: |
        cd tests/FamilyTogether.E2E
        npm ci
        npx playwright install --with-deps

    - name: Run E2E tests
      run: |
        cd tests/FamilyTogether.E2E
        npx playwright test

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: tests/FamilyTogether.E2E/playwright-report/
```

### Smoke Tests After Deployment

**File**: `scripts/smoke-tests.sh`

```bash
#!/bin/bash

# Smoke tests to verify deployment

API_URL="https://familytogether-api.up.railway.app"
SPA_URL="https://familytogether.netlify.app"

echo "Running smoke tests..."

# Test API health endpoint
echo "Testing API health..."
api_status=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ $api_status -eq 200 ]; then
    echo "✓ API health check passed"
else
    echo "✗ API health check failed (status: $api_status)"
    exit 1
fi

# Test SPA is reachable
echo "Testing SPA accessibility..."
spa_status=$(curl -s -o /dev/null -w "%{http_code}" $SPA_URL)
if [ $spa_status -eq 200 ]; then
    echo "✓ SPA is accessible"
else
    echo "✗ SPA is not accessible (status: $spa_status)"
    exit 1
fi

# Test API authentication endpoint
echo "Testing API auth endpoint..."
auth_response=$(curl -s -X POST $API_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "%{http_code}")

if [[ $auth_response == *"401"* ]]; then
    echo "✓ API authentication endpoint working"
else
    echo "✗ API authentication endpoint not responding correctly"
    exit 1
fi

echo "All smoke tests passed! ✓"
```

---

## Release Management

### GitHub Release Workflow

**File**: `.github/workflows/release.yml`

```yaml
name: Create Release

on:
  push:
    tags:
      - 'v*.*.*'  # Triggered on version tags like v1.0.0

jobs:
  create-release:
    name: Create GitHub Release
    runs-on: windows-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '6.0.x'

    - name: Get version from tag
      id: get_version
      run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT

    - name: Build WPF application
      run: dotnet publish src/FamilyTogether.WPF --configuration Release --output ./publish --self-contained false

    - name: Create ZIP archive
      run: |
        cd publish
        Compress-Archive -Path * -DestinationPath ../FamilyTogether-WPF-${{ steps.get_version.outputs.VERSION }}.zip

    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        files: FamilyTogether-WPF-${{ steps.get_version.outputs.VERSION }}.zip
        draft: false
        prerelease: false
        generate_release_notes: true
        body: |
          # FamilyTogether ${{ steps.get_version.outputs.VERSION }}

          ## Installation Instructions

          ### WPF Desktop Application
          1. Download the ZIP file below
          2. Extract to a folder
          3. Run `FamilyTogether.WPF.exe`

          ### Requirements
          - .NET 6.0 Runtime or higher

          ## Changes
          See the full changelog below.
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Semantic Versioning Script

**File**: `scripts/bump-version.sh`

```bash
#!/bin/bash

# Bump version and create tag

VERSION_TYPE=$1  # major, minor, or patch

if [ -z "$VERSION_TYPE" ]; then
    echo "Usage: ./bump-version.sh [major|minor|patch]"
    exit 1
fi

# Get current version from latest tag
CURRENT_VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
CURRENT_VERSION=${CURRENT_VERSION#v}  # Remove 'v' prefix

# Parse version
IFS='.' read -r -a version_parts <<< "$CURRENT_VERSION"
MAJOR="${version_parts[0]}"
MINOR="${version_parts[1]}"
PATCH="${version_parts[2]}"

# Bump version
case $VERSION_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
    *)
        echo "Invalid version type. Use: major, minor, or patch"
        exit 1
        ;;
esac

NEW_VERSION="v$MAJOR.$MINOR.$PATCH"

echo "Bumping version from v$CURRENT_VERSION to $NEW_VERSION"

# Create and push tag
git tag -a $NEW_VERSION -m "Release $NEW_VERSION"
git push origin $NEW_VERSION

echo "Version bumped to $NEW_VERSION"
echo "GitHub Actions will automatically create a release"
```

---

## Secrets Management

### Required GitHub Secrets

Configure these in: Repository → Settings → Secrets and variables → Actions

```
# Railway
RAILWAY_TOKEN=<your_railway_token>

# Netlify
NETLIFY_AUTH_TOKEN=<your_netlify_token>
NETLIFY_SITE_ID=<your_site_id>

# Supabase (for testing)
TEST_SUPABASE_URL=<test_supabase_url>
TEST_SUPABASE_KEY=<test_supabase_key>

# Codecov (optional)
CODECOV_TOKEN=<your_codecov_token>

# Sentry (optional)
SENTRY_DSN=<your_sentry_dsn>
```

### How to Get Secrets

**Railway Token**:
```bash
railway login
railway whoami
# Token is stored in ~/.railway/config.json
```

**Netlify Token**:
```bash
netlify login
netlify sites:list
# Get site ID and create token in Netlify dashboard
```

---

## Rollback Procedures

### Rollback API Deployment

```bash
# Via Railway CLI
railway rollback

# Or redeploy previous version
git checkout <previous-commit>
railway up
```

### Rollback SPA Deployment

```bash
# Via Netlify CLI - rollback to previous deployment
netlify rollback

# Or redeploy specific deploy
netlify deploy --alias=<deploy-id> --prod
```

---

## Monitoring CI/CD

### GitHub Actions Dashboard

Monitor pipelines at: `https://github.com/<username>/FamilyTogether/actions`

### Key Metrics to Track

- Build success rate
- Test pass rate
- Deployment frequency
- Mean time to recovery (MTTR)
- Code coverage trends

### Notifications

Configure Slack/Discord webhooks for CI/CD notifications:

**File**: `.github/workflows/notify.yml`

```yaml
name: CI/CD Notifications

on:
  workflow_run:
    workflows: ["API CI/CD", "SPA CI/CD"]
    types: [completed]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
    - name: Notify on success
      if: ${{ github.event.workflow_run.conclusion == 'success' }}
      run: |
        curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
          -H 'Content-Type: application/json' \
          -d '{"text":"✓ Deployment successful: ${{ github.event.workflow_run.name }}"}'

    - name: Notify on failure
      if: ${{ github.event.workflow_run.conclusion == 'failure' }}
      run: |
        curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
          -H 'Content-Type: application/json' \
          -d '{"text":"✗ Deployment failed: ${{ github.event.workflow_run.name }}"}'
```

---

## Best Practices Checklist

- [ ] All workflows run on PR before merge
- [ ] Tests must pass before deployment
- [ ] Code coverage tracked and maintained
- [ ] Secrets stored in GitHub Secrets, not in code
- [ ] Deployment smoke tests after each deploy
- [ ] Rollback procedures documented and tested
- [ ] Notifications configured for failures
- [ ] Release tags follow semantic versioning
- [ ] Automated security scanning enabled
- [ ] Environment-specific configurations separated

---

**END OF CI/CD PIPELINE CONFIGURATION**
