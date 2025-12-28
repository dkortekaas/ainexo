import Link from 'next/link'

export function DraftModeBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-black px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">🔍 Preview Mode</span>
          <span className="text-sm">You are viewing unpublished content</span>
        </div>
        <Link
          href="/api/disable-draft"
          className="text-sm bg-black text-yellow-400 px-3 py-1 rounded hover:bg-gray-800"
        >
          Exit Preview
        </Link>
      </div>
    </div>
  )
}
