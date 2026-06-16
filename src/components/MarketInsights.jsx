import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import marketData from '../data/marketData.json'

const CATS = ['All', 'Niche', 'Designer', 'Indie', 'Mainstream', 'Arabian', 'Celebrity', 'Dupe/Inspired']
const NOTE_COLORS = ['#7c3aed','#8b5cf6','#a78bfa','#6d28d9','#5b21b6','#4c1d95','#b45309','#d97706','#f59e0b','#fbbf24']

function RankChange({ current, last }) {
  if (!last || !current) return <Minus size={12} className="text-gray-300" />
  const diff = last - current
  if (diff > 0) return <span className="flex items-center gap-0.5 text-emerald-600"><TrendingUp size={12}/>{diff}</span>
  if (diff < 0) return <span className="flex items-center gap-0.5 text-red-400"><TrendingDown size={12}/>{Math.abs(diff)}</span>
  return <Minus size={12} className="text-gray-300" />
}

function SellerRow({ item }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="py-2 px-3 text-xs font-bold text-gray-500 w-8">{item.rank}</td>
      <td className="py-2 px-2">
        <p className="text-xs font-medium text-gray-900 leading-tight line-clamp-1">{item.name}</p>
        <p className="text-xs text-gray-400 line-clamp-1">{item.notes}</p>
      </td>
      <td className="py-2 px-2 text-xs text-gray-600 whitespace-nowrap">${item.price.toFixed(2)}</td>
      <td className="py-2 px-2 text-xs text-gray-500 whitespace-nowrap">{item.rating}</td>
      <td className="py-2 px-2 text-xs text-gray-400 whitespace-nowrap">{item.reviews.toLocaleString()}</td>
      <td className="py-2 px-2 text-xs w-12"><RankChange current={item.rank} last={item.lastWeekRank} /></td>
    </tr>
  )
}

function SellersTable({ title, data, accent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className={`text-sm font-semibold mb-3 ${accent}`}>{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-2 px-3 text-left">#</th>
              <th className="pb-2 px-2 text-left">Product</th>
              <th className="pb-2 px-2 text-left">Price</th>
              <th className="pb-2 px-2 text-left">Rating</th>
              <th className="pb-2 px-2 text-left">Reviews</th>
              <th className="pb-2 px-2 text-left">Δ</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((item, i) => <SellerRow key={i} item={item} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function MarketInsights() {
  const [cat, setCat]   = useState('All')
  const [page, setPage] = useState(0)
  const PER_PAGE = 24

  const launches = useMemo(() => {
    const base = cat === 'All' ? marketData.launches : marketData.launches.filter(l => l.category === cat)
    return base
  }, [cat])

  const pageLaunches = launches.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages   = Math.ceil(launches.length / PER_PAGE)

  const notesChart = marketData.topNotes.slice(0, 12).map(n => ({
    note: n.note, Current: n.currentFreq, Trending: n.trendingFreq,
  }))

  const { summary, mostSearched, fragrantica, amazonSellers, ebaySellers } = marketData

  return (
    <div className="space-y-6">

      {/* Summary bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-white bg-violet-600 px-3 py-1 rounded-full">{marketData.month}</span>
        <span className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600">
          Avg price <strong>${summary.avgPrice}</strong>
        </span>
        <span className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600">
          Top note <strong>{summary.topNotes[0]}</strong>
        </span>
        <span className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600">
          Top trending <strong>{summary.trendNotes[0]}</strong>
        </span>
        <span className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600">
          Most searched <strong>{summary.searched[0]}</strong>
        </span>
        <span className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600">
          {marketData.launches.length} new launches
        </span>
      </div>

      {/* Notes + Search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Top Notes</h3>
          <p className="text-xs text-gray-400 mb-4">Current launches vs overall trending frequency</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={notesChart} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="note" type="category" width={80} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Current"  fill="#7c3aed" radius={[0,3,3,0]} barSize={7} />
              <Bar dataKey="Trending" fill="#d97706" radius={[0,3,3,0]} barSize={7} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Search Trends</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Top</p>
              {mostSearched.top.map((t, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <div className="h-2 bg-violet-500 rounded-full" style={{ width: `${(t.score / mostSearched.top[0].score) * 100}%`, minWidth: 4 }} />
                  <span className="text-xs text-gray-700 whitespace-nowrap">{t.term}</span>
                  <span className="text-xs text-gray-400 ml-auto">{t.score}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rising</p>
              {mostSearched.rising.map((t, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <TrendingUp size={10} className="text-emerald-500 shrink-0" />
                  <span className="text-xs text-gray-700">{t.term}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fragrantica Highest Rated</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {fragrantica.rated.slice(0, 6).map((r, i) => (
                <p key={i} className="text-xs text-gray-700 line-clamp-1">
                  <span className="text-gray-400 mr-1">{i + 1}.</span>{r}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SellersTable title="Amazon Top Sellers" data={amazonSellers} accent="text-orange-600" />
        <SellersTable title="eBay Top Sellers"   data={ebaySellers}  accent="text-blue-600" />
      </div>

      {/* New Launches */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">New Launches</h3>
            <p className="text-xs text-gray-400">{launches.length} fragrances · {marketData.month}</p>
          </div>
          <div className="flex gap-1 flex-wrap">
            {CATS.map(c => (
              <button key={c} onClick={() => { setCat(c); setPage(0) }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${cat === c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {pageLaunches.map((l, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3 hover:border-violet-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-1 mb-1">
                <p className="text-xs font-semibold text-gray-900 leading-tight">{l.name}</p>
                {l.url && (
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-gray-300 hover:text-violet-500">
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-1.5">{l.brand}</p>
              {l.profile && <p className="text-xs text-gray-400 italic line-clamp-1">{l.profile}</p>}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {l.category && (
                  <span className="text-xs bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded-full">{l.category}</span>
                )}
                {l.date && <span className="text-xs text-gray-300">{l.date}</span>}
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50">← Prev</button>
            <span className="text-xs text-gray-500">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50">Next →</button>
          </div>
        )}
      </div>

    </div>
  )
}
