# Migration Instructions for Review System

## Problem
The database is missing the `rating`, `reviewCount` columns on the `User` table and the entire `Review` table.

## Solution

### Step 1: Run Migrations

You need to run the following migrations to add the missing database columns and tables:

```bash
# Option 1: Run migrations (recommended)
npx prisma migrate deploy

# OR Option 2: Push schema directly (development only)
npx prisma db push
```

### Step 2: Regenerate Prisma Client

After running migrations, regenerate Prisma Client:

```bash
npx prisma generate
```

### Step 3: Uncomment Rating Fields

After migrations are complete, uncomment the `rating` and `reviewCount` fields in:

- `lib/services/orderService.js` - Search for `// rating: true` and `// reviewCount: true` and uncomment them

### Step 4: Uncomment Reviews Include

In `lib/services/orderService.js`, uncomment the `reviews` include in the `getOrderById` function (around line 852).

## Migration Files Created

1. `prisma/migrations/20260129000001_add_user_rating_fields/migration.sql`
   - Adds `rating` and `reviewCount` columns to `User` table

2. `prisma/migrations/20260129000002_add_review_model/migration.sql`
   - Creates the `Review` table with all indexes and foreign keys

## Verification

After running migrations, verify the tables exist:

```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'User' 
AND column_name IN ('rating', 'reviewCount');

-- Check if Review table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'Review';
```

## Current Status

- ✅ Schema updated with Review model and User rating fields
- ✅ Review service created
- ✅ Review API routes created
- ✅ Review modal component created
- ✅ Order pages updated with review functionality
- ⏳ **PENDING**: Database migrations need to be run
- ⏳ **PENDING**: Prisma Client needs to be regenerated


