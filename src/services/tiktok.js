import { BRANDS } from './analysis'

export async function fetchTikTokData(signal) {
  const res = await fetch('/api/tiktok', { signal })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `API ${res.status}`)
  return {
    videos: normalizeVideos(data.videos || []),
    cachedAt: data.cachedAt || null,
    stale: data.stale || false,
    pending: data.pending || false,
  }
}

function detectBrands(text) {
  const lower = text.toLowerCase()
  return BRANDS.filter(b => b.terms.some(t => lower.includes(t))).map(b => b.name)
}

function normalizeVideos(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map(v => {
      const url = v.webVideoUrl || ''
      const text = v.text || v.desc || ''
      const id = String(v.id || url.split('/video/')[1] || '')
      const author = v.authorMeta?.name || v['authorMeta.name'] || ''
      const shares = Number(v.shareCount) || 0
      const collects = Number(v.collectCount) || 0
      const hashtags = Array.isArray(v.hashtags) && v.hashtags.length > 0
        ? v.hashtags.map(h => (typeof h === 'object' ? h.name || '' : String(h)).toLowerCase()).filter(Boolean)
        : [...text.matchAll(/#(\w+)/g)].map(m => m[1].toLowerCase())
      return {
        id,
        text,
        author,
        plays: Number(v.playCount) || 0,
        likes: Number(v.diggCount) || 0,
        comments: Number(v.commentCount) || 0,
        shares,
        collects,
        hashtags,
        url,
        brands: detectBrands(text),
        language: v.textLanguage || '',
        createdAt: v.createTimeISO || '',
      }
    })
    .filter(v => v.id)
    .sort((a, b) => b.plays - a.plays)
}

export function getBrandCounts(videos) {
  const counts = {}
  for (const v of videos) {
    for (const brand of v.brands) counts[brand] = (counts[brand] || 0) + 1
  }
  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([brand, count]) => ({ brand, count }))
}

const NOISE_TAGS = new Set([
  'fragrancetok','perfumetok','cologne','perfume','fyp','foryou','foryoupage',
  'fragrance','fragrances','colognetok','fragrancetiktok','perfumetiktok',
  'perfumelover','fragrancelover','fragranciatok','perfumereview','perfumetok',
])

export function getTrendingHashtags(videos) {
  const counts = {}
  for (const v of videos) {
    for (const tag of v.hashtags) {
      if (NOISE_TAGS.has(tag)) continue
      counts[tag] = (counts[tag] || 0) + 1
    }
  }
  return Object.entries(counts)
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }))
}

export function getTopCreators(videos) {
  const map = {}
  for (const v of videos) {
    if (!v.author) continue
    if (!map[v.author]) map[v.author] = { author: v.author, plays: 0, likes: 0, videos: 0, url: `https://www.tiktok.com/@${v.author}` }
    map[v.author].plays += v.plays
    map[v.author].likes += v.likes
    map[v.author].videos++
  }
  return Object.values(map)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10)
}

export function getTikTokStats(videos) {
  if (!videos.length) return { totalReach: 0, totalLikes: 0, avgEngagement: 0, videoCount: 0 }
  const totalReach = videos.reduce((s, v) => s + v.plays, 0)
  const totalLikes = videos.reduce((s, v) => s + v.likes, 0)
  const avgEngagement = videos.filter(v => v.plays > 0)
    .reduce((s, v) => s + (v.likes + v.comments) / v.plays, 0) / videos.length * 100
  return { totalReach, totalLikes, avgEngagement: Math.round(avgEngagement * 10) / 10, videoCount: videos.length }
}

export function exportTikTokCSV(videos) {
  const rows = [
    ['Author', 'Caption', 'Views', 'Likes', 'Comments', 'Shares', 'Engagement%', 'Brands', 'Hashtags', 'Date', 'URL'],
    ...videos.map(v => [
      v.author,
      v.text.replace(/\n/g, ' '),
      v.plays,
      v.likes,
      v.comments,
      v.shares,
      v.plays > 0 ? ((v.likes + v.comments) / v.plays * 100).toFixed(2) : '0',
      v.brands.join('; '),
      v.hashtags.slice(0, 8).join(' '),
      v.createdAt ? v.createdAt.split('T')[0] : '',
      v.url,
    ]),
  ]
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'tiktok-trends.csv'; a.click()
  URL.revokeObjectURL(url)
}
