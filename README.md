# Priya Badal Home

Interior products website with categories, prices, photo uploads, and an AI room guide.

## Features

- **Shop** — categories & subcategories with product photos and INR prices
- **Product pages** — details, price, related pieces
- **AI Interior Guide** — chat board that suggests products for a room/style/budget
- **Visualise AI** — upload a room photo, pick a Priyabadal Homes product + colour, generate a product-referenced preview
- **Add Product** — upload a photograph (or paste image URL), set category, subcategory, and price

## Develop

```bash
npm install
npm run dev
```

### Paid Visualise AI (Fal)

1. Copy `.env.example` → `.env`
2. Add your Fal key: `FAL_KEY=...` (from https://fal.ai/dashboard/keys)
3. Restart `npm run dev` or `npm run preview`

Without a key, Visualise still works in **product-matched preview** mode and can send the request to WhatsApp.

## Build

```bash
npm run build
npm run preview
```
