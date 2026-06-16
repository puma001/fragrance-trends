import { ExternalLink, Play, Heart, Loader, Download, MessageCircle, Share2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getBrandCounts, getTrendingHashtags, getTopCreators, getTikTokStats, exportTikTokCSV } from '../services/tiktok'

const BRAND_COLORS  = ['#ff0050','#ff4d6d','#ff7c8a','#fba0b0','#f9c4ce','#e040fb','#b39ddb','#9575cd','#7986cb','#64b5f6']
const HASH_COLORS   = ['#0ea5e9','#38bdf8','#7dd3fc','#bae6fd','#0369a1','#0284c7','#075985','#0c4a6e','#164e63','#155e75']
const CREATE_COLORS = ['#10b981','#34d399','#6ee7b7','#a7f3d0','#059669','#047857','#065f46','#064e3b','#d97706','#f59e0b']

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function timeAgo(iso) {
  if (!iso) return ''
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function VideoCard({ video }) {
  const snippet = video.text.length > 110 ? `${video.text.slice(0, 110)}…` : video.text
  const engRate = video.plays > 0 ? ((video.likes + video.comments) / video.plays * 100).toFixed(1) : '0'
  return (
    <a href={video.url} target="_blank" rel="noopener noreferrer"
      className="block p-3.5 rounded-xl border border-gray-200 bg-white hover:border-pink-200 hover:shadow-sm transition-all group">
      <p className="text-sm text-gray-800 leading-snug mb-2">{snippet}</p>
      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
        <span className="font-medium text-gray-700 truncate max-w-[110px]">@{video.author}</span>
        <span className="flex items-center gap-1"><Play size={10} />{fmt(video.plays)}</span>
        <span className="flex items-center gap-1"><Heart size={10} />{fmt(video.likes)}</span>
        <span className="flex items-center gap-1"><MessageCircle size={10} />{fmt(video.comments)}</span>
        <span className="text-gray-400">{engRate}% eng</span>
        {video.brands[0] && <span className="text-pink-600 font-medium">{video.brands[0]}</span>}
        <ExternalLink size={10} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  )
}

export default function TikTokSection({ videos, loading, error, cachedAt, pending }) {
  const brandCounts    = videos ? getBrandCounts(videos) : []
  const hashtags       = videos ? getTrendingHashtags(videos) : []
  const topCreators    = videos ? getTopCreators(videos) : []
  const stats          = videos ? getTikTokStats(videos) : null
  const topVideos      = videos ? videos.slice(0, 20) : []
  const hasData        = videos && videos.length > 0

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-base">♪</span>
        <h2 className="text-sm font-bold text-gray-900 tracking-tight">TikTok Trends</h2>
        <span className="text-xs text-gray-400">#fragrancetok · #perfumetok</span>
        {cachedAt && <span className="text-xs text-gray-400 ml-auto">Updated {timeAgo(cachedAt)}</span>}
        {loading && (
          <span className="flex items-center gap-1.5 text-xs text-pink-500 ml-auto">
            <Loader size={11} className="animate-spin" />Loading…
          </span>
        )}
        {hasData && (
          <button onClick={() => exportTikTokCSV(videos)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors ml-2">
            <Download size={12} />CSV
          </button>
        )}
      </div>

      {/* Error states */}
      {error && !error.includes('APIFY_TOKEN') && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}
      {error?.includes('APIFY_TOKEN') && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl">
          Add <code className="font-mono bg-amber-100 px-1 rounded">APIFY_TOKEN</code> to your Vercel environment variables.
        </div>
      )}

      {/* Loading */}
      {loading && !hasData && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 flex flex-col items-center gap-3">
          <Loader size={22} className="animate-spin text-pink-400" />
          <p className="text-sm text-gray-500">Loading cached TikTok data…</p>
        </div>
      )}

      {/* Pending first scrape */}
      {!loading && pending && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">First scrape running — check back in ~2 minutes.</p>
          <p className="text-xs text-gray-400 mt-1">After that, data refreshes automatically once per day.</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && videos && videos.length === 0 && !pending && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">No TikTok videos in the latest run. Click Retry to trigger a fresh scrape.</p>
        </div>
      )}

      {/* Stats bar */}
      {hasData && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Video Views" value={fmt(stats.totalReach)} />
          <StatCard label="Total Likes" value={fmt(stats.totalLikes)} />
          <StatCard label="Avg Engagement Rate" value={`${stats.avgEngagement}%`} />
          <StatCard label="Videos Tracked" value={stats.videoCount} />
        </div>
      )}

      {/* Brand Mentions + Top Videos */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {brandCounts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Brand Mentions</h3>
              <p className="text-xs text-gray-400 mb-4">Brands mentioned in video captions</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={brandCounts} layout="vertical" margin={{ left: 16, right: 24, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="brand" type="category" width={110} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [v, 'videos']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {brandCounts.map((_, i) => <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {topVideos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Top Videos</h3>
              <p className="text-xs text-gray-400 mb-4">Sorted by view count · includes engagement rate</p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {topVideos.map(v => <VideoCard key={v.id} video={v} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Creators + Trending Hashtags */}
      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {topCreators.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Top Creators</h3>
              <p className="text-xs text-gray-400 mb-4">Accounts with most reach — outreach targets for PR</p>
              <div className="space-y-2">
                {topCreators.map((c, i) => (
                  <a key={c.author} href={c.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                    <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">@{c.author}</p>
                      <p className="text-xs text-gray-400">{c.videos} video{c.videos !== 1 ? 's' : ''} · {fmt(c.likes)} likes</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-700">{fmt(c.plays)}</p>
                      <p className="text-xs text-gray-400">views</p>
                    </div>
                    <ExternalLink size={11} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {hashtags.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Trending Hashtags</h3>
              <p className="text-xs text-gray-400 mb-4">Co-occurring tags (seed hashtags excluded)</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hashtags} layout="vertical" margin={{ left: 16, right: 24, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="tag" type="category" width={130} tick={{ fontSize: 10 }}
                    tickFormatter={v => `#${v}`} axisLine={false} tickLine={false} />
                  <Tooltip formatter={v => [v, 'videos']} labelFormatter={v => `#${v}`}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {hashtags.map((_, i) => <Cell key={i} fill={HASH_COLORS[i % HASH_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
