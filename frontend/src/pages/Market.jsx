import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'
import { SELECT_CLS, INPUT_CLS, ErrorAlert, SpinnerIcon } from '../components/ui.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const CROPS = [
  'tomato', 'wheat', 'onion', 'potato', 'rice',
  'maize', 'soybean', 'cotton', 'sugarcane', 'bajra', 'jowar', 'mustard',
]

const STATES = [
  'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

// State geographic centers for initial map view
const STATE_CENTERS = {
  'karnataka': [15.32, 75.71], 'maharashtra': [19.75, 75.71],
  'punjab': [31.15, 75.34], 'uttar pradesh': [26.85, 80.95],
  'gujarat': [22.26, 71.19], 'rajasthan': [27.02, 74.22],
  'madhya pradesh': [22.97, 78.66], 'andhra pradesh': [15.91, 79.74],
  'haryana': [29.06, 76.09], 'west bengal': [22.99, 87.85],
  'bihar': [25.10, 85.31], 'tamil nadu': [11.13, 78.66],
  'telangana': [17.12, 79.21], 'odisha': [20.95, 85.10],
}

const PIN_COLORS = [
  { bg: '#f59e0b', border: '#d97706', text: '#fff' }, // gold — rank 1
  { bg: '#9ca3af', border: '#6b7280', text: '#fff' }, // silver — rank 2
  { bg: '#4b5563', border: '#374151', text: '#d1d5db' }, // gray — rank 3
  { bg: '#374151', border: '#1f2937', text: '#9ca3af' }, // dim — rank 4
]

const RANK_STYLE = [
  { border: 'border-yellow-400/40', bg: 'bg-yellow-400/5',  badge: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30' },
  { border: 'border-gray-400/30',   bg: 'bg-gray-400/5',    badge: 'bg-gray-600/40 text-gray-300 border-gray-500/30' },
  { border: 'border-gray-700',      bg: 'bg-transparent',   badge: 'bg-gray-800 text-gray-400 border-gray-700' },
  { border: 'border-gray-700',      bg: 'bg-transparent',   badge: 'bg-gray-800 text-gray-500 border-gray-700' },
]

function createPinIcon(rank) {
  const c = PIN_COLORS[Math.min(rank, 3)]
  const size = rank === 0 ? 34 : rank === 1 ? 28 : 24
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${c.bg};border:2.5px solid ${c.border};
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);color:${c.text};font-size:${rank === 0 ? 11 : 10}px;font-weight:800;line-height:1;">${rank + 1}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [28, 28] })
    } else if (positions.length === 1) {
      map.setView(positions[0], 10)
    }
  }, [positions, map])
  return null
}

function MandiMap({ mandis }) {
  const withCoords = mandis.filter(m => m.lat && m.lon)
  if (!withCoords.length) return null

  const positions = withCoords.map(m => [m.lat, m.lon])
  const center = STATE_CENTERS[
    withCoords[0]?.district?.toLowerCase()
  ] || positions[0]

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-700 shadow-lg" style={{ height: '220px' }}>
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: '100%', width: '100%', background: '#111827' }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <FitBounds positions={positions} />
        {withCoords.map((m, i) => (
          <Marker key={m.name} position={[m.lat, m.lon]} icon={createPinIcon(i)}>
            <Popup>
              <div style={{ fontSize: '12px', lineHeight: '1.5', minWidth: '140px' }}>
                <strong style={{ fontSize: '13px' }}>{m.name}</strong><br />
                <span style={{ color: '#16a34a', fontWeight: 700 }}>Rs.{m.price}/kg</span>
                &nbsp;·&nbsp;{m.distance_km} km<br />
                Net: <strong>Rs.{m.net?.toFixed(2)}/kg</strong><br />
                <span style={{ color: '#6b7280', fontSize: '11px' }}>{m.trend === 'up' ? '↑ Rising' : m.trend === 'down' ? '↓ Falling' : '→ Stable'}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.076 3.208-4.535 3.208-7.327a6.5 6.5 0 10-13 0c0 2.792 1.264 5.251 3.208 7.327a19.583 19.583 0 002.856 2.779 13.057 13.057 0 00.281.241zM12 9a2 2 0 110 4 2 2 0 010-4z" clipRule="evenodd" />
    </svg>
  )
}

function TrendBadge({ trend }) {
  if (trend === 'up')   return <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">↑ Rising</span>
  if (trend === 'down') return <span className="text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">↓ Falling</span>
  return <span className="text-xs font-semibold text-gray-400 bg-gray-700/50 border border-gray-600 px-2 py-0.5 rounded-full">→ Stable</span>
}

function SupplyBar({ arrivals }) {
  const max = 1500
  const pct = Math.min(100, Math.round((arrivals / max) * 100))
  const label = arrivals >= 800 ? 'High' : arrivals >= 400 ? 'Medium' : 'Low'
  const color = arrivals >= 800 ? 'bg-emerald-500' : arrivals >= 400 ? 'bg-amber-500' : 'bg-gray-600'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-gray-500">
        <span className="uppercase tracking-wide font-semibold">Supply</span>
        <span className="text-gray-400 font-medium">{arrivals}t · {label}</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Market() {
  const [crop, setCrop]                   = useState('tomato')
  const [state, setState]                 = useState('Karnataka')
  const [transportRate, setTransportRate] = useState('0.025')
  const [result, setResult]               = useState(null)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)

  const fetchMandis = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await axios.get(`${API}/market/mandis`, {
        params: {
          crop: crop.toLowerCase(),
          state: state.toLowerCase().replace(/ /g, '_'),
        },
      })
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  const rate = parseFloat(transportRate) || 0.025

  const enrichedMandis = result?.mandis?.map(m => ({
    ...m,
    transport: parseFloat((m.distance_km * rate).toFixed(2)),
    net: parseFloat((m.price - m.distance_km * rate).toFixed(2)),
  })) ?? []

  const sorted = [...enrichedMandis].sort((a, b) => b.net - a.net)
  const best   = sorted[0]
  const second = sorted[1]
  const extraPerKg = best && second ? (best.net - second.net).toFixed(2) : null

  return (
    <div className="pt-6 pb-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Best Mandi Finder</h1>
        <p className="text-sm text-gray-400 mt-0.5">See today's prices on a map — find where to sell for maximum profit.</p>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Crop</label>
            <select className={SELECT_CLS} value={crop} onChange={e => { setCrop(e.target.value); setResult(null) }}>
              {CROPS.map(c => (
                <option key={c} value={c} className="bg-gray-800">
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">State</label>
            <select className={SELECT_CLS} value={state} onChange={e => { setState(e.target.value); setResult(null) }}>
              {STATES.map(s => (
                <option key={s} value={s} className="bg-gray-800">{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            Transport Rate
            <span className="ml-1.5 text-gray-600 font-normal normal-case">₹/kg per km</span>
          </label>
          <input
            type="number"
            step="0.005"
            min="0"
            className={INPUT_CLS}
            value={transportRate}
            onChange={e => { setTransportRate(e.target.value); setResult(null) }}
            placeholder="0.025"
          />
          <p className="text-[11px] text-gray-600 mt-1">Default ₹0.025/kg/km ≈ ₹2.50 per 100 km (tractor freight)</p>
        </div>

        <ErrorAlert error={error} />

        <button
          onClick={fetchMandis}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading
            ? <><SpinnerIcon /> Fetching mandi prices…</>
            : <><MapPinIcon /> Find Best Mandi Today</>}
        </button>
      </div>

      {/* Results */}
      {result && sorted.length > 0 && (
        <div className="space-y-3">
          {/* Map */}
          <MandiMap mandis={sorted} />

          {/* Recommendation banner */}
          <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPinIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-0.5">Best Choice Today</p>
                <p className="text-base font-bold text-white leading-tight">{best.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{best.district} · {best.distance_km} km away</p>
                {extraPerKg && parseFloat(extraPerKg) > 0 && (
                  <p className="text-xs text-emerald-400 mt-1.5 font-semibold">
                    Earn ₹{extraPerKg}/kg more than {second.name}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-black text-white">₹{best.net}</p>
                <p className="text-[10px] text-gray-500 font-medium">net/kg</p>
              </div>
            </div>
          </div>

          {/* Mandi cards */}
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">
            {sorted.length} Mandis · Ranked by Net Value After Transport
          </p>

          {sorted.map((m, i) => {
            const s = RANK_STYLE[Math.min(i, RANK_STYLE.length - 1)]
            const isBest = i === 0
            return (
              <div key={m.name} className={`bg-gray-900 border rounded-2xl p-4 space-y-3 ${s.border} ${s.bg}`}>
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black ${s.badge}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white leading-tight">{m.name}</p>
                      {isBest && (
                        <span className="text-[10px] font-bold text-yellow-300 bg-yellow-400/15 border border-yellow-400/30 px-2 py-0.5 rounded-full">
                          BEST PRICE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                      <MapPinIcon />
                      <span>{m.district}</span>
                      <span className="text-gray-700">·</span>
                      <span>{m.distance_km} km</span>
                    </div>
                  </div>
                  <TrendBadge trend={m.trend} />
                </div>

                {/* Price grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-2.5 text-center">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Modal</p>
                    <p className="text-base font-black text-white mt-0.5">₹{m.price}</p>
                    <p className="text-[9px] text-gray-600">per kg</p>
                  </div>
                  <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-2.5 text-center">
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Transport</p>
                    <p className="text-base font-black text-red-400 mt-0.5">−₹{m.transport}</p>
                    <p className="text-[9px] text-gray-600">per kg</p>
                  </div>
                  <div className={`border rounded-xl p-2.5 text-center ${isBest ? 'bg-green-500/10 border-green-500/25' : 'bg-gray-800/70 border-gray-700'}`}>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">Net Value</p>
                    <p className={`text-base font-black mt-0.5 ${isBest ? 'text-emerald-400' : 'text-white'}`}>₹{m.net}</p>
                    <p className="text-[9px] text-gray-600">per kg</p>
                  </div>
                </div>

                {/* Supply bar */}
                <SupplyBar arrivals={m.arrivals_tonnes} />

                {/* BATNA advisory */}
                {isBest && (
                  <div className="flex items-start gap-2 bg-green-500/5 border border-green-500/15 rounded-xl p-2.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Negotiation floor (BATNA):{' '}
                      <span className="font-bold text-emerald-400">₹{(m.net - 0.5).toFixed(2)}/kg</span>
                      {' '}— do not accept below this.
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Attribution */}
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[11px] text-gray-600">
              {result.data_source} · Map: OpenStreetMap / CARTO
            </p>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-8 h-8 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-400">Compare mandis on a map</p>
            <p className="text-xs text-gray-600 mt-1">Select crop + state · see map pins · net value auto-calculated after transport</p>
          </div>
        </div>
      )}
    </div>
  )
}
