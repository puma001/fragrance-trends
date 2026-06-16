import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function VolumeChart({ data }) {
  if (!data?.length) return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Post Volume (Last 7 Days)</h2>
      <p className="text-xs text-gray-400 mb-4">When the community is most active</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ left: 0, right: 12, top: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6b3fa0" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6b3fa0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            formatter={v => [v, 'posts']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Area type="monotone" dataKey="posts" stroke="#6b3fa0" strokeWidth={2} fill="url(#volGrad)" dot={{ r: 3, fill: '#6b3fa0' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
