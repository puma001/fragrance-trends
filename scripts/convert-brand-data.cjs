/**
 * Converts Shopify CSV exports → src/data/brandData.json
 * Run: node scripts/convert-brand-data.cjs
 * Input:  C:\Users\puma0\OneDrive\Documentos\SB DATA\CODE\Processed\*.csv
 * Output: src/data/brandData.json
 */

const fs = require('fs')
const path = require('path')

const INPUT_DIR = 'C:\\Users\\puma0\\OneDrive\\Documentos\\SB DATA\\CODE\\Processed'
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'brandData.json')

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (!lines.length) return []
  const headers = splitCSVLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const vals = splitCSVLine(line)
    const row = {}
    headers.forEach((h, idx) => { row[h.trim()] = (vals[idx] || '').trim() })
    rows.push(row)
  }
  return rows
}

function splitCSVLine(line) {
  const result = []
  let cur = '', inQuote = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { inQuote = !inQuote }
    else if (c === ',' && !inQuote) { result.push(cur); cur = '' }
    else { cur += c }
  }
  result.push(cur)
  return result
}

const num = v => parseFloat(v) || 0
const int = v => parseInt(v) || 0

// ── Load all CSVs ─────────────────────────────────────────────────────────────
function loadAll() {
  const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.csv'))
  const byType = { full: {}, byDay: {}, product: {}, customer: {} }

  for (const file of files) {
    const text = fs.readFileSync(path.join(INPUT_DIR, file), 'utf8')
    const rows = parseCSV(text)
    if (!rows.length) continue
    const brand = rows[0]['Brand'] || file.match(/([A-Z]+)\.csv$/)?.[1] || 'Unknown'

    if (file.startsWith('Full report by day')) {
      byType.byDay[brand] = rows
    } else if (file.startsWith('Full report')) {
      byType.full[brand] = rows
    } else if (file.startsWith('Product Report')) {
      byType.product[brand] = rows
    } else if (file.startsWith('Customer Report')) {
      byType.customer[brand] = rows  // will only use aggregates, no PII
    }
  }
  return byType
}

// ── Summarise ─────────────────────────────────────────────────────────────────
function buildSummary(fullRows, byDayRows, customerRows) {
  // From full report — totals
  let netSales = 0, grossSales = 0, totalOrders = new Set(), newOrders = 0, returningOrders = 0
  for (const r of (fullRows || [])) {
    netSales     += num(r['Net sales'])
    grossSales   += num(r['Gross sales'])
    if (r['Order ID']) totalOrders.add(r['Order ID'])
    newOrders       += int(r['Orders (first-time)'])
    returningOrders += int(r['Orders (returning)'])
  }
  const orderCount = totalOrders.size || (newOrders + returningOrders)
  const avgOrderValue = orderCount > 0 ? netSales / orderCount : 0

  // From by-day — session totals
  let totalSessions = 0, totalCheckouts = 0, totalVisitors = 0
  for (const r of (byDayRows || [])) {
    totalSessions   += int(r['Sessions'])
    totalCheckouts  += int(r['Sessions that completed checkout'])
    totalVisitors   += int(r['Online store visitors'])
  }
  const conversionRate = totalSessions > 0 ? (totalCheckouts / totalSessions) * 100 : 0

  // From customer report — aggregate only, NO PII
  let totalCustomers = 0, newCustomers = 0, returningCustomers = 0,
      subscribed = 0, totalSpend = 0
  for (const r of (customerRows || [])) {
    totalCustomers++
    newCustomers       += int(r['New customers'])
    returningCustomers += int(r['Returning customers'])
    if (r['Customer email subscription status'] === 'SUBSCRIBED') subscribed++
    totalSpend += num(r['Total amount spent'])
  }
  const avgCustomerSpend = totalCustomers > 0 ? totalSpend / totalCustomers : 0
  const returningRate = totalCustomers > 0 ? returningCustomers / totalCustomers : 0

  return {
    netSales: Math.round(netSales * 100) / 100,
    grossSales: Math.round(grossSales * 100) / 100,
    orderCount,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    newOrders,
    returningOrders,
    totalSessions,
    totalVisitors,
    conversionRate: Math.round(conversionRate * 100) / 100,
    totalCustomers,
    newCustomers,
    returningCustomers,
    subscribedCustomers: subscribed,
    avgCustomerSpend: Math.round(avgCustomerSpend * 100) / 100,
    returningCustomerRate: Math.round(returningRate * 10000) / 100,
  }
}

function buildByDay(rows) {
  return (rows || [])
    .filter(r => r['Day'] && r['Day'] !== '0')
    .map(r => ({
      day: r['Day'],
      netSales: num(r['Net sales']),
      grossSales: num(r['Gross sales']),
      sessions: int(r['Sessions']),
      visitors: int(r['Online store visitors']),
      checkouts: int(r['Sessions that completed checkout']),
      newCustomers: int(r['New customers']),
      returningCustomers: int(r['Returning customers']),
      avgOrderValue: num(r['Average order value']),
    }))
    .sort((a, b) => a.day.localeCompare(b.day))
}

function buildProducts(rows) {
  return (rows || [])
    .map(r => ({
      id: r['Product ID'],
      title: r['Product title'],
      type: r['Product type'],
      vendor: r['Product vendor'],
      netSales: num(r['Total sales']),
      orders: int(r['Orders']),
      customers: int(r['Customers']),
      newCustomers: int(r['New customers']),
      returningCustomers: int(r['Returning customers']),
      returningRate: Math.round(num(r['Returning customer rate']) * 10000) / 100,
      itemsSold: int(r['Net items sold']),
    }))
    .filter(p => p.title)
    .sort((a, b) => b.netSales - a.netSales)
}

// ── Main ──────────────────────────────────────────────────────────────────────
const data = loadAll()
const brands = [...new Set([
  ...Object.keys(data.full),
  ...Object.keys(data.byDay),
  ...Object.keys(data.product),
])]

const output = {
  brands,
  summary: {},
  byDay: {},
  products: {},
}

for (const brand of brands) {
  output.summary[brand]  = buildSummary(data.full[brand], data.byDay[brand], data.customer[brand])
  output.byDay[brand]    = buildByDay(data.byDay[brand])
  output.products[brand] = buildProducts(data.product[brand])
}

fs.mkdirSync(path.join(__dirname, '..', 'src', 'data'), { recursive: true })
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2))

console.log(`✓ Written to ${OUTPUT_FILE}`)
console.log(`  Brands: ${brands.join(', ')}`)
for (const b of brands) {
  const s = output.summary[b]
  console.log(`  ${b}: $${s.netSales.toLocaleString()} net sales · ${s.orderCount} orders · ${output.byDay[b].length} days · ${output.products[b].length} products`)
}
