/**
 * Enable Supabase Storage for artifacts
 */

const fs = require('fs')
const path = require('path')

function enableSupabaseStorage() {
  console.log('🔧 Enabling Supabase Storage for artifacts...')
  
  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (fs.existsSync(envPath)) {
    console.log('📄 Found .env.local file')
    
    // Read current content
    const content = fs.readFileSync(envPath, 'utf8')
    
    // Check if USE_SUPABASE_STORAGE is already set
    if (content.includes('USE_SUPABASE_STORAGE=')) {
      console.log('✅ USE_SUPABASE_STORAGE is already configured')
      
      // Check if it's set to true
      if (content.includes('USE_SUPABASE_STORAGE=true')) {
        console.log('✅ Supabase Storage is already enabled')
      } else {
        console.log('⚠️ USE_SUPABASE_STORAGE is set but not to true')
        console.log('💡 Please set USE_SUPABASE_STORAGE=true in your .env.local file')
      }
    } else {
      console.log('📝 Adding USE_SUPABASE_STORAGE=true to .env.local')
      
      // Add the configuration
      const newContent = content + '\n# Artifact Storage Configuration\nUSE_SUPABASE_STORAGE=true\nARTIFACT_STORAGE_PATH=./artifacts\n'
      
      fs.writeFileSync(envPath, newContent)
      console.log('✅ Added Supabase Storage configuration to .env.local')
    }
  } else {
    console.log('📄 Creating .env.local file with Supabase Storage configuration')
    
    const content = `# Artifact Storage Configuration
USE_SUPABASE_STORAGE=true
ARTIFACT_STORAGE_PATH=./artifacts
`
    
    fs.writeFileSync(envPath, content)
    console.log('✅ Created .env.local with Supabase Storage configuration')
  }
  
  console.log('\n📋 Next steps:')
  console.log('1. Restart your development server')
  console.log('2. Restart the automation worker')
  console.log('3. Test CAPTCHA screenshots - they will now be stored in Supabase Storage')
  console.log('\n🌐 Benefits of Supabase Storage:')
  console.log('- Scalable cloud storage')
  console.log('- No local file management')
  console.log('- Public URLs for direct access')
  console.log('- Automatic backup and redundancy')
  console.log('- Better for production deployment')
}

// Run the setup
enableSupabaseStorage()
  .then(() => {
    console.log('\n✅ Setup completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })
