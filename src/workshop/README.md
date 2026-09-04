# Priyabadal Workshop + Client Portal (Secure Phase B)

## What is public vs private

| Area | URL | Who |
|------|-----|-----|
| Website / shop | `/` | Everyone |
| Client tracking | `/my-orders` | Client login only |
| Workshop ops | `/workshop` | Staff PIN only (not in public menu) |

## Security (Phase B — done in this branch)

1. **Workshop removed from public menu** — staff open `/workshop` directly  
2. **Staff login is server-checked** — PIN never compared only in the browser  
3. **Client login returns a session token** — PIN is not stored in the browser after login  
4. **PINs are salted + hashed** in the private data file (SHA-256)  
5. **Client API returns only that client’s orders**  
6. **Staff API requires Bearer token** — anonymous `GET /api/workshop` is blocked  
7. **Runtime DB file is gitignored** (`data/workshop-db.json`) — not published in git  

## Demo logins (preview only)

- Client: `/my-orders` → `DEMO01` / `1234`  
- Staff: `/workshop` → PIN `2468` (change with env `WORKSHOP_STAFF_PIN` before real go-live)

## Next (cloud lock)

1. Add `CLOUDFLARE_API_TOKEN`  
2. Create private Cloudflare D1 database  
3. Move orders from local file → D1  
4. Deploy Pages Functions for `/api/workshop/*`  
5. Change staff + client PINs  

Until D1 is connected, this secure preview runs on the private Vite server (not a public static dump of orders).
