import { TrendingUp, TrendingDown } from 'lucide-react'

// Normalize names so minor punctuation/truncation differences still match:
// "Sol de Janeiro Hair & Body Perfume Mist (Cheirosa 62)" and
// "Sol de Janeiro Hair & Body Perfume Mist" both become the same 35-char key.
const normKey = name =>
  name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 35)

function buildMovement(weeksData) {
  const map = new Map()
  const allWeeks = weeksData.map(w => w.week)

  weeksData.forEach(({ week, sellers }) => {
    sellers.slice(0, 10).forEach(s => {
      const key = normKey(s.name)
      if (!map.has(key)) map.set(key, { name: s.name, notes: s.notes, ranks: {} })
      map.get(key).ranks[week] = s.rank
    })
  })

  return {
    products: [...map.values()].sort((a, b) =>
      Math.min(...Object.values(a.ranks)) - Math.min(...Object.values(b.ranks))
    ),
    weeks: allWeeks,
  }
}

function RankCell({ rank, prev, isFirst }) {
  if (!rank) {
    return (
      <td className="px-3 py-2 text-center">
        <span className="text-xs text-gray-300">—</span>
      </td>
    )
  }

  let bg = 'bg-gray-50'
  let icon = null

  if (isFirst || prev === undefined) {
    // new entrant vs previous week
    if (!isFirst) {
      bg = 'bg-blue-50'
      icon = <span className="text-blue-500 font-bold text-xs leading-none">N</span>
    }
  } else {
    const delta = prev - rank
    if (delta > 0) { bg = 'bg-emerald-50'; icon = <TrendingUp size={9} className="text-emerald-500" /> }
    else if (delta < 0) { bg = 'bg-red-50';     icon = <TrendingDown size={9} className="text-red-400" /> }
  }

  return (
    <td className={`px-3 py-2 text-center rounded ${bg}`}>
      <div className="flex items-center justify-center gap-0.5">
        <span className="text-xs font-semibold text-gray-700">#{rank}</span>
        {icon}
      </div>
    </td>
  )
}

export default function MovementTracker({ weeksData }) {
  const { products, weeks } = buildMovement(weeksData)

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 text-xs text-gray-400 mb-3 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-100 inline-block"/>climbed</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-100 inline-block"/>dropped</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-100 inline-block"/>new entry</span>
        <span className="flex items-center gap-1"><span className="text-gray-300">—</span> fell out of top 10</span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pb-2 text-left font-semibold text-gray-500 pr-4">Product</th>
            {weeks.map(w => (
              <th key={w} className="pb-2 text-center font-semibold text-gray-400 px-3 w-16">
                W{w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="py-2 pr-4">
                <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                {p.notes && <p className="text-gray-400 line-clamp-1 mt-0.5">{p.notes}</p>}
              </td>
              {weeks.map((w, wi) => (
                <RankCell
                  key={w}
                  rank={p.ranks[w]}
                  prev={wi > 0 ? p.ranks[weeks[wi - 1]] : undefined}
                  isFirst={wi === 0}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
