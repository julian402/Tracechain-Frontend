import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <p className="font-semibold text-gray-900">Algo salió mal</p>
            <p className="text-sm text-gray-500 mt-1">Recarga la página para continuar.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
