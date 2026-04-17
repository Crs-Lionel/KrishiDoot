import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
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
    multiplier: '1.25×',
    multiplierNote: '+25% above market',
    multiplierColor: 'text-emerald-400',
    glowClass: 'glow-emerald',
    gradientFrom: 'rgba(52,211,153,0.12)',
    gradientTo: 'rgba(52,211,153,0)',
  },
  B: {
    label: 'Standard Quality',
    sublabel: 'Agmark Grade B',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    multiplier: '1.15×',
    multiplierNote: '+15% above market',
    multiplierColor: 'text-amber-400',
    glowClass: 'glow-amber',
    gradientFrom: 'rgba(251,191,36,0.10)',
    gradientTo: 'rgba(251,191,36,0)',
  },
  C: {
    label: 'Below Standard',
    sublabel: 'Agmark Grade C',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    multiplier: '1.05×',
    multiplierNote: '+5% above market',
    multiplierColor: 'text-orange-400',
    glowClass: '',
    gradientFrom: 'rgba(248,113,113,0.08)',
    gradientTo: 'rgba(248,113,113,0)',
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
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

  const pageRef   = useRef(null)
  const resultRef = useRef(null)

  /* Page entrance — use opacity only (not autoAlpha) so visibility is never hidden */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.grade-header', {
        y: -20, opacity: 0, duration: 0.5, ease: 'power3.out',
      })
      gsap.from('.grade-upload-card', {
        y: 24, opacity: 0, duration: 0.55, ease: 'power3.out', delay: 0.08,
      })
    }, pageRef)
    return () => ctx.revert()
  }, [])

  /* Result reveal — the key emotional moment */
  useEffect(() => {
    if (!result || !resultRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      /* 1. Card container fades in */
      tl.from(resultRef.current, {
        y: 32, opacity: 0, duration: 0.5,
      })
      /* 2. Crop banner slides in from left */
      .from('.grade-crop-banner', {
        x: -24, opacity: 0, duration: 0.4,
      }, '-=0.2')
      /* 3. Grade hero — big reveal */
      .from('.grade-hero-bg', {
        opacity: 0, duration: 0.35,
      }, '-=0.1')
      .from('.grade-letter', {
        scale: 0.4, opacity: 0, duration: 0.6, ease: 'power3.out',
      }, '-=0.2')
      .from('.grade-label', {
        x: -12, opacity: 0, duration: 0.35,
      }, '-=0.35')
      .from('.grade-multiplier', {
        x: 20, opacity: 0, duration: 0.35,
      }, '-=0.4')
      /* 4. Stats stagger up */
      .from('.grade-stat', {
        y: 16, opacity: 0, duration: 0.4,
        stagger: { each: 0.08 },
      }, '-=0.15')
      /* 5. Defects + agmark note */
      .from('.grade-note', {
        opacity: 0, duration: 0.3,
      }, '-=0.1')
      /* 6. CTA buttons slide up last */
      .from('.grade-cta', {
        y: 16, opacity: 0, duration: 0.4,
        stagger: { each: 0.07 },
      }, '-=0.1')
      /* 7. Animate confidence bar from 0 */
      if (result) {
        gsap.fromTo('.grade-confidence-bar', {
          width: '0%',
        }, {
          width: `${(result.confidence * 100).toFixed(0)}%`,
          duration: 0.9, ease: 'power2.out', delay: 0.65,
        })
      }
    }, resultRef)
    return () => ctx.revert()
  }, [result])

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

  const startNegotiation = () => {
    const crop_type = result.detected_crop_type || 'tomato'
    localStorage.setItem('kd_grade', JSON.stringify({ grade: result, crop_type }))
    localStorage.setItem('kd_autostart', '1')
    navigate('/negotiate')
  }

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
    <div ref={pageRef} className="pt-6 pb-4 space-y-4">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="grade-header">
        <h1 className="text-xl font-display font-bold text-white tracking-tight">Crop Grading</h1>
        <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">
          AI identifies your crop and assigns Agmark grade — sets your negotiation opening price automatically.
        </p>
      </div>

      {/* ── Upload card ─────────────────────────────────────────── */}
      <div
        className="grade-upload-card border rounded-2xl p-4 space-y-4"
        style={{
          background: 'linear-gradient(145deg, #0d1410 0%, #111a13 100%)',
          borderColor: 'rgba(42,58,43,0.7)',
        }}
      >
        {/* Auto-detect badge */}
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)' }}
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(22,163,74,0.15)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 text-green-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-green-400 font-display">Gemini Auto-Detection</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Identifies crop · assigns Agmark grade · sets negotiation price</p>
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-widest font-display">
            Crop Photo
          </label>
          <label className="block cursor-pointer group">
            <div
              className={`relative rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden flex items-center justify-center ${
                imagePreview ? 'border-green-500/50' : 'border-gray-600 group-hover:border-green-600/60'
              }`}
              style={{
                minHeight: '190px',
                background: imagePreview ? 'rgba(22,163,74,0.04)' : 'rgba(17,26,19,0.6)',
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="crop preview" className="max-h-52 w-full object-contain p-3" />
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 px-4 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                    style={{ background: 'rgba(24,32,25,0.8)', border: '1px solid rgba(42,58,43,0.6)' }}
                  >
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ background: 'rgba(8,12,9,0.85)' }}>
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full border-2 border-green-500/15 animate-ping absolute inset-0" />
                    <div className="w-14 h-14 rounded-full border-2 border-green-500/30 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <SpinnerIcon />
                    </div>
                  </div>
                  <p className="text-xs text-green-400 font-semibold font-display">Gemini is analysing your crop…</p>
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
          className="w-full text-white py-3.5 rounded-xl text-sm font-semibold font-display disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity duration-150"
          style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            boxShadow: (!imageB64 || loading) ? 'none' : '0 4px 20px rgba(22,163,74,0.3)',
          }}
        >
          {loading ? <><SpinnerIcon /> Analysing crop…</> : 'Analyse Crop with AI'}
        </button>
      </div>

      {/* ── Result card ─────────────────────────────────────────── */}
      {result && meta && (
        <div
          ref={resultRef}
          className={`border rounded-2xl p-4 space-y-4 ${meta.glowClass}`}
          style={{
            background: `linear-gradient(145deg, ${meta.gradientFrom} 0%, #0d1410 40%)`,
            borderColor: 'rgba(42,58,43,0.7)',
          }}
        >
          {/* Detected crop banner */}
          {detectedCrop && (
            <div
              className="grade-crop-banner flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(24,32,25,0.9)', border: '1px solid rgba(42,58,43,0.8)' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(22,163,74,0.12)' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-400">
                  <path d="M17 8C8 10 5.9 16.17 3.82 19.82L5.71 21l1-1.73c.97.53 1.94.83 2.79.83 4 0 7-4 7-9 0-.9-.17-1.77-.5-2.56 2.3 1.93 3.7 4.8 3.7 7.96 0 2.42-.83 4.65-2.2 6.41L19 24c1.81-2.22 2.9-5.07 2.9-8.18C21.9 10.55 19.95 6.76 17 4V8z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest font-display">Crop Detected</p>
                <p className="text-sm font-bold text-white font-display">{detectedCrop}</p>
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${meta.bg} flex-shrink-0`}>
                <CheckIcon />
              </div>
            </div>
          )}

          {/* Grade hero — dramatic */}
          <div
            className={`grade-hero-bg relative overflow-hidden flex items-center justify-between px-5 py-5 rounded-2xl border ${meta.bg} ${meta.border}`}
          >
            {/* Ghost letter watermark */}
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none font-display font-black"
              style={{ fontSize: '7rem', opacity: 0.06, lineHeight: 1 }}
            >
              {result.grade}
            </div>

            <div className="relative">
              <p className="grade-label text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5 font-display">
                Agmark Grade
              </p>
              <p className={`grade-letter text-5xl font-black font-display ${meta.text}`}
                style={{ lineHeight: 1 }}>
                {result.grade}
              </p>
              <p className={`grade-label text-xs font-semibold mt-1.5 ${meta.text} opacity-80 font-display`}>
                {meta.label}
              </p>
            </div>

            <div className="relative text-right">
              <div
                className={`grade-multiplier inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold font-display ${meta.bg} ${meta.border} ${meta.text} mb-1.5`}
              >
                {meta.multiplier} market price
              </div>
              <p className={`grade-label text-xs font-medium ${meta.multiplierColor}`}>{meta.multiplierNote}</p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div
              className="grade-stat rounded-xl p-3"
              style={{ background: 'rgba(24,32,25,0.8)', border: '1px solid rgba(42,58,43,0.6)' }}
            >
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest font-display">Estimated Price</p>
              <p className="text-sm font-bold text-white mt-1 font-display">{result.estimated_price_band}</p>
            </div>
            <div
              className="grade-stat rounded-xl p-3"
              style={{ background: 'rgba(24,32,25,0.8)', border: '1px solid rgba(42,58,43,0.6)' }}
            >
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest font-display">AI Confidence</p>
              <div className="flex items-end gap-1.5 mt-1">
                <p className="text-sm font-bold text-white font-display">{(result.confidence * 100).toFixed(0)}%</p>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden mb-0.5"
                  style={{ background: 'rgba(42,58,43,0.5)' }}>
                  <div
                    className="grade-confidence-bar h-full bg-green-500 rounded-full"
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Agmark note */}
          <p className="grade-note text-xs text-gray-500 leading-relaxed">{result.agmark_standard}</p>

          {/* Defects */}
          {result.defects.length > 0 && (
            <div className="grade-note">
              <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-widest font-display">Defects Detected</p>
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

          {/* CTA */}
          <div className="space-y-2 pt-1">
            <button
              onClick={startNegotiation}
              className="grade-cta w-full text-white py-3.5 rounded-xl text-sm font-bold font-display flex items-center justify-center gap-2 transition-opacity duration-150"
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                boxShadow: '0 4px 24px rgba(22,163,74,0.28)',
              }}
            >
              <ScaleIcon />
              Start Negotiation — {meta.multiplier} Opening Ask
              <ChevronRightIcon />
            </button>
            <button
              onClick={goNegotiate}
              className="grade-cta w-full py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors duration-150"
              style={{ background: 'rgba(24,32,25,0.7)', border: '1px solid rgba(42,58,43,0.6)' }}
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
