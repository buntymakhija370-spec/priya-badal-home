# Priya Badal Home

Interior products website with categories, prices, photo uploads, and an AI room guide.

## Features

- **Shop** — categories & subcategories with product photos and INR prices
- **Product pages** — details, price, related pieces
- **AI Interior Guide** — chat board that suggests products for a room/style/budget
- **Visualise AI** — upload a room photo, pick a Priyabadal Homes product + colour, generate a product-referenced preview
- **Add Product** — upload a photograph (or paste image URL), set category, subcategory, and price

## Floor ops (separate host)

Floor staff app is **not** on the public website. It is deployed to its own Cloudflare Pages project:

**https://kestrel-ops-desk.pages.dev/workers**

1. Open that URL on phones (Chrome → Add to Home screen).
2. Manager / worker sign in with their own passwords (never shown in the UI).
3. Post orders, assign stages, scan barcodes, track machinery.

Locally: `npm run dev` then open `/workers`. Data: `data/workshop.json` (gitignored). On Cloudflare: KV `WORKSHOP_KV`.

```bash
npm run deploy:ops    # floor app → kestrel-ops-desk
npm run deploy:site   # public site → priya-badal-home (blocks /workers)
```

## Deploy (public website)

Site: **https://www.priyabadalhomes.com** (project `priya-badal-home`).

### One-time setup

1. Cloudflare dashboard → create API token with **Cloudflare Pages — Edit** + **Account — Workers KV Storage — Edit**.
2. GitHub repo → **Settings → Secrets and variables → Actions**:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Floor KV is bound on project `kestrel-ops-desk` (see `wrangler.ops.toml`).
4. Push to `main` / run **Deploy to Cloudflare Pages** workflow, or `npm run deploy:site`.

Floor API routes: `/api/workshop/*` via Pages Functions (`functions/api/workshop/`).

## Build

```bash
npm run build
npm run preview
```
