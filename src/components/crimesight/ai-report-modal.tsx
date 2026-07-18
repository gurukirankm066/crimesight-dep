'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Loader2, FileText, Download, Shield, Users, Car, Fingerprint, AlertTriangle, Link, CheckCircle2, Clock, MapPin, User, Phone, Home, Briefcase, Calendar, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getKSPCase, getRepeatOffendersForCase, getLinkedCases,
  getCaseIntelligenceBrief,
  type KSPCase, type KSPSuspect, type KSPVehicle, type KSPEvidence, type KSPArrest,
} from '@/lib/ksp-data'

const STAGES = [
  'Retrieving KSP case data...',
  'Analyzing suspect profiles...',
  'Cross-referencing SCRB intelligence...',
  'Compiling SCRB intelligence report...',
]

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

function generateReport(kase: KSPCase) {
  const repeatOffenders = getRepeatOffendersForCase(kase.rowid)
  const linkedCases = getLinkedCases(kase.rowid)
  const brief = getCaseIntelligenceBrief(kase.rowid)

  // Evidence summary
  const evidenceByType: Record<string, number> = {}
  kase.evidence.forEach(e => {
    const type = e.name || 'Unclassified'
    evidenceByType[type] = (evidenceByType[type] || 0) + 1
  })
  const forensicPending = kase.evidence.filter(e => e.forensicStatus === 'pending').length
  const forensicComplete = kase.evidence.filter(e => e.forensicStatus === 'completed').length
  const forensicNone = kase.evidence.filter(e => !e.forensicStatus || e.forensicStatus === 'none').length

  // Build recommendations
  const recs: string[] = []
  if (repeatOffenders.length > 0) {
    recs.push(`Issue lookout circular for repeat offender(s): ${repeatOffenders.map(r => r.name).join(', ')}. Coordinate with concerned district SP offices for priority surveillance.`)
  }
  if (kase.suspects.some(s => s.arrestStatus === 'absconding' || s.arrestStatus === 'not_arrested')) {
    recs.push('Initiate proceedings for issuance of non-bailable warrants against absconding accused. Verify hideouts through surveillance and informer network.')
  }
  if (forensicPending > 0) {
    recs.push(`Follow up on ${forensicPending} pending forensic analysis report(s) with FSL within 7 working days. Expedite DNA/fingerprint/ballistic results for court evidence readiness.`)
  }
  if (kase.vehicles.some(v => !v.seized)) {
    recs.push('Initiate seizure proceedings for vehicles linked to the offence under applicable sections. Coordinate with RTO for ownership verification.')
  }
  if (linkedCases.length >= 3) {
    recs.push(`Cluster pattern detected: ${linkedCases.length} cases with similar ${kase.crimeType} pattern in ${kase.district} district. Recommend inter-station coordination through SCRB intelligence cell.`)
  }
  if (brief.spatialClusterRisk === 'high') {
    recs.push('HIGH SPATIAL CLUSTER RISK: Multiple offences detected in the same geographic zone. Deploy additional patrol units and establish temporary check-posts in the affected area.')
  }
  if (kase.isSensitive) {
    recs.push('SENSITIVE CASE: Ensure all case diaries are updated daily. Report any development to the SCRB Intelligence Cell and the concerned SP within 24 hours.')
  }
  if (kase.priority === 'Critical') {
    recs.push('CRITICAL PRIORITY: Escalate to District SP for immediate attention. Assign dedicated investigation team and conduct daily progress review.')
  }
  recs.push('Ensure all case property is accounted for in the station malkhana register. File progress report under Sec 173(2) CrPC within statutory timelines.')

  return {
    kase,
    repeatOffenders,
    linkedCases,
    brief,
    evidenceByType,
    forensicPending,
    forensicComplete,
    forensicNone,
    recommendations: recs,
  }
}

/* ─── Sub-components ─── */

function SectionHeader({ icon: Icon, title, className = '' }: { icon: React.ElementType; title: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 mb-3 ${className}`}>
      <Icon className="size-3.5 text-emerald-400" />
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">{title}</h3>
      <div className="flex-1 h-px bg-emerald-500/20" />
    </div>
  )
}

function FieldRow({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex gap-2 text-[11px] leading-relaxed">
      <span className="text-slate-500 min-w-[120px] shrink-0">{label}</span>
      <span className={danger ? 'text-red-400 font-medium' : 'text-slate-200'}>{value || 'N/A'}</span>
    </div>
  )
}

function ReportBadge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'red' | 'amber' | 'emerald' }) {
  const cls = {
    default: 'border-slate-500/30 text-slate-300 bg-slate-500/10',
    red: 'border-red-500/30 text-red-400 bg-red-500/10',
    amber: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  }[variant]
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium rounded border ${cls}`}>
      {children}
    </span>
  )
}

/* ─── Main Component ─── */

export default function AiReportModal({ caseRowid, onClose }: {
  caseRowid: string
  onClose: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [stageIndex, setStageIndex] = useState(0)
  const [report, setReport] = useState<ReturnType<typeof generateReport> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const buildReport = () => {
    setLoading(true)
    setProgress(0)
    setStageIndex(0)
    setError(null)
    setReport(null)

    intervalRef.current = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 14, 90))
    }, 200)

    stageTimerRef.current = setInterval(() => {
      setStageIndex(i => Math.min(i + 1, STAGES.length - 1))
    }, 1800)

    // Simulate async processing for UX
    setTimeout(() => {
      const kase = getKSPCase(caseRowid)
      if (!kase) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (stageTimerRef.current) clearInterval(stageTimerRef.current)
        setError(`Case ${caseRowid} not found in KSP database.`)
        setLoading(false)
        return
      }

      const data = generateReport(kase)

      if (intervalRef.current) clearInterval(intervalRef.current)
      if (stageTimerRef.current) clearInterval(stageTimerRef.current)
      setProgress(100)
      setStageIndex(STAGES.length - 1)
      setTimeout(() => {
        setReport(data)
        setLoading(false)
      }, 300)
    }, 2800)
  }

  useEffect(() => {
    buildReport()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (stageTimerRef.current) clearInterval(stageTimerRef.current)
    }
  }, [caseRowid])

  const handleDownloadPdf = () => {
    // Placeholder: show toast-like feedback
    const el = document.createElement('div')
    el.className = 'fixed bottom-6 right-6 z-[100] px-4 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium shadow-lg backdrop-blur-sm'
    el.textContent = 'PDF download will be available in production deployment.'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 3000)
  }

  const kase = useMemo(() => getKSPCase(caseRowid), [caseRowid])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0f1a] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="size-4.5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">SCRB INTELLIGENCE REPORT</h2>
              {kase && (
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-mono">
                  {kase.fir}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report && !loading && (
              <Button
                onClick={handleDownloadPdf}
                variant="outline"
                size="sm"
                className="h-8 px-3 text-[10px] border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <Download className="size-3 mr-1.5" /> DOWNLOAD PDF
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-slate-500 hover:text-white"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(92vh-130px)] custom-scrollbar">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke="#10b981"
                    strokeWidth="6" strokeDasharray={`${progress * 3.27} 327`}
                    strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.3s' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white font-mono">{Math.round(progress)}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">GENERATING REPORT...</p>
                <div className="flex flex-col items-center gap-1 mt-3 text-[10px] text-slate-600 font-mono">
                  {STAGES.map((stage, i) => (
                    <span key={i} className={i <= stageIndex ? 'text-emerald-400' : ''}>
                      {i < stageIndex ? '✓' : i === stageIndex ? '▶' : '○'} {stage}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertTriangle className="size-8 text-amber-400" />
              <p className="text-sm text-amber-400">Report generation failed</p>
              <p className="text-xs text-slate-600">{error}</p>
              <Button onClick={buildReport} variant="outline" size="sm" className="mt-2 text-xs">
                <Loader2 className="size-3 mr-1" /> Retry
              </Button>
            </div>
          )}

          {/* Report content */}
          <AnimatePresence>
            {report && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-0"
              >
                {/* ── DOCUMENT HEADER ── */}
                <div className="text-center mb-5 pb-4 border-b border-emerald-500/20">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Shield className="size-5 text-emerald-400" />
                    <h1 className="text-sm font-bold text-emerald-400 tracking-widest uppercase">
                      Karnataka State Police — SCRB Intelligence Report
                    </h1>
                    <Shield className="size-5 text-emerald-400" />
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono tracking-wider">
                    State Crime Records Bureau · Bengaluru · CLASSIFIED — FOR OFFICIAL USE ONLY
                  </p>
                </div>

                {/* ── CASE SUMMARY ── */}
                <div className="mb-4 pb-4 border-b border-white/[0.04]">
                  <SectionHeader icon={FileText} title="Case Summary" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    <FieldRow label="FIR Number" value={report.kase.fir} />
                    <FieldRow label="Crime Type" value={`${report.kase.crimeType} (${report.kase.crimeCategory})`} />
                    <FieldRow label="District" value={report.kase.district} />
                    <FieldRow
                      label="Priority"
                      value={report.kase.priority.toUpperCase()}
                      danger={report.kase.priority === 'Critical'}
                    />
                    <FieldRow label="Status" value={report.kase.status} />
                    <FieldRow label="Place of Occurrence" value={report.kase.place} />
                    <FieldRow label="Occurrence Date" value={formatDate(report.kase.occurrenceDate)} />
                    <FieldRow label="Complaint Date" value={formatDate(report.kase.complaintDate)} />
                    <FieldRow label="Risk Score" value={`${report.kase.riskScore}/100`} danger={report.kase.riskScore >= 70} />
                    <FieldRow label="Sensitive" value={report.kase.isSensitive ? 'YES' : 'No'} danger={report.kase.isSensitive} />
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <ReportBadge variant={report.kase.priority === 'Critical' ? 'red' : report.kase.priority === 'High' ? 'amber' : 'default'}>
                      <Flag className="size-2.5" /> {report.kase.priority} Priority
                    </ReportBadge>
                    {report.kase.isSensitive && (
                      <ReportBadge variant="red"><AlertTriangle className="size-2.5" /> Sensitive Case</ReportBadge>
                    )}
                    {report.brief.repeatOffenderCount > 0 && (
                      <ReportBadge variant="amber"><Users className="size-2.5" /> {report.brief.repeatOffenderCount} Repeat Offender(s)</ReportBadge>
                    )}
                    {report.brief.forensicMatchCount > 0 && (
                      <ReportBadge variant="emerald"><Fingerprint className="size-2.5" /> {report.brief.forensicMatchCount} Forensic Match(es)</ReportBadge>
                    )}
                  </div>
                </div>

                {/* ── SUSPECT PROFILES ── */}
                <div className="mb-4 pb-4 border-b border-white/[0.04]">
                  <SectionHeader icon={Users} title={`Suspect Profiles (${report.kase.suspects.length})`} />
                  {report.kase.suspects.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No suspects identified yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {report.kase.suspects.map((s: KSPSuspect) => (
                        <div key={s.rowid} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="size-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-white">{s.name}</span>
                            {s.isRepeatOffender && (
                              <ReportBadge variant="red"><AlertTriangle className="size-2" /> REPEAT OFFENDER</ReportBadge>
                            )}
                            {s.arrestStatus === 'arrested' && (
                              <ReportBadge variant="emerald"><CheckCircle2 className="size-2" /> ARRESTED</ReportBadge>
                            )}
                            {s.arrestStatus === 'absconding' && (
                              <ReportBadge variant="red"><X className="size-2" /> ABSCONDING</ReportBadge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                            <FieldRow label="Age" value={s.age ? `${s.age} years` : 'N/A'} />
                            <FieldRow label="Gender" value={s.gender} />
                            <FieldRow label="Occupation" value={s.occupation} />
                            <FieldRow label="Arrest Status" value={s.arrestStatus?.replace('_', ' ').toUpperCase() || 'Unknown'} danger={s.arrestStatus === 'absconding'} />
                            <div className="flex gap-2 text-[11px] leading-relaxed sm:col-span-2">
                              <span className="text-slate-500 min-w-[120px] shrink-0">Address</span>
                              <span className="text-slate-200">{s.address || 'N/A'}</span>
                            </div>
                            {s.phone && (
                              <div className="flex gap-2 text-[11px] leading-relaxed">
                                <Phone className="size-3 text-slate-500 mt-0.5 shrink-0" />
                                <span className="text-slate-300 font-mono">{s.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── VEHICLE INFORMATION ── */}
                <div className="mb-4 pb-4 border-b border-white/[0.04]">
                  <SectionHeader icon={Car} title={`Vehicle Information (${report.kase.vehicles.length})`} />
                  {report.kase.vehicles.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No vehicles linked to this case.</p>
                  ) : (
                    <div className="space-y-2">
                      {report.kase.vehicles.map((v: KSPVehicle) => (
                        <div key={v.rowid} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <Car className="size-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-white font-mono">{v.number}</span>
                            {v.seized && <ReportBadge variant="red">SEIZED</ReportBadge>}
                          </div>
                          <div className="text-[11px] text-slate-400 sm:ml-auto">
                            {v.color} {v.make} {v.model} · Owner: {v.owner}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── EVIDENCE SUMMARY ── */}
                <div className="mb-4 pb-4 border-b border-white/[0.04]">
                  <SectionHeader icon={Fingerprint} title={`Evidence Summary (${report.kase.evidence.length} items)`} />
                  {report.kase.evidence.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No evidence items recorded.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(report.evidenceByType).map(([type, count]) => (
                          <ReportBadge key={type} variant="default">{type}: {count}</ReportBadge>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-center">
                          <p className="text-lg font-bold text-emerald-400">{report.forensicComplete}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Complete</p>
                        </div>
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-center">
                          <p className="text-lg font-bold text-amber-400">{report.forensicPending}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Pending</p>
                        </div>
                        <div className="rounded-lg border border-slate-500/20 bg-slate-500/5 p-2 text-center">
                          <p className="text-lg font-bold text-slate-400">{report.forensicNone}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Not Sent</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* ── CROSS-REFERENCE INTELLIGENCE ── */}
                <div className="mb-4 pb-4 border-b border-white/[0.04]">
                  <SectionHeader icon={Link} title="Cross-Reference Intelligence" />

                  {/* Repeat offenders */}
                  {report.repeatOffenders.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-amber-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="size-3" /> Repeat Offender Links
                      </p>
                      <div className="space-y-1.5">
                        {report.repeatOffenders.map((ro, i) => (
                          <div key={i} className="rounded border border-amber-500/15 bg-amber-500/5 px-3 py-2 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-bold text-amber-400">{ro.name}</span>
                              <span className="text-[10px] text-slate-500 ml-2 font-mono">{ro.phone}</span>
                            </div>
                            <ReportBadge variant="amber">{ro.totalCases} cases</ReportBadge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked cases */}
                  {report.linkedCases.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                        <Link className="size-3" /> Linked / Similar Cases ({report.linkedCases.length})
                      </p>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1.5">
                        {report.linkedCases.slice(0, 10).map((lc) => (
                          <div key={lc.rowid} className="rounded border border-white/[0.06] bg-white/[0.02] px-3 py-2 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-bold text-white font-mono">{lc.fir}</span>
                              <span className="text-[10px] text-slate-500 ml-2">{lc.crimeType} · {lc.district}</span>
                            </div>
                            <ReportBadge>{lc.status}</ReportBadge>
                          </div>
                        ))}
                        {report.linkedCases.length > 10 && (
                          <p className="text-[10px] text-slate-600 text-center">+{report.linkedCases.length - 10} more linked cases</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Intelligence brief */}
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                      <Shield className="size-3" /> Intelligence Brief
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{report.brief.topInsight}</p>
                    <div className="flex gap-3 mt-2 text-[9px] text-slate-500 font-mono">
                      <span>Repeat: {report.brief.repeatOffenderCount}</span>
                      <span>Linked: {report.brief.linkedCaseCount}</span>
                      <span>Forensic: {report.brief.forensicMatchCount}</span>
                      <span>Cluster Risk: <span className={report.brief.spatialClusterRisk === 'high' ? 'text-red-400' : report.brief.spatialClusterRisk === 'medium' ? 'text-amber-400' : 'text-emerald-400'}>{report.brief.spatialClusterRisk.toUpperCase()}</span></span>
                    </div>
                  </div>
                </div>

                {/* ── ARREST INFORMATION ── */}
                <div className="mb-4 pb-4 border-b border-white/[0.04]">
                  <SectionHeader icon={CheckCircle2} title={`Arrest Information (${report.kase.arrests.length})`} />
                  {report.kase.arrests.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No arrests recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {report.kase.arrests.map((a: KSPArrest) => {
                        const suspect = report.kase.suspects.find(s => s.rowid === a.accusedRowid)
                        return (
                          <div key={a.rowid} className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="size-3 text-emerald-400" />
                              <span className="text-[11px] font-bold text-emerald-400">{suspect?.name || 'Unknown Accused'}</span>
                              <ReportBadge variant="emerald">{a.type}</ReportBadge>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1"><Clock className="size-2.5" /> {formatDateTime(a.datetime)}</span>
                              <span className="flex items-center gap-1"><MapPin className="size-2.5" /> {a.location}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── RECOMMENDATIONS ── */}
                <div className="mb-4">
                  <SectionHeader icon={AlertTriangle} title="Recommendations" />
                  <div className="space-y-2">
                    {report.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-2 text-[11px] leading-relaxed">
                        <span className="text-emerald-500 font-bold shrink-0">{i + 1}.</span>
                        <span className="text-slate-300">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── FOOTER ── */}
                <div className="border-t border-white/[0.06] pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-[9px] text-slate-600 font-mono">
                    <span>POWERED BY SCRB-INTELLIGENCE</span>
                    <span className="text-slate-700">·</span>
                    <span>Generated {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <Button
                    onClick={buildReport}
                    variant="outline"
                    size="sm"
                    className="text-[10px] text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-300 h-7"
                  >
                    <Loader2 className="size-3 mr-1.5" /> RE-GENERATE
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}