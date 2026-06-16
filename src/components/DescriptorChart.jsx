import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function DescriptorChart({ descriptors }) {
  if (!descriptors?.length) return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Note Families</h2>
      <p className="text-xs text-gray-400 mb-2">Which scent profiles dominate the conversation</p>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={descriptors} margin={{ top: 10, bottom: 10 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="family" tick={{ fontSize: 11 }} />
          <Radar name="Posts" dataKey="count" stroke="#6b3fa0" fill="#6b3fa0" fillOpacity={0.25} strokeWidth={2} />
          <Tooltip formatter={v => [v, 'posts']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
