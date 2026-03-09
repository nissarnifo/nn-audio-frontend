import axios from 'axios'
import type {
  Product,
  ProductFilters,
  PaginatedResponse,
  Cart,
  Order,
  Address,
  AuthResponse,
  User,
  AdminStats,
  Review,
} from '@/types'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
})

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const auth = JSON.parse(localStorage.getItem('nn-auth') || '{}')
      const token = auth?.state?.token
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {}
  }
  return config
})

/* ─── Products ───────────────────────────────────────────────────── */
export const productsApi = {
  getAll(filters?: ProductFilters) {
    return api.get<PaginatedResponse<Product>>('/products', { params: filters })
  },
  getBySlug(slug: string) {
    return api.get<Product>(`/products/${slug}`)
  },
  getById(id: string) {
    return api.get<Product>(`/products/id/${id}`)
  },
  create(data: Partial<Product>) {
    return api.post<Product>('/products', data)
  },
  update(id: string, data: Partial<Product>) {
    return api.put<Product>(`/products/${id}`, data)
  },
  delete(id: string) {
    return api.delete(`/products/${id}`)
  },
  uploadImage(id: string, formData: FormData) {
    return api.post(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteImage(productId: string, imageId: string) {
    return api.delete(`/products/${productId}/images/${imageId}`)
  },
  getReviews(slug: string) {
    return api.get<Review[]>(`/products/${slug}/reviews`)
  },
}

/* ─── Cart ───────────────────────────────────────────────────────── */
export const cartApi = {
  get() {
    return api.get<Cart>('/cart')
  },
  addItem(data: { variantId: string; qty: number }) {
    return api.post('/cart/items', data)
  },
  updateItem(itemId: string, qty: number) {
    return api.put(`/cart/items/${itemId}`, { qty })
  },
  removeItem(itemId: string) {
    return api.delete(`/cart/items/${itemId}`)
  },
  clear() {
    return api.delete('/cart')
  },
}

/* ─── Orders ─────────────────────────────────────────────────────── */
export const ordersApi = {
  create(data: { paymentMethod: string; addressId: string; razorpay?: Record<string, string> }) {
    return api.post<Order>('/orders', data)
  },
  getAll() {
    return api.get<Order[]>('/orders')
  },
  getById(id: string) {
    return api.get<Order>(`/orders/${id}`)
  },
  cancel(id: string) {
    return api.put(`/orders/${id}/cancel`)
  },
}

/* ─── Addresses ──────────────────────────────────────────────────── */
export const addressesApi = {
  getAll() {
    return api.get<Address[]>('/addresses')
  },
  create(data: Omit<Address, 'id' | 'is_default'>) {
    return api.post<Address>('/addresses', data)
  },
  update(id: string, data: Partial<Address>) {
    return api.put<Address>(`/addresses/${id}`, data)
  },
  delete(id: string) {
    return api.delete(`/addresses/${id}`)
  },
  setDefault(id: string) {
    return api.put(`/addresses/${id}/default`)
  },
}

/* ─── Auth ───────────────────────────────────────────────────────── */
export const authApi = {
  login(data: { email: string; password: string }) {
    return api.post<AuthResponse>('/auth/login', data)
  },
  register(data: { name: string; email: string; phone: string; password: string }) {
    return api.post<AuthResponse>('/auth/register', data)
  },
  me() {
    return api.get<User>('/auth/me')
  },
  updateMe(data: Partial<User>) {
    return api.put<User>('/auth/me', data)
  },
  changePassword(data: { currentPassword: string; newPassword: string }) {
    return api.put('/auth/me/password', data)
  },
  logout() {
    return api.post('/auth/logout')
  },
  googleAuth(idToken: string) {
    return api.post<AuthResponse>('/auth/google', { idToken })
  },
}

/* ─── Payments ───────────────────────────────────────────────────── */
export const paymentsApi = {
  createRazorpayOrder(data: { amount: number }) {
    return api.post<{ razorpay_order_id: string; amount: number; currency: string }>(
      '/payments/razorpay/order',
      data
    )
  },
  verifyRazorpay(data: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) {
    return api.post('/payments/razorpay/verify', data)
  },
}

/* ─── Admin ──────────────────────────────────────────────────────── */
export const adminApi = {
  getStats() {
    return api.get<AdminStats>('/admin/stats')
  },
  getAllOrders(params?: { status?: string; page?: number }) {
    return api.get<PaginatedResponse<Order>>('/admin/orders', { params })
  },
  updateOrderStatus(id: string, status: string) {
    return api.put(`/admin/orders/${id}/status`, { status })
  },
  getAllCustomers(params?: { page?: number; search?: string }) {
    return api.get('/admin/customers', { params })
  },
}

export default api
