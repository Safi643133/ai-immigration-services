import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Validate that the URL is from CEAC
    if (!imageUrl.includes('ceac.state.gov')) {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      )
    }

    // Skip proxy for placeholder URLs
    if (imageUrl.includes('t=REFRESHING')) {
      return NextResponse.json(
        { 
          error: 'CAPTCHA is being refreshed, please try again in a moment',
          status: 'refreshing'
        },
        { status: 202 }
      )
    }

    // Check if this looks like a stale CAPTCHA URL (very old token)
    const url = new URL(imageUrl)
    const token = url.searchParams.get('t')
    if (token && token.length === 32) {
      // This is a session token, not a timestamp
      // If the automation is not running, this token will be stale
      console.log(`🔍 CAPTCHA token: ${token}`)
    }

    // Retry logic for fetching CAPTCHA image
    let response = null
    let lastError = null
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt} to fetch CAPTCHA image: ${imageUrl}`)
        
        response = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://ceac.state.gov/GenNIV/Default.aspx',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(10000), // 10 second timeout
        })

        if (response.ok) {
          break // Success, exit retry loop
        } else {
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
          console.warn(`❌ Attempt ${attempt} failed: ${lastError.message}`)
        }
      } catch (error) {
        lastError = error
        console.warn(`❌ Attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`)
        
        // If it's a connection reset, wait before retrying
        if (error instanceof Error && (error.message.includes('ECONNRESET') || error.message.includes('fetch failed'))) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // Exponential backoff
        }
      }
    }

    if (!response || !response.ok) {
      console.error(`❌ All attempts failed to fetch CAPTCHA image`)
      console.error(`❌ URL: ${imageUrl}`)
      console.error(`❌ Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`)
      
      return NextResponse.json(
        { 
          error: `Failed to fetch CAPTCHA image after 3 attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
          url: imageUrl
        },
        { status: 500 }
      )
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    console.log(`✅ Successfully fetched CAPTCHA image (${imageBuffer.byteLength} bytes)`)

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('Error proxying CAPTCHA image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
