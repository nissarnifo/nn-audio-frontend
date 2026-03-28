'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[GlobalError]', error) }, [error])
  return (
    <html>
      <body style={{ margin: 0, background: '#0A0E1A', color: '#E8F4FD', fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ color: '#00D4FF', fontSize: '3rem', marginBottom: '1rem' }}>⚠</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#4A7FA5', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error.digest ? `Error ID: ${error.digest}` : 'An unexpected error occurred'}
          </p>
          <button onClick={reset} style={{ background: 'transparent', border: '1px solid #00D4FF', color: '#00D4FF', padding: '0.5rem 1.5rem', cursor: 'pointer', fontFamily: 'monospace', borderRadius: '4px' }}>
            TRY AGAIN
          </button>
        </div>
      </body>
    </html>
  )
}
