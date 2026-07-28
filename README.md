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

### Professional Visualise AI (Fal)

1. Get a key at https://fal.ai/dashboard/keys  
2. Either:
   - Paste it on the **/visualise** page (Connect professional AI), or
   - Put `FAL_KEY=...` in `.env` and restart `npm run dev` / `npm run preview`
3. Generate uses **your product photo + room photo** (Nano Banana Pro edit)

Cheap overlay previews are disabled — only real AI renders are shown.

## Build

```bash
npm run build
npm run preview
```
