const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDatabase() {
  console.log('🔍 Checking database state...\n')

  try {
    // Check recent jobs
    console.log('📋 Recent Jobs:')
    const { data: jobs, error: jobsError } = await supabase
      .from('ceac_automation_jobs')
      .select('id, status, user_id, created_at, embassy_location')
      .order('created_at', { ascending: false })
      .limit(5)

    if (jobsError) {
      console.error('❌ Error fetching jobs:', jobsError)
    } else {
      jobs.forEach(job => {
        console.log(`  - ${job.id.slice(0, 8)}... | ${job.status} | ${job.embassy_location}`)
      })
    }

    console.log('\n🔐 CAPTCHA Challenges:')
    const { data: captchas, error: captchaError } = await supabase
      .from('ceac_captcha_challenges')
      .select('id, job_id, image_url, solved, created_at, expires_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (captchaError) {
      console.error('❌ Error fetching CAPTCHAs:', captchaError)
    } else {
      if (captchas.length === 0) {
        console.log('  No CAPTCHA challenges found')
      } else {
        captchas.forEach(captcha => {
          console.log(`  - ${captcha.id.slice(0, 8)}... | Job: ${captcha.job_id.slice(0, 8)}... | Solved: ${captcha.solved} | Expires: ${captcha.expires_at}`)
        })
      }
    }

    console.log('\n📊 Progress Updates:')
    const { data: progress, error: progressError } = await supabase
      .from('ceac_progress_updates')
      .select('id, job_id, step, status, message, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (progressError) {
      console.error('❌ Error fetching progress:', progressError)
    } else {
      if (progress.length === 0) {
        console.log('  No progress updates found')
      } else {
        progress.forEach(update => {
          console.log(`  - ${update.id.slice(0, 8)}... | Job: ${update.job_id.slice(0, 8)}... | ${update.step} | ${update.status}`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkDatabase()

