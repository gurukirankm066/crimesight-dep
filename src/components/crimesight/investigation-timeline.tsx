'use client'

import { motion } from 'framer-motion'
import { FileText, UserCheck, Scale, AlertTriangle, Gavel, type LucideIcon } from 'lucide-react'

interface TimelineEvent {
  date: string
  label: string
  description: string
  type: 'info' | 'arrest' | 'legal' | 'alert' | 'court'
  icon?: string
}

interface InvestigationTimelineProps {
  events: TimelineEvent[]
}

const iconMap: Record<TimelineEvent['type'], LucideIcon> = {
  info: FileText,
  arrest: UserCheck,
  legal: Scale,
  alert: AlertTriangle,
  court: Gavel,
}

const dotColors: Record<TimelineEvent['type'], string> = {
  info: 'bg-slate-400',
  arrest: 'bg-emerald-400',
  legal: 'bg-amber-400',
  alert: 'bg-red-400',
  court: 'bg-blue-400',
}

const borderColors: Record<TimelineEvent['type'], string> = {
  info: 'border-l-slate-500/50',
  arrest: 'border-l-emerald-500/50',
  legal: 'border-l-amber-500/50',
  alert: 'border-l-red-500/50',
  court: 'border-l-blue-500/50',
}

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.substring(0, 10)
}

export type { TimelineEvent, InvestigationTimelineProps }

export default function InvestigationTimeline({ events }: InvestigationTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-xs text-slate-500">No timeline events available</span>
      </div>
    )
  }

  const sorted = [...events].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  return (
    <div className="relative pl-5">
      {/* Vertical line */}
      <div className="absolute left-[5px] top-0 bottom-0 w-px bg-white/[0.06]" />

      <div className="space-y-3">
        {sorted.map((event, index) => {
          const Icon = iconMap[event.type]
          const dotColor = dotColors[event.type]
          const borderColor = borderColors[event.type]
          const displayDate = formatDisplayDate(event.date)

          return (
            <motion.div
              key={`${event.label}-${index}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              className="relative"
            >
              {/* Dot on timeline */}
              <div className="absolute -left-5 top-1.5 z-10">
                <div
                  className={`w-[11px] h-[11px] rounded-full ${dotColor} ring-2 ring-[#0d1321] flex items-center justify-center`}
                >
                  <Icon className="w-[5px] h-[5px] text-white" strokeWidth={2.5} />
                </div>
              </div>

              {/* Event card */}
              <div
                className={`border-l-2 ${borderColor} pl-3 py-1.5 bg-white/[0.015] rounded-r-md`}
              >
                {displayDate && (
                  <span className="font-mono text-[10px] text-slate-500">{displayDate}</span>
                )}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-semibold text-white">{event.label}</span>
                </div>
                {event.description && (
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {event.description}
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}