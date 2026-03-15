'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, Star } from 'lucide-react'
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from '@/hooks'
import { useAuthStore } from '@/store/auth.store'
import AddressForm from '@/components/checkout/AddressForm'
import { PageLoading, Badge } from '@/components/ui'
import type { Address } from '@/types'

const MAX_ADDRESSES = 5

export default function AddressesPage() {
  const router = useRouter()
  const { isLoggedIn, _hasHydrated } = useAuthStore()
  const { data: addresses, isLoading } = useAddresses()
  const { mutateAsync: createAddress, isPending: creating } = useCreateAddress()
  const { mutateAsync: updateAddress, isPending: updating } = useUpdateAddress()
  const { mutateAsync: deleteAddress } = useDeleteAddress()
  const { mutateAsync: setDefault } = useSetDefaultAddress()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (_hasHydrated && !isLoggedIn) router.push('/auth/login')
  }, [_hasHydrated, isLoggedIn, router])

  if (!_hasHydrated || isLoading) return <PageLoading />

  const atLimit = (addresses?.length ?? 0) >= MAX_ADDRESSES

  async function handleCreate(data: Omit<Address, 'id' | 'is_default'>) {
    await createAddress(data)
    setShowAddForm(false)
  }

  async function handleUpdate(id: string, data: Omit<Address, 'id' | 'is_default'>) {
    await updateAddress({ id, data })
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    await deleteAddress(id)
    setConfirmDeleteId(null)
  }

  const labelColor: Record<string, 'cyan' | 'gold' | 'muted'> = {
    HOME: 'cyan', OFFICE: 'gold', OTHER: 'muted',
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl text-[#E8F4FD] tracking-wider mb-1">ADDRESSES</h1>
          <div className="h-0.5 w-10 bg-[#00D4FF]" />
        </div>
        {!atLimit && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn-cyan flex items-center gap-1.5">
            <Plus size={15} /> ADD ADDRESS
          </button>
        )}
        {atLimit && (
          <p className="font-mono text-xs text-[#FF3366]">MAX {MAX_ADDRESSES} ADDRESSES</p>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="hud-card p-6 mb-6 border-[#00D4FF]">
          <h2 className="font-heading text-lg text-[#E8F4FD] tracking-wider mb-4">NEW ADDRESS</h2>
          <AddressForm onSubmit={handleCreate} loading={creating} />
          <button onClick={() => setShowAddForm(false)} className="btn-red mt-3 text-xs">CANCEL</button>
        </div>
      )}

      {/* Address list */}
      {!addresses || addresses.length === 0 ? (
        <div className="hud-card p-12 text-center">
          <p className="font-heading text-xl text-[#E8F4FD] mb-2">No Addresses Saved</p>
          <p className="text-[#4A7FA5] text-sm">Add an address to speed up your checkout.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="hud-card p-5">
              {editingId === addr.id ? (
                <>
                  <h3 className="font-heading text-base text-[#E8F4FD] tracking-wider mb-4">EDIT ADDRESS</h3>
                  <AddressForm initial={addr} onSubmit={(data) => handleUpdate(addr.id, data)} loading={updating} submitLabel="UPDATE" />
                  <button onClick={() => setEditingId(null)} className="btn-red mt-3 text-xs">CANCEL</button>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge color={labelColor[addr.label] ?? 'muted'}>{addr.label}</Badge>
                      {addr.is_default && <Badge color="green">DEFAULT</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {!addr.is_default && (
                        <button onClick={() => setDefault(addr.id)} title="Set as default" className="p-1.5 text-[#4A7FA5] hover:text-[#FFB700] transition-colors">
                          <Star size={14} />
                        </button>
                      )}
                      <button onClick={() => setEditingId(addr.id)} className="p-1.5 text-[#4A7FA5] hover:text-[#00D4FF] transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setConfirmDeleteId(addr.id)} className="p-1.5 text-[#4A7FA5] hover:text-[#FF3366] transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#E8F4FD]">{addr.name} · {addr.phone}</p>
                  <p className="text-xs text-[#4A7FA5] mt-0.5">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pin}
                  </p>

                  {/* Confirm delete */}
                  {confirmDeleteId === addr.id && (
                    <div className="mt-4 pt-4 border-t border-[rgba(255,51,102,0.2)] flex items-center gap-3">
                      <p className="text-xs text-[#FF3366] font-mono flex-1">Delete this address?</p>
                      <button onClick={() => handleDelete(addr.id)} className="btn-red text-xs">YES, DELETE</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="btn-cyan text-xs">CANCEL</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
