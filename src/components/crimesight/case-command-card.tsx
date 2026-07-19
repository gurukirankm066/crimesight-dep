'use client'

import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, ChevronRight, Clock3, Database, FileText, MapPin, Network, ShieldCheck, UserRound, Users, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GENERATED_CASES } from '@/lib/case-generator'
import { useCrimeSightStore } from '@/lib/store'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CaseCommandCard({ open, onClose }: Props) {
  const navigateToFir = useCrimeSightStore(s => s.navigateToFir)
  const setActiveTab = useCrimeSightStore(s => s.setActiveTab)
  const reviewActions = useCrimeSightStore(s => s.reviewActions)
  const recordReviewAction = useCrimeSightStore(s => s.recordReviewAction)
  const featuredCase = useMemo(
    () => GENERATED_CASES.find(item => item.priority === 'Critical' && item.hasRepeatOffender) ?? GENERATED_CASES[0],
    [],
  )

  if (!open) return null

  const decision = reviewActions.find(action => action.firId === featuredCase.rowid)?.status ?? 'pending'

  const openRegistry = () => {
    navigateToFir(featuredCase.rowid)
    onClose()
  }

  const openOperations = () => {
    setActiveTab('operations')
    onClose()
  }

  const actionMessage = decision === 'Approved'
    ? 'Supervisor review approved. This records a review decision only; it does not trigger enforcement.'
    : decision === 'Needs evidence'
      ? 'Evidence follow-up requested. The case remains with a human officer for review.'
      : 'Awaiting a human supervisor decision.'

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-[#02050bd9] p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Case command card">
      <section className="flex h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl border border-cyan-400/20 bg-[#09121d] shadow-2xl shadow-black/70 sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.07] bg-gradient-to-r from-cyan-500/[0.1] via-[#101b29] to-[#09121d] px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300"><ShieldCheck className="size-3.5" /> Case command card</div>
            <h2 className="mt-1 truncate text-lg font-bold text-white sm:text-xl">{featuredCase.fir}</h2>
            <p className="mt-1 text-xs text-slate-400">Synthetic case context · decision support only · officer remains accountable</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white" aria-label="Close case command card"><X className="size-4" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <section className="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.11] to-[#101927] p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2"><Badge className="border-red-400/20 bg-red-500/15 text-[10px] text-red-200">CRITICAL REVIEW</Badge><Badge variant="outline" className="border-white/10 text-[10px] text-slate-300">Risk score {featuredCase.riskScore}/100</Badge><Badge variant="outline" className="border-white/10 text-[10px] text-slate-300">{featuredCase.status}</Badge></div>
                <h3 className="mt-3 text-xl font-bold text-white">{featuredCase.crimeType} <span className="font-normal text-slate-400">· {featuredCase.district}</span></h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">This item was surfaced for a supervisor&apos;s attention. It is a synthetic rule-based signal and not a finding of guilt, a risk prediction, or an enforcement order.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[['Occurrence', featuredCase.occurrenceDate.slice(0, 10)], ['Case category', featuredCase.crimeCategory], ['Location context', featuredCase.place]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/[0.07] bg-black/15 p-2.5"><p className="text-[9px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 truncate text-xs font-semibold text-white" title={value}>{value}</p></div>)}
                </div>
              </section>

              <section className="rounded-xl border border-white/[0.07] bg-[#0d1724] p-4 sm:p-5">
                <div className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-400" /><h3 className="text-sm font-bold text-white">Explainable review cues</h3></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    ['Critical urgency', 'Priority is marked Critical in the case record.'],
                    ['Repeat-pattern flag', 'A repeat identifier is present and requires validation.'],
                    ['Case remains open', 'Status requires a supervisor to confirm the next owner.'],
                    ['Evidence context', `${featuredCase.evidenceCount} synthetic evidence item${featuredCase.evidenceCount === 1 ? '' : 's'} linked for review.`],
                  ].map(([title, description], index) => <div key={title} className="flex gap-3 rounded-lg border border-white/[0.06] bg-black/15 p-3"><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold text-amber-300">{index + 1}</span><div><p className="text-xs font-semibold text-slate-200">{title}</p><p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{description}</p></div></div>)}
                </div>
              </section>

              <section className="rounded-xl border border-white/[0.07] bg-[#0d1724] p-4 sm:p-5">
                <div className="flex items-center gap-2"><Network className="size-4 text-emerald-400" /><h3 className="text-sm font-bold text-white">Linked case context</h3><Badge variant="outline" className="ml-auto border-emerald-500/20 bg-emerald-500/[0.05] text-[9px] text-emerald-300">Foundry ontology pattern</Badge></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-5">
                  {[
                    [FileText, 'FIR Case', featuredCase.fir],
                    [Users, 'Person', '1 linked entity'],
                    [MapPin, 'Location', featuredCase.district],
                    [UserRound, 'Officer', 'Assigned owner'],
                    [Database, 'Evidence', `${featuredCase.evidenceCount} linked`],
                  ].map(([Icon, label, value], index) => { const ContextIcon = Icon as typeof FileText; return <div key={label as string} className="relative rounded-lg border border-emerald-500/15 bg-emerald-500/[0.035] p-3"><ContextIcon className="size-4 text-emerald-400" /><p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">{label as string}</p><p className="mt-1 truncate text-[11px] font-medium text-slate-100" title={value as string}>{value as string}</p>{index < 4 && <ChevronRight className="absolute -right-2 top-1/2 z-10 hidden size-4 -translate-y-1/2 rounded-full border border-emerald-500/20 bg-[#0d1724] p-0.5 text-emerald-300 sm:block" />}</div> })}
                </div>
                <p className="mt-4 text-[10px] leading-relaxed text-slate-500">Object relationships are configured and verified in Foundry Object Explorer. This public prototype intentionally uses synthetic fallback data while the production-grade sync path is being hardened.</p>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-xl border border-amber-500/20 bg-amber-500/[0.055] p-4 sm:p-5">
                <div className="flex items-center gap-2"><Clock3 className="size-4 text-amber-300" /><h3 className="text-sm font-bold text-white">Evidence clock</h3></div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">Operational prompt, not an automated instruction.</p>
                <div className="mt-4 rounded-lg border border-amber-500/20 bg-black/15 p-3"><p className="text-[10px] uppercase tracking-wider text-amber-300">Next review target</p><p className="mt-1 text-lg font-bold text-white">Evidence validation</p><p className="mt-1 text-xs text-slate-400">Supervisor to confirm evidence owner and follow-up timeframe.</p></div>
              </section>

              <section className="rounded-xl border border-white/[0.07] bg-[#0d1724] p-4 sm:p-5">
                <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-400" /><h3 className="text-sm font-bold text-white">Supervisor decision</h3></div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{actionMessage}</p>
                <div className="mt-4 grid gap-2">
                  <Button size="sm" onClick={() => recordReviewAction({ firId: featuredCase.rowid, fir: featuredCase.fir, status: 'Approved', actor: 'Prototype supervisor', reason: 'Review linked FIRs and nominate a lead investigator.' })} className="bg-emerald-600 text-xs hover:bg-emerald-500"><CheckCircle2 className="mr-1.5 size-3.5" /> Approve review</Button>
                  <Button size="sm" variant="outline" onClick={() => recordReviewAction({ firId: featuredCase.rowid, fir: featuredCase.fir, status: 'Needs evidence', actor: 'Prototype supervisor', reason: 'Evidence follow-up requested before review approval.' })} className="border-sky-500/25 bg-sky-500/[0.04] text-xs text-sky-200 hover:bg-sky-500/[0.12]">Request evidence follow-up</Button>
                </div>
                {decision !== 'pending' && <div className="mt-3 rounded-md border border-emerald-500/15 bg-emerald-500/[0.05] p-2.5 text-[10px] text-emerald-200">Prototype audit entry is shared with the Actions workspace and retained in this browser after refresh.</div>}
              </section>

              <section className="rounded-xl border border-white/[0.07] bg-[#0d1724] p-4 sm:p-5"><h3 className="text-sm font-bold text-white">Governance safeguards</h3><ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-slate-400"><li>• No automated enforcement outcome.</li><li>• Reasons are shown before review.</li><li>• Human supervisor action is required.</li><li>• Synthetic demo data only.</li></ul></section>
            </aside>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] bg-black/15 px-4 py-3 sm:px-6"><Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-slate-400 hover:text-white">Close</Button><div className="flex gap-2"><Button variant="outline" size="sm" onClick={openRegistry} className="border-white/10 bg-white/[0.03] text-xs text-slate-200 hover:bg-white/[0.08]">Open FIR record</Button><Button size="sm" onClick={openOperations} className="bg-emerald-600 text-xs hover:bg-emerald-500">Open action queue</Button></div></footer>
      </section>
    </div>
  )
}
