import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: '24px', textAlign: 'center', background: '#FAFBFD'
        }}>
          <AlertTriangle size={64} color="var(--color-danger)" style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: 24, maxWidth: 500 }}>
            We encountered an unexpected error while loading this page. Our team has been notified.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'var(--color-primary)', color: '#ffffff', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} />
              Reload Page
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: 8,
                padding: '10px 20px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Go Home
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre style={{ marginTop: 32, padding: 16, background: '#fef2f2', color: '#991b1b', borderRadius: 8, textAlign: 'left', overflowX: 'auto', maxWidth: '100%' }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
