const http = require('http')
const fs = require('fs')
const path = require('path')

const LISTEN_PORT = Number(process.env.FALLBACK_PORT || 3000)
const TARGET_PORT = Number(process.env.APP_PORT || 3001)
const TARGET_HOST = process.env.APP_HOST || '127.0.0.1'

const fallbackPath = path.resolve(__dirname, '../deploy/nginx/fallback.html')
const fallbackHtml = fs.readFileSync(fallbackPath, 'utf-8')

function serveFallback(res) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  })
  res.end(fallbackHtml)
}

const server = http.createServer((req, res) => {
  const proxyReq = http.request(
    {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `${TARGET_HOST}:${TARGET_PORT}`,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', () => {
    serveFallback(res)
  })

  req.pipe(proxyReq)
})

server.listen(LISTEN_PORT, () => {
  console.log(
    `[fallback-proxy] listening on :${LISTEN_PORT}, forwarding to ${TARGET_HOST}:${TARGET_PORT}`
  )
})
