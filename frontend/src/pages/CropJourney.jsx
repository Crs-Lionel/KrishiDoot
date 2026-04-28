import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { AlertIcon, SpinnerIcon, ErrorAlert, INPUT_CLS, KD_CARD, ProgressRing, CropBadge } from '../components/ui.jsx'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function CropJourney() {
  const [step, setStep] = useState('intro') // intro, questions, loading, result, dashboard
  const [location, setLocation] = useState('')
  const [landPhoto, setLandPhoto] = useState(null) // base64 string
  const [landPhotoPreview, setLandPhotoPreview] = useState(null) // preview URL
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [recommendation, setRecommendation] = useState(null)
  const [plan, setPlan] = useState(null)
  const [activeTab, setActiveTab] = useState('tasks') // tasks, subsidies, report
  const [error, setError] = useState('')
  const [loadingMsg, setLoadingMsg] = useState('')

  const containerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Handle land photo selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Photo must be under 10MB')
      return
    }
    setLandPhotoPreview(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = () => setLandPhoto(reader.result)
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setLandPhoto(null)
    setLandPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Subsidies Mock Data based on state
  const mockSubsidies = [
    { title: 'PM-KISAN', desc: '₹6,000/year income support for landholding farmer families.', link: '#' },
    { title: 'Pradhan Mantri Fasal Bima Yojana', desc: 'Comprehensive crop insurance against non-preventable natural risks.', link: '#' },
    { title: 'Soil Health Card Scheme', desc: 'Free soil testing and customized crop/fertilizer recommendations.', link: '#' },
    { title: 'PM Krishi Sinchayee Yojana', desc: 'Subsidy for micro-irrigation (drip/sprinkler) up to 55%.', link: '#' }
  ]

  // Animations on step change
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      )
    }
  }, [step, activeTab])

  // Get Questions
  const handleStart = async (e) => {
    e.preventDefault()
    if (!location.trim()) return
    setError('')
    setLoadingMsg(landPhoto ? 'Analyzing your land photo, soil & weather...' : 'Analyzing soil and weather history...')
    setStep('loading')
    
    try {
      const currentMonth = new Date().getMonth() + 1
      const payload = { location, month: currentMonth }
      if (landPhoto) payload.land_photo_b64 = landPhoto
      const res = await fetch(`${API_BASE}/crop-journey/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed')
      
      const qs = data.questions || []
      setQuestions(qs)
      
      // Auto-fill answers: use detected_from_photo if AI detected from land image,
      // otherwise default to first option for choice questions
      const initialAnswers = {}
      qs.forEach((q, i) => {
        const qId = q.id || `q_${i}`
        q.id = qId
        if (q.detected_from_photo && q.options?.includes(q.detected_from_photo)) {
          initialAnswers[qId] = q.detected_from_photo
        } else if (q.options && q.options.length > 0) {
          initialAnswers[qId] = q.options[0]
        }
      })
      setAnswers(initialAnswers)
      
      setStep('questions')
    } catch (err) {
      setError(err.message)
      setStep('intro')
    }
  }

  // Get Recommendation
  const handleSubmitAnswers = async () => {
    setError('')
    setLoadingMsg('Computing optimal crop using agronomy models...')
    setStep('loading')
    try {
      const currentMonth = new Date().getMonth() + 1
      const res = await fetch(`${API_BASE}/crop-journey/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, month: currentMonth, answers, ...(landPhoto ? { land_photo_b64: landPhoto } : {}) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed')
      
      // Map backend recommendation → UI shape
      const rec = data.recommendation || data
      setRecommendation({
        crop: rec.recommended_crop || rec.crop || rec.crop_type || 'Unknown',
        confidence: (rec.confidence || 85) / 100,
        metrics: {
          water: rec.water_requirement || rec.water || 'Moderate',
          duration: rec.duration || rec.growth_period || '90-120 days',
        },
        reasons: rec.key_risks || rec.reasons || (rec.why_this_crop ? [rec.why_this_crop] : ['Best fit for your soil and climate']),
      })
      setStep('result')
    } catch (err) {
      setError(err.message)
      setStep('questions')
    }
  }

  const handleGeneratePlan = async () => {
    setError('')
    setLoadingMsg(`Generating weekly task schedule for ${recommendation.crop}...`)
    setStep('loading')
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`${API_BASE}/crop-journey/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          crop_type: recommendation.crop,
          sowing_date: today,
          land_size_acres: 2.0,
          irrigation_type: answers.irrigation || 'rainfed',
          answers,
          farmer_id: 'web_user_' + Date.now(),
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed')
      
      // After /start, fetch the full journey data to get task_calendar
      const journeyRes = await fetch(`${API_BASE}/crop-journey/${data.journey_id}`)
      const journeyData = await journeyRes.json()
      
      const calendar = journeyData.task_calendar || []
      const initializedPlan = calendar.map(week => ({
        ...week,
        tasks: (week.tasks || []).map((t, ti) => ({
          ...t,
          desc: t.task || t.desc || t.description || `Task ${ti+1}`,
          completed: false
        }))
      }))
      setPlan(initializedPlan)
      setStep('dashboard')
    } catch (err) {
      setError(err.message)
      setStep('result')
    }
  }

  // Toggle task completion with animation
  const toggleTask = (weekIdx, taskIdx) => {
    const newPlan = [...plan]
    newPlan[weekIdx].tasks[taskIdx].completed = !newPlan[weekIdx].tasks[taskIdx].completed
    setPlan(newPlan)
    
    // Add simple spring effect if completed
    if (newPlan[weekIdx].tasks[taskIdx].completed) {
      gsap.fromTo(`.task-row-${weekIdx}-${taskIdx}`, 
        { scale: 0.98, backgroundColor: 'rgba(34,197,94,0.2)' }, 
        { scale: 1, backgroundColor: 'transparent', duration: 0.4, ease: 'elastic.out(1, 0.5)' }
      )
    }
  }

  // Calculate completion percentage
  const getProgress = () => {
    if (!plan) return 0
    let total = 0
    let done = 0
    plan.forEach(w => w.tasks.forEach(t => { total++; if (t.completed) done++; }))
    return total === 0 ? 0 : Math.round((done / total) * 100)
  }

  return (
    <div className="pt-6 pb-24 min-h-[calc(100vh-64px)] animate-in fade-in duration-500 flex flex-col" ref={containerRef}>
      
      {/* HEADER */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-black font-display tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Crop Journey AI</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>From deciding what to plant to managing the final harvest.</p>
      </div>

      <ErrorAlert error={error} />

      {/* STEP: INTRO */}
      {step === 'intro' && (
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="text-center mb-10">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-xl transform rotate-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 -rotate-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black font-display mb-3" style={{ color: 'var(--text-primary)' }}>Your digital farm manager</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              We analyze local weather, soil data, and market demand to suggest the most profitable crop, then guide you week by week.
            </p>
          </div>

          <form onSubmit={handleStart} className={`${KD_CARD} p-6`}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Your Farm Location</label>
            <div className="relative mb-5">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl">📍</span>
              <input
                type="text"
                placeholder="e.g. Pune, Maharashtra"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className={`${INPUT_CLS} pl-11`}
                required
              />
            </div>

            {/* Land Photo Upload */}
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Land / Soil Photo <span className="font-normal normal-case tracking-normal" style={{ color: 'var(--text-faint)' }}>(optional — AI auto-detects soil)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
              id="land-photo-input"
            />

            {!landPhotoPreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full mb-5 rounded-xl border-2 border-dashed py-6 flex flex-col items-center gap-2 transition-all hover:border-green-500/50 hover:bg-green-500/5 group cursor-pointer"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Tap to upload or take photo</span>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>AI will detect soil type, terrain & conditions</span>
              </button>
            ) : (
              <div className="relative mb-5 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-subtle)' }}>
                <img src={landPhotoPreview} alt="Land photo" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-green-400 bg-black/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Photo ready for AI analysis
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors text-sm"
                >
                  ✕
                </button>
              </div>
            )}

            <button type="submit" className="w-full kd-btn-primary text-white font-bold py-3.5 rounded-xl">
              {landPhoto ? '🔬 Analyze Photo & Start' : 'Start Assessment'}
            </button>
          </form>
        </div>
      )}

      {/* STEP: LOADING */}
      {step === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-green-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">🌱</div>
          </div>
          <p className="font-bold text-sm text-center animate-pulse font-display" style={{ color: 'var(--text-primary)' }}>{loadingMsg}</p>
        </div>
      )}

      {/* STEP: QUESTIONS */}
      {step === 'questions' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>Farm Profiling</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Help the AI understand your constraints</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className={`${KD_CARD} p-5 hover:-translate-y-0.5 transition-transform ${q.detected_from_photo ? 'border-green-500/40' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{idx + 1}. {q.text || q.question}</p>
                  {q.detected_from_photo && (
                    <span className="flex-shrink-0 text-[9px] font-bold bg-green-500/15 text-green-500 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                      📷 Auto-detected
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {q.type === 'number' ? (
                    <div className="relative">
                      <input
                        type="number"
                        min={q.min || 0}
                        max={q.max || 1000}
                        step="0.1"
                        placeholder={`Enter ${q.unit || 'value'}`}
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                        className={`${INPUT_CLS}`}
                      />
                      {q.unit && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{q.unit}</span>
                      )}
                    </div>
                  ) : (q.options || []).map(opt => (
                    <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${answers[q.id] === opt ? 'border-green-500 bg-green-500/5' : 'border-[var(--border-card)] hover:border-green-500/30'}`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                        className="text-green-500 focus:ring-green-500 accent-green-500"
                      />
                      <span className="text-sm font-medium" style={{ color: answers[q.id] === opt ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={handleSubmitAnswers} className="w-full kd-btn-primary text-white font-bold py-3.5 rounded-xl sticky bottom-24 shadow-2xl z-10">
            Get Recommendation
          </button>
        </div>
      )}

      {/* STEP: RESULT */}
      {step === 'result' && recommendation && (
        <div className="space-y-6">
          <div className="text-center py-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-green-500 blur-[80px] opacity-20 pointer-events-none" />
            <p className="text-xs font-black text-green-500 uppercase tracking-widest mb-4 font-display">AI Recommendation</p>
            
            <div className="flex justify-center mb-6">
              <ProgressRing pct={recommendation.confidence * 100} size={120} stroke={8} label={`${recommendation.confidence * 100}% Match`} />
            </div>
            
            <h2 className="text-4xl font-black font-display tracking-tight capitalize" style={{ color: 'var(--text-primary)' }}>{recommendation.crop}</h2>
            <p className="text-sm mt-3 mx-auto max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Based on {location}'s climate and your farm profile, this offers the highest risk-adjusted return.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`${KD_CARD} p-4 flex items-center gap-3`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500 text-xl">💧</div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Water Needs</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{recommendation.metrics.water}</p>
              </div>
            </div>
            <div className={`${KD_CARD} p-4 flex items-center gap-3`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500 text-xl">⏱️</div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Duration</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{recommendation.metrics.duration}</p>
              </div>
            </div>
          </div>

          <div className={`${KD_CARD} p-5`}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3 font-display text-green-500">Why this crop?</p>
            <ul className="space-y-3">
              {recommendation.reasons.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={handleGeneratePlan} className="w-full kd-btn-primary text-white font-bold py-3.5 rounded-xl shadow-lg flex justify-center gap-2">
            Generate Cultivation Plan
          </button>
        </div>
      )}

      {/* STEP: DASHBOARD */}
      {step === 'dashboard' && plan && (
        <div className="flex-1 flex flex-col">
          {/* Dashboard Header */}
          <div className="p-5 rounded-2xl mb-6 relative overflow-hidden text-white shadow-xl"
               style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <CropBadge crop={recommendation?.crop} className="bg-white/20 text-white border-white/30" />
                </div>
                <h2 className="text-2xl font-black font-display leading-tight">{location}</h2>
                <p className="text-xs text-green-100 font-medium mt-1">Active Cultivation Plan</p>
              </div>
              <div className="text-center">
                <ProgressRing pct={getProgress()} size={56} stroke={4} color="#fff" label={`${getProgress()}%`} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b pb-0.5" style={{ borderColor: 'var(--border-subtle)' }}>
            {[
              { id: 'tasks', label: 'Tasks', icon: '📋' },
              { id: 'subsidies', label: 'Subsidies', icon: '🏛️' },
              { id: 'report', label: 'Report', icon: '📊' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold tracking-wide uppercase font-display relative transition-colors ${activeTab === tab.id ? 'text-green-500' : ''}`}
                style={{ color: activeTab === tab.id ? '#22c55e' : 'var(--text-muted)' }}
              >
                {tab.icon} {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-[-1.5px] left-0 w-full h-[3px] bg-green-500 rounded-t-full shadow-[0_-2px_10px_rgba(34,197,94,0.5)]" />
                )}
              </button>
            ))}
          </div>

          {/* TAB: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-6 flex-1 pb-4">
              <div className="relative">
                {/* Vertical Timeline Line */}
                <div className="absolute left-[19px] top-6 bottom-0 w-[2px] bg-green-500/20" />
                
                <div className="space-y-6">
                  {plan.map((week, wIdx) => {
                    const isCurrent = wIdx === 0; // Simple mock for current week
                    return (
                      <div key={wIdx} className="relative pl-12 pr-1">
                        {/* Timeline Node */}
                        <div className={`absolute left-0 top-1.5 w-10 h-10 rounded-full border-4 flex items-center justify-center font-bold text-xs bg-[var(--bg-base)] z-10 transition-colors ${
                          isCurrent ? 'border-green-500 text-green-500' : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                        }`}>
                          W{week.week}
                        </div>
                        
                        <div className={`${KD_CARD} p-4 ${isCurrent ? 'border-green-500/50 shadow-lg shadow-green-500/5' : ''}`}>
                          <h3 className="font-bold text-sm font-display mb-1" style={{ color: 'var(--text-primary)' }}>{week.title || week.stage || `Week ${week.week}`}</h3>
                          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{week.focus || week.weather_advisory || week.date_range || week.days_range || ''}</p>
                          
                          <div className="space-y-2.5">
                            {week.tasks.map((task, tIdx) => (
                              <div key={tIdx} 
                                   onClick={() => toggleTask(wIdx, tIdx)}
                                   className={`task-row-${wIdx}-${tIdx} flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                     task.completed ? 'border-green-500/30 bg-green-500/5' : 'border-[var(--border-card)] bg-[var(--bg-card-2)] hover:border-green-500/30'
                                   }`}>
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                                  task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--border-subtle)]'
                                }`}>
                                  {task.completed && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                                </div>
                                <span className={`text-sm leading-snug ${task.completed ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--text-primary)' }}>
                                  {task.desc}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SUBSIDIES */}
          {activeTab === 'subsidies' && (
            <div className="space-y-4 flex-1">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-2">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest font-display mb-1">Eligible Schemes</p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Based on your profile, you can apply for these government schemes.</p>
              </div>
              
              {mockSubsidies.map((sub, i) => (
                <div key={i} className={`${KD_CARD} p-4 hover:-translate-y-1 transition-transform group border-l-4 border-l-amber-500`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm font-display leading-tight pr-4" style={{ color: 'var(--text-primary)' }}>{sub.title}</h3>
                    <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-bold">Active</span>
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>{sub.desc}</p>
                  <a href={sub.link} className="text-xs font-bold text-amber-500 flex items-center gap-1 group-hover:text-amber-400">
                    Learn more & apply <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* TAB: REPORT */}
          {activeTab === 'report' && (
            <div className="space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className={`${KD_CARD} p-4 text-center`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Est. Yield</p>
                  <p className="text-xl font-black font-display text-green-500">2.4 <span className="text-sm font-medium opacity-70">Tons</span></p>
                </div>
                <div className={`${KD_CARD} p-4 text-center`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Projected ROI</p>
                  <p className="text-xl font-black font-display text-amber-500">145<span className="text-sm font-medium opacity-70">%</span></p>
                </div>
              </div>
              
              <div className={`${KD_CARD} p-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-green-500/5`}>
                <h3 className="font-bold font-display mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span>🏆</span> Achievements
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)]">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-lg shadow-[0_0_10px_rgba(245,158,11,0.3)]">⭐</div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Smart Planner</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Generated first AI plan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] opacity-50 grayscale">
                    <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center text-lg">🔒</div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Perfect Week</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Complete all tasks in a week</p>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => setStep('intro')} className="w-full py-3 text-xs font-bold mt-4" style={{ color: 'var(--text-muted)' }}>
                Restart Journey
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
