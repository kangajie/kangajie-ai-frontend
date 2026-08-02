import { Component } from 'react';

/**
 * ErrorBoundary — menangkap semua crash JavaScript.
 * Menampilkan halaman fallback yang elegan sesuai brand KangAjie AI
 * alih-alih black screen yang membingungkan user.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[KangAjie AI] Render error:', error, errorInfo?.componentStack);
    this.setState({ errorInfo });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const href = window.location.href;
    const chromeUrl = `googlechrome://navigate?url=${encodeURIComponent(href)}`;

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0F0F10 0%, #141418 50%, #0F0F10 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: '#fff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Glow decorations */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '320px', height: '320px',
          background: 'radial-gradient(circle, rgba(234,179,8,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '-80px',
          width: '240px', height: '240px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        {/* Logo icon */}
        <div style={{
          width: '72px', height: '72px',
          background: 'linear-gradient(135deg, #1F1F22, #252528)',
          borderRadius: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '24px',
          border: '1px solid rgba(234,179,8,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
          fontSize: '32px',
        }}>
          🤖
        </div>

        {/* Brand name */}
        <p style={{
          fontSize: '11px', fontWeight: '700', letterSpacing: '3px',
          textTransform: 'uppercase', color: '#EAB308',
          marginBottom: '8px', opacity: 0.9,
        }}>
          KangAjie AI
        </p>

        {/* Title */}
        <h1 style={{
          fontSize: '22px', fontWeight: '800',
          color: '#FFFFFF', marginBottom: '12px', lineHeight: '1.3',
          letterSpacing: '-0.3px',
        }}>
          Browser Tidak Didukung
        </h1>

        {/* Description & Debug Info */}
        <p style={{
          fontSize: '14px', color: '#9CA3AF', lineHeight: '1.7',
          maxWidth: '300px', marginBottom: '16px',
        }}>
          Terjadi kesalahan saat memuat aplikasi. Mohon <strong>Screenshot</strong> layar ini dan kirimkan ke KangAjie.
        </p>

        {/* Debug Box */}
        <div style={{
          width: '100%', maxWidth: '340px', background: 'rgba(0,0,0,0.5)',
          border: '1px solid #374151', borderRadius: '8px', padding: '12px',
          marginBottom: '24px', textAlign: 'left', overflowX: 'auto',
          maxHeight: '200px', overflowY: 'auto'
        }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#F87171', fontFamily: 'monospace', fontWeight: 'bold' }}>
            {this.state.error?.toString()}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '9px', color: '#9CA3AF', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {this.state.errorInfo?.componentStack || 'No stack trace available'}
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '280px' }}>

          {/* Open in Chrome */}
          <a href={chromeUrl} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #CA8A04, #EAB308)',
            color: '#000', fontWeight: '700', fontSize: '14px',
            padding: '14px 24px', borderRadius: '14px',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(234,179,8,0.3)',
          }}>
            <span style={{ fontSize: '16px' }}></span>
            Buka di Chrome
          </a>

          {/* Try again */}
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.05)',
              color: '#D1D5DB', fontWeight: '600', fontSize: '14px',
              padding: '14px 24px', borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <span style={{ fontSize: '16px' }}></span>
            Coba Lagi
          </button>
        </div>

        {/* Footer note */}
        <p style={{
          marginTop: '40px', fontSize: '11px',
          color: '#4B5563', letterSpacing: '0.5px',
        }}>
          ai.kangajie.my.id
        </p>
      </div>
    );
  }
}
