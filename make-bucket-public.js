/**
 * Make ceac-artifacts bucket public
 */

// Load environment variables
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function makeBucketPublic() {
  try {
    console.log('🔧 Making ceac-artifacts bucket public...')
    
    // Update bucket to be public
    const { data, error } = await supabase.storage.updateBucket('ceac-artifacts', {
      public: true
    })
    
    if (error) {
      console.error('❌ Failed to make bucket public:', error)
      return
    }
    
    console.log('✅ Bucket made public successfully')
    
    // Verify the change
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }
    
    const bucket = buckets.find(b => b.name === 'ceac-artifacts')
    if (bucket) {
      console.log(`📦 Bucket status: ${bucket.name} (public: ${bucket.public})`)
    }
    
    // Test public access
    console.log('\n🧪 Testing public access...')
    const testData = Buffer.from('test public access')
    const testPath = 'public-test/example.txt'
    
    // Upload test file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ceac-artifacts')
      .upload(testPath, testData, {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError)
      return
    }
    
    console.log('✅ Test file uploaded')
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ceac-artifacts')
      .getPublicUrl(testPath)
    
    console.log(`🌐 Public URL: ${urlData.publicUrl}`)
    
    // Test public access via fetch
    try {
      const response = await fetch(urlData.publicUrl)
      if (response.ok) {
        console.log('✅ Public URL is accessible')
      } else {
        console.log(`⚠️ Public URL returned status: ${response.status}`)
      }
    } catch (fetchError) {
      console.log('⚠️ Could not test public URL access:', fetchError.message)
    }
    
    // Clean up
    const { error: deleteError } = await supabase.storage
      .from('ceac-artifacts')
      .remove([testPath])
    
    if (deleteError) {
      console.warn('⚠️ Cleanup failed:', deleteError)
    } else {
      console.log('✅ Test file cleaned up')
    }
    
    console.log('\n🎉 Bucket is now public!')
    console.log('📋 CAPTCHA images should now be accessible via public URLs')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the script
makeBucketPublic()
  .then(() => {
    console.log('\n✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
