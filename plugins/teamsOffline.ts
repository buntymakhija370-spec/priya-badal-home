/** Offline Business Teams drafts when Gemini/Fal is not connected. */

export type OfflineTeamId = 'sales' | 'whatsapp' | 'instagram'

function pickCatalogLines(knowledge: string, limit = 8): string[] {
  return knowledge
    .split('\n')
    .map((l) => l.trim())
    .filter(
      (l) =>
        l.includes('₹') ||
        /G-Series|wall panel|wardrobe|kitchen|carcass|sq ?ft/i.test(l),
    )
    .slice(0, limit)
}

export function offlineTeamReply(opts: {
  teamId: OfflineTeamId
  message: string
  knowledge?: string
}): string {
  const lines = pickCatalogLines(opts.knowledge || '', 6)
  const catalogBlock = lines.length
    ? lines.map((l) => `• ${l}`).join('\n')
    : '• G-Series wall panels · ₹600/sq ft (economic lead)\n• Use live catalog rates from the shop for the exact SKU'

  if (opts.teamId === 'sales') {
    return [
      '1) Client read',
      `Owner brief: ${opts.message}`,
      '',
      '2) Pitch (catalog-grounded offline draft)',
      'Lead with the client need (room / size / budget), then one matching range.',
      'Economic wall panels → G-Series HDR + poly/PU, 6 mm, custom colour, ₹600/sq ft.',
      'For wardrobe/kitchen, quote shutter ₹/sq ft and carcass ₹/sq ft separately; with-carcass = both when listed.',
      '',
      'Catalog anchors:',
      catalogBlock,
      '',
      '3) Objection handling',
      'If price feels high: separate shutter vs carcass, show economic range first, offer Visualise before final WhatsApp quote.',
      '',
      '4) Next steps',
      'Confirm size in feet → tap a design card → Visualise → WhatsApp final quote (+91 81099 49649).',
      '',
      '5) Suggested say-this line',
      '“I’ll start you on our catalog rate for this range, then we lock the final quote on WhatsApp after measure and finish.”',
      '',
      '— Offline catalog draft. Connect Gemini/Fal in /ai-admin for full AI coaching.',
    ].join('\n')
  }

  if (opts.teamId === 'whatsapp') {
    return [
      '1) Intent',
      `Respond to: ${opts.message}`,
      '',
      '2) Ready-to-send WhatsApp reply:',
      'Hi, thank you for writing to Priyabadal Homes.',
      '',
      'Happy to help with a tentative catalog estimate. Please share room type, size in feet (W×H), and preferred finish if you have one.',
      '',
      'For economic wall panels we usually start with G-Series at ₹600/sq ft (6 mm, poly/PU, custom colour). For wardrobe/kitchen we quote shutter and carcass rates from the catalog separately — final quote after measure.',
      '',
      'You can also browse designs on www.priyabadalhomes.com and reply here with the product name.',
      '',
      'Warm regards,',
      'Priyabadal Homes',
      '+91 81099 49649',
      '',
      '3) Optional follow-up',
      'If no reply in 2–3 days: “Just checking in — shall I hold a tentative estimate once you share the size?”',
      '',
      '4) Internal note for the owner',
      'Confirm size, finish, shutter vs with-carcass, and whether Visualise was used.',
      '',
      'Catalog anchors:',
      catalogBlock,
      '',
      '— Offline catalog draft. Connect Gemini/Fal in /ai-admin for full AI drafts.',
    ].join('\n')
  }

  return [
    '1) Verdict / angle',
    `Reel brief: ${opts.message}`,
    'Show a real Priyabadal Homes finish up close, then reveal the room payoff + WhatsApp CTA.',
    '',
    '2) Hook (0–2s on-screen text)',
    '“Stop scrolling if your kitchen shutters look tired.”',
    '',
    '3) Shot list / script',
    '0–3s: Extreme close-up of texture / CNC / leather / panel groove.',
    '3–8s: Pull back to full shutter / panel elevation.',
    '8–14s: Before/after or Visualise-style room insert.',
    '14–20s: Price cue as tentative catalog ₹/sq ft + “WhatsApp for final quote”.',
    '',
    '4) Caption',
    'Made-to-measure interiors from Priyabadal Homes. Tentative catalog rates · final quote after measure. WhatsApp +91 81099 49649',
    '',
    '5) Hashtags',
    '#PriyabadalHomes #InteriorDesignIndia #KitchenShutters #WallPanels #WardrobeDesign #MadeToMeasure #IndoreInteriors #HomeMakeover',
    '',
    '6) CTA',
    'DM “QUOTE” or WhatsApp +91 81099 49649',
    '',
    '7) Product tie-in',
    catalogBlock,
    '',
    '— Offline catalog draft. Connect Gemini/Fal in /ai-admin for full AI reel analysis.',
  ].join('\n')
}
