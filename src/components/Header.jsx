import { RefreshCw } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'hot', label: 'Hot' },
  { value: 'top', label: 'Top' },
  { value: 'new', label: 'New' },
]

const TABS = [
  { value: 'reddit', label: 'Reddit' },
  { value: 'tiktok', label: 'TikTok' },
]

export default function Header({ sort, loading, onSort, onRefresh, activeTab, onTabChange, tiktokLoading, onRetryTikTok }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Fragrance Trends</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeTab === 'reddit' ? 'r/fragrance · r/cologne · r/perfume' : '#fragrancetok · #perfumetok'}
            </p>
          </div>

          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {TABS.map(t => (
              <button
                key={t.value}
                onClick={() => onTabChange(t.value)}
                className={`px-4 py-1.5 transition-colors ${activeTab === t.value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'reddit' && (
            <>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => onSort(o.value)}
                    className={`px-3 py-1.5 transition-colors ${sort === o.value ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </>
          )}

          {activeTab === 'tiktok' && (
            <button
              onClick={onRetryTikTok}
              disabled={tiktokLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <RefreshCw size={14} className={tiktokLoading ? 'animate-spin' : ''} />
              Retry
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
