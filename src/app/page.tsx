'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Shield, BarChart3, GitBranch, FileText, Brain, Map,
  Search, Bell, Mic, ClipboardEdit, ClipboardCheck, History, LogOut, UserRound, X, Zap
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getRecentCases, getTickerItems } from '@/lib/case-generator'
import CrimeMapTab from '@/components/crimesight/crime-map-tab'
import DashboardTab from '@/components/crimesight/dashboard-tab'
import TrendsTab from '@/components/crimesight/trends-tab'
import NetworkTab from '@/components/crimesight/network-tab'
import MostWantedTab from '@/components/crimesight/most-wanted-tab'
import CasesTab from '@/components/crimesight/cases-tab'
import AIAnalysisTab from '@/components/crimesight/ai-analysis-tab'
import MorningBriefTab from '@/components/crimesight/morning-brief-tab'
import OperationsTab from '@/components/crimesight/operations-tab'
import AIChatBar from '@/components/crimesight/ai-chat-bar'
import LoginScreen from '@/components/crimesight/login-screen'
import AlertsPanel from '@/components/crimesight/alerts-panel'
import CommandPalette from '@/components/crimesight/command-palette'
import VoiceFirModal from '@/components/crimesight/voice-fir-modal'
import FieldFirModal from '@/components/crimesight/field-fir-modal'
import IntelligenceBriefing from '@/components/crimesight/intelligence-briefing'
import AiReportModal from '@/components/crimesight/ai-report-modal'
import InvestigationTimeline from '@/components/crimesight/investigation-timeline'
import HelpWidget from '@/components/crimesight/help-widget'
import { TabErrorBoundary } from '@/components/crimesight/error-boundary'
import SuspectDossier from '@/components/crimesight/suspect-dossier'
import JudgeDemoMode from '@/components/crimesight/judge-demo-mode'
import CaseCommandCard from '@/components/crimesight/case-command-card'
import { toast } from 'sonner'
import { useCrimeSightStore } from '@/lib/store'

// ─── Tab definitions ───
const tabs = [
  { value: 'map', label: 'Geo Intel', icon: Map, shortLabel: 'GEO' },
  { value: 'dashboard', label: 'Command', icon: BarChart3, shortLabel: 'CMD' },
  { value: 'operations', label: 'Actions', icon: ClipboardCheck, shortLabel: 'ACT' },
  { value: 'network', label: 'Network', icon: GitBranch, shortLabel: 'LNK' },
  { value: 'cases', label: 'FIRs', icon: FileText, shortLabel: 'FIR' },
] as const

const tabComponents: Record<string, React.FC> = {
  map: CrimeMapTab,
  dashboard: DashboardTab,
  trends: TrendsTab,
  network: NetworkTab,
  'most-wanted': MostWantedTab,
  cases: CasesTab,
  ai: AIAnalysisTab,
  brief: MorningBriefTab,
  operations: OperationsTab,
}

const tabNames: Record<string, string> = {
  map: 'Geo Intelligence',
  dashboard: 'Command Center',
  trends: 'Statistical Cell',
  network: 'Link Analysis',
  'most-wanted': 'Priority Targets',
  cases: 'FIR Registry',
  ai: 'Transparent Review Signals',
  brief: 'Morning Intel Brief',
  operations: 'Governed Operations Queue',
}

// ─── Clock ───
function LiveClock() {
  const [t, setT] = useState('')
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <>{t}</>
}

type SessionEvent = {
  id: string
  action: 'Signed in' | 'Signed out'
  detail: string
  time: string
}

export default function Home() {
  const { activeTab, setActiveTab: storeSetActiveTab, setTickerItems, tickerItems, selectedFirId, dossierOpen, dossierSuspectName, dossierSourceFir, closeDossier, incrementLivePulse } = useCrimeSightStore()
  const [authenticated, setAuthenticated] = useState(false)
  const [authUser, setAuthUser] = useState('')
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([])
  const [showSessionHistory, setShowSessionHistory] = useState(false)
  const [newAlerts, setNewAlerts] = useState(0)
  const [showAlerts, setShowAlerts] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showVoiceFir, setShowVoiceFir] = useState(false)
  const [showFieldFir, setShowFieldFir] = useState(false)
  const [showBriefing, setShowBriefing] = useState(false)
  const [commandView, setCommandView] = useState<'overview' | 'brief'>('overview')
  const [showAiReport, setShowAiReport] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [showJudgeDemo, setShowJudgeDemo] = useState(false)
  const [showCaseCommand, setShowCaseCommand] = useState(false)
  const prevTabRef = useRef(activeTab)

  const recordSessionEvent = useCallback((action: SessionEvent['action'], detail: string) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    setSessionEvents(previous => [{ id: `${Date.now()}-${action}`, action, detail, time }, ...previous].slice(0, 10))
  }, [])

  const handleDemoAuthenticated = useCallback((user: string) => {
    setAuthUser(user)
    setAuthenticated(true)
    recordSessionEvent('Signed in', `${user} entered the prototype workspace`)
  }, [recordSessionEvent])

  const handleDemoLogout = useCallback(() => {
    recordSessionEvent('Signed out', `${authUser || 'Demo user'} ended the prototype session`)
    setShowSessionHistory(false)
    setAuthenticated(false)
    setAuthUser('')
    toast.success('Demo session closed')
  }, [authUser, recordSessionEvent])

  const handleSimulateLiveAlert = useCallback(() => {
    const randomSeq = Math.floor(1000 + Math.random() * 9000)
    const districts = ['Bengaluru Urban', 'Mysuru', 'Mangaluru', 'Hubballi-Dharwad', 'Belagavi', 'Kalaburagi']
    const crimeTypes = ['Armed Robbery', 'Chain Snatching', 'Cyber Fraud', 'Vehicle Theft', 'Rioting']
    const district = districts[Math.floor(Math.random() * districts.length)]
    const crimeType = crimeTypes[Math.floor(Math.random() * crimeTypes.length)]
    const firNumber = `FIR/2026/KSP/LIVE-${randomSeq}`

    incrementLivePulse()
    setNewAlerts(prev => prev + 1)

    toast.custom(() => (
      <div className="flex items-center gap-2.5 bg-[#111827]/95 border border-red-500/40 rounded-lg px-3.5 py-3 shadow-xl shadow-red-950/40 w-[310px] max-w-[calc(100vw-2rem)] backdrop-blur-md">
        <div className="size-3 rounded-full shrink-0 bg-red-500 animate-ping" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-red-400 uppercase tracking-wider font-bold">⚡ DEMO LIVE INCIDENT TRIGGERED</p>
            <span className="text-[9px] font-mono text-slate-400">{firNumber}</span>
          </div>
          <p className="text-[12px] font-semibold text-white truncate mt-0.5">{crimeType} <span className="text-slate-400 font-normal">· {district}</span></p>
        </div>
      </div>
    ), { duration: 4500, position: 'bottom-left' })
  }, [incrementLivePulse])

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(prev => !prev)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Populate ticker from 10K generated data
  useEffect(() => {
    const items = getTickerItems()
    if (items.length) setTickerItems(items)
  }, [setTickerItems])

  // Live intelligence toasts — pulls from 10K generated data
  useEffect(() => {
    if (!authenticated) return

    // Pop-up intelligence cards obstruct the limited mobile/tablet workspace.
    // Those users still receive the unread indicator and can open the alert panel.
    if (window.matchMedia('(max-width: 1023px)').matches) return

    const criticalCases = getRecentCases(30).filter(c => c.priority === 'Critical')
    if (!criticalCases.length) return

    let alertIndex = 0
    const intervalRef: { current: ReturnType<typeof setInterval> | null } = { current: null }

    const showNextAlert = () => {
      const c = criticalCases[alertIndex % criticalCases.length]

      setNewAlerts(prev => prev + 1)
      incrementLivePulse()

      toast.custom(() => (
        <div className="flex items-center gap-2.5 bg-[#111827]/95 border border-red-500/20 rounded-lg px-3 py-2.5 shadow-lg shadow-black/30 w-[280px] max-w-[calc(100vw-2rem)]">
          <div className="size-2 rounded-full shrink-0 bg-red-500 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-red-300/80 uppercase tracking-wider font-semibold">Critical intelligence update</p>
            <p className="text-[12px] font-semibold text-slate-100 truncate">{c.crimeType} <span className="text-slate-400 font-normal">· {c.district}</span></p>
          </div>
        </div>
      ), { duration: 3000, position: 'bottom-left' })

      alertIndex++
    }

    const initialTimeout = setTimeout(() => {
      showNextAlert()
      intervalRef.current = setInterval(() => {
        showNextAlert()
      }, 90000)
    }, 20000)

    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [authenticated])

  // Reset alerts when viewing Command Center
  useEffect(() => {
    if (activeTab === 'dashboard' && prevTabRef.current === 'dashboard') queueMicrotask(() => setNewAlerts(0))
    prevTabRef.current = activeTab
  }, [activeTab])

  const handleTabChange = useCallback((tab: string) => {
    if (tab === 'brief') {
      setCommandView('brief')
      storeSetActiveTab('dashboard')
      return
    }
    if (tab === 'dashboard') setCommandView('overview')
    storeSetActiveTab(tab as typeof activeTab)
  }, [storeSetActiveTab])

  useEffect(() => {
    // Older sessions may have Morning Brief persisted as a top-level tab.
    // Migrate them into its new Command workspace home without losing access.
    if (activeTab === 'brief') {
      setCommandView('brief')
      storeSetActiveTab('dashboard')
    }
  }, [activeTab, storeSetActiveTab])

  const Active = activeTab === 'dashboard' && commandView === 'brief'
    ? MorningBriefTab
    : tabComponents[activeTab]

  // Login gate
  if (!authenticated) {
    return <LoginScreen onAuthenticated={handleDemoAuthenticated} />
  }

  return (
    <div className="h-[100dvh] min-h-[100dvh] flex flex-col bg-[#0a0f1a] relative overflow-hidden" suppressHydrationWarning>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-emerald-600 focus:text-white focus:text-xs focus:rounded-md">
        Skip to content
      </a>
      <div className="ambient-glow" />
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="contents"
      >
        {/* ═══ HEADER — Single clean row ═══ */}
        <header className="shrink-0 bg-[#060a12]/95 backdrop-blur-sm border-b border-white/[0.06] relative z-10">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-y-1 px-3 sm:px-4 lg:px-6 min-h-12 py-1 sm:py-0">
            {/* Left: Brand */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="size-4 text-emerald-400" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-[13px] font-bold text-white tracking-wide uppercase leading-tight">
                  CrimeSight
                </h1>
                <p className="text-[10px] text-slate-500 leading-tight">Karnataka State Police · Synthetic Prototype</p>
              </div>
            </div>

            {/* Center: Tab Navigation */}
            <nav className="tab-scroll-container order-3 flex w-full items-center gap-0.5 overflow-x-auto sm:order-none sm:w-auto sm:flex-1 sm:mx-4" aria-label="Main navigation">
              {tabs.map(tab => {
                const active = activeTab === tab.value
                return (
                  <button
                    key={tab.value}
                    onClick={() => handleTabChange(tab.value)}
                    className={`
                      relative flex min-w-11 items-center gap-1.5 px-2.5 sm:px-3 h-8 text-[11px] font-medium
                      transition-all duration-200 rounded-md whitespace-nowrap
                      ${active
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                      }
                    `}
                    role="tab"
                    aria-selected={active}
                  >
                    <tab.icon className="size-3" />
                    <span className="hidden lg:inline">{tab.label}</span>
                    <span className="lg:hidden text-[9px] font-bold tracking-wider">{tab.shortLabel}</span>
                  </button>
                )
              })}
            </nav>

            {/* Right: Actions */}
            <div className="ml-auto flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowJudgeDemo(true)}
                className="hidden md:flex items-center gap-1.5 h-7 px-2 rounded-md border border-emerald-500/20 bg-emerald-500/[0.08] text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/[0.15] transition-colors"
                aria-label="Start judge demo"
              >
                <Shield className="size-3" />
                <span className="hidden xl:inline">Judge Story</span>
                <span className="xl:hidden">Judge</span>
              </button>
              <button
                onClick={handleSimulateLiveAlert}
                className="hidden sm:flex items-center gap-1.5 h-7 px-2 rounded-md border border-red-500/30 bg-red-500/[0.12] text-[10px] font-bold text-red-300 hover:bg-red-500/[0.2] transition-colors animate-pulse"
                aria-label="Simulate Live Alert"
                title="Inject a live synthetic crime alert during demo"
              >
                <Zap className="size-3 text-red-400" />
                <span>Simulate Alert</span>
              </button>
              {/* Voice FIR — accessible via ⌘K */}
              <button
                onClick={() => setShowVoiceFir(true)}
                className="hidden lg:flex items-center justify-center h-7 w-7 rounded-md text-slate-600 hover:text-emerald-400 hover:bg-white/[0.04] transition-colors"
                aria-label="Voice FIR"
              >
                <Mic className="size-3" />
              </button>

              {/* Field FIR Submission */}
              <button
                onClick={() => setShowFieldFir(true)}
                className="hidden lg:flex items-center gap-1.5 h-7 px-2 rounded-md text-[10px] text-cyan-400/80 hover:text-cyan-300 hover:bg-cyan-500/5 transition-colors font-medium"
                aria-label="Submit Field FIR"
              >
                <ClipboardEdit className="size-3" />
                <span className="hidden xl:inline">Field FIR</span>
              </button>

              {/* Intelligence Briefing */}
              <button
                onClick={() => handleTabChange('brief')}
                className="hidden md:flex items-center gap-1.5 h-7 px-2 rounded-md text-[10px] text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/5 transition-colors font-medium"
                aria-label="Intelligence Briefing"
              >
                <Brain className="size-3" />
                <span className="hidden xl:inline">Briefing</span>
              </button>

              {/* Alerts Bell */}
              <button
                onClick={() => setShowAlerts(prev => !prev)}
                className="relative flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:text-amber-400 hover:bg-white/[0.03] transition-colors"
                aria-label="Alerts"
              >
                <Bell className="size-3.5" />
                {newAlerts > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 size-2 bg-red-500 animate-pulse rounded-full" />
                )}
              </button>

              {/* Search */}
              <button
                onClick={() => setShowCommandPalette(prev => !prev)}
                className="flex items-center justify-center h-7 w-7 rounded-md text-slate-500 hover:text-emerald-400 hover:bg-white/[0.04] transition-colors"
                aria-label="Search"
              >
                <Search className="size-3" />
              </button>

              {/* Divider */}
              <div className="hidden sm:block w-px h-4 bg-white/[0.06] mx-0.5" />

              {/* LIVE Indicator + Clock */}
              <div className="hidden md:flex items-center gap-1.5">
                <span className="relative flex size-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
                </span>
                <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-wider">Live</span>
                <span className="text-[10px] font-mono tabular-nums text-slate-500"><LiveClock /></span>
              </div>
              {authUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex h-6 items-center gap-1.5 rounded-md border border-emerald-500/15 bg-emerald-500/5 px-1.5 text-[9px] font-bold tracking-wider text-emerald-400/80 transition-colors hover:bg-emerald-500/10 focus:outline-none focus:ring-1 focus:ring-emerald-400/60"
                      aria-label="Open demo session menu"
                    >
                      <UserRound className="size-3" />
                      <span>{authUser}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 border-white/10 bg-[#0d1623] p-1.5 text-slate-200 shadow-xl shadow-black/40">
                    <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Demo session · {authUser}
                    </DropdownMenuLabel>
                    <p className="px-2 pb-2 text-[10px] leading-relaxed text-slate-500">Visual demonstration access only — not real authentication.</p>
                    <DropdownMenuSeparator className="bg-white/[0.07]" />
                    <DropdownMenuItem onSelect={() => setShowSessionHistory(true)} className="cursor-pointer text-xs text-slate-200 focus:bg-white/[0.07] focus:text-white">
                      <History className="size-3.5 text-emerald-400" />
                      Session history
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleDemoLogout} className="cursor-pointer text-xs text-red-300 focus:bg-red-500/10 focus:text-red-200">
                      <LogOut className="size-3.5 text-red-400" />
                      End demo session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence>
          {showSessionHistory && (
            <motion.aside
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
              role="dialog"
              aria-modal="true"
              aria-label="Demo session history"
              className="fixed right-3 top-14 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-white/[0.1] bg-[#0b1320]/98 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-white"><History className="size-4 text-emerald-400" /> Session history</p>
                  <p className="mt-1 text-[10px] text-slate-500">Recorded in this browser tab only.</p>
                </div>
                <button onClick={() => setShowSessionHistory(false)} className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white" aria-label="Close session history">
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {sessionEvents.map(event => (
                  <div key={event.id} className="flex gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${event.action === 'Signed in' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-semibold text-slate-200">{event.action}</span><span className="font-mono text-[9px] text-slate-500">{event.time}</span></div>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{event.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ═══ LIVE FIR TICKER — Scrolling ═══ */}
        {tickerItems.length > 0 && (
          <div className="hidden sm:flex shrink-0 items-center h-7 bg-[#060a12]/80 border-b border-white/[0.04] overflow-hidden select-none">
            {/* Left label */}
            <div className="flex items-center gap-1.5 shrink-0 px-4 lg:px-6">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-1.5 bg-red-500" />
              </span>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Live FIRs</span>
            </div>

            {/* Scrolling track — content doubled for seamless loop */}
            <div className="flex-1 overflow-hidden">
              <div className="ticker-track">
                {/* First copy */}
                {tickerItems.map((item, i) => (
                  <span key={`a-${item.id}-${i}`} className="flex items-center gap-1.5 px-4 text-[11px] shrink-0 border-l border-white/[0.04]">
                    <span className={`size-1.5 rounded-full shrink-0 ${
                      item.priority === 'Critical' ? 'bg-red-500' : item.priority === 'High' ? 'bg-amber-500' : 'bg-emerald-500/50'
                    }`} />
                    <span className="text-slate-200 font-medium">{item.crimeType}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{item.district}</span>
                    <span className="text-slate-700 font-mono text-[10px]">{item.fir}</span>
                  </span>
                ))}
                {/* Separator + Second copy for seamless loop */}
                <span className="shrink-0 px-3 text-slate-700">│</span>
                {tickerItems.map((item, i) => (
                  <span key={`b-${item.id}-${i}`} className="flex items-center gap-1.5 px-4 text-[11px] shrink-0 border-l border-white/[0.04]">
                    <span className={`size-1.5 rounded-full shrink-0 ${
                      item.priority === 'Critical' ? 'bg-red-500' : item.priority === 'High' ? 'bg-amber-500' : 'bg-emerald-500/50'
                    }`} />
                    <span className="text-slate-200 font-medium">{item.crimeType}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{item.district}</span>
                    <span className="text-slate-700 font-mono text-[10px]">{item.fir}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="shrink-0 px-3 sm:px-4 lg:px-6 py-1 bg-amber-500/[0.04] border-b border-amber-500/10 text-center text-[9px] text-amber-300/70">
          Prototype mode — reproducible synthetic FIR data modeled on the supplied KSP ER schema; not live operational data.
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <main id="main-content" className="flex-1 min-h-0 overflow-y-auto custom-scrollbar relative z-[2]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${commandView}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="p-3 sm:p-5 lg:p-7 max-w-[1600px] mx-auto w-full"
            >
              {activeTab === 'dashboard' && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0b121d] p-2">
                  <div className="flex items-center gap-1 rounded-lg bg-black/15 p-1" role="tablist" aria-label="Command workspace views">
                    <button role="tab" aria-selected={commandView === 'overview'} onClick={() => setCommandView('overview')} className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors ${commandView === 'overview' ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-500 hover:text-slate-300'}`}>Command overview</button>
                    <button role="tab" aria-selected={commandView === 'brief'} onClick={() => setCommandView('brief')} className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors ${commandView === 'brief' ? 'bg-amber-500/15 text-amber-200' : 'text-slate-500 hover:text-slate-300'}`}>Morning brief</button>
                  </div>
                  {commandView === 'brief' && <button onClick={() => setShowBriefing(true)} className="rounded-md border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 text-[10px] font-semibold text-amber-200 transition-colors hover:bg-amber-500/[0.13]">Open briefing presentation</button>}
                </div>
              )}
              <TabErrorBoundary tabName={activeTab === 'dashboard' && commandView === 'brief' ? 'Morning Brief' : tabNames[activeTab] || activeTab} key={`${activeTab}-${commandView}`}>
                <Active />
              </TabErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ═══ MODALS & PANELS ═══ */}
        <AlertsPanel
          open={showAlerts}
          onClose={() => setShowAlerts(false)}
          onNavigate={(tab) => { storeSetActiveTab(tab as any); setShowAlerts(false) }}
          alertCount={3 + newAlerts}
        />

        <CommandPalette
          open={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onNavigate={(tab) => { storeSetActiveTab(tab as any) }}
          onOpenChat={() => { setShowCommandPalette(false) }}
          onClearFilter={() => {}}
          activeTab={activeTab}
        />

        <VoiceFirModal open={showVoiceFir} onClose={() => setShowVoiceFir(false)} />
        <FieldFirModal open={showFieldFir} onClose={() => setShowFieldFir(false)} />
        <IntelligenceBriefing open={showBriefing} onClose={() => setShowBriefing(false)} />

        {showAiReport && selectedFirId && (
          <AiReportModal caseRowid={selectedFirId} onClose={() => setShowAiReport(false)} />
        )}

        {showTimeline && selectedFirId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTimeline(false)}
          >
            <div
              className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl border border-white/[0.06] bg-[#0a0f1a] p-5 custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Investigation Timeline</h3>
                <button onClick={() => setShowTimeline(false)} className="text-slate-500 hover:text-white text-sm">✕</button>
              </div>
              <InvestigationTimeline events={[]} />
            </div>
          </div>
        )}

        <HelpWidget />

        <SuspectDossier
          open={dossierOpen}
          onClose={closeDossier}
          suspectName={dossierSuspectName}
          sourceCaseFir={dossierSourceFir}
        />

        <JudgeDemoMode
          open={showJudgeDemo}
          onClose={() => setShowJudgeDemo(false)}
          onOpenCaseCommand={() => { setShowJudgeDemo(false); setShowCaseCommand(true) }}
          onOpenFieldFir={() => { setShowJudgeDemo(false); setShowFieldFir(true) }}
        />
        <CaseCommandCard open={showCaseCommand} onClose={() => setShowCaseCommand(false)} />

        {/* ═══ FOOTER — AI Chat Prominent ═══ */}
        <footer className="shrink-0 relative z-10 border-t border-white/[0.06] bg-[#060a12]/95 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 h-12 sm:h-11">
            {/* Left: Status */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">Prototype session</span>
            </div>

            {/* Center: AI Chat — the star of the footer */}
            <div className="flex-1 max-w-4xl mx-auto">
              <AIChatBar />
            </div>

            {/* Right: Sync */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-600">Synthetic dataset v1</span>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
  )
}
