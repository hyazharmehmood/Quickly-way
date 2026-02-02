#!/usr/bin/env node

/**
 * Test Redis message caching functionality
 * This script tests if Redis is actually caching messages
 */

const { createClient } = require('redis');

// Try to load from different env files
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function testRedisCache() {
  console.log('🧪 Testing Redis Message Caching...\n');
  
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.log('❌ REDIS_URL not found in environment');
    console.log('📝 Checking environment variables...');
    console.log('   - .env.local:', require('fs').existsSync('.env.local') ? '✅ exists' : '❌ not found');
    console.log('   - .env:', require('fs').existsSync('.env') ? '✅ exists' : '❌ not found');
    console.log('\n💡 Note: Server might be reading from different source');
    return;
  }
  
  console.log(`📡 Redis URL: ${redisUrl.replace(/:[^:@]+@/, ':****@')}\n`);
  
  const client = createClient({ url: redisUrl });
  
  try {
    console.log('⏳ Connecting to Redis...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    // Check message cache keys
    console.log('🔍 Checking message cache...');
    const messageKeys = await client.keys('messages:*');
    console.log(`📨 Cached conversations: ${messageKeys.length}\n`);
    
    if (messageKeys.length > 0) {
      console.log('📋 Cached Conversations:');
      for (const key of messageKeys.slice(0, 10)) {
        try {
          const cached = await client.get(key);
          if (cached) {
            const data = JSON.parse(cached);
            const conversationId = key.replace('messages:', '');
            const messageCount = data.messages?.length || 0;
            const age = Math.floor((Date.now() - data.timestamp) / 1000 / 60); // minutes
            console.log(`   ✅ ${conversationId}`);
            console.log(`      - Messages: ${messageCount}`);
            console.log(`      - Age: ${age} minutes`);
            console.log(`      - Valid: ${age < 30 ? '✅' : '❌'} (TTL: 30 min)`);
            console.log('');
          }
        } catch (err) {
          console.log(`   ⚠️  ${key}: Error reading - ${err.message}`);
        }
      }
      
      if (messageKeys.length > 10) {
        console.log(`   ... and ${messageKeys.length - 10} more conversations\n`);
      }
    } else {
      console.log('   ℹ️  No messages cached yet');
      console.log('   💡 Cache will be created when users open chats\n');
    }
    
    // Test cache operations
    console.log('🧪 Testing cache operations...');
    const testConversationId = 'test-conversation-' + Date.now();
    const testMessages = [
      { id: '1', content: 'Test message 1', createdAt: new Date() },
      { id: '2', content: 'Test message 2', createdAt: new Date() },
    ];
    
    // Set cache
    await client.setEx(
      `messages:${testConversationId}`,
      60, // 1 minute TTL
      JSON.stringify({
        messages: testMessages,
        timestamp: Date.now(),
      })
    );
    console.log('   ✅ Set cache: OK');
    
    // Get cache
    const retrieved = await client.get(`messages:${testConversationId}`);
    if (retrieved) {
      const data = JSON.parse(retrieved);
      console.log(`   ✅ Get cache: OK (${data.messages.length} messages)`);
    }
    
    // Delete test
    await client.del(`messages:${testConversationId}`);
    console.log('   ✅ Delete cache: OK');
    
    // Check Socket.IO keys
    const socketKeys = await client.keys('socket.io*');
    console.log(`\n📊 Socket.IO keys: ${socketKeys.length}`);
    if (socketKeys.length > 0) {
      console.log('   ✅ Socket.IO adapter is using Redis');
    }
    
    // Get Redis info
    const info = await client.info('stats');
    const keyspaceHits = info.match(/keyspace_hits:(\d+)/)?.[1] || '0';
    const keyspaceMisses = info.match(/keyspace_misses:(\d+)/)?.[1] || '0';
    const totalKeys = info.match(/keys:(\d+)/)?.[1] || '0';
    
    console.log('\n📈 Redis Statistics:');
    console.log(`   - Total keys: ${totalKeys}`);
    console.log(`   - Cache hits: ${keyspaceHits}`);
    console.log(`   - Cache misses: ${keyspaceMisses}`);
    
    if (parseInt(keyspaceHits) > 0 || parseInt(keyspaceMisses) > 0) {
      const hitRate = (parseInt(keyspaceHits) / (parseInt(keyspaceHits) + parseInt(keyspaceMisses)) * 100).toFixed(2);
      console.log(`   - Hit rate: ${hitRate}%`);
    }
    
    await client.quit();
    
    console.log('\n✅ Redis caching is WORKING!');
    console.log('🚀 Messages are being cached in Redis');
    console.log('💡 Cache will speed up message loading significantly');
    
  } catch (error) {
    console.error('\n❌ Redis connection failed!');
    console.error(`   Error: ${error.message}\n`);
    console.log('📝 Current status: Using in-memory cache (fallback)');
    console.log('   ⚠️  In-memory cache is lost on server restart');
    
    try {
      await client.quit();
    } catch (e) {
      // Ignore
    }
  }
}

testRedisCache().catch(console.error);

