# Tim & Cyn Wedding Hub

A private full-stack wedding planning hub for Tim and Cyn. React + Vite frontend, Express backend, JSON file database.

**Wedding date:** Saturday 10 October 2026  
**Total budget:** $70,000

## Local Development

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173 (proxied to API)
- Backend: http://localhost:3001

### PIN Authentication

Create a `.env` file in the project root:

```
WEDDING_PIN=your-pin-here
```

Default PIN is `1234` if `WEDDING_PIN` is not set.

## Production Build

```bash
npm run build
npm start
```

Express serves the built frontend from `dist/` and the API from `/api/*`.

## Deploy to Railway

1. Push this repo to GitHub and connect it in [Railway](https://railway.app)
2. Set environment variables in the Railway dashboard:
   - `WEDDING_PIN` — your 4-digit PIN
   - `NODE_ENV=production`
   - Do **not** set `PORT` — Railway injects it automatically
3. **Mount a Railway Volume** (required for data to survive redeploys):
   - In Railway → your service → **Volumes** → Add Volume
   - Mount path: `/data`
   - Add variable: `DB_DATA_DIR=/data`
   - Without this, every deploy wipes your guest list, checklist, and budget
4. Railway reads `railway.toml` for build/start commands and health checks

Health check endpoint: `GET /api/health` — check `db.persistent: true` and `db.dbPath: "/data/db.json"` to confirm the volume is active.

### Data recovery

If data was lost after a deploy, open the site in the **same browser** you used before — it will automatically restore guests and checklist from browser cache if it detects a fresh seed on the server. For permanent protection, set up the volume above.

## Project Structure

- `server/` — Express API, JSON database, seed data
- `src/` — React frontend pages and components
- `public/banner-photos/` — uploaded engagement banner images

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with banner, countdown, summary metrics |
| `/budget` | Full budget tracker with categories and inline editing |
| `/vendors` | Vendor contact and contract management |
| `/checklist` | 91-task checklist with table and timeline views |
| `/guests` | 157-guest RSVP tracker with CSV export |
| `/documents` | Link tracker for contracts and inspiration |
| `/timeline` | Wedding day run sheet |
