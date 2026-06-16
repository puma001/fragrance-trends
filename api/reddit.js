const UA_BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const UA = 'fragrance-trends/1.0 (personal use, contact via reddit)'

let tokenCache = { token: null, expiry: 0 }

async function getOAuthToken(clientId, clientSecret) {
  if (tokenCache.token && Date.now() < tokenCache.expiry) return tokenCache.token
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`OAuth error: ${JSON.stringify(data)}`)
  tokenCache = { token: data.access_token, expiry: Date.now() + (data.expires_in - 60) * 1000 }
  return tokenCache.token
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

function parseRSStoJSON(xmlText, subreddit) {
  const entries = []
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g
  let m, idx = 0
  while ((m = entryRe.exec(xmlText)) !== null) {
    const e = m[1]
    const getTag = tag => e.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] || ''
    const getAttr = (tag, attr) => e.match(new RegExp(`<${tag}[^>]+${attr}="([^"]+)"`))?.[1] || ''
    const decodeEntities = s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    const rawId = getTag('id')
    const isComment = rawId.startsWith('t1_')
    entries.push({
      id: rawId.replace(/^t[13]_/, '') || String(idx++),
      title: decodeEntities(getTag('title')),
      selftext: stripHTMLNode(getTag('content')).substring(0, 600),
      author: getTag('name').replace('/u/', ''),
      permalink: getAttr('link', 'href').replace('https://www.reddit.com', ''),
      created_utc: new Date(getTag('published')).getTime() / 1000 || 0,
      score: 0, num_comments: 0,
      subreddit,
      link_flair_text: '',
      isComment,
    })
  }
  return entries
}

async function fetchRSS(sub, sort, limit) {
  const url = `https://www.reddit.com/r/${sub}/${sort}/.rss?limit=${limit}`
  const res = await fetch(url, { headers: { 'User-Agent': UA_BROWSER, Accept: 'application/atom+xml' } })
  if (!res.ok) throw new Error(`RSS r/${sub}: ${res.status}`)
  return parseRSStoJSON(await res.text(), sub)
}

async function fetchCommentRSS(sub, postId, limit) {
  const url = `https://www.reddit.com/r/${sub}/comments/${postId}/.rss?limit=${limit}`
  const res = await fetch(url, { headers: { 'User-Agent': UA_BROWSER, Accept: 'application/atom+xml' } })
  if (!res.ok) throw new Error(`Comments r/${sub}/${postId}: ${res.status}`)
  const entries = parseRSStoJSON(await res.text(), sub)
  return entries.filter(e => e.isComment)
}

async function fetchOAuth(clientId, clientSecret, sub, sort, limit) {
  const token = await getOAuthToken(clientId, clientSecret)
  const url = `https://oauth.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': UA } })
  if (!res.ok) throw new Error(`OAuth r/${sub}: ${res.status}`)
  const json = await res.json()
  return json.data.children.map(c => ({
    id: c.data.id, title: c.data.title,
    selftext: (c.data.selftext || '').substring(0, 800),
    author: c.data.author, permalink: c.data.permalink,
    created_utc: c.data.created_utc, score: c.data.score,
    num_comments: c.data.num_comments, subreddit: c.data.subreddit,
    link_flair_text: c.data.link_flair_text || '', isComment: false,
  }))
}

async function fetchPublicJSON(sub, sort, limit, after) {
  const afterParam = after ? `&after=${after}` : ''
  const url = `https://www.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1${afterParam}`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA_BROWSER },
  })
  if (!res.ok) throw new Error(`Public JSON r/${sub}: ${res.status}`)
  const json = await res.json()
  const nextAfter = json.data?.after || null
  const posts = (json.data?.children || []).map(c => ({
    id: c.data.id, title: c.data.title,
    selftext: (c.data.selftext || '').substring(0, 800),
    author: c.data.author, permalink: c.data.permalink,
    created_utc: c.data.created_utc, score: c.data.score,
    num_comments: c.data.num_comments, subreddit: c.data.subreddit,
    link_flair_text: c.data.link_flair_text || '', isComment: false,
  }))
  return { posts, after: nextAfter }
}

export default async function handler(req, res) {
  const { sub, sort = 'hot', limit = 100, after, mode, postId } = req.query
  if (!sub) return res.status(400).json({ error: 'sub required' })

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  const safeLimit = Math.min(Number(limit), 100)

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

  try {
    if (mode === 'comments') {
      if (!postId) return res.status(400).json({ error: 'postId required for comments mode' })
      const comments = await fetchCommentRSS(sub, postId, safeLimit)
      return res.json({ comments })
    }

    if (clientId && clientSecret) {
      const posts = await fetchOAuth(clientId, clientSecret, sub, sort, safeLimit)
      return res.json({ posts, after: null, source: 'oauth' })
    }

    // Try public JSON API first (works from Vercel), fall back to RSS
    try {
      const result = await fetchPublicJSON(sub, sort, safeLimit, after)
      return res.json({ posts: result.posts, after: result.after, source: 'json' })
    } catch {
      const posts = await fetchRSS(sub, sort, safeLimit)
      return res.json({ posts, after: null, source: 'rss' })
    }
  } catch (e) {
    res.status(502).json({ error: e.message })
  }
}
