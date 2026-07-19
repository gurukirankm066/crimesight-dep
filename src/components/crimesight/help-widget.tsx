'use client'

import React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, Send, Sparkles, RotateCcw, MessageCircle } from 'lucide-react'
import { useCrimeSightStore } from '@/lib/store'

/* ═══════════════════════════════════════════════════════════════
   MARKDOWN RENDERING
   ═══════════════════════════════════════════════════════════════ */

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*|`([^`]+)`|([^*`]+)/g
  let match
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      parts.push(<strong key={key++} className="text-white font-semibold">{match[1]}</strong>)
    } else if (match[2]) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-white/[0.06] text-emerald-400 text-[12px] font-mono">
          {match[2]}
        </code>
      )
    } else if (match[3]) {
      parts.push(<span key={key++}>{match[3]}</span>)
    }
  }

  return parts.length > 0 ? parts : [text]
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    if (!line.trim()) {
      elements.push(<br key={key++} />)
      continue
    }

    // Bullet point
    if (line.trim().startsWith('- ')) {
      const content = line.trim().slice(2)
      elements.push(
        <li key={key++} className="ml-4 list-disc text-slate-300">
          {renderInline(content)}
        </li>
      )
      continue
    }

    // Regular line with inline formatting
    elements.push(
      <span key={key++} className="text-slate-300">
        {renderInline(line)}
      </span>
    )
  }

  return elements
}

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface HelpMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const HELP_ERROR_MESSAGE = 'Connection issue. Please check your network and try again.'

interface QuickAction {
  label: string
  color: string
  question: string
  answer: string
}

/* ═══════════════════════════════════════════════════════════════
   TAB LABELS (context-aware welcome)
   ═══════════════════════════════════════════════════════════════ */

const TAB_LABELS: Record<string, string> = {
  map: 'Geo Intelligence',
  dashboard: 'Command Center',
  trends: 'Crime Analytics',
  network: 'Link Analysis',
  'most-wanted': 'Priority Targets',
  cases: 'FIR Registry',
  ai: 'Predictive Intel',
}

/* ═══════════════════════════════════════════════════════════════
   QUICK ACTIONS — pre-built FAQ (instant, zero latency)
   ═══════════════════════════════════════════════════════════════ */

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Graph Legend',
    color: '#10b981',
    question: 'What do the shapes and colors in the Intelligence Graph mean?',
    answer: `The network graph maps entities as nodes:\n\n• **Circles** = Suspects (red = absconding, green = arrested, amber = bail, blue = custody)\n• **Rounded rectangles** = FIR cases (red = Critical, amber = High, yellow = Medium priority)\n• **Diamonds** = Districts of occurrence\n• **Hexagons** = Arresting officers\n• **Pills** = Offence categories\n\nNode size reflects number of links. Green lines between suspects indicate co-accused in a shared FIR. Click any node for subject dossier.`,
  },
  {
    label: 'Search & Navigate',
    color: '#60a5fa',
    question: 'Graph search and navigation',
    answer: `Type a suspect name, FIR number, or IO name in the search bar. Click a result to fly to that node. Scroll to zoom, click and drag on empty space to pan, drag a node to reposition. Click a node for its dossier; click empty space to deselect. Filter pills (top-right) toggle entity types on/off.`,
  },
  {
    label: 'Threat Score',
    color: '#f59e0b',
    question: 'What does the Case Priority Index mean?',
    answer: `The **Threat Assessment Score** (0-100) is assigned to every FIR based on crime severity, suspect profile (repeat/absconding), cross-district involvement, and investigation velocity.\n\n**70 and above** = High risk — immediate attention required\n**40-69** = Moderate — monitor progress\n**Below 40** = Standard — normal timeline\n\nVisible in FIR dossier and registry.`,
  },
  {
    label: 'Geo Intelligence Map',
    color: '#38bdf8',
    question: 'District map usage',
    answer: `Choropleth map of 31 Karnataka districts. Color intensity reflects crime volume. Hover for stats, click for drill-down to view offence breakdown, recent FIRs, and identified accused.`,
  },
  {
    label: 'FIR Registry',
    color: '#a78bfa',
    question: 'FIR database search',
    answer: `The **FIR Registry** is your complete searchable case database.\n\n• **Search** by FIR number, suspect name, or location using the search bar\n• **Filter** by case status (Open, Under Investigation, Closed, Charge Sheet Filed), priority, crime type, or district\n• **Click** any FIR row to expand full case details: linked suspects, arrest records, investigating officer, and SCRB Intelligence Note\n• **Sort** any column by clicking the column header`,
  },
  {
    label: 'Repeat Offenders',
    color: '#ef4444',
    question: 'Repeat offender tracking',
    answer: `System flags repeat offenders across multiple tabs:\n\n• **Link Analysis > Repeat Offenders** — table with repeat count, offence types, districts, arrest status\n• **Network Graph** — repeat offenders shown as larger nodes with a dashed red ring\n• **Link Analysis > Cross-District** — suspects operating across multiple districts\n\nGreen lines between suspects = co-accused in the same FIR.`,
  },
]

/* ═══════════════════════════════════════════════════════════════
   HELP WIDGET
   ═══════════════════════════════════════════════════════════════ */

export default function HelpWidget() {
  const { activeTab } = useCrimeSightStore()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<HelpMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Show quick actions when only welcome message exists
  const showQuickActions = messages.length <= 1

  // Handle quick action click — instant answer, no API call
  const handleQuickAction = useCallback((action: QuickAction) => {
    const userMsg: HelpMessage = {
      id: `q-${Date.now()}`,
      role: 'user',
      content: action.question,
    }
    setMessages(prev => [...prev, userMsg])
    // Small delay for natural UX feel
    setTimeout(() => {
      const aiMsg: HelpMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: action.answer,
      }
      setMessages(prev => [...prev, aiMsg])
    }, 250)
  }, [])

  // Handle custom question → AI API
  const handleSend = useCallback(async (overrideText?: string) => {
    const trimmed = (overrideText ?? input).trim()
    if (!trimmed || isTyping) return

    const userMsg: HelpMessage = {
      id: `q-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const history = messages.slice(-4).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))

      const res = await fetch('/api/ai/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, history, currentTab: TAB_LABELS[activeTab] || activeTab }),
      })

      const data = await res.json()
      const reply = data.reply || data.answer || 'Unable to process that question. Please try rephrasing.'
      const aiMsg: HelpMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
      }
      setMessages(prev => [...prev, aiMsg])
    } catch {
      const aiMsg: HelpMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: HELP_ERROR_MESSAGE,
      }
      setMessages(prev => [...prev, aiMsg])
    }
    setIsTyping(false)
    inputRef.current?.focus()
  }, [input, isTyping, messages, activeTab])

  // Reset conversation
  const handleReset = useCallback(() => {
    setMessages([])
    setIsTyping(false)
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  // Toggle panel
  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  // Build welcome message based on current tab
  const welcomeMessage = `CrimeSight v2.0 — SCRB Help Desk\n\nCurrent module: **${TAB_LABELS[activeTab] || activeTab}**. Select a topic below or enter your query.`

  return (
    <>
      {/* ── Floating Action Button ── */}
      <motion.button
        onClick={togglePanel}
        className={`fixed bottom-28 sm:bottom-8 right-4 sm:right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          isOpen
            ? 'bg-white/10 border border-white/10 backdrop-blur-sm'
            : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open help assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <HelpCircle className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help label */}
        {!isOpen && (
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] font-medium text-slate-400 bg-[#111827] border border-white/[0.08] rounded-md px-2.5 py-1 hidden lg:flex items-center gap-1.5 pointer-events-none shadow-lg">
            <MessageCircle className="w-3 h-3 text-emerald-400" />
            Help
          </span>
        )}
      </motion.button>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-32 sm:bottom-[5.5rem] right-2 sm:right-6 z-50 w-[380px] max-w-[calc(100vw-0.75rem)] rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-white/[0.08]"
            style={{
              maxHeight: 'min(520px, calc(100vh - 8rem))',
              background: '#0d1117',
            }}
          >
            {/* ── Panel Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0a0f1a]/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/20">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-white tracking-wide">CrimeSight AI</p>
                  <p className="text-[9px] text-slate-500 tracking-wide">SCRB Help Desk</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-md hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-colors"
                    title="Reset conversation"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={togglePanel}
                  className="p-1.5 rounded-md hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ── Messages + Quick Actions ── */}
            <div
              ref={scrollRef}
              className="overflow-y-auto custom-scrollbar"
              style={{ maxHeight: 'calc(min(520px, calc(100vh - 8rem)) - 108px)' }}
            >
              <div className="p-3 space-y-3">
                {/* Welcome message */}
                {messages.length === 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[90%]">
                      <div className="chat-msg-ai px-3 py-2.5">
                        <div className="text-[12px] leading-relaxed space-y-0.5">
                          {renderMarkdown(welcomeMessage)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                {showQuickActions && (
                  <div className="grid grid-cols-2 gap-1.5 pb-1">
                    {QUICK_ACTIONS.map(action => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-150 text-left group"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: action.color }}
                        />
                        <span className="text-[11px] text-slate-300 group-hover:text-white transition-colors leading-tight">
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat Messages */}
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[90%]">
                      {msg.role === 'assistant' && (
                        <p className="text-[9px] font-mono text-emerald-500/60 mb-1 ml-1 uppercase tracking-wider">
                          Assistant
                        </p>
                      )}
                      <div
                        className={
                          msg.role === 'user'
                            ? 'chat-msg-user px-3 py-2'
                            : 'chat-msg-ai px-3 py-2.5'
                        }
                      >
                        <div className="text-[12px] leading-relaxed space-y-0.5">
                          {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                        </div>
                        {msg.role === 'assistant' && msg.content === HELP_ERROR_MESSAGE && (
                          <button
                            onClick={() => {
                              // Find the last user message and resend
                              const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
                              if (lastUserMsg) {
                                setMessages(prev => prev.filter(m => m.id !== msg.id))
                                setTimeout(() => handleSend(lastUserMsg.content), 50)
                              }
                            }}
                            disabled={isTyping}
                            className="flex items-center gap-1 mt-1.5 ml-1 text-[10px] text-emerald-400/70 hover:text-emerald-400 transition-colors disabled:opacity-40"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div>
                      <p className="text-[9px] font-mono text-emerald-500/60 mb-1 ml-1 uppercase tracking-wider">
                        Assistant
                      </p>
                      <div className="chat-msg-ai px-4 py-2.5 flex items-center gap-2">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                          Analyzing
                        </span>
                        <span className="flex gap-1">
                          <span
                            className="typing-dot inline-block size-1 rounded-full bg-emerald-400"
                            style={{ animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0s' }}
                          />
                          <span
                            className="typing-dot inline-block size-1 rounded-full bg-emerald-400"
                            style={{ animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.16s' }}
                          />
                          <span
                            className="typing-dot inline-block size-1 rounded-full bg-emerald-400"
                            style={{ animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.32s' }}
                          />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* ── Input Bar ── */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/[0.06] bg-[#0a0f1a]/60 shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask about any feature..."
                disabled={isTyping}
                className="flex-1 h-8 bg-[#111827] border border-white/[0.06] rounded-md px-3 text-[12px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500/30 transition-colors disabled:opacity-40"
              />
              <button
                onClick={() => { void handleSend() }}
                disabled={isTyping || !input.trim()}
                className="w-8 h-8 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
