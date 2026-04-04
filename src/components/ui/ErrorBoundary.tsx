'use client'
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="text-[#FF6B6B] font-mono text-2xl">⚠</div>
          <p className="font-heading text-sm text-[#A8C8E0]">Something went wrong loading this section.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs font-mono text-[#00D4FF] border border-[rgba(0,212,255,0.3)] px-4 py-1.5 rounded hover:border-[#00D4FF] transition-colors"
          >
            RETRY
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
