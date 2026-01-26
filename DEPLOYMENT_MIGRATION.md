# Deployment Migration Guide

## Issue: Missing DATABASE_URL Environment Variable

When running `npx prisma migrate deploy` on Digital Ocean, you need to have the `DATABASE_URL` environment variable set.

## Solution Options

### Option 1: Export Environment Variable (Quick Fix)

```bash
# On your Digital Ocean server, export the DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Then run the migration
npx prisma migrate deploy
```

### Option 2: Use .env File

If you have a `.env` file on your server:

```bash
# Make sure you're in the project directory
cd /var/www/Quickly-way

# Load environment variables from .env and run migration
export $(cat .env | xargs) && npx prisma migrate deploy
```

Or use dotenv-cli:
```bash
npx dotenv-cli -e .env -- npx prisma migrate deploy
```

### Option 3: Create/Update .env File

If you don't have a `.env` file, create one:

```bash
cd /var/www/Quickly-way
nano .env
```

Add your DATABASE_URL:
```
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

Then run:
```bash
export $(cat .env | xargs) && npx prisma migrate deploy
```

### Option 4: Set in PM2 Ecosystem File

If you're using PM2, you can set environment variables in your ecosystem file or when starting:

```bash
# Check your PM2 process
pm2 list

# Set environment variable for PM2
pm2 set DATABASE_URL "postgresql://user:password@host:port/database?schema=public"

# Or restart with environment variable
DATABASE_URL="postgresql://user:password@host:port/database?schema=public" pm2 restart quickly-way
```

## Finding Your DATABASE_URL

Your DATABASE_URL should look like one of these formats:

**Digital Ocean Managed Database:**
```
postgresql://doadmin:password@db-hostname.db.ondigitalocean.com:25060/database?sslmode=require
```

**Self-hosted PostgreSQL:**
```
postgresql://username:password@localhost:5432/database?schema=public
```

**With connection pooling:**
```
postgresql://username:password@host:port/database?schema=public&connection_limit=10
```

## Complete Migration Steps

1. **SSH into your server:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Navigate to your project:**
   ```bash
   cd /var/www/Quickly-way
   ```

3. **Make sure your .env file exists on the server with DATABASE_URL:**
   ```bash
   # Check if .env exists
   ls -la .env
   
   # If it doesn't exist, create it and add your DATABASE_URL from lines 7-8
   nano .env
   # Add: DATABASE_URL="your-database-url-from-local-env"
   ```

4. **Load .env and run the migration:**
   ```bash
   # Load environment variables from .env file
   export $(cat .env | grep -v '^#' | xargs)
   
   # Verify DATABASE_URL is set
   echo $DATABASE_URL
   
   # Run the migration
   npx prisma migrate deploy
   ```

5. **CRITICAL: Regenerate Prisma Client after migration:**
   ```bash
   # This is ESSENTIAL - Prisma Client must be regenerated to include new fields
   npx prisma generate
   ```

6. **Verify the migration:**
   ```bash
   npx prisma migrate status
   ```

7. **Restart your application (IMPORTANT - must restart after prisma generate):**
   ```bash
   pm2 restart quickly-way
   # or
   systemctl restart your-app-service
   ```

## Troubleshooting

### If migration fails with "relation already exists"
The migration is safe - it checks if columns exist before adding them. You can run it multiple times.

### If you get connection errors
- Check your database is accessible from the server
- Verify firewall rules allow connections
- Check database credentials are correct
- For Digital Ocean Managed Databases, ensure your droplet IP is in the trusted sources

### If Prisma Client is out of sync
**This is the most common issue!** After migration, you MUST regenerate Prisma Client:
```bash
# Load .env first
export $(cat .env | grep -v '^#' | xargs)

# Regenerate Prisma Client
npx prisma generate

# Then restart your application
pm2 restart quickly-way
```

**If you're still getting "Unknown argument" errors after migration:**
1. Verify the migration was applied: `npx prisma migrate status`
2. Regenerate Prisma Client: `npx prisma generate`
3. Restart your application: `pm2 restart quickly-way`
4. Check that your code is using the regenerated client (clear any build cache if needed)

