# Production deploy checklist

Jab bhi **Prisma schema** ya **migrations** change hon, production par ye order follow karo:

```bash
git pull

# 1. DB update (migrations)
npx prisma migrate deploy

# 2. Prisma client regenerate – zaroori (schema change ke baad)
npx prisma generate

# 3. Build
npm run build

# 4. Restart app
pm2 restart all
```

**Agar `approvalStatus` / Unknown argument jaisa error aaye:** matlab client purana hai → `npx prisma generate` chalao, phir dobara build + restart.
