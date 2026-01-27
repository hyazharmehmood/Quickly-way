# Fix: Keyword Model Error on Production

## Problem
```
Error creating keyword: TypeError: Cannot read properties of undefined (reading 'findUnique')
Error fetching keywords: TypeError: Cannot read properties of undefined (reading 'findMany')
```

## Root Cause
The Prisma Client on the production server hasn't been regenerated after adding the `Keyword` model. The database table exists (from migration), but Prisma Client doesn't know about it.

## Solution

### Step 1: SSH into Production Server
```bash
ssh root@your-server-ip
```

### Step 2: Navigate to Project Directory
```bash
cd /var/www/Quickly-way
```

### Step 3: Load Environment Variables
```bash
export $(cat .env | grep -v '^#' | xargs)
```

### Step 4: Regenerate Prisma Client
```bash
npx prisma generate
```

This will:
- Read the Prisma schema
- Generate the Prisma Client with the `Keyword` model
- Make `prisma.keyword` available in your code

### Step 5: Restart PM2 Process
```bash
pm2 restart quickly-way
```

### Step 6: Verify the Fix
```bash
pm2 logs quickly-way --lines 50
```

You should no longer see the `Cannot read properties of undefined` errors.

## Alternative: Full Deployment Steps

If you need to ensure everything is in sync:

```bash
# 1. Navigate to project
cd /var/www/Quickly-way

# 2. Pull latest code (if using git)
git pull origin main

# 3. Install dependencies (if needed)
npm install

# 4. Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# 5. Run database migrations (if not already done)
npx prisma migrate deploy

# 6. Regenerate Prisma Client
npx prisma generate

# 7. Restart application
pm2 restart quickly-way

# 8. Check logs
pm2 logs quickly-way --lines 50
```

## Verification

After completing the steps, test the keyword functionality:
1. Go to `/admin/seo` page
2. Try to fetch keywords (should work)
3. Try to create a new keyword (should work)

If errors persist, check:
- Database connection: `echo $DATABASE_URL`
- Prisma Client generation: Check for errors in `npx prisma generate` output
- PM2 logs: `pm2 logs quickly-way --err`


