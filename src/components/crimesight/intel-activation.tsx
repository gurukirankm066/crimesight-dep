'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, CheckCircle2, Loader2, Database, Radio, Brain, Map, Target, FileText, Zap } from 'lucide-react'

const MODULES = [
  { name: 'GEO INTELLIGENCE', sub: '31 Districts Mapped', icon: Map },
  { name: 'COMMAND CENTER', sub: 'Real-time Monitoring', icon: Radio },
  { name: 'FIR REGISTRY', sub: '10,000 Cases Loaded', icon: Database },
  { name: 'REVIEW SIGNALS', sub: 'Transparent Cues Loaded', icon: Brain },
  { name: 'NETWORK INTELLIGENCE', sub: 'Link Analysis Ready', icon: Target },
  { name: 'FIELD OPERATIONS', sub: 'Mobile Units Synced', icon: FileText },
]

const STATS = [
  { label: 'FIRs Processed', value: 10000, suffix: '' },
  { label: 'Districts Active', value: 31, suffix: '' },
  { label: 'Officers Online', value: 156, suffix: '' },
  { label: 'Review Cues Active', value: 4, suffix: '' },
]

interface Props {
  onComplete: () => void
}

/* Animated counter hook */
function useCounter(target: number, duration: number = 1200, start: number = 0) {
  const [count, setCount] = useState(start)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(start + (target - start) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, start])

  return count
}

export default function IntelActivation({ onComplete }: Props) {
  const [phase, setPhase] = useState<'authenticating' | 'granted' | 'activating' | 'counters' | 'done'>('authenticating')
  const [activeModule, setActiveModule] = useState(-1)
  const [progress, setProgress] = useState(0)

  const stableOnComplete = useCallback(() => onComplete(), [onComplete])

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('granted'), 900)
    const t2 = setTimeout(() => setPhase('activating'), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    if (phase !== 'activating') return

    const moduleInterval = 350
    const totalModules = MODULES.length
    const timers: ReturnType<typeof setTimeout>[] = []

    for (let i = 0; i < totalModules; i++) {
      timers.push(setTimeout(() => {
        setActiveModule(i)
        setProgress(Math.round(((i + 1) / totalModules) * 100))
      }, i * moduleInterval))
    }

    // After all modules, show counters
    timers.push(setTimeout(() => {
      setPhase('counters')
    }, totalModules * moduleInterval + 400))

    return () => timers.forEach(clearTimeout)
  }, [phase, stableOnComplete])

  // Separate effect for counters→done transition (won't get cleaned up by phase change)
  useEffect(() => {
    if (phase !== 'counters') return
    const timer = setTimeout(() => {
      setPhase('done')
      setTimeout(stableOnComplete, 400)
    }, 2500)
    return () => clearTimeout(timer)
  }, [phase, stableOnComplete])

  const firCount = useCounter(phase === 'counters' ? 10000 : 0, 1500)
  const districtCount = useCounter(phase === 'counters' ? 31 : 0, 800)
  const officerCount = useCounter(phase === 'counters' ? 156 : 0, 1000)
  const confidenceCount = useCounter(phase === 'counters' ? 94 : 0, 1200)

  const counterValues = [firCount, districtCount, officerCount, confidenceCount]

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className="fixed inset-0 z-50 bg-[#060810] flex flex-col items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 2, opacity: phase === 'counters' ? 0.15 : 0.05 }}
              transition={{ duration: 3, ease: 'easeOut' }}
              className="w-[400px] h-[400px] rounded-full bg-emerald-500/20 blur-[120px]"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center w-full max-w-lg px-6">
            {/* Shield Icon */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="mb-5"
            >
              <div className="relative">
                <Shield className="size-14 text-emerald-400" strokeWidth={1.2} />
                {phase === 'activating' && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10, letterSpacing: '0.1em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '0.25em' }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl sm:text-3xl font-bold text-white tracking-[0.25em] mb-1"
            >
              CRIMESIGHT AI
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.4 }}
              className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-8"
            >
              Karnataka State Police — SCRB Intelligence Platform
            </motion.p>

            {/* Phase: Authenticating */}
            {phase === 'authenticating' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2.5 text-slate-400"
              >
                <Loader2 className="size-4 animate-spin text-emerald-400/60" />
                <span className="text-xs tracking-[0.15em]">AUTHENTICATING CREDENTIALS...</span>
              </motion.div>
            )}

            {/* Phase: Access Granted */}
            {phase === 'granted' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2.5 text-emerald-400"
              >
                <CheckCircle2 className="size-5" />
                <span className="text-sm font-bold tracking-[0.15em]">ACCESS GRANTED — CLASSIFIED</span>
              </motion.div>
            )}

            {/* Phase: Activating Modules */}
            {phase === 'activating' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                    <span className="tracking-wider">INITIALIZING INTELLIGENCE MODULES</span>
                    <span className="font-mono text-emerald-400 font-bold">{progress}%</span>
                  </div>
                  <div className="h-[3px] bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Module list */}
                <div className="space-y-1.5">
                  {MODULES.map((mod, i) => {
                    const Icon = mod.icon
                    const isActive = i <= activeModule
                    return (
                      <motion.div
                        key={mod.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: isActive ? 1 : 0.15, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2.5 py-1"
                      >
                        {isActive ? (
                          <div className="size-5 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Icon className="size-3 text-emerald-400" />
                          </div>
                        ) : (
                          <div className="size-5 rounded-md border border-slate-800 shrink-0" />
                        )}
                        <span className={`text-[11px] tracking-wider ${isActive ? 'text-emerald-400 font-medium' : 'text-slate-700'}`}>
                          {mod.name}
                        </span>
                        <span className="text-[9px] text-slate-600 ml-auto hidden sm:inline">
                          {isActive ? mod.sub : 'STANDBY'}
                        </span>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            <CheckCircle2 className="size-3 text-emerald-400" />
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Phase: Counter Reveal */}
            {phase === 'counters' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className="flex items-center gap-2 mb-5 justify-center">
                  <Zap className="size-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400 font-semibold tracking-[0.15em] uppercase">Systems Online — All Modules Operational</span>
                  <Zap className="size-3.5 text-emerald-400" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STATS.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.1, duration: 0.3 }}
                      className="text-center py-3 px-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="text-xl sm:text-2xl font-bold text-white tabular-nums leading-none mb-1">
                        {counterValues[i].toLocaleString('en-IN')}{stat.suffix}
                      </div>
                      <div className="text-[9px] text-slate-500 tracking-wider uppercase">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom classification */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-5 text-[9px] text-slate-600 tracking-[0.25em] uppercase"
          >
            Classified — For Official Use Only — Unauthorized Access Prohibited
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
