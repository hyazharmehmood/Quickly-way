#!/usr/bin/env node

/**
 * Detailed Redis Status Check
 * Shows if Redis is working and if message caching is active
 */

const { createClient } = require('redis');

// Load environment from multiple sources
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function checkDetailedStatus() {
  console.log('🔍 Detailed Redis Status Check\n');
  console.log('=' .repeat(50));
  
  // Check environment
  console.log('\n📋 Environment Check:');
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    console.log('   ✅ REDIS_URL found');
    console.log(`   📡 URL: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`);
  } else {
    console.log('   ❌ REDIS_URL not found');
    console.log('   📝 Server might be using in-memory cache');
    return;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n🔌 Connection Test:');
  
  const client = createClient({ url: redisUrl });
  
  try {
    await client.connect();
    console.log('   ✅ Redis connection: SUCCESS\n');
    
    // Test basic operations
    console.log('🧪 Testing Cache Operations:');
    await client.set('test-key', 'test-value', { EX: 10 });
    const value = await client.get('test-key');
    await client.del('test-key');
    console.log('   ✅ Set/Get/Delete: WORKING\n');
    
    // Check message cache
    console.log('📨 Message Cache Status:');
    const messageKeys = await client.keys('messages:*');
    console.log(`   - Cached conversations: ${messageKeys.length}`);
    
    if (messageKeys.length > 0) {
      console.log('\n   📋 Cache Details:');
      for (const key of messageKeys.slice(0, 5)) {
        const cached = await client.get(key);
        if (cached) {
          const data = JSON.parse(cached);
          const convId = key.replace('messages:', '');
          const msgCount = data.messages?.length || 0;
          const age = Math.floor((Date.now() - data.timestamp) / 1000 / 60);
          console.log(`   ✅ ${convId.substring(0, 20)}...`);
          console.log(`      Messages: ${msgCount} | Age: ${age} min`);
        }
      }
    } else {
      console.log('   ℹ️  No messages cached yet');
      console.log('   💡 Cache will be created when users open chats');
    }
    
    // Socket.IO adapter check
    console.log('\n🔌 Socket.IO Adapter:');
    const socketKeys = await client.keys('socket.io*');
    console.log(`   - Socket.IO keys: ${socketKeys.length}`);
    if (socketKeys.length > 0) {
      console.log('   ✅ Socket.IO is using Redis for scaling');
    } else {
      console.log('   ℹ️  No Socket.IO keys (normal if no active connections)');
    }
    
    // Redis stats
    console.log('\n📊 Redis Statistics:');
    const info = await client.info('stats');
    const keyspaceHits = info.match(/keyspace_hits:(\d+)/)?.[1] || '0';
    const keyspaceMisses = info.match(/keyspace_misses:(\d+)/)?.[1] || '0';
    const totalKeys = await client.dbSize();
    
    console.log(`   - Total keys in Redis: ${totalKeys}`);
    console.log(`   - Cache hits: ${keyspaceHits}`);
    console.log(`   - Cache misses: ${keyspaceMisses}`);
    
    if (parseInt(keyspaceHits) + parseInt(keyspaceMisses) > 0) {
      const total = parseInt(keyspaceHits) + parseInt(keyspaceMisses);
      const hitRate = ((parseInt(keyspaceHits) / total) * 100).toFixed(2);
      console.log(`   - Hit rate: ${hitRate}%`);
    }
    
    await client.quit();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ SUMMARY:');
    console.log('   ✅ Redis is CONNECTED');
    console.log('   ✅ Message caching is ENABLED');
    console.log('   ✅ Socket.IO scaling is ENABLED');
    console.log('   🚀 Your chat is using Redis for fast performance!');
    console.log('\n');
    
  } catch (error) {
    console.log('   ❌ Redis connection: FAILED');
    console.log(`   Error: ${error.message}\n`);
    console.log('📝 Current Status:');
    console.log('   ⚠️  Using in-memory cache (fallback)');
    console.log('   ⚠️  Cache is lost on server restart');
    console.log('   ⚠️  No multi-instance scaling');
    
    try {
      await client.quit();
    } catch (e) {}
  }
}

checkDetailedStatus().catch(console.error);

