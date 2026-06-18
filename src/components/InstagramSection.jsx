import { Instagram, Clock } from 'lucide-react'

export default function InstagramSection() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center shadow-lg">
        <Instagram size={32} className="text-white" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Instagram Analytics</h2>
        <p className="text-sm text-gray-400 mt-1">Tracking hashtags, mentions, and influencer performance</p>
      </div>
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-700 text-xs px-4 py-2 rounded-full">
        <Clock size={12} />
        Work in progress — coming soon
      </div>
    </div>
  )
}
