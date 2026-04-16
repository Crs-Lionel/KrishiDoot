# Frontend — Context for Person 3's AI Agent
> React + Vite PWA. Read root `CLAUDE.md` for API contracts before building pages.

## Setup
```bash
cd frontend
npm install
cp .env.example .env    # set VITE_API_URL=http://localhost:8000
npm run dev             # runs on http://localhost:5173
```

## Stack
- **React 18** + **React Router v6**
- **Vite 5** + `vite-plugin-pwa` (PWA = installable on Android, no App Store needed)
- **Tailwind CSS** via CDN (already in `index.html`, just use classes)
- **Axios** for API calls — use `import.meta.env.VITE_API_URL` as base URL

## Pages & Status
| File | Status | Notes |
|------|--------|-------|
| `App.jsx` | Done | Router + header + bottom nav (4 tabs) |
| `pages/Home.jsx` | Done | Landing, consent banner, nav cards |
| `pages/Grade.jsx` | Done | Photo upload → `/grade/crop` → show Agmark grade |
| `pages/Negotiate.jsx` | Done | Form → `/negotiate/start` → chat UI → `/negotiate/respond` |
| `pages/Market.jsx` | Stub | Build market price lookup UI → `GET /market/price?crop=&state=` |

## PWA (Android Install)
`public/manifest.json` is already set up. `vite-plugin-pwa` handles service worker.
On Android Chrome, users will see "Add to Home Screen" automatically.
To test: open on phone via local IP (`ipconfig` → use 192.168.x.x:5173).

## API Base URL
Always use: `const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'`

## What Person 3 Should Build / Enhance
1. **`pages/Market.jsx`** — UI to search APMC prices by crop + state (hits `GET /market/price`)
2. Improve styling, add animations, polish mobile UX
3. Add voice input UI (Bhashini integration — future enhancement)
4. Add FPO batch mode UI (future — bulk farmer negotiation)

## Icons
Drop `icon-192.png` and `icon-512.png` into `public/` for PWA icons (use any green leaf/wheat image for demo).
