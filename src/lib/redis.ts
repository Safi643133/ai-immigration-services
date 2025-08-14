import Redis from 'ioredis'

/**
 * Redis Connection Configuration
 * 
 * This file manages the Redis connection for BullMQ job queue.
 * Supports both local development and production environments.
 */

// Redis connection configuration
const redisConfig = {
  // Development: Local Redis instance
  development: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    
    // BullMQ requirement: maxRetriesPerRequest must be null
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryDelayOnFailover: 1000,
    enableReadyCheck: false,
  },
  
  // Production: Redis instance with connection pooling
  production: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    
    // BullMQ requirement: maxRetriesPerRequest must be null
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
    retryDelayOnFailover: 1000,
    enableReadyCheck: false,
    
    // TLS for production Redis (if needed)
    ...(process.env.REDIS_TLS === 'true' && {
      tls: {
        rejectUnauthorized: false
      }
    })
  }
}

const environment = process.env.NODE_ENV || 'development'
const config = environment === 'production' 
  ? redisConfig.production 
  : redisConfig.development

// Create Redis connection
export const redis = new Redis(config)

// Connection event handlers
redis.on('connect', () => {
  console.log(`✅ Redis connected in ${environment} mode`)
})

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error)
})

redis.on('ready', () => {
  console.log('🚀 Redis ready for operations')
})

redis.on('close', () => {
  console.log('📪 Redis connection closed')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Gracefully shutting down Redis connection...')
  await redis.quit()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('🔄 Gracefully shutting down Redis connection...')
  await redis.quit()
  process.exit(0)
})

export default redis
