import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STATUS_COLORS = {
  ongoing: 'text-blue-600',
  agreed: 'text-green-600',
  rejected: 'text-red-600',
}

export default function Negotiate() {
  const [step, setStep] = useState('setup') // 'setup' | 'negotiating' | 'done'
  const [form, setForm] = useState({
    crop_type: 'tomato',
    quantity_kg: 100,
    mandi_location: 'Bengaluru, Karnataka',
  })
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [counterOffer, setCounterOffer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const chatRef = useRef(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const startNegotiation = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/negotiate/start`, {
        ...form,
        farmer_id: 'demo-farmer-' + Date.now(),
      })
      setSession(res.data)
      setMessages([{
        role: 'agent',
        text: `Negotiation started for ${form.crop_type.title} (${form.quantity_kg}kg).\n` +
              `My opening ask: ₹${res.data.initial_ask}/kg\n` +
              `Floor price (BATNA): ₹${res.data.batna_price}/kg — I will never go below this.`,
        price: res.data.initial_ask,
      }])
      setStep('negotiating')
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  const sendOffer = async () => {
    const offer = parseFloat(counterOffer)
    if (isNaN(offer) || offer <= 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/negotiate/respond`, {
        session_id: session.session_id,
        buyer_counter_offer: offer,
      })
      setMessages(prev => [
        ...prev,
        { role: 'buyer', text: `Buyer offers: ₹${offer}/kg`, price: offer },
        { role: 'agent', text: `${res.data.agent_dialogue}`, price: res.data.new_ask },
      ])
      setCounterOffer('')
      if (res.data.status !== 'ongoing') setStep('done')
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'setup') return (
    <div className="space-y-4 mt-6">
      <h2 className="text-xl font-bold text-green-800">AI Negotiation 🤝</h2>
      <p className="text-sm text-gray-500">I will negotiate on your behalf using real market prices.</p>

      <div className="space-y-3 bg-white rounded-2xl p-5 shadow-sm">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Crop</label>
          <select className="w-full border border-gray-200 rounded-xl p-3 text-sm"
            value={form.crop_type} onChange={e => setForm({ ...form, crop_type: e.target.value })}>
            <option value="tomato">Tomato (Perishable → Conceder strategy)</option>
            <option value="wheat">Wheat (Non-perishable → Boulware strategy)</option>
            <option value="onion">Onion</option>
            <option value="potato">Potato</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Quantity (kg)</label>
          <input className="w-full border border-gray-200 rounded-xl p-3 text-sm"
            type="number" value={form.quantity_kg}
            onChange={e => setForm({ ...form, quantity_kg: parseFloat(e.target.value) })} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Mandi Location</label>
          <input className="w-full border border-gray-200 rounded-xl p-3 text-sm"
            placeholder="e.g. Bengaluru, Karnataka" value={form.mandi_location}
            onChange={e => setForm({ ...form, mandi_location: e.target.value })} />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>}

      <button onClick={startNegotiation} disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40">
        {loading ? 'Fetching market prices...' : '🚀 Start AI Negotiation'}
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-green-800">Negotiation Live</h2>
        {session && (
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
            Floor: ₹{session.batna_price}/kg
          </div>
        )}
      </div>

      {/* Chat */}
      <div ref={chatRef} className="flex-1 overflow-y-auto space-y-2 mb-3 bg-white rounded-2xl p-3 shadow-sm">
        {messages.map((m, i) => (
          <div key={i}
            className={`p-3 rounded-xl text-sm max-w-xs ${
              m.role === 'agent'
                ? 'bg-green-50 text-green-900 self-start'
                : 'bg-blue-50 text-blue-900 ml-auto'
            }`}>
            <div className="font-semibold text-xs mb-1">
              {m.role === 'agent' ? '🤖 KrishiDoot' : '👤 Buyer'}
            </div>
            <div className="whitespace-pre-line">{m.text}</div>
            <div className="text-xs opacity-60 mt-1">₹{m.price}/kg</div>
          </div>
        ))}
        {step === 'done' && (
          <div className="bg-green-100 text-green-800 font-bold text-center py-3 rounded-xl">
            Negotiation Complete!
          </div>
        )}
      </div>

      {/* Input */}
      {step === 'negotiating' && (
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
            type="number"
            placeholder="Buyer's offer (₹/kg)"
            value={counterOffer}
            onChange={e => setCounterOffer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendOffer()}
          />
          <button onClick={sendOffer} disabled={loading || !counterOffer}
            className="bg-blue-600 text-white px-4 rounded-xl text-sm font-semibold disabled:opacity-40">
            {loading ? '...' : 'Send'}
          </button>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 text-xs rounded-xl p-2 mt-2">{error}</div>}
    </div>
  )
}
