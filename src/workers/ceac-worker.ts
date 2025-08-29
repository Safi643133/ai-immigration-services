// Load environment variables from .env file if needed
import { readFileSync } from 'fs'
import { join } from 'path'

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

import { Worker, Job } from 'bullmq'
import { redis } from '../lib/redis'
import { QUEUE_NAMES, type CeacSubmissionJobData, type StatusCheckJobData, type ArtifactCleanupJobData } from '../lib/queues'
import { createClient } from '@supabase/supabase-js'
import { CeacAutomationService } from './services/ceac-automation-refactored'
import { ProgressService } from '../lib/progress/progress-service'
import { getArtifactStorage } from '../lib/artifact-storage'

/**
 * CEAC Worker - Main Job Processor
 * 
 * This worker processes CEAC automation jobs using Playwright.
 * It handles DS-160 form submission, status checking, and artifact cleanup.
 */

console.log('🚀 Starting CEAC Worker...')

// Validate environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'REDIS_HOST'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`)
    console.error('Please ensure your .env file is properly configured.')
    process.exit(1)
  }
}

console.log('✅ Environment variables validated')

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Initialize services
const ceacService = new CeacAutomationService()
const progressService = new ProgressService()

/**
 * Process CEAC submission jobs
 */
const submissionWorker = new Worker(
  QUEUE_NAMES.CEAC_SUBMISSION,
  async (job: Job<CeacSubmissionJobData>) => {
    console.log(`📝 Processing CEAC submission job: ${job.id}`)
    
    try {
      // Update job status to running
      await updateJobStatus(job.data.jobId, {
        status: 'running',
        started_at: new Date().toISOString()
      })

      // Log job start event
      await logJobEvent(job.data.jobId, {
        type: 'job_started',
        level: 'info',
        message: 'CEAC submission job started',
        metadata: {
          queue_job_id: job.id,
          embassy: job.data.embassy,
          ceac_version: job.data.ceacVersion
        }
      })

      // Process the form submission
      const result = await ceacService.submitDS160Form({
        jobId: job.data.jobId,
        submissionId: job.data.submissionId,
        userId: job.data.userId,
        formData: job.data.formData as any, // Type assertion for now
        embassy: job.data.embassy,
        ceacVersion: job.data.ceacVersion || '2025.01'
      })

      // Update job with results
      await updateJobStatus(job.data.jobId, {
        status: 'completed',
        finished_at: new Date().toISOString(),
        ceac_application_id: result.applicationId,
        ceac_confirmation_id: result.confirmationId,
        metadata: {
          completion_time: new Date().toISOString(),
          artifacts_count: result.artifacts?.length || 0,
          screenshots_count: result.screenshots?.length || 0
        }
      })

      // Log completion event
      await logJobEvent(job.data.jobId, {
        type: 'job_completed',
        level: 'info',
        message: 'CEAC submission completed successfully',
        metadata: {
          application_id: result.applicationId,
          confirmation_id: result.confirmationId,
          processing_duration: Date.now() - job.timestamp
        }
      })

      console.log(`✅ CEAC submission job ${job.id} completed successfully`)
      
      return result

    } catch (error) {
      console.error(`❌ CEAC submission job ${job.id} failed:`, error)

      // Update job status to failed
      await updateJobStatus(job.data.jobId, {
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_code: error instanceof Error ? error.name : 'UnknownError',
        error_message: error instanceof Error ? error.message : 'Unknown error occurred'
      })

      // Log error event
      await logJobEvent(job.data.jobId, {
        type: 'job_failed',
        level: 'error',
        message: 'CEAC submission failed',
        metadata: {
          error_name: error instanceof Error ? error.name : 'UnknownError',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_stack: error instanceof Error ? error.stack : undefined
        }
      })

      throw error
    }
  },
  {
    connection: redis,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 50 },
  }
)

/**
 * Process status check jobs
 */
const statusWorker = new Worker(
  QUEUE_NAMES.CEAC_STATUS_CHECK,
  async (job: Job<StatusCheckJobData>) => {
    console.log(`🔍 Processing status check job: ${job.id}`)
    
    try {
      // Get job details
      const { data: jobData, error } = await supabase
        .from('ceac_automation_jobs')
        .select('ceac_application_id, ceac_confirmation_id')
        .eq('id', job.data.jobId)
        .single()

      if (error || !jobData) {
        throw new Error('Job not found or missing CEAC IDs')
      }

      if (!jobData.ceac_application_id) {
        throw new Error('No CEAC application ID available for status check')
      }

      // Check status via CEAC service
      const status = await ceacService.checkApplicationStatus({
        applicationId: jobData.ceac_application_id,
        confirmationId: jobData.ceac_confirmation_id
      })

      // Log status check event
      await logJobEvent(job.data.jobId, {
        type: 'status_checked',
        level: 'info',
        message: `Application status: ${status.status}`,
        metadata: {
          application_id: jobData.ceac_application_id,
          status: status.status,
          last_updated: status.lastUpdated,
          check_timestamp: new Date().toISOString()
        }
      })

      console.log(`✅ Status check job ${job.id} completed`)
      
      return status

    } catch (error) {
      console.error(`❌ Status check job ${job.id} failed:`, error)
      
      await logJobEvent(job.data.jobId, {
        type: 'status_check_failed',
        level: 'error',
        message: 'Status check failed',
        metadata: {
          error_message: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      throw error
    }
  },
  {
    connection: redis,
    concurrency: 5,
    removeOnComplete: { count: 5 },
    removeOnFail: { count: 20 },
  }
)

/**
 * Process artifact cleanup jobs
 */
const cleanupWorker = new Worker(
  QUEUE_NAMES.ARTIFACT_CLEANUP,
  async (job: Job<ArtifactCleanupJobData>) => {
    console.log(`🧹 Processing cleanup job: ${job.id}`)
    
    try {
      const artifactStorage = getArtifactStorage()
      const deletedCount = await artifactStorage.cleanupOldArtifacts(job.data.olderThanDays)
      
      console.log(`✅ Cleanup job ${job.id} completed - deleted ${deletedCount} artifacts`)
      
      return { deletedCount }

    } catch (error) {
      console.error(`❌ Cleanup job ${job.id} failed:`, error)
      throw error
    }
  },
  {
    connection: redis,
    concurrency: 1,
    removeOnComplete: { count: 5 },
    removeOnFail: { count: 10 },
  }
)

// Worker event handlers
submissionWorker.on('completed', (job) => {
  console.log(`🎉 Submission job ${job.id} completed`)
})

submissionWorker.on('failed', (job, err) => {
  console.error(`💥 Submission job ${job?.id} failed:`, err.message)
})

submissionWorker.on('stalled', (jobId) => {
  console.warn(`⚠️ Submission job ${jobId} stalled`)
})

statusWorker.on('completed', (job) => {
  console.log(`🎉 Status check job ${job.id} completed`)
})

cleanupWorker.on('completed', (job) => {
  console.log(`🎉 Cleanup job ${job.id} completed`)
})

// Helper functions
async function updateJobStatus(jobId: string, updates: any) {
  try {
    const { error } = await supabase
      .from('ceac_automation_jobs')
      .update(updates)
      .eq('id', jobId)

    if (error) {
      console.error('Failed to update job status:', error)
    }
  } catch (error) {
    console.error('Error updating job status:', error)
  }
}

async function logJobEvent(jobId: string, event: {
  type: string
  level: 'info' | 'warn' | 'error'
  message: string
  metadata?: any
}) {
  try {
    const { error } = await supabase
      .from('ceac_job_events')
      .insert({
        job_id: jobId,
        event_type: event.type,
        level: event.level,
        message: event.message,
        metadata: event.metadata || {}
      })

    if (error) {
      console.error('Failed to log job event:', error)
    }
  } catch (error) {
    console.error('Error logging job event:', error)
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🔄 Received ${signal}, shutting down gracefully...`)
  
  console.log('Closing workers...')
  await Promise.all([
    submissionWorker.close(),
    statusWorker.close(),
    cleanupWorker.close()
  ])
  
  console.log('Closing Redis connection...')
  await redis.quit()
  
  console.log('✅ Worker shutdown complete')
  process.exit(0)
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
  gracefulShutdown('uncaughtException')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  gracefulShutdown('unhandledRejection')
})

console.log('✅ CEAC Worker started successfully')
console.log(`🔧 Worker concurrency: ${process.env.WORKER_CONCURRENCY || '2'}`)
console.log(`🏢 Environment: ${process.env.NODE_ENV || 'production'}`)

export { submissionWorker, statusWorker, cleanupWorker }
