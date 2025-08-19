/**
 * Test script to verify screenshot approach
 */

// Load environment variables
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testScreenshotApproach() {
  try {
    console.log('🔍 Testing screenshot approach...')
    
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
    
    const job = jobs[0]
    console.log(`📋 Testing with job: ${job.id}`)
    console.log(`📊 Job status: ${job.status}`)
    
    // Check if job is currently running
    const isJobRunning = job.status === 'running' || job.status === 'queued'
    console.log(`🔄 Job running: ${isJobRunning}`)
    
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
    
    for (const challenge of challenges) {
      console.log(`\n🎯 Challenge ID: ${challenge.id}`)
      console.log(`📸 Image URL: ${challenge.image_url}`)
      console.log(`✅ Solved: ${challenge.solved}`)
      console.log(`📅 Created: ${challenge.created_at}`)
      
      // Check if this is a screenshot path
      if (challenge.image_url.startsWith('artifacts/')) {
        console.log(`🖼️ This is a screenshot path!`)
        
        // Check if the file exists
        const fs = require('fs')
        const path = require('path')
        const fullPath = path.join(process.cwd(), challenge.image_url)
        
        if (fs.existsSync(fullPath)) {
          console.log(`✅ Screenshot file exists: ${fullPath}`)
          const stats = fs.statSync(fullPath)
          console.log(`📊 File size: ${stats.size} bytes`)
          console.log(`📅 File modified: ${stats.mtime}`)
        } else {
          console.log(`❌ Screenshot file does not exist: ${fullPath}`)
        }
      } else if (challenge.image_url.includes('ceac.state.gov')) {
        console.log(`🌐 This is still a CEAC URL (old approach)`)
      } else {
        console.log(`❓ Unknown image URL format`)
      }
    }
    
    // Get recent progress updates
    const { data: progress, error: progressError } = await supabase
      .from('ceac_progress_updates')
      .select('*')
      .eq('job_id', job.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (!progressError && progress.length > 0) {
      console.log(`\n📊 Recent progress updates:`)
      progress.forEach((update, index) => {
        console.log(`  ${index + 1}. ${update.step_name} - ${update.status} (${update.message})`)
        if (update.captcha_image) {
          console.log(`     📸 CAPTCHA image: ${update.captcha_image}`)
        }
      })
    }
    
    console.log('\n💡 To test the new approach:')
    console.log(`1. Restart the automation worker`)
    console.log(`2. Start a new CEAC automation job`)
    console.log(`3. Check if CAPTCHA screenshots are being created`)
    console.log(`4. Verify the image_url starts with 'artifacts/'`)
    
    console.log('\n✅ Test completed')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testScreenshotApproach()
  .then(() => {
    console.log('\n✅ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
