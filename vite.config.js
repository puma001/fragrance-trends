import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const UA = 'fragrance-trends/1.0 (personal use)'
const UA_BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

let tokenCache = { token: null, expiry: 0 }

async function getToken(clientId, clientSecret) {
  if (tokenCache.token && Date.now() < tokenCache.expiry) return tokenCache.token
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  tokenCache = { token: data.access_token, expiry: Date.now() + (data.expires_in - 60) * 1000 }
  return data.access_token
}

function stripHTMLNode(raw) {
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&#32;/g, ' ').replace(/&[a-z#0-9]+;/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\[link\]|\[comments?\]/gi, ' ').replace(/submitted by/gi, ' ')
    .replace(/\s+/g, ' ').trim()
}

function parseRSS(xmlText, subreddit) {
  const entries = []
  const re = /<entry>([\s\S]*?)<\/entry>/g
  let m, idx = 0
  while ((m = re.exec(xmlText)) !== null) {
    const e = m[1]
    const get = tag => e.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] || ''
    const getAttr = (tag, attr) => e.match(new RegExp(`<${tag}[^>]+${attr}="([^"]+)"`))?.[1] || ''
    const rawId = get('id')
    entries.push({
      id: rawId.replace(/^t[13]_/, '') || String(idx++),
      title: get('title').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
      selftext: stripHTMLNode(get('content')).substring(0, 800),
      author: get('name').replace('/u/', ''),
      permalink: getAttr('link', 'href').replace('https://www.reddit.com', ''),
      created_utc: new Date(get('published')).getTime() / 1000 || 0,
      score: 0, num_comments: 0, subreddit, link_flair_text: '',
      isComment: rawId.startsWith('t1_'),
    })
  }
  return entries
}

const redditMiddleware = {
  name: 'reddit-proxy',
  configureServer(server) {
    server.middlewares.use('/api/reddit', async (req, res) => {
      const qs = new URL(req.url, 'http://localhost').searchParams
      const sub = qs.get('sub')
      const sort = qs.get('sort') || 'hot'
      const limit = Math.min(Number(qs.get('limit') || 100), 100)
      const after = qs.get('after') || ''
      const mode = qs.get('mode')
      const postId = qs.get('postId')
      if (!sub) { res.statusCode = 400; res.end(JSON.stringify({ error: 'sub required' })); return }

      const clientId = process.env.REDDIT_CLIENT_ID
      const clientSecret = process.env.REDDIT_CLIENT_SECRET
      res.setHeader('Content-Type', 'application/json')

      try {
        if (mode === 'comments') {
          if (!postId) { res.statusCode = 400; res.end(JSON.stringify({ error: 'postId required' })); return }
          const url = `https://www.reddit.com/r/${sub}/comments/${postId}/.rss?limit=${limit}`
          const r = await fetch(url, { headers: { 'User-Agent': UA_BROWSER, Accept: 'application/atom+xml' } })
          const all = parseRSS(await r.text(), sub)
          const comments = all.filter(e => e.isComment)
          res.statusCode = 200
          res.end(JSON.stringify({ comments }))
          return
        }

        let posts
        if (clientId && clientSecret) {
          const token = await getToken(clientId, clientSecret)
          const afterParam = after ? `&after=${after}` : ''
          const url = `https://oauth.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1${afterParam}`
          const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': UA } })
          const json = await r.json()
          const nextAfter = json.data.after || null
          posts = json.data.children.map(c => ({
            id: c.data.id, title: c.data.title, selftext: (c.data.selftext || '').substring(0, 800),
            author: c.data.author, permalink: c.data.permalink, created_utc: c.data.created_utc,
            score: c.data.score, num_comments: c.data.num_comments, subreddit: c.data.subreddit,
            link_flair_text: c.data.link_flair_text || '', isComment: false,
          }))
          res.statusCode = 200
          res.end(JSON.stringify({ posts, after: nextAfter, source: 'oauth' }))
          return
        } else {
          const url = `https://www.reddit.com/r/${sub}/${sort}/.rss?limit=${limit}`
          const r = await fetch(url, { headers: { 'User-Agent': UA_BROWSER, Accept: 'application/atom+xml' } })
          posts = parseRSS(await r.text(), sub).filter(e => !e.isComment)
        }
        res.statusCode = 200
        res.end(JSON.stringify({ posts, after: null, source: 'rss' }))
      } catch (e) {
        res.statusCode = 502
        res.end(JSON.stringify({ error: e.message }))
      }
    })
  },
}

const TIKTOK_ACTOR = 'clockworks~tiktok-scraper'
const TIKTOK_BASE = 'https://api.apify.com/v2'
const TIKTOK_HASHTAGS = ['fragrancetok', 'perfumetok']

const tiktokMiddleware = {
  name: 'tiktok-proxy',
  configureServer(server) {
    server.middlewares.use('/api/tiktok', async (req, res) => {
      const token = process.env.APIFY_TOKEN
      res.setHeader('Content-Type', 'application/json')
      if (!token) { res.statusCode = 400; res.end(JSON.stringify({ error: 'APIFY_TOKEN not set' })); return }

      const runId = new URL(req.url, 'http://localhost').searchParams.get('runId')
      try {
        if (runId) {
          const sr = await fetch(`${TIKTOK_BASE}/acts/${TIKTOK_ACTOR}/runs/${runId}?token=${token}`)
          const { data } = await sr.json()
          if (data.status === 'SUCCEEDED') {
            const ir = await fetch(`${TIKTOK_BASE}/acts/${TIKTOK_ACTOR}/runs/${runId}/dataset/items?token=${token}&limit=100`)
            res.end(JSON.stringify({ status: 'SUCCEEDED', videos: await ir.json() }))
          } else {
            res.end(JSON.stringify({ status: data.status }))
          }
        } else {
          const rr = await fetch(`${TIKTOK_BASE}/acts/${TIKTOK_ACTOR}/runs?token=${token}&memory=256`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hashtags: TIKTOK_HASHTAGS, resultsPerPage: 10, maxResults: 20, shouldDownloadVideos: false, shouldDownloadCovers: false }),
          })
          const { data } = await rr.json()
          res.end(JSON.stringify({ runId: data.id }))
        }
      } catch (e) {
        res.statusCode = 502
        res.end(JSON.stringify({ error: e.message }))
      }
    })
  },
}

export default defineConfig({
  plugins: [react(), redditMiddleware, tiktokMiddleware],
})
