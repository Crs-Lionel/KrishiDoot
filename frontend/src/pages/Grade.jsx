import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { Link } from 'react-router-dom'
import { LeafIcon, AlertIcon, SpinnerIcon, ErrorAlert, INPUT_CLS, SELECT_CLS, KD_CARD, triggerConfetti, CropBadge, PriceDisplay } from '../components/ui.jsx'

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Visual metadata for grades
const GRADE_META = {
  A: {
    color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)',
    label: 'Premium Quality', icon: '🌟',
    confetti: true
  },
  B: {
    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',
    label: 'Standard Quality', icon: '👍',
    confetti: false
  },
  C: {
    color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)',
    label: 'Fair Quality', icon: '⚠️',
    confetti: false
  }
}

export default function Grade() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [invalidResult, setInvalidResult] = useState(null) // non-null when image is not a crop
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const resultRef = useRef(null)
  const confRef = useRef(null)

  // Upload handler
  const handleFile = (selectedFile) => {
    if (!selectedFile) return
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setResult(null)
    setInvalidResult(null)
    setError('')
  }

  // Drag and drop events
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }
  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  // Convert file to base64
  const fileToBase64 = (f) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1]) // strip data:... prefix
    reader.onerror = reject
    reader.readAsDataURL(f)
  })

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    setInvalidResult(null)

    try {
      const image_b64 = await fileToBase64(file)

      const res = await fetch(`${API_BASE}/grade/crop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64, crop_type: 'auto' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Grading failed')

      // Image is not a crop — show plain rejection message
      if (!data.is_valid) {
        setInvalidResult(data.invalid_reason || 'This image does not appear to be a crop, vegetable, or fruit.')
        return
      }

      // Map backend GradeResponse → UI shape
      const priceParts = (data.estimated_price_band || '0-0').match(/[\d.]+/g) || ['0','0']
      setResult({
        crop: data.detected_crop_type || 'Unknown',
        grade: data.grade,
        confidence: data.confidence,
        reasoning: data.agmark_standard,
        findings: {
          positive: data.defects.length === 0 ? ['No defects detected'] : [],
          negative: data.defects,
        },
        price_estimate: {
          min: parseFloat(priceParts[0]),
          max: parseFloat(priceParts[1] || priceParts[0]),
        },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Animate result reveal
  useEffect(() => {
    if (result && resultRef.current) {
      const gMeta = GRADE_META[result.grade] || GRADE_META.C

      const ctx = gsap.context(() => {
        gsap.fromTo(resultRef.current,
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.2)' }
        )
        
        // Confidence bar animation
        if (confRef.current) {
          gsap.fromTo(confRef.current,
            { width: '0%' },
            { width: `${result.confidence * 100}%`, duration: 1.5, ease: 'power3.out', delay: 0.3 }
          )
        }
      })

      // Trigger confetti for Grade A
      if (gMeta.confetti) {
        setTimeout(() => triggerConfetti(resultRef.current), 300)
      }

      return () => ctx.revert()
    }
  }, [result])

  return (
    <div className="pt-6 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3"
             style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Gemini Vision API
        </div>
        <h1 className="text-3xl font-black font-display tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Agmark AI Grading</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Upload a clear photo of your harvest. The AI will assess quality, spot defects, and estimate your fair price.
        </p>
      </div>

      <ErrorAlert error={error} />

      {/* UPLOAD FORM */}
      <div className={`${KD_CARD} p-5 mt-4`}>
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div 
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
              isDragging ? 'border-green-500 bg-green-500/5' : 'border-[var(--border-card)]'
            }`}
            style={{ 
              backgroundColor: preview ? 'transparent' : 'var(--input-bg)',
              borderColor: preview ? 'var(--border-subtle)' : undefined
            }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {preview ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
                <img src={preview} alt="Crop Preview" className="w-full h-full object-cover" />
                
                {/* Custom scanning animation over image when loading */}
                {loading && (
                  <>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-all" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                      <SpinnerIcon className="w-8 h-8 text-green-400 mb-3" />
                      <p className="text-white font-bold tracking-widest text-xs uppercase animate-pulse">Analyzing crop...</p>
                    </div>
                    <div className="scan-line-el" />
                  </>
                )}
                
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                  disabled={loading}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors backdrop-blur-md"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center group">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                     style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </div>
                <p className="text-sm font-bold font-display" style={{ color: 'var(--text-primary)' }}>Tap to take photo or upload</p>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Good lighting gets better results</p>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} disabled={loading} />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full kd-btn-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <SpinnerIcon /> Processing...
              </>
            ) : (
              'Analyze Quality'
            )}
          </button>
        </form>
      </div>

      {/* INVALID IMAGE MESSAGE */}
      {invalidResult && (
        <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl"
             style={{ background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)' }}>
          <span className="text-2xl flex-shrink-0 mt-0.5">🚫</span>
          <div>
            <p className="font-bold text-sm" style={{ color: '#f87171' }}>Image Not Applicable</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{invalidResult}</p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Please upload a clear photo of a vegetable, fruit, or grain crop for Agmark grading.</p>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {result && (
        <div ref={resultRef} className="mt-8 space-y-4 relative">
          
          {/* Main Grade Card */}
          <div className="p-6 rounded-2xl relative overflow-hidden"
               style={{ 
                 background: GRADE_META[result.grade].bg, 
                 border: `1.5px solid ${GRADE_META[result.grade].border}`,
                 boxShadow: result.grade === 'A' ? 'var(--glow-green)' : 'var(--shadow-card)'
               }}>
            
            {/* Background glow if grade A */}
            {result.grade === 'A' && (
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full mix-blend-overlay blur-3xl opacity-20 pointer-events-none" />
            )}

            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1 font-display" style={{ color: 'var(--text-muted)' }}>Detected Crop</p>
                <div className="flex items-center gap-2 mb-4">
                  <CropBadge crop={result.crop} />
                </div>
                
                <p className="text-xs font-bold uppercase tracking-widest mb-1 mt-4 font-display" style={{ color: 'var(--text-muted)' }}>Agmark Grade</p>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm"
                       style={{ color: GRADE_META[result.grade].color }}>
                    <span className="text-3xl font-black font-display">{result.grade}</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {GRADE_META[result.grade].label} {GRADE_META[result.grade].icon}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Based on visual characteristics</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${GRADE_META[result.grade].border}` }}>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>AI Confidence</span>
                <span className="text-sm font-bold font-mono" style={{ color: GRADE_META[result.grade].color }}>
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-black/10" style={{ background: 'var(--input-bg)' }}>
                <div 
                  ref={confRef}
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ background: GRADE_META[result.grade].color, width: '0%' }}
                />
              </div>
              <div className="flex justify-between mt-1 px-1">
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>0%</span>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>50%</span>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>100%</span>
              </div>
            </div>
          </div>

          {/* Details & Findings */}
          <div className={`${KD_CARD} p-5`}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4 font-display" style={{ color: 'var(--text-muted)' }}>Analysis Details</p>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-primary)' }}>{result.reasoning}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-1.5 mb-1 text-green-500">
                  <span className="text-sm">✅</span>
                  <span className="text-xs font-bold">Good Signs</span>
                </div>
                <ul className="text-xs space-y-1.5 mt-2" style={{ color: 'var(--text-secondary)' }}>
                  {result.findings.positive.map((p, i) => (
                    <li key={i} className="flex gap-1.5"><span className="opacity-50">•</span>{p}</li>
                  ))}
                  {result.findings.positive.length === 0 && <li className="italic opacity-50">None highlighted</li>}
                </ul>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--bg-card-2)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-1.5 mb-1 text-red-400">
                  <span className="text-sm">⚠️</span>
                  <span className="text-xs font-bold">Issues</span>
                </div>
                <ul className="text-xs space-y-1.5 mt-2" style={{ color: 'var(--text-secondary)' }}>
                  {result.findings.negative.map((n, i) => (
                    <li key={i} className="flex gap-1.5"><span className="opacity-50">•</span>{n}</li>
                  ))}
                  {result.findings.negative.length === 0 && <li className="italic opacity-50">None detected</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Price Range & CTA */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/30">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500/80 mb-2 font-display">Estimated Market Value</p>
            <div className="flex items-baseline gap-2 mb-4">
              <PriceDisplay amount={result.price_estimate.min} size="lg" className="text-amber-500" unit={false} />
              <span className="text-amber-500/50 font-medium">—</span>
              <PriceDisplay amount={result.price_estimate.max} size="lg" className="text-amber-500" unit="/kg" />
            </div>
            
            <p className="text-xs text-amber-500/80 mb-5 max-w-[280px]">
              Based on live APMC data for Grade {result.grade} {result.crop}. Use this as your starting point for negotiation.
            </p>

            <Link 
              to={`/negotiate?crop=${result.crop}&grade=${result.grade}`}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              Start Negotiation 🤝
            </Link>
          </div>

        </div>
      )}
    </div>
  )
}
