'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Database, Eye, FileText, MapPin, Network, ShieldCheck, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GENERATED_CASES } from '@/lib/case-generator'
import { useCrimeSightStore } from '@/lib/store'

interface Props {
  open: boolean
  onClose: () => void
  onOpenCaseCommand: () => void
}

const steps = [
  { label: 'Signal', icon: MapPin },
  { label: 'Why surfaced', icon: Eye },
  { label: 'Connected case', icon: Network },
  { label: 'Human decision', icon: ClipboardCheck },
] as const

export default function JudgeDemoMode({ open, onClose, onOpenCaseCommand }: Props) {
  const [step, setStep] = useState(0)
  const [approved, setApproved] = useState(false)
  const setActiveTab = useCrimeSightStore(s => s.setActiveTab)

  const featuredCase = useMemo(
    () => GENERATED_CASES.find(item => item.priority === 'Critical' && item.hasRepeatOffender) ?? GENERATED_CASES[0],
    [],
  )

  useEffect(() => {
    if (!open) return
    setStep(0)
    setApproved(false)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

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

        <div className="grid shrink-0 grid-cols-4 border-b border-white/[0.07] bg-black/15 px-3 sm:px-6">
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
              <div className="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.12] to-transparent p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2"><Badge className="border-red-400/20 bg-red-500/15 text-[10px] text-red-200">CRITICAL SIGNAL</Badge><Badge variant="outline" className="border-white/10 text-[10px] text-slate-300">Repeat-pattern cue</Badge></div>
                <h3 className="mt-3 text-xl font-bold text-white">{featuredCase.crimeType} <span className="text-slate-400">· {featuredCase.district}</span></h3>
                <p className="mt-2 font-mono text-sm text-emerald-300">{featuredCase.fir}</p>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">A critical synthetic FIR was surfaced for supervisor review because it combines a high urgency score with a repeat-pattern identifier. This is a review signal, not a decision or accusation.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['District', featuredCase.district],
                  ['Risk score', `${featuredCase.riskScore}/100`],
                  ['Case status', featuredCase.status],
                ].map(([label, value]) => <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p></div>)}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Transparent reasoning</p><h3 className="mt-1 text-xl font-bold text-white">Why did CrimeSight surface this FIR?</h3><p className="mt-2 text-sm text-slate-400">The prototype exposes the simple, reviewable cues. It does not use an opaque model or decide an outcome.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Critical priority', 'The FIR requires time-sensitive supervisor attention.'],
                  ['Repeat identifier', 'A repeat-pattern flag is present in the synthetic case record.'],
                  [`${featuredCase.crimeCategory} offence`, 'Category is used only to group review workload.'],
                  ['Open review status', 'The workflow prompts an officer to validate the next step.'],
                ].map(([title, body], index) => <div key={title} className="rounded-xl border border-white/[0.07] bg-[#0d1623] p-4"><div className="mb-3 flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-300">{index + 1}</div><p className="text-sm font-semibold text-white">{title}</p><p className="mt-1 text-xs leading-relaxed text-slate-400">{body}</p></div>)}
              </div>
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
                {approved ? <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-400" /><div><p className="font-semibold text-emerald-200">Review approved by prototype supervisor</p><p className="mt-1 text-xs leading-relaxed text-slate-400">A visible audit event has been created in the Actions workspace. The FIR remains subject to normal human investigation.</p></div></div> : <><p className="text-sm font-semibold text-white">Recommended action: review linked FIRs and nominate a lead investigator.</p><p className="mt-1 text-xs leading-relaxed text-slate-400">Approval does not trigger enforcement. It only records a supervisor&apos;s decision to review the case.</p><Button onClick={() => setApproved(true)} className="mt-4 bg-emerald-600 text-xs hover:bg-emerald-500"><CheckCircle2 className="mr-1.5 size-3.5" /> Approve review</Button></>}
              </div>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] bg-black/15 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={() => step === 0 ? onClose() : setStep(current => current - 1)} className="text-xs text-slate-400 hover:text-white"><ChevronLeft className="mr-1 size-3.5" /> {step === 0 ? 'Exit' : 'Back'}</Button>
          <div className="flex items-center gap-2">
            {step === 2 && <Button variant="outline" size="sm" onClick={onOpenCaseCommand} className="border-cyan-500/20 bg-cyan-500/[0.06] text-xs text-cyan-100 hover:bg-cyan-500/[0.12]">Open case command card</Button>}
            {step === 3 && approved && <Button size="sm" onClick={openOperations} className="bg-emerald-600 text-xs hover:bg-emerald-500">View audit trail</Button>}
            {step < steps.length - 1 && <Button size="sm" onClick={() => setStep(current => current + 1)} className="bg-emerald-600 text-xs hover:bg-emerald-500">Next <ChevronRight className="ml-1 size-3.5" /></Button>}
          </div>
        </footer>
      </section>
    </div>
  )
}
