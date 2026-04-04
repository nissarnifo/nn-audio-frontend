'use client'
import { ClerkProvider } from '@clerk/nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import ClerkSync from '@/components/ClerkSync'
import BackendWarmup from '@/components/BackendWarmup'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 3,
            retryDelay: (attempt) => Math.min(5000 * 2 ** attempt, 30000),
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <ClerkSync />
        <BackendWarmup />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0D1B2A',
              color: '#E8F4FD',
              border: '1px solid rgba(0,212,255,0.2)',
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '13px',
            },
          }}
        />
      </QueryClientProvider>
    </ClerkProvider>
  )
}
