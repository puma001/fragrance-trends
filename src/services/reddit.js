export const SUBREDDITS = ['fragrance', 'cologne', 'perfume']
const SORTS = ['hot', 'top', 'new']
const PAGES_PER_SORT = 3  // 100 posts × 3 pages × 3 sorts × 3 subs = up to 2,700 raw

const delay = ms => new Promise(r => setTimeout(r, ms))

// In production, Reddit allows direct browser CORS requests to its public JSON API.
// In dev, route through the Vite proxy (which handles auth + RSS fallback).
const IS_PROD = import.meta.env.PROD

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

async function fetchDirect(sub, sort, limit, after, signal) {
  const afterParam = after ? `&after=${after}` : ''
  const url = `https://www.reddit.com/r/${sub}/${sort}.json?limit=${limit}&raw_json=1${afterParam}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Reddit ${res.status}`)
  const json = await res.json()
  return { posts: json.data.children.map(mapPost), after: json.data.after || null }
}

async function fetchDirectComments(sub, postId, limit, signal) {
  const url = `https://www.reddit.com/r/${sub}/comments/${postId}.json?limit=${limit}&raw_json=1`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Reddit comments ${res.status}`)
  const json = await res.json()
  const comments = (json[1]?.data?.children || [])
    .filter(c => c.kind === 't1')
    .map(c => ({
      id: c.data.id, selftext: (c.data.body || '').substring(0, 600),
      title: '', author: c.data.author, permalink: c.data.permalink,
      created_utc: c.data.created_utc, score: c.data.score,
      subreddit: sub, isComment: true,
    }))
  return { comments }
}

async function apiFetch(params, signal) {
  if (IS_PROD) {
    const { sub, sort = 'hot', limit = 100, after, mode, postId } = params
    if (mode === 'comments') return fetchDirectComments(sub, postId, limit, signal)
    return fetchDirect(sub, sort, Number(limit), after || null, signal)
  }
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`/api/reddit?${qs}`, { signal })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

// Fetch one subreddit across all sort modes with pagination
async function fetchSubreddit(sub, signal) {
  const posts = []
  for (let i = 0; i < SORTS.length; i++) {
    if (signal?.aborted) break
    let after = null
    for (let page = 0; page < PAGES_PER_SORT; page++) {
      if (signal?.aborted) break
      try {
        const params = { sub, sort: SORTS[i], limit: 100 }
        if (after) params.after = after
        const { posts: batch, after: nextAfter } = await apiFetch(params, signal)
        if (batch) posts.push(...batch)
        after = nextAfter
        if (!after) break
      } catch (e) {
        if (e.name === 'AbortError') break
        console.warn(`r/${sub} ${SORTS[i]} p${page + 1} failed:`, e.message)
        break
      }
      if (page < PAGES_PER_SORT - 1 && after) await delay(800)
    }
    if (i < SORTS.length - 1) await delay(1200)
  }
  return posts
}

export async function fetchAllPosts(sort = 'hot', signal) {
  const all = []
  for (let i = 0; i < SUBREDDITS.length; i++) {
    if (signal?.aborted) break
    const batch = await fetchSubreddit(SUBREDDITS[i], signal)
    all.push(...batch)
    if (i < SUBREDDITS.length - 1) await delay(2000)
  }
  const seen = new Set()
  return all.filter(p => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

export async function fetchSOTDComments(posts, signal) {
  const SOTD_PATTERN = /\b(sotd|scent of the day|daily discussion|advice)\b/i
  const threads = posts
    .filter(p => SOTD_PATTERN.test(p.title) && p.subreddit === 'fragrance')
    .slice(0, 3)

  const comments = []
  for (const thread of threads) {
    if (signal?.aborted) break
    try {
      await delay(1000)
      const { comments: batch } = await apiFetch(
        { sub: thread.subreddit, mode: 'comments', postId: thread.id, limit: 100 },
        signal
      )
      if (batch) comments.push(...batch.map(c => ({ ...c, threadTitle: thread.title })))
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('Comments fetch failed:', e.message)
    }
  }
  return comments
}
