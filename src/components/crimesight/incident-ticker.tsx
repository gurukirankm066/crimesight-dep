'use client'

import { useState, useEffect } from 'react'
import { Radio, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Incident {
  id: string
  fir: string
  district: string
  crimeType: string
  priority: string
  status: string
  date: string
}

const priorityBadge: Record<string, string> = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
}

export default function IncidentTicker() {
  const [incidents, setIncidents] = useState<Incident[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/ticker')
      .then(r => r.json())
      .then(d => { if (!cancelled) setIncidents(d.incidents ?? []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (incidents.length === 0) return null

  // Duplicate for seamless infinite scroll
  const doubled = [...incidents, ...incidents]

  return (
    <div className="shrink-0 h-8 bg-white/[0.02] border-b border-white/[0.04] flex items-center overflow-hidden">
      <div className="shrink-0 flex items-center gap-1.5 px-3 border-r border-white/[0.04] h-full">
        <Radio className="size-3 text-emerald-400" />
        <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">Live Feed</span>
        <span className="relative flex size-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
        </span>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="flex items-center gap-0 animate-[ticker_120s_linear_infinite] hover:[animation-play-state:paused] w-max">
          {doubled.map((inc, i) => (
            <div key={`${inc.id}-${i}`} className="inline-flex items-center gap-2 px-4 whitespace-nowrap">
              {inc.priority in priorityBadge ? (
                <Badge variant="outline" className={`h-4 px-1 text-[8px] font-bold ${priorityBadge[inc.priority]}`}>{inc.priority}</Badge>
              ) : (
                <Badge variant="outline" className="h-4 px-1 text-[8px] font-bold border-white/[0.1] text-slate-500">FIR</Badge>
              )}
              <span className="text-[10px] font-mono text-slate-400">{inc.fir}</span>
              <span className="text-[10px] text-slate-500">{inc.district}</span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] text-slate-400">{inc.crimeType}</span>
              <span className="text-[9px] text-slate-600 tabular-nums">{inc.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}