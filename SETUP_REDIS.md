# Redis URL Setup Guide

## Method 1: Add to .env.local (Recommended) ✅

Create or edit `.env.local` file in project root:

```bash
# In your terminal (zsh)
cd "/Users/hapycosmac/Hapy Co Projects/quicklyway"
nano .env.local
```

Add this line:
```env
REDIS_URL=redis://localhost:6379
```

Save and exit (Ctrl+X, then Y, then Enter)

## Method 2: Set in Current Terminal Session (Temporary)

```bash
export REDIS_URL=redis://localhost:6379
```

This only works for current terminal session. Close terminal = lost.

## Method 3: Set Permanently in zsh (For All Sessions)

Add to your `~/.zshrc` file:

```bash
# Open zsh config
nano ~/.zshrc

# Add at the end:
export REDIS_URL=redis://localhost:6379

# Save and reload
source ~/.zshrc
```

## Method 4: Set in .env File (If using dotenv)

If your app reads from `.env` instead of `.env.local`:

```bash
echo "REDIS_URL=redis://localhost:6379" >> .env
```

## Redis URL Formats

### Local Redis (Default):
```env
REDIS_URL=redis://localhost:6379
```

### With Password:
```env
REDIS_URL=redis://:password@localhost:6379
```

### With Username and Password:
```env
REDIS_URL=redis://username:password@localhost:6379
```

### Remote Redis:
```env
REDIS_URL=redis://username:password@your-redis-host.com:6379
```

### Redis Cloud (Upstash, etc.):
```env
REDIS_URL=rediss://default:password@host:port
```

## Verify Setup

After setting REDIS_URL, verify:

```bash
# Check if it's set
echo $REDIS_URL

# Or run the check script
node scripts/check-redis.js

# Or check via API
curl http://localhost:3000/api/health/redis-check
```

## Quick Setup Command

Run this in your terminal:

```bash
cd "/Users/hapycosmac/Hapy Co Projects/quicklyway"
echo "REDIS_URL=redis://localhost:6379" >> .env.local
```

Then restart your server:
```bash
npm run dev
```

## Troubleshooting

### If Redis is not running:

**macOS:**
```bash
brew services start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

**Check if Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

### If .env.local is not being read:

Make sure your app is using `dotenv` to load `.env.local`:
```javascript
require('dotenv').config({ path: '.env.local' });
```

## Summary

✅ **Best Practice**: Add to `.env.local` file
✅ **Quick Setup**: `echo "REDIS_URL=redis://localhost:6379" >> .env.local`
✅ **Verify**: Run `node scripts/check-redis.js`

