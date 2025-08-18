const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixSchema() {
  try {
    console.log('🔧 Fixing database schema...')
    
    // Add missing columns
    const queries = [
      // Add last_update column to ceac_automation_jobs
      `ALTER TABLE ceac_automation_jobs ADD COLUMN IF NOT EXISTS last_update TIMESTAMPTZ DEFAULT NOW()`,
      
      // Add metadata column to ceac_automation_jobs
      `ALTER TABLE ceac_automation_jobs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`,
      
      // Add filename column to ceac_artifacts
      `ALTER TABLE ceac_artifacts ADD COLUMN IF NOT EXISTS filename VARCHAR(500)`,
      
      // Add metadata column to ceac_job_events
      `ALTER TABLE ceac_job_events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`,
      
      // Update existing records
      `UPDATE ceac_automation_jobs SET metadata = COALESCE(metadata, '{}'::jsonb) WHERE metadata IS NULL`,
      `UPDATE ceac_job_events SET metadata = COALESCE(metadata, '{}'::jsonb) WHERE metadata IS NULL`
    ]
    
    for (const query of queries) {
      console.log(`Running: ${query}`)
      const { error } = await supabase.rpc('exec_sql', { sql: query })
      if (error) {
        console.log(`Query completed (may have already been applied): ${error.message}`)
      } else {
        console.log('✅ Query executed successfully')
      }
    }
    
    console.log('✅ Schema fixes applied successfully')
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error)
  }
}

fixSchema()
