import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(4,6,12,0.95)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: '#0D1627', borderRadius: 16, padding: 32,
            border: '1px solid rgba(239,68,68,0.3)', maxWidth: 480, width: '100%',
          }}>
            <p style={{ color: '#EF4444', fontWeight: 700, marginBottom: 8 }}>Error inesperado</p>
            <pre style={{ color: '#8B95A3', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 200, overflowY: 'auto' }}>
              {this.state.error.message}
            </pre>
            <button onClick={() => this.setState({ error: null })}
              style={{ marginTop: 16, padding: '8px 20px', background: '#E14924', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
