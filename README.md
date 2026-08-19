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

### Professional Visualise AI (Google Gemini)

1. Get a key at https://aistudio.google.com/apikey  
2. Either:
   - Paste it in **/ai-admin** (owner PIN), or
   - Put `GEMINI_API_KEY=...` in `.env` and restart `npm run dev` / `npm run preview`
3. Generate uses **your product photo + room photo** (Gemini 2.5 Flash Image — cheap Nano Banana)

Customers unlock with a paid access code; they never see your Gemini key.

## Build

```bash
npm run build
npm run preview
```
