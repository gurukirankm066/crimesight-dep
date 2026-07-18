'use client'

import { useState, useRef, useCallback } from 'react'
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
  User,
  Shield,
  MapPin,
  FileText,
  Camera,
  X,
  Loader2,
  Upload,
  AlertCircle,
  ImagePlus,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useCrimeSightStore, type FieldFirPhoto } from '@/lib/store'

// ===================== Types =====================

interface FieldFirModalProps {
  open: boolean
  onClose: () => void
}

interface PhotoEntry {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string
}

// ===================== Constants =====================

const KARNATAKA_DISTRICTS = [
  'Bagalkote',
  'Ballari',
  'Belagavi',
  'Bengaluru Rural',
  'Bengaluru Urban',
  'Bidar',
  'Chamarajanagar',
  'Chikkaballapur',
  'Chikkamagaluru',
  'Chitradurga',
  'Dakshina Kannada',
  'Davanagere',
  'Dharwad',
  'Gadag',
  'Hassan',
  'Haveri',
  'Kalaburagi',
  'Kodagu',
  'Kolar',
  'Koppal',
  'Mandya',
  'Mysuru',
  'Raichur',
  'Ramanagara',
  'Shivamogga',
  'Tumakuru',
  'Udupi',
  'Uttara Kannada',
  'Vijayapura',
  'Yadgir',
  'Vijayanagara',
  'Hubballi-Dharwad',
]

const CRIME_TYPES = [
  'Theft',
  'Assault',
  'Cyber Crime',
  'Cheating',
  'Fraud',
  'Vehicle Theft',
  'Burglary',
  'Robbery',
  'Chain Snatching',
  'Murder',
  'Drug Offence',
  'Missing Person',
  'Rape',
  'Kidnapping',
  'Rioting',
  'Road Accident',
  'Others',
]

const PRIORITIES: Array<'Low' | 'Medium' | 'High' | 'Critical'> = [
  'Low',
  'Medium',
  'High',
  'Critical',
]

const MAX_PHOTOS = 5
const MAX_IMAGE_DIMENSION = 800

// ===================== Helpers =====================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Compress / resize an image using canvas to max 800px on longest side */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.onload = () => {
        let { width, height } = img
        if (width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION) {
          // No resize needed, return original data URL
          resolve(reader.result as string)
          return
        }
        const ratio = Math.min(
          MAX_IMAGE_DIMENSION / width,
          MAX_IMAGE_DIMENSION / height
        )
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context unavailable'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ===================== Component =====================

export default function FieldFirModal({ open, onClose }: FieldFirModalProps) {
  const addFieldFir = useCrimeSightStore((s) => s.addFieldFir)

  // ── Form State ──
  const [officerName, setOfficerName] = useState('')
  const [badgeNumber, setBadgeNumber] = useState('')
  const [district, setDistrict] = useState('')
  const [policeStation, setPoliceStation] = useState('')
  const [crimeType, setCrimeType] = useState('')
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium')
  const [place, setPlace] = useState('')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<PhotoEntry[]>([])

  // ── UI State ──
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Validation ──
  const requiredFields: Record<string, string> = {
    officerName,
    badgeNumber,
    district,
    policeStation,
    place,
    description,
  }

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value.trim()) {
        newErrors[key] = true
      }
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill all required fields')
      return false
    }
    return true
  }

  // ── Photo Handlers ──
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return

      const remaining = MAX_PHOTOS - photos.length
      if (remaining <= 0) return

      const filesToProcess = Array.from(files).slice(0, remaining)

      const newPhotos: PhotoEntry[] = []
      for (const file of filesToProcess) {
        try {
          const dataUrl = await compressImage(file)
          newPhotos.push({
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl,
          })
        } catch {
          // Skip failed files silently
        }
      }

      setPhotos((prev) => [...prev, ...newPhotos])

      // Reset input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [photos.length]
  )

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!validate()) return

    setSubmitting(true)

    // Small delay for UX feedback
    await new Promise((r) => setTimeout(r, 600))

    const storePhotos: FieldFirPhoto[] = photos.map((p) => ({
      id: p.id,
      name: p.name,
      size: p.size,
      type: p.type,
      dataUrl: p.dataUrl,
      timestamp: new Date().toISOString(),
    }))

    addFieldFir({
      officerName: officerName.trim(),
      badgeNumber: badgeNumber.trim(),
      district,
      policeStation: policeStation.trim(),
      crimeType: crimeType || 'Others',
      priority,
      place: place.trim(),
      description: description.trim(),
      photos: storePhotos,
    })

    // Derive the FIR number that was just generated
    const currentCount = useCrimeSightStore.getState().fieldFirReports.length
    const fir = `FIR/2026/KSP/FIELD-${String(currentCount).padStart(5, '0')}`

    toast.success(`Field FIR submitted — ${fir}`)

    // Reset form
    setOfficerName('')
    setBadgeNumber('')
    setDistrict('')
    setPoliceStation('')
    setCrimeType('')
    setPriority('Medium')
    setPlace('')
    setDescription('')
    setPhotos([])
    setErrors({})
    setSubmitting(false)
    onClose()
  }, [
    validate,
    officerName,
    badgeNumber,
    district,
    policeStation,
    crimeType,
    priority,
    place,
    description,
    photos,
    addFieldFir,
    onClose,
  ])

  // ── Clear Errors on Input Change ──
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // ===================== Render =====================

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-[#0d1424] border-white/10 p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* ── Header ── */}
        <DialogHeader className="p-5 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-slate-100 tracking-tight">
                  Submit Field FIR
                </DialogTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  File a First Information Report from the field
                </p>
              </div>
            </div>
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] font-semibold px-2 py-0.5 tracking-wider">
              FIELD REPORT
            </Badge>
          </div>
        </DialogHeader>

        {/* ── Form Body ── */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* ── Officer Details ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Officer Details
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Officer Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  placeholder="Enter name"
                  value={officerName}
                  onChange={(e) => {
                    setOfficerName(e.target.value)
                    clearError('officerName')
                  }}
                  className={`h-9 text-xs bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 ${
                    errors.officerName ? 'border-red-500/60' : ''
                  }`}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Badge Number <span className="text-red-400">*</span>
                </Label>
                <Input
                  placeholder="KA-PSI-XXXX"
                  value={badgeNumber}
                  onChange={(e) => {
                    setBadgeNumber(e.target.value)
                    clearError('badgeNumber')
                  }}
                  className={`h-9 text-xs bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 ${
                    errors.badgeNumber ? 'border-red-500/60' : ''
                  }`}
                />
              </div>
            </div>
          </section>

          {/* ── Incident Details ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Incident Details
              </span>
            </div>

            {/* District + Police Station row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  District <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={district}
                  onValueChange={(v) => {
                    setDistrict(v)
                    clearError('district')
                  }}
                >
                  <SelectTrigger
                    className={`h-9 text-xs bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 ${
                      errors.district ? 'border-red-500/60' : ''
                    }`}
                  >
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-white/10 max-h-60 overflow-y-auto">
                    {KARNATAKA_DISTRICTS.map((d) => (
                      <SelectItem
                        key={d}
                        value={d}
                        className="text-xs text-slate-200 focus:bg-emerald-500/10 focus:text-emerald-300"
                      >
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Police Station <span className="text-red-400">*</span>
                </Label>
                <Input
                  placeholder="Station name"
                  value={policeStation}
                  onChange={(e) => {
                    setPoliceStation(e.target.value)
                    clearError('policeStation')
                  }}
                  className={`h-9 text-xs bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 ${
                    errors.policeStation ? 'border-red-500/60' : ''
                  }`}
                />
              </div>
            </div>

            {/* Crime Type + Priority row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Crime Type
                </Label>
                <Select value={crimeType} onValueChange={setCrimeType}>
                  <SelectTrigger className="h-9 text-xs bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-white/10 max-h-60 overflow-y-auto">
                    {CRIME_TYPES.map((ct) => (
                      <SelectItem
                        key={ct}
                        value={ct}
                        className="text-xs text-slate-200 focus:bg-emerald-500/10 focus:text-emerald-300"
                      >
                        {ct}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Priority
                </Label>
                <Select
                  value={priority}
                  onValueChange={(v) =>
                    setPriority(v as 'Low' | 'Medium' | 'High' | 'Critical')
                  }
                >
                  <SelectTrigger className="h-9 text-xs bg-white/5 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-white/10">
                    {PRIORITIES.map((p) => (
                      <SelectItem
                        key={p}
                        value={p}
                        className="text-xs text-slate-200 focus:bg-emerald-500/10 focus:text-emerald-300"
                      >
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Place of Occurrence */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Place of Occurrence <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="Full address or landmark"
                value={place}
                onChange={(e) => {
                  setPlace(e.target.value)
                  clearError('place')
                }}
                className={`h-9 text-xs bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 ${
                  errors.place ? 'border-red-500/60' : ''
                }`}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Description <span className="text-red-400">*</span>
              </Label>
              <Textarea
                placeholder="Describe the incident in detail..."
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  clearError('description')
                }}
                className={`text-xs bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 resize-none min-h-[72px] ${
                  errors.description ? 'border-red-500/60' : ''
                }`}
              />
            </div>
          </section>

          {/* ── Evidence Photos ── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Evidence Photos
                </span>
              </div>
              {photos.length > 0 && (
                <span className="text-[10px] text-slate-500 font-medium tabular-nums">
                  {photos.length}/{MAX_PHOTOS} photos
                </span>
              )}
            </div>

            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              disabled={photos.length >= MAX_PHOTOS}
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-9 text-xs bg-white/5 border-white/10 border-dashed text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors gap-2"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              {photos.length >= MAX_PHOTOS
                ? 'Maximum photos reached'
                : 'Upload Photos'}
            </Button>

            {/* Thumbnail Grid */}
            <AnimatePresence mode="popLayout">
              {photos.length > 0 && (
                <motion.div
                  layout
                  className="flex flex-wrap gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {photos.map((photo) => (
                    <motion.div
                      key={photo.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative group"
                    >
                      {/* Preview */}
                      <div className="w-16 h-16 rounded-md overflow-hidden border border-white/10">
                        <img
                          src={photo.dataUrl}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Size label */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-1 py-0.5">
                        <span className="text-[8px] text-slate-300 tabular-nums leading-none">
                          {formatFileSize(photo.size)}
                        </span>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/90 hover:bg-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="p-5 pt-4 border-t border-white/5">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold tracking-wide transition-colors gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Submit Field FIR
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}