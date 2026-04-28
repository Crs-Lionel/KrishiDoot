import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Routes, Route, Link, useLocation, Outlet } from 'react-router-dom'
import Landing     from './pages/Landing.jsx'
import Negotiate   from './pages/Negotiate.jsx'
import Grade       from './pages/Grade.jsx'
import Market      from './pages/Market.jsx'
import CropJourney from './pages/CropJourney.jsx'
import { LeafIcon, ThemeToggle, useTheme, PulsingDot } from './components/ui.jsx'

// ── Agriculture-themed Nav Icons (aligned with idea.md features) ─────────────

// Vision Grading — Camera lens (Gemini Vision API)
function IconGrade({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-[22px] h-[22px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      {active && <circle cx="12" cy="12.75" r="1.5" fill="currentColor" opacity="0.6" />}
    </svg>
  )
}

// Negotiation — Balance scales (Game theory / BATNA)
function IconNegotiate({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-[22px] h-[22px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" />
    </svg>
  )
}

// APMC Prices — Bar chart (data.gov.in live data)
function IconPrices({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-[22px] h-[22px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

// Crop Journey — Seedling (farming companion)
function IconGrow({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-[22px] h-[22px]">
      {active ? (
        <path d="M12 22V13M12 13C12 9.5 14.5 6.5 18 5C15 6 12 8 12 13ZM12 13C12 9.5 9.5 6.5 6 5C9 6 12 8 12 13Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M12 22V13M12 13C12 9.5 14.5 6.5 18 5C15 6 12 8 12 13ZM12 13C12 9.5 9.5 6.5 6 5C9 6 12 8 12 13Z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {/* Soil line */}
      <path d="M6 22H18" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" opacity={0.4} />
    </svg>
  )
}

const APP_NAV = [
  { to: '/grade',     label: 'Grade',     hindi: 'श्रेणी',  Icon: IconGrade,     accent: '#22c55e' },
  { to: '/negotiate', label: 'Negotiate', hindi: 'सौदा',    Icon: IconNegotiate, accent: '#f59e0b' },
  { to: '/market',    label: 'Prices',    hindi: 'भाव',     Icon: IconPrices,    accent: '#3b82f6' },
  { to: '/grow',      label: 'Grow',      hindi: 'उगाओ',    Icon: IconGrow,      accent: '#10b981' },
]

// ── App Layout ────────────────────────────────────────────────────────────────
function AppLayout() {
  const location   = useLocation()
  const headerRef  = useRef(null)
  const navRef     = useRef(null)
  const mainRef    = useRef(null)
  const { theme, toggle } = useTheme()

  /* One-time mount: header + nav slide in */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: -64, opacity: 0,
        duration: 0.7, ease: 'power3.out',
      })
      gsap.from('.kd-nav-item', {
        y: 56, opacity: 0,
        duration: 0.55, ease: 'power3.out',
        stagger: { each: 0.07, from: 'start' },
        delay: 0.2,
      })
    })
    return () => ctx.revert()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* Route change: organic spring fade */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(mainRef.current, {
        opacity: 0, y: 14, scale: 0.99,
        duration: 0.32, ease: 'power2.out',
      })
    })
    return () => ctx.revert()
  }, [location.pathname])

  // Find which nav item is active (for header accent)
  const activeNav = APP_NAV.find(n => n.to === location.pathname)
  const headerAccent = activeNav?.accent || '#22c55e'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        ref={headerRef}
        className="px-4 py-2.5 flex items-center sticky top-0 z-30"
        style={{
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: 'var(--shadow-nav)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
              boxShadow: '0 2px 12px rgba(34,197,94,0.35)',
            }}
          >
            <LeafIcon className="w-4.5 h-4.5 relative z-10" />
            {/* Shimmer sweep on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </div>
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline">
              <span className="font-display font-bold text-[15px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
                KrishiDoot
              </span>
              <span
                className="font-display font-extrabold text-[15px]"
                style={{
                  background: `linear-gradient(135deg, ${headerAccent}, #4ade80)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  transition: 'background 0.3s ease',
                }}
              >.AI</span>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-[0.15em] mt-0.5 font-display" style={{ color: 'var(--text-faint)' }}>
              Digital Fiduciary for Farmers
            </span>
          </div>
        </Link>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Live APMC data indicator */}
          <div
            className="flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-[0.08em]"
            style={{
              color: '#4ade80',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
            }}
          >
            <PulsingDot color="#4ade80" size={5} />
            <span className="hidden sm:inline">APMC</span> Live
          </div>
          {/* Theme toggle */}
          <ThemeToggle theme={theme} toggle={toggle} />
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────────────────────── */}
      <main ref={mainRef} className="flex-1 max-w-xl mx-auto w-full px-4 pb-24 pt-0">
        <Outlet />
      </main>

      {/* ── Bottom nav ──────────────────────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="flex justify-around items-center px-1 py-1 sticky bottom-0 z-30"
        style={{
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.25)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {APP_NAV.map(({ to, label, hindi, Icon, accent }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`kd-nav-item flex flex-col items-center gap-[3px] px-4 py-2 rounded-xl relative transition-all duration-250 ${
                active ? '' : 'hover:opacity-80'
              }`}
              style={{
                color: active ? accent : 'var(--text-muted)',
                background: active ? `${accent}12` : 'transparent',
              }}
            >
              {/* Active glow halo */}
              {active && (
                <span
                  className="absolute inset-0 rounded-xl pointer-events-none transition-all duration-300"
                  style={{ boxShadow: `0 0 20px ${accent}20, inset 0 0 12px ${accent}08` }}
                />
              )}

              {/* Icon with badge dot for active */}
              <div className="relative">
                <Icon active={active} />
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-[5px] h-[5px] rounded-full"
                        style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
                )}
              </div>

              {/* Label */}
              <span className={`text-[9px] tracking-wide font-display leading-none ${active ? 'font-extrabold' : 'font-semibold'}`}>
                {label}
              </span>

              {/* Hindi sub-label */}
              <span className="text-[7px] font-hindi leading-none" style={{ color: active ? accent : 'var(--text-faint)', opacity: active ? 0.9 : 0.5 }}>
                {hindi}
              </span>

              {/* Active bar indicator */}
              <span
                className="block rounded-full transition-all duration-300"
                style={{
                  height: '2px',
                  width: active ? '16px' : '0px',
                  background: active ? accent : 'transparent',
                  boxShadow: active ? `0 0 8px ${accent}` : 'none',
                  marginTop: '1px',
                }}
              />
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  // Apply saved theme on startup
  useEffect(() => {
    const saved = localStorage.getItem('kd_theme') || 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<AppLayout />}>
        <Route path="/grade"     element={<Grade />}       />
        <Route path="/negotiate" element={<Negotiate />}   />
        <Route path="/market"    element={<Market />}      />
        <Route path="/grow"      element={<CropJourney />} />
      </Route>
    </Routes>
  )
}
