/**
 * Anthropic Claude — used by Business Teams (Sales / WhatsApp / Reels).
 * No Gemini dependency.
 */
import { loadEnv } from 'vite'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

let runtimeAnthropicKey = ''

/** Strong default for business writing; override with ANTHROPIC_MODEL */
export const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-20250514'

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1'
const KEY_STORE_PATH = resolve(process.cwd(), 'data/anthropic-key.json')

function readPersistedKey(): string {
  try {
    if (!existsSync(KEY_STORE_PATH)) return ''
    const raw = JSON.parse(readFileSync(KEY_STORE_PATH, 'utf8')) as {
      anthropicApiKey?: string
    }
    return (raw.anthropicApiKey || '').trim()
  } catch {
    return ''
  }
}

function persistKey(key: string) {
  try {
    mkdirSync(dirname(KEY_STORE_PATH), { recursive: true })
    writeFileSync(
      KEY_STORE_PATH,
      JSON.stringify(
        { anthropicApiKey: key, updatedAt: new Date().toISOString() },
        null,
        2,
      ),
      'utf8',
    )
  } catch {
    /* non-fatal */
  }
}

export function hydrateAnthropicEnv(mode = 'development') {
  try {
    const env = loadEnv(mode, process.cwd(), '')
    for (const [key, value] of Object.entries(env)) {
      if (value != null && value !== '' && !process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    /* fall through */
  }

  for (const name of ['.env.local', '.env']) {
    const file = resolve(process.cwd(), name)
    if (!existsSync(file)) continue
    try {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq <= 0) continue
        const key = trimmed.slice(0, eq).trim()
        let value = trimmed.slice(eq + 1).trim()
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        if (key && value && !process.env[key]) process.env[key] = value
      }
    } catch {
      /* ignore */
    }
  }

  if (!runtimeAnthropicKey) {
    runtimeAnthropicKey =
      process.env.ANTHROPIC_API_KEY ||
      process.env.CLAUDE_API_KEY ||
      readPersistedKey() ||
      ''
  }
}

export function getAnthropicKey() {
  return (
    runtimeAnthropicKey ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.CLAUDE_API_KEY ||
    readPersistedKey() ||
    ''
  )
}

export function setAnthropicKey(key: string) {
  runtimeAnthropicKey = key.trim()
  process.env.ANTHROPIC_API_KEY = runtimeAnthropicKey
  if (runtimeAnthropicKey) persistKey(runtimeAnthropicKey)
}

export function claudeConfigured() {
  return Boolean(getAnthropicKey())
}

export function getClaudeModel() {
  return process.env.ANTHROPIC_MODEL || DEFAULT_CLAUDE_MODEL
}

type AnthropicContent = { type: string; text?: string }

type AnthropicResponse = {
  content?: AnthropicContent[]
  error?: { message?: string; type?: string }
  model?: string
}

/** Multi-turn Claude Messages API for Business Teams */
export async function claudeChat(opts: {
  system: string
  prompt: string
  model?: string
  history?: Array<{ role: 'user' | 'assistant'; text: string }>
}): Promise<{ reply: string; model: string }> {
  const key = getAnthropicKey()
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set')

  const model = opts.model || getClaudeModel()
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []

  for (const h of (opts.history ?? []).filter((x) => x.text?.trim()).slice(-12)) {
    const role = h.role === 'assistant' ? 'assistant' : 'user'
    const text = h.text.trim().slice(0, 4000)
    const last = messages[messages.length - 1]
    if (last && last.role === role) {
      last.content = `${last.content}\n\n${text}`.slice(0, 8000)
    } else {
      messages.push({ role, content: text })
    }
  }

  // Anthropic requires alternating roles starting with user
  while (messages.length && messages[0]!.role !== 'user') messages.shift()

  messages.push({ role: 'user', content: opts.prompt.slice(0, 24_000) })

  const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1400,
      temperature: 0.35,
      system: opts.system.slice(0, 120_000),
      messages,
    }),
  })

  const json = (await res.json()) as AnthropicResponse
  if (!res.ok) {
    throw new Error(
      json.error?.message || `Claude request failed (${res.status})`,
    )
  }

  const reply = (json.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text || '')
    .join('')
    .trim()

  if (!reply) throw new Error('Claude returned an empty reply')
  return { reply, model: json.model || model }
}
