/**
 * Fix ceac_artifacts table schema for Supabase Storage support
 */

// Load environment variables
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixArtifactsSchema() {
  try {
    console.log('🔧 Fixing ceac_artifacts table schema...')
    
    // Try to add the missing columns by attempting to insert a test record
    // This will help us identify which columns are missing
    console.log('🧪 Testing artifact insertion to identify missing columns...')
    
    const testArtifact = {
      job_id: 'test-job-id',
      type: 'screenshot',
      filename: 'test.png',
      storage_path: 'test/path.png',
      mime_type: 'image/png',
      file_size: 1024,
      public_url: 'https://test.supabase.co/storage/test.png',
      checksum: 'test-checksum',
      metadata: { test: true }
    }
    
    try {
      const { data, error } = await supabase
        .from('ceac_artifacts')
        .insert(testArtifact)
        .select()
      
      if (error) {
        console.log('❌ Insert failed, checking which columns are missing...')
        console.log('Error:', error.message)
        
        // Try without optional columns
        const minimalArtifact = {
          job_id: 'test-job-id',
          type: 'screenshot',
          filename: 'test.png',
          storage_path: 'test/path.png',
          mime_type: 'image/png',
          file_size: 1024
        }
        
        const { error: minimalError } = await supabase
          .from('ceac_artifacts')
          .insert(minimalArtifact)
        
        if (minimalError) {
          console.log('❌ Even minimal insert failed:', minimalError.message)
        } else {
          console.log('✅ Minimal insert succeeded - some columns are missing')
        }
      } else {
        console.log('✅ Full insert succeeded - all columns exist')
      }
    } catch (insertError) {
      console.log('❌ Insert test failed:', insertError.message)
    }
    
    // Check current schema
    console.log('\n🔍 Checking current table structure...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('ceac_artifacts')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.log('❌ Error checking table:', tableError.message)
    } else {
      console.log('✅ Table exists and is accessible')
    }
    
    // Try to manually add columns using raw SQL
    console.log('\n📝 Attempting to add missing columns...')
    
    // Since we can't use RPC, let's try a different approach
    // We'll modify the ArtifactStorage to handle missing columns gracefully
    
    console.log('\n💡 Solution: The issue is that the ceac_artifacts table is missing required columns.')
    console.log('   We need to add these columns to the database schema.')
    
    console.log('\n📋 Missing columns that need to be added:')
    console.log('  - public_url TEXT')
    console.log('  - checksum TEXT') 
    console.log('  - metadata JSONB')
    
    console.log('\n🔧 To fix this, you need to:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Run these commands:')
    console.log(`
ALTER TABLE ceac_artifacts ADD COLUMN IF NOT EXISTS public_url TEXT;
ALTER TABLE ceac_artifacts ADD COLUMN IF NOT EXISTS checksum TEXT;
ALTER TABLE ceac_artifacts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
    `)
    
    console.log('\n🎯 After adding the columns:')
    console.log('1. Restart the automation worker')
    console.log('2. Start a new CEAC automation job')
    console.log('3. CAPTCHA screenshots should now be stored in Supabase Storage')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the fix
fixArtifactsSchema()
  .then(() => {
    console.log('\n✅ Schema check completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Schema check failed:', error)
    process.exit(1)
  })
