export const SUBREDDITS = ['fragrance', 'cologne', 'perfume']
const SORTS = ['hot', 'top', 'new']
const PAGES_PER_SORT = 3  // 100 posts × 3 pages × 3 sorts × 3 subs = up to 2,700 raw

const delay = ms => new Promise(r => setTimeout(r, ms))

async function apiFetch(params, signal) {
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
