/**
 * Converts FRAGRANCE_DATA_REPOSITORY_*.xlsx → src/data/marketData.json
 * Run: node scripts/convert-market-data.cjs
 * Reads the newest FRAGRANCE_DATA_REPOSITORY_*.xlsx in the project root.
 */

const fs   = require('fs')
const path = require('path')
const xlsx = require('xlsx')

// Find newest matching file in project root
const ROOT = path.join(__dirname, '..')
const file = fs.readdirSync(ROOT)
  .filter(f => f.startsWith('FRAGRANCE_DATA_REPOSITORY') && f.endsWith('.xlsx'))
  .sort().pop()
if (!file) { console.error('No FRAGRANCE_DATA_REPOSITORY_*.xlsx found in project root'); process.exit(1) }

const month = file.replace('FRAGRANCE_DATA_REPOSITORY_', '').replace('.xlsx', '').replace(/_/g, ' ')
console.log('Reading:', file, '→ month:', month)

const wb = xlsx.readFile(path.join(ROOT, file), { cellDates: false })
const sheet = name => xlsx.utils.sheet_to_json(wb.Sheets[name] || {}, { header: 1, defval: '' })

const num  = v => typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.-]/g, '')) || 0
const str  = v => fixEnc(String(v || '').trim())
const fixEnc = s => s
  .replace(/Ã¨/g,'è').replace(/Ã©/g,'é').replace(/Ã /g,'à').replace(/Ã¢/g,'â')
  .replace(/Ã®/g,'î').replace(/Ã´/g,'ô').replace(/Ã»/g,'û').replace(/Ã§/g,'ç')
  .replace(/Ã«/g,'ë').replace(/Ã¯/g,'ï').replace(/Ã¹/g,'ù').replace(/Ã¼/g,'ü')
const excelDate = serial => {
  if (!serial || typeof serial !== 'number') return ''
  try { return new Date((serial - 25569) * 86400 * 1000).toISOString().slice(0, 10) } catch { return '' }
}

// ── New Launches ─────────────────────────────────────────────────────────────
function parseLaunches() {
  const rows = sheet('New Launches')
  return rows.slice(1)
    .filter(r => str(r[0]) && str(r[1]))
    .map(r => ({
      brand:    str(r[0]),
      name:     str(r[1]),
      notes:    str(r[2]),
      profile:  str(r[3]),
      category: str(r[4]),
      url:      str(r[5]),
      date:     excelDate(r[6]) || str(r[6]),
      dupeBrands: str(r[12]),
      dupedFrom:  str(r[8]),
    }))
}

// ── Amazon / eBay top sellers ────────────────────────────────────────────────
function parseSellers(sheetName) {
  const rows = sheet(sheetName)
  // Data starts at row index 2 (0=headers, 1=week label)
  return rows.slice(2)
    .filter(r => r[0] !== '' && r[1] !== '')
    .map(r => ({
      rank:          num(r[0]),
      name:          str(r[1]),
      notes:         str(r[2]),
      price:         num(r[3]),
      rating:        str(r[4]),
      reviews:       typeof r[5] === 'number' ? r[5] : parseInt(str(r[5]).replace(/,/g, '')) || 0,
      lastWeekRank:  num(r[8]),
      lastWeekName:  str(r[9]),
      lastWeekNotes: str(r[10]),
      lastWeekPrice: num(r[11]),
    }))
    .filter(r => r.rank > 0)
}

// ── Top Notes ────────────────────────────────────────────────────────────────
function parseTopNotes() {
  const rows = sheet('Top Notes')
  return rows.slice(1)
    .filter(r => str(r[0]))
    .map(r => ({
      note:           str(r[0]),
      currentFreq:    num(r[1]),
      trendingNote:   str(r[3]),
      trendingFreq:   num(r[4]),
    }))
}

// ── Most Searched ─────────────────────────────────────────────────────────────
function parseMostSearched() {
  const rows = sheet('Most Search')
  // Row 0: ["TOP","","","RISING",...]
  // Row 1+: data — TOP in col 0-1, RISING in col 3-4, second table in col 9-11 (top) and col 11-12 (rising)
  const top = [], rising = []
  rows.slice(1).forEach(r => {
    const t = str(r[0]), ri = str(r[3])
    if (t && t !== 'TOP')    top.push({ term: t, score: num(r[1]) })
    if (ri && ri !== 'RISING') rising.push({ term: ri, score: num(r[4]) })
  })
  return { top: top.slice(0, 10), rising: rising.slice(0, 10) }
}

// ── Fragrantica highest rated ─────────────────────────────────────────────────
function parseFragrantica() {
  const rows = sheet('Fragantica highest rated')
  // Row 0: ["Popular", "Rated"]
  // Row 2+: col 0-1 = popular fragrances (name, brand), col 3 = rated (numbered)
  const popular = [], rated = []
  rows.slice(2).forEach(r => {
    if (str(r[0])) popular.push({ name: str(r[0]), detail: str(r[1]) })
    const ratedEntry = str(r[3])
    if (ratedEntry) rated.push(ratedEntry.replace(/^\d+\.\s*/, ''))
  })
  return { popular: popular.slice(0, 10), rated: rated.slice(0, 10) }
}

// ── Report summary ────────────────────────────────────────────────────────────
function parseSummary() {
  const rows = sheet('Report')
  // Row 1 has first values for each section
  const topNotes    = rows.slice(1, 6).map(r => str(r[0])).filter(Boolean)
  const trendNotes  = rows.slice(1, 6).map(r => str(r[1])).filter(Boolean)
  const topProducts = rows.slice(1, 6).map(r => str(r[2])).filter(Boolean)
  const searched    = rows.slice(1, 8).map(r => str(r[7])).filter(Boolean)
  const prices      = rows.slice(1, 10).map(r => num(r[3])).filter(v => v > 0)
  const avgPrice    = prices.length ? Math.round((prices.reduce((a,b) => a+b,0) / prices.length) * 100) / 100 : 0
  return { topNotes, trendNotes, topProducts, searched, avgPrice }
}

// ── Build output ─────────────────────────────────────────────────────────────
const output = {
  month,
  summary:       parseSummary(),
  launches:      parseLaunches(),
  amazonSellers: parseSellers('Amazon top sellers'),
  ebaySellers:   parseSellers('Ebay top sellers'),
  topNotes:      parseTopNotes(),
  mostSearched:  parseMostSearched(),
  fragrantica:   parseFragrantica(),
}

const outPath = path.join(ROOT, 'src', 'data', 'marketData.json')
fs.writeFileSync(outPath, JSON.stringify(output, null, 2))

console.log(`✓ Written to ${outPath}`)
console.log(`  Month: ${output.month}`)
console.log(`  Launches: ${output.launches.length}`)
console.log(`  Amazon sellers: ${output.amazonSellers.length}`)
console.log(`  eBay sellers: ${output.ebaySellers.length}`)
console.log(`  Top notes: ${output.topNotes.length}`)
console.log(`  Most searched: top=${output.mostSearched.top.length}, rising=${output.mostSearched.rising.length}`)
console.log(`  Fragrantica popular: ${output.fragrantica.popular.length}, rated: ${output.fragrantica.rated.length}`)
