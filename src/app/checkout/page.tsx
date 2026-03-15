'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart.store'
import { useAuthStore } from '@/store/auth.store'
import { useAddresses, useCreateAddress, useCreateOrder } from '@/hooks'
import { paymentsApi, cartApi } from '@/services/api'
import AddressForm from '@/components/checkout/AddressForm'
import PaymentSelect from '@/components/checkout/PaymentSelect'
import { fmt } from '@/lib/utils'
import { Divider, Spinner } from '@/components/ui'
import type { Address } from '@/types'
import toast from 'react-hot-toast'

const STEPS = ['SHIPPING', 'PAYMENT', 'CONFIRM']

type PriceChange = { name: string; variantId: string; oldPrice: number; newPrice: number }

function StepDot({ step, current }: { step: number; current: number }) {
  const done = current > step
  const active = current === step
  return (
    <div className="flex items-center">
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-sm transition-all ${
          done
            ? 'border-[#00FF88] bg-[#00FF88] text-[#0A0E1A]'
            : active
            ? 'border-[#00D4FF] text-[#00D4FF] animate-cyanglow'
            : 'border-[rgba(0,212,255,0.2)] text-[#4A7FA5]'
        }`}
      >
        {done ? '✓' : step + 1}
      </div>
      {step < STEPS.length - 1 && (
        <div className={`flex-1 h-0.5 w-12 mx-2 ${done ? 'bg-[#00FF88]' : 'bg-[rgba(0,212,255,0.15)]'}`} />
      )}
    </div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, shipping, total, clearCart, syncPrices } = useCartStore()
  const { isLoggedIn } = useAuthStore()
  const { data: addresses } = useAddresses()
  const { mutateAsync: createAddress } = useCreateAddress()
  const { mutateAsync: createOrder, isPending } = useCreateOrder()

  // P4: idempotency key — generated once per checkout session
  const idempotencyKey = useRef(
    typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  )

  const [step, setStep] = useState(0)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses?.find((a) => a.is_default)?.id ?? null
  )
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id' | 'is_default'> | null>(null)
  const [showNewAddrForm, setShowNewAddrForm] = useState(!isLoggedIn)
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('COD')

  // P1 + P2: cart validation state
  const [isValidating, setIsValidating] = useState(false)
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([])
  const [backendTotal, setBackendTotal] = useState<number | null>(null)

  if (items.length === 0 && typeof window !== 'undefined') {
    router.push('/cart')
    return null
  }

  async function handleAddressNext() {
    if (showNewAddrForm && !newAddress) {
      toast.error('Please fill in address details')
      return
    }
    setStep(1)
  }

  // P1 + P2: validate cart with backend when moving to CONFIRM step
  async function handlePaymentNext() {
    setIsValidating(true)
    try {
      // Sync local cart → backend
      await cartApi.clear()
      await Promise.all(items.map((i) => cartApi.addItem({ variantId: i.variant.id, qty: i.qty })))

      // Fetch backend-calculated cart (authoritative prices + stock)
      const { data: backCart } = await cartApi.get()

      // P2: block on out-of-stock items
      const oos = backCart.items.filter((bi) => {
        const local = items.find((li) => li.variant.id === bi.variant.id)
        return local && bi.variant.stock_qty < local.qty
      })
      if (oos.length > 0) {
        toast.error(
          `Out of stock: ${oos.map((i) => i.product.name).join(', ')}. Please update your cart.`,
          { duration: 6000 }
        )
        return
      }

      // P1: detect price changes
      const changes: PriceChange[] = backCart.items
        .filter((bi) => {
          const local = items.find((li) => li.variant.id === bi.variant.id)
          return local && local.variant.price !== bi.variant.price
        })
        .map((bi) => {
          const local = items.find((li) => li.variant.id === bi.variant.id)!
          return {
            name: bi.product.name,
            variantId: bi.variant.id,
            oldPrice: local.variant.price,
            newPrice: bi.variant.price,
          }
        })

      if (changes.length > 0) {
        // Update local cart with fresh prices so totals are correct
        syncPrices(changes.map((c) => ({ variantId: c.variantId, newPrice: c.newPrice })))
        setPriceChanges(changes)
      }

      setBackendTotal(backCart.total)
      setStep(2)
    } catch {
      toast.error('Failed to validate cart. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  async function handlePlaceOrder() {
    try {
      let addressId = selectedAddressId

      if (showNewAddrForm && newAddress) {
        try {
          const saved = await createAddress(newAddress)
          addressId = saved.id
        } catch {
          return
        }
      }

      if (!addressId) {
        toast.error('Please select or enter an address')
        return
      }

      const orderTotal = backendTotal ?? total

      if (paymentMethod === 'RAZORPAY') {
        type RazorpayWindow = Window & { Razorpay?: new (opts: Record<string, unknown>) => { open(): void } }
        if (!(window as RazorpayWindow).Razorpay) {
          toast.error('Payment service unavailable. Please refresh and try again.')
          return
        }

        let rpOrder: { razorpay_order_id: string; amount: number; currency: string }
        try {
          const res = await paymentsApi.createRazorpayOrder({ amount: orderTotal })
          rpOrder = res.data
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          toast.error(msg || 'Failed to initiate payment. Please try again.')
          return
        }

        // P5: race payment against 10-minute timeout
        const paymentPromise = new Promise<void>((resolve, reject) => {
          const rzp = new (window as RazorpayWindow).Razorpay!({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: rpOrder.amount,
            currency: rpOrder.currency,
            name: 'N & N Audio Systems',
            description: 'Order Payment',
            order_id: rpOrder.razorpay_order_id,
            handler: async (response: Record<string, string>) => {
              try {
                const order = await createOrder({
                  paymentMethod: 'RAZORPAY',
                  addressId: addressId!,
                  razorpay: response,
                  idempotencyKey: idempotencyKey.current,
                })
                clearCart()
                router.push(`/checkout/success?orderId=${order.order_number}`)
                resolve()
              } catch {
                reject(new Error('Order creation failed'))
              }
            },
            modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
            theme: { color: '#00D4FF' },
          })
          rzp.open()
        })

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Payment timeout')), 10 * 60 * 1000)
        )

        await Promise.race([paymentPromise, timeoutPromise])
      } else {
        const order = await createOrder({
          paymentMethod: 'COD',
          addressId,
          idempotencyKey: idempotencyKey.current,
        })
        clearCart()
        router.push(`/checkout/success?orderId=${order.order_number}`)
      }
    } catch (err: unknown) {
      const msg = (err as Error)?.message
      if (msg === 'Payment cancelled') return
      if (msg === 'Payment timeout') {
        toast.error('Payment session timed out. Please try again.')
        return
      }
      const apiMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(apiMsg || msg || 'Failed to place order')
    }
  }

  const displayTotal = backendTotal ?? total

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-heading text-4xl text-[#E8F4FD] tracking-wider mb-2">CHECKOUT</h1>
      <div className="h-0.5 w-10 bg-[#00D4FF] mb-8" />

      {/* Step indicators */}
      <div className="flex items-center mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <StepDot step={i} current={step} />
              <span className={`mt-1 font-mono text-[10px] ${step === i ? 'text-[#00D4FF]' : 'text-[#4A7FA5]'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="w-16 h-0.5 bg-[rgba(0,212,255,0.15)] mx-1 mb-5" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Step 0: Address */}
          {step === 0 && (
            <div className="hud-card p-6">
              <h2 className="font-heading text-xl text-[#E8F4FD] tracking-wider mb-6">SHIPPING ADDRESS</h2>

              {isLoggedIn && addresses && addresses.length > 0 && !showNewAddrForm && (
                <div className="space-y-3 mb-6">
                  {addresses.map((addr) => (
                    <label key={addr.id} className={`hud-card p-4 flex gap-3 cursor-pointer ${selectedAddressId === addr.id ? 'border-[#00D4FF]' : ''}`}>
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 accent-[#00D4FF]"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs border border-[#4A7FA5] text-[#4A7FA5] px-1.5 py-0.5 rounded">{addr.label}</span>
                          {addr.is_default && <span className="font-mono text-xs text-[#00FF88]">DEFAULT</span>}
                        </div>
                        <p className="text-sm text-[#E8F4FD]">{addr.name} · {addr.phone}</p>
                        <p className="text-xs text-[#4A7FA5] mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pin}</p>
                      </div>
                    </label>
                  ))}
                  <button onClick={() => setShowNewAddrForm(true)} className="btn-cyan w-full mt-2">
                    + USE NEW ADDRESS
                  </button>
                </div>
              )}

              {(!isLoggedIn || showNewAddrForm || !addresses?.length) && (
                <AddressForm
                  onSubmit={(data) => {
                    setNewAddress(data)
                    setShowNewAddrForm(true)
                  }}
                  submitLabel="SAVE & CONTINUE"
                />
              )}

              {(selectedAddressId || newAddress) && (
                <button onClick={handleAddressNext} className="btn-gold w-full mt-4 py-3">
                  CONTINUE TO PAYMENT
                </button>
              )}
            </div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <div className="hud-card p-6">
              <h2 className="font-heading text-xl text-[#E8F4FD] tracking-wider mb-6">PAYMENT METHOD</h2>
              <PaymentSelect selected={paymentMethod} onSelect={setPaymentMethod} />
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className="btn-cyan flex-1">BACK</button>
                <button
                  onClick={handlePaymentNext}
                  disabled={isValidating}
                  className="btn-gold flex-1 py-3 flex items-center justify-center gap-2"
                >
                  {isValidating ? <><Spinner size={16} /> VALIDATING...</> : 'REVIEW ORDER'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <div className="hud-card p-6">
              <h2 className="font-heading text-xl text-[#E8F4FD] tracking-wider mb-6">CONFIRM ORDER</h2>

              {/* P1: Price change warning */}
              {priceChanges.length > 0 && (
                <div className="border border-[#FFB700] bg-[rgba(255,183,0,0.06)] rounded p-4 mb-5">
                  <p className="font-mono text-xs text-[#FFB700] mb-2">⚠ PRICES UPDATED</p>
                  <div className="space-y-1">
                    {priceChanges.map((c) => (
                      <div key={c.variantId} className="flex justify-between text-xs font-mono">
                        <span className="text-[#E8F4FD]">{c.name}</span>
                        <span>
                          <span className="line-through text-[#4A7FA5]">{fmt(c.oldPrice)}</span>
                          {' → '}
                          <span className="text-[#FFB700]">{fmt(c.newPrice)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#4A7FA5] mt-2 font-mono">
                    Cart prices have been updated to current rates.
                  </p>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#E8F4FD]">{item.product.name} <span className="text-[#4A7FA5]">× {item.qty}</span></span>
                    <span className="font-mono text-[#FFB700]">{fmt(item.variant.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              <Divider className="mb-4" />

              <div className="flex justify-between mb-2 text-sm">
                <span className="text-[#4A7FA5] font-mono">Subtotal</span>
                <span className="font-mono text-[#E8F4FD]">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between mb-4 text-sm">
                <span className="text-[#4A7FA5] font-mono">Shipping</span>
                <span className={`font-mono ${shipping === 0 ? 'text-[#00FF88]' : 'text-[#E8F4FD]'}`}>{shipping === 0 ? 'FREE' : fmt(shipping)}</span>
              </div>

              <Divider className="mb-4" />

              <div className="flex justify-between mb-6">
                <span className="font-heading text-lg text-[#E8F4FD]">TOTAL</span>
                <span className="font-mono text-xl text-[#FFB700] font-bold">{fmt(displayTotal)}</span>
              </div>

              <div className="flex items-center gap-2 mb-2 text-sm">
                <span className="text-[#4A7FA5] font-mono">Payment:</span>
                <span className="text-[#00D4FF] font-mono">{paymentMethod}</span>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-cyan flex-1">BACK</button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPending}
                  className="btn-gold flex-1 py-3 flex items-center justify-center gap-2"
                >
                  {isPending ? <><Spinner size={16} /> PLACING...</> : 'PLACE ORDER'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar summary */}
        <div className="hud-card p-5 h-fit">
          <h3 className="font-heading text-base text-[#E8F4FD] tracking-wider mb-4">
            CART ({items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'})
          </h3>
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <span className="text-[#4A7FA5] line-clamp-1 max-w-[60%]">{item.product.name}</span>
                <span className="font-mono text-[#E8F4FD]">{fmt(item.variant.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <Divider className="my-3" />
          <div className="flex justify-between font-mono text-sm">
            <span className="text-[#4A7FA5]">Total</span>
            <span className="text-[#FFB700] font-bold">{fmt(displayTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
