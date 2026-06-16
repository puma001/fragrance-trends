import { MessageSquare, Hash, Star, TrendingUp, Users } from 'lucide-react'

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-3">
      <div className="p-2 bg-gray-50 rounded-lg shrink-0">
        <Icon size={16} className="text-gray-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  )
}

export default function StatsBar({ stats, topKeyword, topBrand }) {
  if (!stats) return null
  const dataPoints = stats.total + (stats.commentCount || 0)
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat
        icon={MessageSquare}
        label="Data points"
        value={dataPoints.toLocaleString()}
        sub={stats.commentCount ? `${stats.total} posts · ${stats.commentCount} comments` : `${stats.total} posts`}
      />
      <Stat
        icon={TrendingUp}
        label={stats.hasScores ? 'Avg upvotes' : 'Top subreddit'}
        value={stats.hasScores ? stats.avgScore.toLocaleString() : (stats.topSubreddit ? `r/${stats.topSubreddit}` : '—')}
        sub={stats.hasScores && stats.topSubreddit ? `r/${stats.topSubreddit}` : undefined}
      />
      <Stat icon={Hash} label="Top keyword" value={topKeyword || '—'} />
      <Stat icon={Star} label="Top brand" value={topBrand || '—'} />
    </div>
  )
}
