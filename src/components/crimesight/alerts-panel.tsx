'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, X, AlertTriangle, ShieldAlert, Clock, FileWarning,
  ChevronRight, MapPin, FileText
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getRecentCases } from '@/lib/case-generator'

interface Alert {
  id: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  district?: string
  caseNo?: string
  timestamp: string
  metric?: string
  actionLabel?: string
  actionValue?: string
}

interface AlertsPanelProps {
  open: boolean
  onClose: () => void
  onNavigate?: (tab: string) => void
  onOpenCase?: (caseNo: string) => void
  alertCount: number
}

const sevConfig: Record<string, { icon: React.ElementType; color: string; bg: string; badge: string; label: string }> = {
  critical: { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', badge: 'bg-red-500/15 text-red-400 border-red-500/25', label: 'CRITICAL' },
  high: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25', label: 'HIGH' },
  medium: { icon: Clock, color: 'text-sky-400', bg: 'bg-sky-500/10', badge: 'bg-sky-500/15 text-sky-400 border-sky-500/25', label: 'MEDIUM' },
  low: { icon: FileWarning, color: 'text-slate-400', bg: 'bg-slate-500/10', badge: 'bg-slate-500/15 text-slate-400 border-slate-500/25', label: 'LOW' },
}

export default function AlertsPanel({ open, onClose, onNavigate, alertCount }: AlertsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all')
  const panelRef = useRef<HTMLDivElement>(null)

  const alerts = useMemo<Alert[]>(() => {
    const prioritySev: Record<string, Alert['severity']> = {
      Critical: 'critical',
      High: 'high',
    }
    return getRecentCases(30)
      .filter(c => c.priority === 'Critical' || c.priority === 'High')
      .slice(0, 15)
      .map(c => ({
        id: c.rowid,
        type: c.crimeType,
        severity: prioritySev[c.priority] || 'high',
        title: `${c.priority}: ${c.crimeType}`,
        description: `${c.status} case in ${c.district} — ${c.complaintMode} complaint`,
        district: c.district,
        caseNo: c.fir,
        timestamp: c.occurrenceDate,
        metric: c.riskScore >= 70 ? `Risk ${c.riskScore}` : undefined,
      }))
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter)
  const counts = { critical: alerts.filter(a => a.severity === 'critical').length, high: alerts.filter(a => a.severity === 'high').length, medium: alerts.filter(a => a.severity === 'medium').length }

  const handleAction = (alert: Alert) => {
    if (alert.actionLabel === 'View District' && onNavigate) { onNavigate('map'); onClose() }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="fixed top-14 right-4 lg:right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] bg-[#0c1120] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Bell className="size-4 text-red-400" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-white">Intelligence Alerts</h3>
                <p className="text-[11px] text-slate-500">{alertCount} active investigations monitored</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onClose} className="size-7 rounded-md hover:bg-white/[0.05] flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.04] bg-white/[0.01]">
            {([
              { key: 'all' as const, label: 'All' },
              { key: 'critical' as const, label: 'Critical' },
              { key: 'high' as const, label: 'High' },
              { key: 'medium' as const, label: 'Medium' },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                  filter === f.key ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                )}
              >
                {f.label}
                <span className={cn('text-[9px] font-bold px-1 rounded', filter === f.key ? 'bg-white/10 text-white/70' : 'text-slate-600')}>
                  {f.key === 'all' ? alerts.length : counts[f.key as keyof typeof counts]}
                </span>
              </button>
            ))}
          </div>

          {/* Alert List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <ShieldAlert className="size-5 text-emerald-400/30" />
                <p className="text-[13px] text-slate-400">No alerts</p>
                <p className="text-[11px] text-slate-600">All clear for now</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filtered.map((alert, idx) => {
                  const sev = sevConfig[alert.severity] || sevConfig.low
                  const SevIcon = sev.icon
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.12 }}
                      className="px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      onClick={() => handleAction(alert)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', sev.bg)}>
                          <SevIcon className={cn('size-4', sev.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="outline" className={cn('h-4 px-1.5 text-[9px] font-bold tracking-wider border', sev.badge)}>{sev.label}</Badge>
                            {alert.metric && <span className={cn('text-[10px] font-semibold', sev.color)}>{alert.metric}</span>}
                          </div>
                          <p className="text-[12px] font-medium text-white leading-snug mb-1 line-clamp-1">{alert.title}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{alert.description}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {alert.district && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-600"><MapPin className="size-2.5" />{alert.district}</span>
                            )}
                            {alert.caseNo && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-600"><FileText className="size-2.5" /><span className="font-mono">{alert.caseNo.slice(-8)}</span></span>
                            )}
                          </div>
                        </div>
                        {alert.actionLabel && (
                          <div className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="size-3.5 text-slate-600" /></div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-slate-600"><span className="size-1.5 rounded-full bg-red-500" />{counts.critical} Critical</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-600"><span className="size-1.5 rounded-full bg-amber-500" />{counts.high} High</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-600"><span className="size-1.5 rounded-full bg-sky-400" />{counts.medium} Medium</span>
            </div>
            <span className="text-[10px] text-slate-600">Last scanned: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}