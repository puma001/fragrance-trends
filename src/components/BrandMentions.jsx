import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Download } from 'lucide-react'

const COLORS = [
  '#b45309','#d97706','#f59e0b','#fbbf24','#fcd34d',
  '#a78bfa','#8b5cf6','#7c3aed','#6d28d9','#5b21b6',
]
const SELECTED_COLOR = '#4f46e5'

export default function BrandMentions({ brands, selectedBrand, onBrandClick, onExport }) {
  if (!brands?.length) return null

  const data = brands.slice(0, 15)

  function handleChartClick(chartData) {
    if (!onBrandClick || !chartData?.activePayload?.[0]) return
    onBrandClick(chartData.activePayload[0].payload.brand)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          Brand Mentions
          {selectedBrand && (
            <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {selectedBrand}
            </span>
          )}
        </h2>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Download size={12} />
            CSV
          </button>
        )}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 16, right: 24, top: 0, bottom: 0 }}
          onClick={handleChartClick}
          style={{ cursor: onBrandClick ? 'pointer' : 'default' }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            dataKey="brand"
            type="category"
            width={110}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={val => [val, 'mentions']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={selectedBrand === entry.brand ? SELECTED_COLOR : COLORS[i % COLORS.length]}
                opacity={selectedBrand && selectedBrand !== entry.brand ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {onBrandClick && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          Click a bar to filter posts · click again to clear
        </p>
      )}
    </div>
  )
}
