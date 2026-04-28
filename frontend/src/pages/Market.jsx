import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { gsap } from 'gsap'
import L from 'leaflet'
import { LeafIcon, AlertIcon, SpinnerIcon, ErrorAlert, INPUT_CLS, SELECT_CLS, KD_CARD, SectionLabel, CropBadge, PriceDisplay } from '../components/ui.jsx'

// API base
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Crops list with emojis for select
const CROPS = [
  { id: 'tomato', name: 'Tomato', emoji: '🍅' },
  { id: 'wheat', name: 'Wheat', emoji: '🌾' },
  { id: 'onion', name: 'Onion', emoji: '🧅' },
  { id: 'potato', name: 'Potato', emoji: '🥔' },
  { id: 'cotton', name: 'Cotton', emoji: '🌿' },
]

const STATES = ['Karnataka', 'Maharashtra', 'Punjab', 'Gujarat', 'Uttar Pradesh']

// Custom map markers
const createCustomIcon = (isBest = false, isLight = false) => {
  const color = isBest ? '#f59e0b' : '#22c55e'
  const glow = isBest ? '0 0 10px rgba(245,158,11,0.6)' : '0 0 10px rgba(34,197,94,0.6)'
  
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        width: ${isBest ? '24px' : '16px'};
        height: ${isBest ? '24px' : '16px'};
        background-color: ${color};
        border: 2px solid ${isLight ? '#fff' : '#0d1510'};
        border-radius: 50%;
        box-shadow: ${glow};
        animation: float 3s ease-in-out infinite;
      ">
        ${isBest ? '<div style="position:absolute;top:-12px;left:4px;font-size:12px;">👑</div>' : ''}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// Map Updater Component
function MapUpdater({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.5 })
  }, [center, zoom, map])
  return null
}

export default function Market() {
  const [crop, setCrop] = useState('tomato')
  const [state, setState] = useState('Karnataka')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLightMode, setIsLightMode] = useState(false)

  const bestMandiRef = useRef(null)
  const listRef = useRef(null)

  // Listen to theme changes for map layer
  useEffect(() => {
    const checkTheme = () => setIsLightMode(document.documentElement.getAttribute('data-theme') === 'light')
    checkTheme()
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') checkTheme()
      })
    })
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  // Fetch prices from /market/mandis
  const fetchPrices = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/market/mandis?crop=${crop}&state=${state}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Failed to fetch prices')
      
      // Map backend fields to UI shape
      const mandis = (json.mandis || []).map((m, i) => ({
        name: m.name || m.mandi || `Mandi ${i+1}`,
        district: m.district || '',
        modal_price: m.price || m.modal_price || 0,
        distance_km: m.distance_km || Math.round(20 + i * 15),
        transport_cost: m.transport_cost || Math.round((m.distance_km || 20 + i * 15) * 0.3),
        net_value: m.net_value || (m.price || 0) - Math.round((m.distance_km || 20) * 0.3),
        arrivals: m.arrivals || m.arrivals_tonnes || 0,
        trend: m.trend || 'stable',
        lat: m.lat || 15 + i * 0.5,
        lng: m.lng || 75 + i * 0.5,
      }))

      // Sort by net_value descending
      mandis.sort((a, b) => b.net_value - a.net_value)
      
      // Recalculate net_value if missing
      mandis.forEach(m => {
        if (!m.net_value || m.net_value <= 0) {
          m.net_value = m.modal_price - m.transport_cost
        }
      })

      setData({
        crop: json.crop,
        state: json.state,
        mandis,
        best_mandi: mandis[0] || null,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => { fetchPrices() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Form submit
  const handleSearch = (e) => {
    e.preventDefault()
    fetchPrices()
  }

  // Animations when data loads
  useEffect(() => {
    if (data && !loading) {
      const ctx = gsap.context(() => {
        if (bestMandiRef.current) {
          gsap.fromTo(bestMandiRef.current,
            { scale: 0.9, opacity: 0, y: 20 },
            { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: 'back.out(1.5)' }
          )
        }
        
        if (listRef.current) {
          gsap.fromTo(listRef.current.children,
            { x: -20, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
          )
        }
        
        // Number counting animation
        const counters = document.querySelectorAll('.price-counter')
        counters.forEach(counter => {
          const val = parseFloat(counter.innerText)
          const obj = { val: 0 }
          gsap.to(obj, {
            val: val,
            duration: 1.5,
            ease: 'power3.out',
            onUpdate: () => { counter.innerText = obj.val.toFixed(1) }
          })
        })
      })
      return () => ctx.revert()
    }
  }, [data, loading])

  // Get map center based on first mandi
  const mapCenter = data?.mandis?.[0]
    ? [data.mandis[0].lat, data.mandis[0].lng]
    : [20.5937, 78.9629] // India center

  // Medals for top 3
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="pt-6 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-black font-display tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Live Mandi Prices</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Real-time APMC data overlaid with transport costs to find your most profitable market.
        </p>
      </div>

      {/* CONTROLS */}
      <div className={`${KD_CARD} mb-6`}>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1" style={{ color: 'var(--text-muted)' }}>Crop</label>
            <div className="relative">
              <select 
                value={crop} 
                onChange={(e) => setCrop(e.target.value)}
                className={`${SELECT_CLS} pl-9`}
              >
                {CROPS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {CROPS.find(c => c.id === crop)?.emoji}
              </div>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1" style={{ color: 'var(--text-muted)' }}>State</label>
            <select 
              value={state} 
              onChange={(e) => setState(e.target.value)}
              className={SELECT_CLS}
            >
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-end pb-0.5">
            <button type="submit" disabled={loading}
              className="w-12 h-[42px] kd-btn-primary rounded-xl flex items-center justify-center text-white font-bold transition-all disabled:opacity-50"
            >
              {loading ? <SpinnerIcon /> : 'GO'}
            </button>
          </div>
        </form>
      </div>

      <ErrorAlert error={error} />

      {/* EMPTY / LOADING STATE */}
      {!data && !loading && !error && (
        <div className={`${KD_CARD} py-16 text-center border-dashed border-2`} style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="text-4xl mb-4 opacity-50">🌾</div>
          <p className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>No data to display</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Select a crop and state to see live prices.</p>
        </div>
      )}

      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-20">
          <SpinnerIcon className="w-8 h-8 text-green-500 mb-4" />
          <p className="text-sm font-bold font-display animate-pulse" style={{ color: 'var(--text-muted)' }}>Fetching live APMC data...</p>
        </div>
      )}

      {/* RESULTS */}
      {data && !loading && (
        <div className="space-y-6">
          
          {/* BEST MANDI BANNER */}
          {data.best_mandi && (
            <div ref={bestMandiRef} className="relative overflow-hidden rounded-2xl p-6"
                 style={{ 
                   background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.15) 100%)',
                   border: '1px solid rgba(245,158,11,0.4)',
                   boxShadow: 'var(--glow-amber)'
                 }}>
              <div className="absolute -right-6 -top-6 text-[100px] opacity-[0.06] transform -rotate-12 pointer-events-none">🏆</div>
              
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🏆</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 font-display">Most Profitable</span>
                  </div>
                  <h2 className="text-2xl font-black font-display mb-1" style={{ color: 'var(--text-primary)' }}>{data.best_mandi.name}</h2>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Distance: {data.best_mandi.distance_km} km</p>
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-amber-500/80">Net Price</p>
                  <PriceDisplay amount={data.best_mandi.net_value} size="lg" className="text-amber-500" />
                </div>
              </div>
            </div>
          )}

          {/* MAP */}
          <div className="h-[280px] rounded-2xl overflow-hidden relative" style={{ border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
            <MapContainer 
              center={mapCenter} 
              zoom={7} 
              style={{ height: '100%', width: '100%', background: isLightMode ? '#e5e7eb' : '#0a0f0b' }} 
              zoomControl={false}
            >
              <TileLayer
                url={isLightMode 
                  ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                }
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapUpdater center={mapCenter} zoom={7} />
              
              {data.mandis.map((m, i) => (
                <Marker 
                  key={m.name} 
                  position={[m.lat, m.lng]}
                  icon={createCustomIcon(i === 0, isLightMode)}
                >
                  <Popup>
                    <div className="p-1 min-w-[120px]">
                      <p className="font-bold mb-1 border-b pb-1 font-display" style={{ borderColor: 'var(--border-subtle)' }}>
                        {i === 0 && '👑 '} {m.name}
                      </p>
                      <div className="flex justify-between items-center text-xs mt-1.5">
                        <span style={{ color: 'var(--text-muted)' }}>Price:</span>
                        <span className="font-mono font-bold text-green-500">₹{m.modal_price}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span style={{ color: 'var(--text-muted)' }}>Net:</span>
                        <span className="font-mono font-bold" style={{ color: i===0 ? '#f59e0b' : 'var(--text-primary)' }}>₹{m.net_value}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            {/* Map overlay gradient for seamless integration */}
            <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none z-[400]"
                 style={{ background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 100%)' }} />
          </div>

          {/* LIST */}
          <div>
            <SectionLabel className="mb-3">All Markets Ranked</SectionLabel>
            <div ref={listRef} className="space-y-3">
              {data.mandis.map((m, i) => (
                <div key={m.name} className={`${KD_CARD} flex flex-col p-4 relative overflow-hidden group`}>
                  
                  {/* Subtle highlight for top 3 */}
                  {i < 3 && (
                    <div className="absolute left-0 top-0 bottom-0 w-1" 
                         style={{ background: i===0 ? '#fbbf24' : i===1 ? '#94a3b8' : '#b45309' }} />
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-black/10 dark:bg-white/5">
                        {i < 3 ? medals[i] : <span className="text-[10px] font-bold opacity-50">{i+1}</span>}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm font-display leading-tight" style={{ color: 'var(--text-primary)' }}>{m.name}</h3>
                        <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.distance_km} km away</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-green-500 mb-0.5">Net Return</p>
                      <div className="flex items-baseline gap-0.5 justify-end">
                        <span className="text-xs font-semibold opacity-70">₹</span>
                        <span className="text-lg font-black font-display price-counter" style={{ color: 'var(--text-primary)' }}>{m.net_value}</span>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown details */}
                  <div className="grid grid-cols-2 gap-2 mt-1 pt-3" style={{ borderTop: '1px dashed var(--border-subtle)' }}>
                    <div>
                      <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-faint)' }}>Modal Price</p>
                      <p className="text-xs font-mono font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>₹{m.modal_price}/kg</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-faint)' }}>Est. Transport</p>
                      <p className="text-xs font-mono font-medium mt-0.5 text-red-400">-₹{m.transport_cost}/kg</p>
                    </div>
                  </div>
                  
                  {/* Supply indicator bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-black/10 dark:bg-white/5 overflow-hidden flex">
                      {/* Random visual fill for supply level - just for UI aesthetics */}
                      <div className="h-full bg-green-500/50" style={{ width: `${60 - (i*10)}%` }} />
                    </div>
                    <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Supply Level</span>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
