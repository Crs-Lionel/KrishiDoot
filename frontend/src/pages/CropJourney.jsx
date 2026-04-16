import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import { ErrorAlert, SpinnerIcon } from '../components/ui.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const CROP_EMOJI = {
  wheat: '🌾', rice: '🍚', tomato: '🍅', onion: '🧅', potato: '🥔',
  cotton: '🌿', maize: '🌽', soybean: '🫘', mustard: '🌼', gram: '🫛',
  sugarcane: '🍬', groundnut: '🥜',
}
const cropEmoji = (c) => CROP_EMOJI[c?.toLowerCase()] || '🌱'

const TASK_CLR = {
  sowing: 'text-amber-400', irrigation: 'text-blue-400',
  fertilizer: 'text-green-400', pesticide: 'text-red-400',
  weeding: 'text-yellow-400', observation: 'text-purple-400', harvest: 'text-orange-400',
}
const TASK_ICON = {
  sowing: '🌱', irrigation: '💧', fertilizer: '⚗️',
  pesticide: '🧪', weeding: '✂️', observation: '👁️', harvest: '🌾',
}

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

const IRRIGATION = ['Nalkoop (Borewell)', 'Nahar (Canal)', 'Barish par nirbhar (Rain-fed)', 'Talab / Pond', 'Drip System', 'Sprinkler']

const CARD = 'bg-gray-800/60 rounded-xl border border-gray-700/40 p-4'
const BTN_PRI = 'w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50'
const BTN_SEC = 'bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition text-sm'
const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition'
const SELECT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition'

function calcCurrentWeek(sowingDate, totalWeeks) {
  const sow = new Date(sowingDate)
  const days = Math.floor((Date.now() - sow) / 86400000)
  return Math.max(1, Math.min(Math.ceil(days / 7) || 1, totalWeeks))
}

export default function CropJourney() {
  const [mode, setMode] = useState('intro')   // intro|questions|recommendation|starting|dashboard|report
  const [location, setLocation] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [landB64, setLandB64] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [rec, setRec] = useState(null)
  const [weather, setWeather] = useState(null)
  const [selCrop, setSelCrop] = useState('')
  const [sowDate, setSowDate] = useState('')
  const [landSize, setLandSize] = useState('')
  const [irrigation, setIrrigation] = useState('Nalkoop (Borewell)')
  const [journey, setJourney] = useState(null)
  const [activeTab, setActiveTab] = useState('tasks')
  const [subsidies, setSubsidies] = useState([])
  const [subLoading, setSubLoading] = useState(false)
  const [wxData, setWxData] = useState(null)
  const [photoModal, setPhotoModal] = useState(false)
  const [photoResult, setPhotoResult] = useState(null)
  const [photoWeek, setPhotoWeek] = useState(1)
  const [photoStage, setPhotoStage] = useState('')
  const [completeModal, setCompleteModal] = useState(false)
  const [sellPrice, setSellPrice] = useState('')
  const [qtySold, setQtySold] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const landRef = useRef(null)
  const cropPhotoRef = useRef(null)

  useEffect(() => {
    const id = localStorage.getItem('kd_journey_id')
    if (id) loadJourney(id)
  }, [])

  async function loadJourney(id) {
    try {
      const r = await axios.get(`${API}/crop-journey/${id}`)
      setJourney(r.data)
      setMode(r.data.status === 'completed' ? 'report' : 'dashboard')
    } catch {
      localStorage.removeItem('kd_journey_id')
    }
  }

  function handleLandPhoto(e) {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => setLandB64(ev.target.result.split(',')[1])
    reader.readAsDataURL(f)
  }

  async function fetchQuestions() {
    if (!location.trim()) { setErr('Location daale (e.g. Pune, Maharashtra)'); return }
    setLoading(true); setErr('')
    try {
      const r = await axios.post(`${API}/crop-journey/questions`, { location, month, land_photo_b64: landB64 })
      setQuestions(r.data.questions)
      setMode('questions')
    } catch { setErr('Questions load nahi hue. Try again.') }
    finally { setLoading(false) }
  }

  async function submitAnswers() {
    const unanswered = questions.filter(q => answers[q.id] === undefined || answers[q.id] === '')
    if (unanswered.length > 0) { setErr(`${unanswered.length} sawaalon ka jawab de`); return }
    setLoading(true); setErr('')
    try {
      const r = await axios.post(`${API}/crop-journey/analyze`, { location, month, answers, land_photo_b64: landB64 })
      setRec(r.data.recommendation)
      setWeather(r.data.weather)
      setSelCrop(r.data.recommendation.recommended_crop)
      setMode('recommendation')
    } catch { setErr('Analysis fail hua. Try again.') }
    finally { setLoading(false) }
  }

  async function startJourney() {
    if (!sowDate) { setErr('Beejai ki tarikh daale'); return }
    if (!landSize || isNaN(parseFloat(landSize))) { setErr('Zameen ka size daale (acres mein)'); return }
    setMode('starting'); setErr('')
    try {
      const r = await axios.post(`${API}/crop-journey/start`, {
        location, crop_type: selCrop, sowing_date: sowDate,
        land_size_acres: parseFloat(landSize), irrigation_type: irrigation,
        answers, farmer_id: 'farmer_1',
      }, { timeout: 90000 })
      localStorage.setItem('kd_journey_id', r.data.journey_id)
      await loadJourney(r.data.journey_id)
    } catch { setErr('Journey shuru nahi ho saki. Try again.'); setMode('recommendation') }
  }

  async function toggleTask(taskId) {
    if (!journey) return
    const done = journey.completed_tasks.includes(taskId)
    try {
      const r = await axios.post(`${API}/crop-journey/${journey.journey_id}/task`, { task_id: taskId, completed: !done })
      setJourney(prev => ({
        ...prev,
        completed_tasks: !done
          ? [...prev.completed_tasks, taskId]
          : prev.completed_tasks.filter(id => id !== taskId),
        tasks_completed: r.data.tasks_completed,
      }))
    } catch {}
  }

  async function loadSubsidies() {
    if (subsidies.length > 0 || !journey) return
    setSubLoading(true)
    try {
      const r = await axios.get(`${API}/crop-journey/${journey.journey_id}/subsidies`)
      setSubsidies(r.data.alerts)
    } catch {}
    finally { setSubLoading(false) }
  }

  async function loadWeather() {
    if (wxData || !journey) return
    try {
      const r = await axios.get(`${API}/crop-journey/${journey.journey_id}/weather`)
      setWxData(r.data)
    } catch {}
  }

  useEffect(() => {
    if (activeTab === 'subsidies') loadSubsidies()
    if (activeTab === 'weather') loadWeather()
  }, [activeTab])

  function handleCropPhoto(e) {
    const f = e.target.files[0]
    if (!f || !journey) return
    setLoading(true)
    const reader = new FileReader()
    reader.onload = async ev => {
      const b64 = ev.target.result.split(',')[1]
      try {
        const r = await axios.post(`${API}/crop-journey/${journey.journey_id}/photo-check`, {
          photo_b64: b64, week: photoWeek, stage: photoStage,
        })
        setPhotoResult(r.data)
        setPhotoModal(true)
      } catch { setErr('Photo analysis fail hua') }
      finally { setLoading(false) }
    }
    reader.readAsDataURL(f)
  }

  async function completeJourney() {
    if (!sellPrice) { setErr('Selling price daale'); return }
    setLoading(true)
    try {
      const r = await axios.post(`${API}/crop-journey/${journey.journey_id}/complete`, {
        selling_price_per_kg: parseFloat(sellPrice),
        quantity_sold_kg: qtySold ? parseFloat(qtySold) : null,
        final_grade: journey.final_grade || 'B',
      })
      setJourney(prev => ({ ...prev, status: 'completed', report: r.data.report, selling_price_per_kg: parseFloat(sellPrice) }))
      setCompleteModal(false)
      setMode('report')
    } catch { setErr('Complete nahi ho saka') }
    finally { setLoading(false) }
  }

  function downloadReport() {
    if (!journey?.report) return
    const rpt = journey.report
    const doc = new jsPDF()
    doc.setFillColor(22, 101, 52)
    doc.rect(0, 0, 210, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16); doc.text('KrishiDoot.AI — Farming Journey Report', 14, 16)
    doc.setTextColor(0, 0, 0); doc.setFontSize(11)
    let y = 36
    doc.text(`Fasal: ${journey.crop_type} | Jagah: ${journey.location}`, 14, y); y += 7
    doc.text(`Beejai: ${journey.sowing_date} | Zameen: ${journey.land_size_acres} acres`, 14, y); y += 7
    doc.text(`Tasks: ${journey.tasks_completed}/${journey.tasks_total} complete`, 14, y); y += 12
    doc.setFontSize(13); doc.text('Financial Summary', 14, y); y += 8
    doc.setFontSize(11)
    doc.text(`Total Kharcha: ${rpt.total_cost_estimate}`, 14, y); y += 7
    doc.text(`Net Profit: ${rpt.net_profit_estimate}`, 14, y); y += 7
    doc.text(`Paidawar: ${rpt.yield_achieved}`, 14, y); y += 7
    if (journey.selling_price_per_kg) { doc.text(`Bikri Bhav: ₹${journey.selling_price_per_kg}/kg`, 14, y); y += 7 }
    if (journey.total_income) { doc.text(`Kul Aay: ₹${journey.total_income}`, 14, y); y += 7 }
    y += 4
    doc.setFontSize(13); doc.text('Highlights', 14, y); y += 8
    doc.setFontSize(11)
    rpt.highlights?.forEach(h => { doc.text(`• ${h}`, 14, y); y += 7 })
    y += 4
    doc.setFontSize(13); doc.text('Seekhe Hue Sabak', 14, y); y += 8
    doc.setFontSize(11)
    rpt.lessons?.forEach(l => { doc.text(`• ${l}`, 14, y); y += 7 })
    y += 4
    doc.setFontSize(11); doc.text(`Agla Sezon: ${rpt.next_season_tip}`, 14, y)
    const dt = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    doc.save(`KrishiDoot-Journey-${journey.crop_type}-${dt}.pdf`)
  }

  function resetJourney() {
    localStorage.removeItem('kd_journey_id')
    setJourney(null); setMode('intro'); setRec(null); setWeather(null)
    setQuestions([]); setAnswers({}); setSubsidies([]); setWxData(null)
    setPhotoResult(null); setErr('')
  }

  // ──────────────────── RENDER ────────────────────

  if (mode === 'intro') return (
    <div className="py-6 space-y-5">
      <div className="text-center space-y-2">
        <div className="text-5xl">🌾</div>
        <h1 className="text-2xl font-bold text-white">Fasal Journey</h1>
        <p className="text-gray-400 text-sm">Beejai se bikri tak — poori kheti track karo</p>
      </div>

      <div className={CARD + ' space-y-4'}>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Aapka Gaon / Sheher</label>
          <input className={INPUT} placeholder="e.g. Pune, Maharashtra" value={location} onChange={e => setLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchQuestions()} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Abhi Kaunsa Mahina Hai?</label>
          <select className={SELECT} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Zameen Ki Photo (Optional)</label>
          <input ref={landRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleLandPhoto} />
          <button onClick={() => landRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-600 hover:border-green-500 rounded-xl py-4 text-center transition">
            {landB64
              ? <span className="text-green-400 text-sm font-medium">✓ Photo ready — AI mitti analyse karega</span>
              : <span className="text-gray-500 text-sm">📸 Apni zameen ki photo lo (AI mitti analyze karega)</span>}
          </button>
        </div>
      </div>

      <ErrorAlert error={err} />

      <button className={BTN_PRI} onClick={fetchQuestions} disabled={loading}>
        {loading ? <><SpinnerIcon /> Loading...</> : 'Aage Bado →'}
      </button>

      <div className="grid grid-cols-3 gap-2 pt-2">
        {[['🌤️', 'Mausam Forecast'], ['🏛️', 'Govt Subsidies'], ['📄', 'Journey Report']].map(([icon, label]) => (
          <div key={label} className="bg-gray-800/40 rounded-xl p-3 text-center border border-gray-700/30">
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-[10px] text-gray-400 leading-tight">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )

  if (mode === 'questions') return (
    <div className="py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setMode('intro')} className="text-gray-400 hover:text-white transition">←</button>
        <div>
          <h2 className="text-lg font-bold text-white">Kuch Sawaal</h2>
          <p className="text-gray-500 text-xs">{location} • AI aapki zameen samjhega</p>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className={CARD + ' space-y-2'}>
            <label className="text-sm font-medium text-white">
              <span className="text-green-400 mr-2">{i + 1}.</span>{q.question}
            </label>
            {q.type === 'choice' && (
              <div className="grid grid-cols-2 gap-1.5">
                {q.options.map(opt => (
                  <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                    className={`text-xs py-2 px-3 rounded-lg border text-left transition ${
                      answers[q.id] === opt
                        ? 'bg-green-600/20 border-green-500/60 text-green-300'
                        : 'bg-gray-700/40 border-gray-600/40 text-gray-300 hover:border-gray-500'
                    }`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {q.type === 'number' && (
              <div className="flex items-center gap-2">
                <input type="number" min={q.min || 0} max={q.max || 9999} step="0.1"
                  className={INPUT} placeholder={`Enter in ${q.unit || ''}`}
                  value={answers[q.id] || ''}
                  onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} />
                {q.unit && <span className="text-gray-400 text-sm whitespace-nowrap">{q.unit}</span>}
              </div>
            )}
            {q.type === 'text' && (
              <input className={INPUT} placeholder="Jawab likhe..."
                value={answers[q.id] || ''}
                onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} />
            )}
          </div>
        ))}
      </div>

      <ErrorAlert error={err} />
      <button className={BTN_PRI} onClick={submitAnswers} disabled={loading}>
        {loading ? <><SpinnerIcon /> AI Analyze Kar Raha Hai...</> : 'Submit Karo →'}
      </button>
    </div>
  )

  if (mode === 'recommendation') return (
    <div className="py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setMode('questions')} className="text-gray-400 hover:text-white transition">←</button>
        <div>
          <h2 className="text-lg font-bold text-white">AI Salah</h2>
          <p className="text-gray-500 text-xs">{location}</p>
        </div>
      </div>

      {rec && (
        <>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{cropEmoji(rec.recommended_crop)}</span>
              <div>
                <div className="text-white font-bold text-lg capitalize">{rec.recommended_crop}</div>
                <div className="text-green-400 text-xs">AI Confidence: {rec.confidence}%</div>
              </div>
            </div>
            <p className="text-gray-300 text-sm">{rec.why_this_crop}</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-gray-800/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Expected Yield</div>
                <div className="text-green-400 font-semibold text-sm">{rec.expected_yield_per_acre}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2">
                <div className="text-xs text-gray-400">Expected Income</div>
                <div className="text-green-400 font-semibold text-sm">{rec.expected_income_per_acre}</div>
              </div>
            </div>
            {rec.best_sowing_window && (
              <div className="text-xs text-amber-400">⏰ Best Sowing: {rec.best_sowing_window}</div>
            )}
          </div>

          {rec.alternative_crops?.length > 0 && (
            <div className={CARD}>
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Doosre Vikalp</div>
              <div className="flex gap-2 flex-wrap">
                {[rec.recommended_crop, ...rec.alternative_crops].map(c => (
                  <button key={c} onClick={() => setSelCrop(c)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition ${
                      selCrop === c
                        ? 'bg-green-600/20 border-green-500 text-green-300'
                        : 'bg-gray-700/40 border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}>
                    {cropEmoji(c)} <span className="capitalize">{c}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {rec.key_risks?.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-1">
              <div className="text-xs text-amber-400 font-semibold uppercase">⚠️ Khatre</div>
              {rec.key_risks.map(r => <div key={r} className="text-gray-300 text-sm">• {r}</div>)}
            </div>
          )}

          <div className={CARD + ' space-y-3'}>
            <div className="text-sm font-semibold text-white">Journey Shuru Karo</div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Beejai Ki Tarikh</label>
              <input type="date" className={INPUT} value={sowDate} onChange={e => setSowDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Zameen Ka Size (Acres)</label>
              <input type="number" step="0.1" min="0.1" className={INPUT} placeholder="e.g. 2.5"
                value={landSize} onChange={e => setLandSize(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Pani Ka Source</label>
              <select className={SELECT} value={irrigation} onChange={e => setIrrigation(e.target.value)}>
                {IRRIGATION.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </>
      )}

      <ErrorAlert error={err} />
      <button className={BTN_PRI} onClick={startJourney} disabled={loading}>
        🌱 Journey Shuru Karo
      </button>
    </div>
  )

  if (mode === 'starting') return (
    <div className="py-20 flex flex-col items-center gap-6 text-center">
      <div className="text-6xl animate-bounce">{cropEmoji(selCrop)}</div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">Task Calendar Ban Raha Hai</h2>
        <p className="text-gray-400 text-sm">AI {selCrop} ke liye poori farming plan bana raha hai...</p>
        <p className="text-gray-500 text-xs">Iska 20-30 second lag sakta hai</p>
      </div>
      <SpinnerIcon />
    </div>
  )

  if (mode === 'report' && journey) {
    const rpt = journey.report
    return (
      <div className="py-6 space-y-4">
        <div className="text-center space-y-1">
          <div className="text-4xl">🏆</div>
          <h2 className="text-xl font-bold text-white">Journey Poori!</h2>
          <p className="text-gray-400 text-sm capitalize">{cropEmoji(journey.crop_type)} {journey.crop_type} • {journey.location}</p>
        </div>

        {rpt && (
          <>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-gray-200 text-sm">{rpt.summary_hinglish}</p>
              {rpt.care_score && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${rpt.care_score}%` }} />
                  </div>
                  <span className="text-green-400 text-xs font-bold">{rpt.care_score}/100 Care Score</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                ['Kul Kharcha', rpt.total_cost_estimate, 'text-red-400'],
                ['Net Profit', rpt.net_profit_estimate, 'text-green-400'],
                ['Paidawar', rpt.yield_achieved, 'text-blue-400'],
                ['Bikri Bhav', journey.selling_price_per_kg ? `₹${journey.selling_price_per_kg}/kg` : '—', 'text-amber-400'],
              ].map(([label, val, clr]) => (
                <div key={label} className={CARD + ' text-center'}>
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className={`font-bold text-sm ${clr}`}>{val}</div>
                </div>
              ))}
            </div>

            {rpt.highlights?.length > 0 && (
              <div className={CARD + ' space-y-1'}>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">✨ Highlights</div>
                {rpt.highlights.map(h => <div key={h} className="text-gray-300 text-sm">• {h}</div>)}
              </div>
            )}

            {rpt.lessons?.length > 0 && (
              <div className={CARD + ' space-y-1'}>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">📚 Seekhe Hue Sabak</div>
                {rpt.lessons.map(l => <div key={l} className="text-gray-300 text-sm">• {l}</div>)}
              </div>
            )}

            {rpt.next_season_tip && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <div className="text-xs text-blue-400 font-semibold mb-1">🔭 Agle Sezon Ki Salah</div>
                <p className="text-gray-300 text-sm">{rpt.next_season_tip}</p>
              </div>
            )}
          </>
        )}

        <button className={BTN_PRI} onClick={downloadReport}>
          📄 PDF Report Download Karo
        </button>
        <button onClick={resetJourney} className="w-full text-center text-gray-500 text-sm hover:text-gray-300 transition py-2">
          Nayi Journey Shuru Karo
        </button>
      </div>
    )
  }

  if (mode === 'dashboard' && journey) {
    const curWeek = calcCurrentWeek(journey.sowing_date, journey.total_weeks)
    const curWeekData = journey.task_calendar?.find(w => w.week === curWeek) || journey.task_calendar?.[0]
    const progress = journey.tasks_total > 0 ? Math.round((journey.tasks_completed / journey.tasks_total) * 100) : 0
    const photoTask = curWeekData?.tasks?.find(t => t.photo_needed)

    return (
      <div className="py-4 space-y-4">
        {/* Header */}
        <div className={CARD + ' space-y-2'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{cropEmoji(journey.crop_type)}</span>
              <div>
                <div className="text-white font-bold capitalize">{journey.crop_type}</div>
                <div className="text-gray-400 text-xs">{journey.location}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-green-400 font-bold text-sm">Week {curWeek}/{journey.total_weeks}</div>
              <div className="text-gray-400 text-xs">{curWeekData?.stage}</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress</span><span>{progress}% ({journey.tasks_completed}/{journey.tasks_total})</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-800/60 rounded-xl p-1 border border-gray-700/40">
          {[['tasks', '📋 Tasks'], ['weather', '🌤️ Mausam'], ['subsidies', '🏛️ Sahayata'], ['timeline', '📅 Timeline']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition ${
                activeTab === tab ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <ErrorAlert error={err} />

        {/* Tasks Tab */}
        {activeTab === 'tasks' && curWeekData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">Week {curWeekData.week} — {curWeekData.stage}</div>
                <div className="text-gray-400 text-xs">{curWeekData.days_range}</div>
              </div>
              {photoTask && (
                <>
                  <button onClick={() => { setPhotoWeek(curWeek); setPhotoStage(curWeekData.stage); cropPhotoRef.current?.click() }}
                    className="bg-purple-600/20 border border-purple-500/40 text-purple-400 text-xs px-3 py-1.5 rounded-lg hover:bg-purple-600/30 transition flex items-center gap-1" disabled={loading}>
                    {loading ? <SpinnerIcon /> : '📸'} Photo Check
                  </button>
                  <input ref={cropPhotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCropPhoto} />
                </>
              )}
            </div>

            <div className="space-y-2">
              {curWeekData.tasks?.map(task => {
                const done = journey.completed_tasks.includes(task.task_id)
                return (
                  <div key={task.task_id}
                    onClick={() => toggleTask(task.task_id)}
                    className={`${CARD} cursor-pointer transition-all ${done ? 'opacity-60 bg-green-900/20' : 'hover:border-gray-600'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                        done ? 'bg-green-600 border-green-600' : 'border-gray-500'
                      }`}>
                        {done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">{TASK_ICON[task.category] || '📌'} {task.title}</span>
                          {task.critical && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Critical</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{task.desc}</p>
                        {(task.water_liters_per_acre > 0 || task.inputs?.length > 0) && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {task.water_liters_per_acre > 0 && (
                              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                💧 {task.water_liters_per_acre.toLocaleString()}L/acre
                              </span>
                            )}
                            {task.inputs?.map(inp => (
                              <span key={inp.name} className="text-[10px] bg-gray-700/60 text-gray-300 border border-gray-600/40 px-1.5 py-0.5 rounded">
                                {inp.name}: {inp.quantity} {inp.cost_approx && `(${inp.cost_approx})`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Week navigation */}
            <div className="flex gap-2 pt-2">
              {curWeek === journey.total_weeks ? (
                <button onClick={() => setCompleteModal(true)}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
                  🏆 Journey Complete Karo
                </button>
              ) : (
                <div className="text-xs text-gray-500 text-center w-full py-2">
                  Journey auto-advances with sowing date. Sowing: {journey.sowing_date}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weather Tab */}
        {activeTab === 'weather' && (
          <div className="space-y-3">
            {!wxData && <div className="text-center py-8 text-gray-500 text-sm"><SpinnerIcon /></div>}
            {wxData?.current && (
              <>
                <div className={CARD + ' space-y-3'}>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Abhi Ka Mausam — {wxData.location}</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-bold text-white">{wxData.current.temp_c}°C</div>
                      <div className="text-gray-400 text-sm">{wxData.current.desc}</div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-xs text-gray-400">Nami: <span className="text-blue-400">{wxData.current.humidity}%</span></div>
                      <div className="text-xs text-gray-400">Hawa: <span className="text-gray-200">{wxData.current.wind_kmph} km/h</span></div>
                      <div className="text-xs text-gray-400">Feels: <span className="text-gray-200">{wxData.current.feels_like_c}°C</span></div>
                    </div>
                  </div>
                  {wxData.advisory && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                      <p className="text-amber-300 text-xs">⚠️ {wxData.advisory}</p>
                    </div>
                  )}
                </div>

                {wxData.forecast?.length > 0 && (
                  <div className={CARD + ' space-y-2'}>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Agle {wxData.forecast.length} Din</div>
                    {wxData.forecast.map(d => (
                      <div key={d.date} className="flex items-center justify-between py-1.5 border-b border-gray-700/40 last:border-0">
                        <div className="text-xs text-gray-300 w-24">{d.date}</div>
                        <div className="text-xs text-gray-300 flex-1">{d.desc}</div>
                        <div className="text-xs text-right">
                          <span className="text-orange-400">{d.max_c}°</span>
                          <span className="text-gray-500"> / </span>
                          <span className="text-blue-400">{d.min_c}°</span>
                          {d.precip_mm > 0 && <span className="ml-1 text-blue-300">💧{d.precip_mm}mm</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {wxData?.error && <div className="text-center text-gray-500 text-sm py-8">Weather unavailable: {wxData.error}</div>}
          </div>
        )}

        {/* Subsidies Tab */}
        {activeTab === 'subsidies' && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400">Govt schemes for {journey.crop_type} farmers</div>
            {subLoading && <div className="text-center py-8"><SpinnerIcon /></div>}
            {!subLoading && subsidies.length === 0 && (
              <div className={CARD + ' text-center py-6'}>
                <div className="text-2xl mb-2">🏛️</div>
                <p className="text-gray-400 text-sm">Abhi koi active scheme nahi mila</p>
                <p className="text-gray-500 text-xs mt-1">Check back later — RSS feeds refresh hourly</p>
              </div>
            )}
            {subsidies.map((s, i) => (
              <div key={i} className={CARD + ' space-y-2'}>
                <div className="text-xs text-green-400 font-semibold uppercase">{s.source}</div>
                <div className="text-sm font-medium text-white">{s.title}</div>
                {s.summary && <p className="text-xs text-gray-400 line-clamp-3">{s.summary}</p>}
                <div className="flex items-center justify-between">
                  {s.published && <div className="text-[10px] text-gray-500">{s.published}</div>}
                  {s.link && (
                    <a href={s.link} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-green-400 hover:text-green-300 transition">Aur Padhe →</a>
                  )}
                </div>
              </div>
            ))}
            <div className="text-center">
              <a href="https://pmkisan.gov.in" target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300">PM-KISAN Portal →</a>
              {' | '}
              <a href="https://pmfby.gov.in" target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300">Fasal Bima →</a>
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-2">Poori Journey — {journey.total_weeks} hafte</div>
            {journey.task_calendar?.map(week => {
              const weekDone = week.tasks?.filter(t => journey.completed_tasks.includes(t.task_id)).length || 0
              const weekTotal = week.tasks?.length || 1
              const weekProgress = Math.round((weekDone / weekTotal) * 100)
              const isCurrent = week.week === curWeek
              return (
                <div key={week.week} className={`${CARD} ${isCurrent ? 'border-green-500/40 bg-green-900/10' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {isCurrent && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
                      <span className="text-sm text-white font-medium">Week {week.week}</span>
                      <span className="text-xs text-gray-400">{week.stage}</span>
                    </div>
                    <span className="text-xs text-gray-400">{weekDone}/{weekTotal}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div className={`h-1 rounded-full transition-all ${weekProgress === 100 ? 'bg-green-500' : isCurrent ? 'bg-amber-500' : 'bg-gray-600'}`}
                      style={{ width: `${weekProgress}%` }} />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">{week.days_range}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Photo analysis modal */}
        {photoModal && photoResult && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
            <div className="bg-gray-900 border-t border-gray-700 rounded-t-2xl w-full p-5 space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Crop Health Report</h3>
                <button onClick={() => setPhotoModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold ${photoResult.health_score >= 75 ? 'text-green-400' : photoResult.health_score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {photoResult.health_score}
                </div>
                <div>
                  <div className="text-white font-medium capitalize">{photoResult.status?.replace(/_/g, ' ')}</div>
                  <div className="text-gray-400 text-xs">Health Score</div>
                </div>
              </div>
              <div className="space-y-1">
                {photoResult.observations?.map(o => <div key={o} className="text-gray-300 text-sm">• {o}</div>)}
              </div>
              {photoResult.immediate_action && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="text-xs text-amber-400 font-semibold mb-1">Abhi Kya Kare</div>
                  <p className="text-gray-200 text-sm">{photoResult.immediate_action}</p>
                </div>
              )}
              {photoResult.subsidy_claim_tip && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="text-xs text-blue-400 font-semibold mb-1">🏛️ Subsidy Tip</div>
                  <p className="text-gray-200 text-sm">{photoResult.subsidy_claim_tip}</p>
                </div>
              )}
              <button onClick={() => setPhotoModal(false)} className={BTN_PRI}>Theek Hai</button>
            </div>
          </div>
        )}

        {/* Complete journey modal */}
        {completeModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
            <div className="bg-gray-900 border-t border-gray-700 rounded-t-2xl w-full p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Journey Complete Karo</h3>
                <button onClick={() => setCompleteModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bikri Ka Bhav (₹/kg)</label>
                <input type="number" step="0.5" min="0" className={INPUT} placeholder="e.g. 22.50"
                  value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Total Qty Becha (kg) — Optional</label>
                <input type="number" step="1" min="0" className={INPUT} placeholder="e.g. 2500"
                  value={qtySold} onChange={e => setQtySold(e.target.value)} />
              </div>
              <ErrorAlert error={err} />
              <button className={BTN_PRI} onClick={completeJourney} disabled={loading}>
                {loading ? <><SpinnerIcon /> Report Ban Raha Hai...</> : '🏆 Poori Karo & Report Dekho'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
