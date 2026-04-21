'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// ── Typed dataLayer helper ────────────────────────────────────────────────────
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export function gtmPush(event: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(event)
}

// ── Inner component (uses useSearchParams — must be inside Suspense) ──────────
function GTMPageTracker() {
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const qs   = searchParams.toString()
    const page = pathname + (qs ? `?${qs}` : '')
    gtmPush({ event: 'page_view', page_path: page, page_title: document.title })
  }, [pathname, searchParams])

  return null
}

// ── Public component — wrap tracker in Suspense as required by Next.js ────────
export default function GTMProvider() {
  return (
    <Suspense fallback={null}>
      <GTMPageTracker />
    </Suspense>
  )
}
