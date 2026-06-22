/**
 * Converts Klaviyo XLSX exports → src/data/emailData.json
 * Run: node scripts/convert-email-data.cjs
 * Input:  C:\Users\puma0\OneDrive\Documentos\SB DATA\MProcessed\*.xlsx
 * Output: src/data/emailData.json
 */

const fs   = require('fs')
const path = require('path')
const XLSX = require('xlsx')

const INPUT_DIR  = 'C:\\Users\\puma0\\OneDrive\\Documentos\\SB DATA\\MProcessed'
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'emailData.json')

const num = v => parseFloat(v) || 0
const int = v => parseInt(v)  || 0

function readSheet(file) {
  const wb = XLSX.readFile(path.join(INPUT_DIR, file))
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { defval: '' })
}

function brandFromFile(file) {
  const m = file.match(/([A-Z]+)\.xlsx$/)
  return m ? m[1] : null
}

// ── Campaigns ─────────────────────────────────────────────────────────────────
function processCampaigns(rows) {
  if (!rows.length) return null
  let totalRevenue = 0, totalOrders = 0, totalSent = 0
  let weightedOpen = 0, weightedClick = 0

  const items = rows
    .filter(r => r['Campaign name'] && num(r['Messages sent']) > 0)
    .map(r => {
      const sent      = int(r['Messages sent'])
      const revenue   = num(r['Revenue'])
      const orders    = int(r['Placed orders'] ?? r['Messages resulted in placed orders'])
      const openRate  = num(r['Open rate (%)'])
      const clickRate = num(r['Click rate (%)'])
      totalRevenue  += revenue
      totalOrders   += orders
      totalSent     += sent
      weightedOpen  += openRate  * sent
      weightedClick += clickRate * sent
      return {
        name:      String(r['Campaign name']),
        type:      String(r['Campaign type'] || 'Email'),
        date:      String(r['Send date'] || '').slice(0, 10),
        sent,
        revenue:   Math.round(revenue * 100) / 100,
        orders,
        openRate:  Math.round(openRate  * 10) / 10,
        clickRate: Math.round(clickRate * 10) / 10,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

  return {
    totalRevenue:  Math.round(totalRevenue  * 100) / 100,
    totalOrders,
    totalSent,
    avgOpenRate:   totalSent > 0 ? Math.round(weightedOpen  / totalSent * 10) / 10 : 0,
    avgClickRate:  totalSent > 0 ? Math.round(weightedClick / totalSent * 10) / 10 : 0,
    top: items.slice(0, 10),
  }
}

// ── Workflows ─────────────────────────────────────────────────────────────────
function processWorkflows(rows) {
  if (!rows.length) return null

  // Aggregate by workflow name (each workflow has multiple messages/steps)
  const byWorkflow = {}
  for (const r of rows) {
    const name = String(r['Workflow name'] || '').trim()
    if (!name) continue
    const sent = int(r['Messages sent'])
    if (!byWorkflow[name]) byWorkflow[name] = { name, sent: 0, revenue: 0, orders: 0, weightedOpen: 0, weightedClick: 0 }
    const wf = byWorkflow[name]
    wf.revenue       += num(r['Revenue'])
    wf.orders        += int(r['Placed orders'] ?? r['Messages resulted in placed orders'])
    wf.weightedOpen  += num(r['Open rate (%)'])  * sent
    wf.weightedClick += num(r['Click rate (%)']) * sent
    wf.sent          += sent
  }

  let totalRevenue = 0, totalOrders = 0, totalSent = 0
  let weightedOpen = 0, weightedClick = 0

  const items = Object.values(byWorkflow)
    .map(wf => {
      totalRevenue  += wf.revenue
      totalOrders   += wf.orders
      totalSent     += wf.sent
      weightedOpen  += wf.weightedOpen
      weightedClick += wf.weightedClick
      return {
        name:      wf.name,
        sent:      wf.sent,
        revenue:   Math.round(wf.revenue   * 100) / 100,
        orders:    wf.orders,
        openRate:  wf.sent > 0 ? Math.round(wf.weightedOpen  / wf.sent * 10) / 10 : 0,
        clickRate: wf.sent > 0 ? Math.round(wf.weightedClick / wf.sent * 10) / 10 : 0,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

  return {
    totalRevenue:  Math.round(totalRevenue  * 100) / 100,
    totalOrders,
    totalSent,
    avgOpenRate:   totalSent > 0 ? Math.round(weightedOpen  / totalSent * 10) / 10 : 0,
    avgClickRate:  totalSent > 0 ? Math.round(weightedClick / totalSent * 10) / 10 : 0,
    top: items.slice(0, 10),
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.xlsx'))

const campaignFiles = files.filter(f => f.startsWith('Campaign '))
const workflowFiles = files.filter(f => f.startsWith('Workflow '))

const brands = [...new Set([
  ...campaignFiles.map(brandFromFile),
  ...workflowFiles.map(brandFromFile),
].filter(Boolean))].sort()

const output = { brands, email: {} }

for (const brand of brands) {
  const cf = campaignFiles.find(f => brandFromFile(f) === brand)
  const wf = workflowFiles.find(f => brandFromFile(f) === brand)

  output.email[brand] = {
    campaigns: cf ? processCampaigns(readSheet(cf)) : null,
    workflows: wf ? processWorkflows(readSheet(wf)) : null,
  }

  const c = output.email[brand].campaigns
  const w = output.email[brand].workflows
  console.log(`  ${brand}: campaigns $${c?.totalRevenue?.toLocaleString() ?? '-'} · workflows $${w?.totalRevenue?.toLocaleString() ?? '-'}`)
}

fs.mkdirSync(path.join(__dirname, '..', 'src', 'data'), { recursive: true })
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8')
console.log(`✓ Written ${OUTPUT_FILE}`)
console.log(`  Brands: ${brands.join(', ')}`)
