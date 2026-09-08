'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function RouteLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Reset loading state when route finishes changing
    setLoading(false)
  }, [pathname, searchParams])

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return

      const href = target.getAttribute('href')
      const targetAttr = target.getAttribute('target')

      // Ignore external, hash links, mailto, tel, or links that open in a new tab
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        targetAttr === '_blank' ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }

      // Check if internal navigation
      try {
        const url = new URL(href, window.location.href)
        if (url.origin === window.location.origin) {
          const isSamePage = url.pathname === window.location.pathname && url.search === window.location.search
          if (!isSamePage) {
            setLoading(true)
          }
        }
      } catch {
        // Ignore invalid URLs
      }
    }

    document.addEventListener('click', handleAnchorClick)
    return () => {
      document.removeEventListener('click', handleAnchorClick)
    }
  }, [])

  if (!loading) return null

  return (
    <div className="route-progress-bar-container" aria-hidden="true">
      <div className="route-progress-bar-indeterminate"></div>
    </div>
  )
}
