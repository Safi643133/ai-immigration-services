/**
 * Setup Supabase Storage for artifacts
 */

// Load environment variables
require('dotenv').config()

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupSupabaseStorage() {
  try {
    console.log('🔧 Setting up Supabase Storage for artifacts...')
    
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'ceac-artifacts')
    
    if (bucketExists) {
      console.log('✅ Bucket "ceac-artifacts" already exists')
    } else {
      console.log('📦 Creating bucket "ceac-artifacts"...')
      
      const { data: bucket, error: createError } = await supabase.storage.createBucket('ceac-artifacts', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'text/html', 'application/json', 'video/mp4'],
        fileSizeLimit: 52428800 // 50MB
      })
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError)
        return
      }
      
      console.log('✅ Bucket "ceac-artifacts" created successfully')
    }
    
    // Test upload
    console.log('🧪 Testing upload...')
    const testData = Buffer.from('test artifact data')
    const testPath = 'test/artifact.txt'
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ceac-artifacts')
      .upload(testPath, testData, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.error('❌ Error testing upload:', uploadError)
      return
    }
    
    console.log('✅ Test upload successful')
    
    // Test download
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('ceac-artifacts')
      .download(testPath)
    
    if (downloadError) {
      console.error('❌ Error testing download:', downloadError)
      return
    }
    
    console.log('✅ Test download successful')
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('ceac-artifacts')
      .remove([testPath])
    
    if (deleteError) {
      console.warn('⚠️ Error cleaning up test file:', deleteError)
    } else {
      console.log('✅ Test file cleaned up')
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ceac-artifacts')
      .getPublicUrl('test/example.png')
    
    console.log('🌐 Public URL example:', urlData.publicUrl)
    
    console.log('\n✅ Supabase Storage setup completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Set USE_SUPABASE_STORAGE=true in your environment')
    console.log('2. Restart the automation worker')
    console.log('3. Test CAPTCHA screenshots - they will now be stored in Supabase Storage')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run the setup
setupSupabaseStorage()
  .then(() => {
    console.log('\n✅ Setup completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })
