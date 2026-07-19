'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Eye, MapPin, Network, ShieldCheck, UserCheck, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GENERATED_CASES, type GeneratedCase } from '@/lib/case-generator'
import { useCrimeSightStore, type ReviewStatus } from '@/lib/store'

interface ReviewCase {
  rowid: string
  fir: string
  crimeType: string
  crimeCategory: string
  district: string
  priority: string
  status: string
  riskScore: number
  isSensitive: boolean
  hasRepeatOffender: boolean
  daysAgo: number
}

interface QueueItem {
  case: ReviewCase
  source: 'local' | 'foundry'
  signal: string
  recommendation: string
  reason: string
}

interface FoundryStatus {
  configured: boolean
  mode: 'not-configured' | 'token-ready' | 'oauth-ready'
  missing: string[]
  ontologyObjectCount: number
  actionCount: number
}

interface FoundrySyncResponse {
  source: 'foundry'
  ontology: string
  syncedAt: string
  data: Array<Omit<ReviewCase, 'rowid' | 'daysAgo'> & { id: string }>
}

const priorityStyle: Record<string, string> = {
  Critical: 'border-red-500/30 bg-red-500/10 text-red-300',
  High: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  Medium: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  Low: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
}

function toReviewCase(caseItem: GeneratedCase): ReviewCase {
  return {
    rowid: caseItem.rowid,
    fir: caseItem.fir,
    crimeType: caseItem.crimeType,
    crimeCategory: caseItem.crimeCategory,
    district: caseItem.district,
    priority: caseItem.priority,
    status: caseItem.status,
    riskScore: caseItem.riskScore,
    isSensitive: caseItem.isSensitive,
    hasRepeatOffender: caseItem.hasRepeatOffender,
    daysAgo: caseItem.daysAgo,
  }
}

function deriveQueue(cases: ReviewCase[], source: QueueItem['source']): QueueItem[] {
  return cases
    .filter(c => c.priority === 'Critical' || c.priority === 'High')
    .sort((a, b) => b.riskScore - a.riskScore || a.daysAgo - b.daysAgo)
    .slice(0, 5)
    .map(c => ({
      case: c,
      source,
      signal: c.hasRepeatOffender ? 'Repeat-pattern signal' : c.isSensitive ? 'Sensitive-case safeguard' : 'High-priority triage',
      recommendation: c.hasRepeatOffender
        ? 'Review related FIRs and nominate a lead investigator.'
        : c.isSensitive
          ? 'Confirm safeguarding protocol and supervisor review.'
          : 'Validate the operational priority and assign a follow-up owner.',
      reason: `Risk cue: ${c.priority} priority · ${c.crimeCategory} offence · ${c.hasRepeatOffender ? 'repeat identifier present' : 'no repeat identifier'} · score ${c.riskScore}/100.`,
    }))
}

export default function OperationsTab() {
  const localQueue = useMemo(() => deriveQueue(GENERATED_CASES.map(toReviewCase), 'local'), [])
  const [queue, setQueue] = useState<QueueItem[]>(localQueue)
  const [queueSource, setQueueSource] = useState<QueueItem['source']>('local')
  const [syncedAt, setSyncedAt] = useState<string | null>(null)
  const navigateToFir = useCrimeSightStore(s => s.navigateToFir)
  const reviewActions = useCrimeSightStore(s => s.reviewActions)
  const recordReviewAction = useCrimeSightStore(s => s.recordReviewAction)
  const [foundry, setFoundry] = useState<FoundryStatus | null>(null)

  const actionByCase = useMemo(() => new Map(reviewActions.map(action => [action.firId, action])), [reviewActions])

  useEffect(() => {
    fetch('/api/foundry/status')
      .then(response => response.ok ? response.json() : null)
      .then((status: FoundryStatus | null) => setFoundry(status))
      .catch(() => setFoundry(null))
  }, [])

  useEffect(() => {
    fetch('/api/foundry/fir-cases', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then((result: FoundrySyncResponse | null) => {
        if (!result?.data?.length) return
        const foundryCases: ReviewCase[] = result.data.map(item => ({ ...item, rowid: item.id, daysAgo: 0 }))
        setQueue(deriveQueue(foundryCases, 'foundry'))
        setQueueSource('foundry')
        setSyncedAt(result.syncedAt)
      })
      .catch(() => undefined)
  }, [])

  const changeStatus = (item: QueueItem, status: ReviewStatus) => {
    recordReviewAction({
      firId: item.case.rowid,
      fir: item.case.fir,
      status,
      actor: 'Prototype supervisor',
      reason: status === 'Approved' ? 'Review linked FIRs and nominate a lead investigator.' : 'Evidence follow-up requested before review approval.',
    })
  }

  const approved = reviewActions.filter(action => action.status === 'Approved').length

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-xl border border-emerald-500/15 bg-gradient-to-r from-emerald-500/[0.09] via-[#0f1f27] to-[#0a0f1a] p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
              <ShieldCheck className="size-3.5" /> Governed operations layer
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">Intelligence only matters when it becomes an accountable action.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
              Every recommendation shows its evidence cues, requires human review, and creates a visible audit entry. The system supports decisions—it never makes enforcement decisions.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <div className="rounded-lg border border-white/[0.07] bg-black/20 px-3 sm:px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Review queue</p>
              <p className="mt-0.5 text-lg font-bold text-white">{queue.length} <span className="text-xs font-medium text-slate-500">items</span></p>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 sm:px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-emerald-500/80">Approved</p>
              <p className="mt-0.5 text-lg font-bold text-emerald-300">{approved}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="rounded-xl border border-white/[0.07] bg-[#0d141f]/85 overflow-hidden">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] px-3 sm:px-5 py-3.5">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-white"><ClipboardCheck className="size-4 text-emerald-400" /> Recommended review queue</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">{queueSource === 'foundry' ? 'Live read-only Foundry FIR objects · ranked by transparent rule-based signals' : 'Synthetic prototype fallback · ranked by transparent rule-based signals'}</p>
            </div>
            <Badge variant="outline" className="border-amber-500/20 bg-amber-500/[0.06] text-[10px] text-amber-300">Human approval required</Badge>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {queue.map(item => {
              const action = actionByCase.get(item.case.rowid)
              const status = action?.status ?? 'Awaiting review'
              return (
                <article key={item.case.rowid} className="p-3 sm:p-4 transition-colors hover:bg-white/[0.018]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-emerald-300">{item.case.fir}</span>
                        <Badge variant="outline" className={`text-[9px] ${priorityStyle[item.case.priority]}`}>{item.case.priority}</Badge>
                        <Badge variant="outline" className="border-white/10 bg-white/[0.03] text-[9px] text-slate-400">{item.signal}</Badge>
                      </div>
                      <h4 className="mt-2 text-sm font-semibold text-white">{item.case.crimeType} <span className="font-normal text-slate-500">· {item.case.district}</span></h4>
                      <p className="mt-1 text-xs text-slate-400">{item.recommendation}</p>
                      <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{item.reason}</p>
                    </div>
                    <div className="flex flex-wrap shrink-0 items-center gap-2">
                      <Badge className={`text-[9px] ${status === 'Approved' ? 'bg-emerald-500/15 text-emerald-300' : status === 'Needs evidence' ? 'bg-sky-500/15 text-sky-300' : 'bg-slate-500/15 text-slate-300'}`}>{status}</Badge>
                      {item.source === 'local'
                        ? <Button size="sm" variant="outline" onClick={() => navigateToFir(item.case.rowid)} className="h-7 border-white/10 bg-white/[0.02] px-2 text-[10px] text-slate-300 hover:bg-white/[0.06]"><Eye className="mr-1 size-3" /> Open</Button>
                        : <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/[0.05] text-[9px] text-emerald-300">Foundry synced</Badge>}
                    </div>
                  </div>
                  {status === 'Awaiting review' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => changeStatus(item, 'Approved')} className="h-7 bg-emerald-600 px-2.5 text-[10px] hover:bg-emerald-500"><CheckCircle2 className="mr-1 size-3" /> Approve review</Button>
                      <Button size="sm" variant="outline" onClick={() => changeStatus(item, 'Needs evidence')} className="h-7 border-sky-500/25 bg-sky-500/[0.04] px-2.5 text-[10px] text-sky-300 hover:bg-sky-500/[0.12]"><Network className="mr-1 size-3" /> Request evidence</Button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-white/[0.07] bg-[#0d141f]/85 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"><Database className="size-3.5 text-emerald-400" /> Foundry / AIP readiness</h3>
              <Badge className={`text-[9px] ${queueSource === 'foundry' ? 'bg-emerald-500/15 text-emerald-300' : foundry?.configured ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-500/15 text-slate-300'}`}>{queueSource === 'foundry' ? 'Live sync' : foundry?.configured ? 'Connecting' : 'Sandbox mode'}</Badge>
            </div>
            {foundry ? <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-slate-500"><p>{foundry.ontologyObjectCount} Ontology objects and {foundry.actionCount} governed actions are mapped.</p><p>{queueSource === 'foundry' ? `Read-only FIR sync active${syncedAt ? ` · updated ${new Date(syncedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}` : ''}. Human approvals remain inside CrimeSight.` : foundry.configured ? 'Server-side Foundry credentials are configured. The queue will fall back safely until an authorised FIR read succeeds.' : 'No Foundry credentials are exposed in this demo. Add a server-side token to enable the connector.'}</p></div> : <p className="mt-3 text-[11px] text-slate-500">Checking secure connector readiness…</p>}
          </section>
          <section className="rounded-xl border border-white/[0.07] bg-[#0d141f]/85 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Decision safeguards</h3>
            <div className="mt-4 space-y-4">
              {[
                [Eye, 'Evidence first', 'Every queue item reveals the signals used to surface it.'],
                [UserCheck, 'Human authority', 'An officer approves, requests evidence, or dismisses the suggestion.'],
                [MapPin, 'Purpose-limited', 'Location and case signals support operational review—not automated enforcement.'],
              ].map(([Icon, title, body]) => {
                const SafeIcon = Icon as typeof Eye
                return <div key={title as string} className="flex gap-3"><SafeIcon className="mt-0.5 size-4 shrink-0 text-emerald-400" /><div><p className="text-xs font-semibold text-slate-200">{title as string}</p><p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{body as string}</p></div></div>
              })}
            </div>
          </section>
          <section className="rounded-xl border border-white/[0.07] bg-[#0d141f]/85 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Audit trail</h3>
            {reviewActions.length ? <div className="mt-3 space-y-2">{reviewActions.slice(0, 4).map(action => <p key={action.firId} className="rounded-md border border-white/[0.05] bg-black/15 p-2 text-[10px] leading-relaxed text-slate-400"><span className="font-mono text-emerald-300">{action.fir}</span>: {action.status.toLowerCase()} by {action.actor} at {new Date(action.recordedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}.<br /><span className="text-slate-500">{action.reason}</span></p>)}</div> : <p className="mt-3 text-[11px] leading-relaxed text-slate-500">No actions recorded yet. Approve or request evidence to create a prototype audit entry.</p>}
          </section>
        </aside>
      </div>
    </div>
  )
}
