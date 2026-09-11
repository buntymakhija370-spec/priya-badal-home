# Priya Badal Home

Interior products website with categories, prices, photo uploads, and an AI room guide.

## Features

- **Shop** — categories & subcategories with product photos and INR prices
- **Product pages** — details, price, related pieces
- **AI Interior Guide** — chat board that suggests products for a room/style/budget
- **Visualise AI** — upload a room photo, pick a Priyabadal Homes product + colour, generate a product-referenced preview
- **Add Product** — upload a photograph (or paste image URL), set category, subcategory, and price
- **Workshop worker app** (`/workers`) — Android-installable PWA for floor staff: managers assign designing → cutting → pasting → colouring → finishing → QC → dispatch; workers post live status; full accountability trail when orders close

## Workshop floor app (workers)

Open **`/workers`** on phones (Chrome → Add to Home screen for an Android app icon).

1. Run the site with the API (`npm run dev` or `npm run preview`) on a workshop PC so all phones share live state.
2. **Manager** signs in with PIN `2468` (override with `WORKSHOP_MANAGER_PIN`).
3. Post an order, assign each stage to a worker (roster W01–W60).
4. **Workers** sign in with code + PIN (manager board → Show login PINs).
5. Workers start work, post what they are doing, mark stage complete — manager live board updates every few seconds.

Data is stored in `data/workshop.json` (gitignored).

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
