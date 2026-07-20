'use client'

import { useEffect, useState, useRef } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Map, BarChart3, TrendingUp, GitBranch,
  Target, FileText, Brain, MessageSquare, X, Sun
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onNavigate: (tab: string) => void
  onOpenChat: () => void
  onClearFilter: () => void
  activeTab: string
}

const navItems = [
  { value: 'dashboard', label: 'Command', icon: BarChart3, shortcut: '1', desc: 'Dashboard, alerts, trends, and Morning Brief' },
  { value: 'map', label: 'Geo Intelligence', icon: Map, shortcut: '2', desc: 'District mapping, hotspots, and patrol context' },
  { value: 'cases', label: 'FIR Workspace', icon: FileText, shortcut: '3', desc: 'Registry, FIR detail, and Field FIR intake' },
  { value: 'network', label: 'Link Intelligence', icon: GitBranch, shortcut: '4', desc: 'Entity network, targets, and dossiers' },
  { value: 'operations', label: 'Governed Actions', icon: Brain, shortcut: '5', desc: 'Review queue, evidence requests, and audit trail' },
  { value: 'trends', label: 'Crime Analytics', icon: TrendingUp, shortcut: '6', desc: 'Detailed time-based pattern analysis' },
  { value: 'most-wanted', label: 'Priority Targets', icon: Target, shortcut: '7', desc: 'Repeat-offender threat ranking' },
  { value: 'ai', label: 'Review Signals', icon: Brain, shortcut: '8', desc: 'Transparent rule-based review signals' },
]

const quickActions = [
  { label: 'Focus Query Interface', icon: MessageSquare, action: 'chat' as const },
  { label: 'Clear District Filter', icon: X, action: 'clearFilter' as const },
  { label: 'View Morning Brief', icon: Sun, action: 'nav' as const, value: 'brief' },
]

export default function CommandPalette({
  open, onClose, onNavigate, onOpenChat, onClearFilter, activeTab,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')

  // Reset query via key pattern — use the open state itself
  // The CommandInput resets when the dialog opens via its internal logic

  const handleSelect = (action: string, value?: string) => {
    if (action === 'nav' && value) {
      const label = navItems.find(n => n.value === value)?.label ?? value
      toast(`Navigated to ${label}`, { duration: 1500 })
      onNavigate(value)
    }
    else if (action === 'chat') onOpenChat()
    else if (action === 'clearFilter') onClearFilter()
    onClose()
  }

  return (
    <CommandDialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <div className="bg-[#0c1120] border-white/[0.08]">
        <CommandInput
          placeholder="Search tabs, actions, or type a question..."
          value={query}
          onValueChange={setQuery}
          className="border-white/[0.06] text-slate-200 placeholder:text-slate-600"
        />
        <CommandList className="max-h-[400px]">
          <CommandEmpty className="text-slate-500 text-xs py-4 text-center">No results found.</CommandEmpty>

          {/* Navigation */}
          <CommandGroup heading="Navigate" className="text-[10px] text-slate-500 uppercase tracking-wider">
            {navItems.map(item => (
              <CommandItem
                key={item.value}
                value={`${item.label} ${item.desc} ${item.shortcut}`}
                onSelect={() => handleSelect('nav', item.value)}
                className="flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-white/[0.05] cursor-pointer data-[selected=true]:bg-white/[0.08] data-[selected=true]:text-white"
              >
                <item.icon className="size-4 text-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium">{item.label}</span>
                    {activeTab === item.value && (
                      <span className="text-[8px] font-bold px-1 py-0 rounded bg-emerald-500/15 text-emerald-400">Active</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{item.desc}</span>
                </div>
                <kbd className="text-[9px] font-mono text-slate-600 bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5">{item.shortcut}</kbd>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator className="bg-white/[0.04]" />

          {/* Quick Actions */}
          <CommandGroup heading="Actions" className="text-[10px] text-slate-500 uppercase tracking-wider">
            {quickActions.map(action => (
              <CommandItem
                key={action.label}
                value={action.label}
                onSelect={() => handleSelect(action.action, 'value' in action ? action.value : undefined)}
                className="flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:bg-white/[0.05] cursor-pointer data-[selected=true]:bg-white/[0.08] data-[selected=true]:text-white"
              >
                <action.icon className="size-4 text-slate-400 shrink-0" />
                <span className="text-[12px] font-medium">{action.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator className="bg-white/[0.04]" />

          {/* Footer */}
          <div className="px-3 py-2 border-t border-white/[0.04] flex items-center gap-4 text-[9px] text-slate-600">
            <span><kbd className="font-mono bg-white/[0.04] border border-white/[0.08] rounded px-1">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-white/[0.04] border border-white/[0.08] rounded px-1">↵</kbd> Select</span>
            <span><kbd className="font-mono bg-white/[0.04] border border-white/[0.08] rounded px-1">esc</kbd> Close</span>
          </div>
        </CommandList>
      </div>
    </CommandDialog>
  )
}
