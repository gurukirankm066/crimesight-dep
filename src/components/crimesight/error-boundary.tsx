'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  tabName?: string
}

interface State {
  hasError: boolean
}

export class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[CrimeSight] Error in ${this.props.tabName || 'tab'}:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="size-6 text-red-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-red-400">Module Unavailable</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[300px]">
              The {this.props.tabName || 'intelligence module'} encountered an error. Other modules remain operational.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md hover:bg-emerald-500/20 transition-colors"
          >
            <RefreshCw className="size-3" /> Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}