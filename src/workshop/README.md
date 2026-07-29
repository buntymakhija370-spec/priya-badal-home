# Priyabadal Workshop Operations Panel

Staff manufacturing panel for Priyabadal Homes.

## Open

- URL: `/workshop`
- Demo PIN: `2468` (change before real production use)

## What it does (MVP)

1. **Orders** from Website / WhatsApp / Offline showroom / Channel partners  
2. **Production copy** + **Dispatch copy** (print / PDF from browser)  
3. **Departments** — Cutting, CNC, Carcass, Finish, Hardware, QC, Packing, Dispatch  
4. **Department reports** logged to the backend board  
5. **Channel partners** registry  
6. **Floor display** board for the workshop TV  

## Data

Orders are saved on the server in `data/workshop-db.json` via `/api/workshop/*` (Vite plugin — works in `npm run dev` and `npm run preview`).

## Next upgrades (after Aug 20)

- Real login roles (admin / partner / department)
- PostgreSQL / cloud DB
- WhatsApp Business API auto-intake
- Product catalogue CMS from this panel
- Partner portal login
