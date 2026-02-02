# Redis Status Check Guide

## Redis Implementation Status

✅ **Redis is IMPLEMENTED** in your codebase:
- Code is ready in `lib/socket.js`
- Packages are installed (`redis`, `@socket.io/redis-adapter`, `ioredis`)
- Fallback to in-memory cache if Redis not available

## How to Check Redis Status

### Method 1: Using API Endpoint (Recommended)

1. Start your server:
   ```bash
   npm run dev
   ```

2. Open browser and visit:
   ```
   http://localhost:3000/api/health/redis-check
   ```

3. You'll see JSON response:
   - If Redis is connected: `"status": "connected"`
   - If not configured: `"status": "not_configured"`
   - If connection failed: `"status": "connection_failed"`

### Method 2: Using Check Script

Run the check script:
```bash
node scripts/check-redis.js
```

This will show:
- ✅ Connection status
- Redis version
- Cache test results
- Number of cached conversations
- Socket.IO keys

### Method 3: Check Server Logs

When you start the server, look for these messages:

**If Redis is connected:**
```
✅ Redis connected for Socket.IO scaling
✅ Socket.IO Redis adapter enabled
```

**If Redis is NOT connected (using fallback):**
```
⚠️ Redis connection failed, using in-memory adapter: [error message]
```

## Current Status

Based on your code:

1. **Redis Code**: ✅ Implemented
2. **Packages**: ✅ Installed
3. **Connection**: ❓ Depends on `REDIS_URL` environment variable

## How to Enable Redis

### Step 1: Install Redis (if not installed)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Step 2: Add REDIS_URL to .env.local

Create or edit `.env.local` file:
```env
REDIS_URL=redis://localhost:6379
```

For production or remote Redis:
```env
REDIS_URL=redis://username:password@host:port
```

### Step 3: Restart Server

```bash
npm run dev
```

### Step 4: Verify Connection

Check the logs or visit:
```
http://localhost:3000/api/health/redis-check
```

## What Happens Without Redis?

If `REDIS_URL` is not set or Redis connection fails:
- ✅ App still works (uses in-memory cache)
- ✅ Messages are cached in memory
- ⚠️ Cache is lost on server restart
- ⚠️ No multi-instance scaling (Socket.IO)

## Benefits of Using Redis

1. **Persistent Cache**: Messages cached even after server restart
2. **Multi-Instance**: Multiple server instances can share cache
3. **Socket.IO Scaling**: Real-time features work across servers
4. **Better Performance**: Faster message loading

## Quick Test

Test Redis connection directly:
```bash
redis-cli ping
```

Should return: `PONG`

## Troubleshooting

### Redis not connecting?

1. Check if Redis is running:
   ```bash
   redis-cli ping
   ```

2. Check REDIS_URL format:
   ```
   redis://localhost:6379  ✅ Correct
   redis://127.0.0.1:6379  ✅ Correct
   localhost:6379          ❌ Wrong (missing redis://)
   ```

3. Check firewall/port:
   ```bash
   telnet localhost 6379
   ```

4. Check Redis logs:
   ```bash
   # macOS
   tail -f /usr/local/var/log/redis.log
   
   # Linux
   tail -f /var/log/redis/redis-server.log
   ```

## Summary

- ✅ Redis code is implemented
- ❓ Redis connection depends on `REDIS_URL` env variable
- ✅ Fallback to in-memory cache works automatically
- 🔧 Use `/api/health/redis-check` to check status anytime

