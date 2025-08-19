/**
 * Test script to verify CAPTCHA refresh synchronization
 */

// Load environment variables
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCaptchaRefresh() {
  try {
    console.log('🔍 Testing CAPTCHA refresh synchronization...')
    
    // Get the most recent job
    const { data: jobs, error: jobsError } = await supabase
      .from('ceac_automation_jobs')
      .select('id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (jobsError || !jobs.length) {
      console.error('No jobs found')
      return
    }
    
    const jobId = jobs[0].id
    console.log(`📋 Testing with job: ${jobId}`)
    
    // Get current CAPTCHA challenges
    const { data: challenges, error: challengesError } = await supabase
      .from('ceac_captcha_challenges')
      .select('*')
      .eq('job_id', jobId)
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
      
      // Extract timestamp from URL
      const url = new URL(latestChallenge.image_url)
      const timestamp = url.searchParams.get('t')
      console.log(`  - Timestamp: ${timestamp}`)
      
      if (timestamp === 'REFRESHING') {
        console.log('🔄 CAPTCHA is currently being refreshed')
      } else if (timestamp) {
        const timestampDate = new Date(parseInt(timestamp))
        const now = new Date()
        const diffMinutes = (now - timestampDate) / (1000 * 60)
        console.log(`  - Age: ${diffMinutes.toFixed(2)} minutes`)
      }
    }
    
    // Get recent progress updates
    const { data: progress, error: progressError } = await supabase
      .from('ceac_progress_updates')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (!progressError && progress.length > 0) {
      console.log(`\n📊 Recent progress updates:`)
      progress.forEach((update, index) => {
        console.log(`  ${index + 1}. ${update.step_name} - ${update.status} (${update.message})`)
        if (update.step_name === 'captcha_refresh_requested') {
          console.log(`     🔄 CAPTCHA refresh requested at: ${update.created_at}`)
        }
      })
    }
    
    console.log('\n✅ Test completed')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testCaptchaRefresh()
  .then(() => {
    console.log('\n✅ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
