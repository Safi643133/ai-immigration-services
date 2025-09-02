import Redis from 'ioredis'

/**
 * Redis Connection Configuration
 * 
 * This file manages the Redis connection for BullMQ job queue.
 * Uses singleton pattern to prevent multiple connections.
 */

// Singleton Redis instance
let redisInstance: Redis | null = null

// Redis connection configuration for Upstash
function getRedisConfig() {
  const host = process.env.REDIS_HOST || 'crack-boa-59611.upstash.io'
  const port = parseInt(process.env.REDIS_PORT || '6379')
  const password = process.env.REDIS_PASSWORD || 'AejbAAIncDFhMWRjNzAwODA2Yjg0NWMxYWRiNWEzMmYxMTFmZjJmOHAxNTk2MTE'
  
  if (!host || !password) {
    throw new Error('Redis configuration missing: REDIS_HOST and REDIS_PASSWORD must be set')
  }
  
  return {
    host,
    port,
    password,
    db: parseInt(process.env.REDIS_DB || '0'),
    
    // BullMQ requirement: maxRetriesPerRequest must be null
    maxRetriesPerRequest: null,
    
    // Connection settings optimized for Upstash
    connectTimeout: 60000,
    commandTimeout: 30000,
    lazyConnect: true,
    
    // Prevent automatic reconnection loops
    retryDelayOnFailover: 5000,
    retryDelayOnClusterDown: 2000,
    enableOfflineQueue: true,
    
    // TLS required for Upstash
    tls: {
      rejectUnauthorized: false,
      servername: host
    },
    
    // Connection pool settings
    family: 4,
    keepAlive: true,
    
    // Custom reconnection logic
    reconnectOnError: (err: any) => {
      console.log('Redis reconnection check:', err.message)
      // Only reconnect on specific errors
      return err.message.includes('READONLY') || err.message.includes('MOVED')
    }
  }
}

// Create or get existing Redis connection
function createRedisConnection(): Redis {
  if (redisInstance) {
    console.log('♻️ Reusing existing Redis connection')
    return redisInstance
  }

  console.log('🔧 Creating new Redis connection to Upstash...')
  const config = getRedisConfig()
  redisInstance = new Redis(config as any)

  // Connection event handlers
  redisInstance.on('connect', () => {
    console.log('✅ Redis connected to Upstash')
  })

  redisInstance.on('error', (error) => {
    console.error('❌ Redis connection error:', error.message)
    // Don't recreate instance on every error to prevent spam
  })

  redisInstance.on('ready', () => {
    console.log('🚀 Redis ready for operations')
  })

  redisInstance.on('close', () => {
    console.log('📪 Redis connection closed')
  })

  redisInstance.on('reconnecting', (timeToReconnect: number) => {
    console.log(`🔄 Redis reconnecting in ${timeToReconnect}ms...`)
  })

  return redisInstance
}

// Export the Redis connection
export const redis = createRedisConnection()

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('🔄 Gracefully shutting down Redis connection...')
  if (redisInstance) {
    await redisInstance.quit()
    redisInstance = null
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('🔄 Gracefully shutting down Redis connection...')
  if (redisInstance) {
    await redisInstance.quit()
    redisInstance = null
  }
  process.exit(0)
})

export default redis
