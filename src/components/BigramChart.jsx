import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#0f3460','#16213e','#1a1a2e','#533483','#6b3fa0','#7952b3','#8967c0','#9b7fcf','#ad97de','#bfafed']

export default function BigramChart({ bigrams }) {
  if (!bigrams?.length) return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Trending Phrases</h2>
      <p className="text-xs text-gray-400 mb-4">2-word combinations appearing most in posts</p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={bigrams} layout="vertical" margin={{ left: 16, right: 24, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis dataKey="phrase" type="category" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={v => [v, 'mentions']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {bigrams.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
