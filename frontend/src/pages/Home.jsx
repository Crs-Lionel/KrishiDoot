import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="space-y-5 mt-6">
      {/* Hero */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
        <h2 className="text-xl font-bold text-green-800 mb-1">Namaste, Kisan! 🙏</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          I am your AI negotiation agent. I will help you get a <strong>fair price</strong> at
          the mandi by negotiating on your behalf using real market data.
        </p>
      </div>

      {/* DPDP Consent Banner — required before image upload per India's DPDP Act 2023 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="font-semibold text-amber-800 text-sm mb-1">📋 Data Consent (DPDP Act 2023)</p>
        <p className="text-amber-700 text-xs leading-relaxed">
          By using this app, you consent to your crop images and negotiation data being
          processed to improve your price outcomes. Your data is <strong>never shared with buyers</strong>.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/grade"
          className="bg-green-600 hover:bg-green-700 text-white rounded-2xl p-5 text-center shadow-sm transition-colors">
          <div className="text-3xl mb-2">📸</div>
          <div className="font-semibold text-sm">Grade My Crop</div>
          <div className="text-xs text-green-200 mt-1">AI Agmark grading</div>
        </Link>
        <Link to="/negotiate"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 text-center shadow-sm transition-colors">
          <div className="text-3xl mb-2">🤝</div>
          <div className="font-semibold text-sm">Negotiate Price</div>
          <div className="text-xs text-blue-200 mt-1">AI negotiates for you</div>
        </Link>
        <Link to="/market"
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-5 text-center shadow-sm col-span-2 transition-colors">
          <div className="text-3xl mb-2">📊</div>
          <div className="font-semibold text-sm">Today's Mandi Prices</div>
          <div className="text-xs text-orange-100 mt-1">Live APMC data</div>
        </Link>
      </div>

      {/* Info */}
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 text-center">
        Powered by Gemini Vision · LangGraph · data.gov.in APMC API
      </div>
    </div>
  )
}
