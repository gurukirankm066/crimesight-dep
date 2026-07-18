'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Phone, User, Briefcase, Car, Users, Shield, AlertTriangle, FileText, Send, Radio } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KSP_CASES } from '@/lib/ksp-data'
import { DEMO_SUSPECTS, DEMO_CASES } from '@/lib/demo-data'
import { useCrimeSightStore } from '@/lib/store'
import type { KSPSuspect, KSPVehicle, KSPCase } from '@/lib/ksp-data'
import type { DemoSuspect } from '@/lib/demo-data'

// ── Props ──

interface SuspectDossierProps {
  open: boolean
  onClose: () => void
  suspectName: string
  sourceCaseFir?: string
}

// ── Helpers ──

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 5) return '—'
  return phone.slice(0, 4) + '-XXXXX' + phone.slice(-2)
}

const AVATAR_COLORS: Record<string, string> = {
  'Absconding': 'bg-red-500/20 text-red-400 ring-red-500/40',
  'Released on Bail': 'bg-amber-500/20 text-amber-400 ring-amber-500/40',
  'Arrested': 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/40',
  'In Custody': 'bg-blue-500/20 text-blue-400 ring-blue-500/40',
  'Surrendered': 'bg-slate-500/20 text-slate-400 ring-slate-500/40',
}

const ARREST_BADGE: Record<string, string> = {
  'Absconding': 'bg-red-500/15 text-red-400 border-red-500/30',
  'Released on Bail': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Arrested': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'In Custody': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Surrendered': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

const STATUS_BADGE: Record<string, string> = {
  'Open': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Under Investigation': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Closed': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Charge Sheet Filed': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
}

function getThreatLevel(score: number): { label: string; color: string; barColor: string } {
  if (score >= 76) return { label: 'Critical', color: 'text-red-400 bg-red-500/15 border-red-500/30', barColor: 'bg-red-500' }
  if (score >= 51) return { label: 'High', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', barColor: 'bg-amber-500' }
  if (score >= 26) return { label: 'Medium', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', barColor: 'bg-emerald-500' }
  return { label: 'Low', color: 'text-slate-400 bg-slate-500/15 border-slate-500/30', barColor: 'bg-slate-500' }
}

// ── Section Header ──

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2.5">
      {children}
    </p>
  )
}

// ── Component ──

export default function SuspectDossier({ open, onClose, suspectName, sourceCaseFir }: SuspectDossierProps) {
  const { navigateToFir } = useCrimeSightStore()

  // ── Cross-Data Resolution ──
  const dossier = useMemo(() => {
    if (!suspectName) return null
    const nameLower = suspectName.toLowerCase()

    // Search KSP cases for all matching suspects
    const kspMatches: { suspect: KSPSuspect; kase: KSPCase }[] = []
    for (const kase of KSP_CASES) {
      for (const s of kase.suspects) {
        if (s.name.toLowerCase() === nameLower || s.name.toLowerCase().includes(nameLower)) {
          kspMatches.push({ suspect: s, kase })
        }
      }
    }

    // Search DEMO_SUSPECTS for additional data
    const demoMatches: { suspect: DemoSuspect }[] = []
    for (const ds of DEMO_SUSPECTS) {
      if (ds.suspect_name.toLowerCase() === nameLower || ds.suspect_name.toLowerCase().includes(nameLower)) {
        demoMatches.push({ suspect: ds })
      }
    }

    if (kspMatches.length === 0 && demoMatches.length === 0) return null

    // Primary profile from KSP (best match) or fall back to demo
    const primaryKsp = kspMatches[0]?.suspect
    const primaryDemo = demoMatches[0]?.suspect

    const profile = {
      name: primaryKsp?.name ?? primaryDemo?.suspect_name ?? suspectName,
      gender: primaryKsp?.gender ?? primaryDemo?.gender ?? '—',
      age: primaryKsp?.age ?? primaryDemo?.age ?? '—',
      phone: primaryKsp?.phone ?? '',
      address: primaryKsp?.address ?? primaryDemo?.address ?? '—',
      occupation: primaryKsp?.occupation ?? primaryDemo?.occupation ?? '—',
      arrestStatus: primaryKsp?.arrestStatus ?? primaryDemo?.arrest_status ?? 'Unknown',
      isRepeatOffender: primaryKsp?.isRepeatOffender ?? primaryDemo?.is_repeat_offender ?? false,
    }

    // Linked cases (unique by FIR) — KSP cases have .district / .crimeType, demo cases need helper resolution
    const linkedCases: KSPCase[] = kspMatches.length > 0
      ? [...new Map(kspMatches.map(m => [m.kase.fir, m.kase])).values()]
      : []

    // All vehicles across all KSP cases
    const vehicleSet = new Map<string, KSPVehicle>()
    for (const m of kspMatches) {
      for (const v of m.kase.vehicles) {
        if (v.owner.toLowerCase() === nameLower || v.owner.toLowerCase().includes(nameLower)) {
          vehicleSet.set(v.number, v)
        }
      }
    }
    const vehicles = [...vehicleSet.values()]

    // Co-accused (other suspects in shared cases, excluding current)
    const coAccusedSet = new Map<string, { name: string; arrestStatus: string }>()
    for (const m of kspMatches) {
      for (const s of m.kase.suspects) {
        if (s.name.toLowerCase() !== nameLower) {
          coAccusedSet.set(s.name, { name: s.name, arrestStatus: s.arrestStatus })
        }
      }
    }
    const coAccused = [...coAccusedSet.values()].slice(0, 12)

    // District pattern
    const districtMap = new Map<string, number>()
    for (const kase of linkedCases) {
      districtMap.set(kase.district, (districtMap.get(kase.district) ?? 0) + 1)
    }
    const districtPattern = [...districtMap.entries()]
      .sort((a, b) => b[1] - a[1])

    // Risk score calculation
    const worstCrimeScore = Math.max(...linkedCases.map(c => {
      const p = c.priority
      return p === 'Critical' ? 30 : p === 'High' ? 20 : p === 'Medium' ? 10 : 3
    }), 0)
    const districtCount = districtPattern.length
    const repeatBonus = profile.isRepeatOffender ? 15 : 0
    const abscondBonus = profile.arrestStatus === 'Absconding' ? 20 : 0
    const bailBonus = profile.arrestStatus === 'Released on Bail' ? 8 : 0
    const rawRisk = Math.min(25 + worstCrimeScore + (districtCount - 1) * 5 + repeatBonus + abscondBonus + bailBonus, 100)
    const riskScore = Math.max(0, Math.min(100, Math.round(rawRisk)))

    // AI intelligence note
    let intelNote = ''
    if (profile.isRepeatOffender && districtCount > 2) {
      intelNote = `Multi-district repeat offender. Active across ${districtCount} districts with ${linkedCases.length} linked FIRs. Recommend inter-district coordination.`
    } else if (profile.arrestStatus === 'Absconding') {
      intelNote = `Subject currently absconding. Last known activity in ${districtPattern[0]?.[0] ?? 'unknown district'}. ${linkedCases.length} FIR(s) pending.`
    } else if (riskScore >= 76) {
      intelNote = `High-priority subject. Critical crime severity profile across ${linkedCases.length} case(s). Surveillance recommended.`
    } else if (linkedCases.length > 1) {
      intelNote = `Subject linked to ${linkedCases.length} FIRs. Cross-referencing indicates consistent ${linkedCases[0]?.crimeType?.toLowerCase() ?? 'criminal'} activity pattern.`
    } else {
      intelNote = `Single case reference on record. Standard monitoring protocol applies.`
    }

    return {
      profile,
      linkedCases,
      vehicles,
      coAccused,
      districtPattern,
      riskScore,
      intelNote,
    }
  }, [suspectName])

  if (!dossier) return null

  const { profile, linkedCases, vehicles, coAccused, districtPattern, riskScore, intelNote } = dossier
  const threat = getThreatLevel(riskScore)
  const avatarColor = AVATAR_COLORS[profile.arrestStatus] ?? AVATAR_COLORS['Surrendered']
  const arrestBadge = ARREST_BADGE[profile.arrestStatus] ?? ARREST_BADGE['Surrendered']

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 z-50 w-[420px] h-screen bg-[#0a0f1a]/98 backdrop-blur-xl border-l-2 border-emerald-500/30 flex flex-col shadow-2xl shadow-black/50"
          >
            {/* ── Scrollable Content ── */}
            <div className="flex-1 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">

              {/* 1. Header */}
              <div className="sticky top-0 z-10 bg-[#0a0f1a]/95 backdrop-blur-sm px-5 pt-4 pb-3 border-b border-white/[0.06]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-white leading-tight truncate">{profile.name}</h2>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="outline" className={`h-5 px-2 text-[9px] font-semibold border ${arrestBadge}`}>
                        {profile.arrestStatus}
                      </Badge>
                      {profile.isRepeatOffender && (
                        <Badge variant="outline" className="h-5 px-2 text-[9px] font-semibold border bg-amber-500/15 text-amber-400 border-amber-500/30">
                          <AlertTriangle className="size-2.5 mr-1" />
                          Repeat Offender
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="shrink-0 p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                    aria-label="Close dossier"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="px-5 py-4 space-y-5">

                {/* 2. Profile Card */}
                <div className="glass-card p-4 flex gap-4">
                  <div className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ring-2 ${avatarColor}`}>
                    {getInitials(profile.name)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-[13px] text-white">
                      <User className="size-3 text-slate-500 shrink-0" />
                      <span>{profile.gender}, {profile.age}y</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-300">
                      <Briefcase className="size-3 text-slate-500 shrink-0" />
                      <span className="truncate">{profile.occupation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-300">
                      <Phone className="size-3 text-slate-500 shrink-0" />
                      <span className="font-mono">{maskPhone(profile.phone)}</span>
                    </div>
                    <div className="flex items-start gap-2 text-[12px] text-slate-300">
                      <MapPin className="size-3 text-slate-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{profile.address}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Risk Assessment */}
                <div>
                  <SectionHeader>
                    <Shield className="size-3 inline mr-1.5 -mt-px" />
                    Risk Assessment
                  </SectionHeader>
                  <div className="glass-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-[10px] font-semibold border ${threat.color}`}>
                        {threat.label} Threat
                      </Badge>
                      <span className="text-[13px] font-bold tabular-nums text-white">{riskScore}/100</span>
                    </div>
                    <div className="threat-bar">
                      <motion.div
                        className={`threat-bar-fill ${threat.barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${riskScore}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed border-t border-white/[0.04] pt-2.5">
                      <span className="text-emerald-500/70 font-semibold">AI: </span>
                      {intelNote}
                    </p>
                  </div>
                </div>

                {/* 4. Linked Cases */}
                {linkedCases.length > 0 && (
                  <div>
                    <SectionHeader>
                      <FileText className="size-3 inline mr-1.5 -mt-px" />
                      Linked Cases ({linkedCases.length})
                    </SectionHeader>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                      {linkedCases.map((kase) => (
                        <button
                          key={kase.rowid}
                          onClick={() => { onClose(); navigateToFir(kase.rowid) }}
                          className="w-full text-left glass-card p-3 hover:bg-white/[0.04] transition-colors group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-mono text-emerald-400 group-hover:text-emerald-300 transition-colors truncate">
                                {kase.fir}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                                <span>{kase.crimeType}</span>
                                <span className="text-slate-600">·</span>
                                <span>{kase.district}</span>
                                <span className="text-slate-600">·</span>
                                <span className="text-slate-500">{kase.occurrenceDate?.split(' ')[0] ?? '—'}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className={`shrink-0 text-[8px] px-1.5 border ${STATUS_BADGE[kase.status] ?? 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                              {kase.status}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Vehicle Links */}
                {vehicles.length > 0 && (
                  <div>
                    <SectionHeader>
                      <Car className="size-3 inline mr-1.5 -mt-px" />
                      Vehicle Links ({vehicles.length})
                    </SectionHeader>
                    <div className="space-y-1.5">
                      {vehicles.map((v) => (
                        <div key={v.rowid} className="glass-card p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-mono text-slate-200">{v.number}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {v.color} {v.make} {v.model}
                            </p>
                          </div>
                          {v.seized ? (
                            <Badge variant="outline" className="shrink-0 text-[8px] px-1.5 bg-red-500/10 text-red-400 border-red-500/20">
                              Seized
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="shrink-0 text-[8px] px-1.5 bg-slate-500/10 text-slate-400 border-slate-500/20">
                              Active
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Co-Accused */}
                {coAccused.length > 0 && (
                  <div>
                    <SectionHeader>
                      <Users className="size-3 inline mr-1.5 -mt-px" />
                      Co-Accused ({coAccused.length})
                    </SectionHeader>
                    <div className="flex flex-wrap gap-2">
                      {coAccused.map((ca) => (
                        <div key={ca.name} className="glass-card px-3 py-2 flex items-center gap-2 min-w-0">
                          <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${AVATAR_COLORS[ca.arrestStatus] ?? AVATAR_COLORS['Surrendered']}`}>
                            {getInitials(ca.name)}
                          </div>
                          <div className="min-w-0 flex items-center gap-1.5">
                            <span className="text-[11px] text-white truncate max-w-[120px]">{ca.name}</span>
                            <Badge variant="outline" className={`shrink-0 text-[7px] px-1 py-0 border ${ARREST_BADGE[ca.arrestStatus] ?? ARREST_BADGE['Surrendered']}`}>
                              {ca.arrestStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. District Pattern */}
                {districtPattern.length > 0 && (
                  <div>
                    <SectionHeader>
                      <MapPin className="size-3 inline mr-1.5 -mt-px" />
                      District Pattern
                    </SectionHeader>
                    <div className="glass-card p-3 space-y-2">
                      {districtPattern.map(([district, count]) => (
                        <div key={district} className="flex items-center justify-between">
                          <span className="text-[12px] text-slate-300">{district}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 threat-bar">
                              <div
                                className="threat-bar-fill bg-emerald-500/60"
                                style={{ width: `${Math.min((count / Math.max(...districtPattern.map(d => d[1]))) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 w-5 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* 8. Action Bar (sticky bottom) */}
            <div className="shrink-0 border-t border-white/[0.06] bg-[#0a0f1a]/98 backdrop-blur-sm px-5 py-3 flex items-center gap-3">
              <Button
                size="sm"
                className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold gap-1.5"
              >
                <Send className="size-3" />
                Generate Intelligence Brief
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 text-[11px] font-semibold gap-1.5"
              >
                <Radio className="size-3" />
                Alert District SP
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}