/**
 * Simple health check server for Railway deployment
 * Runs alongside the worker to provide health status
 */

import { createServer } from 'http'
import { AddressInfo } from 'net'

const PORT = process.env.PORT || 3001 // Use 3001 to avoid conflict with Next.js

const server = createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'ceac-worker',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }))
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  }
})

export function startHealthServer(): void {
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${PORT} in use, health server will not start (this is fine for development)`)
    } else {
      console.error('🏥 Health server error:', err)
    }
  })

  server.listen(PORT, () => {
    const address = server.address() as AddressInfo
    console.log(`🏥 Health server running on port ${address.port}`)
    console.log(`🔍 Health check available at: http://localhost:${address.port}/health`)
  })
}

export function stopHealthServer(): void {
  server.close(() => {
    console.log('🏥 Health server stopped')
  })
}
