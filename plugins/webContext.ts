/**
 * Lightweight public-web context for general interior/materials education.
 * Never used for Priyabadal product prices (catalog is source of truth).
 */

type WebSnippet = {
  title: string
  url: string
  text: string
}

const BLOCKED =
  /\b(price|pricing|cost|rate|₹|rs\.?|inr|quote|discount|buy|amazon|flipkart|indiamart)\b/i

function cleanQuery(q: string) {
  return q
    .replace(/[^\w\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

async function wikiSummary(titleOrQuery: string): Promise<WebSnippet | null> {
  try {
    const q = encodeURIComponent(cleanQuery(titleOrQuery))
    // Search for best page title first
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${q}&limit=1&namespace=0&format=json`,
      { signal: AbortSignal.timeout(4000) },
    )
    if (!searchRes.ok) return null
    const searchJson = (await searchRes.json()) as [string, string[], string[], string[]]
    const title = searchJson[1]?.[0]
    const pageUrl = searchJson[3]?.[0]
    if (!title) return null

    const sumRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { signal: AbortSignal.timeout(4000) },
    )
    if (!sumRes.ok) return null
    const sum = (await sumRes.json()) as {
      title?: string
      extract?: string
      content_urls?: { desktop?: { page?: string } }
    }
    const text = (sum.extract || '').trim()
    if (!text || BLOCKED.test(text)) return null
    return {
      title: sum.title || title,
      url: sum.content_urls?.desktop?.page || pageUrl || '',
      text: text.slice(0, 700),
    }
  } catch {
    return null
  }
}

/** Build a short web context block for materials / interior education questions */
export async function fetchInteriorWebContext(message: string): Promise<string> {
  const t = message.toLowerCase()
  // Only for general materials / interior education — not catalog pricing
  const isMaterials =
    /\b(plywood|bwp|marine|mdf|hdf|laminate|veneer|acrylic|pu|hardware|hinge|channel|edge banding|moisture|termite|interior material|board quality|what is)\b/i.test(
      t,
    )
  if (!isMaterials) return ''

  const topics: string[] = []
  if (/\bbwp\b|marine|boiling/.test(t)) topics.push('Marine plywood')
  else if (/\bmdf\b/.test(t)) topics.push('Medium-density fibreboard')
  else if (/\bhdf\b/.test(t)) topics.push('Hardboard')
  else if (/laminate/.test(t)) topics.push('Laminate')
  else if (/veneer/.test(t)) topics.push('Wood veneer')
  else if (/plywood/.test(t)) topics.push('Plywood')
  else if (/acrylic|pu\b|polyurethane/.test(t)) topics.push('Polyurethane')
  else topics.push('Engineered wood')

  const snippets: WebSnippet[] = []
  for (const topic of topics.slice(0, 2)) {
    const snip = await wikiSummary(topic)
    if (snip) snippets.push(snip)
  }

  if (!snippets.length) return ''

  return [
    'WEB CONTEXT (general industry education only — NOT for Priyabadal prices or SKUs):',
    ...snippets.map(
      (s, i) =>
        `${i + 1}. ${s.title}${s.url ? ` — ${s.url}` : ''}\n${s.text}`,
    ),
    'Use this only to explain materials in plain language. Always prefer SESSION FACTS / CATALOG for Priyabadal shutter, carcass, and product rates.',
  ].join('\n\n')
}
