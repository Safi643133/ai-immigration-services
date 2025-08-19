/**
 * Check bucket name and access
 */

// Load environment variables
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkBucket() {
  try {
    console.log('🔍 Checking Supabase Storage bucket...')
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }
    
    console.log('\n📦 Available buckets:')
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public})`)
    })
    
    // Check if our bucket exists
    const targetBucket = 'ceac-artifacts'
    const bucketExists = buckets.some(bucket => bucket.name === targetBucket)
    
    if (bucketExists) {
      console.log(`\n✅ Bucket "${targetBucket}" exists`)
      
      // Test upload to the bucket
      console.log('\n🧪 Testing upload to bucket...')
      const testData = Buffer.from('test data')
      const testPath = 'test/example.txt'
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(targetBucket)
        .upload(testPath, testData, {
          contentType: 'text/plain',
          upsert: true
        })
      
      if (uploadError) {
        console.error('❌ Upload failed:', uploadError)
      } else {
        console.log('✅ Upload successful')
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from(targetBucket)
          .getPublicUrl(testPath)
        
        console.log(`🌐 Public URL: ${urlData.publicUrl}`)
        
        // Test download
        const { data: downloadData, error: downloadError } = await supabase.storage
          .from(targetBucket)
          .download(testPath)
        
        if (downloadError) {
          console.error('❌ Download failed:', downloadError)
        } else {
          console.log('✅ Download successful')
        }
        
        // Clean up
        const { error: deleteError } = await supabase.storage
          .from(targetBucket)
          .remove([testPath])
        
        if (deleteError) {
          console.warn('⚠️ Cleanup failed:', deleteError)
        } else {
          console.log('✅ Test file cleaned up')
        }
      }
    } else {
      console.log(`\n❌ Bucket "${targetBucket}" not found`)
      console.log('💡 Available bucket names:')
      buckets.forEach(bucket => console.log(`  - ${bucket.name}`))
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the check
checkBucket()
  .then(() => {
    console.log('\n✅ Bucket check completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Bucket check failed:', error)
    process.exit(1)
  })
