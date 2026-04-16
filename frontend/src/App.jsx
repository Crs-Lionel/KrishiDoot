import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Negotiate from './pages/Negotiate.jsx'
import Grade from './pages/Grade.jsx'
import Market from './pages/Market.jsx'

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      {/* Header */}
      <header className="bg-green-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <div>
            <div className="font-bold text-lg leading-none">KrishiDoot.AI</div>
            <div className="text-xs text-green-200">Your Digital Fiduciary</div>
          </div>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-xl mx-auto w-full p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/negotiate" element={<Negotiate />} />
          <Route path="/grade" element={<Grade />} />
          <Route path="/market" element={<Market />} />
        </Routes>
      </main>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-gray-200 flex justify-around py-2 sticky bottom-0">
        {[
          { to: '/', icon: '🏠', label: 'Home' },
          { to: '/grade', icon: '📸', label: 'Grade' },
          { to: '/negotiate', icon: '🤝', label: 'Negotiate' },
          { to: '/market', icon: '📊', label: 'Market' },
        ].map(({ to, icon, label }) => (
          <Link key={to} to={to}
            className={`flex flex-col items-center text-xs gap-1 px-3 py-1 rounded-lg ${
              location.pathname === to ? 'text-green-700 font-semibold' : 'text-gray-500'
            }`}>
            <span className="text-xl">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
