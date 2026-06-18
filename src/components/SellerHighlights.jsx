import { TrendingUp, TrendingDown, Sparkles, LogOut } from 'lucide-react'

export default function SellerHighlights({ current, prev }) {
  if (!current) return null

  const key = s => s.name.slice(0, 55).toLowerCase()

  // New entrants: in current top 10 but prevRank === 0 (wasn't ranked before)
  const newEntries = current.sellers.slice(0, 10).filter(s => !s.prevRank)

  // Biggest climbers / drops among existing top-10 products
  const movers = current.sellers.slice(0, 10)
    .filter(s => s.prevRank && s.prevRank !== s.rank)
    .map(s => ({ ...s, delta: s.prevRank - s.rank }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3)

  // Dropped out: were in previous week top 10, not in current
  const dropouts = prev
    ? (() => {
        const currKeys = new Set(current.sellers.slice(0, 10).map(key))
        return prev.sellers.slice(0, 10).filter(s => !currKeys.has(key(s)))
      })()
    : []

  if (!newEntries.length && !movers.length && !dropouts.length) return null

  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {newEntries.map((s, i) => (
        <div key={i} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 max-w-xs">
          <Sparkles size={12} className="text-emerald-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-emerald-800 truncate">{s.name}</p>
            <p className="text-xs text-emerald-600">New entry · #{s.rank}</p>
          </div>
        </div>
      ))}
      {movers.filter(s => s.delta > 0).map((s, i) => (
        <div key={i} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 max-w-xs">
          <TrendingUp size={12} className="text-blue-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-800 truncate">{s.name}</p>
            <p className="text-xs text-blue-600">#{s.prevRank} → #{s.rank} <span className="font-bold">+{s.delta}</span></p>
          </div>
        </div>
      ))}
      {movers.filter(s => s.delta < 0).map((s, i) => (
        <div key={i} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 max-w-xs">
          <TrendingDown size={12} className="text-red-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-red-800 truncate">{s.name}</p>
            <p className="text-xs text-red-500">#{s.prevRank} → #{s.rank} <span className="font-bold">{s.delta}</span></p>
          </div>
        </div>
      ))}
      {dropouts.map((s, i) => (
        <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-xs opacity-70">
          <LogOut size={12} className="text-gray-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-600 truncate">{s.name}</p>
            <p className="text-xs text-gray-400">Dropped out of top 10</p>
          </div>
        </div>
      ))}
    </div>
  )
}
