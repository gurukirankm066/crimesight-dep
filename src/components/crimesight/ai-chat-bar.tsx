'use client'

import React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Send, ChevronUp, ChevronDown, Sparkles, X, RotateCcw } from 'lucide-react'

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
   SUGGESTED QUERIES
   ═══════════════════════════════════════════════════════════════ */

const SUGGESTED_QUERIES = [
  'Show repeat offenders in Bengaluru',
  'Analyze crime spike in Kalaburagi',
  'Operation Black Lotus status',
]

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

const FALLBACK_MESSAGE = 'Unable to connect to CrimeSight AI. Retrying...'

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AIChatBar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory, isTyping, scrollToBottom])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || sending) return

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      }

      setChatHistory((prev) => [...prev, userMsg])
      setMessage('')
      setSending(true)
      setIsTyping(true)

      // Auto-expand on first message
      if (!isExpanded) {
        setIsExpanded(true)
      }

      // Build conversation history for the API (last 6 messages)
      const history = chatHistory.slice(-6).map((msg) => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content,
      }))

      let answer: string

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...history, { role: 'user', content: trimmed }] }),
        })

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`)
        }

        const data = await res.json()
        answer = data.reply || FALLBACK_MESSAGE
      } catch {
        answer = FALLBACK_MESSAGE
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: answer,
        timestamp: new Date(),
      }

      setChatHistory((prev) => [...prev, aiMsg])
      setIsTyping(false)
      setSending(false)
      inputRef.current?.focus()
    },
    [sending, isExpanded, chatHistory, scrollToBottom],
  )

  const handleSend = () => {
    sendMessage(message)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev)
    setTimeout(() => {
      inputRef.current?.focus()
      scrollToBottom()
    }, 50)
  }

  const closeChat = useCallback(() => {
    setIsExpanded(false)
    setMessage('')
    setChatHistory([])
  }, [])

  useEffect(() => {
    if (!isExpanded) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeChat()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isExpanded, closeChat])

  return (
    <div className="relative flex flex-col">
      {/* ── Expanded Chat Area ── */}
      {isExpanded && (
        <div className="max-h-80 overflow-hidden border-b border-white/[0.06]">
          <div className="h-80 px-3 py-2 bg-[#080c16]">
            {/* CrimeSight AI branding badge */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5">
                  <Sparkles className="size-3 text-emerald-400" />
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    CrimeSight AI
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-700">
                  SCRB Query Interface
                </span>
              </div>
              <button
                type="button"
                onClick={closeChat}
                aria-label="Close CrimeSight AI"
                title="Close (Esc)"
                className="text-[10px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <X className="size-2.5" />
                Close
              </button>
            </div>

            {chatHistory.length === 0 && !isTyping ? (
              <div className="w-full h-[calc(100%-28px)] flex items-center justify-center">
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                  Awaiting query input...
                </p>
              </div>
            ) : (
              <div
                ref={scrollRef}
                className="w-full h-[calc(100%-28px)] overflow-y-auto custom-scrollbar"
              >
                <div className="space-y-3 py-1">
                  {chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[85%]">
                        <p
                          className={`text-[9px] font-mono text-slate-600 mb-1 ${
                            msg.role === 'user' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                        <div
                          className={
                            msg.role === 'user'
                              ? 'chat-msg-user px-3 py-2'
                              : 'chat-msg-ai px-3 py-2'
                          }
                        >
                          <div className="text-[13px] leading-relaxed space-y-0.5">
                            {msg.role === 'ai' ? renderMarkdown(msg.content) : msg.content}
                          </div>
                        </div>
                        {msg.role === 'ai' && msg.content === FALLBACK_MESSAGE && (
                          <button
                            onClick={() => {
                              // Find the last user message and resend it
                              const lastUserIdx = [...chatHistory].reverse().findIndex(m => m.role === 'user')
                              if (lastUserIdx !== -1) {
                                const lastUserMsg = chatHistory[chatHistory.length - 1 - lastUserIdx]
                                // Remove the failed AI message
                                setChatHistory(prev => prev.filter(m => m.id !== msg.id))
                                // Resend
                                setTimeout(() => sendMessage(lastUserMsg.content), 50)
                              }
                            }}
                            disabled={sending}
                            className="flex items-center gap-1 mt-1.5 ml-1 text-[10px] text-emerald-400/70 hover:text-emerald-400 transition-colors disabled:opacity-40"
                          >
                            <RotateCcw className="size-3" />
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div>
                        <p className="text-[9px] font-mono text-slate-600 mb-1">
                          {formatTime(new Date())}
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
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Suggested Queries (only when expanded) ── */}
      {chatHistory.length === 0 && isExpanded && (
        <div className="flex items-center gap-2 pb-1.5">
          {SUGGESTED_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-[10px] text-slate-500 hover:text-emerald-400 bg-white/[0.03] border border-white/[0.06] rounded-full px-2.5 py-1 transition-colors whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Bar ── */}
      <div
        className="h-9 flex items-center gap-2 shrink-0"
      >
        <Sparkles className="size-4 text-emerald-500/70 shrink-0" />
        <input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask CrimeSight AI — cross-reference suspects, analyze patterns..."
          disabled={sending}
          className="flex-1 h-9 bg-[#111827] border border-white/[0.06] rounded-lg px-3 text-[13px] text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500/40 focus:shadow-[0_0_0_1px_rgba(16,185,129,0.15)] transition-all disabled:opacity-40"
        />

        <Button
          size="icon"
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="h-9 w-9 bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 disabled:opacity-30 rounded-lg"
        >
          <Send className="size-3.5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={toggleExpand}
          className="h-9 w-9 text-slate-600 hover:text-slate-400 hover:bg-transparent shrink-0"
        >
          {isExpanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronUp className="size-3.5" />
          )}
        </Button>
      </div>
    </div>
  )
}
