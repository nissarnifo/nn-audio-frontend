'use client'
import { useState } from 'react'
import { Mail, CheckCircle } from 'lucide-react'
import { useNewsletterSubscribe } from '@/hooks'
import { Spinner } from '@/components/ui'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const { mutate: subscribe, isPending } = useNewsletterSubscribe()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    subscribe(
      { email: email.trim(), source: 'homepage' },
      {
        onSuccess: () => { setDone(true); setEmail('') },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          import('react-hot-toast').then(({ default: toast }) => toast.error(msg || 'Subscription failed'))
        },
      }
    )
  }

  return (
    <section className="border-t border-[rgba(0,212,255,0.1)]">
      <div className="max-w-7xl mx-auto px-4 py-14 flex flex-col items-center text-center">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.06)] flex items-center justify-center mb-5">
          <Mail size={22} className="text-[#00D4FF]" />
        </div>

        <h2 className="font-heading text-2xl md:text-3xl text-[#E8F4FD] tracking-widest mb-2">
          STAY IN THE LOOP
        </h2>
        <p className="font-mono text-sm text-[#4A7FA5] max-w-md mb-8">
          Get early access to new arrivals, exclusive deals, and audiophile tips — straight to your inbox. No spam, ever.
        </p>

        {done ? (
          <div className="flex items-center gap-2 text-[#00FF88] font-mono text-sm">
            <CheckCircle size={18} />
            You&apos;re subscribed! Welcome aboard.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input-hud flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={isPending}
              className="btn-gold px-5 py-2.5 font-heading tracking-widest text-sm flex items-center gap-2 flex-shrink-0"
            >
              {isPending ? <Spinner size={14} /> : null}
              SUBSCRIBE
            </button>
          </form>
        )}

        <p className="font-mono text-[10px] text-[rgba(74,127,165,0.5)] mt-4">
          Unsubscribe anytime · No spam · We respect your privacy
        </p>
      </div>
    </section>
  )
}
