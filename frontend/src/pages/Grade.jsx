import { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const GRADE_COLORS = { A: 'text-green-700 bg-green-50', B: 'text-yellow-700 bg-yellow-50', C: 'text-red-700 bg-red-50' }
const GRADE_LABELS = { A: 'Premium', B: 'Standard', C: 'Below Standard' }

export default function Grade() {
  const [imageB64, setImageB64] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [cropType, setCropType] = useState('tomato')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
      setImageB64(reader.result.split(',')[1]) // strip data:image/...;base64, prefix
      setResult(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleGrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/grade/crop`, {
        image_b64: imageB64,
        crop_type: cropType,
      })
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 mt-6">
      <h2 className="text-xl font-bold text-green-800">Grade My Crop 📸</h2>
      <p className="text-sm text-gray-500">Take a photo — AI will apply Agmark standards and estimate your price band.</p>

      <select className="w-full border border-gray-200 rounded-xl p-3 bg-white text-sm"
        value={cropType} onChange={e => setCropType(e.target.value)}>
        <option value="tomato">Tomato</option>
        <option value="wheat">Wheat</option>
        <option value="onion">Onion</option>
        <option value="potato">Potato</option>
      </select>

      {/* Image picker — capture="environment" opens rear camera on mobile */}
      <label className="block">
        <div className="border-2 border-dashed border-green-300 rounded-xl p-6 text-center cursor-pointer hover:bg-green-50 transition-colors">
          {imagePreview
            ? <img src={imagePreview} alt="crop" className="max-h-48 mx-auto rounded-lg object-cover" />
            : <><div className="text-4xl mb-2">📷</div><div className="text-sm text-gray-500">Tap to take photo or upload</div></>
          }
        </div>
        <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
      </label>

      <button onClick={handleGrade} disabled={!imageB64 || loading}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40 transition-opacity">
        {loading ? '🔍 Analysing with Gemini Vision...' : 'Get Agmark Grade'}
      </button>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>}

      {result && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className={`text-3xl font-bold rounded-xl p-3 text-center ${GRADE_COLORS[result.grade]}`}>
            Grade {result.grade} — {GRADE_LABELS[result.grade]}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Estimated Price</span>
            <span className="font-semibold text-green-700">{result.estimated_price_band}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">AI Confidence</span>
            <span className="font-semibold">{(result.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="text-xs text-gray-400">{result.agmark_standard}</div>
          {result.defects.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Defects found:</p>
              <ul className="space-y-1">
                {result.defects.map((d, i) => (
                  <li key={i} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg">⚠ {d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
