import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import axios from 'axios'
import {
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  CropIcon,
  ErrorAlert,
  PageIntro,
  ScaleIcon,
  SpinnerIcon,
  StatusBadge,
  SurfaceCard,
} from '../components/ui.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const GRADE_META = {
  A: {
    label: 'Premium quality',
    sublabel: 'Agmark Grade A',
    text: 'text-emerald-300',
    tone: 'leaf',
    multiplier: '1.25x',
    multiplierNote: '25% above market',
    border: 'rgba(124,175,77,0.28)',
    wash: 'rgba(124,175,77,0.12)',
  },
  B: {
    label: 'Market standard',
    sublabel: 'Agmark Grade B',
    text: 'text-[var(--millet-300)]',
    tone: 'millet',
    multiplier: '1.15x',
    multiplierNote: '15% above market',
    border: 'rgba(209,174,108,0.28)',
    wash: 'rgba(209,174,108,0.12)',
  },
  C: {
    label: 'Needs discounting',
    sublabel: 'Agmark Grade C',
    text: 'text-[var(--danger-300)]',
    tone: 'danger',
    multiplier: '1.05x',
    multiplierNote: '5% above market',
    border: 'rgba(194,93,70,0.28)',
    wash: 'rgba(194,93,70,0.12)',
  },
}

export default function Grade() {
  const navigate = useNavigate()
  const [imageB64, setImageB64] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const pageRef = useRef(null)
  const resultRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.grade-intro', { y: 18, autoAlpha: 0, duration: 0.45, ease: 'power3.out' })
      gsap.from('.grade-upload-card', { y: 28, autoAlpha: 0, duration: 0.55, ease: 'power3.out', delay: 0.08 })
      gsap.from('.grade-side-panel', { y: 28, autoAlpha: 0, duration: 0.55, ease: 'power3.out', delay: 0.16 })
    }, pageRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!result || !resultRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl
        .from(resultRef.current, { y: 24, autoAlpha: 0, duration: 0.48 })
        .from('.grade-verdict', { scale: 0.88, autoAlpha: 0, duration: 0.5 }, '-=0.2')
        .from('.grade-evidence-row', { y: 16, autoAlpha: 0, duration: 0.38, stagger: 0.08 }, '-=0.2')
      gsap.fromTo('.grade-confidence-bar', { width: '0%' }, { width: `${(result.confidence * 100).toFixed(0)}%`, duration: 0.9, ease: 'power2.out', delay: 0.4 })
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
    <div ref={pageRef} className="space-y-6 pb-6">
      <div className="grade-intro">
        <PageIntro
          eyebrow="Inspection Desk"
          title="Inspect one crop lot with evidence, not guesswork."
          desc="Photograph the harvest, let Gemini identify the crop and grade quality, then carry that proof straight into negotiation."
          aside={<StatusBadge tone="leaf">Vision ready</StatusBadge>}
        />
      </div>

      <div className={`grid gap-5 ${result ? 'xl:grid-cols-[1.02fr_0.98fr]' : 'lg:grid-cols-[1fr_360px]'}`}>
        <SurfaceCard className="grade-upload-card grain-surface overflow-hidden p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--millet-300)]">Capture</p>
              <p className="mt-1 font-display text-2xl text-[var(--mist-100)]">Crop inspection frame</p>
            </div>
            <StatusBadge tone="leaf">Auto crop detection</StatusBadge>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <label className="group relative block cursor-pointer">
              <div className="field-glow relative min-h-[320px] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(25,21,17,0.92),rgba(17,14,10,0.92))]">
                {imagePreview ? (
                  <img src={imagePreview} alt="crop preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 px-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-white/5 text-[var(--leaf-300)]">
                      <CameraIcon className="h-9 w-9" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-display text-2xl text-[var(--mist-100)]">Frame the crop lot cleanly</p>
                      <p className="text-sm leading-6 text-[var(--mist-400)]">Use one crop batch, daylight when possible, and a clear surface so the grade reads as evidence.</p>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(15,13,9,0.82)] backdrop-blur-sm">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(124,175,77,0.2)] bg-[rgba(124,175,77,0.08)] text-[var(--leaf-300)]">
                      <SpinnerIcon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-[var(--leaf-300)]">Gemini is grading the lot</p>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
            </label>

            <div className="grade-side-panel space-y-4 rounded-[26px] border border-white/8 bg-white/5 p-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--mist-500)]">Evidence chain</p>
                <div className="mt-4 space-y-3">
                  {[
                    'Identify the crop automatically from the image.',
                    'Grade quality against Agmark expectations.',
                    'Push the pricing premium into negotiation setup.'
                  ].map((item, index) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(124,175,77,0.2)] bg-[rgba(124,175,77,0.08)] text-xs font-semibold text-[var(--leaf-300)]">{index + 1}</div>
                      <p className="text-sm leading-6 text-[var(--mist-400)]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.04)] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--mist-500)]">Negotiation effect</p>
                <p className="mt-2 font-display text-xl text-[var(--mist-100)]">Your grade controls the opening ask.</p>
                <p className="mt-2 text-sm leading-6 text-[var(--mist-400)]">Grade A starts strongest, Grade B holds standard premium, and Grade C still preserves a floor before bargaining begins.</p>
              </div>
            </div>
          </div>

          <ErrorAlert error={error} className="mt-4" />

          <button
            onClick={handleGrade}
            disabled={!imageB64 || loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-[22px] bg-[linear-gradient(135deg,var(--leaf-400),var(--leaf-600))] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(79,111,44,0.28)] transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <><SpinnerIcon /> Analysing crop quality...</> : <><CameraIcon className="h-4 w-4" /> Analyse crop with AI</>}
          </button>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          {!result || !meta ? (
            <div className="flex h-full min-h-[420px] flex-col justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--mist-500)]">Result surface</p>
                <p className="mt-2 font-display text-3xl leading-tight text-[var(--mist-100)]">The verdict appears here as soon as the lot is graded.</p>
                <p className="mt-3 max-w-md text-sm leading-6 text-[var(--mist-400)]">Once the image is analysed, this panel turns into a proof sheet with crop detection, grade confidence, price band, and the opening ask multiplier.</p>
              </div>
              <div className="rounded-[26px] border border-white/8 bg-[rgba(255,255,255,0.04)] p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--mist-500)]">What we lock in</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-white/8 bg-[rgba(18,15,11,0.65)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--mist-500)]">Crop identity</p>
                    <p className="mt-2 text-sm text-[var(--mist-300)]">No manual selection needed before grading.</p>
                  </div>
                  <div className="rounded-[20px] border border-white/8 bg-[rgba(18,15,11,0.65)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--mist-500)]">Price leverage</p>
                    <p className="mt-2 text-sm text-[var(--mist-300)]">The grade multiplier flows straight into your negotiation setup.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div ref={resultRef} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--millet-300)]">Inspection result</p>
                  <p className="mt-1 font-display text-3xl text-[var(--mist-100)]">Grade evidence sheet</p>
                </div>
                <StatusBadge tone={meta.tone}>{meta.sublabel}</StatusBadge>
              </div>

              <div className="grade-verdict field-glow overflow-hidden rounded-[28px] border px-5 py-5" style={{ borderColor: meta.border, background: `linear-gradient(180deg, ${meta.wash}, rgba(18,15,11,0.96))` }}>
                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div className="space-y-3">
                    {detectedCrop && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--mist-300)]">
                        <CropIcon crop={result.detected_crop_type} className="h-3.5 w-3.5" />
                        {detectedCrop}
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--mist-500)]">Agmark verdict</p>
                      <div className="mt-2 flex items-end gap-4">
                        <span className={`font-display text-7xl leading-none ${meta.text}`}>{result.grade}</span>
                        <div className="pb-2">
                          <p className={`text-sm font-semibold ${meta.text}`}>{meta.label}</p>
                          <p className="mt-1 text-xs text-[var(--mist-400)]">{meta.multiplierNote}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[180px] rounded-[22px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4 text-right">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--mist-500)]">Opening ask</p>
                    <p className={`mt-2 font-display text-4xl ${meta.text}`}>{meta.multiplier}</p>
                    <p className="mt-1 text-sm text-[var(--mist-400)]">of modal price</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grade-evidence-row rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.04)] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--mist-500)]">Estimated band</p>
                  <p className="tabular-nums mt-2 font-display text-3xl text-[var(--mist-100)]">{result.estimated_price_band}</p>
                </div>
                <div className="grade-evidence-row rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.04)] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--mist-500)]">Confidence</p>
                  <div className="mt-2 flex items-end gap-3">
                    <p className="tabular-nums font-display text-3xl text-[var(--mist-100)]">{(result.confidence * 100).toFixed(0)}%</p>
                    <div className="mb-1 h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="grade-confidence-bar h-full rounded-full bg-[linear-gradient(90deg,var(--leaf-400),var(--millet-300))]" style={{ width: `${result.confidence * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grade-evidence-row rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.04)] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--mist-500)]">Agmark note</p>
                <p className="mt-2 text-sm leading-6 text-[var(--mist-300)]">{result.agmark_standard}</p>
              </div>

              {result.defects.length > 0 && (
                <div className="grade-evidence-row rounded-[22px] border border-[rgba(194,93,70,0.22)] bg-[rgba(194,93,70,0.08)] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--danger-300)]">Detected defects</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.defects.map((defect) => (
                      <span key={defect} className="inline-flex items-center gap-2 rounded-full border border-[rgba(194,93,70,0.22)] px-3 py-1 text-xs text-[var(--danger-300)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger-300)]" />
                        {defect}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={startNegotiation}
                  className="flex items-center justify-center gap-2 rounded-[22px] bg-[linear-gradient(135deg,var(--leaf-400),var(--leaf-600))] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(79,111,44,0.28)] transition"
                >
                  <ScaleIcon className="h-4 w-4" />
                  Start negotiation at {meta.multiplier}
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={goNegotiate}
                  className="flex items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium text-[var(--mist-300)] transition hover:bg-white/8"
                >
                  <CheckIcon className="h-4 w-4" />
                  Review negotiation settings
                </button>
              </div>
            </div>
          )}
        </SurfaceCard>
      </div>

      <p className="text-center text-[11px] leading-6 text-[var(--mist-500)]">Gemini Vision grades the image locally for this session. Crop photos are not persisted by the UI.</p>
    </div>
  )
}
