# Frontend — Context for Person 3's AI Agent
> React + Vite PWA. Read root `CLAUDE.md` for API contracts before building pages.

## Setup
```bash
cd frontend
npm install          # installs gsap, lenis, swiper + existing deps
cp .env.example .env # set VITE_API_URL=http://localhost:8000
npm run dev          # http://localhost:5173
```

## Stack
- **React 18** + **React Router v6** (layout routes)
- **Vite 5** + `vite-plugin-pwa`
- **Tailwind CSS** via CDN + **Inter** font via Google Fonts (both in `index.html`)
- **Axios** for API calls
- **GSAP 3** + **ScrollTrigger** — all scroll-based and entrance animations
- **Lenis** — smooth scroll (replaces native scroll; drives GSAP ScrollTrigger)
- **Swiper 11** — features carousel on landing page

## Routing Architecture
| Route | Component | Layout |
|-------|-----------|--------|
| `/` | `Landing.jsx` | None — full-screen marketing page with own nav |
| `/grade` | `Grade.jsx` | `AppLayout` — sticky header + 4-tab bottom nav |
| `/negotiate` | `Negotiate.jsx` | `AppLayout` |
| `/market` | `Market.jsx` | `AppLayout` |
| `/grow` | `CropJourney.jsx` | `AppLayout` |

`AppLayout` is defined inside `App.jsx` and uses React Router `<Outlet />`.
The 4-tab bottom nav has: Grade · Negotiate · Prices · Grow (logo links back to `/`).

## Pages & Status
| File | Status | Notes |
|------|--------|-------|
| `App.jsx` | Done | Layout route pattern, `AppLayout` + `Landing` routing |
| `pages/Landing.jsx` | Done | Full marketing landing page — see animation section below |
| `pages/Grade.jsx` | Done | Photo upload → `/grade/crop` → Agmark grade result |
| `pages/Negotiate.jsx` | Done | Setup form → chat UI → `/negotiate/start` + `/negotiate/respond` |
| `pages/Market.jsx` | Done | Crop+state dropdowns → `/market/price` → modal price + BATNA |
| `pages/CropJourney.jsx` | Done | Full beejai-to-bikri journey: AI questions → recommendation → task calendar → weather/subsidies/photo-check → PDF report |

## Design System
Single-colour professional UI. **No emojis in functional UI — inline SVG only.**

### Colour Palette
| Role | Tailwind | Hex |
|------|----------|-----|
| Primary action / active | `green-700` | #15803d |
| Primary tint | `green-50` | #f0fdf4 |
| Page background | `gray-50` | #f9fafb |
| Card | `white` + `border-gray-100` | — |
| Heading | `gray-900` | #111827 |
| Body | `gray-500`–`gray-600` | — |
| Muted | `gray-400` | #9ca3af |
| Dark section | `gray-900` / `gray-950` | #111827 / #0a0a0a |

### Typography
Font: **Inter** (weights 400–900). Configured in Tailwind config in `index.html`.

### Component Patterns
```
Card:    bg-white border border-gray-100 rounded-xl shadow-sm p-4/5
Input:   border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none
Button:  bg-green-700 hover:bg-green-800 active:scale-95 text-white py-2.5 rounded-lg text-sm font-medium transition-all
Error:   flex gap-2 bg-red-50 border border-red-100 text-red-600 rounded-lg p-3
```

## Animation Architecture (Landing.jsx)

### Libraries
- **Lenis** — smooth scrolling. Instantiated in `useEffect`, drives GSAP ticker.
- **GSAP + ScrollTrigger** — all animations. ScrollTrigger is synced to Lenis scroll events.
- **Swiper** — features carousel with autoplay, loop, pagination.

### Animation Classes (used as GSAP selectors)
| Class | Animation |
|-------|-----------|
| `.ld-nav` | Slides down on load; gets shadow on scroll via ScrollTrigger |
| `.ld-badge` | Fades + slides up on hero load |
| `.ld-word` | Hero headline words stagger in (0.055s each) |
| `.ld-sub` | Fades + slides up after headline |
| `.ld-cta` | Stagger fade-in |
| `.ld-card-a/b/c` | Hero product cards animate in with scale |
| `[data-count]` | Counter animates from 0 → value on scroll-enter |
| `.ld-reveal` | Generic fade + slide-up on scroll |
| `.ld-stagger` | Children stagger in on scroll |
| `.ld-step` | Alternating left/right slide-in |
| `.ld-cta-section` | Scale + fade on scroll |

### Lenis + GSAP Integration Pattern
```js
const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
const rafFn = (time) => lenis.raf(time * 1000)
gsap.ticker.add(rafFn)
gsap.ticker.lagSmoothing(0)
lenis.on('scroll', ScrollTrigger.update)
// cleanup: lenis.destroy() + gsap.ticker.remove(rafFn) + ScrollTrigger.getAll().forEach(st => st.kill())
```

## Landing Page Sections
1. **Sticky Nav** — logo + internal scroll links + "Open App" CTA
2. **Hero** — animated headline (word stagger), subtext, 2 CTAs, 3 floating product mock cards
3. **Stats** — dark `gray-900` bar, 4 animated counters
4. **Problem** — pain points grid with X icons, alternating layout
5. **How It Works** — 3 steps with alternating slide-in, "Try it" links to app
6. **Features Swiper** — 6 cards, bleeds right, autoplay 3.8s, green pagination dots
7. **Technology** — 6 tech stack cards
8. **CTA** — green card with ambient rings, two CTAs
9. **Footer** — dark `gray-950`, logo, links, attribution

## API Base URL
`const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'`

## Person 3 Progress
| Task | Status |
|------|--------|
| `pages/Market.jsx` — Best Mandi Finder (ranked cards, net value, supply bars, BATNA advisory) | ✅ Done |
| Professional UI redesign — all app pages | ✅ Done |
| Inter font + Tailwind config | ✅ Done |
| SVG icon nav with active states | ✅ Done |
| `pages/Landing.jsx` — full marketing landing page | ✅ Done |
| GSAP + Lenis + Swiper animation stack | ✅ Done |
| Layout route architecture (`AppLayout` + `Outlet`) | ✅ Done |
| Voice input UI (Bhashini integration) | ✅ Done (Web Speech API — mic STT + TTS in Negotiate.jsx) |
| Grade → Negotiate flow (pre-fill from Grade page) | ✅ Done (localStorage handoff + grade banner) |
| Multi-crop parallel negotiation (tabs, LangGraph sessions) | ✅ Done (up to 5 crops, independent sessions) |
| Auto-detect crop from image (no manual selection) | ✅ Done (crop_type="auto" → Gemini identifies) |
| Hinglish AI dialogue + Hindi TTS/STT | ✅ Done (hi-IN voice, Hinglish Gemma prompt) |
| Accept button, analytics strip, summary table | ✅ Done |
| Mandi comparison — `/market/mandis` endpoint, net value ranking | ✅ Done |
| `pages/CropJourney.jsx` — Fasal Journey (beejai→bikri) with AI calendar, weather, subsidies, photo check, PDF report | ✅ Done |
| 4th nav tab "Grow" (IconSprout) → `/grow` | ✅ Done |
| FPO batch mode UI | 📋 Future |

## Known Issues (Code Review — pending fix)
Found by `/simplify` review. Fix before shipping:

| Issue | File | Severity | Fix |
|-------|------|----------|-----|
| `gsap.ticker.lagSmoothing(0)` not reset in cleanup | `Landing.jsx` useEffect | HIGH | Add `gsap.ticker.lagSmoothing(60, 1000)` to cleanup return |
| `heroTl` timeline not killed in cleanup | `Landing.jsx` useEffect | MEDIUM | Add `heroTl.kill()` to cleanup return |
| `Navigation` imported but unused | `Landing.jsx` line 7 | LOW | Remove from import + `modules` array |
| Icon path splitting hack (`split(' M')`) | `Landing.jsx` FEATURES data | MEDIUM | Change `icon` strings to `paths: string[]` arrays |
| Dead `prefix: ''` field on all STATS entries | `Landing.jsx` STATS const | LOW | Remove `prefix` field and `{s.prefix}` render |
| `AlertIcon` defined identically in 3 files | Grade/Negotiate/Market.jsx | MEDIUM | Extract to `src/components/ui.jsx` |
| `ErrorAlert` block copy-pasted in 3 files | Grade/Negotiate/Market.jsx | MEDIUM | Extract to `src/components/ui.jsx` |
| `LeafIcon` defined in Landing, inlined in App | Landing.jsx + App.jsx | LOW | Extract to `src/components/ui.jsx` |
| Input className string repeated 6×  | Grade/Negotiate/Market.jsx | LOW | Export `INPUT_CLS` const from `src/components/ui.jsx` |

## PWA
`public/manifest.json` is set up. Drop `icon-192.png` + `icon-512.png` into `public/` for full PWA install.
