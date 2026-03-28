'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/nextjs'
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
            retry: 1,
          },
        },
      })
  )

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#00D4FF',
          colorBackground: '#0D1B2A',
          colorInputBackground: '#0A1628',
          colorText: '#E8F4FD',
          colorTextSecondary: '#4A7FA5',
          borderRadius: '4px',
          fontFamily: 'Share Tech Mono, monospace',
        },
      }}
      signInUrl="/auth/login"
      signUpUrl="/auth/register"
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
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
