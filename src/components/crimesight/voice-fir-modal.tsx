'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Mic,
  MicOff,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  ShieldAlert,
  MapPin,
  AlertTriangle,
  Volume2,
  RotateCcw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'

// ===================== Types =====================

interface VoiceFirModalProps {
  open: boolean
  onClose: () => void
  onFirCreated?: () => void
}

interface ParsedFirData {
  crimeType: string
  district: string
  place: string
  description: string
}

interface DistrictOption {
  id: string
  name: string
}

interface CrimeTypeOption {
  ROWID: string
  crime_type_name: string
}

// ===================== Constants =====================

const KARNATAKA_DISTRICTS = [
  'Bagalkote', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
  'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri',
  'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur',
  'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada',
  'Vijayapura', 'Yadgir', 'Vijayanagara',
]

const CRIME_KEYWORDS: Record<string, string[]> = {
  'Theft': ['theft', 'steal', 'stole', 'stolen', 'rob', 'robber', 'pickpocket', 'larceny', 'shoplifting'],
  'Murder': ['murder', 'kill', 'killed', 'homicide', 'assassination', 'assassinate'],
  'Robbery': ['robbery', 'robbed', 'mugged', 'armed robbery', 'loot', 'looted', 'dacoity'],
  'Burglary': ['burglary', 'break-in', 'break in', 'housebreaking', 'trespass'],
  'Assault': ['assault', 'attack', 'beaten', 'beating', 'physical violence', 'grievous hurt'],
  'Fraud': ['fraud', 'cheat', 'cheated', 'scam', 'forgery', 'counterfeit', 'embezzlement'],
  'Cyber Crime': ['cyber', 'hacking', 'online fraud', 'phishing', 'identity theft', 'ransomware', 'online scam'],
  'Drug Offence': ['drug', 'narcotic', 'cocaine', 'heroin', 'ganja', 'marijuana', 'contraband', 'smuggle'],
  'Missing Person': ['missing', 'kidnap', 'kidnapped', 'abducted', 'abduction', 'kidnapping'],
  'Traffic Violation': ['traffic', 'accident', 'hit and run', 'drunk driving', 'speeding', 'road rage', 'rash driving'],
}

const CRIME_TYPES_LIST = Object.keys(CRIME_KEYWORDS)

const COMPLAINT_MODES = ['Written', 'Oral', 'Online', 'Telephone', 'Email']

const STEP_LABELS = ['Record', 'Review', 'Submit']

// ===================== Parser =====================

function parseTranscript(text: string): ParsedFirData {
  const lower = text.toLowerCase()

  // Detect crime type
  let detectedCrimeType = ''
  let maxMatches = 0
  for (const [type, keywords] of Object.entries(CRIME_KEYWORDS)) {
    const matches = keywords.filter(kw => lower.includes(kw)).length
    if (matches > maxMatches) {
      maxMatches = matches
      detectedCrimeType = type
    }
  }

  // Detect district
  let detectedDistrict = ''
  for (const district of KARNATAKA_DISTRICTS) {
    const lowerDistrict = district.toLowerCase()
    if (lower.includes(lowerDistrict)) {
      detectedDistrict = district
      break
    }
    // Handle common name variations
    if (lowerDistrict === 'bengaluru urban' && (lower.includes('bangalore') || lower.includes('bengaluru') || lower.includes('bengaluru city'))) {
      detectedDistrict = 'Bengaluru Urban'
      break
    }
    if (lowerDistrict === 'bengaluru rural' && (lower.includes('bengaluru rural') || lower.includes('bangalore rural'))) {
      detectedDistrict = 'Bengaluru Rural'
      break
    }
    if (lowerDistrict === 'mysuru' && lower.includes('mysore')) {
      detectedDistrict = 'Mysuru'
      break
    }
    if (lowerDistrict === 'kalaburagi' && lower.includes('gulbarga')) {
      detectedDistrict = 'Kalaburagi'
      break
    }
    if (lowerDistrict === 'dakshina kannada' && lower.includes('mangalore')) {
      detectedDistrict = 'Dakshina Kannada'
      break
    }
  }

  // Extract place (look for "at" or "in" followed by a location, excluding district names)
  let detectedPlace = ''
  const placePatterns = [
    /(?:at|in|near|outside|inside|behind|opposite|beside|next to|front of)\s+([A-Z][a-zA-Z\s]{2,30}?)(?:\s*[.,;]|\s+(?:and|the|on|in|at|yesterday|today|last|around|about|they|we|he|she|i |there|then|when|after|before|the |this |that |a |an ))/i,
    /(?:place|location|area|spot|road|street|layout|colony|nagar|pura|halli|kere|gate|circle|junction)\s+(?:is |was |called |named )?([A-Z][a-zA-Z\s]{2,30}?)(?:\s*[.,;]|\s+(?:and|the|on|in|at))/i,
  ]
  for (const pattern of placePatterns) {
    const match = text.match(pattern)
    if (match) {
      const place = match[1].trim()
      // Don't include district name in place
      if (place.toLowerCase() !== detectedDistrict.toLowerCase()) {
        detectedPlace = place
        break
      }
    }
  }

  // Description is the full transcript
  const detectedDescription = text.trim()

  return {
    crimeType: detectedCrimeType,
    district: detectedDistrict,
    place: detectedPlace,
    description: detectedDescription,
  }
}

// ===================== Component =====================

export default function VoiceFirModal({ open, onClose, onFirCreated }: VoiceFirModalProps) {
  const [step, setStep] = useState(0) // 0=Record, 1=Review, 2=Submit
  const [districts, setDistricts] = useState<DistrictOption[]>([])
  const [crimeTypes, setCrimeTypes] = useState<CrimeTypeOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submittedFir, setSubmittedFir] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Editable parsed data
  const [editCrimeType, setEditCrimeType] = useState('')
  const [editDistrict, setEditDistrict] = useState('')
  const [editPlace, setEditPlace] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editComplaintMode, setEditComplaintMode] = useState('Oral')

  // Speech recognition
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    start,
    stop,
    reset,
    error: speechError,
  } = useSpeechRecognition()

  // Fetch reference data on mount
  useEffect(() => {
    if (!open) return
    Promise.all([
      fetch('/api/districts').then(r => r.json()),
      fetch('/api/master/crime-type').then(r => r.json()),
    ]).then(([d, c]) => {
      setDistricts(Array.isArray(d) ? d : Array.isArray(d?.districts) ? d.districts : [])
      setCrimeTypes(Array.isArray(c) ? c : Array.isArray(c?.crimeTypes) ? c.crimeTypes : [])
    }).catch(() => {})
  }, [open])

  // Reset on close
  const handleClose = useCallback(() => {
    reset()
    setStep(0)
    setEditCrimeType('')
    setEditDistrict('')
    setEditPlace('')
    setEditDescription('')
    setEditComplaintMode('Oral')
    setSubmittedFir(null)
    setSubmitError(null)
    onClose()
  }, [onClose, reset])

  // When stopping recording, auto-advance to review
  const handleStopRecording = useCallback(() => {
    stop()
    // Wait a moment for final results to come in
    setTimeout(() => {
      if (transcript.trim()) {
        const parsed = parseTranscript(transcript)
        setEditCrimeType(parsed.crimeType)
        setEditDistrict(parsed.district)
        setEditPlace(parsed.place)
        setEditDescription(parsed.description)
        setEditComplaintMode('Oral')
        setStep(1)
      }
    }, 500)
  }, [stop, transcript])

  // Submit FIR
  const handleSubmit = async () => {
    if (!editCrimeType || !editDistrict) {
      setSubmitError('Crime type and district are required.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/fir/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crimeType: editCrimeType,
          district: editDistrict,
          place: editPlace,
          description: editDescription,
          complaintMode: editComplaintMode,
        }),
      })
      const data = await res.json()

      if (res.ok && data.fir_number) {
        setSubmittedFir(data.fir_number)
        setStep(2)
        onFirCreated?.()
      } else {
        setSubmitError(data.error || 'Failed to create FIR. Please try again.')
      }
    } catch {
      setSubmitError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  // Get district rowid for the parsed district name
  const getDistrictRowid = (districtName: string): string => {
    const found = districts.find(
      d => d.name.toLowerCase() === districtName.toLowerCase()
    )
    return found?.id || ''
  }

  // Get crime type rowid for the parsed crime type
  const getCrimeTypeRowid = (crimeTypeName: string): string => {
    const found = crimeTypes.find(
      c => c.crime_type_name.toLowerCase() === crimeTypeName.toLowerCase()
    )
    return found?.ROWID || ''
  }

  // Check if a parsed value matched
  const hasDistrictMatch = editDistrict && districts.some(d => d.name.toLowerCase() === editDistrict.toLowerCase())
  const hasCrimeTypeMatch = editCrimeType && crimeTypes.some(c => c.crime_type_name.toLowerCase() === editCrimeType.toLowerCase())

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#030712] border-white/[0.08] max-w-lg p-0 overflow-hidden">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-500" />

        {/* Step indicator */}
        <div className="px-6 pt-5 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xs font-bold tracking-[0.2em] text-emerald-400 uppercase flex items-center gap-2">
              <Volume2 className="size-4" />
              Voice FIR — Speech-to-Text Filing
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-1 mt-4">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5 flex-1">
                <div
                  className={`flex items-center justify-center size-6 rounded-full text-[10px] font-bold transition-all duration-300 ${
                    i < step
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : i === step
                        ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-white/[0.04] text-slate-600 border border-white/[0.06]'
                  }`}
                >
                  {i < step ? <CheckCircle2 className="size-3.5" /> : i + 1}
                </div>
                <span className={`text-[9px] tracking-[0.15em] font-semibold uppercase transition-colors ${
                  i <= step ? 'text-slate-400' : 'text-slate-700'
                }`}>
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-px ml-2 transition-colors ${
                    i < step ? 'bg-emerald-500/40' : 'bg-white/[0.06]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="px-6 pb-6 pt-4">
          <AnimatePresence mode="wait">
            {/* ═══ STEP 0: RECORD ═══ */}
            {step === 0 && (
              <motion.div
                key="record"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-5"
              >
                {/* Browser support warning */}
                {!isSupported && (
                  <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-red-400 font-medium">Browser Not Supported</p>
                      <p className="text-[10px] text-red-400/70 mt-0.5">
                        Speech recognition requires Chrome, Edge, or Safari. Please use a supported browser.
                      </p>
                    </div>
                  </div>
                )}

                {/* Speech error */}
                {speechError && (
                  <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-amber-400 font-medium">{speechError}</p>
                    </div>
                  </div>
                )}

                {/* Microphone Button */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {/* Pulse rings when recording */}
                    {isListening && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                        <div className="absolute -inset-3 rounded-full border-2 border-red-500/20 animate-pulse" style={{ animationDuration: '2s' }} />
                        <div className="absolute -inset-6 rounded-full border border-red-500/10 animate-pulse" style={{ animationDuration: '2.5s' }} />
                      </>
                    )}

                    {/* Main mic button */}
                    <button
                      onClick={isListening ? handleStopRecording : start}
                      disabled={!isSupported}
                      className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isListening
                          ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]'
                          : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.25)]'
                      } disabled:opacity-40 disabled:cursor-not-allowed group`}
                    >
                      {isListening ? (
                        <MicOff className="size-10 text-white" />
                      ) : (
                        <Mic className="size-10 text-white group-hover:scale-110 transition-transform" />
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className={`text-xs font-semibold tracking-wider uppercase ${
                      isListening ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {isListening ? 'Recording... Tap to stop' : 'Tap microphone to start'}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      {isListening ? 'Speak naturally — describe the crime, location, and district' : 'Describe the incident in your own words'}
                    </p>
                  </div>
                </div>

                {/* CSS-based waveform visualization */}
                {isListening && (
                  <div className="flex items-center justify-center gap-[3px] h-8" aria-hidden="true">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-[3px] rounded-full bg-emerald-500"
                        animate={{
                          height: [4, Math.random() * 28 + 4, 4],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 0.8 + Math.random() * 0.6,
                          repeat: Infinity,
                          delay: i * 0.05,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Real-time transcript */}
                {(transcript || interimTranscript) && (
                  <div className="w-full bg-black/40 border border-white/[0.06] rounded-lg p-3 min-h-[80px] max-h-[160px] overflow-y-auto custom-scrollbar">
                    <p className="text-[9px] tracking-[0.15em] text-slate-600 font-semibold uppercase mb-1.5 flex items-center gap-1.5">
                      <div className="w-3 h-px bg-emerald-500/30" />
                      Live Transcript
                      {isListening && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse ml-1" />}
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {transcript}
                      {interimTranscript && (
                        <span className="text-slate-500">{interimTranscript}</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Suggestion chips */}
                {!transcript && !isListening && (
                  <div className="w-full">
                    <p className="text-[9px] tracking-[0.15em] text-slate-600 font-semibold uppercase mb-2">Suggested Phrases</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Report a theft in Bengaluru Urban',
                        'Murder case at Mysuru district',
                        'Cyber crime fraud near Jayanagar',
                      ].map(phrase => (
                        <span
                          key={phrase}
                          className="text-[10px] text-slate-500 bg-white/[0.03] border border-white/[0.06] rounded-full px-2.5 py-1"
                        >
                          &quot;{phrase}&quot;
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ STEP 1: REVIEW ═══ */}
            {step === 1 && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Parsed confidence badges */}
                <div className="flex flex-wrap gap-1.5">
                  {editCrimeType && (
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-2 py-0.5 ${hasCrimeTypeMatch ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/40 text-amber-400 bg-amber-500/10'}`}
                    >
                      <ShieldAlert className="size-2.5 mr-1" />
                      {editCrimeType}
                      {hasCrimeTypeMatch ? ' ✓' : ' ?'}
                    </Badge>
                  )}
                  {editDistrict && (
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-2 py-0.5 ${hasDistrictMatch ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/40 text-amber-400 bg-amber-500/10'}`}
                    >
                      <MapPin className="size-2.5 mr-1" />
                      {editDistrict}
                      {hasDistrictMatch ? ' ✓' : ' ?'}
                    </Badge>
                  )}
                  {editPlace && (
                    <Badge variant="outline" className="text-[9px] px-2 py-0.5 border-cyan-500/40 text-cyan-400 bg-cyan-500/10">
                      {editPlace}
                    </Badge>
                  )}
                </div>

                {/* Crime Type */}
                <div>
                  <Label className="text-[9px] tracking-wider text-slate-500 uppercase mb-1.5 block">Crime Type</Label>
                  <Select value={getCrimeTypeRowid(editCrimeType)} onValueChange={v => {
                    const found = crimeTypes.find(c => c.ROWID === v)
                    if (found) setEditCrimeType(found.crime_type_name)
                  }}>
                    <SelectTrigger className="h-9 bg-black/40 border-white/[0.06] text-xs text-slate-300 rounded">
                      <SelectValue placeholder={editCrimeType || 'Select crime type'} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f1a] border-white/[0.08]">
                      {crimeTypes.map(c => (
                        <SelectItem key={c.ROWID} value={c.ROWID} className="text-xs">
                          {c.crime_type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!editCrimeType && (
                    <p className="text-[9px] text-amber-400/70 mt-1">No crime type detected — please select manually</p>
                  )}
                </div>

                {/* District */}
                <div>
                  <Label className="text-[9px] tracking-wider text-slate-500 uppercase mb-1.5 block">District</Label>
                  <Select value={getDistrictRowid(editDistrict)} onValueChange={v => {
                    const found = districts.find(d => d.id === v)
                    if (found) setEditDistrict(found.name)
                  }}>
                    <SelectTrigger className="h-9 bg-black/40 border-white/[0.06] text-xs text-slate-300 rounded">
                      <SelectValue placeholder={editDistrict || 'Select district'} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f1a] border-white/[0.08]">
                      {districts.map(d => (
                        <SelectItem key={d.id} value={d.id} className="text-xs">
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!editDistrict && (
                    <p className="text-[9px] text-amber-400/70 mt-1">No district detected — please select manually</p>
                  )}
                </div>

                {/* Place */}
                <div>
                  <Label className="text-[9px] tracking-wider text-slate-500 uppercase mb-1.5 block">Location / Place</Label>
                  <Input
                    value={editPlace}
                    onChange={e => setEditPlace(e.target.value)}
                    placeholder="Incident location..."
                    className="h-9 bg-black/40 border-white/[0.06] text-xs text-slate-300 font-mono placeholder:text-slate-700 rounded"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-[9px] tracking-wider text-slate-500 uppercase mb-1.5 block">Description (Full Transcript)</Label>
                  <Textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="Incident description..."
                    className="min-h-[80px] bg-black/40 border-white/[0.06] text-xs text-slate-300 font-mono placeholder:text-slate-700 rounded resize-none"
                  />
                </div>

                {/* Complaint Mode */}
                <div>
                  <Label className="text-[9px] tracking-wider text-slate-500 uppercase mb-1.5 block">Complaint Mode</Label>
                  <Select value={editComplaintMode} onValueChange={setEditComplaintMode}>
                    <SelectTrigger className="h-9 bg-black/40 border-white/[0.06] text-xs text-slate-300 rounded">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f1a] border-white/[0.08]">
                      {COMPLAINT_MODES.map(m => (
                        <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Error */}
                {submitError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-400">{submitError}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ STEP 2: SUCCESS ═══ */}
            {step === 2 && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-4 py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center"
                >
                  <CheckCircle2 className="size-8 text-emerald-400" />
                </motion.div>

                <div className="text-center">
                  <p className="text-sm font-bold text-emerald-400 tracking-wider uppercase">FIR Filed Successfully</p>
                  <p className="text-[10px] text-slate-500 mt-1">Your voice FIR has been registered in the system</p>
                </div>

                <div className="w-full bg-black/40 border border-emerald-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] tracking-[0.15em] text-slate-600 font-semibold uppercase">FIR Number</p>
                      <p className="text-lg font-mono font-bold text-emerald-400 tracking-wider mt-0.5">{submittedFir}</p>
                    </div>
                    <FileText className="size-10 text-emerald-500/20" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.04] grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[8px] tracking-[0.1em] text-slate-600 uppercase">Crime Type</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">{editCrimeType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] tracking-[0.1em] text-slate-600 uppercase">District</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">{editDistrict || '-'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-5 pt-0 flex items-center justify-between gap-2 border-t border-white/[0.04]">
          <div>
            {step === 0 && (
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-[10px] text-slate-500 hover:text-slate-300 h-8 px-3"
              >
                CANCEL
              </Button>
            )}
            {step === 1 && (
              <Button
                variant="ghost"
                onClick={() => {
                  reset()
                  setStep(0)
                  setSubmitError(null)
                }}
                className="text-[10px] text-slate-500 hover:text-slate-300 h-8 px-3"
              >
                <RotateCcw className="size-3 mr-1" />
                RE-RECORD
              </Button>
            )}
            {step === 2 && (
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-[10px] text-slate-500 hover:text-slate-300 h-8 px-3"
              >
                CLOSE
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 0 && transcript && !isListening && (
              <Button
                onClick={handleStopRecording}
                className="h-8 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold tracking-wider rounded shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                REVIEW &gt;
              </Button>
            )}
            {step === 1 && (
              <Button
                onClick={handleSubmit}
                disabled={submitting || !editCrimeType || !editDistrict}
                className="h-8 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold tracking-wider rounded shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                {submitting ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="size-3.5 mr-1.5" />
                )}
                FILE FIR
              </Button>
            )}
            {step === 2 && (
              <Button
                onClick={handleClose}
                className="h-8 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold tracking-wider rounded shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                <CheckCircle2 className="size-3.5 mr-1.5" />
                DONE
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
