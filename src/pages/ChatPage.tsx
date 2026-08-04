import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { askPriyaBadalAI } from '../lib/chatAI'
import { CARCASS_ASSEMBLY_PATH } from '../data/carcassSpec'
import {
  buildChatWhatsAppUrl,
  colourFromBrief,
  createWelcomeMessage,
  detectVisualiseMode,
  looksLikeDrawingIntent,
  mergeBriefFromText,
  messageForPhotoAttached,
  messageForProductSelected,
  cleanChatProductText,
  processConsultTurn,
  type ChatMessage,
  type ConsultBrief,
} from '../lib/interiorAI'
import { productHasCarcass } from '../lib/pricing'
import type { VisualiseMode } from '../lib/visualise'
import { fileToDataUrl, generateVisualise } from '../lib/visualise'
import { detectShutterPose } from '../lib/shutterPose'
import { generateLiveCarcass } from '../lib/carcassLive'
import {
  defaultSize,
  getProductCarcassImage,
  quoteCarcass,
  ratesFromProduct,
  resolveCarcassCategory,
  suggestLayout,
} from '../lib/carcassPlanner'
import { AiAccessBanner } from '../components/AiAccessBanner'
import { fetchAiAccessStatus } from '../lib/aiAccess'
import { getCategory, formatPrice, type Product } from '../data/catalog'
import { getProductById } from '../lib/products'
import { useCurrency } from '../hooks/useCurrency'
import './ChatPage.css'

type AttachMode = 'photo' | 'drawing'

/** Keep assistant replies plain — never surface API codes or raw server text */
function friendlyChatError(
  raw: string | undefined,
  kind: 'visualise' | 'carcass' | 'chat',
): string {
  const t = (raw || '').trim()
  if (/subscription|access code|unlock|SUBSCRIPTION/i.test(t)) {
    return 'AI unlock is needed for that step. Tap Unlock above — or keep asking about price, carcass, and materials.'
  }
  if (/QUOTA|limit|monthly/i.test(t)) {
    return 'This month’s AI looks are used up. You can still ask price and carcass questions, or WhatsApp us.'
  }
  if (/MISSING_FAL|not connected|Fal|balance|credit/i.test(t)) {
    return kind === 'visualise' || kind === 'carcass'
      ? 'Visualisation isn’t available right now. Try again later, or WhatsApp us.'
      : 'Live chat isn’t available right now. I’ve kept catalog answers ready — send again in a moment.'
  }
  if (t && t.length < 160 && !/[A-Z_]{3,}/.test(t) && !/[{}[\]|]/.test(t)) {
    return t
  }
  if (kind === 'carcass') {
    return 'I couldn’t make that open carcass just now. Try again, or WhatsApp us.'
  }
  return kind === 'visualise'
    ? 'I couldn’t make that look just now. Try a clearer photo, or WhatsApp us.'
    : 'Something went quiet on my side. Send again in a moment — price and carcass still work.'
}

export function ChatPage() {
  useCurrency()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [messages, setMessages] = useState<ChatMessage[]>([createWelcomeMessage()])
  const [brief, setBrief] = useState<ConsultBrief>({})
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  /** True when Fal is on the server AND this device is unlocked */
  const [aiConfigured, setAiConfigured] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [attachMode, setAttachMode] = useState<AttachMode>('photo')
  const [pendingFile, setPendingFile] = useState<{
    dataUrl: string
    kind: AttachMode
  } | null>(null)
  const bootstrappedRef = useRef(false)
  const unlockNagRef = useRef(false)
  const endRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  /** Scroll only the chat thread — never the whole page */
  const scrollThreadToBottom = () => {
    const el = scrollRef.current
    if (!el) return
    // Double rAF waits for layout so we don’t leap mid-render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!scrollRef.current || !stickToBottomRef.current) return
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      })
    })
  }

  useEffect(() => {
    if (!stickToBottomRef.current) return
    scrollThreadToBottom()
  }, [messages, busy, pendingFile])

  useEffect(() => {
    void fetchAiAccessStatus().then((s) => {
      const ready = Boolean(
        s.falConfigured && (!s.requireSubscription || s.subscribed),
      )
      setAiConfigured(ready)
      // Never auto-open the unlock sheet — only on Visualise or AI access tap
      if (ready) setShowKey(false)
    })
  }, [])

  /** Full-screen chat chrome (fallback if :has() is unavailable) */
  useEffect(() => {
    document.body.classList.add('pbai-open')
    return () => document.body.classList.remove('pbai-open')
  }, [])

  /** Deep links from shop / old Design·Visualise·Carcass URLs */
  useEffect(() => {
    if (bootstrappedRef.current) return
    const productId = searchParams.get('product')
    const intent = (searchParams.get('intent') || searchParams.get('type') || '').toLowerCase()
    if (!productId && !intent) return
    bootstrappedRef.current = true

    const product = productId ? getProductById(productId) : undefined
    const extras: ChatMessage[] = []
    let nextBrief: ConsultBrief = {}

    if (product) {
      nextBrief = {
        selectedProductId: product.id,
        categoryId: product.categoryId,
        room: product.rooms[0],
      }
      setBrief((prev) => ({ ...prev, ...nextBrief }))
      extras.push(messageForProductSelected(product, nextBrief))
    }

    if (intent.includes('carcass') || intent === 'kitchen' || intent === 'wardrobe') {
      extras.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: [
          'Carcass help is right here in chat.',
          '',
          'Ask shutter vs carcass rates, share size in feet (e.g. 8×7), say “Visualise carcass” for a live-size open carcass elevation, or ask for the BWP · 1 mm laminate both sides · 2 mm edge banding assembly guide.',
        ].join('\n'),
        suggestions: [
          'Visualise carcass',
          'What is carcass pricing?',
          'Price with carcass for 8×7',
          'What materials do you use?',
        ],
      })
    } else if (intent.includes('visual') || intent.includes('design')) {
      extras.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: [
          'Visualisation lives in this chat now.',
          '',
          'Attach a room photo (paperclip), pick a product if you haven’t, then say “visualise” — replace, install, or redesign.',
        ].join('\n'),
        suggestions: ['Attach room photo', 'Visualise my look', 'Suggest styles'],
      })
    }

    if (extras.length) setMessages((prev) => [...prev, ...extras])
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const onThreadScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distance < 100
  }

  const push = (...next: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...next])
  }

  const runCarcassVisualise = async (current: ConsultBrief) => {
    const product = current.selectedProductId
      ? getProductById(current.selectedProductId)
      : undefined
    const category = resolveCarcassCategory(product, current.categoryId)
    const carcassImage = getProductCarcassImage(product)

    if (!product || !category || !carcassImage) {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Pick a wardrobe, kitchen, or carcass style from our list first — then say “Visualise carcass” for the open interior elevation.',
        suggestions: ['Suggest wardrobe styles', 'Suggest kitchen styles', 'Price with carcass'],
      })
      return
    }

    if (current.widthFt == null || current.heightFt == null) {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Share the live size in feet (e.g. 8×6) and I’ll generate the open carcass at that size.',
        suggestions: ['Wardrobe 8×6', 'Kitchen 10×8'],
      })
      return
    }

    if (!aiConfigured) {
      setShowKey(true)
      if (!unlockNagRef.current) {
        unlockNagRef.current = true
        push({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Open carcass visualisation needs AI unlock first — enter your access code, or keep asking about price and materials anytime.',
          suggestions: ['Price with carcass', 'What materials do you use?'],
        })
      }
      return
    }

    const limits = defaultSize(category)
    const width = current.widthFt
    const height = current.heightFt
    const depth = current.depthFt ?? limits.defaultDepth
    const rates = ratesFromProduct(category, product)
    const bays = suggestLayout(category, width, 'balanced')
    const quote = quoteCarcass({
      category,
      width,
      height,
      depth,
      bays,
      rates,
      finishId: rates.finishId,
      thicknessId: rates.thicknessId,
    })

    setBusy(true)
    try {
      const result = await generateLiveCarcass({
        carcassImagePath: carcassImage,
        productName: product.name,
        category,
        quote,
        finishId: rates.finishId,
        thicknessId: rates.thicknessId,
        notes: current.notes || undefined,
      })

      if (result.source === 'ai' && result.imageUrl) {
        const nextBrief: ConsultBrief = {
          ...current,
          aiImageUrl: result.imageUrl,
          depthFt: depth,
          lastChangeRequest: null,
        }
        setBrief(nextBrief)
        push({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: [
            result.message,
            '',
            `Open carcass for ${product.name} at ${width} × ${height} × ${depth} ft.`,
            `Layout: ${quote.baySummary}`,
            `BWP plywood · both-side 1 mm laminate · 2 mm edge banding.`,
            '',
            `Catalog estimate (with carcass): ${formatPrice(quote.unitPrice, 'INR')} — final on WhatsApp after measure.`,
            '',
            'Want the shuttered room look next? Attach a photo and say “Visualise my look”.',
          ].join('\n'),
          aiImageUrl: result.imageUrl,
          products: [product],
          suggestions: [
            'Price estimate',
            'What is BWP plywood?',
            'Visualise my look',
            'WhatsApp quote',
          ],
        })
      } else {
        if (
          result.code === 'MISSING_FAL_KEY' ||
          result.code === 'SUBSCRIPTION_REQUIRED' ||
          result.code === 'QUOTA_EXCEEDED'
        ) {
          setAiConfigured(false)
          setShowKey(true)
        }
        push({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: friendlyChatError(result.message, 'carcass'),
          suggestions: ['Price with carcass', 'WhatsApp quote'],
        })
      }
    } catch {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'I couldn’t reach carcass visualisation just now. Try again in a moment.',
        suggestions: ['Price with carcass', 'WhatsApp quote'],
      })
    } finally {
      setBusy(false)
    }
  }

  const runVisualise = async (
    current: ConsultBrief,
    refine = false,
    mode: VisualiseMode = 'replace',
  ) => {
    const product = current.selectedProductId
      ? getProductById(current.selectedProductId)
      : undefined
    if (!product || !current.roomPhotoDataUrl) {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'I need a product from our list plus a room photo or architect drawing before I can visualise in chat.',
        suggestions: ['Attach room photo', 'I have an architect drawing', 'Suggest products'],
      })
      return
    }

    // Corrections must edit the current AI image — never jump back to the room photo
    const changeText =
      current.lastChangeRequest?.trim() ||
      (refine
        ? 'Keep this same visualisation — polish lighting and realism only; do not change the product or room.'
        : '')
    const shouldRefine = Boolean(refine && current.aiImageUrl && changeText)

    if (!aiConfigured) {
      setShowKey(true)
      if (!unlockNagRef.current) {
        unlockNagRef.current = true
        push({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Room visualisation needs AI unlock first — enter your access code above, or ask me for price, carcass, and materials anytime (those stay free).',
          suggestions: ['Price with carcass', 'What materials do you use?'],
        })
      }
      return
    }

    setBusy(true)
    try {
      const category = getCategory(product.categoryId)
      const colour = colourFromBrief(current)
      const kind = current.attachmentKind ?? 'photo'
      const sizeNote =
        current.widthFt != null && current.heightFt != null
          ? `Live size: ${current.widthFt} × ${current.heightFt}${
              current.depthFt != null ? ` × ${current.depthFt}` : ''
            } ft`
          : undefined
      const drawingNote =
        kind === 'drawing'
          ? 'Input is an interior architect drawing (plan / elevation / sketch). Follow the drawing layout; install Priyabadal catalog product style.'
          : undefined
      // On refine, do not re-send piled preference notes — only the change request
      const pose = detectShutterPose(changeText, current.notes)
      const ajarNote =
        pose === 'ajar'
          ? 'Slightly open shutters showroom style: only 1–2 doors ajar 20–35°, keep façade match, not full open carcass.'
          : pose === 'open-carcass'
            ? 'Open carcass pose: show interior layout clearly.'
            : undefined
      const notes = shouldRefine
        ? [sizeNote, ajarNote].filter(Boolean).join('. ')
        : [drawingNote, sizeNote, current.notes, ajarNote].filter(Boolean).join('. ')
      const refinedChange =
        shouldRefine && pose === 'ajar' && changeText
          ? `${changeText.trim()}. Slightly ajar only (20–35°) on 1–2 shutters; keep closed façade identity; do not fully open all doors.`
          : changeText
      const requestPayload = {
        roomDataUrl: current.roomPhotoDataUrl,
        product,
        colour,
        notes,
        categoryName: category?.name ?? product.categoryId,
        widthFt: current.widthFt,
        heightFt: current.heightFt,
        depthFt: current.depthFt,
        inputKind: kind,
        visualiseMode: mode,
        refineImageUrl: shouldRefine ? current.aiImageUrl ?? undefined : undefined,
        changeRequest: shouldRefine ? refinedChange : undefined,
      }

      let result = await generateVisualise(requestPayload)
      let usedRefine = shouldRefine

      // If edit-on-current-image fails, rebuild from the room photo with the change baked in
      if (
        shouldRefine &&
        result.source === 'error' &&
        result.code !== 'SUBSCRIPTION_REQUIRED' &&
        result.code !== 'QUOTA_EXCEEDED' &&
        result.code !== 'MISSING_FAL_KEY'
      ) {
        result = await generateVisualise({
          ...requestPayload,
          notes: [drawingNote, sizeNote, current.notes, ajarNote, refinedChange]
            .filter(Boolean)
            .join('. '),
          refineImageUrl: undefined,
          changeRequest: undefined,
        })
        usedRefine = false
      }

      if (result.source === 'ai' && result.imageUrl) {
        const nextBrief: ConsultBrief = {
          ...current,
          aiImageUrl: result.imageUrl,
          // Keep the last correction so the next edit chains from this image
          lastChangeRequest: changeText || null,
        }
        setBrief(nextBrief)
        push({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: usedRefine
            ? `${result.message}\n\nUpdated your current look for ${product.name}. Say another change (e.g. “make it lighter”) to keep editing this same image — or say “start over from photo” for a fresh one.`
            : shouldRefine
              ? `${result.message}\n\nI rebuilt the look with your change for ${product.name} (slightly open / edit applied from your room photo).\n\nTell me another tweak anytime, or say “start over from photo”.`
              : `${result.message}\n\nVisualisation of ${product.name}${
                  kind === 'drawing' ? ' from your architect drawing' : ' in your room photo'
                }.\n\nIf something is off, tell me a specific change and I’ll edit this same image — I won’t regenerate from scratch unless you ask.`,
          aiImageUrl: result.imageUrl,
          products: [product],
          suggestions: [
            'Slightly open shutters',
            'Make it lighter',
            'Make it darker',
            'Remove handles',
            'WhatsApp quote',
          ],
        })
      } else {
        if (
          result.code === 'MISSING_FAL_KEY' ||
          result.code === 'SUBSCRIPTION_REQUIRED' ||
          result.code === 'QUOTA_EXCEEDED'
        ) {
          setAiConfigured(false)
          setShowKey(true)
        }
        push({
          id: crypto.randomUUID(),
          role: 'assistant',
          text: friendlyChatError(result.message, 'visualise'),
          suggestions: shouldRefine
            ? ['Slightly open shutters', 'Make it lighter', 'Start over from photo']
            : ['Try visualise again', 'Price with carcass', 'Suggest other styles'],
        })
      }
    } catch {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Something interrupted that visualise step. Try once more — or Unlock again if AI access expired.',
        suggestions: ['Slightly open shutters', 'Start over from photo', 'Price with carcass'],
      })
      setShowKey(true)
    } finally {
      setBusy(false)
    }
  }

  const send = async (text: string) => {
    const trimmed = text.trim()
    // Allow chatting while idle; only block during an active AI render
    if (!trimmed) return
    if (busy) {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'One moment — I’m still replying / rendering. Send your next message right after this finishes.',
      })
      return
    }

    // New messages should pin the thread to the latest reply
    stickToBottomRef.current = true

    if (
      /^(open )?carcass assembly guide$/i.test(trimmed) ||
      /^assembly guide$/i.test(trimmed)
    ) {
      push(
        { id: crypto.randomUUID(), role: 'user', text: trimmed },
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: [
            'Opening the carcass assembly guide — BWP plywood, both-side 1 mm laminate, 2 mm edge banding, install drawing, and QR for easy assembly.',
            '',
            `Path: ${CARCASS_ASSEMBLY_PATH}`,
          ].join('\n'),
          suggestions: ['What is carcass pricing?', 'Material specs', 'Suggest styles'],
        },
      )
      setInput('')
      navigate(CARCASS_ASSEMBLY_PATH)
      return
    }

    if (/^whatsapp quote$/i.test(trimmed)) {
      const url = buildChatWhatsAppUrl(brief)
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text: trimmed,
      }
      if (!url) {
        push(userMsg, {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Select a product from our list first — then WhatsApp will include size, notes, and AI look.',
          suggestions: ['Suggest products', 'Kitchen remodel'],
        })
        setInput('')
        return
      }
      push(userMsg, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Opening WhatsApp with your chat consultation.',
        suggestions: ['Visualise my look', 'Suggest other styles'],
      })
      setInput('')
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    if (
      /^(attach room photo|i will upload a photo|i have a room photo)$/i.test(trimmed)
    ) {
      setAttachMode('photo')
      push(
        { id: crypto.randomUUID(), role: 'user', text: trimmed },
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Attach a clear room or wall photo with the paperclip — straight-on kitchen, wardrobe wall, or puja wall works best.',
          suggestions: ['Suggest products'],
        },
      )
      setInput('')
      fileRef.current?.click()
      return
    }

    if (
      /^(attach drawing|i have an architect drawing)$/i.test(trimmed)
    ) {
      setAttachMode('drawing')
      push(
        { id: crypto.randomUUID(), role: 'user', text: trimmed },
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Attach your architect drawing — floor plan, elevation, section, or dimensioned sketch. I’ll map our catalog products onto that layout when you visualise.',
          suggestions: ['Suggest products', 'Kitchen remodel'],
        },
      )
      setInput('')
      fileRef.current?.click()
      return
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    }

    // Detect visualise / refine actions with the local router first
    const turn = processConsultTurn(brief, trimmed)
    setBrief(turn.brief)
    setInput('')
    inputRef.current?.focus()

    if (turn.shouldCarcassVisualise) {
      setMessages((prev) => [...prev, userMsg, turn.reply])
      await runCarcassVisualise(turn.brief)
      return
    }

    if (turn.shouldVisualise) {
      setMessages((prev) => [...prev, userMsg, turn.reply])
      await runVisualise(
        turn.brief,
        Boolean(turn.refine),
        turn.visualiseMode || detectVisualiseMode(trimmed),
      )
      return
    }

    const nextBrief = mergeBriefFromText(turn.brief, trimmed)
    setBrief(nextBrief)
    setBusy(true)
    setMessages((prev) => [...prev, userMsg])

    // Price / carcass: always show authoritative catalog rates (free, exact).
    // Optionally polish with paid LLM without changing numbers.
    const isRateIntent =
      turn.catalogLocal &&
      (turn.catalogIntent === 'price' || turn.catalogIntent === 'carcass')
    const isMaterialsIntent =
      turn.catalogLocal &&
      (turn.catalogIntent === 'materials' || turn.catalogIntent === 'specs')

    try {
      const history = [...messages, userMsg]
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, text: m.text }))

      // Without subscription: free local catalog answers for price/materials
      if (!aiConfigured && turn.catalogLocal) {
        setMessages((prev) => [
          ...prev,
          {
            ...turn.reply,
            suggestions: [
              ...(turn.reply.suggestions ?? []),
              nextBrief.roomPhotoDataUrl && nextBrief.selectedProductId
                ? 'Visualise my look'
                : 'Attach room photo',
            ].filter(Boolean) as string[],
          },
        ])
        return
      }

      const ai = await askPriyaBadalAI({
        message: trimmed,
        brief: nextBrief,
        history,
        catalogAnswer: turn.catalogLocal ? turn.reply.text : undefined,
        allowWebSearch: Boolean(isMaterialsIntent) || !isRateIntent,
      })

      if (!aiConfigured) setAiConfigured(true)

      // For rate questions, prefer local numbers if LLM somehow drifts
      const text =
        isRateIntent && turn.reply.text
          ? `${ai.text}\n\n—\nCatalog rates (source of truth):\n${turn.reply.text}`
          : ai.text

      const products =
        ai.products.length > 0 ? ai.products : turn.reply.products

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text,
          products: products?.length ? products : undefined,
          suggestions: [
            ...(ai.suggestions ?? []),
            nextBrief.roomPhotoDataUrl && nextBrief.selectedProductId
              ? 'Visualise my look'
              : '',
          ].filter(Boolean),
        },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      const needsKey =
        /subscription|access code|QUOTA|MISSING_FAL_KEY|not connected|unavailable|Paid AI|unlock/i.test(
          msg,
        )
      if (needsKey) {
        setShowKey(true)
        setAiConfigured(false)
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: [
              turn.catalogLocal
                ? 'Here’s what our catalog says:'
                : 'I can still help from the catalog.',
              '',
              turn.reply.text,
              '',
              'For live AI chat and room looks, tap AI access above. Price and carcass answers stay free.',
            ].join('\n'),
            products: turn.reply.products,
            suggestions: [
              'Price with carcass',
              ...(turn.reply.suggestions ?? []),
            ],
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            ...turn.reply,
            text: [
              turn.reply.text,
              '',
              'Live chat is busy right now — I’ve answered from our catalog. You can send again in a moment.',
            ].join('\n'),
          },
        ])
      }
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(input)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  const onPickProduct = (product: Product) => {
    if (busy) return
    // Only clear the AI look when switching to a different product
    const sameProduct = brief.selectedProductId === product.id
    const next = {
      ...brief,
      selectedProductId: product.id,
      aiImageUrl: sameProduct ? brief.aiImageUrl : null,
      lastChangeRequest: sameProduct ? brief.lastChangeRequest : null,
    }
    setBrief(next)
    push(
      {
        id: crypto.randomUUID(),
        role: 'user',
        text: `Selected: ${product.name}`,
      },
      messageForProductSelected(product, next),
    )
  }

  const onFilePicked = async (file: File | null) => {
    if (!file || busy) return
    if (!file.type.startsWith('image/')) {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Please upload a JPG or PNG (room photo or drawing scan).',
      })
      return
    }
    setBusy(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      const kind: AttachMode =
        attachMode === 'drawing' || looksLikeDrawingIntent('', file.name)
          ? 'drawing'
          : 'photo'
      setPendingFile({ dataUrl, kind })
      setAttachMode(kind)
    } catch {
      push({
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Could not read that file. Try another image.',
      })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const confirmAttach = async () => {
    if (!pendingFile || busy) return
    const next: ConsultBrief = {
      ...brief,
      roomPhotoDataUrl: pendingFile.dataUrl,
      attachmentKind: pendingFile.kind,
      aiImageUrl: null,
    }
    setBrief(next)
    setPendingFile(null)
    push(
      {
        id: crypto.randomUUID(),
        role: 'user',
        text:
          pendingFile.kind === 'drawing'
            ? 'Uploaded an architect drawing'
            : 'Uploaded a room photo',
        imageUrl: pendingFile.dataUrl,
        imageKind: pendingFile.kind,
      },
      messageForPhotoAttached(next),
    )
  }

  const whatsapp = buildChatWhatsAppUrl(brief)
  const selected = brief.selectedProductId
    ? getProductById(brief.selectedProductId)
    : undefined
  const latestSuggestions =
    [...messages].reverse().find((m) => m.role === 'assistant' && m.suggestions?.length)
      ?.suggestions ?? []
  const showWelcomeHero = messages.length <= 1 && !busy

  return (
    <main className="pbai">
      <header className="pbai__top">
        <div className="pbai__brand">
          <Link className="pbai__back" to="/" aria-label="Back to home">
            ←
          </Link>
          <img
            src="/brand/priyabadal-homes-logo.svg"
            alt=""
            className="pbai__logo"
          />
          <div className="pbai__brand-text">
            <p className="pbai__title">Chat</p>
            <p className="pbai__subtitle">
              Price · carcass · materials · visualise
            </p>
          </div>
        </div>
        <div className="pbai__top-actions">
          <span
            className={`pbai__status ${aiConfigured ? 'is-live' : ''}`}
            title={aiConfigured ? 'Paid AI on' : 'AI subscription'}
          >
            {aiConfigured ? 'AI on' : 'AI'}
          </span>
          <button
            type="button"
            className="pbai__ghost"
            onClick={() => setShowKey((v) => !v)}
          >
            {showKey ? 'Close' : 'Unlock'}
          </button>
        </div>
      </header>

      {showKey ? (
        <div
          className="pbai__sheet"
          role="dialog"
          aria-modal="true"
          aria-label="AI unlock"
        >
          <button
            type="button"
            className="pbai__sheet-backdrop"
            aria-label="Close AI unlock"
            onClick={() => setShowKey(false)}
          />
          <div className="pbai__sheet-card">
            <AiAccessBanner
              compact
              onStatus={(s) => {
                const ready = Boolean(
                  s.falConfigured && (!s.requireSubscription || s.subscribed),
                )
                setAiConfigured(ready)
                if (ready) {
                  unlockNagRef.current = false
                  setShowKey(false)
                }
              }}
            />
          </div>
        </div>
      ) : null}

      {!showKey ? (
        <div className="pbai__brief-bar" aria-label="Session brief">
          <span>{brief.room ?? 'Space?'}</span>
          <span>
            {brief.widthFt != null && brief.heightFt != null
              ? `${brief.widthFt}×${brief.heightFt}${brief.depthFt != null ? `×${brief.depthFt}` : ''} ft`
              : 'Size?'}
          </span>
          <span>{selected?.name ?? 'Product?'}</span>
          <span>
            {brief.roomPhotoDataUrl
              ? brief.attachmentKind === 'drawing'
                ? 'Drawing'
                : 'Photo'
              : 'Attach?'}
          </span>
          <span>{brief.aiImageUrl ? 'AI ready' : 'No AI yet'}</span>
        </div>
      ) : null}

      <div
        className="pbai__scroll"
        ref={scrollRef}
        role="log"
        aria-live="polite"
        onScroll={onThreadScroll}
      >
        <div className="pbai__thread">
          {showWelcomeHero ? (
            <div className="pbai__hero">
              <img
                src="/brand/priyabadal-homes-logo.svg"
                alt="Priyabadal Homes"
                className="pbai__hero-logo"
              />
              <h1>Chat with Priyabadal</h1>
              <p>
                Ask for wardrobe or kitchen options — tap a photo card to select, then
                continue with price, carcass, or visualisation.
              </p>
            </div>
          ) : null}

          {messages.map((msg) => {
            const productCards = msg.products ?? []
            const displayText = cleanChatProductText(
              msg.text,
              productCards.length > 0,
            )
            const multiPick = productCards.length > 1
            return (
            <article key={msg.id} className={`pbai-msg pbai-msg--${msg.role}`}>
              {msg.role === 'assistant' ? (
                <div className="pbai-msg__avatar" aria-hidden="true">
                  PB
                </div>
              ) : null}
              <div
                className={`pbai-msg__body${
                  productCards.length ? ' pbai-msg__body--picker' : ''
                }`}
              >
                {msg.role === 'assistant' ? (
                  <p className="pbai-msg__label">Priyabadal Chat</p>
                ) : null}
                <div className="pbai-msg__bubble">
                  {displayText ? (
                    <p className="pbai-msg__text">{displayText}</p>
                  ) : null}
                  {msg.imageUrl ? (
                    <figure className="pbai-msg__media">
                      <img
                        src={msg.imageUrl}
                        alt={
                          msg.imageKind === 'drawing'
                            ? 'Architect drawing'
                            : 'Room photo'
                        }
                      />
                      <figcaption>
                        {msg.imageKind === 'drawing'
                          ? 'Architect drawing'
                          : 'Room photo'}
                      </figcaption>
                    </figure>
                  ) : null}
                  {msg.aiImageUrl ? (
                    <figure className="pbai-msg__media pbai-msg__media--ai">
                      <img src={msg.aiImageUrl} alt="AI visualisation" />
                      <figcaption>AI visualisation · our product</figcaption>
                      <div className="pbai-msg__links">
                        <a href={msg.aiImageUrl} target="_blank" rel="noopener noreferrer">
                          Open
                        </a>
                        <a href={msg.aiImageUrl} download="priya-badal-ai.jpg">
                          Download
                        </a>
                      </div>
                    </figure>
                  ) : null}
                </div>

                {productCards.length > 0 ? (
                  <div
                    className={`pbai-picker${multiPick ? '' : ' pbai-picker--single'}`}
                  >
                    <div className="pbai-picker__head">
                      <span>{multiPick ? 'Choose a style' : 'Selected style'}</span>
                      {multiPick ? (
                        <span className="pbai-picker__count">
                          {productCards.length} options · swipe
                        </span>
                      ) : null}
                    </div>
                    <div
                      className="pbai-picker__scroller"
                      role="list"
                      aria-label={multiPick ? 'Style options' : 'Selected style'}
                    >
                      {productCards.map((product) => {
                        const on = brief.selectedProductId === product.id
                        const unit =
                          product.pricingMode === 'per-sqft' ? '/sq ft' : ''
                        return (
                          <div
                            key={product.id}
                            className={`pbai-pick${on ? ' is-on' : ''}`}
                            role="listitem"
                          >
                            <button
                              type="button"
                              className="pbai-pick__hit"
                              disabled={busy}
                              onClick={() => onPickProduct(product)}
                              aria-pressed={on}
                              aria-label={
                                on
                                  ? `${product.name} selected`
                                  : `Select ${product.name}`
                              }
                            >
                              <span className="pbai-pick__media">
                                <img src={product.image} alt="" loading="lazy" />
                                {on ? (
                                  <span className="pbai-pick__badge">Selected</span>
                                ) : (
                                  <span className="pbai-pick__badge pbai-pick__badge--ghost">
                                    Tap to select
                                  </span>
                                )}
                              </span>
                              <span className="pbai-pick__meta">
                                <strong>{product.name}</strong>
                                <em>
                                  Shutter {formatPrice(product.price)}
                                  {unit}
                                  {productHasCarcass(product) &&
                                  product.carcassPrice != null
                                    ? ` · Carcass ${formatPrice(product.carcassPrice)}${unit}`
                                    : ''}
                                </em>
                              </span>
                            </button>
                            <div className="pbai-pick__foot">
                              <button
                                type="button"
                                className={`pbai-pick__cta${on ? ' is-on' : ''}`}
                                disabled={busy}
                                onClick={() => onPickProduct(product)}
                              >
                                {on ? 'Selected for chat' : 'Select for chat'}
                              </button>
                              <Link
                                className="pbai-pick__link"
                                to={`/product/${product.id}`}
                              >
                                Details
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {multiPick ? (
                      <p className="pbai-picker__hint">
                        Tap a card to lock it for the next chat step
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
            )
          })}

          {busy ? (
            <article className="pbai-msg pbai-msg--assistant">
              <div className="pbai-msg__avatar" aria-hidden="true">
                PB
              </div>
              <div className="pbai-msg__body">
                <p className="pbai-msg__label">Priyabadal Chat</p>
                <div className="pbai-msg__bubble pbai-msg__bubble--typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </article>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>

      <footer className="pbai__composer-wrap">
        {!showKey && latestSuggestions.length > 0 ? (
          <div className="pbai__chips">
            {latestSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="pbai-chip"
                onClick={() => void send(s)}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {pendingFile ? (
          <div className="pbai__pending">
            <img src={pendingFile.dataUrl} alt="" />
            <div>
              <p>
                Ready to send as{' '}
                <strong>
                  {pendingFile.kind === 'drawing' ? 'architect drawing' : 'room photo'}
                </strong>
              </p>
              <div className="pbai__pending-actions">
                <button
                  type="button"
                  className={pendingFile.kind === 'photo' ? 'is-on' : ''}
                  onClick={() =>
                    setPendingFile((p) => (p ? { ...p, kind: 'photo' } : p))
                  }
                >
                  Photo
                </button>
                <button
                  type="button"
                  className={pendingFile.kind === 'drawing' ? 'is-on' : ''}
                  onClick={() =>
                    setPendingFile((p) => (p ? { ...p, kind: 'drawing' } : p))
                  }
                >
                  Drawing
                </button>
                <button type="button" className="btn btn--dark" onClick={() => void confirmAttach()}>
                  Add to chat
                </button>
                <button type="button" className="pbai__ghost" onClick={() => setPendingFile(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <form className="pbai__composer" onSubmit={onSubmit}>
          <div className="pbai__composer-box">
            <textarea
              ref={inputRef}
              id="chat-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask price, carcass visualise, materials…"
            />
            <div className="pbai__composer-tools">
              <div className="pbai__attach-group" role="group" aria-label="Attach">
                <button
                  type="button"
                  className={attachMode === 'photo' ? 'is-on' : ''}
                  title="Room photo"
                  onClick={() => {
                    setAttachMode('photo')
                    fileRef.current?.click()
                  }}
                >
                  Photo
                </button>
                <button
                  type="button"
                  className={attachMode === 'drawing' ? 'is-on' : ''}
                  title="Architect drawing"
                  onClick={() => {
                    setAttachMode('drawing')
                    fileRef.current?.click()
                  }}
                >
                  Drawing
                </button>
              </div>
              <button
                type="button"
                className="pbai__tool"
                disabled={
                  busy || !brief.selectedProductId || !brief.roomPhotoDataUrl
                }
                onClick={() => {
                  const typed = input.trim()
                  const editExisting = Boolean(brief.aiImageUrl)
                  const nextBrief: ConsultBrief = {
                    ...brief,
                    lastChangeRequest: editExisting
                      ? typed ||
                        brief.lastChangeRequest ||
                        'Keep this same visualisation — polish lighting and realism only; do not change the product or room.'
                      : brief.lastChangeRequest,
                  }
                  if (editExisting) setBrief(nextBrief)
                  if (typed) setInput('')
                  void runVisualise(
                    nextBrief,
                    editExisting,
                    detectVisualiseMode(typed || 'replace existing'),
                  )
                }}
              >
                {brief.aiImageUrl ? 'Apply change' : 'Visualise'}
              </button>
              {whatsapp ? (
                <a
                  className="pbai__tool pbai__tool--wa"
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              ) : null}
              <button
                className="pbai__send"
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
              >
                Send
              </button>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => void onFilePicked(e.target.files?.[0] || null)}
          />
          <p className="pbai__hint">
            Enter to send · Shift+Enter for new line · Drawings & photos visualise with our
            product list
          </p>
        </form>
      </footer>
    </main>
  )
}
