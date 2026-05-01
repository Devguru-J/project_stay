import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error): void {
    console.error('Unhandled error in this room:', error)
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children

    return (
      <main className="app-shell">
        <div className="time-veil" aria-hidden="true" />
        <section className="error-fallback" role="alert">
          <p className="eyebrow">stay until it passes</p>
          <h2>이 자리에 잠시 문제가 있어요.</h2>
          <p>창을 한 번 새로고침해 주세요. 남겨진 말들은 그대로 있습니다.</p>
          <button type="button" onClick={() => window.location.reload()}>
            다시 들어가기
          </button>
        </section>
      </main>
    )
  }
}
