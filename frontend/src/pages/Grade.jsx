import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ErrorAlert, SpinnerIcon } from '../components/ui.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const GRADE_META = {
  A: {
    label: 'Premium Quality',
    sublabel: 'Agmark Grade A',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/10',
    ring: 'ring-emerald-500/20',
    multiplier: '1.25×',
    multiplierNote: '+25% above market',
    multiplierColor: 'text-emerald-400',
  },
  B: {
    label: 'Standard Quality',
    sublabel: 'Agmark Grade B',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/10',
    ring: 'ring-amber-500/20',
    multiplier: '1.15×',
    multiplierNote: '+15% above market',
    multiplierColor: 'text-amber-400',
  },
  C: {
    label: 'Below Standard',
    sublabel: 'Agmark Grade C',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/10',
    ring: 'ring-red-500/20',
    multiplier: '1.05×',
    multiplierNote: '+5% above market',
    multiplierColor: 'text-orange-400',
  },
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-600">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function ScaleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" />
    </svg>
  )
}

export default function Grade() {
  const navigate = useNavigate()
  const [imageB64, setImageB64]         = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [result, setResult]             = useState(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
      setImageB64(reader.result.split(',')[1])
      setResult(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleGrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/grade/crop`, { image_b64: imageB64, crop_type: 'auto' })
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  // Navigate to Negotiate with auto-start — grade context pre-fills crop + adjusts ask price
  const startNegotiation = () => {
    const crop_type = result.detected_crop_type || 'tomato'
    localStorage.setItem('kd_grade', JSON.stringify({ grade: result, crop_type }))
    localStorage.setItem('kd_autostart', '1')
    navigate('/negotiate')
  }

  // Navigate to Negotiate without auto-start (let user review setup)
  const goNegotiate = () => {
    const crop_type = result.detected_crop_type || 'tomato'
    localStorage.setItem('kd_grade', JSON.stringify({ grade: result, crop_type }))
    navigate('/negotiate')
  }

  const meta = result ? GRADE_META[result.grade] : null
  const detectedCrop = result?.detected_crop_type
    ? result.detected_crop_type.charAt(0).toUpperCase() + result.detected_crop_type.slice(1)
    : null

  return (
    <div className="pt-6 pb-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Crop Grading</h1>
        <p className="text-sm text-gray-400 mt-0.5">AI identifies your crop and assigns Agmark grade — sets your negotiation starting price automatically.</p>
      </div>

      {/* Upload card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
        {/* Auto-detect badge */}
        <div className="flex items-center gap-2.5 bg-green-500/5 border border-green-500/15 rounded-xl px-3 py-2.5">
          <div className="w-6 h-6 bg-green-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 text-green-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-400">Gemini Auto-Detection</p>
            <p className="text-[11px] text-gray-500 mt-0.5">AI identifies crop type · assigns Agmark grade · sets negotiation price</p>
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Crop Photo</label>
          <label className="block cursor-pointer group">
            <div className={`relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
              imagePreview
                ? 'border-green-500/40 bg-green-500/5'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800/40 group-hover:bg-gray-800/60'
            } flex items-center justify-center`} style={{ minHeight: '180px' }}>
              {imagePreview ? (
                <img src={imagePreview} alt="crop preview" className="max-h-52 w-full object-contain p-3" />
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 px-4 text-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                    <UploadIcon />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Tap to take photo or upload</p>
                    <p className="text-xs text-gray-600 mt-0.5">Opens rear camera on mobile</p>
                  </div>
                </div>
              )}
              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 bg-gray-950/80 flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-green-500/20 animate-ping absolute inset-0" />
                    <div className="w-12 h-12 rounded-full border-2 border-green-500/40 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <SpinnerIcon />
                    </div>
                  </div>
                  <p className="text-xs text-green-400 font-medium">Gemini is analysing your crop…</p>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
          </label>
        </div>

        <ErrorAlert error={error} />

        <button
          onClick={handleGrade}
          disabled={!imageB64 || loading}
          className="w-full bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? <><SpinnerIcon /> Analysing crop...</> : 'Analyse Crop with AI'}
        </button>
      </div>

      {/* Result card */}
      {result && meta && (
        <div className={`bg-gray-900 border rounded-2xl p-4 space-y-4 shadow-xl ${meta.border} ${meta.glow}`}>

          {/* Detected crop banner */}
          {detectedCrop && (
            <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-400">
                  <path d="M17 8C8 10 5.9 16.17 3.82 19.82L5.71 21l1-1.73c.97.53 1.94.83 2.79.83 4 0 7-4 7-9 0-.9-.17-1.77-.5-2.56 2.3 1.93 3.7 4.8 3.7 7.96 0 2.42-.83 4.65-2.2 6.41L19 24c1.81-2.22 2.9-5.07 2.9-8.18C21.9 10.55 19.95 6.76 17 4V8z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Crop Detected</p>
                <p className="text-sm font-bold text-white">{detectedCrop}</p>
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${meta.bg} flex-shrink-0`}>
                <CheckIcon />
              </div>
            </div>
          )}

          {/* Grade hero */}
          <div className={`relative overflow-hidden flex items-center justify-between px-5 py-4 rounded-2xl border ${meta.bg} ${meta.border}`}>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-8xl font-black opacity-[0.06] select-none pointer-events-none">
              {result.grade}
            </div>
            <div className="relative">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Agmark Grade</p>
              <p className={`text-4xl font-black ${meta.text}`}>{result.grade}</p>
              <p className={`text-xs font-semibold mt-1 ${meta.text} opacity-80`}>{meta.label}</p>
            </div>
            <div className="relative text-right">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${meta.bg} ${meta.border} ${meta.text} mb-1.5`}>
                {meta.multiplier} market price
              </div>
              <p className={`text-xs ${meta.multiplierColor}`}>{meta.multiplierNote}</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">Estimated Price</p>
              <p className="text-sm font-bold text-white mt-1">{result.estimated_price_band}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">AI Confidence</p>
              <div className="flex items-end gap-1.5 mt-1">
                <p className="text-sm font-bold text-white">{(result.confidence * 100).toFixed(0)}%</p>
                <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden mb-0.5">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Agmark note */}
          <p className="text-xs text-gray-500 leading-relaxed">{result.agmark_standard}</p>

          {/* Defects */}
          {result.defects.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Defects Detected</p>
              <div className="flex flex-wrap gap-1.5">
                {result.defects.map((d, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1 h-1 bg-red-400 rounded-full" />
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CTA section */}
          <div className="space-y-2 pt-1">
            {/* Primary: auto-start negotiation */}
            <button
              onClick={startNegotiation}
              className="w-full bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
            >
              <ScaleIcon />
              Start Negotiation — {meta.multiplier} Opening Ask
              <ChevronRightIcon />
            </button>
            {/* Secondary: go to negotiate setup manually */}
            <button
              onClick={goNegotiate}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2.5 rounded-xl text-xs font-medium transition-all"
            >
              Customize negotiation settings first
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-700 text-center leading-relaxed pb-2">
        Photos analysed by Gemini Vision · Not stored · DPDP Act 2023 compliant
      </p>
    </div>
  )
}
