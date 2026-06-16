export default function SentimentGauge({ sentiment }) {
  if (!sentiment) return null
  const { positive, negative, positivePercent, negativePercent } = sentiment
  const total = positive + negative

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Community Sentiment</h2>
      <p className="text-xs text-gray-400 mb-4">Positive vs negative language across all posts ({total} signals)</p>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 text-center">
          <p className="text-3xl font-bold text-emerald-600">{positivePercent}%</p>
          <p className="text-xs text-gray-500 mt-1">Positive</p>
          <p className="text-xs text-gray-400">{positive} mentions</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-3xl font-bold text-rose-500">{negativePercent}%</p>
          <p className="text-xs text-gray-500 mt-1">Negative</p>
          <p className="text-xs text-gray-400">{negative} mentions</p>
        </div>
      </div>

      <div className="h-4 rounded-full overflow-hidden bg-gray-100 flex">
        <div
          className="bg-emerald-500 transition-all duration-500"
          style={{ width: `${positivePercent}%` }}
        />
        <div
          className="bg-rose-400 transition-all duration-500"
          style={{ width: `${negativePercent}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>Positive words: love, amazing, masterpiece…</span>
        <span>Negative: reformulated, overhyped…</span>
      </div>
    </div>
  )
}
