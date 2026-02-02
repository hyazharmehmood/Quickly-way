# Redis Cloud Setup Guide

## Your Redis Cloud Connection

You have a Redis Cloud (Redis Labs) connection. Here's how to set it up:

## Quick Setup

### Method 1: Using Setup Script (Easiest)

```bash
cd "/Users/hapycosmac/Hapy Co Projects/quicklyway"
./setup-redis.sh
```

### Method 2: Manual Setup

1. Create or edit `.env.local` file:
   ```bash
   nano .env.local
   ```

2. Add this line:
   ```env
   REDIS_URL=redis://default:OJSiXNwEQlX98q3AwzrtuqXiuYLxOdel@redis-15128.c11.us-east-1-2.ec2.cloud.redislabs.com:15128
   ```

3. Save and exit (Ctrl+X, Y, Enter)

### Method 3: One-Line Command

```bash
echo "REDIS_URL=redis://default:OJSiXNwEQlX98q3AwzrtuqXiuYLxOdel@redis-15128.c11.us-east-1-2.ec2.cloud.redislabs.com:15128" >> .env.local
```

## Verify Connection

After setup, verify Redis connection:

```bash
# Using check script
node scripts/check-redis.js

# Or test directly with redis-cli
redis-cli -u redis://default:OJSiXNwEQlX98q3AwzrtuqXiuYLxOdel@redis-15128.c11.us-east-1-2.ec2.cloud.redislabs.com:15128 ping
```

Should return: `PONG`

## Test Connection via API

1. Start your server:
   ```bash
   npm run dev
   ```

2. Visit in browser:
   ```
   http://localhost:3000/api/health/redis-check
   ```

Should show: `"status": "connected"`

## Redis Cloud Connection Details

- **Provider**: Redis Cloud (Redis Labs)
- **Host**: redis-15128.c11.us-east-1-2.ec2.cloud.redislabs.com
- **Port**: 15128
- **Username**: default
- **Region**: us-east-1-2

## Security Note

⚠️ **Important**: 
- Never commit `.env.local` to git
- Keep your Redis password secure
- The password is already in your connection string

## Troubleshooting

### Connection Timeout?

1. Check if Redis Cloud instance is active
2. Verify firewall/network settings
3. Check if IP whitelist is configured in Redis Cloud dashboard

### Authentication Failed?

1. Verify password is correct
2. Check username (should be "default")
3. Ensure Redis Cloud instance is not paused

### Test Connection

```bash
# Test with redis-cli
redis-cli -u redis://default:OJSiXNwEQlX98q3AwzrtuqXiuYLxOdel@redis-15128.c11.us-east-1-2.ec2.cloud.redislabs.com:15128

# Then in redis-cli:
PING
# Should return: PONG
```

## Next Steps

1. ✅ Add REDIS_URL to .env.local
2. ✅ Verify connection with check script
3. ✅ Start server and test
4. ✅ Check logs for "✅ Redis connected"

## Summary

Your Redis Cloud connection string is ready. Just add it to `.env.local` and restart your server!

```env
REDIS_URL=redis://default:OJSiXNwEQlX98q3AwzrtuqXiuYLxOdel@redis-15128.c11.us-east-1-2.ec2.cloud.redislabs.com:15128
```

