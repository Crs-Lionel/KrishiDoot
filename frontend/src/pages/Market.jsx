import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import gsap from 'gsap'
import axios from 'axios'
import {
  ArrowRightIcon,
  ChartIcon,
  ErrorAlert,
  FieldLabel,
  INPUT_CLS,
  MapPinIcon,
  PageIntro,
  SELECT_CLS,
  SpinnerIcon,
  StatusBadge,
  SurfaceCard,
} from '../components/ui.jsx'

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
  { bg: '#c9a96c', border: '#9a7a44', text: '#fff7e7' },
  { bg: '#7caf4d', border: '#537d2f', text: '#f3eee2' },
  { bg: '#463d31', border: '#2a241d', text: '#d4c8b1' },
  { bg: '#342d24', border: '#1f1a14', text: '#b8aa90' },
]

function createPinIcon(rank) {
  const c = PIN_COLORS[Math.min(rank, 3)]
  const size = rank === 0 ? 34 : rank === 1 ? 30 : 26
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${c.bg};border:2.5px solid ${c.border};
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      box-shadow:0 8px 20px rgba(0,0,0,0.35);
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
  const center = STATE_CENTERS[withCoords[0]?.district?.toLowerCase()] || positions[0]

  return (
    <div className="market-map overflow-hidden rounded-[30px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.24)]" style={{ height: '100%', minHeight: '340px' }}>
      <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%', background: '#17140f' }} zoomControl={false} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <FitBounds positions={positions} />
        {withCoords.map((m, i) => (
          <Marker key={m.name} position={[m.lat, m.lon]} icon={createPinIcon(i)}>
            <Popup>
              <div style={{ fontSize: '12px', lineHeight: '1.5', minWidth: '150px' }}>
                <strong style={{ fontSize: '13px' }}>{m.name}</strong><br />
                <span style={{ color: '#678f39', fontWeight: 700 }}>Rs.{m.price}/kg</span>
                {' '}| {m.distance_km} km<br />
                Net: <strong>Rs.{m.net?.toFixed(2)}/kg</strong><br />
                <span style={{ color: '#857864', fontSize: '11px' }}>{m.trend === 'up' ? 'Rising' : m.trend === 'down' ? 'Falling' : 'Stable'}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
function TrendBadge({ trend }) {
  if (trend === 'up') return <StatusBadge tone="leaf">Rising</StatusBadge>
  if (trend === 'down') return <StatusBadge tone="danger">Falling</StatusBadge>
  return <StatusBadge>Stable</StatusBadge>
}

function SupplyBar({ arrivals }) {
  const max = 1500
  const pct = Math.min(100, Math.round((arrivals / max) * 100))
  const label = arrivals >= 800 ? 'High' : arrivals >= 400 ? 'Medium' : 'Low'
  const color = arrivals >= 800 ? 'bg-[var(--leaf-400)]' : arrivals >= 400 ? 'bg-[var(--millet-300)]' : 'bg-[var(--mist-500)]'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-[var(--mist-500)]">
        <span className="uppercase tracking-[0.2em]">Supply</span>
        <span className="tabular-nums text-[var(--mist-300)]">{arrivals}t | {label}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Market() {
  const [crop, setCrop] = useState('tomato')
  const [state, setState] = useState('Karnataka')
  const [transportRate, setTransportRate] = useState('0.025')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const pageRef = useRef(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.market-intro', { y: 18, autoAlpha: 0, duration: 0.45, ease: 'power3.out' })
      gsap.from('.market-controls', { y: 24, autoAlpha: 0, duration: 0.55, ease: 'power3.out', delay: 0.08 })
    }, pageRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!result || !resultsRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl
        .from('.market-rec-banner', { y: 22, autoAlpha: 0, duration: 0.45 })
        .from('.market-map', { scale: 0.98, autoAlpha: 0, duration: 0.5 }, '-=0.18')
        .from('.market-mandi-card', { y: 24, autoAlpha: 0, duration: 0.42, stagger: 0.08 }, '-=0.24')
    }, resultsRef)
    return () => ctx.revert()
  }, [result])

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
  const best = sorted[0]
  const second = sorted[1]
  const extraPerKg = best && second ? (best.net - second.net).toFixed(2) : null

  return (
    <div ref={pageRef} className="space-y-6 pb-6">
      <div className="market-intro">
        <PageIntro
          eyebrow="Mandi Atlas"
          title="See the mandi choice as a route-to-profit decision."
          desc="Compare modal price, freight drag, and net value in one surface so the best destination is obvious on both phone and desktop."
          aside={<StatusBadge tone="leaf">Net value ranked</StatusBadge>}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SurfaceCard className="market-controls grain-surface p-5">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--millet-300)]">Route inputs</p>
              <p className="mt-1 font-display text-2xl text-[var(--mist-100)]">Build the route before the deal.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <FieldLabel>Crop</FieldLabel>
                <select className={SELECT_CLS} value={crop} onChange={e => { setCrop(e.target.value); setResult(null) }}>
                  {CROPS.map(c => (
                    <option key={c} value={c} className="bg-gray-800">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>State</FieldLabel>
                <select className={SELECT_CLS} value={state} onChange={e => { setState(e.target.value); setResult(null) }}>
                  {STATES.map(s => <option key={s} value={s} className="bg-gray-800">{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel meta="Rs./kg per km">Transport rate</FieldLabel>
              <input
                type="number"
                step="0.005"
                min="0"
                className={INPUT_CLS}
                value={transportRate}
                onChange={e => { setTransportRate(e.target.value); setResult(null) }}
                placeholder="0.025"
              />
              <p className="mt-2 text-xs leading-6 text-[var(--mist-500)]">Default freight assumes roughly Rs.2.50 per 100 km for every kilogram moved.</p>
            </div>

            <ErrorAlert error={error} />

            <button
              onClick={fetchMandis}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-[linear-gradient(135deg,var(--leaf-400),var(--leaf-600))] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(79,111,44,0.28)] transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <><SpinnerIcon /> Building mandi shortlist...</> : <><MapPinIcon className="h-4 w-4" /> Find the best mandi</>}
            </button>

            <div className="rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.04)] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--mist-500)]">Decision rule</p>
              <p className="mt-2 text-sm leading-6 text-[var(--mist-300)]">A higher price is not always a better deal. KrishiDoot ranks mandis by what is left after distance-based freight is deducted.</p>
            </div>
          </div>
        </SurfaceCard>

        <div ref={resultsRef} className="space-y-4">
          {result && sorted.length > 0 ? (
            <>
              <SurfaceCard className="market-rec-banner p-5">
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div className="space-y-3">
                    <StatusBadge tone="leaf">Best route today</StatusBadge>
                    <div>
                      <p className="font-display text-3xl leading-tight text-[var(--mist-100)]">{best.name}</p>
                      <p className="mt-1 text-sm text-[var(--mist-400)]">{best.district} | {best.distance_km} km away</p>
                    </div>
                    <p className="max-w-xl text-sm leading-6 text-[var(--mist-300)]">This mandi currently gives the strongest net value after applying your transport drag. It is the best floor reference for negotiation.</p>
                    {extraPerKg && parseFloat(extraPerKg) > 0 && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(124,175,77,0.22)] bg-[rgba(124,175,77,0.1)] px-3 py-1.5 text-xs text-[var(--leaf-300)]">
                        <ChartIcon className="h-3.5 w-3.5" />
                        Rs.{extraPerKg}/kg ahead of {second.name}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.04)] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--mist-500)]">Modal</p>
                      <p className="tabular-nums mt-2 font-display text-3xl text-[var(--mist-100)]">Rs.{best.price}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.04)] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--mist-500)]">Transport drag</p>
                      <p className="tabular-nums mt-2 font-display text-3xl text-[var(--danger-300)]">Rs.{best.transport}</p>
                    </div>
                    <div className="rounded-[22px] border border-[rgba(124,175,77,0.22)] bg-[rgba(124,175,77,0.1)] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--mist-500)]">Net value</p>
                      <p className="tabular-nums mt-2 font-display text-3xl text-[var(--leaf-300)]">Rs.{best.net}</p>
                    </div>
                  </div>
                </div>
              </SurfaceCard>

              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="order-2 xl:order-1">
                  <MandiMap mandis={sorted} />
                </div>
                <div className="order-1 space-y-3 xl:order-2">
                  {sorted.map((m, i) => {
                    const isBest = i === 0
                    return (
                      <SurfaceCard key={m.name} className="market-mandi-card p-4">
                        <div className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-black ${isBest ? 'border-[rgba(124,175,77,0.22)] bg-[rgba(124,175,77,0.12)] text-[var(--leaf-300)]' : 'border-white/10 bg-white/5 text-[var(--mist-300)]'}`}>{i + 1}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-display text-xl text-[var(--mist-100)]">{m.name}</p>
                              {isBest && <StatusBadge tone="leaf">Best value</StatusBadge>}
                            </div>
                            <p className="mt-1 text-xs text-[var(--mist-500)]">{m.district} | {m.distance_km} km from source</p>
                          </div>
                          <TrendBadge trend={m.trend} />
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          {[
                            { label: 'Modal', value: `Rs.${m.price}`, tone: 'text-[var(--mist-100)]' },
                            { label: 'Freight', value: `Rs.${m.transport}`, tone: 'text-[var(--danger-300)]' },
                            { label: 'Net', value: `Rs.${m.net}`, tone: isBest ? 'text-[var(--leaf-300)]' : 'text-[var(--mist-100)]' },
                          ].map((item) => (
                            <div key={item.label} className="rounded-[20px] border border-white/8 bg-[rgba(255,255,255,0.04)] p-3 text-center">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--mist-500)]">{item.label}</p>
                              <p className={`tabular-nums mt-2 font-display text-2xl ${item.tone}`}>{item.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                          <SupplyBar arrivals={m.arrivals_tonnes} />
                          {isBest && (
                            <div className="rounded-[20px] border border-[rgba(124,175,77,0.18)] bg-[rgba(124,175,77,0.08)] px-4 py-3 text-xs leading-5 text-[var(--mist-300)]">
                              <p className="font-medium text-[var(--leaf-300)]">Negotiation floor cue</p>
                              <p className="mt-1">Do not settle below roughly Rs.{(m.net - 0.5).toFixed(2)}/kg when benchmarking this route.</p>
                            </div>
                          )}
                        </div>
                      </SurfaceCard>
                    )
                  })}
                </div>
              </div>

              <p className="text-xs text-[var(--mist-500)]">Source: {result.data_source}. Map tiles by CARTO.</p>
            </>
          ) : !loading && !error ? (
            <SurfaceCard className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-white/5 text-[var(--millet-300)]">
                <MapPinIcon className="h-9 w-9" />
              </div>
              <div className="space-y-2">
                <p className="font-display text-3xl text-[var(--mist-100)]">A map-ranked mandi shortlist appears here.</p>
                <p className="mx-auto max-w-xl text-sm leading-6 text-[var(--mist-400)]">Choose the crop, set your transport drag, and KrishiDoot will show which mandi actually leaves the strongest net value.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--mist-300)]">
                <ArrowRightIcon className="h-3.5 w-3.5" />
                Mobile emphasizes the best route first. Desktop keeps the map and ranking side by side.
              </div>
            </SurfaceCard>
          ) : null}
        </div>
      </div>
    </div>
  )
}
