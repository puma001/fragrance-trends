function highlight(text, brands) {
  // bold any brand name found in the comment text
  let out = text
  for (const { brand } of brands) {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out.replace(new RegExp(`(${escaped})`, 'gi'), '**$1**')
  }
  return out
}

function CommentCard({ comment, brands }) {
  const url = comment.permalink ? `https://reddit.com${comment.permalink}` : '#'
  const parts = highlight(comment.text, brands).split(/(\*\*[^*]+\*\*)/)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block px-4 py-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      <p className="text-xs text-gray-800 leading-relaxed">
        {parts.map((part, i) =>
          part.startsWith('**') ? (
            <span key={i} className="font-semibold text-indigo-700 bg-indigo-50 px-0.5 rounded">
              {part.replace(/\*\*/g, '')}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
      <p className="text-xs text-gray-400 mt-1.5">u/{comment.author}</p>
    </a>
  )
}

export default function TopComments({ comments, brands, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">What People Are Wearing</h2>
        <p className="text-xs text-gray-400 mt-2">Fetching SOTD thread comments…</p>
      </div>
    )
  }
  if (!comments?.length) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-900">What People Are Wearing</h2>
        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
          SOTD thread · {comments.length} comments
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">From today's Scent of the Day pinned thread — brand names highlighted</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
        {comments.map((c, i) => (
          <CommentCard key={i} comment={c} brands={brands} />
        ))}
      </div>
    </div>
  )
}
