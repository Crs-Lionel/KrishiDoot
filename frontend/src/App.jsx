import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Flip from 'gsap/Flip'
import { Routes, Route, Link, useLocation, Outlet } from 'react-router-dom'
import Landing     from './pages/Landing.jsx'
import Negotiate   from './pages/Negotiate.jsx'
import Grade       from './pages/Grade.jsx'
import Market      from './pages/Market.jsx'
import CropJourney from './pages/CropJourney.jsx'
import { CropIcon, LeafIcon, PANEL_CLS } from './components/ui.jsx'

function IconCamera({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  )
}

function IconScale({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" />
    </svg>
  )
}

function IconChart({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function IconSprout({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
    </svg>
  )
}

const APP_NAV = [
  { to: '/grade',     label: 'Grade',     Icon: IconCamera },
  { to: '/negotiate', label: 'Negotiate', Icon: IconScale  },
  { to: '/market',    label: 'Prices',    Icon: IconChart  },
  { to: '/grow',      label: 'Grow',      Icon: IconSprout },
]

const ROUTE_META = {
  '/grade': {
    eyebrow: 'Inspection Desk',
    title: 'Crop quality, framed as evidence.',
    desc: 'Capture the lot, verify Agmark quality, and carry that confidence into your opening ask.',
    note: 'Sharper crop photos create stronger grade evidence and a more credible negotiation start.',
  },
  '/negotiate': {
    eyebrow: 'Deal Workspace',
    title: 'Track every offer like a live mandi desk.',
    desc: 'Parallel crop sessions, protected price floors, and a cleaner transcript of how each deal is moving.',
    note: 'The floor price stays hidden from the buyer while the AI adapts by crop and perishability.',
  },
  '/market': {
    eyebrow: 'Mandi Atlas',
    title: 'Choose the mandi that actually earns more.',
    desc: 'Rank every destination by net value after transport so distance never hides the real decision.',
    note: 'The strongest signal here is net value after freight, not the headline modal price alone.',
  },
  '/grow': {
    eyebrow: 'Season Planner',
    title: 'Turn the crop journey into a clear seasonal rhythm.',
    desc: 'Weather, weekly action, subsidy signals, and harvest readiness in one calmer planning surface.',
    note: 'Update the plan when weather shifts or crop health photos signal a change in risk.',
  },
}

gsap.registerPlugin(Flip)

function AppLayout() {
  const location  = useLocation()
  const headerRef = useRef(null)
  const navWrapRef = useRef(null)
  const navRef    = useRef(null)
  const navIndicatorRef = useRef(null)
  const navItemRefs = useRef({})
  const mainRef   = useRef(null)
  const meta = ROUTE_META[location.pathname]

  /* One-time mount: header + nav slide in */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: -44, autoAlpha: 0,
        duration: 0.58, ease: 'power3.out',
      })
      gsap.from('.kd-nav-item', {
        y: 24, autoAlpha: 0,
        duration: 0.42, ease: 'power3.out',
        stagger: { each: 0.06, from: 'start' },
        delay: 0.12,
      })
    })
    return () => ctx.revert()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* Route change: quick page-content fade-in */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(mainRef.current, {
        autoAlpha: 0, y: 14,
        duration: 0.3, ease: 'power2.out',
      })
    })
    return () => ctx.revert()
  }, [location.pathname])

  useEffect(() => {
    const nav = navRef.current
    const indicator = navIndicatorRef.current
    const activeItem = navItemRefs.current[location.pathname]
    if (!nav || !indicator || !activeItem) return

    const state = Flip.getState(indicator)
    const navRect = nav.getBoundingClientRect()
    const activeRect = activeItem.getBoundingClientRect()

    gsap.set(indicator, {
      opacity: 1,
      width: activeRect.width,
      x: activeRect.left - navRect.left,
    })

    Flip.from(state, {
      duration: 0.42,
      ease: 'power3.out',
      absolute: true,
    })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header
        ref={headerRef}
        className="sticky top-0 z-40 flex items-start gap-4 border-b border-white/10 bg-[rgba(17,14,10,0.82)] px-4 py-4 backdrop-blur-xl md:px-6"
        style={{
          boxShadow: '0 12px 32px rgba(0,0,0,0.16)',
        }}
      >
        <Link to="/" className="group flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-white transition-transform duration-200 group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--leaf-400) 0%, var(--leaf-600) 100%)',
              boxShadow: '0 12px 30px rgba(79,111,44,0.28)',
            }}
          >
            <LeafIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-0">
              <span className="font-display text-lg font-semibold tracking-tight text-[var(--mist-100)]">KrishiDoot</span>
              <span className="font-display text-lg font-semibold text-[var(--leaf-300)]">.AI</span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--mist-500)]">Editorial Bharat System</p>
          </div>
        </Link>

        {meta && (
          <div className="min-w-0 flex-1 px-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--millet-300)]">{meta.eyebrow}</p>
            <p className="mt-1 max-w-2xl font-display text-base leading-tight text-[var(--mist-100)] md:text-xl">{meta.title}</p>
            <p className="mt-1 hidden text-sm leading-5 text-[var(--mist-400)] md:block">{meta.desc}</p>
          </div>
        )}

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--mist-500)]">Live desk</p>
            <p className="text-xs font-medium text-[var(--mist-300)]">{meta?.note || 'AI guidance is active in this workspace.'}</p>
          </div>
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────── */}
      <main ref={mainRef} className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 pb-28 pt-5">
        <Outlet />
      </main>

      {/* ── Bottom nav ──────────────────────────────────────────── */}
      <nav ref={navWrapRef} className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pt-2">
        <div className="mx-auto max-w-xl rounded-[28px] border border-white/10 bg-[rgba(18,15,11,0.92)] px-2 py-2 shadow-[0_-8px_36px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div ref={navRef} className="relative flex items-center justify-between gap-1">
            <span ref={navIndicatorRef} className="absolute inset-y-0 left-0 rounded-[22px] bg-[rgba(124,175,77,0.15)] shadow-[inset_0_0_0_1px_rgba(124,175,77,0.18)] opacity-0" />
            {APP_NAV.map(({ to, label, Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  ref={(node) => { navItemRefs.current[to] = node }}
                  className={`kd-nav-item relative z-10 flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[22px] px-3 py-3 text-xs font-semibold transition-colors duration-200 ${
                    active ? 'text-[var(--leaf-300)]' : 'text-[var(--mist-500)] hover:text-[var(--mist-200)]'
                  }`}
                >
                  <Icon active={active} />
                  <span className="hidden sm:block">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<AppLayout />}>
        <Route path="/grade"     element={<Grade />}        />
        <Route path="/negotiate" element={<Negotiate />}    />
        <Route path="/market"    element={<Market />}       />
        <Route path="/grow"      element={<CropJourney />}  />
      </Route>
    </Routes>
  )
}
