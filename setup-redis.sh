#!/bin/bash

# Script to setup Redis URL in .env.local

REDIS_URL="redis://default:OJSiXNwEQlX98q3AwzrtuqXiuYLxOdel@redis-15128.c11.us-east-1-2.ec2.cloud.redislabs.com:15128"

echo "🔧 Setting up Redis URL..."

# Check if .env.local exists
if [ -f .env.local ]; then
    # Check if REDIS_URL already exists
    if grep -q "REDIS_URL" .env.local; then
        echo "⚠️  REDIS_URL already exists in .env.local"
        echo "📝 Updating existing REDIS_URL..."
        # Remove old REDIS_URL line
        sed -i '' '/^REDIS_URL=/d' .env.local
    fi
    # Add new REDIS_URL
    echo "" >> .env.local
    echo "# Redis Configuration" >> .env.local
    echo "REDIS_URL=$REDIS_URL" >> .env.local
    echo "✅ Added REDIS_URL to .env.local"
else
    # Create new .env.local file
    echo "# Redis Configuration" > .env.local
    echo "REDIS_URL=$REDIS_URL" >> .env.local
    echo "✅ Created .env.local with REDIS_URL"
fi

echo ""
echo "📋 Current REDIS_URL:"
grep "REDIS_URL" .env.local | sed 's/:[^:@]*@/:****@/g'
echo ""
echo "🧪 Testing connection..."
node scripts/check-redis.js

