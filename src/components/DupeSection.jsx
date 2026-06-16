import { ExternalLink, Clock, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const ORIGINAL_COLORS = ['#7c3aed','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe','#6d28d9','#5b21b6','#4c1d95','#3b0764','#2e1065']
const DUPE_COLORS    = ['#b45309','#d97706','#f59e0b','#fbbf24','#fcd34d','#92400e','#78350f','#451a03','#a16207','#ca8a04']

function timeAgo(utc) {
  const diff = Date.now() / 1000 - utc
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function DupePostCard({ post }) {
  const url = `https://reddit.com${post.permalink}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-xl border border-gray-200 bg-white hover:border-violet-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 leading-snug">{post.title}</p>
        <ExternalLink size={12} className="shrink-0 mt-0.5 text-gray-300 group-hover:text-violet-400 transition-colors" />
      </div>
      {post.selftext && (
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{post.selftext}</p>
      )}
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
        <span className="text-indigo-600 font-medium">r/{post.subreddit}</span>
        <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(post.created_utc)}</span>
      </div>
    </a>
  )
}

export default function DupeSection({ dupePosts, mostDupedBrands, topDupeBrands, totalPosts }) {
  if (!dupePosts?.length) return null

  const pct = totalPosts > 0 ? Math.round((dupePosts.length / totalPosts) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-bold text-gray-900 tracking-tight">Dupe & Clone Tracker</h2>
        <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">
          {dupePosts.length} posts · {pct}% of feed
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Most Duped Originals</h3>
          <p className="text-xs text-gray-400 mb-4">Luxury brands mentioned most in dupe posts — high demand signal</p>
          {mostDupedBrands.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={mostDupedBrands} layout="vertical" margin={{ left: 16, right: 24, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="brand" type="category" width={110} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [v, 'dupe posts']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {mostDupedBrands.map((_, i) => <Cell key={i} fill={ORIGINAL_COLORS[i % ORIGINAL_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-gray-400 py-6 text-center">No brand matches in dupe posts</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Top Dupe Brands</h3>
          <p className="text-xs text-gray-400 mb-4">Affordable brands most recommended as alternatives</p>
          {topDupeBrands.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topDupeBrands} layout="vertical" margin={{ left: 16, right: 24, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="brand" type="category" width={110} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [v, 'mentions']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topDupeBrands.map((_, i) => <Cell key={i} fill={DUPE_COLORS[i % DUPE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-gray-400 py-6 text-center">No dupe brand matches yet</p>
          )}
        </div>

      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Dupe Posts ({dupePosts.length})</h3>
          <button
            onClick={() => {
              const esc = v => `"${String(v || '').replace(/"/g, '""')}"`
              const rows = [['Title', 'Body', 'Author', 'Subreddit', 'URL', 'Score', 'Comments', 'Posted']]
              dupePosts.forEach(p => rows.push([
                esc(p.title),
                esc(p.selftext),
                esc(p.author),
                p.subreddit,
                `https://reddit.com${p.permalink}`,
                p.score ?? '',
                p.num_comments ?? '',
                new Date(p.created_utc * 1000).toISOString().slice(0, 10)
              ]))
              const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'dupe-posts.csv'
              a.click()
              URL.revokeObjectURL(a.href)
            }}
            className="flex items-center gap-1.5 text-xs text-violet-600 border border-violet-200 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download size={12} />
            Download CSV
          </button>
        </div>
        <div className="space-y-2.5">
          {dupePosts.slice(0, 20).map(post => (
            <DupePostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  )
}
