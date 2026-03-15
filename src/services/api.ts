import axios from 'axios'
import { API_BASE_URL, ENDPOINTS } from '@/config'
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
  baseURL: API_BASE_URL,
  timeout: 35_000,
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

// Auto-logout on 401 — token expired or invalid
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      try {
        const auth = JSON.parse(localStorage.getItem('nn-auth') || '{}')
        if (auth?.state?.token) {
          // Clear stale auth state
          localStorage.setItem('nn-auth', JSON.stringify({ ...auth, state: { ...auth.state, user: null, token: null, isLoggedIn: false, isAdmin: false } }))
          window.location.href = '/auth/login'
        }
      } catch {}
    }
    return Promise.reject(err)
  }
)

/* ─── Products ───────────────────────────────────────────────────── */
export const productsApi = {
  getAll(filters?: ProductFilters) {
    return api.get<PaginatedResponse<Product>>(ENDPOINTS.products.list, { params: filters })
  },
  getBySlug(slug: string) {
    return api.get<Product>(ENDPOINTS.products.bySlug(slug))
  },
  getById(id: string) {
    return api.get<Product>(ENDPOINTS.products.byId(id))
  },
  create(data: Partial<Product>) {
    return api.post<Product>(ENDPOINTS.products.create, data)
  },
  update(id: string, data: Partial<Product>) {
    return api.put<Product>(ENDPOINTS.products.update(id), data)
  },
  delete(id: string) {
    return api.delete(ENDPOINTS.products.delete(id))
  },
  uploadImage(id: string, formData: FormData) {
    return api.post(ENDPOINTS.products.images(id), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  setPrimaryImage(productId: string, imageId: string) {
    return api.put(ENDPOINTS.products.imagePrimary(productId, imageId))
  },
  deleteImage(productId: string, imageId: string) {
    return api.delete(ENDPOINTS.products.imageDelete(productId, imageId))
  },
  getReviews(slug: string) {
    return api.get<Review[]>(ENDPOINTS.products.reviews(slug))
  },
}

/* ─── Cart ───────────────────────────────────────────────────────── */
export const cartApi = {
  get() {
    return api.get<Cart>(ENDPOINTS.cart.root)
  },
  addItem(data: { variantId: string; qty: number }) {
    return api.post(ENDPOINTS.cart.items, data)
  },
  updateItem(itemId: string, qty: number) {
    return api.put(ENDPOINTS.cart.item(itemId), { qty })
  },
  removeItem(itemId: string) {
    return api.delete(ENDPOINTS.cart.item(itemId))
  },
  clear() {
    return api.delete(ENDPOINTS.cart.root)
  },
}

/* ─── Orders ─────────────────────────────────────────────────────── */
export const ordersApi = {
  create(data: { paymentMethod: string; addressId: string; razorpay?: Record<string, string> }) {
    return api.post<Order>(ENDPOINTS.orders.root, data)
  },
  getAll() {
    return api.get<Order[]>(ENDPOINTS.orders.root)
  },
  getById(id: string) {
    return api.get<Order>(ENDPOINTS.orders.byId(id))
  },
  cancel(id: string) {
    return api.put(ENDPOINTS.orders.cancel(id))
  },
}

/* ─── Addresses ──────────────────────────────────────────────────── */
export const addressesApi = {
  getAll() {
    return api.get<Address[]>(ENDPOINTS.addresses.root)
  },
  create(data: Omit<Address, 'id' | 'is_default'>) {
    return api.post<Address>(ENDPOINTS.addresses.root, data)
  },
  update(id: string, data: Partial<Address>) {
    return api.put<Address>(ENDPOINTS.addresses.byId(id), data)
  },
  delete(id: string) {
    return api.delete(ENDPOINTS.addresses.byId(id))
  },
  setDefault(id: string) {
    return api.put(ENDPOINTS.addresses.setDefault(id))
  },
}

/* ─── Auth ───────────────────────────────────────────────────────── */
export const authApi = {
  login(data: { email: string; password: string }) {
    return api.post<AuthResponse>(ENDPOINTS.auth.login, data)
  },
  register(data: { name: string; email: string; phone: string; password: string }) {
    return api.post<AuthResponse>(ENDPOINTS.auth.register, data)
  },
  me() {
    return api.get<User>(ENDPOINTS.auth.me)
  },
  updateMe(data: Partial<User>) {
    return api.put<User>(ENDPOINTS.auth.me, data)
  },
  changePassword(data: { currentPassword: string; newPassword: string }) {
    return api.put(ENDPOINTS.auth.mePassword, data)
  },
  forgotPassword(data: { email: string }) {
    return api.post<{ message: string }>(ENDPOINTS.auth.forgotPassword, data)
  },
  resetPassword(data: { token: string; newPassword: string }) {
    return api.post<{ message: string }>(ENDPOINTS.auth.resetPassword, data)
  },
  deleteAccount() {
    return api.delete(ENDPOINTS.auth.me)
  },
  logout() {
    return api.post(ENDPOINTS.auth.logout)
  },
}

/* ─── Payments ───────────────────────────────────────────────────── */
export const paymentsApi = {
  createRazorpayOrder(data: { amount: number }) {
    return api.post<{ razorpay_order_id: string; amount: number; currency: string }>(
      ENDPOINTS.payments.razorpayOrder,
      data
    )
  },
  verifyRazorpay(data: {
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) {
    return api.post(ENDPOINTS.payments.razorpayVerify, data)
  },
}

/* ─── Admin ──────────────────────────────────────────────────────── */
export const adminApi = {
  getStats() {
    return api.get<AdminStats>(ENDPOINTS.admin.stats)
  },
  getAllOrders(params?: { status?: string; page?: number }) {
    return api.get<PaginatedResponse<Order>>(ENDPOINTS.admin.orders, { params })
  },
  updateOrderStatus(id: string, status: string) {
    return api.put(ENDPOINTS.admin.orderStatus(id), { status })
  },
  getAllCustomers(params?: { page?: number; search?: string }) {
    return api.get(ENDPOINTS.admin.customers, { params })
  },
}

export default api
