# Production Deployment Guide

## Prisma Database Setup

### Issue: Constraint Already Exists Error

If you encounter the error:
```
Error: ERROR: relation "Review_orderId_reviewerId_isClientReview_key" already exists
```

This means the constraint already exists in your database but Prisma is trying to create it again.

### Solution 1: Use Migrations (Recommended for Production)

Instead of `prisma db push`, use migrations:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Create a new migration (if schema changed)
npx prisma migrate dev --name fix_review_constraint

# 3. For production, deploy migrations
npx prisma migrate deploy
```

### Solution 2: Fix Existing Constraint Issue

If the constraint already exists, you can:

**Option A: Drop and recreate (if safe)**
```sql
-- Connect to your database
psql -U your_user -d quicklyway

-- Drop the existing constraint
DROP INDEX IF EXISTS "Review_orderId_reviewerId_isClientReview_key";

-- Then run prisma db push again
npx prisma db push
```

**Option B: Use migration with IF NOT EXISTS**
Create a migration file that checks if constraint exists:

```sql
-- Check if constraint exists before creating
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Review_orderId_reviewerId_isClientReview_key'
    ) THEN
        CREATE UNIQUE INDEX "Review_orderId_reviewerId_isClientReview_key" 
        ON "Review"("orderId", "reviewerId", "isClientReview") 
        WHERE "orderId" IS NOT NULL;
    END IF;
END $$;
```

### Solution 3: Use Prisma Migrate Deploy (Best for Production)

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Deploy all pending migrations
npx prisma migrate deploy

# This will:
# - Apply all migrations that haven't been applied yet
# - Skip migrations that are already applied
# - Not try to recreate existing constraints
```

### Solution 4: Manual Fix in Database

If you need to fix it manually:

```bash
# Connect to PostgreSQL
psql -U your_user -d quicklyway

# Check if constraint exists
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'Review'::regclass 
AND conname = 'Review_orderId_reviewerId_isClientReview_key';

# If it exists, you can either:
# 1. Keep it and skip the migration
# 2. Drop it and recreate:
DROP INDEX IF EXISTS "Review_orderId_reviewerId_isClientReview_key";
```

## Recommended Production Deployment Steps

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Deploy Migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Verify Database:**
   ```bash
   npx prisma db pull  # Pull current schema to verify
   ```

4. **Start Application:**
   ```bash
   npm run build
   npm start
   # or
   pm2 start npm --name "quicklyway" -- start
   ```

## Environment Variables

Make sure your `.env` file has:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/quicklyway"
```

## Troubleshooting

### If migrations fail:
1. Check database connection
2. Verify user has proper permissions
3. Check if migrations table exists: `SELECT * FROM "_prisma_migrations";`
4. Review migration history

### If constraint errors persist:
1. Check existing constraints: `\d+ "Review"` in psql
2. Manually drop conflicting constraints
3. Re-run migrations

