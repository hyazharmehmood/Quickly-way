# Fix: "Cannot read properties of undefined (reading 'findMany')" for RoleAgreementRequest

## Cause
The database has the `RoleAgreementRequest` table (migration applied), but the **Prisma Client** used by the running app was generated from an older schema that didn't include this model. So `prisma.roleAgreementRequest` is undefined at runtime. Next.js may also cache server chunks that still reference the old client, so a clean rebuild is often needed.

## Fix on the server (e.g. Ubuntu / PM2)

Run these on the server **in the app directory** (e.g. `/home/Quickly-way`):

```bash
# 1. Regenerate Prisma Client from current schema (includes RoleAgreementRequest)
npx prisma generate

# 2. Clear Next.js cache so server chunks are rebuilt with the new client
rm -rf .next

# 3. Rebuild Next.js
npm run build

# 4. Restart the app
pm2 restart all
```

If you deploy via `git pull`:

```bash
git pull
npm install          # runs postinstall → prisma generate
rm -rf .next
npm run build
pm2 restart all
```

### Verify the generated client (on the server)

From the app directory, check that the Prisma client on disk has the model:

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); console.log('roleAgreementRequest' in p ? 'OK – client has model' : 'MISSING – run npx prisma generate'); process.exit('roleAgreementRequest' in p ? 0 : 1);"
```

- If it prints **OK** but the app still errors, the app was likely using a cached bundle; the new `serverExternalPackages` config (in `next.config.js`) forces loading from `node_modules` after you rebuild and restart.
- If it prints **MISSING**, run `npx prisma generate` in the same directory (and ensure `prisma/schema.prisma` includes the `RoleAgreementRequest` model).

## About "P3008 – migration already applied"
You only need `prisma migrate resolve --applied <name>` when the migration is **not** in the database's `_prisma_migrations` table but the DB changes were applied manually. In your case the migration is already recorded as applied, so that command correctly fails. No action needed for P3008.
