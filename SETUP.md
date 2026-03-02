# Culinary Ops - Quick Start Guide

## ⚠️ Current Status

✅ **Frontend**: Running at http://localhost:3000  
⚠️ **Backend**: Waiting for PostgreSQL connection  

## 🔧 Next Steps to Get Fully Running

### Step 1: Install PostgreSQL

**Windows (Easiest Method):**
1. Download PostgreSQL installer from: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Run the installer (choose version 14 or higher)
3. During installation:
   - Set password (remember this!)
   - Use default port: 5432
   - Install pgAdmin 4 (recommended)

**Alternative - Using Docker:**
```powershell
docker run --name culinary-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14
```

### Step 2: Create Database

**Option A - Using pgAdmin:**
1. Open pgAdmin 4
2. Connect to local server (password you set during install)
3. Right-click "Databases" → "Create" → "Database"
4. Name: `culinary_ops`
5. Click "Save"

**Option B - Using Command Line:**
```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE culinary_ops;

# Exit
\q
```

### Step 3: Update Database Connection (if needed)

If you used a different password, update `backend\.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/culinary_ops"
```

### Step 4: Run Database Setup

```powershell
# Navigate to backend
cd backend

# Run migrations (creates tables)
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed with sample data
npm run prisma:seed
```

### Step 5: Restart Backend

The backend should now connect successfully!

If it's not already running:
```powershell
cd backend
npm run start:dev
```

## 🎉 You're Done!

Once PostgreSQL is set up, the system should be fully functional:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api

### Default Login
- **Email**: `admin@culinaryops.com`
- **Password**: `admin123`

## 📊 What You'll See

The seeded database includes:
- ✅ Admin user account
- ✅ 4 sample ingredients (Chicken, Rice, Broccoli, Olive Oil)
- ✅ 1 sub-recipe (Grilled Chicken)
- ✅ 1 complete meal (Healthy Chicken Bowl with pricing)

## 🚨 Troubleshooting

### "Can't reach database server"
- Check if PostgreSQL is running:
  ```powershell
  Get-Service postgresql*
  ```
- If not running, start it:
  ```powershell
  # Replace XX with your version
  Start-Service postgresql-x64-XX
  ```

### "Database does not exist"
- Make sure you created the `culinary_ops` database
- Check your `DATABASE_URL` in `backend\.env`

### Port Already in Use
- Frontend (3000) or Backend (3001) port conflict
- Stop other apps using these ports or change ports in config

## 📝 Next Steps After Setup

1. **Explore the Dashboard** - View sample data
2. **Add Ingredients** - Start with your actual ingredients
3. **Build Sub-Recipes** - Create your production recipes
4. **Create Meals** - Assemble your menu items
5. **Set Pricing** - Add pricing overrides for profit margins
6. **Generate Reports** - Test production planning features

## 🔗 Useful Links

- PostgreSQL Download: https://www.postgresql.org/download/windows/
- pgAdmin Documentation: https://www.pgadmin.org/docs/
- Project README: See README.md for full documentation
