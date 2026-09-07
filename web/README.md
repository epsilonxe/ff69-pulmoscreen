# PulmoScreen — frontend

The Next.js single-page frontend of PulmoScreen, the FF69 lung-cancer
screening prototype. It
renders the typed input form and the result panel side by side, and calls the
FastAPI backend (`webapp/api/`) for predictions.

## Develop

```bash
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev                       # http://localhost:3000
```

The backend must be running on the URL in `NEXT_PUBLIC_API_URL`
(see `../README.md`).

## Build

```bash
npm run build && npm start        # production server on :3000
```

## Stack & layout

- Next.js (App Router, `src/` dir), TypeScript, Tailwind CSS v4, Thai UI font
  (`Noto Sans Thai` via `next/font`).
- `src/app/page.tsx` — the single page: sex selector, integer age field + slider,
  13 yes/no symptom chips, and a sticky result panel. No submit button — the
  prediction is recomputed automatically (debounced) on every input change.
- `src/lib/fields.ts` — field metadata, mirrors the backend's `GET /schema`.

## Notes

- `next.config.ts` sets `devIndicators: false` and `agentRules: false`.
- The result shows the binary verdict (`พบความเสี่ยง (1)` / `ไม่พบความเสี่ยง (0)`),
  the model probability as a percentage bar, and a secondary risk band.

See `../README.md` for the backend, the model checkpoint, and the report
screenshot.
