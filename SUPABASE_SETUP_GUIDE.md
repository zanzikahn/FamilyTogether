# Supabase Setup Guide - Task 1.1
## FamilyTogether Platform

**Task**: Set up Supabase database for FamilyTogether
**Estimated Time**: 15-20 minutes
**Last Updated**: 2026-02-11

---

## Prerequisites

- Email address for Supabase account
- GitHub account (optional, for GitHub sign-in)

---

## Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up using:
   - GitHub (recommended)
   - Email + Password
4. Verify your email if required

---

## Step 2: Create New Project

1. After logging in, click **"New Project"**
2. **Select Organization**: Choose or create an organization
3. **Project Settings**:
   - **Name**: `FamilyTogether` (or any name you prefer)
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Free (sufficient for development)
4. Click **"Create new project"**
5. Wait 2-3 minutes for project provisioning

---

## Step 3: Gather Credentials

Once the project is created, navigate to **Settings → API**:

### Copy the following values:

1. **Project URL**
   - Example: `https://abcdefghijklmnop.supabase.co`
   - Save as: `SUPABASE_URL`

2. **Anon/Public Key** (under "Project API keys")
   - Starts with: `eyJhbG...`
   - Save as: `SUPABASE_ANON_KEY`
   - ⚠️ This key is safe to expose to clients

3. **Service Role Key** (under "Project API keys")
   - Starts with: `eyJhbG...`
   - Save as: `SUPABASE_SERVICE_ROLE_KEY`
   - 🚨 **KEEP THIS SECRET** - Never expose to clients

4. **JWT Secret** (under "JWT Settings")
   - Save as: `SUPABASE_JWT_SECRET`
   - 🚨 **KEEP THIS SECRET**

### Database Connection String

Navigate to **Settings → Database**:

5. **Connection String** (PostgreSQL)
   - Example: `postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres`
   - Save as: `DATABASE_URL`
   - Replace `[YOUR-PASSWORD]` with the password you set in Step 2

---

## Step 4: Run Database Migrations

### 4.1 Navigate to SQL Editor

1. In Supabase Dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**

### 4.2 Run Initial Schema Migration

1. Open the file: `migrations/001_initial_schema.sql`
2. Copy the ENTIRE contents of the file
3. Paste into the Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for confirmation: **"Success. No rows returned"**

### 4.3 Run RLS Policies Migration

1. Click **"New query"** again
2. Open the file: `migrations/002_rls_policies.sql`
3. Copy the ENTIRE contents
4. Paste into the SQL Editor
5. Click **"Run"**
6. Wait for confirmation: **"Success. No rows returned"**

---

## Step 5: Verify Database Setup

### 5.1 Check Tables

1. In Supabase Dashboard, click **"Table Editor"** in the left sidebar
2. You should see 8 tables:
   - ✅ `families`
   - ✅ `members`
   - ✅ `tasks`
   - ✅ `point_transactions`
   - ✅ `rewards`
   - ✅ `reward_redemptions`
   - ✅ `sync_logs`

### 5.2 Verify RLS Policies

1. Click on any table (e.g., `families`)
2. Click the **"Policies"** tab
3. You should see policies like:
   - "Users can view their families"
   - "Users can insert families"
   - etc.

If you see these policies, RLS is configured correctly! ✅

---

## Step 6: Test Authentication

### 6.1 Enable Email Auth (if not already enabled)

1. Go to **Authentication → Providers**
2. Make sure **Email** is enabled
3. **Confirm email**: Set to "Disabled" for development (optional)

### 6.2 Create Test User

1. Go to **Authentication → Users**
2. Click **"Add user"** → **"Create new user"**
3. **Email**: `test@familytogether.local`
4. **Password**: `Test1234!` (or any strong password)
5. Click **"Create user"**
6. Verify the user appears in the users list

---

## Step 7: Provide Credentials to Claude Code

**Copy and paste the following template with your actual values:**

```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-here
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

**Once you provide these credentials, I can continue with Task 1.2: API Project Creation.**

---

## Troubleshooting

### Issue: "relation does not exist"
**Solution**: Make sure you ran `001_initial_schema.sql` first

### Issue: "permission denied for table"
**Solution**: Run `002_rls_policies.sql` to set up Row Level Security

### Issue: "function gen_random_uuid() does not exist"
**Solution**: Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` first

### Issue: Tables not appearing in Table Editor
**Solution**: Refresh the page (Ctrl+R) and wait 10 seconds

---

## Security Notes

✅ **Safe to expose**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

🚨 **MUST KEEP SECRET**:
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `DATABASE_URL` (contains password)
- Database Password

**NEVER**:
- Commit secrets to Git
- Share service role key publicly
- Use service role key in client-side code

---

## What's Next?

After completing this setup and providing credentials, Claude Code will:

1. ✅ Mark Task 1.1 as complete
2. ✅ Update CHANGELOG.md
3. ✅ Update PROJECT_STATE.md
4. 🚀 Begin Task 1.2: Create ASP.NET Core API project
5. 🚀 Configure API to connect to your Supabase database

---

## Quick Reference

| Item | Where to Find |
|------|---------------|
| Project URL | Settings → API → Project URL |
| Anon Key | Settings → API → Project API keys |
| Service Role Key | Settings → API → Project API keys |
| JWT Secret | Settings → API → JWT Settings |
| Database Password | You set this in Step 2 (or reset in Settings → Database) |
| Run SQL | SQL Editor → New query |
| View Tables | Table Editor (left sidebar) |
| Manage Auth | Authentication → Users |

---

## Support

If you encounter any issues:
1. Check the Supabase documentation: https://supabase.com/docs
2. Verify all migration scripts ran successfully
3. Check for error messages in the SQL Editor
4. Ensure you're using the Free tier (sufficient for development)

---

**END OF SUPABASE SETUP GUIDE**
