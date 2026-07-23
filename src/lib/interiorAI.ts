import { categories, formatPrice, type Product } from '../data/catalog'
import { getAllProducts } from './products'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  products?: Product[]
}

const STYLE_WORDS = [
  'minimal',
  'scandinavian',
  'japandi',
  'boho',
  'modern',
  'classic',
  'warm',
  'luxe',
  'natural',
  'organic',
  'soft',
  'tropical',
]

const ROOM_WORDS = [
  'wall panels',
  'kitchen',
  'wardrobe',
  'temple',
  'doors',
  'sculpted furniture',
  'living room',
  'bedroom',
  'puja',
  'entrance',
]

function extractBudget(text: string): number | null {
  const lower = text.toLowerCase()
  const lakh = lower.match(/(\d+(?:\.\d+)?)\s*lakh/)
  if (lakh) return Math.round(Number(lakh[1]) * 100000)

  const k = lower.match(/(?:₹|rs\.?\s*|inr\s*)?(\d+)\s*k\b/)
  if (k) return Number(k[1]) * 1000

  const plain = lower.match(/(?:under|below|budget(?:\s*of)?|upto|up to|max)\s*(?:₹|rs\.?\s*)?(\d[\d,]*)/i)
  if (plain) return Number(plain[1].replace(/,/g, ''))

  const currency = lower.match(/(?:₹|rs\.?\s*)(\d[\d,]*)/)
  if (currency) return Number(currency[1].replace(/,/g, ''))

  return null
}

function scoreProduct(product: Product, text: string, budget: number | null) {
  const lower = text.toLowerCase()
  let score = 0

  for (const room of product.rooms) {
    if (lower.includes(room)) score += 4
  }

  for (const style of product.style) {
    if (lower.includes(style)) score += 3
  }

  for (const style of STYLE_WORDS) {
    if (lower.includes(style) && product.style.includes(style)) score += 2
  }

  const category = categories.find((c) => c.id === product.categoryId)
  if (category && lower.includes(category.name.toLowerCase())) score += 3

  const sub = category?.subcategories.find((s) => s.id === product.subcategoryId)
  if (sub && lower.includes(sub.name.toLowerCase())) score += 4

  if (lower.includes(product.name.toLowerCase().split(' ')[0]!)) score += 2

  if (budget != null) {
    if (product.price <= budget) score += 3
    else score -= 5
  }

  if (
    lower.includes('cheap') ||
    lower.includes('affordable') ||
    lower.includes('budget')
  ) {
    score += product.price < 10000 ? 2 : product.price < 30000 ? 1 : -1
  }

  if (lower.includes('premium') || lower.includes('luxury') || lower.includes('luxe')) {
    score += product.price > 30000 ? 2 : 0
  }

  return score
}

function greetingReply(): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text:
      'Hi — I’m Priya’s Interior Guide. Ask about wall panels, kitchen, wardrobe, temple, doors, or sculpted furniture — with style and budget. Example: “Fluted wall panels under ₹30,000” or “Sliding wardrobe in walnut”.',
  }
}

export function createWelcomeMessage(): ChatMessage {
  return greetingReply()
}

export function answerInteriorQuery(userText: string): ChatMessage {
  const text = userText.trim()
  const lower = text.toLowerCase()

  if (!text) {
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: 'Tell me a little about the space — room, style, and budget — and I’ll help.',
    }
  }

  if (/^(hi|hello|hey|namaste)\b/.test(lower)) {
    return greetingReply()
  }

  const budget = extractBudget(text)
  const products = getAllProducts()
    .map((product) => ({ product, score: scoreProduct(product, text, budget) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price)
    .slice(0, 3)
    .map((row) => row.product)

  if (products.length === 0) {
    const fallback = getAllProducts()
      .filter((p) => (budget == null ? true : p.price <= budget))
      .sort((a, b) => a.price - b.price)
      .slice(0, 3)

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      text:
        budget != null
          ? `I couldn’t match that exactly, but here are approachable pieces${budget ? ` around your budget of ${formatPrice(budget)}` : ''}. You can also browse categories or ask about a specific room.`
          : 'Try mentioning a category (wall panels, kitchen, wardrobe, temple, doors), a style, or a budget (under ₹50,000). Meanwhile, here are a few starting pieces:',
      products: fallback,
    }
  }

  const total = products.reduce((sum, p) => sum + p.price, 0)
  const roomHint =
    ROOM_WORDS.find((room) => lower.includes(room)) ?? 'your space'
  const styleHint = STYLE_WORDS.find((style) => lower.includes(style))

  const lines = [
    `For ${roomHint}${styleHint ? ` with a ${styleHint} feel` : ''}, I’d start with these:`,
    ...products.map(
      (p, i) =>
        `${i + 1}. ${p.name} — ${formatPrice(p.price)} (${categories.find((c) => c.id === p.categoryId)?.name})`,
    ),
    `Together: ${formatPrice(total)}${budget != null ? ` · your budget ${formatPrice(budget)}` : ''}.`,
    'Want me to refine by color, size, or swap any piece?',
  ]

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    text: lines.join('\n'),
    products,
  }
}
