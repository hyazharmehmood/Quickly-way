# Fix Production: Missing `RoleAgreementRequest` Table

## Problem

Production returns:

```text
The table `public.RoleAgreementRequest` does not exist in the current database.
```

Or API error:

```json
{
  "message": "Invalid `prisma.roleAgreementRequest.findUnique()` invocation: The table `public.RoleAgreementRequest` does not exist in the current database."
}
```

The table exists and works locally because migrations were run there, but the migration was never applied (or failed) in production.

---

## Solution

### Option 1: Run migrations in production (preferred)

On the production server or in your deployment pipeline:

```bash
# Set production DATABASE_URL if needed, then:
npx prisma migrate deploy
```

This applies all pending migrations, including `20260218075830_add_role_agreement_request`.

---

### Option 2: Run manual SQL in production

If you cannot run `prisma migrate deploy` (e.g. no CLI in production, or migrations are out of sync), run the manual script against the **production** database.

1. **Connect to production DB**
   - Neon: Project → SQL Editor  
   - Supabase: SQL Editor  
   - Or: `psql $DATABASE_URL`

2. **Execute the script**
   - Copy the contents of **`prisma/manual_role_agreement_request.sql`**
   - Paste and run in the SQL editor (or via `psql -f prisma/manual_role_agreement_request.sql`)

The script:

- Creates the `RequestedRole` enum if missing
- Creates the `RoleAgreementRequest` table if missing
- Creates indexes and foreign keys (skips if they already exist)

3. **Mark the migration as applied (so Prisma doesn’t try to run it again)**

   If you use manual SQL and still have the migration in `prisma/migrations/`, tell Prisma it’s already applied:

   ```bash
   npx prisma migrate resolve --applied 20260218075830_add_role_agreement_request
   ```

   Run this from a machine that can connect to the **production** database (with `DATABASE_URL` set to production).

---

## Verify

In production DB:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'RoleAgreementRequest';
```

You should get one row: `RoleAgreementRequest`.

Then test “Join as Client” / “Join as Freelancer” again; the error should be gone.

---

## Why it works locally but not in production

- **Local:** You ran `prisma migrate dev` (or `migrate deploy`), so the migration ran and created the table.
- **Production:** That migration was never run there (deploy doesn’t run migrations automatically unless you added a step), so the table doesn’t exist.

After applying the migration or the manual SQL in production, the app and Prisma will use the same schema in both environments.
