import { NextResponse } from 'next/server';
import { createClient } from 'redis';

/**
 * GET /api/health/redis-check
 * Check Redis connection status
 */
export async function GET() {
  try {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'REDIS_URL environment variable is not set',
        usingFallback: true,
        fallbackType: 'in-memory',
        recommendation: 'Set REDIS_URL in .env.local to enable Redis caching',
      }, { status: 200 });
    }

    // Try to connect to Redis
    const client = createClient({ url: redisUrl });
    
    try {
      await client.connect();
      
      // Test Redis connection
      await client.ping();
      
      // Get Redis info
      const info = await client.info('server');
      const versionMatch = info.match(/redis_version:([\d.]+)/);
      const version = versionMatch ? versionMatch[1] : 'unknown';
      
      // Test cache operations
      const testKey = 'health-check-test';
      await client.setEx(testKey, 10, 'test-value');
      const testValue = await client.get(testKey);
      await client.del(testKey);
      
      await client.quit();
      
      return NextResponse.json({
        status: 'connected',
        message: 'Redis is connected and working',
        usingFallback: false,
        redisUrl: redisUrl.replace(/:[^:@]+@/, ':****@'), // Hide password
        version: version,
        cacheTest: testValue === 'test-value' ? 'passed' : 'failed',
        timestamp: new Date().toISOString(),
      }, { status: 200 });
    } catch (error) {
      await client.quit().catch(() => {});
      
      return NextResponse.json({
        status: 'connection_failed',
        message: 'Redis connection failed',
        error: error.message,
        usingFallback: true,
        fallbackType: 'in-memory',
        recommendation: 'Check Redis server is running and REDIS_URL is correct',
      }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Error checking Redis status',
      error: error.message,
      usingFallback: true,
      fallbackType: 'in-memory',
    }, { status: 500 });
  }
}

