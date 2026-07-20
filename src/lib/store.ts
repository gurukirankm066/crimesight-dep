import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchGovernedReviewActions, isGovernedReviewApiConfigured, saveGovernedReviewAction } from '@/lib/governed-review-client'
import { fetchFieldFirReports, isFieldFirApiConfigured, submitFieldFir, type FieldFirSubmission } from '@/lib/field-fir-client'

export type TabValue = 'map' | 'dashboard' | 'trends' | 'network' | 'most-wanted' | 'cases' | 'ai' | 'brief' | 'operations'

// ── Field FIR Types ──
export type FieldFirStatus = 'Submitted' | 'Under Review' | 'Assigned' | 'Under Investigation' | 'Charge Sheet Filed' | 'Closed'

export interface FieldFirPhoto {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string // base64
  timestamp: string
}

export interface FieldFirReport {
  id: string
  fir: string
  officerName: string
  badgeNumber: string
  district: string
  policeStation: string
  crimeType: string
  place: string
  description: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  status: FieldFirStatus
  photos: FieldFirPhoto[]
  submittedAt: string
  assignedTo?: string
  lastStatusUpdate?: string
  isSample?: boolean
  source?: 'local' | 'catalyst'
  correlationId?: string
}

export type ReviewStatus = 'Approved' | 'Needs evidence'

export interface ReviewAction {
  firId: string
  fir: string
  status: ReviewStatus
  actor: string
  reason: string
  recordedAt: string
  evidenceRequirement?: string
  source?: 'local' | 'catalyst'
  correlationId?: string
}

interface CrimeSightState {
  // ── Navigation ──
  activeTab: TabValue
  setActiveTab: (tab: TabValue) => void

  // ── Cross-Tab Selections ──
  selectedFirId: string | null
  setSelectedFir: (id: string | null) => void
  navigateToFir: (id: string) => void

  selectedDistrict: string | null  // district ROWID
  setSelectedDistrict: (id: string | null) => void
  navigateToDistrict: (id: string) => void

  selectedSuspectName: string | null
  setSelectedSuspect: (name: string | null) => void
  navigateToSuspect: (name: string) => void

  // ── Narrative Arc Navigation ──
  activeNarrativeArc: string | null  // arc id (e.g. 'operation-black-lotus')
  setActiveNarrativeArc: (id: string | null) => void
  /** Navigate to Network tab and highlight this arc's cluster */
  navigateToArcNetwork: (arcId: string) => void
  /** Navigate to Cases tab and filter to this arc's FIRs */
  navigateToArcCases: (arcId: string) => void
  /** Navigate to Cases tab and auto-expand a specific FIR within an arc */
  navigateToArcFir: (arcId: string, firId: string) => void
  /** Clear all arc-related selections */
  clearArcSelection: () => void

  // ── Network Search ──
  networkSearchQuery: string
  setNetworkSearchQuery: (q: string) => void
  navigateToNetworkSearch: (q: string) => void

  // ── Ticker ──
  tickerItems: TickerItem[]
  setTickerItems: (items: TickerItem[]) => void

  // ── Live Feed ──
  lastAlertTime: string | null
  setLastAlertTime: (time: string) => void

  // ── Live Pulse (incremented when a new "case" arrives) ──
  livePulseCount: number
  incrementLivePulse: () => void

  // ── Date Range Filter ──
  dateFrom: string  // ISO date string or '' for no filter
  dateTo: string    // ISO date string or '' for no filter
  setDateRange: (from: string, to: string) => void
  clearDateRange: () => void

  // ── Suspect Dossier ──
  dossierOpen: boolean
  dossierSuspectName: string
  dossierSourceFir: string
  openDossier: (name: string, sourceFir?: string) => void
  closeDossier: () => void

  // ── Field FIR Reports ──
  fieldFirReports: FieldFirReport[]
  fieldFirStorage: 'local' | 'syncing' | 'catalyst' | 'unavailable'
  hydrateFieldFirReports: () => Promise<void>
  addFieldFir: (report: Omit<FieldFirReport, 'id' | 'fir' | 'submittedAt' | 'status' | 'lastStatusUpdate' | 'source' | 'correlationId'>) => Promise<FieldFirReport>
  updateFieldFirStatus: (id: string, status: FieldFirStatus, assignedTo?: string) => void
  showFieldFirsOnly: boolean
  setShowFieldFirsOnly: (v: boolean) => void
  fieldFirBadgeCount: number

  // ── Governed Review Workflow ──
  reviewActions: ReviewAction[]
  reviewStorage: 'local' | 'syncing' | 'catalyst' | 'unavailable'
  hydrateReviewActions: () => Promise<void>
  recordReviewAction: (action: Omit<ReviewAction, 'recordedAt' | 'source' | 'correlationId'>) => Promise<void>
}

export interface TickerItem {
  id: string
  fir: string
  district: string
  crimeType: string
  priority: string
  status: string
  date: string
}

// ── Sample Field FIR Reports (pre-populated for demo) ──

const hoursAgo = (h: number) => {
  const d = new Date()
  d.setHours(d.getHours() - h)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

const SAMPLE_FIELD_FIRS: FieldFirReport[] = [
  {
    id: 'FIELD-SAMPLE-1',
    fir: 'FIR/2026/KSP/FIELD-00001',
    officerName: 'PSI Ravi Kumar',
    badgeNumber: 'KA-PSI-2847',
    district: 'Bengaluru Urban',
    policeStation: 'Koramangala PS',
    crimeType: 'Chain Snatching',
    place: '80 Feet Road, Koramangala 4th Block, Near Forum Mall',
    description: 'Victim Smt. Lakshmi Devi (62F) reported that an unidentified male pillion rider snatched her gold chain (approx 20g, worth ₹1.2L) while she was walking on the footpath. CCTV footage available from nearby ATM. Rider was on a black Honda Activa, KA-01-EM-4521.',
    priority: 'High',
    status: 'Under Investigation',
    photos: [],
    submittedAt: hoursAgo(2),
    assignedTo: 'CI Priya Sharma',
    lastStatusUpdate: hoursAgo(1),
    isSample: true,
  },
  {
    id: 'FIELD-SAMPLE-2',
    fir: 'FIR/2026/KSP/FIELD-00002',
    officerName: 'PSI Mohan Das',
    badgeNumber: 'KA-PSI-1923',
    district: 'Mysuru',
    policeStation: 'Nazarbad PS',
    crimeType: 'Vehicle Theft',
    place: 'KSRTC Bus Stand Parking, Mysuru',
    description: 'Complainant Shri. Arun Prasad reported his Maruti Swift (KA-09-M-7823, white, reg 2022) stolen from KSRTC bus stand parking between 22:00-06:00 hrs. CCTV from 3 cameras being collected. Possible repeat offender — similar MO in 2 previous cases.',
    priority: 'Medium',
    status: 'Assigned',
    photos: [],
    submittedAt: hoursAgo(5),
    assignedTo: 'CI Suresh Babu',
    lastStatusUpdate: hoursAgo(3),
    isSample: true,
  },
  {
    id: 'FIELD-SAMPLE-3',
    fir: 'FIR/2026/KSP/FIELD-00003',
    officerName: 'PSI Kavitha R',
    badgeNumber: 'KA-PSI-3301',
    district: 'Mangaluru',
    policeStation: 'Pandeshwar PS',
    crimeType: 'Cyber Crime',
    place: 'Flat 302, Sapphire Residency, Kadri Hills, Mangaluru',
    description: 'Victim Dr. Rajesh Shetty (45M) fell prey to online investment fraud. Lost ₹4.8L through a fake stock trading app "QuickReturns Pro". Multiple UPI transactions to 3 different accounts traced. Bank freezing request initiated.',
    priority: 'High',
    status: 'Submitted',
    photos: [],
    submittedAt: hoursAgo(1),
    isSample: true,
  },
  {
    id: 'FIELD-SAMPLE-4',
    fir: 'FIR/2026/KSP/FIELD-00004',
    officerName: 'PSI Venkatesh G',
    badgeNumber: 'KA-PSI-2156',
    district: 'Hubballi-Dharwad',
    policeStation: 'Vidyanagar PS',
    crimeType: 'Assault',
    place: 'Old Hubli Market Area, near Dajiba Pit',
    description: 'Two groups clashed over shop ownership dispute. 3 persons injured — one with head injury admitted to KIMS Hospital. Situation controlled by patrol party. 5 persons detained. Mobile phones seized as evidence.',
    priority: 'Critical',
    status: 'Under Review',
    photos: [],
    submittedAt: hoursAgo(8),
    assignedTo: 'CI Ramesh Gowda',
    lastStatusUpdate: hoursAgo(4),
    isSample: true,
  },
  {
    id: 'FIELD-SAMPLE-5',
    fir: 'FIR/2026/KSP/FIELD-00005',
    officerName: 'PSI Lakshmi N',
    badgeNumber: 'KA-PSI-4012',
    district: 'Tumakuru',
    policeStation: 'Kyathsandra PS',
    crimeType: 'Burglary',
    place: 'No. 42, 2nd Cross, GVK Layout, Tumakuru',
    description: 'House broken into during daytime (owner at work). Gold ornaments worth ₹85,000, one laptop (Dell Inspiron), and ₹12,000 cash stolen. Entry through rear window — lock broken with iron rod. Fingerprints lifted from window frame and almirah.',
    priority: 'Medium',
    status: 'Under Investigation',
    photos: [],
    submittedAt: hoursAgo(12),
    assignedTo: 'CI Mahesh Kumar',
    lastStatusUpdate: hoursAgo(6),
    isSample: true,
  },
  {
    id: 'FIELD-SAMPLE-6',
    fir: 'FIR/2026/KSP/FIELD-00006',
    officerName: 'PSI Abdul Khader',
    badgeNumber: 'KA-PSI-1789',
    district: 'Belagavi',
    policeStation: 'Camp PS',
    crimeType: 'Rioting',
    place: 'Raviwar Peth, Belagavi — near Maruti Galli Junction',
    description: 'Communal tension erupted following a social media post. Stone pelting reported from both groups. 2 shops damaged. Police deployed in strength. Section 144 CrPC imposed in the area. 8 persons taken into preventive custody. Situation being monitored.',
    priority: 'Critical',
    status: 'Submitted',
    photos: [],
    submittedAt: hoursAgo(3),
    isSample: true,
  },
]

export const useCrimeSightStore = create<CrimeSightState>()(persist((set, get) => ({
  // ── Navigation ──
  activeTab: 'map',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── FIR Selection ──
  selectedFirId: null,
  setSelectedFir: (id) => set({ selectedFirId: id }),
  navigateToFir: (id) => set({ selectedFirId: id, activeTab: 'cases' }),

  // ── District Selection ──
  selectedDistrict: null,
  setSelectedDistrict: (id) => set({ selectedDistrict: id }),
  navigateToDistrict: (id) => set({ selectedDistrict: id, activeTab: 'map' }),

  // ── Suspect Selection ──
  selectedSuspectName: null,
  setSelectedSuspect: (name) => set({ selectedSuspectName: name }),
  navigateToSuspect: (name) => set({ selectedSuspectName: name, activeTab: 'network' }),

  // ── Narrative Arc Navigation ──
  activeNarrativeArc: null,
  setActiveNarrativeArc: (id) => set({ activeNarrativeArc: id }),
  navigateToArcNetwork: (arcId) => set({ activeNarrativeArc: arcId, activeTab: 'network' }),
  navigateToArcCases: (arcId) => set({ activeNarrativeArc: arcId, selectedFirId: null, activeTab: 'cases' }),
  navigateToArcFir: (arcId, firId) => set({ activeNarrativeArc: arcId, selectedFirId: firId, activeTab: 'cases' }),
  clearArcSelection: () => set({ activeNarrativeArc: null }),

  // ── Network Search ──
  networkSearchQuery: '',
  setNetworkSearchQuery: (q) => set({ networkSearchQuery: q }),
  navigateToNetworkSearch: (q) => set({ networkSearchQuery: q, activeTab: 'network' }),

  // ── Ticker ──
  tickerItems: [],
  setTickerItems: (items) => set({ tickerItems: items }),

  // ── Live Feed ──
  lastAlertTime: null,
  setLastAlertTime: (time) => set({ lastAlertTime: time }),

  // ── Live Pulse ──
  livePulseCount: 0,
  incrementLivePulse: () => set({ livePulseCount: Math.random() }),

  // ── Date Range Filter ──
  dateFrom: '',
  dateTo: '',
  setDateRange: (from, to) => set({ dateFrom: from, dateTo: to }),
  clearDateRange: () => set({ dateFrom: '', dateTo: '' }),

  // ── Suspect Dossier ──
  dossierOpen: false,
  dossierSuspectName: '',
  dossierSourceFir: '',
  openDossier: (name, sourceFir) => set({ dossierOpen: true, dossierSuspectName: name, dossierSourceFir: sourceFir ?? '' }),
  closeDossier: () => set({ dossierOpen: false, dossierSuspectName: '', dossierSourceFir: '' }),

  // ── Field FIR Reports ──
  fieldFirReports: SAMPLE_FIELD_FIRS,
  fieldFirStorage: isFieldFirApiConfigured() ? 'syncing' : 'local',
  hydrateFieldFirReports: async () => {
    if (!isFieldFirApiConfigured()) return
    try {
      const reports = await fetchFieldFirReports()
      set((state) => ({
        fieldFirReports: [
          ...reports.map(report => ({ ...report, source: 'catalyst' as const })),
          ...state.fieldFirReports.filter(local => !reports.some(remote => remote.id === local.id)),
        ],
        fieldFirStorage: 'catalyst',
      }))
    } catch {
      set({ fieldFirStorage: 'unavailable' })
    }
  },
  addFieldFir: async (report) => {
    const localReport = (() => {
      const state = get()
      const id = `FIELD-${Date.now()}`
      const seq = String(state.fieldFirReports.length + 1).padStart(5, '0')
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
      return {
        ...report,
        id,
        fir: `FIR/2026/KSP/FIELD-${seq}`,
        submittedAt: now,
        status: 'Submitted' as const,
        lastStatusUpdate: now,
        source: 'local' as const,
      }
    })()
    set((state) => ({ fieldFirReports: [localReport, ...state.fieldFirReports] }))

    if (!isFieldFirApiConfigured()) return localReport
    try {
      const saved = await submitFieldFir(report as FieldFirSubmission)
      const remoteReport = { ...saved, source: 'catalyst' as const }
      set((state) => ({
        fieldFirReports: [remoteReport, ...state.fieldFirReports.filter(existing => existing.id !== localReport.id)],
        fieldFirStorage: 'catalyst',
      }))
      return remoteReport
    } catch {
      set({ fieldFirStorage: 'unavailable' })
      return localReport
    }
  },
  updateFieldFirStatus: (id, status, assignedTo) => set((s) => ({
    fieldFirReports: s.fieldFirReports.map(r =>
      r.id === id ? { ...r, status, assignedTo: assignedTo ?? r.assignedTo, lastStatusUpdate: new Date().toISOString().replace('T', ' ').slice(0, 19) } : r
    ),
  })),
  showFieldFirsOnly: false,
  setShowFieldFirsOnly: (v) => set({ showFieldFirsOnly: v }),
  fieldFirBadgeCount: 3, // Sample count with 'Submitted' status

  // ── Governed Review Workflow ──
  reviewActions: [],
  reviewStorage: isGovernedReviewApiConfigured() ? 'syncing' : 'local',
  hydrateReviewActions: async () => {
    if (!isGovernedReviewApiConfigured()) return

    try {
      const actions = await fetchGovernedReviewActions()
      set((state) => ({
        reviewActions: [
          ...actions.map(action => ({ ...action, source: 'catalyst' as const })),
          ...state.reviewActions.filter(local => !actions.some(remote => remote.firId === local.firId)),
        ].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()).slice(0, 25),
        reviewStorage: 'catalyst',
      }))
    } catch {
      set({ reviewStorage: 'unavailable' })
    }
  },
  recordReviewAction: async (action) => {
    const localAction: ReviewAction = { ...action, recordedAt: new Date().toISOString(), source: 'local' }
    set((state) => ({
      reviewActions: [localAction, ...state.reviewActions.filter(existing => existing.firId !== action.firId)].slice(0, 25),
    }))

    if (!isGovernedReviewApiConfigured()) return

    try {
      const saved = await saveGovernedReviewAction(action)
      set((state) => ({
        reviewActions: [
          { ...saved, source: 'catalyst' as const },
          ...state.reviewActions.filter(existing => existing.firId !== action.firId),
        ].slice(0, 25),
        reviewStorage: 'catalyst',
      }))
    } catch {
      set({ reviewStorage: 'unavailable' })
    }
  },
}), {
  name: 'crimesight-prototype-review-v1',
  partialize: (state) => ({ reviewActions: state.reviewActions }),
}))
