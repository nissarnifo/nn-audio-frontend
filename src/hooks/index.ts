import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, cartApi, ordersApi, addressesApi, authApi, adminApi, returnsApi, wishlistApi, settingsApi, newsletterApi } from '@/services/api'
import type { StoreSettings } from '@/services/api'
import { useAuthStore } from '@/store/auth.store'
import { useWishlistStore } from '@/store/wishlist.store'
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

export function useCreateReview(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      productsApi.createReview(slug, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', slug] })
      qc.invalidateQueries({ queryKey: ['product', slug] })
      toast.success('Review submitted!')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Failed to submit review')
    },
  })
}

export function useSetProductSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; sale_price: number | null; sale_start_at?: string | null; sale_end_at?: string | null }) =>
      productsApi.setSale(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Sale updated')
    },
    onError: () => toast.error('Failed to update sale'),
  })
}

export function useBulkProductAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: 'activate' | 'deactivate' }) =>
      productsApi.bulkAction(ids, action).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success(`${data.updated} product${data.updated !== 1 ? 's' : ''} updated`)
    },
    onError: () => toast.error('Bulk action failed'),
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
    mutationFn: ({
      idempotencyKey,
      ...data
    }: {
      paymentMethod: string
      addressId: string
      razorpay?: Record<string, string>
      couponCode?: string
      notes?: string
      idempotencyKey?: string
    }) => ordersApi.create(data, idempotencyKey).then((r) => r.data),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export function useCancelOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['order', id] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order cancelled successfully')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Failed to cancel order')
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

export function useAdminNotifications() {
  return useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => adminApi.getNotifications().then((r) => r.data),
    refetchInterval: 60_000, // poll every 60s
    staleTime: 30_000,
  })
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminApi.getAnalytics().then((r) => r.data),
    staleTime: 5 * 60 * 1000, // 5 min — chart data doesn't need real-time updates
  })
}

export function useAdminOrders(params?: { status?: string; page?: number; from?: string; to?: string; search?: string }) {
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

export function useAdminCustomer(id: string) {
  return useQuery({
    queryKey: ['admin-customer', id],
    queryFn: () => adminApi.getCustomer(id).then((r) => r.data),
    enabled: !!id,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, tracking_number, tracking_url }: { id: string; status: string; tracking_number?: string; tracking_url?: string }) =>
      adminApi.updateOrderStatus(id, status, tracking_number, tracking_url),
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

/* ─── Returns ────────────────────────────────────────────────────── */
export function useMyReturns() {
  const { isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: ['my-returns'],
    queryFn: () => returnsApi.getMyReturns().then((r) => r.data),
    enabled: isLoggedIn,
  })
}

export function useSubmitReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { orderId: string; reason: string; notes?: string }) =>
      returnsApi.submit(data).then((r) => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['my-returns'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order', variables.orderId] })
      toast.success('Return request submitted')
    },
    onError: (err: unknown) => {
      const axErr = err as { response?: { data?: { error?: string } | string }; code?: string }
      const data = axErr?.response?.data
      const msg = typeof data === 'object' && data !== null ? (data.error || data.message) : undefined
      if (msg) {
        toast.error(msg)
      } else if (!axErr?.response) {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error('Failed to submit return request. Please try again.')
      }
    },
  })
}

export function useAdminReturns(params?: { page?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin-returns', params],
    queryFn: () => adminApi.getReturns(params).then((r) => r.data),
  })
}

export function useUpdateReturnStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, admin_note }: { id: string; status: string; admin_note?: string }) =>
      adminApi.updateReturnStatus(id, status, admin_note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-returns'] })
      toast.success('Return status updated')
    },
    onError: () => toast.error('Failed to update return status'),
  })
}

/* ─── Wishlist ───────────────────────────────────────────────────── */
export function useServerWishlist() {
  const { isLoggedIn } = useAuthStore()
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.get().then((r) => r.data),
    enabled: isLoggedIn,
  })
}

/**
 * Unified wishlist hook — server-backed when logged in, Zustand when guest.
 * Returns the same { toggle, has, items, count, clear } interface as the store.
 */
export function useWishlist() {
  const { isLoggedIn } = useAuthStore()
  const qc = useQueryClient()

  // Guest: Zustand store
  const store = useWishlistStore()

  // Logged-in: server data
  const { data: serverItems = [] } = useServerWishlist()

  const addMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.add(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
    onError: () => toast.error('Failed to update wishlist'),
  })

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.remove(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
    onError: () => toast.error('Failed to update wishlist'),
  })

  const clearMutation = useMutation({
    mutationFn: () => wishlistApi.clear(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
    onError: () => toast.error('Failed to clear wishlist'),
  })

  if (!isLoggedIn) {
    return {
      items: store.items,
      count: store.count,
      toggle: (product: import('@/types').Product) => store.toggle(product),
      has: (id: string) => store.has(id),
      clear: () => store.clear(),
      isServer: false,
    }
  }

  return {
    items: serverItems,
    count: serverItems.length,
    toggle: (product: import('@/types').Product) => {
      const isIn = serverItems.some((p) => p.id === product.id)
      if (isIn) removeMutation.mutate(product.id)
      else addMutation.mutate(product.id)
    },
    has: (id: string) => serverItems.some((p) => p.id === id),
    clear: () => clearMutation.mutate(),
    isServer: true,
  }
}

/* ─── Questions ──────────────────────────────────────────────────── */
export function useProductQuestions(slug: string) {
  return useQuery({
    queryKey: ['questions', slug],
    queryFn: () => productsApi.getQuestions(slug).then((r) => r.data),
    enabled: !!slug,
  })
}

export function useSubmitQuestion(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { question: string }) =>
      productsApi.submitQuestion(slug, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Question submitted! It will appear once answered.')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Failed to submit question')
    },
  })
}

export function useAdminQuestions(params?: { page?: number; answered?: boolean }) {
  return useQuery({
    queryKey: ['admin-questions', params],
    queryFn: () => adminApi.getQuestions(params).then((r) => r.data),
  })
}

export function useAnswerQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; answer?: string; is_published?: boolean }) =>
      adminApi.answerQuestion(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-questions'] })
      toast.success('Question answered')
    },
    onError: () => toast.error('Failed to answer question'),
  })
}

export function useDeleteQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteQuestion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-questions'] })
      toast.success('Question deleted')
    },
    onError: () => toast.error('Failed to delete question'),
  })
}

/* ─── Settings ──────────────────────────────────────────────────── */
export function usePublicSettings() {
  return useQuery({
    queryKey: ['settings-public'],
    queryFn: () => settingsApi.getPublic().then((r) => r.data),
    staleTime: 60_000, // refetch at most once per minute
  })
}

export function useAllSettings() {
  return useQuery({
    queryKey: ['settings-all'],
    queryFn: () => settingsApi.getAll().then((r) => r.data),
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (settings: Partial<StoreSettings>) => settingsApi.update(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-public'] })
      qc.invalidateQueries({ queryKey: ['settings-all'] })
      toast.success('Settings saved')
    },
    onError: () => toast.error('Failed to save settings'),
  })
}

/* ─── Admin Reviews ──────────────────────────────────────────────── */
export function useAdminReviews(params?: { page?: number; rating?: number; search?: string }) {
  return useQuery({
    queryKey: ['admin-reviews', params],
    queryFn: () => adminApi.getAllReviews(params).then((r) => r.data),
  })
}

export function useDeleteAdminReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      toast.success('Review deleted')
    },
    onError: () => toast.error('Failed to delete review'),
  })
}

// ─── Newsletter ──────────────────────────────────────────────────────────────

export function useNewsletterSubscribe() {
  return useMutation({
    mutationFn: ({ email, source }: { email: string; source?: string }) =>
      newsletterApi.subscribe(email, source).then((r) => r.data),
  })
}

export function useNewsletterSubscribers(params?: { page?: number; limit?: number; search?: string; filter?: string }) {
  return useQuery({
    queryKey: ['newsletter-subscribers', params],
    queryFn: () => newsletterApi.getSubscribers(params).then((r) => r.data),
  })
}

export function useDeleteNewsletterSubscriber() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => newsletterApi.deleteSubscriber(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter-subscribers'] })
      toast.success('Subscriber removed')
    },
    onError: () => toast.error('Failed to remove subscriber'),
  })
}
