'use client'

import { useState, useEffect } from 'react'
import { Radio } from 'lucide-react'

export default function LastSynced() {
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const label = secondsAgo < 5 ? 'just now'
    : secondsAgo < 60 ? `${secondsAgo}s ago`
    : `${Math.floor(secondsAgo / 60)}m ${secondsAgo % 60}s ago`

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
      <Radio className="size-2.5 text-emerald-500 animate-pulse" />
      <span>Synced {label}</span>
    </div>
  )
}