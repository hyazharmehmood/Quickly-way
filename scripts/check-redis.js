#!/usr/bin/env node

/**
 * Script to check Redis connection status
 * Usage: node scripts/check-redis.js
 */

const { createClient } = require('redis');
require('dotenv').config({ path: '.env.local' });

async function checkRedis() {
  console.log('🔍 Checking Redis connection...\n');
  
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.log('❌ REDIS_URL is not set in environment variables');
    console.log('📝 Current status: Using in-memory cache (fallback)');
    console.log('\n💡 To enable Redis:');
    console.log('   1. Add REDIS_URL to .env.local');
    console.log('   2. Example: REDIS_URL=redis://localhost:6379');
    console.log('   3. Or: REDIS_URL=redis://username:password@host:port');
    return;
  }
  
  console.log(`📡 Redis URL: ${redisUrl.replace(/:[^:@]+@/, ':****@')}\n`);
  
  const client = createClient({ url: redisUrl });
  
  try {
    console.log('⏳ Connecting to Redis...');
    await client.connect();
    console.log('✅ Connected to Redis!\n');
    
    // Test ping
    const pong = await client.ping();
    console.log(`🏓 Ping: ${pong}`);
    
    // Get server info
    const info = await client.info('server');
    const versionMatch = info.match(/redis_version:([\d.]+)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';
    console.log(`📦 Redis Version: ${version}`);
    
    // Test cache operations
    console.log('\n🧪 Testing cache operations...');
    const testKey = 'health-check-test';
    await client.setEx(testKey, 10, 'test-value');
    console.log('   ✅ Set operation: OK');
    
    const testValue = await client.get(testKey);
    console.log(`   ✅ Get operation: OK (value: ${testValue})`);
    
    await client.del(testKey);
    console.log('   ✅ Delete operation: OK');
    
    // Check if Socket.IO adapter keys exist
    const keys = await client.keys('socket.io*');
    console.log(`\n📊 Socket.IO keys found: ${keys.length}`);
    
    // Check message cache keys
    const messageKeys = await client.keys('messages:*');
    console.log(`📨 Cached conversations: ${messageKeys.length}`);
    
    if (messageKeys.length > 0) {
      console.log('\n📋 Sample cached conversations:');
      messageKeys.slice(0, 5).forEach(key => {
        console.log(`   - ${key}`);
      });
      if (messageKeys.length > 5) {
        console.log(`   ... and ${messageKeys.length - 5} more`);
      }
    }
    
    await client.quit();
    console.log('\n✅ Redis is working perfectly!');
    console.log('🚀 Your app is using Redis for caching and Socket.IO scaling');
    
  } catch (error) {
    console.error('\n❌ Redis connection failed!');
    console.error(`   Error: ${error.message}\n`);
    console.log('📝 Current status: Using in-memory cache (fallback)');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure Redis server is running');
    console.log('   2. Check REDIS_URL is correct');
    console.log('   3. Verify network/firewall settings');
    console.log('   4. Try: redis-cli ping (to test Redis directly)');
    
    try {
      await client.quit();
    } catch (e) {
      // Ignore quit errors
    }
  }
}

checkRedis().catch(console.error);

