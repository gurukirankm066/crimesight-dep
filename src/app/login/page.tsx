'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, KeyRound, User, Building2, Lock, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const DEMO_OFFICERS = [
  {
    name: 'Inspector Ravi Kumar',
    kgid: 'KGID-2018-0101',
    rank: 'Inspector of Police (SHO)',
    station: 'Whitefield Police Station',
    badge: 'Station House Officer',
    avatar: '👮‍♂️',
  },
  {
    name: 'SI Anitha Sharma',
    kgid: 'KGID-2019-0102',
    rank: 'Sub-Inspector of Police',
    station: 'Whitefield Police Station',
    badge: 'Investigating Officer',
    avatar: '👮‍♀️',
  },
  {
    name: 'Inspector Suresh Gowda',
    kgid: 'KGID-2017-0103',
    rank: 'Inspector of Police (SHO)',
    station: 'Koramangala Police Station',
    badge: 'Station House Officer',
    avatar: '👮‍♂️',
  },
  {
    name: 'Command Center Admin',
    kgid: 'KGID-2015-0999',
    rank: 'Superintendent of Police',
    station: 'State Police HQ, Bengaluru',
    badge: 'HQ Command Access',
    avatar: '🛡️',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [kgid, setKgid] = useState('')
  const [password, setPassword] = useState('')
  const [station, setStation] = useState('Whitefield Police Station')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e?: React.FormEvent, officerOverride?: typeof DEMO_OFFICERS[0]) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setError('')

    setTimeout(() => {
      const user = officerOverride || {
        name: kgid ? `Officer (${kgid})` : 'Inspector Ravi Kumar',
        kgid: kgid || 'KGID-2018-0101',
        rank: 'Inspector of Police',
        station: station || 'Whitefield Police Station',
        badge: 'Authorized Personnel',
        avatar: '👮‍♂️',
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('ksp_user', JSON.stringify(user))
      }
      setIsLoading(false)
      router.push('/')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      <header className="flex items-center justify-between max-w-5xl mx-auto w-full z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base tracking-tight text-foreground flex items-center gap-1.5">
              CRIMESIGHT AI — KSP INTELLIGENCE
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-semibold">
                POLICE PORTAL
              </Badge>
            </h1>
            <p className="text-[11px] text-muted-foreground font-mono">Governed Field FIR & Crime Intelligence Platform</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full my-auto py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10">
        <div className="md:col-span-5 space-y-5 text-left">
          <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 border-primary/40 bg-primary/5 text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Official KSP Authentication
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">
            Secure Portal for <span className="text-primary">Police Officers</span> & Analysts
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Access real-time crime intelligence, generate official FIR reports, analyze spatial heatmaps, and query database records in Kannada, Hindi, or English.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Full integration with Crimesight AI & Foundry Ontology</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Native Kannada & Hindi natural language query engine</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Instant Form-1 FIR Printable Document Generator</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 space-y-4">
          <Card className="border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                <span>Officer Sign In</span>
                <Lock className="h-4 w-4 text-primary" />
              </CardTitle>
              <CardDescription className="text-xs">
                Enter your Karnataka Government Employee ID (KGID) and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" /> KGID Number
                  </label>
                  <Input
                    placeholder="e.g. KGID-2018-0101"
                    value={kgid}
                    onChange={(e) => setKgid(e.target.value)}
                    className="bg-background/50 border-border/60 text-xs h-10 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-primary" /> Security Password / PIN
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-border/60 text-xs h-10 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> Assigned Police Station
                  </label>
                  <select
                    value={station}
                    onChange={(e) => setStation(e.target.value)}
                    className="w-full bg-background/50 border border-border/60 rounded-md text-xs h-10 px-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Whitefield Police Station">Whitefield Police Station</option>
                    <option value="Koramangala Police Station">Koramangala Police Station</option>
                    <option value="Indiranagar Police Station">Indiranagar Police Station</option>
                    <option value="HSR Layout Police Station">HSR Layout Police Station</option>
                    <option value="State Police HQ, Bengaluru">State Police HQ, Bengaluru</option>
                  </select>
                </div>

                {error && (
                  <div className="text-xs text-destructive flex items-center gap-1.5 bg-destructive/10 p-2 rounded-lg">
                    <AlertCircle className="h-3.5 w-3.5" /> {error}
                  </div>
                )}

                <Button type="submit" disabled={isLoading} className="w-full h-10 text-xs font-semibold gap-2">
                  {isLoading ? 'Authenticating Credentials...' : 'Sign In to Portal'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-semibold tracking-wider">Or 1-Click Demo Profiles</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_OFFICERS.map((off) => (
                  <button
                    key={off.kgid}
                    onClick={() => handleLogin(undefined, off)}
                    className="text-left p-2.5 rounded-xl border border-border/50 bg-background/50 hover:bg-primary/5 hover:border-primary/40 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{off.avatar}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">{off.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate">{off.kgid}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full text-center text-[11px] text-muted-foreground/70 py-2 border-t border-border/30 z-10">
        <p>Restricted Official System — Crimesight AI & KSP Command Center © 2026</p>
      </footer>
    </div>
  )
}
