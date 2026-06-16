import { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import brandData from '../data/brandData.json'

const RANGES = [
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y',  days: 365 },
  { label: 'All', days: 0 },
]

const PRODUCT_COLORS = [
  '#7c3aed','#8b5cf6','#a78bfa','#6d28d9','#5b21b6',
  '#b45309','#d97706','#f59e0b','#92400e','#78350f',
]

const $ = n => '$' + (n >= 1_000_000
  ? (n / 1_000_000).toFixed(1) + 'M'
  : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K'
  : n.toFixed(0))

const pct = n => n.toFixed(1) + '%'
const num = n => n.toLocaleString()

function KPI({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.name === 'Revenue' ? $(p.value) : num(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function BrandDashboard() {
  const [brand, setBrand] = useState(brandData.brands[0])
  const [range, setRange] = useState(90)
  const [chartMode, setChartMode] = useState('revenue')

  const summary  = brandData.summary[brand]
  const allDays  = brandData.byDay[brand] || []
  const products = (brandData.products[brand] || []).slice(0, 10)

  const days = useMemo(() => {
    if (!range) return allDays
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - range)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return allDays.filter(d => d.day >= cutoffStr)
  }, [brand, range, allDays])

  // Weekly aggregation for All/1Y views to keep chart readable
  const chartData = useMemo(() => {
    if (range > 0 && range <= 90) {
      return days.map(d => ({
        label: d.day.slice(5),
        Revenue: d.netSales,
        Sessions: d.sessions,
        Orders: d.checkouts,
      }))
    }
    // aggregate into weeks
    const weeks = {}
    for (const d of days) {
      const dt = new Date(d.day)
      dt.setDate(dt.getDate() - dt.getDay())
      const key = dt.toISOString().slice(0, 10)
      if (!weeks[key]) weeks[key] = { label: key.slice(5), Revenue: 0, Sessions: 0, Orders: 0 }
      weeks[key].Revenue   += d.netSales
      weeks[key].Sessions  += d.sessions
      weeks[key].Orders    += d.checkouts
    }
    return Object.values(weeks)
  }, [days, range])

  const customerData = [
    { label: 'New',       value: summary.newCustomers,       fill: '#7c3aed' },
    { label: 'Returning', value: summary.returningCustomers, fill: '#d97706' },
    { label: 'Subscribed', value: summary.subscribedCustomers, fill: '#0284c7' },
  ]

  const shortTitle = t => t.length > 32 ? t.slice(0, 32) + '…' : t

  return (
    <div className="space-y-5">

      {/* Brand tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {brandData.brands.map(b => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={`px-4 py-1.5 font-medium transition-colors ${brand === b ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {b}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {allDays.length} days of data · {num(summary.orderCount)} orders total
        </span>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPI label="Net Revenue"     value={$(summary.netSales)}       sub={`Gross ${$(summary.grossSales)}`} accent="text-violet-700" />
        <KPI label="Orders"          value={num(summary.orderCount)}    sub={`AOV ${$(summary.avgOrderValue)}`} />
        <KPI label="Customers"       value={num(summary.totalCustomers)} sub={`${pct(summary.returningCustomerRate)} returning`} />
        <KPI label="Avg Spend / Cust" value={$(summary.avgCustomerSpend)} sub={`${num(summary.subscribedCustomers)} subscribed`} />
        <KPI label="Conv. Rate"      value={pct(summary.conversionRate)} sub={`${num(summary.totalSessions)} sessions`} />
      </div>

      {/* Revenue / Sessions chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Performance Over Time</h2>
            <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
              {[['revenue','Revenue'],['sessions','Sessions'],['orders','Orders']].map(([v,l]) => (
                <button key={v} onClick={() => setChartMode(v)}
                  className={`px-3 py-1 transition-colors ${chartMode === v ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
            {RANGES.map(r => (
              <button key={r.label} onClick={() => setRange(r.days)}
                className={`px-3 py-1 transition-colors ${range === r.days ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
              interval={Math.floor(chartData.length / 8)} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={52}
              tickFormatter={v => chartMode === 'revenue' ? $(v) : num(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={chartMode === 'revenue' ? 'Revenue' : chartMode === 'sessions' ? 'Sessions' : 'Orders'}
              stroke="#7c3aed" strokeWidth={2} fill="url(#grad)" dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Products + Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Top Products</h2>
          <p className="text-xs text-gray-400 mb-4">By net sales · all time</p>
          <ResponsiveContainer width="100%" height={products.length * 28 + 16}>
            <BarChart data={products} layout="vertical" margin={{ left: 8, right: 40, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => $(v)} />
              <YAxis dataKey="title" type="category" width={160} tick={{ fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={shortTitle} />
              <Tooltip formatter={(v, n) => [$(v), 'Net Sales']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="netSales" radius={[0, 4, 4, 0]}>
                {products.map((_, i) => <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Customer Overview</h2>
          <p className="text-xs text-gray-400 mb-4">Lifetime totals · all time</p>

          {/* Returning rate bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>New customers</span>
              <span>Returning</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
              <div className="bg-violet-500 h-full transition-all"
                style={{ width: `${100 - summary.returningCustomerRate}%` }} />
              <div className="bg-amber-500 h-full transition-all"
                style={{ width: `${summary.returningCustomerRate}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{pct(100 - summary.returningCustomerRate)}</span>
              <span>{pct(summary.returningCustomerRate)}</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={customerData} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={48}
                tickFormatter={v => num(v)} />
              <Tooltip formatter={v => [num(v), 'customers']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {customerData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {customerData.map(d => (
              <div key={d.label} className="text-center">
                <p className="text-lg font-bold text-gray-900">{num(d.value)}</p>
                <p className="text-xs text-gray-400">{d.label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
