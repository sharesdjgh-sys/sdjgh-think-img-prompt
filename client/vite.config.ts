import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { IMAGE_SYSTEM_PROMPT } from './api/prompts'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadApiKey(): string | undefined {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  try {
    const env = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    return env.match(/ANTHROPIC_API_KEY="?([^"\n]+)"?/)?.[1]?.trim()
  } catch {
    return undefined
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Think Prompt',
        short_name: 'ThinkPrompt',
        description: '고등학생을 위한 AI 프롬프트 교육 앱',
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        lang: 'ko',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['think prompt-logo.png', 'think prompt.jpg'],
        runtimeCaching: [
          {
            // API 호출은 캐시하지 않음
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
    {
      // 개발 환경에서 /api/analyze 요청을 직접 처리
      name: 'dev-api',
      configureServer(server) {
        server.middlewares.use('/api/analyze', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }

          const chunks: Buffer[] = []
          req.on('data', (chunk: Buffer) => chunks.push(chunk))
          req.on('end', async () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString())
              const prompt = body?.prompt

              if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Prompt is required' }))
                return
              }

              const client = new Anthropic({ apiKey: loadApiKey() })
              const response = await client.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 4096,
                system: IMAGE_SYSTEM_PROMPT,
                messages: [{ role: 'user', content: prompt }],
              })

              const text = (response.content[0] as { text: string }).text
                .replace(/^```json\s*|```$/g, '')
                .trim()

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(text)
            } catch (err) {
              console.error('[dev-api] error:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Analysis failed' }))
            }
          })
        })
      },
    },
  ],
})
