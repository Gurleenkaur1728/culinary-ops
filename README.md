# Culinary Operations System

Production-ready internal culinary operations system for food companies. Manages ingredients, sub-recipes, meals, costs, and production planning.

## 🎯 Features

- **Ingredient Management** - Track ingredients with costs, trim percentages, suppliers
- **Sub-Recipe Builder** - Create nested sub-recipes with automatic cost calculation
- **Meal Recipes** - Build meals from ingredients and sub-recipes
- **Smart Cost Engine** - Recursive cost calculations with automatic updates
- **Production Planning** - Generate production reports by date range
- **Shopping Lists** - Automatic inventory calculations
- **Shopify Integration** - Webhook for order syncing

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, TypeScript
- **Backend**: NestJS, Node.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git

### 1. Install PostgreSQL

#### Windows:
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

#### macOS:
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Linux:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE culinary_ops;

# Exit
\q
```

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in separate terminal)
cd frontend
npm install
```

### 4. Configure Environment

The `.env` files are already set up in:
- `backend/.env`
- `frontend/.env.local`

**Update the database connection** in `backend/.env` if needed:
```env
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/culinary_ops"
```

### 5. Set Up Database

```bash
cd backend

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed initial user (optional)
npx prisma db seed
```

### 6. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 📍 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **API Documentation**: http://localhost:3001/api (Swagger - if enabled)

## 👤 Default Login

After running the seed script, you can log in with:
- **Email**: `admin@culinaryops.com`
- **Password**: `admin123`

## 📊 Project Structure

```
culinary-ops/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/              # Authentication
│   │   │   ├── ingredients/       # Ingredient management
│   │   │   ├── sub-recipes/       # Sub-recipe management
│   │   │   ├── meals/             # Meal management
│   │   │   ├── orders/            # Order management
│   │   │   └── production/        # Production reports
│   │   ├── services/
│   │   │   ├── cost-engine.service.ts      # Cost calculations
│   │   │   └── production-engine.service.ts # Production planning
│   │   └── webhooks/
│   │       └── shopify.controller.ts        # Shopify integration
│   └── .env
│
├── frontend/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/         # Main dashboard
│   │   │   ├── ingredients/       # Ingredient pages
│   │   │   ├── sub-recipes/       # Sub-recipe pages
│   │   │   ├── meals/             # Meal pages
│   │   │   ├── reports/           # All reports
│   │   │   └── settings/          # Settings
│   │   └── login/                 # Login page
│   └── .env.local
```

## 🔑 Key API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Ingredients
- `GET /api/ingredients` - List all ingredients
- `POST /api/ingredients` - Create ingredient
- `PUT /api/ingredients/:id` - Update ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient

### Sub-Recipes
- `GET /api/sub-recipes` - List all sub-recipes
- `POST /api/sub-recipes` - Create sub-recipe
- `PUT /api/sub-recipes/:id` - Update sub-recipe

### Meals
- `GET /api/meals` - List all meals
- `POST /api/meals` - Create meal
- `GET /api/meals/pricing` - Meal pricing overview

### Production
- `GET /api/production/report?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Full report
- `GET /api/production/meals-report` - Meals report
- `GET /api/production/sub-recipes-report` - Sub-recipes report
- `GET /api/production/shopping-list` - Shopping list
- `POST /api/production/recalculate-costs` - Recalculate all costs

### Webhooks
- `POST /api/webhooks/shopify/orders` - Shopify order webhook

## 🔧 Troubleshooting

### Database Connection Error

If you see: `Can't reach database server at localhost:5432`

1. Check if PostgreSQL is running:
   ```bash
   # Windows
   Get-Service postgresql*
   
   # macOS/Linux
   pg_isready
   ```

2. Verify database exists:
   ```bash
   psql -U postgres -l
   ```

3. Check connection string in `backend/.env`

### Frontend Can't Connect to Backend

1. Ensure backend is running on port 3001
2. Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`

### Prisma Client Not Generated

```bash
cd backend
npx prisma generate
```

## 📝 Usage Workflow

1. **Add Ingredients** - Create base ingredients with costs
2. **Build Sub-Recipes** - Combine ingredients into sub-recipes
3. **Create Meals** - Assemble meals from ingredients and sub-recipes
4. **Set Pricing** - Override meal prices for profit margins
5. **Sync Orders** - Connect Shopify webhook or manually add orders
6. **Generate Reports** - View production needs by date range
7. **Export Shopping List** - Get ingredient quantities needed

## 🔄 Cost Calculation

The system automatically:
- Calculates sub-recipe costs from ingredients
- Handles nested sub-recipes (sub-recipe within sub-recipe)
- Recalculates when ingredient costs change
- Applies trim percentages
- Updates meal costs when components change

## 🎨 Customization

### Brand Colors

Edit `frontend/tailwind.config.ts`:
```typescript
colors: {
  brand: {
    50: '#fef3ee',
    500: '#e8733a',
    // ...
  }
}
```

### Database Schema Changes

1. Edit `backend/prisma/schema.prisma`
2. Run: `npx prisma migrate dev --name your_change`
3. Run: `npx prisma generate`

## 📦 Deployment

### Backend (Railway/Render)

1. Connect GitHub repo
2. Set environment variables from `.env`
3. Build command: `cd backend && npm install && npx prisma generate && npm run build`
4. Start command: `cd backend && npm run start:prod`

### Frontend (Vercel)

1. Connect GitHub repo
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Set `NEXT_PUBLIC_API_URL` to your backend URL

### Database (Supabase)

1. Create project at [supabase.com](https://supabase.com)
2. Get connection string
3. Update `DATABASE_URL` in backend environment

## 🤝 Support

For issues or questions, refer to the documentation or check the code comments.

## 📄 License

Private - Internal Use Only
