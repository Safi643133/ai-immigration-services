// Check Redis queue status
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
try {
  const envPath = join(process.cwd(), '.env')
  const envContent = readFileSync(envPath, 'utf8')
  const envLines = envContent.split('\n')
  
  for (const line of envLines) {
    const match = line.match(/^([^#][^=]+)=(.*)$/)
    if (match) {
      const [, key, value] = match
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
      }
    }
  }
} catch (error) {
  console.log('Note: Could not load .env file, using system environment variables')
}

// Import after env loading
import { redis } from './src/lib/redis.js'
import { ceacSubmissionQueue } from './src/lib/queues.js'

async function checkRedisQueue() {
  console.log('🔍 Checking Redis queue status...\n')

  try {
    // Check Redis connection
    console.log('📊 Redis Connection:')
    const redisInfo = await redis.info('server')
    console.log('✅ Redis connected successfully')
    
    // Check queue status
    console.log('\n📋 CEAC Submission Queue:')
    const waitingJobs = await ceacSubmissionQueue.getWaiting()
    const activeJobs = await ceacSubmissionQueue.getActive()
    const completedJobs = await ceacSubmissionQueue.getCompleted()
    const failedJobs = await ceacSubmissionQueue.getFailed()

    console.log(`  Waiting jobs: ${waitingJobs.length}`)
    console.log(`  Active jobs: ${activeJobs.length}`)
    console.log(`  Completed jobs: ${completedJobs.length}`)
    console.log(`  Failed jobs: ${failedJobs.length}`)

    if (waitingJobs.length > 0) {
      console.log('\n⏳ Waiting Jobs:')
      waitingJobs.forEach((job, index) => {
        console.log(`  ${index + 1}. Job ID: ${job.id}`)
        console.log(`     Data: ${JSON.stringify(job.data, null, 2)}`)
        console.log(`     Created: ${new Date(job.timestamp).toISOString()}`)
      })
    }

    if (activeJobs.length > 0) {
      console.log('\n🔄 Active Jobs:')
      activeJobs.forEach((job, index) => {
        console.log(`  ${index + 1}. Job ID: ${job.id}`)
        console.log(`     Data: ${JSON.stringify(job.data, null, 2)}`)
        console.log(`     Started: ${job.processedOn ? new Date(job.processedOn).toISOString() : 'Unknown'}`)
      })
    }

    if (failedJobs.length > 0) {
      console.log('\n❌ Failed Jobs:')
      failedJobs.forEach((job, index) => {
        console.log(`  ${index + 1}. Job ID: ${job.id}`)
        console.log(`     Error: ${job.failedReason}`)
        console.log(`     Failed: ${job.finishedOn ? new Date(job.finishedOn).toISOString() : 'Unknown'}`)
      })
    }

  } catch (error) {
    console.error('❌ Error checking Redis queue:', error)
  } finally {
    await redis.quit()
  }
}

// Run check
checkRedisQueue()
  .then(() => {
    console.log('\n✅ Redis queue check complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Redis queue check failed:', error)
    process.exit(1)
  })
