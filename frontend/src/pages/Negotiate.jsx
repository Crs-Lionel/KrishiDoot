import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { gsap } from 'gsap'
import { LeafIcon, AlertIcon, SpinnerIcon, ErrorAlert, INPUT_CLS, SELECT_CLS, KD_CARD, triggerConfetti, PulsingDot, PriceDisplay, CropBadge } from '../components/ui.jsx'

// API
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Agent Avatar
function AgentAvatar({ isThinking }) {
  return (
    <div className="relative">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white relative z-10"
           style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)', boxShadow: '0 2px 10px rgba(34,197,94,0.3)' }}>
        <LeafIcon className="w-4 h-4" />
      </div>
      {isThinking && (
        <>
          <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40" />
          <div className="absolute -inset-1 rounded-full border border-green-500 animate-pulse opacity-30" />
        </>
      )}
    </div>
  )
}

function BuyerAvatar() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white"
         style={{ background: 'linear-gradient(135deg, #475569, #1e293b)', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
      <span className="text-xs">👔</span>
    </div>
  )
}

export default function Negotiate() {
  const [searchParams] = useSearchParams()
  const initCrop = searchParams.get('crop') || 'tomato'
  const initGrade = searchParams.get('grade') || 'A'

  const [setup, setSetup] = useState({
    crop: initCrop,
    grade: initGrade,
    quantity: '100',
    mandi_location: 'Pune, Maharashtra'
  })

  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('setup') // setup, negotiating, agreed, failed
  
  // Buyer input state
  const [buyerInput, setBuyerInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false) // voice mode toggles STT + TTS
  const recognitionRef = useRef(null)
  const audioRef = useRef(null)

  // Analytics tracking
  const [rounds, setRounds] = useState(0)
  const [targetPrice, setTargetPrice] = useState(0)
  const [currentOffer, setCurrentOffer] = useState(0)
  const [batnaPrice, setBatnaPrice] = useState(0)
  const [portfolioValue, setPortfolioValue] = useState(0)

  const chatEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const successRef = useRef(null)
  const portfolioRef = useRef(null)

  // Play audio from TTS response
  const playAudio = useCallback((src) => {
    if (!src) return
    try {
      if (!src.startsWith('data:')) {
         src = `data:audio/wav;base64,${src}`
      }
      if (audioRef.current) {
        audioRef.current.pause()
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src)
        }
      }
      audioRef.current = new Audio(src)
      audioRef.current.play().catch(e => console.warn('[TTS] Playback failed:', e))
    } catch (e) {
      console.warn('[TTS] Setup failed:', e)
    }
  }, [])

  // Start Negotiation
  const handleStart = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/negotiate/start?voice_mode=${voiceMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: 'web_user_' + Date.now(),
          crop_type: setup.crop.toLowerCase(),
          quantity_kg: parseFloat(setup.quantity),
          mandi_location: setup.mandi_location,
          crop_grade: setup.grade,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to start')

      setSessionId(data.session_id)
      const openingMsg = `Namaste! Mera ${setup.crop} Grade ${setup.grade} hai — ${setup.quantity} kg. Mandi rate ke hisaab se mera price ₹${data.initial_ask}/kg hai. Aap kitna de sakte ho?`
      setMessages([{ role: 'agent', content: openingMsg }])
      setStatus('negotiating')
      
      // Setup analytics
      setTargetPrice(data.initial_ask || 0)
      setCurrentOffer(data.initial_ask || 0)
      setBatnaPrice(data.batna_price || 0)

      // Play TTS if voice mode
      if (data.audio_b64) playAudio(data.audio_b64)
      
      // Animate transition
      gsap.fromTo('.chat-area', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 })
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Send Buyer Message — parse price from text and call /negotiate/respond
  const handleSend = async (e) => {
    if (e) e.preventDefault()
    if (!buyerInput.trim() || !sessionId || loading) return

    const msg = buyerInput
    setBuyerInput('')
    setMessages(prev => [...prev, { role: 'buyer', content: msg }])
    setLoading(true)

    // Extract numeric price from buyer message as fallback
    const priceMatch = msg.match(/(\d+(?:\.\d+)?)/)
    const buyerOffer = priceMatch ? parseFloat(priceMatch[1]) : null

    try {
      const res = await fetch(`${API_BASE}/negotiate/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: sessionId, 
          buyer_message: msg,
          buyer_counter_offer: buyerOffer, 
          voice_mode: voiceMode 
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to send')

      setMessages(prev => [...prev, { role: 'agent', content: data.agent_dialogue }])
      setRounds(r => r + 1)
      setCurrentOffer(data.new_ask)

      // Play TTS audio if returned
      if (data.audio_b64) playAudio(data.audio_b64)

      if (data.status === 'agreed' || data.status === 'rejected') {
        setStatus(data.status === 'rejected' ? 'failed' : 'agreed')
        if (data.status === 'agreed') {
          const finalPrice = data.final_price || data.new_ask
          const totalValue = finalPrice * parseFloat(setup.quantity)
          
          const pObj = { val: portfolioValue }
          gsap.to(pObj, {
            val: portfolioValue + totalValue,
            duration: 2,
            ease: 'power3.out',
            onUpdate: () => setPortfolioValue(pObj.val)
          })
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Real Web Speech API STT — toggles microphone on/off
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Voice recording is not supported in this browser. Please use Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'hi-IN' // Hinglish — Hindi + English
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsRecording(true)
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = (e) => {
      setIsRecording(false)
      if (e.error !== 'no-speech') setError('Microphone error: ' + e.error)
    }
    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || ''
      if (transcript) setBuyerInput(transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isRecording])

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Success animation
  useEffect(() => {
    if (status === 'agreed' && successRef.current) {
      gsap.fromTo(successRef.current,
        { scale: 0.8, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.7)', delay: 0.2 }
      )
      setTimeout(() => triggerConfetti(successRef.current), 500)
    }
  }, [status])

  return (
    <div className="pt-6 pb-24 h-[calc(100vh-64px)] flex flex-col animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="mb-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight" style={{ color: 'var(--text-primary)' }}>Agent Negotiator</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI-powered deal closing</p>
        </div>
        
        {/* Portfolio Counter (Header) */}
        {status !== 'setup' && (
          <div className="text-right px-3 py-1.5 rounded-xl kd-glass" style={{ border: '1px solid var(--border-subtle)' }}>
            <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Deal Value</p>
            <div className="flex items-baseline justify-end gap-0.5 text-green-500">
              <span className="text-xs">₹</span>
              <span className="font-bold font-mono" ref={portfolioRef}>{portfolioValue.toLocaleString('en-IN', {maximumFractionDigits:0})}</span>
            </div>
          </div>
        )}
      </div>

      <ErrorAlert error={error} />

      {/* SETUP PHASE */}
      {status === 'setup' && (
        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
          
          <div className="mb-6 flex justify-center py-4">
            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-green-500/10 border border-green-500/20 relative">
              <span className="text-4xl">🤝</span>
              {/* Decorative animation rings */}
              <div className="absolute inset-0 rounded-full border border-green-500/30 animate-ping" style={{ animationDuration: '3s' }} />
            </div>
          </div>

          <div className={`${KD_CARD} p-5 mb-6`}>
            <form onSubmit={handleStart} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1" style={{ color: 'var(--text-muted)' }}>Crop</label>
                  <select 
                    value={setup.crop} 
                    onChange={e => setSetup({...setup, crop: e.target.value})} 
                    className={SELECT_CLS}
                  >
                    <option value="tomato">Tomato</option>
                    <option value="onion">Onion</option>
                    <option value="wheat">Wheat</option>
                    <option value="potato">Potato</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1" style={{ color: 'var(--text-muted)' }}>Grade</label>
                  <select 
                    value={setup.grade} 
                    onChange={e => setSetup({...setup, grade: e.target.value})} 
                    className={SELECT_CLS}
                  >
                    <option value="A">Grade A (Premium)</option>
                    <option value="B">Grade B (Standard)</option>
                    <option value="C">Grade C (Fair)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1" style={{ color: 'var(--text-muted)' }}>Quantity (kg)</label>
                  <input 
                    type="number" 
                    value={setup.quantity} 
                    onChange={e => setSetup({...setup, quantity: e.target.value})} 
                    className={INPUT_CLS} 
                    min="1" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 ml-1" style={{ color: 'var(--text-muted)' }}>Mandi Location</label>
                  <input 
                    type="text" 
                    value={setup.mandi_location} 
                    onChange={e => setSetup({...setup, mandi_location: e.target.value})} 
                    className={INPUT_CLS}
                    placeholder="e.g. Pune, Maharashtra"
                  />
                </div>
              </div>

              {/* Voice Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-base)', border: `1px solid ${voiceMode ? 'rgba(34,197,94,0.4)' : 'var(--border-subtle)'}` }}>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>🎙️ Voice Mode</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>AI replies in spoken Hinglish using Gemini TTS</p>
                </div>
                <button
                  type="button"
                  onClick={() => setVoiceMode(v => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${voiceMode ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${voiceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full kd-btn-primary text-white font-bold py-3.5 rounded-xl mt-2 flex items-center justify-center gap-2"
              >
                {loading ? <SpinnerIcon /> : (voiceMode ? '🎙️ Start Voice Negotiation' : 'Start AI Negotiator')}
              </button>
            </form>
          </div>

          {/* Info steps */}
          <div className="space-y-3 px-2">
            {[
              { t: 'Sets strict price floor', d: 'Calculates BATNA using live data & transport costs' },
              { t: 'Adapts to perishability', d: 'Conceder strategy for tomatoes, Boulware for wheat' },
              { t: 'Never gets emotional', d: 'Responds objectively to lowball tactics' }
            ].map((step, i) => (
              <div key={i} className="flex gap-3 items-center group">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-green-600 bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  {i+1}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{step.t}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHAT PHASE */}
      {status !== 'setup' && (
        <div className="flex-1 flex flex-col overflow-hidden chat-area rounded-2xl" style={{ border: '1px solid var(--border-card)', background: 'var(--bg-card-2)' }}>
          
          {/* Analytics strip */}
          <div className="flex justify-between items-center px-4 py-2 text-[10px] font-bold uppercase border-b"
               style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-green-500">
                <PulsingDot color="#22c55e" size={6} />
                Live Session
              </span>
              <span className="opacity-40">|</span>
              <span style={{ color: 'var(--text-muted)' }}>Round {rounds}</span>
              {voiceMode && (
                <>
                  <span className="opacity-40">|</span>
                  <span className="text-purple-400 flex items-center gap-1">🎙️ Voice On</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <CropBadge crop={setup.crop} className="py-0.5 px-2 bg-transparent border-none scale-90 origin-right" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar" ref={chatContainerRef}>
            {messages.map((m, i) => {
              const isAgent = m.role === 'agent'
              return (
                <div key={i} className={`flex ${isAgent ? 'justify-start' : 'justify-end'} gap-2.5 max-w-[90%] ${isAgent ? '' : 'ml-auto'}`}>
                  {isAgent && <AgentAvatar isThinking={i === messages.length - 1 && loading} />}
                  
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed relative ${
                    isAgent 
                      ? 'rounded-tl-sm text-white shadow-md'
                      : 'rounded-tr-sm shadow-sm'
                  }`}
                  style={{
                    background: isAgent ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'var(--input-bg)',
                    color: isAgent ? '#fff' : 'var(--text-primary)',
                    border: isAgent ? '1px solid #22c55e' : '1px solid var(--border-subtle)'
                  }}>
                    {/* Tiny tail for agent bubble */}
                    {isAgent && <div className="absolute top-0 -left-2 w-4 h-4 bg-[#16a34a] rounded-br-lg transform -skew-x-12" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />}
                    
                    {/* Message content parsing to highlight numbers */}
                    {m.content.split(/(₹\d+(?:,\d+)*(?:\.\d+)?)/g).map((part, j) => {
                      if (part.startsWith('₹')) return <span key={j} className={`font-mono font-bold ${isAgent ? 'text-amber-300' : 'text-green-500'}`}>{part}</span>
                      return part
                    })}
                  </div>
                  
                  {!isAgent && <BuyerAvatar />}
                </div>
              )
            })}
            
            {loading && messages[messages.length-1]?.role === 'buyer' && (
              <div className="flex justify-start gap-2.5">
                <AgentAvatar isThinking={true} />
                <div className="p-3 rounded-2xl rounded-tl-sm text-white flex gap-1 items-center w-16"
                     style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Deal Concluded State */}
          {status === 'agreed' && (
            <div className="p-4 bg-green-500/10 border-t border-green-500/20 relative overflow-hidden" ref={successRef}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 blur-3xl opacity-20" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xl">✅</span>
                    <h3 className="font-bold text-green-500 font-display">Deal Agreed!</h3>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Final negotiated price</p>
                </div>
                <div className="text-right">
                  <PriceDisplay amount={currentOffer || targetPrice} size="md" className="text-green-500" unit="/kg" />
                </div>
              </div>
              <button onClick={() => setStatus('setup')} className="w-full mt-4 text-xs font-bold text-center py-2 rounded-lg"
                      style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                Start New Negotiation
              </button>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="p-4 bg-red-500/10 border-t border-red-500/20 text-center">
              <span className="text-xl mb-1 block">🚫</span>
              <h3 className="font-bold text-red-500 text-sm">Negotiation Failed</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Buyer would not meet the floor price.</p>
              <button onClick={() => setStatus('setup')} className="mt-3 text-xs font-bold px-4 py-1.5 rounded-lg border border-red-500/30 text-red-400">Restart</button>
            </div>
          )}

          {/* Input Area */}
          {status === 'negotiating' && (
            <div className="p-3 bg-transparent border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              {/* Current price bar */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Farmer asking</span>
                <span className="text-xs font-black font-mono text-amber-500">₹{currentOffer.toFixed(2)}/kg</span>
              </div>

              {/* Quick counter-offer chips */}
              {currentOffer > 0 && (
                <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar">
                  {[0.70, 0.80, 0.90, 0.95].map(pct => {
                    const offer = Math.round(currentOffer * pct * 100) / 100
                    if (offer < batnaPrice * 0.5) return null
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setBuyerInput(`I can pay ₹${offer}/kg`)}
                        className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all hover:border-green-500/50 hover:bg-green-500/5"
                        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                      >
                        ₹{offer}
                        <span className="ml-1 opacity-50">({Math.round(pct*100)}%)</span>
                      </button>
                    )
                  })}
                </div>
              )}

              <form onSubmit={handleSend} className="flex gap-2">
                <button 
                  type="button" 
                  onClick={toggleRecording}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'kd-glass'}`}
                  style={!isRecording ? { border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' } : {}}
                >
                  {isRecording ? (
                    <div className="flex items-center gap-0.5">
                      <span className="waveform-bar" style={{ animationDelay: '0s' }} />
                      <span className="waveform-bar h-4" style={{ animationDelay: '0.1s' }} />
                      <span className="waveform-bar" style={{ animationDelay: '0.2s' }} />
                    </div>
                  ) : '🎤'}
                </button>
                <input
                  type="text"
                  value={buyerInput}
                  onChange={e => setBuyerInput(e.target.value)}
                  placeholder="Counter with a price e.g. ₹15/kg"
                  className={`flex-1 ${INPUT_CLS}`}
                  style={{ background: 'var(--input-bg)' }}
                  disabled={loading || isRecording}
                />
                <button 
                  type="submit" 
                  disabled={!buyerInput.trim() || loading}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-transform active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                    <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                  </svg>
                </button>
              </form>
              <p className="text-[9px] text-center mt-2 opacity-50">You are the buyer — offer a price below the asking price to negotiate</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
