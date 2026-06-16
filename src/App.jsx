import { useState, useEffect, useCallback } from 'react'
import { fetchAllPosts, fetchSOTDComments } from './services/reddit'
import {
  extractKeywords, extractBrandMentions, getStats,
  extractBigrams, extractDescriptors, extractVolumeByDay, extractSentiment,
  extractBrandMentionsFromComments, extractWearingToday, mergeTexts, BRANDS,
  extractDupePosts, getMostDupedBrands, getTopDupeBrands, extractFragranceMentions,
} from './services/analysis'
import Header from './components/Header'
import StatsBar from './components/StatsBar'
import ThemeChart from './components/ThemeChart'
import BrandMentions from './components/BrandMentions'
import BigramChart from './components/BigramChart'
import DescriptorChart from './components/DescriptorChart'
import VolumeChart from './components/VolumeChart'
import SentimentGauge from './components/SentimentGauge'
import TopComments from './components/TopComments'
import PostFeed from './components/PostFeed'
import TikTokSection from './components/TikTokSection'
import DupeSection from './components/DupeSection'
import FragranceMentions from './components/FragranceMentions'
import BrandDashboard from './components/BrandDashboard'
import { fetchTikTokData } from './services/tiktok'

export default function App() {
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('reddit')
  const [sort, setSort] = useState('hot')
  const [selectedBrand, setSelectedBrand] = useState(null)

  const [tiktokVideos, setTiktokVideos] = useState(null)
  const [tiktokLoading, setTiktokLoading] = useState(false)
  const [tiktokError, setTiktokError] = useState(null)
  const [tiktokCachedAt, setTiktokCachedAt] = useState(null)
  const [tiktokPending, setTiktokPending] = useState(false)
  const [tiktokKey, setTiktokKey] = useState(0)

  const load = useCallback(async (s = sort, signal) => {
    setLoading(true)
    setError(null)
    setComments([])
    try {
      const data = await fetchAllPosts(s, signal)
      if (signal?.aborted) return
      setPosts(data)

      // fetch SOTD comments in the background
      setCommentsLoading(true)
      fetchSOTDComments(data, signal)
        .then(c => { if (!signal?.aborted) setComments(c) })
        .catch(() => {})
        .finally(() => { if (!signal?.aborted) setCommentsLoading(false) })
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [sort])

  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(() => load(sort, ctrl.signal), 200)
    return () => { clearTimeout(t); ctrl.abort() }
  }, []) // eslint-disable-line

  useEffect(() => {
    const ctrl = new AbortController()
    setTiktokVideos(null)
    setTiktokError(null)
    setTiktokLoading(true)

    fetchTikTokData(ctrl.signal)
      .then(result => {
        if (ctrl.signal.aborted) return
        setTiktokVideos(result.videos)
        setTiktokCachedAt(result.cachedAt)
        setTiktokPending(result.pending)
      })
      .catch(e => { if (!ctrl.signal.aborted && e.name !== 'AbortError') setTiktokError(e.message) })
      .finally(() => { if (!ctrl.signal.aborted) setTiktokLoading(false) })

    return () => ctrl.abort()
  }, [tiktokKey]) // eslint-disable-line

  function retryTikTok() { setTiktokKey(k => k + 1) }

  function handleSort(s) {
    setSort(s)
    setSelectedBrand(null)
    load(s)
  }

  function handleBrandClick(brand) {
    setSelectedBrand(prev => prev === brand ? null : brand)
  }

  function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportBrands() {
    downloadCSV(
      [['Brand', 'Mentions'], ...brands.map(b => [b.brand, b.count])],
      'fragrance-brands.csv'
    )
  }

  function handleExportPosts() {
    downloadCSV(
      [
        ['Title', 'Subreddit', 'Author', 'Upvotes', 'Comments', 'Date', 'URL'],
        ...posts.map(p => [
          p.title, p.subreddit, p.author, p.score ?? '', p.num_comments ?? '',
          new Date(p.created_utc * 1000).toISOString().split('T')[0],
          `https://reddit.com${p.permalink}`,
        ]),
      ],
      'fragrance-posts.csv'
    )
  }

  // merge post + comment text for richer analysis
  const allItems = mergeTexts(posts, comments)
  const keywords    = extractKeywords(allItems, 20)
  const bigrams     = extractBigrams(allItems, 15)
  const descriptors = extractDescriptors(allItems)
  const sentiment   = extractSentiment(allItems)
  const volume      = extractVolumeByDay(posts)

  // brand mentions: weight posts + comments
  const postBrands    = extractBrandMentions(posts)
  const commentBrands = extractBrandMentionsFromComments(comments)
  const brandMap = {}
  for (const { brand, count } of postBrands) brandMap[brand] = (brandMap[brand] || 0) + count
  for (const { brand, count } of commentBrands) brandMap[brand] = (brandMap[brand] || 0) + count * 0.5
  const brands = Object.entries(brandMap)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([brand, count]) => ({ brand, count: Math.round(count) }))

  const wearingToday = extractWearingToday(comments)
  const stats = getStats(posts)

  const dupePosts         = extractDupePosts(posts)
  const mostDupedBrands   = getMostDupedBrands(dupePosts)
  const topDupeBrands     = getTopDupeBrands(dupePosts)
  const fragranceMentions = extractFragranceMentions(allItems, 20)

  const filteredPosts = selectedBrand
    ? (() => {
        const brandDef = BRANDS.find(b => b.name === selectedBrand)
        if (!brandDef) return posts
        return posts.filter(p => {
          const text = `${p.title} ${p.selftext || ''}`.toLowerCase()
          return brandDef.terms.some(t => text.includes(t))
        })
      })()
    : posts

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        sort={sort}
        loading={loading}
        onSort={handleSort}
        onRefresh={() => load()}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tiktokLoading={tiktokLoading}
        onRetryTikTok={retryTikTok}
      />

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {activeTab === 'reddit' && (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error} — Reddit may be rate limiting. Try refreshing in a moment.
              </div>
            )}

            {loading && !posts.length ? (
              <div className="flex flex-col items-center justify-center py-24 gap-2">
                <p className="text-gray-400 text-sm">Loading posts from Reddit…</p>
                <p className="text-gray-300 text-xs">Fetching hot · top · new across 3 subreddits</p>
              </div>
            ) : (
              <>
                <StatsBar
                  stats={{ ...stats, commentCount: comments.length }}
                  topKeyword={keywords[0]?.word}
                  topBrand={brands[0]?.brand}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BigramChart bigrams={bigrams} />
                  <BrandMentions
                    brands={brands}
                    selectedBrand={selectedBrand}
                    onBrandClick={handleBrandClick}
                    onExport={handleExportBrands}
                  />
                </div>
                <FragranceMentions fragrances={fragranceMentions} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ThemeChart keywords={keywords} />
                  <DescriptorChart descriptors={descriptors} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <VolumeChart data={volume} />
                  <SentimentGauge sentiment={sentiment} />
                </div>
                <TopComments
                  comments={wearingToday}
                  brands={brands.slice(0, 20)}
                  loading={commentsLoading && !comments.length}
                />
                <DupeSection
                  dupePosts={dupePosts}
                  mostDupedBrands={mostDupedBrands}
                  topDupeBrands={topDupeBrands}
                  totalPosts={posts.length}
                />
                <PostFeed
                  posts={filteredPosts}
                  totalPosts={posts.length}
                  selectedBrand={selectedBrand}
                  onClearBrand={() => setSelectedBrand(null)}
                  onExport={handleExportPosts}
                />
              </>
            )}
          </>
        )}

        {activeTab === 'tiktok' && (
          <TikTokSection
            videos={tiktokVideos}
            loading={tiktokLoading}
            error={tiktokError}
            cachedAt={tiktokCachedAt}
            pending={tiktokPending}
          />
        )}

        {activeTab === 'brand' && <BrandDashboard />}

      </main>
      <footer className="max-w-7xl mx-auto px-6 py-6 mt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span>© {new Date().getFullYear()} <span className="font-semibold text-gray-600">Slate Brands</span> — Internal Use Only</span>
        <span>Fragrance Trends Dashboard</span>
      </footer>
    </div>
  )
}
