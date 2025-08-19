/**
 * Test script to verify CAPTCHA synchronization
 * 
 * This script helps test if the CAPTCHA image shown in your app
 * matches the one on the CEAC website.
 */

// Load environment variables
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCaptchaSync() {
  try {
    console.log('🔍 Testing CAPTCHA synchronization...')
    
    // Get the latest job with CAPTCHA
    const { data: jobs, error: jobsError } = await supabase
      .from('ceac_automation_jobs')
      .select('id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return
    }
    
    console.log(`📋 Found ${jobs.length} recent jobs`)
    
    for (const job of jobs) {
      console.log(`\n🔍 Checking job: ${job.id}`)
      
      // Get CAPTCHA challenges for this job
      const { data: challenges, error: challengesError } = await supabase
        .from('ceac_captcha_challenges')
        .select('*')
        .eq('job_id', job.id)
        .order('created_at', { ascending: false })
      
      if (challengesError) {
        console.error('Error fetching challenges:', challengesError)
        continue
      }
      
      console.log(`📝 Found ${challenges.length} CAPTCHA challenges`)
      
      for (const challenge of challenges) {
        console.log(`  - Challenge ID: ${challenge.id}`)
        console.log(`  - Image URL: ${challenge.image_url}`)
        console.log(`  - Solved: ${challenge.solved}`)
        console.log(`  - Solution: ${challenge.solution || 'None'}`)
        console.log(`  - Created: ${challenge.created_at}`)
        
        // Check if this is the current active challenge
        if (!challenge.solved) {
          console.log(`  🎯 This is the current active challenge`)
          
          // Extract timestamp from URL for debugging
          const url = new URL(challenge.image_url)
          const timestamp = url.searchParams.get('_cb') || url.searchParams.get('t')
          console.log(`  ⏰ URL timestamp: ${timestamp}`)
          
          if (timestamp) {
            const timestampDate = new Date(parseInt(timestamp))
            const now = new Date()
            const diffMinutes = (now - timestampDate) / (1000 * 60)
            console.log(`  📅 Timestamp age: ${diffMinutes.toFixed(2)} minutes`)
          }
        }
      }
      
      // Get progress updates
      const { data: progress, error: progressError } = await supabase
        .from('ceac_progress_updates')
        .select('*')
        .eq('job_id', job.id)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (!progressError && progress.length > 0) {
        console.log(`📊 Latest progress: ${progress[0].step_name} - ${progress[0].status}`)
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testCaptchaSync()
  .then(() => {
    console.log('\n✅ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
