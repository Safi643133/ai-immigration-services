/**
 * Test script to check CAPTCHA URL accessibility
 */

const testUrl = 'https://ceac.state.gov/GenNIV/BotDetectCaptcha.ashx?get=image&c=c_default_ctl00_sitecontentplaceholder_uclocation_identifycaptcha1_defaultcaptcha&t=3d6839be4e964c0fae47919fb926f961'

console.log('🔍 Testing CAPTCHA URL accessibility...')
console.log(`📸 URL: ${testUrl}`)

// Parse the URL to understand the structure
const url = new URL(testUrl)
console.log(`🔍 URL components:`)
console.log(`  - Protocol: ${url.protocol}`)
console.log(`  - Host: ${url.host}`)
console.log(`  - Path: ${url.pathname}`)
console.log(`  - Parameters:`)
url.searchParams.forEach((value, key) => {
  console.log(`    ${key}: ${value}`)
})

// Check if the timestamp looks like a hex value
const timestamp = url.searchParams.get('t')
if (timestamp) {
  console.log(`\n🔍 Timestamp analysis:`)
  console.log(`  - Value: ${timestamp}`)
  console.log(`  - Length: ${timestamp.length} characters`)
  console.log(`  - Is hex: ${/^[0-9a-f]+$/i.test(timestamp)}`)
  
  // Try to parse as different formats
  try {
    const asInt = parseInt(timestamp, 16)
    console.log(`  - As hex integer: ${asInt}`)
    console.log(`  - As date: ${new Date(asInt)}`)
  } catch (e) {
    console.log(`  - Cannot parse as hex integer`)
  }
  
  try {
    const asInt10 = parseInt(timestamp, 10)
    console.log(`  - As decimal integer: ${asInt10}`)
    console.log(`  - As date: ${new Date(asInt10)}`)
  } catch (e) {
    console.log(`  - Cannot parse as decimal integer`)
  }
}

console.log('\n💡 The issue is that CEAC uses a session-specific token, not a timestamp.')
console.log('💡 When the CAPTCHA refreshes, this token changes.')
console.log('💡 Our automation needs to refresh the CAPTCHA on CEAC and capture the new token.')
