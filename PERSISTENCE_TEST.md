# Persistence redeploy test

Trigger commit: 2026-06-06

Use this deploy to verify data survives on Railway:

1. Add a guest named `PERSIST TEST` before this deploy finishes.
2. After deploy, confirm that guest still exists.
3. Check `/api/health` — `dbPath` should remain `/data/db.json`.
