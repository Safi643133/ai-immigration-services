import { Queue, Worker, Job } from 'bullmq'
import { redis } from './redis'
import type { CeacJobParams } from './types/ceac'

/**
 * BullMQ Queue Configuration
 * 
 * This file sets up the job queues for CEAC automation.
 * Handles job creation, processing, and management.
 */

// Queue names
export const QUEUE_NAMES = {
  CEAC_SUBMISSION: 'ceac-submission',
  CEAC_STATUS_CHECK: 'ceac-status-check',
  ARTIFACT_CLEANUP: 'artifact-cleanup'
} as const

// Queue configurations
const defaultQueueConfig = {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,  // Keep last 50 completed jobs
    removeOnFail: 100,     // Keep last 100 failed jobs
    attempts: 3,           // Retry failed jobs 3 times
    backoff: {
      type: 'exponential' as const,
      delay: 2000,         // Start with 2 second delay
    },
  },
}

// Main CEAC submission queue
export const ceacSubmissionQueue = new Queue(
  QUEUE_NAMES.CEAC_SUBMISSION,
  {
    ...defaultQueueConfig,
    defaultJobOptions: {
      ...defaultQueueConfig.defaultJobOptions,
      priority: 1,         // High priority for submissions
      delay: 0,            // Process immediately
    },
  }
)

// Status check queue (lower priority)
export const ceacStatusQueue = new Queue(
  QUEUE_NAMES.CEAC_STATUS_CHECK,
  {
    ...defaultQueueConfig,
    defaultJobOptions: {
      ...defaultQueueConfig.defaultJobOptions,
      priority: 5,         // Lower priority
      delay: 30000,        // 30 second delay for status checks
    },
  }
)

// Artifact cleanup queue (lowest priority)
export const artifactCleanupQueue = new Queue(
  QUEUE_NAMES.ARTIFACT_CLEANUP,
  {
    ...defaultQueueConfig,
    defaultJobOptions: {
      ...defaultQueueConfig.defaultJobOptions,
      priority: 10,        // Lowest priority
      delay: 300000,       // 5 minute delay for cleanup
      attempts: 1,         // Don't retry cleanup jobs
    },
  }
)

// Job data interfaces
export interface CeacSubmissionJobData extends CeacJobParams {
  submissionId: string
  userId: string
  formData: Record<string, any>
  embassy: string
  priority?: number
}

export interface StatusCheckJobData {
  jobId: string
  submissionId: string
  userId: string
}

export interface ArtifactCleanupJobData {
  jobId: string
  artifactPaths: string[]
  olderThanDays: number
}

// Job creation helpers
export class JobManager {
  /**
   * Submit a DS-160 form to CEAC
   */
  static async submitToCeac(data: CeacSubmissionJobData): Promise<Job<CeacSubmissionJobData>> {
    const jobId = `ceac-submit-${data.submissionId}-${Date.now()}`
    
    return ceacSubmissionQueue.add(
      'submit-ds160',
      data,
      {
        jobId,
        priority: data.priority || 1,
        delay: 0,
        attempts: 3,
        removeOnComplete: 10,
        removeOnFail: 50,
      }
    )
  }

  /**
   * Check status of an existing CEAC submission
   */
  static async checkSubmissionStatus(data: StatusCheckJobData): Promise<Job<StatusCheckJobData>> {
    const jobId = `ceac-status-${data.submissionId}-${Date.now()}`
    
    return ceacStatusQueue.add(
      'check-status',
      data,
      {
        jobId,
        delay: 60000, // Check after 1 minute
        attempts: 2,
      }
    )
  }

  /**
   * Schedule artifact cleanup
   */
  static async scheduleCleanup(data: ArtifactCleanupJobData): Promise<Job<ArtifactCleanupJobData>> {
    const jobId = `cleanup-${data.jobId}-${Date.now()}`
    
    return artifactCleanupQueue.add(
      'cleanup-artifacts',
      data,
      {
        jobId,
        delay: 24 * 60 * 60 * 1000, // Clean up after 24 hours
        attempts: 1,
      }
    )
  }

  /**
   * Get job status by ID
   */
  static async getJobStatus(jobId: string): Promise<Job | null> {
    // Check all queues for the job
    const queues = [ceacSubmissionQueue, ceacStatusQueue, artifactCleanupQueue]
    
    for (const queue of queues) {
      const job = await queue.getJob(jobId)
      if (job) {
        return job
      }
    }
    
    return null
  }

  /**
   * Get all jobs for a user
   */
  static async getUserJobs(userId: string): Promise<Job[]> {
    const jobs: Job[] = []
    
    // Get jobs from submission queue
    const submissionJobs = await ceacSubmissionQueue.getJobs(['waiting', 'active', 'completed', 'failed'])
    const userSubmissionJobs = submissionJobs.filter(job => job.data.userId === userId)
    
    jobs.push(...userSubmissionJobs)
    
    return jobs.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Cancel a job
   */
  static async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJobStatus(jobId)
    
    if (job && (job.opts.delay || job.opts.repeat)) {
      await job.remove()
      return true
    }
    
    return false
  }
}

// Queue event listeners for monitoring
// Note: Using any type for global events due to BullMQ type limitations
;(ceacSubmissionQueue as any).on('global:completed', (jobId: string) => {
  console.log(`✅ CEAC submission job ${jobId} completed`)
})

;(ceacSubmissionQueue as any).on('global:failed', (jobId: string, failedReason: string) => {
  console.error(`❌ CEAC submission job ${jobId} failed:`, failedReason)
})

;(ceacSubmissionQueue as any).on('global:stalled', (jobId: string) => {
  console.warn(`⚠️ CEAC submission job ${jobId} stalled`)
})

// Export all queues for worker access
export const queues = {
  [QUEUE_NAMES.CEAC_SUBMISSION]: ceacSubmissionQueue,
  [QUEUE_NAMES.CEAC_STATUS_CHECK]: ceacStatusQueue,
  [QUEUE_NAMES.ARTIFACT_CLEANUP]: artifactCleanupQueue,
}

export default JobManager
