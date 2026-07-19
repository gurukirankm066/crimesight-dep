'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, Fingerprint } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Typing animation for the login title
function useTypingText(text: string, speed = 80, startDelay = 600) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const idx = useRef(0)

  useEffect(() => {
    idx.current = 0
    setDisplayed('')
    setDone(false)
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        idx.current++
        if (idx.current <= text.length) {
          setDisplayed(text.slice(0, idx.current))
        } else {
          setDone(true)
          clearInterval(interval)
        }
      }, speed)
      return () => clearInterval(interval)
    }, startDelay)
    return () => { clearTimeout(timeout) }
  }, [text, speed, startDelay])

  return { displayed, done }
}

interface LoginScreenProps {
  onAuthenticated: (user: string) => void
}

export default function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { displayed: typedDisplay, done: typingDone } = useTypingText('CRIMESIGHT', 100, 800)

  useEffect(() => { setMounted(true) }, [])

  const handleContinue = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 350))
    setLoading(false)
    onAuthenticated(username.trim() || 'demo reviewer')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleContinue()
  }

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#060a12]"
        >
          {/* Background grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Ambient glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative w-full max-w-sm mx-4"
          >
            {/* Main Card */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0a0f1a]/90 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Top accent line */}
              <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

              <div className="p-8">
                {/* Shield Logo */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <Shield className="size-8 text-emerald-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0a0f1a]">
                      <Fingerprint className="size-3 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                  <h1 className="text-sm font-bold text-white tracking-wider uppercase min-h-[20px]">
                    {typedDisplay}<span className={`inline-block w-[2px] h-3.5 bg-emerald-400 ml-0.5 align-middle ${typingDone ? 'animate-pulse' : ''}`} style={{ opacity: typingDone ? 1 : 1 }} />
                  </h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: typingDone ? 1 : 0, y: typingDone ? 0 : 4 }}
                    transition={{ duration: 0.4 }}
                    className="text-[10px] text-slate-500 mt-1 tracking-wide"
                  >
                    Prototype Intelligence Platform · Synthetic demonstration environment
                  </motion.p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-[8px] font-mono text-amber-300/70 uppercase tracking-widest">Prototype Access</span>
                    <Lock className="size-2.5 text-red-400/50" />
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-medium">
                      Demo reviewer name <span className="normal-case text-slate-600">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g. Judge / Reviewer"
                      autoFocus
                      disabled={loading}
                      className="w-full h-10 bg-[#111827] border border-white/[0.08] rounded-lg px-3 text-[13px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500/30 transition-all disabled:opacity-40"
                    />
                  </div>

                  <Button
                    onClick={handleContinue}
                    disabled={loading}
                    className="w-full h-10 mt-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] font-semibold tracking-wider uppercase rounded-lg transition-all disabled:opacity-30"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Opening demo...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Lock className="size-3.5" />
                        Continue to synthetic demo
                      </span>
                    )}
                  </Button>
                </div>

                {/* Classification footer */}
                <div className="mt-5 pt-4 border-t border-white/[0.04] text-center">
                  <p className="text-[9px] text-slate-600">
                    Demonstration environment — this is not an authentication system and contains no operational police data
                  </p>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="px-8 py-3 bg-white/[0.02] border-t border-white/[0.04] flex items-center justify-between">
                <span className="text-[8px] text-slate-700 uppercase tracking-wider">
                  Zoho Catalyst · GovCloud
                </span>
                <span className="text-[8px] text-slate-700 font-mono">
                  v2.1.0
                </span>
              </div>
            </div>

            {/* Classification footer */}
            <div className="text-center mt-4 space-y-1">
              <p className="text-[8px] text-slate-700 uppercase tracking-widest">
                Synthetic demonstration — not for operational use
              </p>
              <p className="text-[8px] text-emerald-500/30 uppercase tracking-wider">
                Datathon 2026 · Team Quantara · Hack2skill
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
