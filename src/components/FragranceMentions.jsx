import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Download } from 'lucide-react'

const COLORS = [
  '#7c3aed','#8b5cf6','#a78bfa','#6d28d9','#5b21b6',
  '#b45309','#d97706','#f59e0b','#92400e','#78350f',
  '#0369a1','#0284c7','#38bdf8','#0c4a6e','#075985',
]

export default function FragranceMentions({ fragrances }) {
  if (!fragrances?.length) return null

  function handleExport() {
    const csv = [['Fragrance', 'Mentions'], ...fragrances.map(f => [f.fragrance, f.count])]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'fragrance-mentions.csv',
    })
    a.click(); URL.revokeObjectURL(a.href)
  }

  const barHeight = Math.max(280, fragrances.length * 26)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-900">Top Fragrances Discussed</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          <Download size={12} />
          CSV
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-4">Individual fragrance names mentioned across all posts</p>

      <ResponsiveContainer width="100%" height={barHeight}>
        <BarChart data={fragrances} layout="vertical" margin={{ left: 8, right: 32, top: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            dataKey="fragrance"
            type="category"
            width={150}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={v => [v, 'mentions']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {fragrances.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
