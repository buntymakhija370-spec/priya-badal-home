/** How wardrobe/kitchen shutters should appear in a room visualisation */

export type ShutterPose = 'closed' | 'ajar' | 'open-carcass'

/**
 * Detect shutter pose from customer notes / change requests.
 * Default “open the doors a bit” → showroom ajar (not full open carcass).
 */
export function detectShutterPose(...texts: Array<string | undefined | null>): ShutterPose {
  const t = texts
    .filter((x): x is string => Boolean(x && x.trim()))
    .join(' ')
    .toLowerCase()
  if (!t) return 'closed'

  if (
    /\b(open[- ]?carcass|fully open|all doors? open|doors? removed|no shutters?|without (the )?shutters?|doors? off|complete open)\b/i.test(
      t,
    )
  ) {
    return 'open-carcass'
  }

  if (
    /\b(slightly open|soft open|ajar|half[- ]?open|partly open|partially open|little open|bit open|a bit open|doors? (a )?bit|peek (inside|in)|show (the )?inside|glimpse (of )?(the )?inside|open (one|a|1) (door|shutter)|one (door|shutter) open|two doors? (slightly )?open|showroom open|catalogue open|catalog open)\b/i.test(
      t,
    )
  ) {
    return 'ajar'
  }

  // Bare “open shutter(s)/door(s)” without “fully” → ajar showroom style
  if (
    /\bopen (the )?(shutter|shutters|door|doors)\b/i.test(t) &&
    !/\b(fully|wide|completely)\b/i.test(t)
  ) {
    return 'ajar'
  }

  return 'closed'
}

/** Precise prompt block so ajar does not collapse into closed or full carcass */
export function shutterPosePromptBlock(
  pose: ShutterPose,
  categoryName: string,
): string {
  const space = categoryName.toLowerCase()
  const isWardrobe = space.includes('wardrobe') || space.includes('almirah')
  const unit = isWardrobe ? 'wardrobe' : space.includes('kitchen') ? 'kitchen cabinet' : 'unit'

  if (pose === 'ajar') {
    return [
      `SHUTTER POSE — SLIGHTLY OPEN (mandatory showroom style for this ${unit}):`,
      'Keep the overall unit alignment, width, height, colour, panel grooves, handles, and façade design identical to the CLOSED catalog reference.',
      'Open ONLY 1 shutter (or at most 2 on a wide wall unit) ajar about 20–35 degrees — a soft showroom peek.',
      'Do NOT fully open all doors, do NOT remove shutters, and do NOT convert the whole unit into an open-carcass elevation.',
      'Door leaves must stay hinged with believable thickness and matching edge laminate; no warped geometry, floating doors, or duplicated handles.',
      'Through the small ajar gap, show only a neat glimpse of interior (shelves or hanging rod) — tidy, dark-recessed, realistic.',
      'Most shutters remain fully closed and flush. Camera, room, and product scale stay unchanged.',
    ].join(' ')
  }

  if (pose === 'open-carcass') {
    return [
      `SHUTTER POSE — OPEN CARCASS: Show the ${unit} interior with shutters open or omitted so the carcass layout is readable.`,
      'Keep overall size, materials, and room camera consistent. Neat shelves/hanging/drawers; not a messy exploded view.',
    ].join(' ')
  }

  return [
    `SHUTTER POSE — CLOSED: Keep all ${unit} shutters fully closed and flush, matching the closed catalog façade reference.`,
    'Do not leave doors ajar unless the customer explicitly asks.',
  ].join(' ')
}
