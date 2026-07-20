'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Database, Eye, FileText, MapPin, Network, ShieldCheck, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GENERATED_CASES } from '@/lib/case-generator'
import { runGovernedFirQuery } from '@/lib/query-copilot'
import { useCrimeSightStore } from '@/lib/store'

interface Props {
  open: boolean
  onClose: () => void
  onOpenCaseCommand: () => void
  onOpenFieldFir: () => void
}

const steps = [
  { label: 'Query proof', icon: Database },
  { label: 'Challenge', icon: Eye },
  { label: 'Connected case', icon: Network },
  { label: 'Human decision', icon: ClipboardCheck },
  { label: 'Field to action', icon: FileText },
] as const

export default function JudgeDemoMode({ open, onClose, onOpenCaseCommand, onOpenFieldFir }: Props) {
  const [step, setStep] = useState(0)
  const [challengeVisible, setChallengeVisible] = useState(false)
  const setActiveTab = useCrimeSightStore(s => s.setActiveTab)
  const reviewActions = useCrimeSightStore(s => s.reviewActions)
  const recordReviewAction = useCrimeSightStore(s => s.recordReviewAction)

  const featuredCase = useMemo(
    () => GENERATED_CASES.find(item => item.priority === 'Critical' && item.hasRepeatOffender) ?? GENERATED_CASES[0],
    [],
  )
  const queryProof = useMemo(() => runGovernedFirQuery('Show high-risk cybercrime FIRs in Mysuru'), [])

  useEffect(() => {
    if (!open) return
    setStep(0)
    setChallengeVisible(false)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const approved = reviewActions.find(action => action.firId === featuredCase.rowid)?.status === 'Approved'

  const openOperations = () => {
    setActiveTab('operations')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-[#02050bcc] p-0 sm:p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Judge demo mode">
      <section className="flex h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-emerald-400/20 bg-[#0a111c] shadow-2xl shadow-black/70 sm:h-auto sm:max-h-[88dvh] sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.07] bg-gradient-to-r from-emerald-500/[0.13] via-[#101b29] to-[#0a111c] px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300"><ShieldCheck className="size-3.5" /> Judge demo mode</div>
            <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">One FIR. From signal to accountable action.</h2>
            <p className="mt-1 text-xs text-slate-400">Synthetic demonstration · human review required · no automated enforcement</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white" aria-label="Close demo mode"><X className="size-4" /></button>
        </header>

        <div className="grid shrink-0 grid-cols-5 border-b border-white/[0.07] bg-black/15 px-3 sm:px-6">
          {steps.map((item, index) => {
            const Icon = item.icon
            const active = index === step
            const complete = index < step || (index === 3 && approved)
            return <button key={item.label} onClick={() => setStep(index)} className={`flex min-w-0 items-center justify-center gap-1.5 border-b-2 px-1 py-3 text-[9px] font-bold uppercase tracking-wide transition-colors sm:text-[10px] ${active ? 'border-emerald-400 text-emerald-300' : complete ? 'border-transparent text-emerald-400/70' : 'border-transparent text-slate-600 hover:text-slate-400'}`}><Icon className="size-3 shrink-0" /><span className="hidden sm:inline">{item.label}</span></button>
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 0 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.12] to-transparent p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2"><Badge className="border-emerald-400/20 bg-emerald-500/15 text-[10px] text-emerald-200">PROOF BEFORE ACTION</Badge><Badge variant="outline" className="border-white/10 text-[10px] text-slate-300">Verified dataset query</Badge></div>
                <p className="mt-3 text-sm font-semibold text-white">“Show high-risk cybercrime FIRs in Mysuru.”</p>
                <p className="mt-3 text-xl font-bold text-white">{queryProof.resultCount.toLocaleString()} matching FIRs <span className="text-slate-400">were found from the reproducible dataset.</span></p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">CrimeSight does not guess this answer. It compiles the question into allow-listed filters, returns matching records, and preserves the human decision boundary.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {queryProof.filters.map(filter => <div key={filter} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Applied filter</p><p className="mt-1 text-sm font-semibold text-white">{filter}</p></div>)}
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/[0.07]"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-black/20 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">FIR</th><th className="px-4 py-3">Crime type</th><th className="px-4 py-3">District</th><th className="px-4 py-3 text-right">Risk</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{queryProof.cases.slice(0, 3).map(item => <tr key={item.id} className="text-slate-300"><td className="px-4 py-3 font-mono text-emerald-300">{item.fir}</td><td className="px-4 py-3">{item.crimeType}</td><td className="px-4 py-3">{item.district}</td><td className="px-4 py-3 text-right font-bold text-amber-300">{item.riskScore}</td></tr>)}</tbody></table></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Judge challenge pack</p><h3 className="mt-1 text-xl font-bold text-white">CrimeSight refuses to invent a meaning.</h3><p className="mt-2 text-sm text-slate-400">A trustworthy system asks for clarification when a request cannot be translated into a verified FIR query.</p></div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4"><p className="font-mono text-sm text-amber-100">“Show serious cases.”</p><p className="mt-3 text-sm text-slate-300">This is ambiguous. “Serious” could mean critical priority, violent offence, high risk, or an open investigation.</p><Button size="sm" onClick={() => setChallengeVisible(current => !current)} className="mt-4 bg-amber-600 text-xs text-white hover:bg-amber-500">{challengeVisible ? 'Hide interpretation check' : 'Challenge this interpretation'}</Button>{challengeVisible && <div className="mt-3 rounded-lg border border-white/[0.08] bg-black/20 p-3 text-xs leading-relaxed text-slate-300"><p className="font-semibold text-emerald-300">Safe response</p><p className="mt-1">Please specify whether you mean: <span className="text-white">High/Critical priority</span>, <span className="text-white">violent crime</span>, <span className="text-white">high risk score</span>, or <span className="text-white">open investigation</span>. No unverified results are shown.</p></div>}</div>
              <div className="grid gap-3 sm:grid-cols-2">{[['No-result query', 'Returns “no matching FIRs” without filling the gap with speculation.'], ['Purpose boundary', 'Refuses non-FIR requests and stays within the synthetic-demo data scope.']].map(([title, body]) => <div key={title} className="rounded-xl border border-white/[0.07] bg-[#0d1623] p-4"><p className="text-sm font-semibold text-white">{title}</p><p className="mt-1 text-xs leading-relaxed text-slate-400">{body}</p></div>)}</div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Ontology-backed case context</p><h3 className="mt-1 text-xl font-bold text-white">The FIR is not an isolated row.</h3><p className="mt-2 text-sm text-slate-400">CrimeSight demonstrates a governed Foundry ontology: case context can be linked across FIRs, people, locations, officers, and evidence.</p></div>
              <div className="grid gap-3 sm:grid-cols-5">
                {[
                  [FileText, 'FIR Case', featuredCase.fir],
                  [Users, 'Person', 'Linked entity'],
                  [MapPin, 'Location', featuredCase.district],
                  [ShieldCheck, 'Officer', 'Assigned owner'],
                  [Database, 'Evidence', `${featuredCase.evidenceCount} items`],
                ].map(([Icon, label, value]) => { const CardIcon = Icon as typeof FileText; return <div key={label as string} className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-3"><CardIcon className="size-4 text-emerald-400" /><p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label as string}</p><p className="mt-1 truncate text-xs font-medium text-white" title={value as string}>{value as string}</p></div> })}
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-relaxed text-amber-100/85">Foundry object links have been configured and verified in Object Explorer. The public prototype remains in synthetic fallback mode until a non-blocking production sync path is enabled.</div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Human authority</p><h3 className="mt-1 text-xl font-bold text-white">A person makes the operational decision.</h3><p className="mt-2 text-sm text-slate-400">The system presents evidence cues. A supervisor chooses whether the item deserves review and the action is recorded in the prototype audit trail.</p></div>
              <div className={`rounded-xl border p-5 ${approved ? 'border-emerald-400/30 bg-emerald-500/[0.08]' : 'border-white/[0.08] bg-[#0d1623]'}`}>
                {approved ? <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-400" /><div><p className="font-semibold text-emerald-200">Review approved by prototype supervisor</p><p className="mt-1 text-xs leading-relaxed text-slate-400">The shared Actions workspace now carries this audit entry. The FIR remains subject to normal human investigation.</p></div></div> : <><p className="text-sm font-semibold text-white">Recommended action: review linked FIRs and nominate a lead investigator.</p><p className="mt-1 text-xs leading-relaxed text-slate-400">Approval does not trigger enforcement. It only records a supervisor&apos;s decision to review the case.</p><Button onClick={() => recordReviewAction({ firId: featuredCase.rowid, fir: featuredCase.fir, status: 'Approved', actor: 'Prototype supervisor', reason: 'Review linked FIRs and nominate a lead investigator.' })} className="mt-4 bg-emerald-600 text-xs hover:bg-emerald-500"><CheckCircle2 className="mr-1.5 size-3.5" /> Approve review</Button></>}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">End-to-end readiness</p><h3 className="mt-1 text-xl font-bold text-white">From field report to accountable review.</h3><p className="mt-2 text-sm text-slate-400">A field officer can submit a synthetic FIR, preserve its evidence metadata, and route the case into the same governed review workflow.</p></div>
              <div className="grid gap-3 sm:grid-cols-4">{[['1', 'Field FIR', 'Officer submits structured report'], ['2', 'Catalyst intake', 'Report is persisted through the secure service'], ['3', 'Query Copilot', 'Verified questions surface relevant FIRs'], ['4', 'Human action', 'Approval or evidence request is audited']].map(([number, title, body]) => <div key={number} className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4"><span className="text-lg font-bold text-emerald-300">{number}</span><p className="mt-3 text-sm font-semibold text-white">{title}</p><p className="mt-1 text-xs leading-relaxed text-slate-400">{body}</p></div>)}</div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-relaxed text-amber-100/85">All records used in this demo are reproducible synthetic data modeled on the supplied KSP ER schema. CrimeSight supports review; it never automates enforcement action.</div>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] bg-black/15 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => step === 0 ? onClose() : setStep(current => current - 1)} className="text-xs text-slate-400 hover:text-white"><ChevronLeft className="mr-1 size-3.5" /> {step === 0 ? 'Exit' : 'Back'}</Button>
          <div className="flex items-center gap-2">
            {step === 2 && <Button variant="outline" size="sm" onClick={onOpenCaseCommand} className="border-cyan-500/20 bg-cyan-500/[0.06] text-xs text-cyan-100 hover:bg-cyan-500/[0.12]">Open case command card</Button>}
            {step === 3 && approved && <Button size="sm" onClick={openOperations} className="bg-emerald-600 text-xs hover:bg-emerald-500">View audit trail</Button>}
            {step === 4 && <Button size="sm" onClick={onOpenFieldFir} className="bg-cyan-600 text-xs hover:bg-cyan-500">Open Field FIR</Button>}
            {step < steps.length - 1 && <Button size="sm" onClick={() => setStep(current => current + 1)} className="bg-emerald-600 text-xs hover:bg-emerald-500">Next <ChevronRight className="ml-1 size-3.5" /></Button>}
          </div>
        </footer>
      </section>
    </div>
  )
}
