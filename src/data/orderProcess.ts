export type OrderStep = {
  id: string
  title: string
  summary: string
  detail: string
}

export const ORDER_STEPS: OrderStep[] = [
  {
    id: 'choose',
    title: 'Choose your piece',
    summary: 'Browse categories and pick the look you like.',
    detail:
      'Explore wardrobes, kitchens, wall panels, doors, handles, temples, sculpted furniture, or silai bunai. Open a product to see finishes, sizes, and details.',
  },
  {
    id: 'customise',
    title: 'Customise size & finish',
    summary: 'Set width, height, thickness, and finish for your space.',
    detail:
      'Use the customise sheet to set size in feet, choose finish and thickness, and see an estimated price before you enquire.',
  },
  {
    id: 'quote',
    title: 'Request a WhatsApp quote',
    summary: 'Send your selection — we confirm the final price.',
    detail:
      'Add items to cart and tap WhatsApp quote, or message us from any product. Share room photos or Visualise AI looks so we can refine the estimate.',
  },
  {
    id: 'measure',
    title: 'Measure & confirm',
    summary: 'We verify site measurements before production.',
    detail:
      'Once you approve the quote, we schedule measurement / site check where needed. Final dimensions and material choices are locked before making.',
  },
  {
    id: 'make',
    title: 'Made to your order',
    summary: 'Your piece is crafted for your home — not stock.',
    detail:
      'Shutters and carcasses are made to the confirmed size. Carcass standard: BWP plywood, both-side 1 mm laminate, 2 mm edge banding. Timeline is shared on WhatsApp after confirmation.',
  },
  {
    id: 'install',
    title: 'Delivery',
    summary: 'We coordinate delivery to your city.',
    detail:
      'We arrange delivery after production. Confirm your city / pin code on WhatsApp so we can plan shipping and share timelines.',
  },
]

export const ORDER_NOTES = [
  {
    title: 'Transparent estimates',
    body: 'Catalog prices are estimates from your size and finish. Final quote is confirmed on WhatsApp after review.',
  },
  {
    title: 'What to keep ready',
    body: 'Room photos, approximate width × height in feet, preferred finish colour, and your city / pin code for delivery planning.',
  },
  {
    title: 'Made in India',
    body: 'Priyabadal Homes builds made-to-measure interiors for Indian homes — shutters, doors, wall panels, wardrobes, kitchens, and more.',
  },
  {
    title: 'Carcass construction',
    body: 'BWP plywood · both-side 1 mm laminate · 2 mm edge banding. Install drawing shared on WhatsApp with your order.',
  },
  {
    title: '10-year warranty',
    body: "Every product includes a 10 Years' warranty on manufacturing defects.",
  },
]
