# Fix Production Database - Missing Category Tables

## Problem
The production database is missing the `Category`, `Skill`, and `ServiceSkill` tables, causing a 500 error when trying to create categories.

## Solution

### Option 1: Run Migration in Production (Recommended)

1. **SSH into your production server** or use your deployment platform's terminal

2. **Navigate to your project directory**

3. **Run the migration:**
   ```bash
   npx prisma migrate deploy
   ```

   This will apply the new migration `20260129000000_add_category_and_skill_tables` that creates the missing tables.

### Option 2: Manual SQL Execution (If migrations fail)

If `prisma migrate deploy` doesn't work, you can manually execute the SQL:

1. **Connect to your production database**

2. **Run the SQL from the migration file:**
   ```bash
   # Copy the contents of:
   # prisma/migrations/20260129000000_add_category_and_skill_tables/migration.sql
   # And execute it in your database
   ```

### Option 3: Use Prisma DB Push (Development/Staging only)

⚠️ **Warning:** Only use this if you're okay with potentially losing data or if this is a fresh database.

```bash
npx prisma db push
```

## Verification

After running the migration, verify the tables exist:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Category', 'Skill', 'ServiceSkill');
```

You should see all three tables listed.

## Next Steps

1. Run the migration in production
2. Test creating a category via the admin panel
3. Verify the category appears correctly

## Migration File Location

The migration file is located at:
`prisma/migrations/20260129000000_add_category_and_skill_tables/migration.sql`

This migration:
- ✅ Creates Category table with all indexes
- ✅ Creates Skill table with all indexes  
- ✅ Creates ServiceSkill join table
- ✅ Sets up all foreign key relationships
- ✅ Uses `IF NOT EXISTS` to prevent errors if tables already exist

