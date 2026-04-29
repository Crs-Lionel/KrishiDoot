import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import jsPDF from 'jspdf'
import {
  CameraIcon,
  ChemicalIcon,
  ChevronDownIcon,
  CropIcon,
  DocumentIcon,
  ErrorAlert,
  PageIntro,
  RefreshIcon,
  SpinnerIcon,
  SubsidyIcon,
  TaskIcon as TaskGlyph,
  TimelineIcon,
  TrophyIcon,
  WeatherIcon as WeatherGlyph,
} from '../components/ui.jsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const CROP_EMOJI = {
  wheat: '🌾', rice: '🍚', tomato: '🍅', onion: '🧅', potato: '🥔',
  cotton: '🌿', maize: '🌽', soybean: '🫘', mustard: '🌼', gram: '🫛',
  sugarcane: '🍬', groundnut: '🥜',
}
const cropEmoji = (c) => CROP_EMOJI[c?.toLowerCase()] || '🌱'

const TASK_ICON = {
  sowing: '🌱', irrigation: '💧', fertilizer: '⚗️',
  pesticide: '🧪', weeding: '✂️', observation: '👁️', harvest: '🌾',
}
const WEATHER_ICON = (w) => {
  if (!w) return '🌤️'
  if (w.frost_risk) return '🥶'
  if (w.heat_stress) return '🌡️'
  if ((w.rain_mm_week || 0) > 30) return '🌧️'
  if ((w.rain_mm_week || 0) > 10) return '🌦️'
  if ((w.humidity_pct || 60) > 80) return '🌫️'
  return '☀️'
}

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

const CHEM_TYPE_COLOR = {
  fertilizer: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  pesticide:  'bg-orange-500/15 text-orange-300 border-orange-500/20',
  fungicide:  'bg-purple-500/15 text-purple-300 border-purple-500/20',
  herbicide:  'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
  insecticide:'bg-red-500/15 text-red-300 border-red-500/20',
}
const CHEM_ICON = { fertilizer:'⚗️', pesticide:'🧪', fungicide:'🔬', herbicide:'✂️', insecticide:'🐛' }

function CropMark({ crop, className = 'w-5 h-5' }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(124,175,77,0.24)] bg-[rgba(124,175,77,0.1)] text-[var(--leaf-300)]">
      <CropIcon crop={crop} className={className} />
    </div>
  )
}

function WeatherMark({ weather, className = 'w-4 h-4' }) {
  return <WeatherGlyph weather={weather} className={className} />
}

function TaskMark({ category, className = 'w-4 h-4' }) {
  return <TaskGlyph category={category} className={className} />
}

function ChemicalMark({ type, className = 'w-4 h-4' }) {
  return <ChemicalIcon type={type} className={className} />
}

function ChemicalDetail({ chemicals }) {
  const [open, setOpen] = useState(false)
  if (!chemicals?.length) return null
  return (
    <div className="mt-2">
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className="flex items-center gap-1.5 text-[10px] text-amber-400 hover:text-amber-300 transition">
        {open ? '▾' : '▸'} Rasayan & Urvarak Details ({chemicals.length})
      </button>
      {open && (
        <div className="mt-1.5 space-y-1.5" onClick={e => e.stopPropagation()}>
          {chemicals.map((c, i) => {
            const colorCls = CHEM_TYPE_COLOR[c.type] || 'bg-gray-700/50 text-gray-300 border-gray-600/30'
            const icon = CHEM_ICON[c.type] || '⚗️'
            return (
              <div key={i} className={`rounded-lg border p-2.5 space-y-1 ${colorCls}`}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{icon}</span>
                  <span className="font-semibold text-[11px]">{c.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border ${colorCls}`}>
                    {c.type}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-gray-300">
                  <div><span className="text-gray-500">Matra:</span> {c.quantity_per_acre}</div>
                  {c.dilution && <div><span className="text-gray-500">Ghol:</span> {c.dilution}</div>}
                  {c.cost_approx && <div><span className="text-gray-500">Keemat:</span> {c.cost_approx}</div>}
                  {c.timing && <div><span className="text-gray-500">Samay:</span> {c.timing}</div>}
                </div>
                {c.application_method && (
                  <div className="text-[10px] text-gray-300 border-t border-current/20 pt-1 mt-0.5">
                    <span className="text-gray-500">Kaise dalen:</span> {c.application_method}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const HARDCODED_SCHEMES = [
  { id: 'pm-kisan', name: 'PM-KISAN Samman Nidhi', desc: '₹6,000 annual direct cash transfer in 3 installments to all small/marginal landholding farmers.', state: 'all', link: 'https://pmkisan.gov.in/', tag: 'National' },
  { id: 'pmfby', name: 'PM Fasal Bima Yojana', desc: 'Crop insurance against natural calamities, pests & diseases. Low premium: 2% Kharif, 1.5% Rabi crops.', state: 'all', link: 'https://pmfby.gov.in/', tag: 'National' },
  { id: 'kcc', name: 'Kisan Credit Card (KCC)', desc: 'Short-term crop loans at subsidized 7% p.a. interest — up to ₹3 lakh for cultivation & inputs.', state: 'all', link: 'https://nabard.org', tag: 'National' },
  { id: 'enam', name: 'eNAM — Online Mandi', desc: 'Sell directly on pan-India electronic market (1,389+ mandis). Better price discovery, no middlemen.', state: 'all', link: 'https://enam.gov.in/', tag: 'National' },
  { id: 'mh-mahadbt', name: 'MahaDBT — Krishi Yantra Anudan', desc: '50% subsidy on farm machinery (tractors, sprayers, harvesters) via MahaDBT portal lottery system.', state: 'maharashtra', link: 'https://mahadbt.maharashtra.gov.in/', tag: 'Maharashtra' },
  { id: 'mh-farm-pond', name: 'Magel Tyala Shet Tale (Farm Pond)', desc: 'Free farm pond construction for water storage — 100% state subsidy for small/marginal farmers.', state: 'maharashtra', link: 'https://mahadbt.maharashtra.gov.in/', tag: 'Maharashtra' },
  { id: 'pb-parali', name: 'Punjab Parali Management Scheme', desc: '₹2,500/acre incentive for in-situ crop residue management — avoid stubble burning penalty.', state: 'punjab', link: 'https://agri.punjab.gov.in/', tag: 'Punjab' },
  { id: 'pb-drip', name: 'Punjab Drip Irrigation Subsidy', desc: '80% subsidy on drip/sprinkler irrigation systems to reduce water consumption.', state: 'punjab', link: 'https://agri.punjab.gov.in/', tag: 'Punjab' },
  { id: 'up-yantra', name: 'UP Krishi Yantra Anudan', desc: 'Direct subsidy on farm equipment purchase via UP Agriculture DBT portal.', state: 'uttar_pradesh', link: 'https://upagriculture.com/', tag: 'Uttar Pradesh' },
  { id: 'up-solar', name: 'UP Kisan Uday Solar Pump Yojana', desc: 'Free solar pump (up to 5 HP) for small farmers to eliminate irrigation electricity costs.', state: 'uttar_pradesh', link: 'https://upagriculture.com/', tag: 'Uttar Pradesh' },
  { id: 'rj-tarbandi', name: 'Rajasthan Tarbandi Yojana', desc: '50% subsidy (max ₹40,000) on farm fencing to protect crops from stray/wild animals.', state: 'rajasthan', link: 'https://rajkisan.rajasthan.gov.in/', tag: 'Rajasthan' },
  { id: 'rj-processing', name: 'Rajasthan Krishi Processing Subsidy', desc: 'Subsidy on food processing equipment to add value to produce before selling at mandi.', state: 'rajasthan', link: 'https://rajkisan.rajasthan.gov.in/', tag: 'Rajasthan' },
  { id: 'mp-bhavantar', name: 'MP Bhavantar Bhugtan Yojana', desc: 'Price support: if mandi price < MSP, state government pays the difference directly to your bank.', state: 'madhya_pradesh', link: 'http://mpkrishi.mp.gov.in/', tag: 'Madhya Pradesh' },
  { id: 'mp-solar', name: 'MP Mukhyamantri Solar Pump Yojana', desc: '90% subsidy on solar pump installation (up to 5 HP) for year-round irrigation.', state: 'madhya_pradesh', link: 'http://mpkrishi.mp.gov.in/', tag: 'Madhya Pradesh' },
  { id: 'ka-raitamitra', name: 'Karnataka Raitamitra Scheme', desc: 'Rainfed farming support — bund formation, farm pond, drip subsidy for dry-land farmers.', state: 'karnataka', link: 'https://raitamitra.kar.nic.in/', tag: 'Karnataka' },
  { id: 'ka-bhoochetana', name: 'Karnataka Bhoochetana', desc: 'Soil health-based crop nutrient management to boost yields in rainfed areas.', state: 'karnataka', link: 'https://raitamitra.kar.nic.in/', tag: 'Karnataka' },
  { id: 'gj-ikhedut', name: 'Gujarat iKhedut Portal Subsidies', desc: 'Single-window subsidies on seeds, fertilizers, irrigation equipment, solar pumps, and greenhouses.', state: 'gujarat', link: 'https://ikhedut.gujarat.gov.in/', tag: 'Gujarat' },
  { id: 'hr-mera-pani', name: 'Haryana Mera Pani Meri Virasat', desc: '₹7,000/acre incentive for switching from paddy to water-saving crops (maize, cotton, bajra, etc.).', state: 'haryana', link: 'https://agriharyana.gov.in/', tag: 'Haryana' },
  { id: 'hr-machinery', name: 'Haryana Farm Machinery Subsidy', desc: '50% subsidy on farm implements for individuals; 80% for FPOs/cooperative groups.', state: 'haryana', link: 'https://agriharyana.gov.in/', tag: 'Haryana' },
]

function extractState(location) {
  const loc = location.toLowerCase()
  const map = [
    ['maharashtra','maharashtra'],['pune','maharashtra'],['mumbai','maharashtra'],['nagpur','maharashtra'],['nashik','maharashtra'],['aurangabad','maharashtra'],['solapur','maharashtra'],
    ['punjab','punjab'],['ludhiana','punjab'],['amritsar','punjab'],['patiala','punjab'],['jalandhar','punjab'],
    ['uttar pradesh','uttar_pradesh'],['lucknow','uttar_pradesh'],['kanpur','uttar_pradesh'],['agra','uttar_pradesh'],['varanasi','uttar_pradesh'],['meerut','uttar_pradesh'],
    ['rajasthan','rajasthan'],['jaipur','rajasthan'],['jodhpur','rajasthan'],['udaipur','rajasthan'],['kota','rajasthan'],['bikaner','rajasthan'],
    ['madhya pradesh','madhya_pradesh'],['bhopal','madhya_pradesh'],['indore','madhya_pradesh'],['gwalior','madhya_pradesh'],['jabalpur','madhya_pradesh'],
    ['karnataka','karnataka'],['bangalore','karnataka'],['bengaluru','karnataka'],['mysore','karnataka'],['hubli','karnataka'],['dharwad','karnataka'],
    ['gujarat','gujarat'],['ahmedabad','gujarat'],['surat','gujarat'],['vadodara','gujarat'],['rajkot','gujarat'],['anand','gujarat'],
    ['haryana','haryana'],['gurgaon','haryana'],['faridabad','haryana'],['rohtak','haryana'],['ambala','haryana'],['hisar','haryana'],['karnal','haryana'],
  ]
  for (const [k, v] of map) if (loc.includes(k)) return v
  return null
}

const IRRIGATION = ['Nalkoop (Borewell)', 'Nahar (Canal)', 'Barish par nirbhar (Rain-fed)', 'Talab / Pond', 'Drip System', 'Sprinkler']
const CARD = 'bg-gray-800/60 rounded-xl border border-gray-700/40 p-4'
const BTN_PRI = 'w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50'
const INPUT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition'
const SELECT = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition'

function calcCurrentWeek(sowingDate, totalWeeks) {
  const days = Math.floor((Date.now() - new Date(sowingDate)) / 86400000)
  return Math.max(1, Math.min(Math.ceil(days / 7) || 1, totalWeeks))
}

// ── Week Card Component ───────────────────────────────────────────────────────
function WeekCard({ week, curWeek, completedTasks, onToggleTask }) {
  const [expanded, setExpanded] = useState(week.week === curWeek)
  const wx = week.expected_weather || {}
  const isPast = week.week < curWeek
  const isCurrent = week.week === curWeek
  const isFuture = week.week > curWeek

  const weekDone = week.tasks?.filter(t => completedTasks.includes(t.task_id)).length || 0
  const weekTotal = week.tasks?.length || 0
  const weekPct = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${
      isCurrent
        ? 'border-green-500/50 bg-green-900/10'
        : isPast
        ? 'border-gray-700/30 bg-gray-800/30 opacity-80'
        : 'border-gray-700/40 bg-gray-800/50'
    }`}>
      {/* Header — always visible */}
      <button className="w-full text-left px-4 py-3" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2">
          {isCurrent && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />}
          {isPast && <span className="text-green-400 text-sm flex-shrink-0">✓</span>}
          {isFuture && <span className="text-gray-500 text-sm flex-shrink-0">○</span>}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-semibold text-sm ${isCurrent ? 'text-white' : isPast ? 'text-gray-300' : 'text-gray-400'}`}>
                Week {week.week}
              </span>
              <span className="text-xs text-gray-500">{week.stage}</span>
              {week.critical_window && (
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-semibold">
                  CRITICAL
                </span>
              )}
              {week.plan_change_reason && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                  UPDATED
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {week.date_range && <span className="text-[10px] text-gray-500">{week.date_range}</span>}
              <span className="text-[10px] text-gray-500">{week.days_range}</span>
              <span className="text-[10px]">{WEATHER_ICON(wx)} {wx.temp_range || ''}</span>
              {(wx.rain_mm_week || 0) > 0 && (
                <span className="text-[10px] text-blue-400">💧{wx.rain_mm_week}mm</span>
              )}
              {week.week_cost_estimate && (
                <span className="text-[10px] text-amber-400">{week.week_cost_estimate}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">{weekDone}/{weekTotal}</span>
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 w-full bg-gray-700/50 rounded-full h-1">
          <div className={`h-1 rounded-full transition-all ${weekPct === 100 ? 'bg-green-500' : isCurrent ? 'bg-amber-500' : 'bg-gray-600'}`}
            style={{ width: `${weekPct}%` }} />
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-700/40 px-4 pb-4 pt-3 space-y-3">
          {/* Weather block */}
          {wx.conditions && (
            <div className={`rounded-lg p-3 space-y-1 ${
              wx.frost_risk ? 'bg-blue-900/20 border border-blue-500/20'
              : wx.heat_stress ? 'bg-red-900/20 border border-red-500/20'
              : (wx.rain_mm_week || 0) > 20 ? 'bg-blue-900/20 border border-blue-500/20'
              : 'bg-gray-700/30 border border-gray-600/30'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{WEATHER_ICON(wx)}</span>
                <div>
                  <div className="text-xs font-semibold text-gray-200">{wx.conditions}</div>
                  <div className="text-[10px] text-gray-400">
                    {wx.temp_range} · Humidity {wx.humidity_pct}% · Rain {wx.rain_mm_week || 0}mm
                    {wx.frost_risk && ' · 🥶 Frost risk'}
                    {wx.heat_stress && ' · 🌡️ Heat stress'}
                  </div>
                </div>
              </div>
              {week.weather_advisory && (
                <div className="text-xs text-amber-300 flex items-start gap-1">
                  <span>⚠️</span><span>{week.weather_advisory}</span>
                </div>
              )}
              {week.plan_change_reason && (
                <div className="text-xs text-blue-300 flex items-start gap-1">
                  <span>🔄</span><span>{week.plan_change_reason}</span>
                </div>
              )}
            </div>
          )}

          {/* Tasks */}
          <div className="space-y-2">
            {week.tasks?.map(task => {
              const done = completedTasks.includes(task.task_id)
              return (
                <div key={task.task_id}
                  onClick={() => onToggleTask && onToggleTask(task.task_id)}
                  className={`rounded-lg border p-3 cursor-pointer transition-all ${
                    done
                      ? 'bg-green-900/15 border-green-800/30 opacity-70'
                      : 'bg-gray-700/30 border-gray-600/30 hover:border-gray-500/50'
                  }`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                      done ? 'bg-green-600 border-green-600' : 'border-gray-500'
                    }`}>
                      {done && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm">{TASK_ICON[task.category] || '📌'}</span>
                        <span className="text-sm font-medium text-white">{task.title}</span>
                        {task.critical && <span className="text-[9px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded">Critical</span>}
                        {task.photo_needed && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded">📸 Photo</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{task.desc}</p>
                      {task.weather_condition && (
                        <p className="text-[10px] text-amber-400 mt-1">⚠️ {task.weather_condition}</p>
                      )}
                      {(task.water_liters_per_acre > 0 || task.inputs?.length > 0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {task.water_liters_per_acre > 0 && (
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                              💧{task.water_liters_per_acre.toLocaleString()}L/acre
                            </span>
                          )}
                          {task.inputs?.map(inp => (
                            <span key={inp.name} className="text-[10px] bg-gray-700/60 text-gray-300 border border-gray-600/30 px-1.5 py-0.5 rounded">
                              {inp.name} {inp.quantity}{inp.cost_approx ? ` (${inp.cost_approx})` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      <ChemicalDetail chemicals={task.chemicals} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Question Form ─────────────────────────────────────────────────────────────
function QuestionForm({ questions, answers, setAnswers, round = 1 }) {
  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={q.id} className={CARD + ' space-y-2'}>
          <label className="text-sm font-medium text-white flex items-start gap-2">
            <span className="text-green-400 font-bold flex-shrink-0">
              {round === 2 ? `+${i + 1}` : `${i + 1}.`}
            </span>
            <span>{q.question}</span>
          </label>
          {q.why_asking && (
            <p className="text-[10px] text-blue-400 ml-5">💡 {q.why_asking}</p>
          )}
          {answers[q.id] && q.detected_from_photo && answers[q.id] === q.detected_from_photo && (
            <div className="ml-5 text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded">
              📷 Photo se detect hua — confirm karo
            </div>
          )}
          {q.type === 'choice' && (
            <div className="grid grid-cols-2 gap-1.5 ml-5">
              {q.options?.map(opt => (
                <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                  className={`text-xs py-2 px-2 rounded-lg border text-left transition ${
                    answers[q.id] === opt
                      ? 'bg-green-600/20 border-green-500/60 text-green-300'
                      : 'bg-gray-700/40 border-gray-600/40 text-gray-300 hover:border-gray-500'
                  }`}>
                  {opt}
                </button>
              ))}
            </div>
          )}
          {q.type === 'yes_no' && (
            <div className="flex gap-2 ml-5">
              {['Haan', 'Nahi'].map(opt => (
                <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                  className={`flex-1 text-sm py-2 rounded-lg border transition ${
                    answers[q.id] === opt
                      ? opt === 'Haan' ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-red-600/20 border-red-500 text-red-300'
                      : 'bg-gray-700/40 border-gray-600/40 text-gray-300 hover:border-gray-500'
                  }`}>
                  {opt === 'Haan' ? '✓ Haan' : '✗ Nahi'}
                </button>
              ))}
            </div>
          )}
          {q.type === 'number' && (
            <div className="flex items-center gap-2 ml-5">
              <input type="number" min={q.min || 0} max={q.max || 9999} step="0.1"
                className={INPUT} placeholder={`Enter in ${q.unit || ''}`}
                value={answers[q.id] || ''}
                onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} />
              {q.unit && <span className="text-gray-400 text-sm whitespace-nowrap">{q.unit}</span>}
            </div>
          )}
          {q.type === 'text' && (
            <input className={INPUT + ' ml-5'} placeholder="Jawab likhe..."
              value={answers[q.id] || ''}
              onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CropJourney() {
  const navigate = useNavigate()
  // mode: intro|questions|followup|recommendation|starting|dashboard|report
  const [mode, setMode] = useState('intro')
  const [location, setLocation] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [showMonthEdit, setShowMonthEdit] = useState(false)
  const [landB64, setLandB64] = useState(null)
  const [questions, setQuestions] = useState([])
  const [followupQuestions, setFollowupQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [followupAnswers, setFollowupAnswers] = useState({})
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
  const [updatingPlan, setUpdatingPlan] = useState(false)
  const [planUpdated, setPlanUpdated] = useState(null)
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
      setLocation(r.data.location)
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

  // ── Onboarding Step 1: fetch weather + questions ──────────────────────────
  async function fetchQuestions() {
    if (!location.trim()) { setErr('Location daale (e.g. Pune, Maharashtra)'); return }
    setLoading(true); setErr('')
    try {
      const r = await axios.post(`${API}/crop-journey/questions`, { location, month, land_photo_b64: landB64 })
      const qs = r.data.questions
      setQuestions(qs)
      if (r.data.weather) setWeather(r.data.weather)
      // Auto-fill answers detected from photo
      const pre = {}
      qs.forEach(q => { if (q.detected_from_photo) pre[q.id] = q.detected_from_photo })
      if (Object.keys(pre).length) setAnswers(pre)
      setMode('questions')
    } catch { setErr('Questions load nahi hue. Try again.') }
    finally { setLoading(false) }
  }

  // ── Onboarding Step 2: submit Round 1, check for follow-up ───────────────
  async function submitAnswers() {
    const unanswered = questions.filter(q => !answers[q.id] && answers[q.id] !== 0)
    if (unanswered.length) { setErr(`${unanswered.length} sawaalon ka jawab de`); return }
    setLoading(true); setErr('')
    try {
      const r = await axios.post(`${API}/crop-journey/followup-questions`, {
        location, month, initial_answers: answers
      })
      if (r.data.has_followup && r.data.questions?.length > 0) {
        setFollowupQuestions(r.data.questions)
        setMode('followup')
      } else {
        await runAnalysis(answers)
      }
    } catch {
      // If followup endpoint fails, proceed directly
      await runAnalysis(answers)
    } finally { setLoading(false) }
  }

  // ── Onboarding Step 3 (optional): submit follow-up answers ───────────────
  async function submitFollowup() {
    const unanswered = followupQuestions.filter(q => !followupAnswers[q.id])
    if (unanswered.length) { setErr(`${unanswered.length} sawaalon ka jawab de`); return }
    setLoading(true); setErr('')
    const allAnswers = { ...answers, ...followupAnswers }
    await runAnalysis(allAnswers)
    setLoading(false)
  }

  async function runAnalysis(allAnswers) {
    try {
      const r = await axios.post(`${API}/crop-journey/analyze`, {
        location, month, answers: allAnswers, land_photo_b64: landB64
      })
      setRec(r.data.recommendation)
      if (r.data.weather) setWeather(r.data.weather)
      setAnswers(allAnswers)
      setSelCrop(r.data.recommendation.recommended_crop)
      setMode('recommendation')
    } catch { setErr('Analysis fail hua. Try again.') }
  }

  // ── Start Journey ─────────────────────────────────────────────────────────
  async function startJourney() {
    if (!sowDate) { setErr('Beejai ki tarikh daale'); return }
    if (!landSize || isNaN(parseFloat(landSize))) { setErr('Zameen ka size daale'); return }
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

  // ── Dashboard actions ─────────────────────────────────────────────────────
  async function toggleTask(taskId) {
    if (!journey) return
    const done = journey.completed_tasks.includes(taskId)
    try {
      const r = await axios.post(`${API}/crop-journey/${journey.journey_id}/task`, { task_id: taskId, completed: !done })
      setJourney(prev => ({
        ...prev,
        completed_tasks: !done ? [...prev.completed_tasks, taskId] : prev.completed_tasks.filter(id => id !== taskId),
        tasks_completed: r.data.tasks_completed,
      }))
    } catch {}
  }

  async function updatePlan(trigger = 'manual') {
    if (!journey) return
    setUpdatingPlan(true); setPlanUpdated(null); setErr('')
    try {
      const curWeek = calcCurrentWeek(journey.sowing_date, journey.total_weeks)
      const r = await axios.post(`${API}/crop-journey/${journey.journey_id}/update-plan`, {
        current_week: curWeek, trigger,
      }, { timeout: 60000 })
      if (r.data.updated) {
        setJourney(prev => ({
          ...prev,
          task_calendar: r.data.task_calendar,
          tasks_total: r.data.tasks_total,
          plan_updates_count: (prev.plan_updates_count || 0) + 1,
        }))
        setPlanUpdated(r.data.weeks_updated)
      } else {
        setPlanUpdated(0)
      }
    } catch { setErr('Plan update fail hua') }
    finally { setUpdatingPlan(false) }
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
        // If AI says plan update needed, trigger it automatically
        if (r.data.plan_update_needed) {
          const curWeek = calcCurrentWeek(journey.sowing_date, journey.total_weeks)
          await axios.post(`${API}/crop-journey/${journey.journey_id}/update-plan`, {
            current_week: curWeek, trigger: 'photo_check',
          }, { timeout: 60000 }).then(resp => {
            if (resp.data.updated) {
              setJourney(prev => ({
                ...prev,
                task_calendar: resp.data.task_calendar,
                tasks_total: resp.data.tasks_total,
              }))
            }
          }).catch(() => {})
        }
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
    doc.setFillColor(22, 101, 52); doc.rect(0, 0, 210, 28, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(16)
    doc.text('KrishiDoot.AI — Farming Journey Report', 14, 16)
    doc.setTextColor(0, 0, 0); doc.setFontSize(11)
    let y = 36
    const line = (t) => { doc.text(t, 14, y); y += 7 }
    line(`Fasal: ${journey.crop_type} | Jagah: ${journey.location}`)
    line(`Beejai: ${journey.sowing_date} | Zameen: ${journey.land_size_acres} acres`)
    line(`Tasks: ${journey.tasks_completed}/${journey.tasks_total} | Plan updates: ${journey.plan_updates_count || 0}`)
    y += 4
    doc.setFontSize(13); line('Financial Summary'); doc.setFontSize(11)
    line(`Total Kharcha: ${rpt.total_cost_estimate}`)
    line(`Net Profit: ${rpt.net_profit_estimate} (ROI: ${rpt.roi_percent || '?'}%)`)
    line(`Paidawar: ${rpt.yield_achieved}`)
    if (journey.selling_price_per_kg) line(`Bikri Bhav: ₹${journey.selling_price_per_kg}/kg`)
    if (journey.total_income) line(`Kul Aay: ₹${journey.total_income}`)
    if (rpt.weather_impact) { y += 4; doc.setFontSize(13); line('Weather Impact'); doc.setFontSize(11); line(rpt.weather_impact) }
    y += 4; doc.setFontSize(13); line('Highlights'); doc.setFontSize(11)
    rpt.highlights?.forEach(h => line(`• ${h}`))
    y += 4; doc.setFontSize(13); line('Seekhe Hue Sabak'); doc.setFontSize(11)
    rpt.lessons?.forEach(l => line(`• ${l}`))
    y += 4; line(`Agla Sezon: ${rpt.next_season_tip}`)
    const dt = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    doc.save(`KrishiDoot-Journey-${journey.crop_type}-${dt}.pdf`)
  }

  function resetJourney() {
    localStorage.removeItem('kd_journey_id')
    setJourney(null); setMode('intro'); setRec(null); setWeather(null)
    setQuestions([]); setFollowupQuestions([]); setAnswers({}); setFollowupAnswers({})
    setSubsidies([]); setWxData(null); setPhotoResult(null); setPlanUpdated(null); setErr('')
  }

  // ─────────────────────────── RENDER ──────────────────────────────────────

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (mode === 'intro') return (
    <div className="py-6 space-y-5">
      <div className="text-center space-y-2">
        <div className="text-5xl">🌾</div>
        <h1 className="text-2xl font-bold text-white">Fasal Journey</h1>
        <p className="text-gray-400 text-sm">Beejai se bikri tak — AI ke saath poori kheti</p>
      </div>

      <div className={CARD + ' space-y-4'}>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Aapka Gaon / Sheher</label>
          <input className={INPUT} placeholder="e.g. Pune, Maharashtra" value={location}
            onChange={e => setLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchQuestions()} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Abhi Kaunsa Mahina Hai?</label>
            <button onClick={() => setShowMonthEdit(e => !e)} className="text-xs text-green-400 hover:text-green-300">
              {showMonthEdit ? 'Done' : 'Badlo'}
            </button>
          </div>
          {showMonthEdit
            ? <select className={SELECT} value={month} onChange={e => setMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            : <div className="bg-gray-700/40 border border-gray-600/40 rounded-lg px-3 py-2.5 text-sm text-white">
                {MONTHS[month - 1]}
              </div>
          }
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Zameen Ki Photo (Optional)</label>
          <input ref={landRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleLandPhoto} />
          <button onClick={() => landRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-600 hover:border-green-500 rounded-xl py-4 text-center transition">
            {landB64
              ? <span className="text-green-400 text-sm font-medium">✓ Photo ready — AI mitti + conditions analyse karega</span>
              : <span className="text-gray-500 text-sm">📸 Zameen ki photo (AI questions aur behtar baneyega)</span>}
          </button>
        </div>
      </div>

      {weather?.current && (
        <div className={CARD + ' flex items-center gap-3'}>
          <span className="text-2xl">🌤️</span>
          <div>
            <div className="text-white font-medium text-sm">{weather.current.temp_c}°C · {weather.current.desc}</div>
            <div className="text-gray-400 text-xs">{location} · Nami {weather.current.humidity}%</div>
          </div>
          {weather.advisory && <div className="ml-auto text-[10px] text-amber-400 text-right max-w-32">{weather.advisory}</div>}
        </div>
      )}

      <ErrorAlert error={err} />
      <button className={BTN_PRI} onClick={fetchQuestions} disabled={loading}>
        {loading ? <><SpinnerIcon /> Mausam + questions la rahe hain...</> : 'Shuru Karo →'}
      </button>

      <div className="grid grid-cols-4 gap-2 pt-2">
        {[['🌤️','Mausam'], ['🏛️','Subsidies'], ['📅','Timeline'], ['📄','Report']].map(([icon, label]) => (
          <div key={label} className="bg-gray-800/40 rounded-xl p-2.5 text-center border border-gray-700/30">
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-[10px] text-gray-400">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── QUESTIONS (Round 1) ───────────────────────────────────────────────────
  if (mode === 'questions') return (
    <div className="py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setMode('intro')} className="text-gray-400 hover:text-white transition">←</button>
        <div>
          <h2 className="text-lg font-bold text-white">Round 1 — Khet Ki Jaankari</h2>
          <p className="text-gray-500 text-xs">{location} · {MONTHS[month - 1]} · {weather?.current ? `${weather.current.temp_c}°C, ${weather.current.desc}` : ''}</p>
        </div>
      </div>

      {weather?.advisory && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-300 flex items-start gap-2">
          <span>🌤️</span><span>{weather.advisory}</span>
        </div>
      )}

      <QuestionForm questions={questions} answers={answers} setAnswers={setAnswers} round={1} />
      <ErrorAlert error={err} />
      <button className={BTN_PRI} onClick={submitAnswers} disabled={loading}>
        {loading ? <><SpinnerIcon /> AI Follow-up Check Kar Raha Hai...</> : 'Aage Bado →'}
      </button>
    </div>
  )

  // ── FOLLOW-UP QUESTIONS (Round 2) ─────────────────────────────────────────
  if (mode === 'followup') return (
    <div className="py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setMode('questions')} className="text-gray-400 hover:text-white transition">←</button>
        <div>
          <h2 className="text-lg font-bold text-white">Round 2 — Thode Aur Sawaal</h2>
          <p className="text-gray-500 text-xs">AI ko kuch aur jaankari chahiye</p>
        </div>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
        💡 Aapke jawaabon aur mausam ke hisaab se AI ko yeh specific jaankari chahiye planning ke liye
      </div>
      <QuestionForm questions={followupQuestions} answers={followupAnswers} setAnswers={setFollowupAnswers} round={2} />
      <ErrorAlert error={err} />
      <button className={BTN_PRI} onClick={submitFollowup} disabled={loading}>
        {loading ? <><SpinnerIcon /> Analysis Ho Raha Hai...</> : 'Submit Karo →'}
      </button>
      <button onClick={() => runAnalysis(answers).then(() => setLoading(false))} className="w-full text-center text-gray-500 text-xs py-1 hover:text-gray-300 transition">
        Skip karo — recommendation dekho
      </button>
    </div>
  )

  // ── RECOMMENDATION ────────────────────────────────────────────────────────
  if (mode === 'recommendation') return (
    <div className="py-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setMode(followupQuestions.length ? 'followup' : 'questions')} className="text-gray-400 hover:text-white transition">←</button>
        <div><h2 className="text-lg font-bold text-white">AI Salah</h2><p className="text-gray-500 text-xs">{location}</p></div>
      </div>

      {rec && (
        <>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{cropEmoji(rec.recommended_crop)}</span>
              <div>
                <div className="text-white font-bold text-lg capitalize">{rec.recommended_crop}</div>
                <div className="text-green-400 text-xs">Confidence: {rec.confidence}%</div>
              </div>
            </div>
            <p className="text-gray-300 text-sm">{rec.why_this_crop}</p>
            {rec.weather_fit && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-xs text-blue-300 flex items-start gap-1.5">
                <span>🌤️</span><span>{rec.weather_fit}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {[['Expected Yield', rec.expected_yield_per_acre, 'text-blue-400'],
                ['Expected Income', rec.expected_income_per_acre, 'text-green-400']].map(([l, v, c]) => (
                <div key={l} className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-xs text-gray-400">{l}</div>
                  <div className={`font-semibold text-sm ${c}`}>{v}</div>
                </div>
              ))}
            </div>
            {rec.best_sowing_window && <div className="text-xs text-amber-400">⏰ Best Sowing: {rec.best_sowing_window}</div>}
          </div>

          {rec.weather_warnings?.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-1">
              <div className="text-xs font-semibold text-amber-400">⚠️ Mausam Chetavani</div>
              {rec.weather_warnings.map(w => <div key={w} className="text-gray-300 text-xs">• {w}</div>)}
            </div>
          )}

          {rec.alternative_crops?.length > 0 && (
            <div className={CARD}>
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Doosre Vikalp</div>
              <div className="flex gap-2 flex-wrap">
                {[rec.recommended_crop, ...rec.alternative_crops].map(c => (
                  <button key={c} onClick={() => setSelCrop(c)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition ${
                      selCrop === c ? 'bg-green-600/20 border-green-500 text-green-300' : 'bg-gray-700/40 border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}>
                    {cropEmoji(c)} <span className="capitalize">{c}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {rec.key_risks?.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-1">
              <div className="text-xs font-semibold text-red-400">⚠️ Khatre</div>
              {rec.key_risks.map(r => <div key={r} className="text-gray-300 text-xs">• {r}</div>)}
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
              <input type="number" step="0.1" min="0.1" className={INPUT} placeholder="e.g. 2.5" value={landSize} onChange={e => setLandSize(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Pani Ka Source</label>
              <select className={SELECT} value={irrigation} onChange={e => setIrrigation(e.target.value)}>
                {IRRIGATION.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </>
      )}
      <ErrorAlert error={err} />
      <button className={BTN_PRI} onClick={startJourney} disabled={loading}>🌱 Journey Shuru Karo</button>
    </div>
  )

  // ── STARTING ──────────────────────────────────────────────────────────────
  if (mode === 'starting') return (
    <div className="py-20 flex flex-col items-center gap-5 text-center">
      <div className="text-6xl animate-bounce">{cropEmoji(selCrop)}</div>
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Weather-Aware Calendar Ban Raha Hai</h2>
        <p className="text-gray-400 text-sm">AI {selCrop} ke liye mausam ke saath poori planning bana raha hai</p>
        <p className="text-gray-500 text-xs mt-1">Har hafte ka mausam + tasks + kharcha — 20-30 seconds...</p>
      </div>
      <SpinnerIcon />
    </div>
  )

  // ── REPORT ────────────────────────────────────────────────────────────────
  if (mode === 'report' && journey) {
    const rpt = journey.report
    return (
      <div className="py-6 space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h2 className="text-xl font-bold text-white">Journey Poori!</h2>
          <p className="text-gray-400 text-sm capitalize">{cropEmoji(journey.crop_type)} {journey.crop_type} · {journey.location}</p>
          {journey.plan_updates_count > 0 && (
            <p className="text-blue-400 text-xs mt-1">🔄 {journey.plan_updates_count} baar plan update hua mausam ke hisaab se</p>
          )}
        </div>
        {rpt && (
          <>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-2">
              <p className="text-gray-200 text-sm">{rpt.summary_hinglish}</p>
              {rpt.care_score && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${rpt.care_score}%` }} />
                  </div>
                  <span className="text-green-400 text-xs font-bold">{rpt.care_score}/100</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[['Kul Kharcha', rpt.total_cost_estimate, 'text-red-400'],
                ['Net Profit', rpt.net_profit_estimate, 'text-green-400'],
                ['Paidawar', rpt.yield_achieved, 'text-blue-400'],
                ['ROI', rpt.roi_percent ? `${rpt.roi_percent}%` : '—', 'text-amber-400'],
              ].map(([l, v, c]) => (
                <div key={l} className={CARD + ' text-center'}>
                  <div className="text-xs text-gray-400 mb-1">{l}</div>
                  <div className={`font-bold text-sm ${c}`}>{v}</div>
                </div>
              ))}
            </div>
            {rpt.weather_impact && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <div className="text-xs text-blue-400 font-semibold mb-1">🌤️ Mausam Ka Asar</div>
                <p className="text-gray-300 text-sm">{rpt.weather_impact}</p>
              </div>
            )}
            {rpt.highlights?.length > 0 && (
              <div className={CARD}><div className="text-xs text-gray-400 uppercase tracking-wide mb-2">✨ Highlights</div>
                {rpt.highlights.map(h => <div key={h} className="text-gray-300 text-sm">• {h}</div>)}
              </div>
            )}
            {rpt.lessons?.length > 0 && (
              <div className={CARD}><div className="text-xs text-gray-400 uppercase tracking-wide mb-2">📚 Sabak</div>
                {rpt.lessons.map(l => <div key={l} className="text-gray-300 text-sm">• {l}</div>)}
              </div>
            )}
            {rpt.next_season_tip && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <div className="text-xs text-amber-400 font-semibold mb-1">🔭 Agla Sezon</div>
                <p className="text-gray-300 text-sm">{rpt.next_season_tip}</p>
              </div>
            )}
          </>
        )}
        <button className={BTN_PRI} onClick={downloadReport}>📄 PDF Report Download Karo</button>

        {/* Sell your crop — Grade → Negotiate pipeline */}
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-500/30 rounded-xl p-4 space-y-3">
          <div className="text-white font-semibold text-sm text-center">🌾 Ab Apni Fasal Beche</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { localStorage.setItem('kd_harvest_crop', journey.crop_type); navigate('/grade') }}
              className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-sm py-3 rounded-xl transition font-medium flex flex-col items-center gap-1">
              <span className="text-xl">📸</span>
              <span className="text-xs">Agmark Grade Karo</span>
            </button>
            <button
              onClick={() => { localStorage.setItem('kd_harvest_crop', journey.crop_type); navigate('/negotiate') }}
              className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 text-sm py-3 rounded-xl transition font-medium flex flex-col items-center gap-1">
              <span className="text-xl">🤝</span>
              <span className="text-xs">Daam Negotiate Karo</span>
            </button>
          </div>
          <p className="text-[10px] text-gray-500 text-center">
            Grade A = 25% premium · Grade B = 15% premium over modal price
          </p>
        </div>

        <button onClick={resetJourney} className="w-full text-center text-gray-500 text-sm hover:text-gray-300 transition py-2">
          Nayi Journey Shuru Karo
        </button>
      </div>
    )
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  if (mode === 'dashboard' && journey) {
    const curWeek = calcCurrentWeek(journey.sowing_date, journey.total_weeks)
    const curWeekData = journey.task_calendar?.find(w => w.week === curWeek) || journey.task_calendar?.[0]
    const progress = journey.tasks_total > 0 ? Math.round((journey.tasks_completed / journey.tasks_total) * 100) : 0
    const photoTask = curWeekData?.tasks?.find(t => t.photo_needed)
    const detectedState = extractState(journey.location)
    const filteredSchemes = HARDCODED_SCHEMES.filter(s => s.state === 'all' || s.state === detectedState)

    return (
      <div className="py-4 space-y-3">
        {/* Header card */}
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
              {journey.plan_updates_count > 0 && (
                <div className="text-[10px] text-blue-400">🔄 {journey.plan_updates_count} updates</div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress</span><span>{progress}% · {journey.tasks_completed}/{journey.tasks_total} tasks</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Plan updated banner */}
        {planUpdated !== null && (
          <div className={`rounded-lg p-2.5 text-xs flex items-center gap-2 ${
            planUpdated > 0 ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300' : 'bg-gray-700/40 text-gray-400'
          }`}>
            {planUpdated > 0
              ? <>🔄 Plan update hua! {planUpdated} hafte ki tasks mausam ke hisaab se revise ki gayi</>
              : <>✓ Plan theek hai — koi major changes zaroori nahi</>}
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-800/60 rounded-xl p-1 border border-gray-700/40">
          {[['tasks','📋 Tasks'],['weather','🌤️ Mausam'],['subsidies','🏛️ Sahayata'],['timeline','📅 Timeline']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition ${
                activeTab === tab ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}>{label}</button>
          ))}
        </div>

        <ErrorAlert error={err} />

        {/* ── TASKS TAB ── */}
        {activeTab === 'tasks' && curWeekData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">Week {curWeekData.week} — {curWeekData.stage}</div>
                <div className="text-gray-400 text-xs">{curWeekData.date_range || curWeekData.days_range}</div>
              </div>
              <div className="flex items-center gap-2">
                {photoTask && (
                  <>
                    <button onClick={() => { setPhotoWeek(curWeek); setPhotoStage(curWeekData.stage); cropPhotoRef.current?.click() }}
                      disabled={loading}
                      className="bg-purple-600/20 border border-purple-500/40 text-purple-400 text-xs px-2.5 py-1.5 rounded-lg hover:bg-purple-600/30 transition flex items-center gap-1">
                      {loading ? <SpinnerIcon /> : '📸'} Photo Check
                    </button>
                    <input ref={cropPhotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCropPhoto} />
                  </>
                )}
              </div>
            </div>

            {/* Current week weather */}
            {curWeekData.expected_weather?.conditions && (
              <div className={`rounded-lg p-2.5 flex items-start gap-2 text-xs ${
                curWeekData.expected_weather.frost_risk ? 'bg-blue-900/20 border border-blue-500/20 text-blue-300'
                : curWeekData.expected_weather.heat_stress ? 'bg-red-900/20 border border-red-500/20 text-red-300'
                : 'bg-gray-700/30 border border-gray-600/30 text-gray-300'
              }`}>
                <span className="text-base">{WEATHER_ICON(curWeekData.expected_weather)}</span>
                <div>
                  <div className="font-medium">{curWeekData.expected_weather.conditions}</div>
                  <div className="text-gray-400 mt-0.5">
                    {curWeekData.expected_weather.temp_range} · {curWeekData.expected_weather.rain_mm_week || 0}mm baarish
                    {curWeekData.expected_weather.frost_risk && ' · ❄️ Frost risk'}
                    {curWeekData.expected_weather.heat_stress && ' · 🌡️ Heat stress'}
                  </div>
                  {curWeekData.weather_advisory && <div className="text-amber-400 mt-1">⚠️ {curWeekData.weather_advisory}</div>}
                </div>
              </div>
            )}

            {/* Tasks list */}
            <div className="space-y-2">
              {curWeekData.tasks?.map(task => {
                const done = journey.completed_tasks.includes(task.task_id)
                return (
                  <div key={task.task_id} onClick={() => toggleTask(task.task_id)}
                    className={`${CARD} cursor-pointer transition-all ${done ? 'opacity-60 bg-green-900/15' : 'hover:border-gray-600'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${done ? 'bg-green-600 border-green-600' : 'border-gray-500'}`}>
                        {done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{TASK_ICON[task.category] || '📌'}</span>
                          <span className="text-sm font-medium text-white">{task.title}</span>
                          {task.critical && <span className="text-[9px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded">Critical</span>}
                          {task.photo_needed && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded">📸</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{task.desc}</p>
                        {task.weather_condition && <p className="text-[10px] text-amber-400 mt-1">⚠️ {task.weather_condition}</p>}
                        {(task.water_liters_per_acre > 0 || task.inputs?.length > 0) && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {task.water_liters_per_acre > 0 && (
                              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                💧{task.water_liters_per_acre.toLocaleString()}L/acre
                              </span>
                            )}
                            {task.inputs?.map(inp => (
                              <span key={inp.name} className="text-[10px] bg-gray-700/60 text-gray-300 border border-gray-600/30 px-1.5 py-0.5 rounded">
                                {inp.name} {inp.quantity}{inp.cost_approx ? ` (${inp.cost_approx})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                        <ChemicalDetail chemicals={task.chemicals} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Update plan / complete journey */}
            <div className="flex gap-2 pt-1">
              <button onClick={() => updatePlan('manual')} disabled={updatingPlan}
                className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs py-2 rounded-xl transition flex items-center justify-center gap-1">
                {updatingPlan ? <><SpinnerIcon /> Updating...</> : '🔄 Mausam Se Plan Update Karo'}
              </button>
              {curWeek >= journey.total_weeks && (
                <button onClick={() => setCompleteModal(true)}
                  className="flex-1 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 text-xs py-2 rounded-xl transition">
                  🏆 Journey Khatam
                </button>
              )}
            </div>

            {/* Post-harvest sell CTA — shown when last week reached */}
            {curWeek >= journey.total_weeks && (
              <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cropEmoji(journey.crop_type)}</span>
                  <div>
                    <div className="text-white font-bold text-sm">Fasal Harvest Ready Hai!</div>
                    <div className="text-green-400 text-xs">Grade karwao aur best price mein beche</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { localStorage.setItem('kd_harvest_crop', journey.crop_type); navigate('/grade') }}
                    className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 font-medium">
                    📸 Fasal Grade Karo
                  </button>
                  <button
                    onClick={() => { localStorage.setItem('kd_harvest_crop', journey.crop_type); navigate('/negotiate') }}
                    className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 font-medium">
                    🤝 Mandi Mein Beche
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 text-center">
                  Grade karke negotiate karne par 10-25% zyada daam milta hai
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── WEATHER TAB ── */}
        {activeTab === 'weather' && (
          <div className="space-y-3">
            {!wxData && <div className="text-center py-8"><SpinnerIcon /></div>}
            {wxData?.current && (
              <>
                <div className={CARD + ' space-y-3'}>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Abhi Ka Mausam — {wxData.location}</div>
                    {wxData.source === 'ai_estimate' && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-semibold">AI Estimate</span>
                    )}
                    {wxData.source === 'static_fallback' && (
                      <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">Offline</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-bold text-white">{wxData.current.temp_c}°C</div>
                      <div className="text-gray-400 text-sm">{wxData.current.desc}</div>
                    </div>
                    <div className="text-right space-y-1 text-xs text-gray-400">
                      <div>Nami: <span className="text-blue-400">{wxData.current.humidity}%</span></div>
                      <div>Hawa: <span className="text-gray-200">{wxData.current.wind_kmph} km/h</span></div>
                      <div>Feels: <span className="text-gray-200">{wxData.current.feels_like_c}°C</span></div>
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
                {/* Upcoming week weather from calendar */}
                <div className={CARD + ' space-y-2'}>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Is Hafte Ki Mausam (AI Forecast)</div>
                  {curWeekData?.expected_weather && (
                    <div className="space-y-1">
                      <div className="text-white font-medium text-sm">{WEATHER_ICON(curWeekData.expected_weather)} {curWeekData.expected_weather.conditions}</div>
                      <div className="text-xs text-gray-400">{curWeekData.expected_weather.temp_range} · Nami {curWeekData.expected_weather.humidity_pct}% · Baarish {curWeekData.expected_weather.rain_mm_week || 0}mm</div>
                      {curWeekData.weather_advisory && <div className="text-xs text-amber-400">⚠️ {curWeekData.weather_advisory}</div>}
                    </div>
                  )}
                </div>
              </>
            )}
            {wxData?.error && <div className="text-center text-gray-500 text-sm py-8">Weather unavailable</div>}
          </div>
        )}

        {/* ── SUBSIDIES TAB ── */}
        {activeTab === 'subsidies' && (
          <div className="space-y-3">
            {subLoading && <div className="text-center py-6"><SpinnerIcon /></div>}
            {subsidies.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 uppercase tracking-wide">Live Govt Alerts</div>
                {subsidies.map((s, i) => (
                  <div key={i} className={CARD + ' space-y-1'}>
                    <div className="text-xs text-green-400 font-semibold">{s.source}</div>
                    <div className="text-sm font-medium text-white">{s.title}</div>
                    {s.summary && <p className="text-xs text-gray-400 line-clamp-3">{s.summary}</p>}
                    <div className="flex items-center justify-between">
                      {s.published && <div className="text-[10px] text-gray-500">{s.published}</div>}
                      {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:text-green-300">Aur Padhe →</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Aapke Liye Schemes — {filteredSchemes.length} milye
              </div>
              <div className="space-y-2">
                {filteredSchemes.map(s => (
                  <div key={s.id} className={CARD + ' space-y-1'}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.state === 'all' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{s.tag}</span>
                    </div>
                    <div className="text-sm font-medium text-white">{s.name}</div>
                    <p className="text-xs text-gray-400">{s.desc}</p>
                    <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:text-green-300 inline-block">Apply karo →</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TIMELINE TAB ── */}
        {activeTab === 'timeline' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">Poori Journey — {journey.total_weeks} hafte</div>
              <button onClick={() => updatePlan('manual')} disabled={updatingPlan}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition">
                {updatingPlan ? <SpinnerIcon /> : '🔄'} Refresh Plan
              </button>
            </div>
            <div className="space-y-1.5">
              {journey.task_calendar?.map(week => (
                <WeekCard key={week.week} week={week} curWeek={curWeek}
                  completedTasks={journey.completed_tasks}
                  onToggleTask={toggleTask} />
              ))}
            </div>
          </div>
        )}

        {/* ── Photo result modal ── */}
        {photoModal && photoResult && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
            <div className="bg-gray-900 border-t border-gray-700 rounded-t-2xl w-full p-5 space-y-3 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Crop Health Report</h3>
                <button onClick={() => setPhotoModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-4xl font-bold ${photoResult.health_score >= 75 ? 'text-green-400' : photoResult.health_score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {photoResult.health_score}
                </div>
                <div>
                  <div className="text-white font-medium capitalize">{photoResult.status?.replace(/_/g, ' ')}</div>
                  <div className="text-gray-400 text-xs">Health Score / 100</div>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${photoResult.health_score >= 75 ? 'bg-green-500' : photoResult.health_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${photoResult.health_score}%` }} />
              </div>
              {photoResult.observations?.length > 0 && (
                <div className="space-y-1">
                  {photoResult.observations.map(o => <div key={o} className="text-gray-300 text-sm">• {o}</div>)}
                </div>
              )}
              {photoResult.weather_related_risks?.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 space-y-1">
                  <div className="text-xs text-blue-400 font-semibold">🌤️ Mausam Se Khatra</div>
                  {photoResult.weather_related_risks.map(r => <div key={r} className="text-gray-300 text-xs">• {r}</div>)}
                </div>
              )}
              {photoResult.immediate_action && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="text-xs text-amber-400 font-semibold mb-1">⚡ Abhi Kya Kare</div>
                  <p className="text-gray-200 text-sm">{photoResult.immediate_action}</p>
                </div>
              )}
              {photoResult.do_not_do?.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1">
                  <div className="text-xs text-red-400 font-semibold">🚫 Yeh Mat Karo</div>
                  {photoResult.do_not_do.map(d => <div key={d} className="text-gray-300 text-xs">• {d}</div>)}
                </div>
              )}
              {photoResult.plan_update_needed && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="text-xs text-blue-400 font-semibold mb-1">🔄 Plan Update Hua</div>
                  <p className="text-gray-300 text-xs">Crop condition ke hisaab se aage ke weeks update ho rahe hain...</p>
                </div>
              )}
              {photoResult.subsidy_claim_tip && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <div className="text-xs text-green-400 font-semibold mb-1">🏛️ Subsidy Tip</div>
                  <p className="text-gray-200 text-sm">{photoResult.subsidy_claim_tip}</p>
                </div>
              )}
              <button onClick={() => setPhotoModal(false)} className={BTN_PRI}>Samjha ✓</button>
            </div>
          </div>
        )}

        {/* ── Complete journey modal ── */}
        {completeModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end">
            <div className="bg-gray-900 border-t border-gray-700 rounded-t-2xl w-full p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Journey Khatam Karo</h3>
                <button onClick={() => setCompleteModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bikri Ka Bhav (₹/kg)</label>
                <input type="number" step="0.5" min="0" className={INPUT} placeholder="e.g. 22.50" value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Total Qty Becha (kg) — Optional</label>
                <input type="number" step="1" min="0" className={INPUT} placeholder="e.g. 2500" value={qtySold} onChange={e => setQtySold(e.target.value)} />
              </div>
              <ErrorAlert error={err} />
              <button className={BTN_PRI} onClick={completeJourney} disabled={loading}>
                {loading ? <><SpinnerIcon /> AI Report Ban Raha Hai...</> : '🏆 Poori Karo & Report Dekho'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
