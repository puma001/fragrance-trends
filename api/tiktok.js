const ACTOR = 'GdWCkxBtKWOsKjdch'
const BASE = 'https://api.apify.com/v2'
const HASHTAGS = ['fragrancetok', 'perfumetok']
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function extractItems(raw) {
  // Handle all known Apify response shapes
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.data?.items)) return raw.data.items
  if (Array.isArray(raw?.data)) return raw.data
  return []
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const token = process.env.APIFY_TOKEN
  if (!token) {
    res.status(400).json({ error: 'APIFY_TOKEN not set' })
    return
  }

  try {
    // Get last 50 successful runs (our empty test runs may fill the first 10+)
    const runsRes = await fetch(
      `${BASE}/acts/${ACTOR}/runs?token=${token}&status=SUCCEEDED&limit=50&desc=1`
    )
    const runsBody = await runsRes.json()
    const runs = extractItems(runsBody?.data ?? runsBody)

    console.log(`TikTok: found ${runs.length} successful runs`)

    for (const run of runs) {
      const itemsRes = await fetch(
        `${BASE}/datasets/${run.defaultDatasetId}/items?token=${token}&limit=100`
      )
      const raw = await itemsRes.json()
      const videos = extractItems(raw)

      console.log(`  run ${run.id}: ${videos.length} items (raw type: ${Array.isArray(raw) ? 'array' : typeof raw}, keys: ${!Array.isArray(raw) ? Object.keys(raw ?? {}).join(',') : 'n/a'})`)

      if (videos.length === 0) continue

      const ageMs = run.finishedAt ? Date.now() - new Date(run.finishedAt).getTime() : Infinity
      const stale = ageMs > CACHE_TTL_MS

      if (stale) {
        fetch(`${BASE}/acts/${ACTOR}/runs?token=${token}&memory=256`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hashtags: HASHTAGS,
            resultsPerPage: 25,
            maxResults: 50,
            shouldDownloadVideos: false,
            shouldDownloadCovers: false,
          }),
        }).catch(e => console.error('Background refresh failed:', e.message))
      }

      console.log(`TikTok: serving ${videos.length} videos from run ${run.id}`)
      res.status(200).json({ videos, cachedAt: run.finishedAt, stale })
      return
    }

    // All runs empty — start a fresh one
    console.log('TikTok: all runs empty, starting fresh scrape')
    await fetch(`${BASE}/acts/${ACTOR}/runs?token=${token}&memory=256`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hashtags: HASHTAGS,
        resultsPerPage: 25,
        maxResults: 50,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
      }),
    })

    res.status(200).json({ videos: [], cachedAt: null, pending: true })
  } catch (e) {
    console.error('TikTok error:', e.message)
    res.status(502).json({ error: e.message })
  }
}
