'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { useUpdateProfile, useChangePassword, useOrders } from '@/hooks'
import { StatusBadge, Divider, PageLoading } from '@/components/ui'
import { fmt, fmtDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoggedIn, updateUser } = useAuthStore()
  const { mutateAsync: updateProfile, isPending: updatingProfile } = useUpdateProfile()
  const { mutateAsync: changePassword, isPending: changingPass } = useChangePassword()
  const { data: orders, isLoading: ordersLoading } = useOrders()

  const [profileForm, setProfileForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' })
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })

  useEffect(() => {
    if (!isLoggedIn) router.push('/auth/login')
  }, [isLoggedIn, router])

  useEffect(() => {
    if (user) setProfileForm({ name: user.name, email: user.email, phone: user.phone })
  }, [user])

  if (!user) return <PageLoading />

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    const updated = await updateProfile(profileForm)
    updateUser(updated)
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (passForm.newPassword !== passForm.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (passForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    await changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword })
    setPassForm({ currentPassword: '', newPassword: '', confirm: '' })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-heading text-4xl text-[#E8F4FD] tracking-wider mb-2">MY PROFILE</h1>
      <div className="h-0.5 w-10 bg-[#00D4FF] mb-8" />

      {/* Personal Info */}
      <form onSubmit={handleProfileSave} className="hud-card p-6 mb-6">
        <h2 className="font-heading text-xl text-[#E8F4FD] tracking-wider mb-6">PERSONAL INFO</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-[#4A7FA5] font-mono mb-1">FULL NAME</label>
            <input value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} className="input-hud" />
          </div>
          <div>
            <label className="block text-xs text-[#4A7FA5] font-mono mb-1">EMAIL</label>
            <input type="email" value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} className="input-hud" />
          </div>
          <div>
            <label className="block text-xs text-[#4A7FA5] font-mono mb-1">PHONE</label>
            <input value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} className="input-hud" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button type="submit" disabled={updatingProfile} className="btn-cyan">
            {updatingProfile ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePasswordSave} className="hud-card p-6 mb-6">
        <h2 className="font-heading text-xl text-[#E8F4FD] tracking-wider mb-6">CHANGE PASSWORD</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#4A7FA5] font-mono mb-1">CURRENT PASSWORD</label>
            <input type="password" value={passForm.currentPassword} onChange={(e) => setPassForm((f) => ({ ...f, currentPassword: e.target.value }))} required className="input-hud" />
          </div>
          <div>
            <label className="block text-xs text-[#4A7FA5] font-mono mb-1">NEW PASSWORD (min 8 chars)</label>
            <input type="password" value={passForm.newPassword} onChange={(e) => setPassForm((f) => ({ ...f, newPassword: e.target.value }))} required minLength={8} className="input-hud" />
          </div>
          <div>
            <label className="block text-xs text-[#4A7FA5] font-mono mb-1">CONFIRM NEW PASSWORD</label>
            <input type="password" value={passForm.confirm} onChange={(e) => setPassForm((f) => ({ ...f, confirm: e.target.value }))} required className="input-hud" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button type="submit" disabled={changingPass} className="btn-cyan">
            {changingPass ? 'CHANGING...' : 'CHANGE PASSWORD'}
          </button>
        </div>
      </form>

      {/* Recent Orders */}
      <div className="hud-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl text-[#E8F4FD] tracking-wider">YOUR ORDERS</h2>
          <Link href="/account/orders" className="font-mono text-xs text-[#00D4FF] hover:underline">VIEW ALL</Link>
        </div>
        {ordersLoading ? (
          <p className="text-[#4A7FA5] font-mono text-sm">Loading...</p>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-[rgba(0,212,255,0.08)] last:border-0">
                <div>
                  <p className="font-mono text-xs text-[#00D4FF]">{order.order_number}</p>
                  <p className="font-mono text-[10px] text-[#4A7FA5]">{fmtDate(order.created_at)}</p>
                </div>
                <StatusBadge status={order.status} />
                <span className="font-mono text-sm text-[#FFB700]">{fmt(order.total)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#4A7FA5] text-sm">No orders yet.</p>
        )}
      </div>
    </div>
  )
}
