import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, cartApi, ordersApi, addressesApi, authApi, adminApi } from '@/services/api'
import { useAuthStore } from '@/store/auth.store'
import type { ProductFilters } from '@/types'
import toast from 'react-hot-toast'

/* ─── Products ───────────────────────────────────────────────────── */
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getAll(filters).then((r) => r.data),
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug).then((r) => r.data),
    enabled: !!slug,
  })
}

export function useProductById(id: string) {
  return useQuery({
    queryKey: ['product-id', id],
    queryFn: () => productsApi.getById(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useProductReviews(slug: string) {
  return useQuery({
    queryKey: ['reviews', slug],
    queryFn: () => productsApi.getReviews(slug).then((r) => r.data),
    enabled: !!slug,
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      productsApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated successfully')
    },
    onError: () => toast.error('Failed to update product'),
  })
}

/* ─── Cart ───────────────────────────────────────────────────────── */
export function useCart() {
  const { isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then((r) => r.data),
    enabled: isLoggedIn,
  })
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { variantId: string; qty: number }) =>
      cartApi.addItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Added to cart')
    },
    onError: () => toast.error('Failed to add to cart'),
  })
}

export function useRemoveFromCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => cartApi.removeItem(itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => toast.error('Failed to remove item'),
  })
}

/* ─── Orders ─────────────────────────────────────────────────────── */
export function useOrders() {
  const { isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll().then((r) => r.data),
    enabled: isLoggedIn,
    refetchOnMount: 'always',
  })
}

export function useOrder(id: string) {
  const { isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id).then((r) => r.data),
    enabled: isLoggedIn && !!id,
    refetchOnMount: 'always',
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { paymentMethod: string; addressId: string; razorpay?: Record<string, string> }) =>
      ordersApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['orders'] })   // wipe cache so orders page shows fresh spinner
      qc.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

/* ─── Addresses ──────────────────────────────────────────────────── */
export function useAddresses() {
  const { isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.getAll().then((r) => r.data),
    enabled: isLoggedIn,
  })
}

export function useCreateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof addressesApi.create>[0]) =>
      addressesApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Address saved')
    },
    onError: () => toast.error('Failed to save address'),
  })
}

export function useUpdateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      addressesApi.update(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Address updated')
    },
    onError: () => toast.error('Failed to update address'),
  })
}

export function useDeleteAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => addressesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Address removed')
    },
    onError: () => toast.error('Failed to remove address'),
  })
}

export function useSetDefaultAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => addressesApi.setDefault(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
    onError: () => toast.error('Failed to set default'),
  })
}

/* ─── Admin ──────────────────────────────────────────────────────── */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data),
  })
}

export function useAdminOrders(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin-orders', params],
    queryFn: () => adminApi.getAllOrders(params).then((r) => r.data),
  })
}

export function useAdminCustomers(params?: { page?: number; search?: string }) {
  return useQuery({
    queryKey: ['admin-customers', params],
    queryFn: () => adminApi.getAllCustomers(params).then((r) => r.data),
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Order status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })
}

/* ─── Inventory ──────────────────────────────────────────────────── */
export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => adminApi.getInventory().then((r) => r.data),
    refetchOnMount: 'always',
  })
}

export function useStockMovements(params?: { page?: number; type?: string }) {
  return useQuery({
    queryKey: ['stock-movements', params],
    queryFn: () => adminApi.getMovements(params).then((r) => r.data),
  })
}

export function useRestock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { variantId: string; qty: number; note?: string }) =>
      adminApi.restock(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['stock-movements'] })
      toast.success('Stock updated successfully')
    },
    onError: () => toast.error('Failed to update stock'),
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { variantId: string; qty: number; note?: string }) =>
      adminApi.adjustStock(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['stock-movements'] })
      toast.success('Stock adjusted')
    },
    onError: () => toast.error('Failed to adjust stock'),
  })
}

/* ─── Auth ───────────────────────────────────────────────────────── */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      authApi.updateMe(data).then((r) => r.data),
    onSuccess: () => toast.success('Profile updated'),
    onError: () => toast.error('Failed to update profile'),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data),
    onSuccess: () => toast.success('Password changed successfully'),
    onError: () => toast.error('Failed to change password'),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: { email: string }) => authApi.forgotPassword(data),
    onError: () => toast.error('Something went wrong. Please try again.'),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: { token: string; newPassword: string }) => authApi.resetPassword(data),
    onSuccess: () => toast.success('Password reset! You can now log in.'),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Invalid or expired reset link.')
    },
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onError: () => toast.error('Failed to delete account'),
  })
}
