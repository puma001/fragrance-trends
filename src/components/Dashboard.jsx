import { Sparkles, TrendingUp, ArrowRight } from 'lucide-react'
import allMarketData from '../data/allMarketData.json'
import brandData from '../data/brandData.json'

const SEARCH_IGNORE = new Set(['man', 'eau de parfum', 'eau de perfum', 'odor', 'odour'])
const fmt = n => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n/1_000).toFixed(0)}K` : `$${n}`

function SectionCard({ title, linkLabel, onLink, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {onLink && (
          <button onClick={onLink} className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 transition-colors">
            {linkLabel} <ArrowRight size={11} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function SellerRow({ rank, name, notes, price }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm font-bold text-gray-300 w-5 shrink-0">#{rank}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-800 line-clamp-1">{name}</p>
        {notes && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{notes}</p>}
      </div>
      {price > 0 && <span className="text-xs text-gray-500 shrink-0 ml-auto">${price.toFixed(0)}</span>}
    </div>
  )
}

export default function Dashboard({ brands, fragranceMentions, stats, redditLoading, onTabChange }) {
  const market = allMarketData[0]
  const { month, report, search, amazonSellers, ebaySellers, analysis } = market

  const amazon3 = (amazonSellers[0]?.sellers || []).slice(0, 3)
  const ebay3   = (ebaySellers[0]?.sellers  || []).slice(0, 3)

  const topSearch = (search[0]?.top || [])
    .filter(t => !SEARCH_IGNORE.has(t.term.toLowerCase()))
    .slice(0, 5)

  const topBrands     = (brands || []).slice(0, 5)
  const topFragrances = (fragranceMentions || []).slice(0, 5)

  const brandKeys = brandData.brands || []
  const totalNetSales = brandKeys.reduce((s, k) => s + (brandData.summary[k]?.netSales || 0), 0)
  const topBrandKey   = brandKeys.sort((a, b) => (brandData.summary[b]?.netSales || 0) - (brandData.summary[a]?.netSales || 0))[0]

  return (
    <div className="space-y-5">

      {/* AI Digest */}
      {analysis && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} className="text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Monthly Intelligence · {month}</span>
            <button onClick={() => onTabChange('market')} className="ml-auto flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700">
              Full report <ArrowRight size={11} />
            </button>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{analysis.digest}</p>
          {analysis.signals?.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {analysis.signals.map((s, i) => (
                <span key={i} className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full">{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Retail snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Amazon Top Sellers" linkLabel="Full sellers" onLink={() => onTabChange('market')}>
          <p className="text-xs text-gray-400 mb-2">{month} · Week 1</p>
          {amazon3.map(s => <SellerRow key={s.rank} {...s} />)}
        </SectionCard>
        <SectionCard title="eBay Top Sellers" linkLabel="Full sellers" onLink={() => onTabChange('market')}>
          <p className="text-xs text-gray-400 mb-2">{month} · Week 1</p>
          {ebay3.map(s => <SellerRow key={s.rank} {...s} />)}
        </SectionCard>
      </div>

      {/* Notes + Search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Top Notes This Month" linkLabel="Market tab" onLink={() => onTabChange('market')}>
          <div className="mb-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">In top sellers</p>
            <div className="flex flex-wrap gap-1.5">
              {report.topNotes.map(n => (
                <span key={n} className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-1 rounded-full">{n}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Trending in launches</p>
            <div className="flex flex-wrap gap-1.5">
              {report.trendingNotes.slice(0, 5).map(n => (
                <span key={n} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full">{n}</span>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Top Search Terms" linkLabel="Market tab" onLink={() => onTabChange('market')}>
          <p className="text-xs text-gray-400 mb-3">{month} · Week 1</p>
          <div className="space-y-2">
            {topSearch.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-1.5 bg-violet-400 rounded-full shrink-0"
                  style={{ width: Math.round((t.score / (topSearch[0]?.score || 1)) * 80) + 'px' }} />
                <span className="text-xs text-gray-700 truncate">{t.term}</span>
                <span className="text-xs text-gray-400 ml-auto shrink-0">{t.score}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Reddit buzz */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Reddit — Top Brand Mentions" linkLabel="Reddit tab" onLink={() => onTabChange('reddit')}>
          {redditLoading ? (
            <p className="text-xs text-gray-400 py-4 text-center">Loading Reddit data…</p>
          ) : topBrands.length ? (
            <div className="space-y-2">
              {topBrands.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4 shrink-0">#{i+1}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.round((b.count / topBrands[0].count) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-24 truncate">{b.brand}</span>
                  <span className="text-xs text-gray-400">{b.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-4 text-center">No data yet</p>
          )}
        </SectionCard>

        <SectionCard title="Reddit — Top Fragrance Mentions" linkLabel="Reddit tab" onLink={() => onTabChange('reddit')}>
          {redditLoading ? (
            <p className="text-xs text-gray-400 py-4 text-center">Loading Reddit data…</p>
          ) : topFragrances.length ? (
            <div className="space-y-2">
              {topFragrances.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4 shrink-0">#{i+1}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.round((f.count / topFragrances[0].count) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-24 truncate">{f.fragrance}</span>
                  <span className="text-xs text-gray-400">{f.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-4 text-center">No data yet</p>
          )}
        </SectionCard>
      </div>

      {/* Brand KPIs */}
      <SectionCard title="Brand Sales Snapshot" linkLabel="Brand tab" onLink={() => onTabChange('brand')}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {brandKeys.map(k => {
            const s = brandData.summary[k]
            return s ? (
              <div key={k} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-bold text-gray-500 mb-1">{k}</p>
                <p className="text-lg font-bold text-gray-900">{fmt(s.netSales)}</p>
                <p className="text-xs text-gray-400">{s.orderCount.toLocaleString()} orders</p>
                <p className="text-xs text-gray-400">{s.conversionRate}% conv.</p>
              </div>
            ) : null
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Combined net sales</span>
          <span className="font-semibold text-gray-800">{fmt(totalNetSales)}</span>
        </div>
      </SectionCard>

    </div>
  )
}
