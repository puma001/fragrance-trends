/**
 * Converts FRAGRANCE_DATA_REPOSITORY_*.xlsx → src/data/marketData.json
 * Run: node scripts/convert-market-data.cjs
 */
const fs   = require('fs')
const path = require('path')
const xlsx = require('xlsx')

const ROOT = path.join(__dirname, '..')
const file = fs.readdirSync(ROOT)
  .filter(f => f.startsWith('FRAGRANCE_DATA_REPOSITORY') && f.endsWith('.xlsx'))
  .sort().pop()
if (!file) { console.error('No FRAGRANCE_DATA_REPOSITORY_*.xlsx found'); process.exit(1) }

const month = file.replace('FRAGRANCE_DATA_REPOSITORY_', '').replace('.xlsx', '').replace(/_/g, ' ')
console.log('Reading:', file, '→', month)

const wb   = xlsx.readFile(path.join(ROOT, file), { cellDates: false })
const rows = name => xlsx.utils.sheet_to_json(wb.Sheets[name] || {}, { header: 1, defval: '' })

const n   = v => parseFloat(String(v).replace(/[^0-9.-]/g, '')) || 0
const fix = s => String(s || '').trim()
  .replace(/Ã¨/g,'è').replace(/Ã©/g,'é').replace(/Ã /g,'à').replace(/Ã¢/g,'â')
  .replace(/Ã®/g,'î').replace(/Ã´/g,'ô').replace(/Ã»/g,'û').replace(/Ã§/g,'ç')
  .replace(/Ã«/g,'ë').replace(/Ã¯/g,'ï').replace(/Ã¹/g,'ù').replace(/Ã¼/g,'ü')
const excelDate = v => {
  if (!v || typeof v !== 'number') return fix(v)
  try { return new Date((v - 25569) * 86400000).toISOString().slice(0, 10) } catch { return '' }
}

// ── Report: col A rows 1-5 = top notes, col B rows 1-5 = trending notes ──────
function parseReport() {
  const r = rows('Report')
  const topNotes      = r.slice(1, 6).map(row => fix(row[0])).filter(Boolean)
  const trendingNotes = r.slice(1, 6).map(row => fix(row[1])).filter(Boolean)
  return { topNotes, trendingNotes }
}

// ── New Launches: everything ──────────────────────────────────────────────────
function parseLaunches() {
  return rows('New Launches').slice(1)
    .filter(r => fix(r[0]) && fix(r[1]))
    .map(r => ({
      brand:    fix(r[0]),
      name:     fix(r[1]),
      notes:    fix(r[2]),
      profile:  fix(r[3]),
      category: fix(r[4]),
      url:      fix(r[5]),
      date:     excelDate(r[6]),
      dupedFrom: fix(r[8]),
    }))
}

// ── Most Search: 4 weekly blocks ──────────────────────────────────────────────
// Week offsets (0-based): 0, 49, 77, 106
// Each block: row 0 = header "TOP/RISING", rows 1-24 = data
// Discard week if col A of first data row is empty
function parseSearch() {
  const r = rows('Most Search')
  const OFFSETS = [0, 49, 77, 106]
  const weeks = []

  OFFSETS.forEach((start, wi) => {
    const block = r.slice(start, start + 26)
    if (!block.length) return
    // First data row is index 1 of block (index 0 is header)
    const firstData = block[1]
    if (!fix(firstData?.[0])) return  // discard empty week

    const top = [], rising = []
    block.slice(1).forEach(row => {
      if (fix(row[0]) && row[0] !== 'TOP')    top.push({ term: fix(row[0]), score: n(row[1]) })
      if (fix(row[3]) && row[3] !== 'RISING') rising.push({ term: fix(row[3]), score: n(row[4]) })
    })
    if (top.length) weeks.push({ week: wi + 1, top, rising })
  })
  return weeks
}

// ── Sellers helper: both Amazon and eBay ──────────────────────────────────────
// Week label rows (0-based): 1, 22, 43, 64 — followed by 20 data rows each
// Discard week if col B (index 1) of first data row is empty
function parseSellers(sheetName) {
  const r = rows(sheetName)
  // label row indices in 0-based (rows that contain "WEEK N" in col B)
  const LABEL_ROWS = [1, 22, 43, 64]
  const weeks = []

  LABEL_ROWS.forEach((labelRow, wi) => {
    const dataStart = labelRow + 1          // first actual data row
    const dataEnd   = dataStart + 20        // 20 products per week
    const block     = r.slice(dataStart, dataEnd)
    if (!block.length) return
    if (!fix(block[0]?.[1])) return         // discard if col B empty

    const sellers = block
      .filter(row => fix(row[1]))           // col B = product name
      .map(row => ({
        rank:          n(row[0]),
        name:          fix(row[1]),
        notes:         fix(row[2]),
        price:         n(row[3]),
        rating:        fix(row[4]),
        reviews:       typeof row[5] === 'number' ? row[5] : parseInt(fix(row[5]).replace(/,/g, '')) || 0,
        prevRank:      n(row[8]),
        prevName:      fix(row[9]),
        prevNotes:     fix(row[10]),
        prevPrice:     n(row[11]),
      }))
    if (sellers.length) weeks.push({ week: wi + 1, sellers })
  })
  return weeks
}

// ── Fragrantica: pick highest of C3/G3/K3/O3, extract that column pair ────────
// C3 = row[2][2], G3 = row[2][6], K3 = row[2][10], O3 = row[2][14]
// B:C=cols 1-2, F:G=cols 5-6, J:K=cols 9-10, N:O=cols 13-14
// Extract rows 1-104 (0-based) of the winning pair
function parseFragrantica() {
  const r = rows('Fragantica data')
  const COLS = [
    { valIdx: 2,  labelCol: 1,  countCol: 2  },  // C3 → B:C
    { valIdx: 6,  labelCol: 5,  countCol: 6  },  // G3 → F:G
    { valIdx: 10, labelCol: 9,  countCol: 10 },  // K3 → J:K
    { valIdx: 14, labelCol: 13, countCol: 14 },  // O3 → N:O
  ]
  // row index 2 (0-based) = Excel row 3
  const ref = r[2] || []
  const values = COLS.map(c => n(ref[c.valIdx]))
  const maxIdx = values.indexOf(Math.max(...values))
  const { labelCol, countCol } = COLS[maxIdx]

  return r.slice(1, 105)  // rows 1-104 (0-based) = Excel B2:O105
    .map(row => ({ label: fix(row[labelCol]), count: n(row[countCol]) }))
    .filter(d => d.label && d.label !== 'Gender' && d.count > 0)
}

// ── Assemble ──────────────────────────────────────────────────────────────────
const out = {
  month,
  report:        parseReport(),
  launches:      parseLaunches(),
  search:        parseSearch(),
  amazonSellers: parseSellers('Amazon top sellers'),
  ebaySellers:   parseSellers('Ebay top sellers'),
  fragrantica:   parseFragrantica(),
}

fs.mkdirSync(path.join(ROOT, 'src', 'data'), { recursive: true })
const outPath = path.join(ROOT, 'src', 'data', 'marketData.json')
fs.writeFileSync(outPath, JSON.stringify(out, null, 2))

console.log(`✓ ${outPath}`)
console.log(`  Launches: ${out.launches.length}`)
console.log(`  Search weeks: ${out.search.length} (${out.search.map(w=>'W'+w.week).join(', ')})`)
console.log(`  Amazon weeks: ${out.amazonSellers.length} (${out.amazonSellers.map(w=>'W'+w.week).join(', ')})`)
console.log(`  eBay weeks:   ${out.ebaySellers.length} (${out.ebaySellers.map(w=>'W'+w.week).join(', ')})`)
console.log(`  Fragrantica:  ${out.fragrantica.length} entries`)
console.log(`  Report notes: [${out.report.topNotes.join(', ')}]`)
