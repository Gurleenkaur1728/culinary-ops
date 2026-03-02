# Supabase Setup Guide

## Step 1: Create Supabase Project (2 minutes)

1. Go to https://supabase.com
2. Click "Start your project" (sign in with GitHub)
3. Click "New Project"
4. Fill in:
   - **Name**: `culinary-ops`
   - **Database Password**: (create a strong password - SAVE THIS!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for project to be ready

## Step 2: Get Database Connection String

1. In your Supabase project dashboard, click **"Project Settings"** (gear icon in left sidebar)
2. Click **"Database"** in the left menu
3. Scroll down to **"Connection string"**
4. Select **"URI"** tab
5. Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
6. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the database password you created

## Step 3: Update Backend Environment

Open `backend\.env` and replace the DATABASE_URL:

```env
DATABASE_URL="postgresql://postgres:YOUR-PASSWORD@db.xxx.supabase.co:5432/postgres"
```

## Step 4: Run Database Setup

Open terminal in `backend` folder and run:

```powershell
# Generate Prisma client
npx prisma generate

# Create tables in Supabase
npx prisma db push

# Seed with sample data
npx ts-node prisma/seed.ts
```

## Step 5: Restart Backend

The backend should now connect to Supabase!

```powershell
npm run start:dev
```

## ✅ Done!

Now you can:
- Go to http://localhost:3000
- Login with: `admin@culinaryops.com` / `admin123`
- Access the full dashboard

## 🔍 Verify in Supabase

1. In Supabase dashboard, click **"Table Editor"** 
2. You should see all tables: User, Ingredient, SubRecipe, MealRecipe, etc.
3. Click on "User" table to see your admin account

---

**Need help?** Let me know if you get any errors during setup!
