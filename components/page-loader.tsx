'use client'

import React from 'react'

interface PageLoaderProps {
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function PageLoader({
  fullScreen = false,
  size = 'md',
}: PageLoaderProps) {
  return (
    <div
      className={`page-loader-container ${fullScreen ? 'page-loader-fullscreen' : 'page-loader-standard'}`}
      role="status"
      aria-label="Loading"
    >
      <div className={`page-loader-wheel page-loader-wheel-${size}`}></div>
    </div>
  )
}
