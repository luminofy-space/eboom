# eBoom Setup Guide

This guide will walk you through setting up the eBoom Personal Finance Management platform from scratch.

## Table of Contents

1. [Prerequisites Installation](#1-prerequisites-installation)
2. [Project Setup](#2-project-setup)
3. [Database Configuration](#3-database-configuration)
4. [Backend Setup](#4-backend-setup)
5. [Frontend Setup](#5-frontend-setup)
6. [Database Migration & Seeding](#6-database-migration--seeding)
7. [Running the Application](#7-running-the-application)
8. [Verification](#8-verification)
9. [Optional: Testing Mode](#9-optional-testing-mode)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites Installation

### Install Node.js

**Option 1: Using nvm (Recommended)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal, then install Node.js
nvm install 18
nvm use 18
nvm alias default 18
```

**Option 2: Direct Download**
- Download from [nodejs.org](https://nodejs.org/) (version 18.x or higher)

**Verify Installation:**
```bash
node --version  # Should be v18.x.x or higher
npm --version   # Should be 9.x.x or higher
```

### Install PostgreSQL

**Option 1: Local PostgreSQL (Ubuntu/Debian)**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Option 2: Using Supabase (Cloud)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new account (free tier available)
3. Create a new project
4. Note down your database credentials

**Verify PostgreSQL (Local):**
```bash
sudo -u postgres psql --version
```

### Install Git

**Ubuntu/Debian:**
```bash
sudo apt install git
```

**Verify:**
```bash
git --version
```

---

## 2. Project Setup

### Clone the Repository

```bash
# Clone the project
git clone <repository-url> eboom
cd eboom

# Check project structure
ls -la
# You should see: eboom-backend/ and eboom-frontend/
```

---

## 3. Database Configuration

### Option A: Local PostgreSQL Setup

**Step 1: Create Database User**
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE USER eboomuser WITH PASSWORD 'your-secure-password';
ALTER USER eboomuser CREATEDB;
\q
```

**Step 2: Create Database**
```bash
# Create the database
createdb -U eboomuser eboom

# Or using psql:
sudo -u postgres psql
CREATE DATABASE eboom OWNER eboomuser;
\q
```

**Step 3: Test Connection**
```bash
psql -U eboomuser -d eboom -h localhost
# Enter password when prompted
# If successful, you'll see: eboom=>
\q
```

**Your Database URL will be:**
```
postgres://eboomuser:your-secure-password@localhost:5432/eboom
```

### Option B: Supabase Setup

**Step 1: Get Connection String**
1. Go to your Supabase project dashboard
2. Click "Settings" → "Database"
3. Find "Connection string" section
4. Copy the "URI" format connection string
5. Replace `[YOUR-PASSWORD]` with your database password

**Step 2: Note Additional Credentials**
- Project URL: `https://[project-id].supabase.co`
- Anon/Public Key: Found in "Settings" → "API"

---

## 4. Backend Setup

### Navigate to Backend Directory

```bash
cd eboom-backend
```

### Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js
- Drizzle ORM
- Supabase client
- TypeScript
- And more...

**Expected output:** Installation should complete without errors.

### Configure Environment Variables

**Step 1: Create .env file**
```bash
cp .env.sample .env
```

**Step 2: Edit .env file**
```bash
# Use your preferred editor
nano .env
# or
code .env
# or
vim .env
```

**Step 3: Fill in the values**

```env
# ============================================================================
# Database Configuration
# ============================================================================
# For local PostgreSQL:
DATABASE_URL=postgres://eboomuser:your-secure-password@localhost:5432/eboom

# For Supabase:
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[project-id].supabase.co:5432/postgres

# ============================================================================
# Supabase Configuration
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=[your-publishable-key]

# ============================================================================
# App Configuration
# ============================================================================
APP_URL=http://127.0.0.1:4000

# ============================================================================
# TESTING BYPASS (Optional - Development Only)
# ============================================================================
# Uncomment to enable auth bypass for testing
# WARNING: Never enable in production!
# TEST_USER_ID=1
```

**Step 4: Save and close the file**
- In nano: `Ctrl+X`, then `Y`, then `Enter`
- In vim: `Esc`, then `:wq`, then `Enter`

### Verify Backend Configuration

```bash
# Type check (should show no errors)
npm run type-check
```

---

## 5. Frontend Setup

### Navigate to Frontend Directory

```bash
cd ../eboom-frontend
```

### Install Dependencies

```bash
npm install
```

**Expected output:** Installation should complete without errors. This may take a few minutes.

### Configure Environment Variables

**Step 1: Create .env file**
```bash
touch .env
```

**Step 2: Edit .env file**
```bash
nano .env
# or
code .env
```

**Step 3: Add configuration**

```env
# ============================================================================
# Backend API Configuration
# ============================================================================
NEXT_PUBLIC_BASE_URL=http://localhost:4000

# ============================================================================
# Supabase Configuration
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=[your-publishable-key]

# ============================================================================
# Database Connection (for TypeScript type sharing)
# ============================================================================
DATABASE_URL=postgres://eboomuser:your-secure-password@localhost:5432/eboom
# Or for Supabase:
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[project-id].supabase.co:5432/postgres

# ============================================================================
# Testing Mode (Optional - Development Only)
# ============================================================================
# Set to true to auto-login with test user
# Requires TEST_USER_ID to be set in backend .env
# NEXT_PUBLIC_TEST_MODE=true
```

**Step 4: Save and close**

### Verify Frontend Configuration

```bash
# Type check (should show no errors)
npm run type-check
```

---

## 6. Database Migration & Seeding

Now we'll set up the database schema and seed initial data.

### Navigate to Backend

```bash
cd ../eboom-backend
```

### Step 1: Generate Migration Files

```bash
# Generate migration files from schema
npx drizzle-kit generate
```

**Expected output:**
```
✓ Generated migrations successfully
Migration files created in: src/db/migrations/
```

**Verify:**
```bash
ls -la src/db/migrations/
# You should see:
# - _journal.json
# - 0000_*.sql (migration file)
```

### Step 2: Run Migrations

Apply the migrations to create database tables:

```bash
npm run db:migrate
```

**Expected output:**
```
🚀 Running migrations...
✓ Migration complete
Tables created successfully!
```

**Verify in PostgreSQL:**
```bash
# Connect to database
psql -U eboomuser -d eboom -h localhost

# List tables
\dt

# You should see tables like:
# - users
# - canvas
# - income_resources
# - expenses
# - wallets
# etc.

# Exit
\q
```

### Step 3: Seed Initial Data

Populate the database with initial/sample data:

```bash
npm run db:seed
```

**Expected output:**
```
🌱 Seeding database...
✓ Seed data inserted successfully
```

**Alternative seed options:**

```bash
# Safe seed (won't duplicate data if run multiple times)
npm run db:seed:safe

# Hybrid approach
npm run db:seed:hybrid

# Seed specific tables only
npm run db:seed:specific
```

### Step 4: Verify Data with Drizzle Studio

```bash
npm run db:studio
```

**This will:**
1. Start Drizzle Studio on `https://local.drizzle.studio`
2. Open your browser automatically
3. Show your database tables and data

**In Drizzle Studio you can:**
- Browse all tables
- View seeded data
- Edit records
- Explore relationships

**Close Drizzle Studio:** Press `Ctrl+C` in the terminal

---

## 7. Running the Application

You'll need **two terminal windows** - one for backend, one for frontend.

### Terminal 1: Start Backend Server

```bash
# In eboom-backend directory
cd eboom-backend
npm run dev
```

**Expected output:**
```
[nodemon] starting `ts-node src/app.ts`
Server is running on http://localhost:4000
Connected to database successfully
```

**If you see the test mode warning:**
```
========================================
WARNING: TESTING MODE ENABLED
Bypassing authentication for user ID: 1
Remove TEST_USER_ID from .env in production!
========================================
```

**Leave this terminal running.**

### Terminal 2: Start Frontend Server

```bash
# In a new terminal, navigate to frontend
cd eboom-frontend
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

**If you see test mode warning in browser console:**
```
TESTING MODE ENABLED
Auto-logged in with test user. All API calls will use test user data.
```

**Leave this terminal running.**

---

## 8. Verification

### Check Backend Health

**In a new terminal:**
```bash
curl http://localhost:4000/health
# Expected: {"status":"ok"}
```

### Check Frontend

**Open browser:**
1. Go to `http://localhost:3000`
2. You should see the eBoom application
3. If test mode is enabled, you'll be auto-logged in
4. If not, you'll see the login page

### Verify Database Connection

**Check backend logs (Terminal 1):**
- Should show "Connected to database successfully"
- No error messages about database connection

### Test API Endpoints

```bash
# Test user endpoint (if test mode enabled)
curl http://localhost:4000/api/auth/user-info

# Should return user data
```

---

## 9. Optional: Testing Mode

For rapid development without authentication:

### Enable Test Mode

**Backend (.env):**
```env
TEST_USER_ID=1
```

**Frontend (.env):**
```env
NEXT_PUBLIC_TEST_MODE=true
```

### Restart Both Servers

Press `Ctrl+C` in both terminals, then restart:

```bash
# Terminal 1 (Backend)
npm run dev

# Terminal 2 (Frontend)
npm run dev
```

### Verify Test Mode

**Backend should show:**
```
========================================
WARNING: TESTING MODE ENABLED
Bypassing authentication for user ID: 1
========================================
```

**Frontend console should show:**
```
TESTING MODE ENABLED
Auto-logged in with test user
```

**Now you can:**
- Access protected routes without logging in
- Make API calls without authentication
- Develop features faster

**⚠️ IMPORTANT:** Disable test mode before deploying to production!

---

## 10. Troubleshooting

### Database Connection Issues

**Problem:** "Failed to connect to database"

**Solutions:**

1. **Verify PostgreSQL is running:**
   ```bash
   sudo systemctl status postgresql
   # If not running:
   sudo systemctl start postgresql
   ```

2. **Check DATABASE_URL format:**
   ```
   postgres://username:password@host:port/database
   ```

3. **Test connection manually:**
   ```bash
   psql -U eboomuser -d eboom -h localhost
   ```

4. **Check PostgreSQL logs:**
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-*.log
   ```

### Port Already in Use

**Problem:** "Port 4000 is already in use" or "Port 3000 is already in use"

**Solutions:**

1. **Find process using the port:**
   ```bash
   # For port 4000
   lsof -i :4000
   # For port 3000
   lsof -i :3000
   ```

2. **Kill the process:**
   ```bash
   kill -9 <PID>
   ```

3. **Or use different ports:**
   - Backend: Change in `src/app.ts`
   - Frontend: Run `npm run dev -- -p 3001`

### Migration Errors

**Problem:** "Migration failed" or "Table already exists"

**Solutions:**

1. **Reset database:**
   ```bash
   cd eboom-backend
   npm run db:reset
   ```

2. **Or drop and recreate manually:**
   ```bash
   npm run db:drop
   npm run db:migrate
   npm run db:seed
   ```

3. **Check migration files:**
   ```bash
   ls -la src/db/migrations/
   # Ensure _journal.json exists
   ```

### Module Not Found Errors

**Problem:** "Cannot find module '@backend/db/schema'"

**Solutions:**

1. **Restart TypeScript server in IDE:**
   - VSCode: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

2. **Verify tsconfig.json paths:**
   ```json
   {
     "paths": {
       "@backend/*": ["../eboom-backend/src/*"]
     }
   }
   ```

3. **Reinstall dependencies:**
   ```bash
   cd eboom-frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

### Supabase Connection Issues

**Problem:** "Invalid Supabase credentials"

**Solutions:**

1. **Verify credentials in Supabase dashboard:**
   - Settings → API
   - Copy fresh credentials

2. **Check project URL format:**
   ```
   https://[project-id].supabase.co
   ```

3. **Ensure database password is correct:**
   - Settings → Database → Reset password if needed

### Build Errors

**Problem:** TypeScript compilation errors

**Solutions:**

1. **Clear build cache:**
   ```bash
   # Backend
   cd eboom-backend
   rm -rf dist
   npm run build

   # Frontend
   cd eboom-frontend
   rm -rf .next
   npm run build
   ```

2. **Check Node version:**
   ```bash
   node --version  # Should be 18.x or higher
   ```

---

## Next Steps

After successful setup:

1. **Explore the Application**
   - Browse through different features
   - Create a canvas
   - Add income/expenses
   - Test wallet management

2. **Review the Code**
   - Check `eboom-backend/src/routes/` for API endpoints
   - Explore `eboom-frontend/src/components/` for UI components
   - Review `eboom-backend/src/db/schema/` for database schema

3. **Start Development**
   - Read the [README.md](README.md) for development workflows
   - Check available npm scripts
   - Set up your development environment

4. **Join the Team**
   - Review coding standards
   - Set up git hooks
   - Start contributing

---

## Quick Reference

### Essential Commands

```bash
# Backend
cd eboom-backend
npm run dev              # Start dev server
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Drizzle Studio
npm run type-check       # Check TypeScript

# Frontend
cd eboom-frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript
```

### Useful URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- Drizzle Studio: `https://local.drizzle.studio`
- Supabase Dashboard: `https://app.supabase.com`

---

## Getting Help

If you encounter issues not covered here:

1. Check the [README.md](README.md) troubleshooting section
2. Review backend/frontend logs for error details
3. Search existing issues in the repository
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)

---

**Happy coding! 🚀**
