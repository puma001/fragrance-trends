export const config = { runtime: 'edge' }

// Edge Runtime: uses Cloudflare-edge IPs, different from Lambda
// Reddit blocks Lambda IPs but edge nodes often work

const UA = 'web:fragrance-trends:v1.0 (by /u/puma001)'
const UA_BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

function mapPost(c) {
  return {
    id: c.data.id, title: c.data.title,
    selftext: (c.data.selftext || '').substring(0, 800),
    author: c.data.author, permalink: c.data.permalink,
    created_utc: c.data.created_utc, score: c.data.score,
    num_comments: c.data.num_comments, subreddit: c.data.subreddit,
    link_flair_text: c.data.link_flair_text || '', isComment: false,
  }
}

function stripHTML(raw) {
  return raw
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&[a-z#0-9]+;/g,' ')
    .replace(/<[^>]+>/g,' ').replace(/https?:\/\/\S+/g,' ')
    .replace(/\[link\]|\[comments?\]/gi,' ').replace(/\s+/g,' ').trim()
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
      id: rawId.replace(/^t[13]_/,'') || String(idx++),
      title: get('title').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'),
      selftext: stripHTML(get('content')).substring(0, 800),
      author: get('name').replace('/u/',''),
      permalink: getAttr('link','href').replace('https://www.reddit.com',''),
      created_utc: new Date(get('published')).getTime() / 1000 || 0,
      score: 0, num_comments: 0, subreddit, link_flair_text: '',
      isComment: rawId.startsWith('t1_'),
    })
  }
  return entries
}

async function fetchJSON(sub, sort, limit, after) {
  const afterParam = after ? `&after=${after}` : ''
  const urls = [
    `https://www.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1${afterParam}`,
    `https://old.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1${afterParam}`,
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
      })
      if (!res.ok) continue
      const json = await res.json()
      if (!json?.data?.children) continue
      return { posts: json.data.children.map(mapPost), after: json.data.after || null }
    } catch { /* try next */ }
  }
  return null
}

async function fetchRSS(sub, sort, limit) {
  const url = `https://www.reddit.com/r/${sub}/${sort}/.rss?limit=${limit}`
  const res = await fetch(url, { headers: { 'User-Agent': UA_BROWSER, Accept: 'application/atom+xml' } })
  if (!res.ok) throw new Error(`RSS ${res.status}`)
  return parseRSS(await res.text(), sub).filter(e => !e.isComment)
}

async function fetchOAuth(clientId, clientSecret, sub, sort, limit, after) {
  const creds = btoa(`${clientId}:${clientSecret}`)
  const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: 'grant_type=client_credentials',
  })
  const { access_token } = await tokenRes.json()
  if (!access_token) throw new Error('OAuth token failed')
  const afterParam = after ? `&after=${after}` : ''
  const res = await fetch(
    `https://oauth.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1${afterParam}`,
    { headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': UA } }
  )
  const json = await res.json()
  return { posts: json.data.children.map(mapPost), after: json.data.after || null }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const sub = searchParams.get('sub')
  const sort = searchParams.get('sort') || 'hot'
  const limit = Math.min(Number(searchParams.get('limit') || 100), 100)
  const after = searchParams.get('after') || null
  const mode = searchParams.get('mode')
  const postId = searchParams.get('postId')

  if (!sub) return Response.json({ error: 'sub required' }, { status: 400 })

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
  }

  try {
    if (mode === 'comments') {
      if (!postId) return Response.json({ error: 'postId required' }, { status: 400, headers })
      const url = `https://www.reddit.com/r/${sub}/comments/${postId}/.rss?limit=${limit}`
      const r = await fetch(url, { headers: { 'User-Agent': UA_BROWSER, Accept: 'application/atom+xml' } })
      const all = parseRSS(await r.text(), sub)
      return Response.json({ comments: all.filter(e => e.isComment) }, { headers })
    }

    if (clientId && clientSecret) {
      const result = await fetchOAuth(clientId, clientSecret, sub, sort, limit, after)
      return Response.json({ posts: result.posts, after: result.after, source: 'oauth' }, { headers })
    }

    // Try JSON (edge nodes often not blocked), fall back to RSS
    const jsonResult = await fetchJSON(sub, sort, limit, after)
    if (jsonResult) {
      return Response.json({ posts: jsonResult.posts, after: jsonResult.after, source: 'json' }, { headers })
    }

    const rssPosts = await fetchRSS(sub, sort, limit)
    return Response.json({ posts: rssPosts, after: null, source: 'rss' }, { headers })

  } catch (e) {
    return Response.json({ error: e.message }, { status: 502, headers })
  }
}
