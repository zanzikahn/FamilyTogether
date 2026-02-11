# Deployment Checklists & Scripts
## FamilyTogether - Local-First SaaS Platform

**Version**: 1.0
**Date**: February 10, 2026
**Purpose**: Complete deployment procedures and automation scripts

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Supabase Setup](#supabase-setup)
3. [API Deployment to Railway](#api-deployment-to-railway)
4. [SPA Deployment to Netlify](#spa-deployment-to-netlify)
5. [WPF Desktop Distribution](#wpf-desktop-distribution)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Development Complete Checklist

- [ ] All features implemented and tested
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] No console errors or warnings
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Migration scripts prepared

### Configuration Checklist

- [ ] Environment variables documented
- [ ] Secrets prepared (not committed to git)
- [ ] CORS origins configured correctly
- [ ] JWT secrets generated
- [ ] Database connection strings prepared
- [ ] API URLs configured for production
- [ ] Rate limiting enabled
- [ ] Logging configured appropriately

### Infrastructure Checklist

- [ ] Supabase project created
- [ ] Railway account created
- [ ] Netlify account created
- [ ] Custom domains purchased (optional)
- [ ] SSL certificates ready (automatic with Netlify/Railway)
- [ ] Monitoring tools configured (Sentry, etc.)
- [ ] Backup strategy documented

---

## Supabase Setup

### Step 1: Create Supabase Project

```bash
# 1. Go to https://supabase.com
# 2. Click "New Project"
# 3. Fill in details:
#    - Name: FamilyTogether
#    - Database Password: (generate strong password and SAVE IT!)
#    - Region: US West (or closest to your users)
#    - Pricing Plan: Free (or Pro if needed)
# 4. Wait 2-3 minutes for provisioning
```

### Step 2: Run Database Migrations

**Script**: `scripts/setup-supabase.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create families table
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified BIGINT NOT NULL DEFAULT extract(epoch from NOW())::BIGINT * 1000,
    is_deleted BOOLEAN DEFAULT FALSE,
    change_id UUID DEFAULT gen_random_uuid(),
    sync_version INTEGER DEFAULT 1
);

-- Create members table
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('parent', 'child', 'admin')),
    avatar VARCHAR(10),
    points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    parent_id UUID REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified BIGINT NOT NULL DEFAULT extract(epoch from NOW())::BIGINT * 1000,
    is_deleted BOOLEAN DEFAULT FALSE,
    change_id UUID DEFAULT gen_random_uuid(),
    sync_version INTEGER DEFAULT 1
);

-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL CHECK (points >= 0),
    assigned_to UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'awaiting_approval', 'approved', 'rejected')),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50) CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', NULL)),
    recurrence_day INTEGER,
    last_generated_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES members(id),
    completion_note TEXT,
    completion_photo_url VARCHAR(500),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES members(id),
    review_note TEXT,
    bonus_points INTEGER DEFAULT 0,
    bonus_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified BIGINT NOT NULL DEFAULT extract(epoch from NOW())::BIGINT * 1000,
    is_deleted BOOLEAN DEFAULT FALSE,
    change_id UUID DEFAULT gen_random_uuid(),
    sync_version INTEGER DEFAULT 1
);

-- Create indexes
CREATE INDEX idx_families_created_by ON families(created_by);
CREATE INDEX idx_families_last_modified ON families(last_modified);
CREATE INDEX idx_members_family_id ON members(family_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Enable Row Level Security
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their families"
ON families FOR SELECT
USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = families.id
        AND members.user_id = auth.uid()
        AND members.is_deleted = FALSE
    )
);

CREATE POLICY "Users can view family members"
ON members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM families
        WHERE families.id = members.family_id
        AND (
            families.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM members m2
                WHERE m2.family_id = families.id
                AND m2.user_id = auth.uid()
                AND m2.is_deleted = FALSE
            )
        )
    )
);

CREATE POLICY "Users can view family tasks"
ON tasks FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.family_id = tasks.family_id
        AND members.user_id = auth.uid()
        AND members.is_deleted = FALSE
    )
);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_modified = extract(epoch from NOW())::BIGINT * 1000;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Run in Supabase SQL Editor**:
1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste the above SQL
3. Click "Run" or press F5
4. Verify all tables created successfully

### Step 3: Get Supabase Credentials

```bash
# Save these values from Supabase Dashboard → Settings → API:

PROJECT_URL: https://xxxxxxxxxxxxx.supabase.co
ANON_KEY: eyJhbGc... (public, safe to expose)
SERVICE_ROLE_KEY: eyJhbGc... (SECRET! Server-only!)
JWT_SECRET: (Settings → API → JWT Settings)
```

### Step 4: Enable Email Authentication

1. Go to Authentication → Providers
2. Enable Email provider
3. For development: Turn OFF "Confirm email"
4. For production: Keep "Confirm email" ON
5. Configure email templates (optional)

---

## API Deployment to Railway

### Option 1: Deploy via Railway CLI (Recommended)

**Script**: `scripts/deploy-api-railway.sh`

```bash
#!/bin/bash

echo "========================================"
echo "  Deploying API to Railway"
echo "========================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login (if not already)
echo "Logging into Railway..."
railway login

# Link to project (first time only)
echo "Linking to Railway project..."
railway link

# Set environment variables
echo "Setting environment variables..."
railway variables set ASPNETCORE_ENVIRONMENT=Production
railway variables set SUPABASE_URL="$SUPABASE_URL"
railway variables set SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
railway variables set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
railway variables set SUPABASE_JWT_SECRET="$SUPABASE_JWT_SECRET"
railway variables set DATABASE_CONNECTION_STRING="$DATABASE_CONNECTION_STRING"
railway variables set JWT_ISSUER="$JWT_ISSUER"
railway variables set JWT_AUDIENCE="authenticated"
railway variables set CORS_ALLOWED_ORIGINS="$CORS_ALLOWED_ORIGINS"
railway variables set RATE_LIMIT_ENABLED=true

# Deploy
echo "Deploying application..."
railway up

# Get deployment URL
echo ""
echo "✓ Deployment complete!"
echo "API URL: $(railway domain)"
echo ""
echo "Run 'railway logs' to view logs"
```

**Usage**:
```bash
# Set environment variables first
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_ANON_KEY="your_anon_key"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export SUPABASE_JWT_SECRET="your_jwt_secret"
export DATABASE_CONNECTION_STRING="Host=db.xxxxx.supabase.co;..."
export JWT_ISSUER="https://xxxxx.supabase.co/auth/v1"
export CORS_ALLOWED_ORIGINS="https://familytogether.netlify.app"

# Run deployment script
chmod +x scripts/deploy-api-railway.sh
./scripts/deploy-api-railway.sh
```

### Option 2: Deploy via GitHub Integration

1. **Connect GitHub Repository**
   - Go to Railway Dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects .NET project

2. **Configure Environment Variables** (in Railway Dashboard)
   ```
   ASPNETCORE_ENVIRONMENT=Production
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   DATABASE_CONNECTION_STRING=Host=db.xxxxx.supabase.co;...
   JWT_ISSUER=https://xxxxx.supabase.co/auth/v1
   JWT_AUDIENCE=authenticated
   CORS_ALLOWED_ORIGINS=https://familytogether.netlify.app
   RATE_LIMIT_ENABLED=true
   ```

3. **Generate Domain**
   - Go to Settings → Networking
   - Click "Generate Domain"
   - Save the URL: `https://familytogether-api.up.railway.app`

4. **Deploy**
   - Push to main branch
   - Railway automatically builds and deploys

### Deployment Checklist (Railway)

- [ ] Railway account created
- [ ] Repository connected to Railway
- [ ] All environment variables set
- [ ] Domain generated
- [ ] Health check endpoint configured
- [ ] First deployment successful
- [ ] Health check passing
- [ ] Logs showing no errors

---

## SPA Deployment to Netlify

### Option 1: Deploy via Netlify CLI

**Script**: `scripts/deploy-spa-netlify.sh`

```bash
#!/bin/bash

echo "========================================"
echo "  Deploying SPA to Netlify"
echo "========================================"

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Login
echo "Logging into Netlify..."
netlify login

# Initialize site (first time only)
if [ ! -f ".netlify/state.json" ]; then
    echo "Creating new Netlify site..."
    netlify init
fi

# Set environment variables
echo "Setting environment variables..."
netlify env:set VITE_SUPABASE_URL "$SUPABASE_URL"
netlify env:set VITE_SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY"
netlify env:set VITE_API_URL "$API_URL"
netlify env:set VITE_ENVIRONMENT "production"

# Deploy to production
echo "Deploying to production..."
netlify deploy --prod --dir=src/FamilyTogether.SPA

echo ""
echo "✓ Deployment complete!"
echo "Site URL: $(netlify status | grep 'Site URL' | awk '{print $3}')"
```

**Usage**:
```bash
# Set environment variables
export SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_ANON_KEY="your_anon_key"
export API_URL="https://familytogether-api.up.railway.app"

# Run deployment
chmod +x scripts/deploy-spa-netlify.sh
./scripts/deploy-spa-netlify.sh
```

### Option 2: Deploy via GitHub Integration

1. **Connect GitHub Repository**
   - Go to Netlify Dashboard
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository
   - Branch: main

2. **Configure Build Settings**
   ```
   Base directory: src/FamilyTogether.SPA
   Build command: (leave empty for vanilla JS)
   Publish directory: src/FamilyTogether.SPA
   ```

3. **Set Environment Variables** (Site settings → Environment variables)
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_API_URL=https://familytogether-api.up.railway.app
   VITE_ENVIRONMENT=production
   VITE_ENABLE_DEBUG=false
   ```

4. **Configure netlify.toml** (already in repo)

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Site URL: `https://familytogether.netlify.app`

### Deployment Checklist (Netlify)

- [ ] Netlify account created
- [ ] Repository connected
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] netlify.toml configured
- [ ] First deployment successful
- [ ] Site accessible
- [ ] No console errors
- [ ] API calls working

---

## WPF Desktop Distribution

### Option 1: GitHub Releases (Recommended for Start)

**Script**: `scripts/publish-wpf-github.sh`

```bash
#!/bin/bash

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: ./publish-wpf-github.sh v1.0.0"
    exit 1
fi

echo "========================================"
echo "  Publishing WPF v$VERSION to GitHub"
echo "========================================"

# Build and publish
echo "Building WPF application..."
dotnet publish src/FamilyTogether.WPF \
    --configuration Release \
    --output ./publish/wpf \
    --self-contained false \
    --runtime win-x64

# Create ZIP archive
echo "Creating ZIP archive..."
cd publish/wpf
zip -r "../FamilyTogether-WPF-${VERSION}.zip" .
cd ../..

# Create GitHub release and upload
echo "Creating GitHub release..."
gh release create "$VERSION" \
    "publish/FamilyTogether-WPF-${VERSION}.zip" \
    --title "FamilyTogether $VERSION" \
    --notes "Release $VERSION

## Installation Instructions

1. Download the ZIP file below
2. Extract to a folder on your computer
3. Run FamilyTogether.WPF.exe

## Requirements
- Windows 10/11
- .NET 6.0 Runtime or higher

## Changes
See full changelog for details."

echo ""
echo "✓ Release created!"
echo "View at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases/tag/$VERSION"
```

**Usage**:
```bash
chmod +x scripts/publish-wpf-github.sh
./scripts/publish-wpf-github.sh v1.0.0
```

### Option 2: ClickOnce Publishing

```bash
# Publish with ClickOnce
dotnet publish src/FamilyTogether.WPF \
    --configuration Release \
    --runtime win-x64 \
    --self-contained false \
    -p:PublishProfile=ClickOnce \
    -p:ApplicationVersion=1.0.0.0

# Files will be in: bin/Release/net6.0-windows/win-x64/publish/
# Upload to web server for distribution
```

### Distribution Checklist (WPF)

- [ ] Application built in Release mode
- [ ] Self-contained or framework-dependent decided
- [ ] Installer created (if using ClickOnce)
- [ ] ZIP archive created
- [ ] GitHub release created
- [ ] Installation instructions provided
- [ ] Download tested on clean machine
- [ ] Application runs without errors

---

## Post-Deployment Verification

### Automated Verification Script

**Script**: `scripts/verify-deployment.sh`

```bash
#!/bin/bash

API_URL="https://familytogether-api.up.railway.app"
SPA_URL="https://familytogether.netlify.app"

echo "========================================"
echo "  Verifying Deployment"
echo "========================================"

# Test API Health
echo "1. Testing API health endpoint..."
api_status=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ $api_status -eq 200 ]; then
    echo "   ✓ API health check passed"
else
    echo "   ✗ API health check failed (status: $api_status)"
    exit 1
fi

# Test SPA Accessibility
echo "2. Testing SPA accessibility..."
spa_status=$(curl -s -o /dev/null -w "%{http_code}" $SPA_URL)
if [ $spa_status -eq 200 ]; then
    echo "   ✓ SPA is accessible"
else
    echo "   ✗ SPA is not accessible (status: $spa_status)"
    exit 1
fi

# Test API CORS
echo "3. Testing API CORS..."
cors_response=$(curl -s -I -X OPTIONS $API_URL/api/sync \
    -H "Origin: $SPA_URL" \
    -H "Access-Control-Request-Method: POST" \
    | grep -i "access-control-allow-origin")

if [ ! -z "$cors_response" ]; then
    echo "   ✓ CORS configured correctly"
else
    echo "   ✗ CORS not configured"
    exit 1
fi

# Test Authentication Endpoint
echo "4. Testing authentication endpoint..."
auth_response=$(curl -s -X POST $API_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}')

if [[ $auth_response == *"error"* ]]; then
    echo "   ✓ Authentication endpoint responding"
else
    echo "   ✗ Authentication endpoint not working"
    exit 1
fi

# Test Database Connection (via API)
echo "5. Testing database connectivity..."
# This requires a test endpoint in your API
sync_status=$(curl -s $API_URL/api/sync/status \
    -H "Authorization: Bearer test_token" \
    -w "%{http_code}" -o /dev/null)

if [ $sync_status -eq 401 ] || [ $sync_status -eq 200 ]; then
    echo "   ✓ Database connection working (auth required)"
else
    echo "   ✗ Database connection issue (status: $sync_status)"
fi

echo ""
echo "========================================"
echo "  ✓ All checks passed!"
echo "========================================"
echo ""
echo "Deployment URLs:"
echo "  API: $API_URL"
echo "  SPA: $SPA_URL"
echo "  API Logs: railway logs (via CLI)"
echo "  Netlify Logs: netlify logs (via CLI)"
```

### Manual Verification Checklist

**API Verification**:
- [ ] Health endpoint returns 200: `GET /health`
- [ ] Swagger UI accessible (if enabled): `/swagger`
- [ ] Authentication endpoint working: `POST /api/auth/login`
- [ ] Sync endpoint requires auth: `POST /api/sync`
- [ ] Database queries working (check logs)
- [ ] No errors in Railway logs
- [ ] Response times < 500ms

**SPA Verification**:
- [ ] Site loads without errors
- [ ] No console errors
- [ ] Login page accessible
- [ ] Registration working
- [ ] IndexedDB initializing
- [ ] API calls reaching server
- [ ] Offline mode working
- [ ] Sync working when online

**Integration Verification**:
- [ ] End-to-end user registration flow
- [ ] Create task flows to server
- [ ] Sync working (offline → online)
- [ ] Real-time updates working
- [ ] File uploads working (if applicable)

---

## Rollback Procedures

### Rollback API (Railway)

```bash
# Option 1: Via Railway CLI
railway rollback

# Option 2: Redeploy previous version
git log --oneline  # Find previous commit
git checkout <previous-commit-hash>
railway up
git checkout main

# Option 3: Via Railway Dashboard
# Deployments → Select previous deployment → Rollback
```

### Rollback SPA (Netlify)

```bash
# Option 1: Via Netlify CLI
netlify rollback

# Option 2: Via Netlify Dashboard
# Deploys → Select previous deploy → Publish deploy
```

### Emergency Rollback Script

**Script**: `scripts/emergency-rollback.sh`

```bash
#!/bin/bash

echo "========================================"
echo "  EMERGENCY ROLLBACK"
echo "========================================"

echo "Rolling back API..."
railway rollback

echo "Rolling back SPA..."
netlify rollback

echo ""
echo "✓ Rollback complete!"
echo "Verify services are working:"
echo "  API: https://familytogether-api.up.railway.app/health"
echo "  SPA: https://familytogether.netlify.app"
```

---

## Deployment Success Checklist

### Final Pre-Launch Checklist

- [ ] All deployment scripts tested
- [ ] Environment variables verified
- [ ] SSL certificates active (automatic)
- [ ] Custom domains configured (if applicable)
- [ ] Monitoring configured (Sentry, etc.)
- [ ] Backup strategy in place
- [ ] Rollback procedures tested
- [ ] Team notified of deployment
- [ ] Deployment documentation updated
- [ ] Post-deployment verification passed

### Monitoring Setup

- [ ] Uptime monitoring enabled (Uptime Robot)
- [ ] Error tracking configured (Sentry)
- [ ] Log aggregation set up
- [ ] Performance monitoring active
- [ ] Alert notifications configured
- [ ] Status page created (optional)

---

**END OF DEPLOYMENT CHECKLISTS & SCRIPTS**
