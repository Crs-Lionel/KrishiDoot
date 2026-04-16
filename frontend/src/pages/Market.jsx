// Market.jsx — Person 3's task
// Build a UI that lets the farmer search APMC prices by crop + state.
//
// API: GET /market/price?crop=tomato&state=karnataka
// Response: { crop, state, modal_price_per_kg, unit }
//
// Suggested UI:
//   - Crop selector (dropdown) + State input
//   - Fetch button → show modal price + computed BATNA (modal_price - 2)
//   - Show "Source: data.gov.in APMC" attribution

export default function Market() {
  return (
    <div className="mt-6 text-center text-gray-400">
      <div className="text-4xl mb-3">📊</div>
      <p>Market price lookup — coming soon</p>
      <p className="text-xs mt-1">Person 3: see frontend/CLAUDE.md for spec</p>
    </div>
  )
}
