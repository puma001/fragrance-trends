import { ExternalLink, Clock, X, Download } from 'lucide-react'

function timeAgo(utc) {
  const diff = Date.now() / 1000 - utc
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function PostCard({ post }) {
  const url = `https://reddit.com${post.permalink}`
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 leading-snug">{post.title}</p>
        <ExternalLink size={12} className="shrink-0 mt-0.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
      {post.selftext && (
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{post.selftext}</p>
      )}
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
        <span className="text-indigo-600 font-medium">r/{post.subreddit}</span>
        <span className="text-gray-600">u/{post.author}</span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {timeAgo(post.created_utc)}
        </span>
      </div>
    </a>
  )
}

export default function PostFeed({ posts, totalPosts, selectedBrand, onClearBrand, onExport }) {
  const isFiltered = Boolean(selectedBrand)

  if (!isFiltered && !posts?.length) return null

  const title = isFiltered
    ? `Posts about ${selectedBrand} (${posts.length} of ${totalPosts})`
    : `Latest Posts (${posts.length})`

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {isFiltered && onClearBrand && (
            <button
              onClick={onClearBrand}
              className="flex items-center gap-0.5 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-0.5 rounded-full transition-colors"
            >
              <X size={10} />
              Clear filter
            </button>
          )}
        </div>
        {onExport && posts.length > 0 && (
          <button
            onClick={onExport}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Download size={12} />
            CSV
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">
          No posts found mentioning {selectedBrand}
        </p>
      ) : (
        <div className="space-y-2.5">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
