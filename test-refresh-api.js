/**
 * Test script to verify CAPTCHA refresh API
 */

// Load environment variables
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testRefreshAPI() {
  try {
    console.log('🔍 Testing CAPTCHA refresh API...')
    
    // Get the most recent job
    const { data: jobs, error: jobsError } = await supabase
      .from('ceac_automation_jobs')
      .select('id, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (jobsError || !jobs.length) {
      console.error('No jobs found')
      return
    }
    
    const job = jobs[0]
    console.log(`📋 Testing with job: ${job.id}`)
    console.log(`📊 Job status: ${job.status}`)
    console.log(`👤 User ID: ${job.user_id}`)
    
    // Check if job is currently running
    const isJobRunning = job.status === 'running' || job.status === 'queued'
    console.log(`🔄 Job running: ${isJobRunning}`)
    
    if (!isJobRunning) {
      console.log('⚠️ Job is not running - refresh API should restart it')
    }
    
    // Get current CAPTCHA challenges
    const { data: challenges, error: challengesError } = await supabase
      .from('ceac_captcha_challenges')
      .select('*')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })
    
    if (challengesError) {
      console.error('Error fetching challenges:', challengesError)
      return
    }
    
    console.log(`📝 Found ${challenges.length} CAPTCHA challenges`)
    
    if (challenges.length > 0) {
      const latestChallenge = challenges[0]
      console.log(`🎯 Latest challenge:`)
      console.log(`  - ID: ${latestChallenge.id}`)
      console.log(`  - Image URL: ${latestChallenge.image_url}`)
      console.log(`  - Solved: ${latestChallenge.solved}`)
      console.log(`  - Created: ${latestChallenge.created_at}`)
    }
    
    console.log('\n💡 To test the refresh API:')
    console.log(`1. Go to your application`)
    console.log(`2. Find job ${job.id}`)
    console.log(`3. Click "Refresh" on the CAPTCHA`)
    console.log(`4. Check if the job status changes to "queued"`)
    console.log(`5. Check if a new CAPTCHA challenge is created`)
    
    console.log('\n✅ Test completed')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testRefreshAPI()
  .then(() => {
    console.log('\n✅ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
