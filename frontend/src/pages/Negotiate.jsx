import { useState, useRef, useEffect, useCallback } from 'react'
import { jsPDF } from 'jspdf'
import axios from 'axios'
import { INPUT_CLS, SELECT_CLS, ErrorAlert, SpinnerIcon } from '../components/ui.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const CROPS = [
  { value: 'tomato',    label: 'Tomato',    perishable: true  },
  { value: 'onion',     label: 'Onion',     perishable: true  },
  { value: 'potato',    label: 'Potato',    perishable: false },
  { value: 'wheat',     label: 'Wheat',     perishable: false },
  { value: 'rice',      label: 'Rice',      perishable: false },
  { value: 'maize',     label: 'Maize',     perishable: false },
  { value: 'soybean',   label: 'Soybean',   perishable: false },
  { value: 'cotton',    label: 'Cotton',    perishable: false },
  { value: 'sugarcane', label: 'Sugarcane', perishable: false },
]

const GRADE_STYLE = {
  A: { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Premium', multiplier: '1.25×' },
  B: { text: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',     label: 'Standard', multiplier: '1.15×' },
  C: { text: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',         label: 'Below Standard', multiplier: '1.05×' },
}

const STATUS_DOT = { ongoing: 'bg-blue-400', agreed: 'bg-emerald-400', rejected: 'bg-red-400' }

// ── Icons ─────────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  )
}

function MicIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  )
}

function SpeakerIcon({ muted }) {
  return muted ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.395C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

// ── PDF Receipt ───────────────────────────────────────────────────────────────

function downloadReceipt(sessions, preGrade) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const receiptNo = `KD-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(now.getTime()).slice(-4)}`

  // Header
  doc.setFillColor(21, 128, 61)
  doc.rect(0, 0, W, 36, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('KrishiDoot.AI', 14, 16)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Digital Fiduciary — Fair Prices for Every Indian Farmer', 14, 24)
  doc.text(`Receipt No: ${receiptNo}  |  Date: ${dateStr}  |  Time: ${timeStr}`, 14, 31)

  // Title
  doc.setTextColor(17, 24, 39)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('Negotiation Receipt', 14, 50)

  // Grade badge (if available)
  let y = 58
  if (preGrade) {
    const gradeColors = { A: [21, 128, 61], B: [217, 119, 6], C: [220, 38, 38] }
    const [r, g, b] = gradeColors[preGrade.grade] || [100, 100, 100]
    doc.setFillColor(r, g, b)
    doc.setTextColor(255, 255, 255)
    doc.roundedRect(14, y, 36, 8, 1.5, 1.5, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`Grade ${preGrade.grade} — ${preGrade.estimated_price_band}`, 16, y + 5.5)
    doc.setTextColor(17, 24, 39)
    y += 14
  }

  // Section line
  doc.setDrawColor(209, 213, 219)
  doc.setLineWidth(0.3)
  doc.line(14, y, W - 14, y)
  y += 6

  // Table header
  doc.setFillColor(249, 250, 251)
  doc.rect(14, y, W - 28, 8, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(107, 114, 128)
  doc.text('CROP', 16, y + 5.5)
  doc.text('LOCATION', 52, y + 5.5)
  doc.text('GRADE', 98, y + 5.5)
  doc.text('QTY', 118, y + 5.5)
  doc.text('UNIT PRICE', 135, y + 5.5)
  doc.text('TOTAL', 165, y + 5.5)
  doc.text('RESULT', 183, y + 5.5)
  y += 10

  // Table rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  let totalRevenue = 0
  sessions.forEach((s, i) => {
    const finalPrice = s.messages.filter(m => m.role === 'agent').at(-1)?.price ?? s.initial_ask
    const total = finalPrice * s.quantity_kg
    const grade = preGrade?.grade || '—'
    if (s.status === 'agreed') totalRevenue += total

    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(14, y - 2, W - 28, 9, 'F')
    }
    doc.setTextColor(17, 24, 39)
    doc.text(s.cropLabel, 16, y + 4)
    doc.text(s.mandi_location.slice(0, 20), 52, y + 4)
    doc.text(grade, 98, y + 4)
    doc.text(`${s.quantity_kg} kg`, 118, y + 4)
    doc.text(`Rs.${finalPrice}/kg`, 135, y + 4)
    doc.text(`Rs.${total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 165, y + 4)
    if (s.status === 'agreed') {
      doc.setTextColor(21, 128, 61)
      doc.setFont('helvetica', 'bold')
      doc.text('AGREED', 183, y + 4)
    } else {
      doc.setTextColor(220, 38, 38)
      doc.setFont('helvetica', 'normal')
      doc.text('NO DEAL', 183, y + 4)
    }
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(17, 24, 39)
    y += 10
  })

  // Line
  doc.setDrawColor(209, 213, 219)
  doc.line(14, y, W - 14, y)
  y += 8

  // Summary
  const agreedSessions = sessions.filter(s => s.status === 'agreed')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text('Summary', 14, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(75, 85, 99)
  doc.text(`Sessions completed:  ${sessions.length}`, 14, y);   y += 5
  doc.text(`Deals agreed:        ${agreedSessions.length} of ${sessions.length}`, 14, y);  y += 5

  if (sessions[0]?.batna_price) {
    doc.text(`BATNA (floor price): Rs.${sessions[0].batna_price}/kg`, 14, y);  y += 5
  }

  // Total revenue highlighted
  y += 3
  doc.setFillColor(240, 253, 244)
  doc.setDrawColor(21, 128, 61)
  doc.setLineWidth(0.5)
  doc.roundedRect(14, y, W - 28, 12, 2, 2, 'FD')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(21, 128, 61)
  doc.text(`Total Revenue: Rs.${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 18, y + 8)
  y += 20

  // Footer
  doc.setDrawColor(209, 213, 219)
  doc.line(14, y, W - 14, y)
  y += 6
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(156, 163, 175)
  doc.text('Generated by KrishiDoot.AI — AI-assisted negotiation record. Not a legal document.', 14, y)
  doc.text('For disputes, refer to official APMC records.', 14, y + 5)

  doc.save(`KrishiDoot-Receipt-${receiptNo}.pdf`)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Negotiate() {
  const [step, setStep]                   = useState('setup')
  const [cropRows, setCropRows]           = useState([
    { id: 1, crop_type: 'tomato', quantity_kg: 100, mandi_location: 'Bengaluru, Karnataka' }
  ])
  const [nextId, setNextId]               = useState(2)
  const [preGrade, setPreGrade]           = useState(null)
  const [sessions, setSessions]           = useState([])
  const [activeTab, setActiveTab]         = useState(0)
  const [voiceOn, setVoiceOn]             = useState(true)
  const [listening, setListening]         = useState(false)
  const [startLoading, setStartLoading]   = useState(false)
  const [startError, setStartError]       = useState(null)
  const [autoStartPending, setAutoStartPending] = useState(false)
  const chatRef        = useRef(null)
  const recognitionRef = useRef(null)

  // Load grade context from Grade page
  useEffect(() => {
    const stored   = localStorage.getItem('kd_grade')
    const autoFlag = localStorage.getItem('kd_autostart') === '1'

    if (stored) {
      try {
        const { grade, crop_type } = JSON.parse(stored)
        setPreGrade(grade)
        setCropRows([{ id: 1, crop_type: crop_type || 'tomato', quantity_kg: 100, mandi_location: 'Bengaluru, Karnataka' }])
      } catch (_) {}
      localStorage.removeItem('kd_grade')
    }
    if (autoFlag) {
      localStorage.removeItem('kd_autostart')
      setAutoStartPending(true)
    }
  }, [])

  // Auto-start — fires after cropRows state has settled (next render cycle)
  useEffect(() => {
    if (autoStartPending) {
      setAutoStartPending(false)
      startAll()
    }
  }, [autoStartPending]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [sessions, activeTab])

  // TTS
  const speak = useCallback((text) => {
    if (!voiceOn || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'hi-IN'
    utt.rate = 0.88
    window.speechSynthesis.speak(utt)
  }, [voiceOn])

  useEffect(() => {
    const active = sessions[activeTab]
    if (!active) return
    const last = active.messages[active.messages.length - 1]
    if (last?.role === 'agent') speak(last.text)
  }, [sessions, activeTab, speak])

  // STT
  const toggleListening = () => {
    const SR = window['SpeechRecognition'] || window['webkitSpeechRecognition']
    if (!SR) { alert('Voice input not supported. Use Chrome or Edge.'); return }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const rec = new SR()
    rec.lang = 'hi-IN'
    rec.interimResults = false
    rec.onstart  = () => setListening(true)
    rec.onend    = () => setListening(false)
    rec.onerror  = () => setListening(false)
    rec.onresult = (e) => {
      const num = e.results[0][0].transcript.replace(/[^0-9.]/g, '')
      updateSessionField(sessions[activeTab]?.rowId, 'counterOffer', num || e.results[0][0].transcript)
    }
    recognitionRef.current = rec
    rec.start()
  }

  const addCropRow = () => {
    setCropRows(prev => [...prev, { id: nextId, crop_type: 'onion', quantity_kg: 50, mandi_location: 'Bengaluru, Karnataka' }])
    setNextId(n => n + 1)
  }
  const removeCropRow  = (id) => { if (cropRows.length > 1) setCropRows(prev => prev.filter(r => r.id !== id)) }
  const updateCropRow  = (id, field, value) => setCropRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  const updateSessionField = (rowId, field, value) => setSessions(prev => prev.map(s => s.rowId === rowId ? { ...s, [field]: value } : s))

  // startAll accepts optional rows override to handle auto-start timing
  const startAll = async (rowsOverride = null) => {
    const rows = rowsOverride || cropRows
    setStartLoading(true)
    setStartError(null)

    const results = await Promise.allSettled(
      rows.map(row =>
        axios.post(`${API}/negotiate/start`, {
          farmer_id: 'demo-farmer-' + Date.now(),
          crop_type: row.crop_type,
          quantity_kg: row.quantity_kg,
          mandi_location: row.mandi_location,
          ...(preGrade ? { crop_grade: preGrade.grade } : {}),
        })
      )
    )

    const newSessions = results.map((r, i) => {
      const row = rows[i]
      const cropLabel = CROPS.find(c => c.value === row.crop_type)?.label || row.crop_type
      if (r.status === 'fulfilled') {
        const d = r.value.data
        const gradeNote = preGrade ? ` (Grade ${preGrade.grade} premium applied)` : ''
        return {
          rowId: row.id, crop_type: row.crop_type, cropLabel,
          quantity_kg: row.quantity_kg, mandi_location: row.mandi_location,
          session_id: d.session_id, batna_price: d.batna_price, initial_ask: d.initial_ask,
          messages: [{
            role: 'agent',
            text: `Namaste! ${cropLabel} ka rate ₹${d.initial_ask}/kg rakh raha hoon${gradeNote}. Aap apna offer kariye.`,
            price: d.initial_ask,
          }],
          status: 'ongoing', counterOffer: '', loading: false, error: null, unread: 0,
        }
      }
      return {
        rowId: row.id, crop_type: row.crop_type, cropLabel,
        quantity_kg: row.quantity_kg, mandi_location: row.mandi_location,
        session_id: null, batna_price: 0, initial_ask: 0,
        messages: [{ role: 'agent', text: 'Failed to start session. Please retry.', price: 0 }],
        status: 'rejected', counterOffer: '', loading: false,
        error: r.reason?.response?.data?.detail || 'Start failed', unread: 0,
      }
    }).filter(Boolean)

    setSessions(newSessions)
    setActiveTab(0)
    setStartLoading(false)
    setStep('negotiating')
  }

  const sendOffer = async (tabIdx) => {
    const sess = sessions[tabIdx]
    if (!sess?.session_id) return
    const offer = parseFloat(sess.counterOffer)
    if (isNaN(offer) || offer <= 0) return

    setSessions(prev => prev.map((s, i) => i === tabIdx ? { ...s, loading: true, error: null } : s))
    try {
      const res = await axios.post(`${API}/negotiate/respond`, {
        session_id: sess.session_id,
        buyer_counter_offer: offer,
      })
      setSessions(prev => prev.map((s, i) => {
        if (i !== tabIdx) return s
        return {
          ...s,
          messages: [
            ...s.messages,
            { role: 'buyer', text: `Counter offer: ₹${offer}/kg`, price: offer },
            { role: 'agent', text: res.data.agent_dialogue, price: res.data.new_ask },
          ],
          status: res.data.status,
          counterOffer: '',
          loading: false,
          unread: activeTab === tabIdx ? 0 : s.unread + 1,
        }
      }))
    } catch (e) {
      setSessions(prev => prev.map((s, i) =>
        i === tabIdx ? { ...s, loading: false, error: e.response?.data?.detail || e.message } : s
      ))
    }
  }

  const acceptAsk = (tabIdx) => {
    const sess = sessions[tabIdx]
    if (!sess) return
    const ask = sess.messages.filter(m => m.role === 'agent').at(-1)?.price || sess.initial_ask
    updateSessionField(sess.rowId, 'counterOffer', String(ask))
    setTimeout(() => sendOffer(tabIdx), 50)
  }

  const totalValue = sessions
    .filter(s => s.status !== 'rejected')
    .reduce((sum, s) => {
      const ask = s.messages.filter(m => m.role === 'agent').at(-1)?.price || s.initial_ask
      return sum + ask * s.quantity_kg
    }, 0)

  const allDone = sessions.length > 0 && sessions.every(s => s.status !== 'ongoing')

  // ── SETUP PHASE ──────────────────────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <div className="pt-6 pb-4 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">AI Negotiation</h1>
          <p className="text-sm text-gray-400 mt-0.5">Add crops — AI negotiates in parallel, adapting strategy per crop.</p>
        </div>

        {/* Grade context banner */}
        {preGrade && (
          <div className={`flex items-center gap-3 rounded-2xl border p-3.5 ${GRADE_STYLE[preGrade.grade]?.bg}`}>
            <div className={`text-3xl font-black ${GRADE_STYLE[preGrade.grade]?.text} leading-none`}>{preGrade.grade}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${GRADE_STYLE[preGrade.grade]?.text}`}>
                Grade {preGrade.grade} — {GRADE_STYLE[preGrade.grade]?.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {preGrade.estimated_price_band} · {(preGrade.confidence * 100).toFixed(0)}% confidence
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-black ${GRADE_STYLE[preGrade.grade]?.text}`}>{GRADE_STYLE[preGrade.grade]?.multiplier}</p>
              <p className="text-[10px] text-gray-500">opening ask</p>
            </div>
          </div>
        )}

        {/* Crop rows */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
          {cropRows.map((row, idx) => (
            <div key={row.id} className="space-y-2">
              {idx > 0 && <div className="border-t border-gray-800 pt-3" />}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Crop {idx + 1}</p>
                {cropRows.length > 1 && (
                  <button onClick={() => removeCropRow(row.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1">
                    <TrashIcon />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className={SELECT_CLS}
                  value={row.crop_type}
                  onChange={e => updateCropRow(row.id, 'crop_type', e.target.value)}
                >
                  {CROPS.map(c => <option key={c.value} value={c.value} className="bg-gray-800">{c.label}</option>)}
                </select>
                <input
                  type="number"
                  className={INPUT_CLS}
                  placeholder="Qty (kg)"
                  value={row.quantity_kg}
                  onChange={e => updateCropRow(row.id, 'quantity_kg', parseFloat(e.target.value))}
                />
              </div>
              <input
                type="text"
                className={INPUT_CLS}
                placeholder="Mandi location e.g. Bengaluru, Karnataka"
                value={row.mandi_location}
                onChange={e => updateCropRow(row.id, 'mandi_location', e.target.value)}
              />
            </div>
          ))}

          {cropRows.length < 5 && (
            <button
              onClick={addCropRow}
              className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-700 hover:border-green-500/40 text-gray-500 hover:text-green-400 rounded-xl py-2.5 text-xs font-semibold transition-all"
            >
              <PlusIcon /> Add Another Crop
            </button>
          )}
        </div>

        <ErrorAlert error={startError} />

        <button
          onClick={() => startAll()}
          disabled={startLoading}
          className="w-full bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white py-3 rounded-xl text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/15"
        >
          {startLoading
            ? <><SpinnerIcon /> Fetching market prices…</>
            : `Start ${cropRows.length > 1 ? `${cropRows.length} Negotiations` : 'Negotiation'}`}
        </button>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wide">How It Works</p>
          <ol className="space-y-2.5">
            {[
              'Fetches live APMC modal price for each crop',
              preGrade ? `Grade ${preGrade.grade} detected — opening ask set at ${GRADE_STYLE[preGrade.grade]?.multiplier} market price` : 'Computes BATNA floor and grade-adjusted opening ask',
              'Runs parallel sessions — each crop gets its own AI agent',
              'Conceder or Boulware strategy auto-selected per crop',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-xs text-gray-500 leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  // ── NEGOTIATION PHASE ─────────────────────────────────────────────────────────
  const activeSess   = sessions[activeTab]
  const agentMsgs    = activeSess?.messages.filter(m => m.role === 'agent') || []
  const currentAsk   = agentMsgs.at(-1)?.price ?? activeSess?.initial_ask ?? 0
  const buyerMsgs    = activeSess?.messages.filter(m => m.role === 'buyer') || []
  const lastOffer    = buyerMsgs.at(-1)?.price ?? 0
  const roundNum     = buyerMsgs.length
  const priceGap     = lastOffer > 0 ? (currentAsk - lastOffer).toFixed(1) : null

  return (
    <div className="pt-3 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>

      {/* Portfolio strip */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-wide font-semibold">Portfolio Value</p>
          <p className="text-lg font-black text-emerald-400">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="flex items-center gap-2">
          {allDone && (
            <button
              onClick={() => downloadReceipt(sessions, preGrade)}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <DownloadIcon /> Receipt PDF
            </button>
          )}
          <button
            onClick={() => { setVoiceOn(v => !v); window.speechSynthesis?.cancel() }}
            className={`p-2 rounded-xl border transition-colors ${voiceOn ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}
          >
            <SpeakerIcon muted={!voiceOn} />
          </button>
        </div>
      </div>

      {/* Session tabs */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 no-scrollbar">
        {sessions.map((s, i) => (
          <button
            key={s.rowId}
            onClick={() => { setActiveTab(i); setSessions(prev => prev.map((ss, j) => j === i ? { ...ss, unread: 0 } : ss)) }}
            className={`relative flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              activeTab === i
                ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-500/20'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[s.status]}`} />
            {s.cropLabel}
            {s.unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-[9px] text-white flex items-center justify-center font-black">
                {s.unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeSess && (
        <>
          {/* Session meta */}
          <div className="flex items-center justify-between mb-2 px-0.5">
            <p className="text-xs text-gray-500 capitalize">{activeSess.quantity_kg} kg · {activeSess.mandi_location}</p>
            <p className="text-xs font-bold text-emerald-400">Floor ₹{activeSess.batna_price}/kg</p>
          </div>

          {/* Chat */}
          <div ref={chatRef} className="flex-1 overflow-y-auto space-y-2.5 bg-gray-900 border border-gray-800 rounded-2xl p-3 min-h-0">
            {activeSess.messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'agent' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 ${
                  m.role === 'agent'
                    ? 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-sm'
                    : 'bg-green-600 text-white rounded-tr-sm'
                }`}>
                  <p className={`text-[10px] font-bold mb-1 ${m.role === 'agent' ? 'text-emerald-400' : 'text-green-200'}`}>
                    {m.role === 'agent' ? 'KrishiDoot AI (Ramesh)' : 'Buyer'}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{m.text}</p>
                  {m.price > 0 && (
                    <p className={`text-xs mt-1.5 font-semibold ${m.role === 'agent' ? 'text-gray-400' : 'text-green-200'}`}>
                      ₹{m.price}/kg · ₹{(m.price * activeSess.quantity_kg).toLocaleString('en-IN', { maximumFractionDigits: 0 })} total
                    </p>
                  )}
                </div>
              </div>
            ))}
            {activeSess.loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                </div>
              </div>
            )}
            {activeSess.status === 'agreed' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 text-center">
                <p className="text-sm font-black text-emerald-400">Deal Agreed!</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  ₹{currentAsk}/kg · Total ₹{(currentAsk * activeSess.quantity_kg).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
            )}
            {activeSess.status === 'rejected' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-center">
                <p className="text-sm font-black text-red-400">Negotiation Ended</p>
                <p className="text-xs text-gray-500 mt-0.5">No deal reached.</p>
              </div>
            )}
          </div>

          {/* Analytics strip */}
          <div className="flex items-center gap-3 my-2 px-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-600 font-semibold">RND</span>
              <span className="text-[10px] font-black text-gray-400">{roundNum}/10</span>
            </div>
            {priceGap !== null && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-600 font-semibold">GAP</span>
                <span className="text-[10px] font-black text-amber-400">₹{priceGap}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-600 font-semibold">ASK</span>
              <span className="text-[10px] font-black text-emerald-400">₹{currentAsk}/kg</span>
            </div>
            <div className="ml-auto">
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                activeSess.status === 'agreed'   ? 'bg-emerald-500/20 text-emerald-400' :
                activeSess.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                   'bg-blue-500/20 text-blue-400'
              }`}>
                {activeSess.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Input row */}
          {activeSess.status === 'ongoing' && (
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  type="number"
                  className={`${INPUT_CLS} flex-1`}
                  placeholder="Buyer offer ₹/kg — or tap mic"
                  value={activeSess.counterOffer}
                  onChange={e => updateSessionField(activeSess.rowId, 'counterOffer', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendOffer(activeTab)}
                />
                <button
                  onClick={toggleListening}
                  className={`px-3 rounded-xl border transition-all ${
                    listening
                      ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-green-400 hover:border-green-500/40'
                  }`}
                >
                  <MicIcon active={listening} />
                </button>
                <button
                  onClick={() => acceptAsk(activeTab)}
                  disabled={activeSess.loading}
                  className="px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all disabled:opacity-40"
                >
                  Accept
                </button>
                <button
                  onClick={() => sendOffer(activeTab)}
                  disabled={activeSess.loading || !activeSess.counterOffer}
                  className="bg-green-600 hover:bg-green-500 text-white px-3 rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1"
                >
                  {activeSess.loading ? <SpinnerIcon /> : <SendIcon />}
                </button>
              </div>
              {listening && (
                <p className="text-[10px] text-red-400 text-center animate-pulse font-semibold">Sun raha hoon… apna offer boliye</p>
              )}
              <ErrorAlert error={activeSess.error} />
            </div>
          )}
        </>
      )}

      {/* All-done summary */}
      {allDone && (
        <div className="mt-3 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white uppercase tracking-wide">Negotiation Summary</p>
            <button
              onClick={() => downloadReceipt(sessions, preGrade)}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
              <DownloadIcon /> Download Receipt
            </button>
          </div>
          <div className="space-y-2">
            {sessions.map(s => {
              const finalPrice = s.messages.filter(m => m.role === 'agent').at(-1)?.price ?? s.initial_ask
              const total = (finalPrice * s.quantity_kg).toLocaleString('en-IN', { maximumFractionDigits: 0 })
              return (
                <div key={s.rowId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s.status]}`} />
                    <span className="text-gray-300 font-semibold">{s.cropLabel}</span>
                    <span className="text-gray-600">{s.quantity_kg} kg</span>
                  </div>
                  <span className={s.status === 'agreed' ? 'text-emerald-400 font-bold' : 'text-gray-600'}>
                    {s.status === 'agreed' ? `₹${finalPrice}/kg · ₹${total}` : 'No deal'}
                  </span>
                </div>
              )
            })}
            <div className="border-t border-gray-800 pt-2 flex justify-between text-xs">
              <span className="text-gray-400 font-bold">Total revenue</span>
              <span className="text-emerald-400 font-black">
                ₹{sessions.filter(s => s.status === 'agreed').reduce((sum, s) => {
                  const p = s.messages.filter(m => m.role === 'agent').at(-1)?.price ?? s.initial_ask
                  return sum + p * s.quantity_kg
                }, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
