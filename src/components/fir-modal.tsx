'use client'

import { Shield, X, Printer, FileCheck, MapPin, Calendar, User, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface FirData {
  crimeNo?: string
  caseNo?: string
  stationName?: string
  districtName?: string
  registeredDate?: string
  actSection?: string
  crimeCategory?: string
  briefFacts?: string
  complainantName?: string
  accusedName?: string
  victimName?: string
  statusName?: string
  officerName?: string
  officerKgid?: string
}

export function FirModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean
  onClose: () => void
  data: FirData | null
}) {
  if (!isOpen || !data) return null

  const crimeNo = data.crimeNo || 'FIR-2025-001'
  const caseNo = data.caseNo || '202500001'
  const station = data.stationName || 'Whitefield Police Station'
  const district = data.districtName || 'Bengaluru Urban'
  const dateStr = data.registeredDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const actSec = data.actSection || 'IPC Section 379 (Theft)'
  const category = data.crimeCategory || 'Property Crime'
  const facts = data.briefFacts || 'Complainant reported theft of belongings. Station House Officer initiated investigation under Section 154 Cr.P.C.'
  const complainant = data.complainantName || 'Sri. Anant Kumar'
  const accused = data.accusedName || 'Unknown Suspects (A1)'
  const victim = data.victimName || 'Sri. Anant Kumar'
  const status = data.statusName || 'Under Investigation'
  const officer = data.officerName || 'Inspector Ravi Kumar'
  const kgid = data.officerKgid || 'KGID-2018-0101'

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="no-print p-4 bg-muted/40 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Shield className="h-4 w-4" /> Karnataka State Police — Official FIR View
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => window.print()} className="h-8 gap-1.5 text-xs">
              <Printer className="h-3.5 w-3.5" /> Print FIR
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Printable FIR Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-foreground bg-background font-sans leading-relaxed">
          {/* Header Banner */}
          <div className="border-b-2 border-primary/40 pb-4 text-center space-y-1">
            <div className="flex justify-center mb-1">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md">
                <Shield className="h-7 w-7" />
              </div>
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wide text-primary">KARNATAKA STATE POLICE</h2>
            <h3 className="text-sm font-semibold text-foreground/90">FIRST INFORMATION REPORT (Form-1)</h3>
            <p className="text-[11px] text-muted-foreground">(Under Section 154 of Code of Criminal Procedure, 1973)</p>
          </div>

          {/* Key Reference Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 p-3.5 rounded-xl border border-border/50 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium uppercase">District</span>
              <span className="font-semibold text-foreground">{district}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium uppercase">Police Station</span>
              <span className="font-semibold text-foreground">{station}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium uppercase">FIR Number</span>
              <span className="font-mono font-bold text-primary">{crimeNo}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium uppercase">Registration Date</span>
              <span className="font-semibold text-foreground">{dateStr}</span>
            </div>
          </div>

          {/* Section 1: Acts & Offences */}
          <div className="space-y-2 border-t pt-4">
            <h4 className="text-xs font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5" /> 1. Acts & Sections Invoked
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-card p-3 rounded-lg border">
              <div>
                <span className="text-muted-foreground">Act & Section: </span>
                <span className="font-mono font-semibold">{actSec}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Crime Category: </span>
                <span className="font-semibold">{category}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Parties Involved */}
          <div className="space-y-2 border-t pt-4">
            <h4 className="text-xs font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> 2. Particulars of Parties
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-muted/20 p-3 rounded-lg border">
                <span className="text-[10px] text-muted-foreground uppercase font-medium block">Complainant / Informant</span>
                <span className="font-semibold text-foreground">{complainant}</span>
              </div>
              <div className="bg-muted/20 p-3 rounded-lg border">
                <span className="text-[10px] text-muted-foreground uppercase font-medium block">Victim</span>
                <span className="font-semibold text-foreground">{victim}</span>
              </div>
              <div className="bg-muted/20 p-3 rounded-lg border">
                <span className="text-[10px] text-muted-foreground uppercase font-medium block">Accused Persons</span>
                <span className="font-semibold text-destructive">{accused}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Brief Facts */}
          <div className="space-y-2 border-t pt-4">
            <h4 className="text-xs font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5" /> 3. First Information Contents (Brief Facts)
            </h4>
            <div className="bg-muted/30 p-3.5 rounded-xl border border-border/50 text-xs font-mono leading-relaxed text-foreground/90">
              {facts}
            </div>
          </div>

          {/* Section 4: Officer Signature & Status */}
          <div className="border-t pt-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Current Status: </span>
              <span className="font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">{status}</span>
            </div>
            <div className="text-right space-y-1 sm:self-end">
              <div className="border-b border-foreground/30 pb-1 font-semibold text-foreground">{officer}</div>
              <div className="text-[10px] text-muted-foreground font-mono">Station House Officer / IO ({kgid})</div>
              <div className="text-[9px] text-muted-foreground">{station} — KSP</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
