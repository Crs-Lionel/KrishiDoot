import { Routes, Route, Link, useLocation, Outlet } from 'react-router-dom'
import Landing     from './pages/Landing.jsx'
import Negotiate   from './pages/Negotiate.jsx'
import Grade       from './pages/Grade.jsx'
import Market      from './pages/Market.jsx'
import CropJourney from './pages/CropJourney.jsx'
import { LeafIcon } from './components/ui.jsx'

function IconCamera({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  )
}

function IconScale({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" />
    </svg>
  )
}

function IconChart({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function IconSprout({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} className="w-5 h-5">
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

function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans">
      {/* Header with glassmorphism */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800/70 px-5 py-3.5 flex items-center sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
            <LeafIcon className="w-4 h-4" />
          </div>
          <div className="flex items-baseline">
            <span className="font-bold text-white text-base tracking-tight">KrishiDoot</span>
            <span className="font-bold text-green-400 text-base">.AI</span>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
            <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
            LIVE
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="bg-gray-900/90 backdrop-blur-md border-t border-gray-800/70 flex justify-around px-2 py-1.5 sticky bottom-0 z-30">
        {APP_NAV.map(({ to, label, Icon }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-2xl transition-all duration-150 ${
                active
                  ? 'text-green-400 bg-green-500/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon active={active} />
              <span className={`text-[11px] font-semibold tracking-wide ${active ? 'text-green-400' : 'text-gray-500'}`}>{label}</span>
              {active && <span className="block w-4 h-0.5 bg-green-400 rounded-full" />}
            </Link>
          )
        })}
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
        <Route path="/negotiate" element={<Negotiate />}   />
        <Route path="/market"    element={<Market />}      />
        <Route path="/grow"      element={<CropJourney />} />
      </Route>
    </Routes>
  )
}
