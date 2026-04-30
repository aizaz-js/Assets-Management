import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
          <div className="card max-w-md text-center">
            <h2 className="page-title mb-2">Something went wrong</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">{this.state.message}</p>
            <button
              className="btn-primary mt-4"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
