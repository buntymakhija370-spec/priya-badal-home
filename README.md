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

Data is stored in `data/workshop.json` (gitignored) locally. On Cloudflare Pages it uses a **KV** namespace (`WORKSHOP_KV`).

## Deploy (Cloudflare Pages)

Site: **https://www.priyabadalhomes.com** (project `priya-badal-home`).

### One-time setup

1. Cloudflare dashboard → create API token with **Cloudflare Pages — Edit** + **Account — Workers KV Storage — Edit**.
2. GitHub repo → **Settings → Secrets and variables → Actions**:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Create KV and bind it:
   ```bash
   npx wrangler kv namespace create WORKSHOP_KV
   ```
   Paste the id into `wrangler.toml` under `[[kv_namespaces]]`, **or** bind `WORKSHOP_KV` in Pages → Settings → Functions → KV namespace bindings.
4. Push to `main` (or this workshop branch) / run **Deploy to Cloudflare Pages** workflow.

### Manual deploy (if you have wrangler auth)

```bash
npm run deploy
```

Workshop API routes live under `/api/workshop/*` via Cloudflare Pages Functions (`functions/api/workshop/`).

## Build

```bash
npm run build
npm run preview
```
