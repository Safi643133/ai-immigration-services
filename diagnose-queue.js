// Diagnose Redis queue and database job status
import { createClient } from '@supabase/supabase-js'
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function diagnoseQueue() {
  console.log('🔍 Diagnosing CEAC automation queue...\n')

  // Check database job status first
  console.log('📊 Database Job Status:')
  try {
    const { data: jobs, error } = await supabase
      .from('ceac_automation_jobs')
      .select('id, status, created_at, started_at, finished_at, error_message, metadata')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ Error fetching jobs:', error)
      return
    }

    jobs.forEach(job => {
      console.log(`\n  Job ID: ${job.id}`)
      console.log(`  Status: ${job.status}`)
      console.log(`  Created: ${job.created_at}`)
      console.log(`  Started: ${job.started_at || 'Not started'}`)
      console.log(`  Finished: ${job.finished_at || 'Not finished'}`)
      console.log(`  Error: ${job.error_message || 'None'}`)
      console.log(`  Queue Job ID: ${job.metadata?.queue_job_id || 'None'}`)
    })
  } catch (error) {
    console.error('❌ Error checking database:', error)
  }

  // Check if there are stuck jobs
  console.log('\n🔍 Checking for stuck jobs...')
  try {
    const { data: stuckJobs, error } = await supabase
      .from('ceac_automation_jobs')
      .select('id, status, created_at, metadata')
      .in('status', ['queued', 'running'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error checking stuck jobs:', error)
      return
    }

    if (stuckJobs.length > 0) {
      console.log(`\n⚠️ Found ${stuckJobs.length} potentially stuck jobs:`)
      stuckJobs.forEach(job => {
        console.log(`  - Job ID: ${job.id}`)
        console.log(`    Status: ${job.status}`)
        console.log(`    Created: ${job.created_at}`)
        console.log(`    Queue Job ID: ${job.metadata?.queue_job_id || 'None'}`)
      })
      
      console.log('\n💡 Recommendation: Reset these stuck jobs to allow new automation')
    } else {
      console.log('✅ No stuck jobs found')
    }
  } catch (error) {
    console.error('❌ Error checking stuck jobs:', error)
  }

  // Check recent job events
  console.log('\n📋 Recent Job Events:')
  try {
    const { data: events, error } = await supabase
      .from('ceac_job_events')
      .select('job_id, event_type, level, message, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error fetching events:', error)
      return
    }

    events.forEach(event => {
      console.log(`  - Job ${event.job_id}: ${event.event_type} (${event.level}) - ${event.message}`)
    })
  } catch (error) {
    console.error('❌ Error checking events:', error)
  }
}

// Run diagnosis
diagnoseQueue()
  .then(() => {
    console.log('\n✅ Diagnosis complete')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Diagnosis failed:', error)
    process.exit(1)
  })
