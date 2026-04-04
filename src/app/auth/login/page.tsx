'use client'
import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-heading text-4xl text-[#E8F4FD] tracking-widest">SIGN IN</div>
          <div className="h-0.5 w-10 bg-[#00D4FF] mx-auto mt-3" />
          <p className="text-[#4A7FA5] text-sm mt-3">Welcome back to N &amp; N Audio Systems</p>
        </div>

        <SignIn
          routing="hash"
          afterSignInUrl="/"
          appearance={{
            variables: {
              colorPrimary: '#00D4FF',
              colorBackground: '#0D1B2A',
              colorText: '#E8F4FD',
              colorTextSecondary: '#4A7FA5',
              colorInputBackground: 'rgba(0,212,255,0.05)',
              colorInputText: '#E8F4FD',
              borderRadius: '4px',
              fontFamily: 'Share Tech Mono, monospace',
            },
            elements: {
              card: 'bg-transparent shadow-none border-0',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: 'border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.04)] text-[#E8F4FD] hover:bg-[rgba(0,212,255,0.1)] transition-all font-mono',
              dividerLine: 'bg-[rgba(0,212,255,0.15)]',
              dividerText: 'text-[#4A7FA5] font-mono text-xs',
              formFieldInput: 'bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.2)] text-[#E8F4FD] font-mono focus:border-[#00D4FF] rounded',
              formButtonPrimary: 'bg-[#00D4FF] text-[#0A0E1A] font-heading tracking-widest hover:bg-[#00b8d9] transition-all',
              footerActionLink: 'text-[#00D4FF] hover:text-[#00b8d9]',
              formFieldLabel: 'text-[#4A7FA5] font-mono text-xs uppercase tracking-wider',
              identityPreviewText: 'text-[#E8F4FD] font-mono',
              identityPreviewEditButton: 'text-[#00D4FF]',
              alertText: 'text-[#FF3366] font-mono text-xs',
            },
          }}
        />
      </div>
    </div>
  )
}
