import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { IMAGE_SYSTEM_PROMPT } from './api/prompts'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvValue(name: string): string | undefined {
  if (process.env[name]) return process.env[name]

  for (const envPath of [join(__dirname, '.env.local'), join(__dirname, '..', '.env.local')]) {
    try {
      const env = readFileSync(envPath, 'utf8')
      const match = env.match(new RegExp(`^${name}="?([^"\\n]+)"?`, 'm'))
      if (match?.[1]?.trim()) return match[1].trim()
    } catch {
      // Try the next supported env location.
    }
  }

  return undefined
}

function loadApiKey(): string | undefined {
  return loadEnvValue('ANTHROPIC_API_KEY')
}

function loadGeminiApiKey(): string | undefined {
  return loadEnvValue('GEMINI_API_KEY')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function findGeneratedImage(value: unknown): { data?: string; mime_type?: string; mimeType?: string } | null {
  if (!isRecord(value)) return null

  const inlineData = value.inline_data
  if (isRecord(inlineData) && typeof inlineData.data === 'string') {
    return {
      data: inlineData.data,
      mime_type: typeof inlineData.mime_type === 'string' ? inlineData.mime_type : undefined,
      mimeType: typeof inlineData.mimeType === 'string' ? inlineData.mimeType : undefined,
    }
  }

  if (typeof value.data === 'string') {
    const mimeType =
      typeof value.mime_type === 'string'
        ? value.mime_type
        : typeof value.mimeType === 'string'
          ? value.mimeType
          : undefined
    const type = typeof value.type === 'string' ? value.type : ''

    if (mimeType?.startsWith('image/') || type.includes('image')) {
      return { data: value.data, mime_type: mimeType }
    }
  }

  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const image = findGeneratedImage(item)
        if (image) return image
      }
    } else if (isRecord(child)) {
      const image = findGeneratedImage(child)
      if (image) return image
    }
  }

  return null
}

function summarizeGeminiResponse(body: {
  output_image?: unknown
  steps?: unknown[]
  status?: string
  model?: string
}) {
  return {
    status: body.status,
    model: body.model,
    hasOutputImage: Boolean(body.output_image),
    stepTypes: body.steps?.map((step) => isRecord(step) ? step.type : typeof step),
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

        server.middlewares.use('/api/generate-image', (req, res) => {
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
              const apiKey = loadGeminiApiKey()

              if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Prompt is required' }))
                return
              }

              if (!apiKey) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }))
                return
              }

              const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-goog-api-key': apiKey,
                },
                body: JSON.stringify({
                  model: 'gemini-3.1-flash-image',
                  input: [{ type: 'text', text: prompt.trim() }],
                }),
              })

              const geminiBody = await geminiResponse.json() as {
                output_image?: { data?: string; mime_type?: string; mimeType?: string }
                error?: { message?: string }
              }
              if (!geminiResponse.ok) {
                console.error('[dev-generate-image] Gemini error:', geminiBody)
                res.statusCode = geminiResponse.status
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: geminiBody.error?.message ?? 'Image generation failed' }))
                return
              }

              const image = geminiBody.output_image?.data ? geminiBody.output_image : findGeneratedImage(geminiBody)
              if (!image?.data) {
                console.error('[dev-generate-image] Missing image data:', summarizeGeminiResponse(geminiBody))
                res.statusCode = 502
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'No image was generated' }))
                return
              }

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                imageData: image.data,
                mimeType: image.mime_type ?? image.mimeType ?? 'image/png',
                model: 'gemini-3.1-flash-image',
              }))
            } catch (err) {
              console.error('[dev-generate-image] error:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Image generation failed' }))
            }
          })
        })
      },
    },
  ],
})
