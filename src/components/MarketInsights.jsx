import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import marketData from '../data/marketData.json'

const CATS = ['All','Niche','Designer','Indie','Mainstream','Arabian','Celebrity','Dupe/Inspired']
const COLORS = ['#7c3aed','#8b5cf6','#a78bfa','#6d28d9','#5b21b6','#4c1d95','#b45309','#d97706','#f59e0b','#fbbf24']

function RankBadge({ current, prev }) {
  if (!prev || !current) return <span className="text-gray-300 text-xs">—</span>
  const d = prev - current
  if (d > 0) return <span className="text-xs text-emerald-600 flex items-center gap-0.5"><TrendingUp size={10}/>+{d}</span>
  if (d < 0) return <span className="text-xs text-red-400 flex items-center gap-0.5"><TrendingDown size={10}/>{d}</span>
  return <Minus size={10} className="text-gray-300"/>
}

function SellerTable({ data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-400 border-b border-gray-100">
            <th className="pb-2 pr-2 text-left w-6">#</th>
            <th className="pb-2 pr-2 text-left">Product</th>
            <th className="pb-2 pr-2 text-left">Price</th>
            <th className="pb-2 pr-2 text-left">Rating</th>
            <th className="pb-2 pr-2 text-left">Reviews</th>
            <th className="pb-2 text-left">Δ</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((s, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-1.5 pr-2 font-bold text-gray-400">{s.rank}</td>
              <td className="py-1.5 pr-2">
                <p className="font-medium text-gray-900 line-clamp-1">{s.name}</p>
                <p className="text-gray-400 line-clamp-1">{s.notes}</p>
              </td>
              <td className="py-1.5 pr-2 whitespace-nowrap text-gray-600">${s.price.toFixed(2)}</td>
              <td className="py-1.5 pr-2 whitespace-nowrap text-gray-500">{s.rating}</td>
              <td className="py-1.5 pr-2 whitespace-nowrap text-gray-400">{s.reviews.toLocaleString()}</td>
              <td className="py-1.5"><RankBadge current={s.rank} prev={s.prevRank}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function MarketInsights() {
  const [cat,      setCat]      = useState('All')
  const [page,     setPage]     = useState(0)
  const [sellWk,   setSellWk]   = useState(0)   // index into amazonSellers/ebaySellers
  const [searchWk, setSearchWk] = useState(0)   // index into search

  const PER_PAGE = 24
  const { month, report, launches, search, amazonSellers, ebaySellers, fragrantica } = marketData

  const filteredLaunches = useMemo(() =>
    cat === 'All' ? launches : launches.filter(l => l.category === cat)
  , [cat])
  const pageLaunches = filteredLaunches.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages   = Math.ceil(filteredLaunches.length / PER_PAGE)

  const currentSearch  = search[searchWk]  || search[0]
  const currentAmazon  = amazonSellers[sellWk]  || amazonSellers[0]
  const currentEbay    = ebaySellers[sellWk]    || ebaySellers[0]

  // Fragrantica: separate gender vs brand entries
  const genderLabels = new Set(['unisex','female','male'])
  const genderData = fragrantica.filter(d => genderLabels.has(d.label))
  const fragBrands = fragrantica.filter(d => !genderLabels.has(d.label) && d.count >= 5).slice(0, 15)

  return (
    <div className="space-y-6">

      {/* Summary bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-white bg-violet-600 px-3 py-1 rounded-full">{month}</span>
        <span className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-gray-600">
          {launches.length} launches
        </span>
        {report.topNotes.slice(0,3).map(n => (
          <span key={n} className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-1 rounded-full">{n}</span>
        ))}
        <span className="text-xs text-gray-400">top notes from sellers</span>
        {report.trendingNotes.slice(0,3).map(n => (
          <span key={n} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full">{n}</span>
        ))}
        <span className="text-xs text-gray-400">trending in launches</span>
      </div>

      {/* Sellers */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Top Sellers — Amazon & eBay</h3>
          <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
            {amazonSellers.map((w, i) => (
              <button key={i} onClick={() => setSellWk(i)}
                className={`px-3 py-1 transition-colors ${sellWk === i ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                Week {w.week}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-orange-600 mb-3">Amazon</p>
            <SellerTable data={currentAmazon?.sellers || []} />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-600 mb-3">eBay</p>
            <SellerTable data={currentEbay?.sellers || []} />
          </div>
        </div>
      </div>

      {/* Search + Fragrantica */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Search Trends</h3>
            <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
              {search.map((w, i) => (
                <button key={i} onClick={() => setSearchWk(i)}
                  className={`px-3 py-1 transition-colors ${searchWk === i ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  W{w.week}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Top</p>
              {(currentSearch?.top || []).map((t, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <div className="h-1.5 bg-violet-400 rounded-full shrink-0"
                    style={{ width: Math.round((t.score / (currentSearch.top[0]?.score || 1)) * 60) + 'px' }} />
                  <span className="text-xs text-gray-700 truncate">{t.term}</span>
                  <span className="text-xs text-gray-400 ml-auto shrink-0">{t.score}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rising</p>
              {(currentSearch?.rising || []).map((t, i) => (
                <div key={i} className="flex items-center gap-1.5 mb-1.5">
                  <TrendingUp size={10} className="text-emerald-500 shrink-0"/>
                  <span className="text-xs text-gray-700 truncate">{t.term}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Fragrantica Breakdown</h3>
          <p className="text-xs text-gray-400 mb-4">Gender split + top brand presence</p>
          <div className="flex gap-4 mb-4">
            {genderData.map((d, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-bold text-gray-900">{d.count.toLocaleString()}</p>
                <p className="text-xs text-gray-400 capitalize">{d.label}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fragBrands} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis dataKey="label" type="category" width={110} tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
              <Tooltip formatter={v => [v, 'entries']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}/>
              <Bar dataKey="count" radius={[0,3,3,0]}>
                {fragBrands.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New Launches */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">New Launches</h3>
            <p className="text-xs text-gray-400">{filteredLaunches.length} fragrances · {month}</p>
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
                  <a href={l.url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-gray-300 hover:text-violet-500 transition-colors">
                    <ExternalLink size={11}/>
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-1">{l.brand}</p>
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
            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50">← Prev</button>
            <span className="text-xs text-gray-500">{page+1} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page >= totalPages-1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50">Next →</button>
          </div>
        )}
      </div>

    </div>
  )
}
