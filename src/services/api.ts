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
  Coupon,
  CouponValidation,
  ReturnRequest,
  Question,
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
  createReview(slug: string, data: { rating: number; comment: string }) {
    return api.post<Review>(ENDPOINTS.products.reviews(slug), data)
  },
  setSale(id: string, data: { sale_price: number | null; sale_start_at?: string | null; sale_end_at?: string | null }) {
    return api.patch<Product>(ENDPOINTS.products.sale(id), data)
  },
  getQuestions(slug: string) {
    return api.get<Question[]>(ENDPOINTS.products.questions(slug))
  },
  submitQuestion(slug: string, data: { question: string }) {
    return api.post<{ id: string; question: string; created_at: string }>(ENDPOINTS.products.questions(slug), data)
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
export const couponsApi = {
  validate(code: string, subtotal: number) {
    return api.get<CouponValidation>(ENDPOINTS.coupons.validate, { params: { code, subtotal } })
  },
  getAll() {
    return api.get<Coupon[]>(ENDPOINTS.coupons.root)
  },
  create(data: { code: string; type: string; value: number; min_order?: number; max_uses?: number | null; expires_at?: string | null }) {
    return api.post<Coupon>(ENDPOINTS.coupons.root, data)
  },
  update(id: string, data: Partial<Coupon>) {
    return api.put<Coupon>(ENDPOINTS.coupons.byId(id), data)
  },
  remove(id: string) {
    return api.delete(ENDPOINTS.coupons.byId(id))
  },
}

export const ordersApi = {
  create(
    data: { paymentMethod: string; addressId: string; razorpay?: Record<string, string>; couponCode?: string },
    idempotencyKey?: string
  ) {
    return api.post<Order>(ENDPOINTS.orders.root, data, {
      headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : undefined,
    })
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

/* ─── Settings ──────────────────────────────────────────────────── */
export interface AdminReview {
  id: string
  rating: number
  comment: string
  created_at: string
  product: { id: string; name: string; slug: string }
  user: { id: string; name: string; email: string }
}

export interface StoreSettings {
  banner_enabled: string
  banner_text: string
  banner_color: string
  banner_link: string
  [key: string]: string
}

export const settingsApi = {
  getPublic() {
    return api.get<StoreSettings>(ENDPOINTS.settings.public)
  },
  getAll() {
    return api.get<StoreSettings>(ENDPOINTS.settings.all)
  },
  update(settings: Partial<StoreSettings>) {
    return api.put<{ ok: boolean }>(ENDPOINTS.settings.update, settings)
  },
}

/* ─── Wishlist ───────────────────────────────────────────────────── */
export const wishlistApi = {
  get() {
    return api.get<Product[]>(ENDPOINTS.wishlist.root)
  },
  add(productId: string) {
    return api.post<{ ok: boolean }>(ENDPOINTS.wishlist.root, { productId })
  },
  remove(productId: string) {
    return api.delete(ENDPOINTS.wishlist.item(productId))
  },
  clear() {
    return api.delete(ENDPOINTS.wishlist.root)
  },
}

/* ─── Returns ────────────────────────────────────────────────────── */
export const returnsApi = {
  submit(data: { orderId: string; reason: string; notes?: string }) {
    return api.post<{ id: string; status: string; created_at: string }>(ENDPOINTS.returns.root, data)
  },
  getMyReturns() {
    return api.get<ReturnRequest[]>(ENDPOINTS.returns.me)
  },
}

/* ─── Admin ──────────────────────────────────────────────────────── */
export interface CustomerDetail {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  created_at: string
  stats: {
    total_spend: number
    avg_order_value: number
    order_count: number
    return_count: number
    review_count: number
  }
  orders: {
    id: string
    order_number: string
    status: string
    payment_status: string
    total: number
    item_count: number
    created_at: string
  }[]
  returns: {
    id: string
    status: string
    reason: string
    admin_note: string | null
    order_number: string
    order_total: number
    created_at: string
  }[]
  reviews: {
    id: string
    rating: number
    comment: string
    product_name: string
    product_slug: string
    created_at: string
  }[]
}

export interface AnalyticsData {
  daily_revenue: { day: string; revenue: number; orders: number }[]
  category_revenue: { category: string; revenue: number; units: number }[]
  new_customers: { month: string; count: number }[]
  coupon_usage: { code: string; uses: number; total_savings: number }[]
}

export const adminApi = {
  getStats() {
    return api.get<AdminStats>(ENDPOINTS.admin.stats)
  },
  getAnalytics() {
    return api.get<AnalyticsData>(ENDPOINTS.admin.analytics)
  },
  getAllOrders(params?: { status?: string; page?: number }) {
    return api.get<PaginatedResponse<Order>>(ENDPOINTS.admin.orders, { params })
  },
  updateOrderStatus(id: string, status: string, tracking_number?: string, tracking_url?: string) {
    return api.put(ENDPOINTS.admin.orderStatus(id), { status, tracking_number, tracking_url })
  },
  getAllCustomers(params?: { page?: number; search?: string }) {
    return api.get(ENDPOINTS.admin.customers, { params })
  },
  getCustomer(id: string) {
    return api.get<CustomerDetail>(ENDPOINTS.admin.customerById(id))
  },
  // Inventory
  getInventory() {
    return api.get<{ variants: InventoryVariant[]; summary: InventorySummary }>(ENDPOINTS.admin.inventory)
  },
  restock(data: { variantId: string; qty: number; note?: string }) {
    return api.post(ENDPOINTS.admin.inventoryRestock, data)
  },
  adjustStock(data: { variantId: string; qty: number; note?: string }) {
    return api.post(ENDPOINTS.admin.inventoryAdjust, data)
  },
  getMovements(params?: { page?: number; type?: string }) {
    return api.get<{ data: StockMovement[]; total: number; page: number; total_pages: number }>(
      ENDPOINTS.admin.inventoryMovements, { params }
    )
  },
  getReturns(params?: { page?: number; status?: string }) {
    return api.get<{ data: ReturnRequest[]; total: number; page: number; total_pages: number }>(
      ENDPOINTS.admin.returns, { params }
    )
  },
  updateReturnStatus(id: string, status: string, admin_note?: string) {
    return api.put(ENDPOINTS.admin.returnStatus(id), { status, admin_note })
  },
  getQuestions(params?: { page?: number; answered?: boolean }) {
    return api.get<{ data: Question[]; total: number; page: number; total_pages: number }>(
      ENDPOINTS.admin.questions, { params }
    )
  },
  answerQuestion(id: string, data: { answer?: string; is_published?: boolean }) {
    return api.put<Question>(ENDPOINTS.admin.questionById(id), data)
  },
  deleteQuestion(id: string) {
    return api.delete(ENDPOINTS.admin.questionById(id))
  },
  getAllReviews(params?: { page?: number; rating?: number; search?: string }) {
    return api.get<{
      data: AdminReview[]
      total: number
      page: number
      total_pages: number
    }>(ENDPOINTS.admin.reviews, { params })
  },
  deleteReview(id: string) {
    return api.delete(ENDPOINTS.admin.reviewById(id))
  },
  getNotifications() {
    return api.get<{
      total: number
      new_orders: number
      pending_returns: number
      unanswered_questions: number
      low_stock_variants: number
    }>(ENDPOINTS.admin.notifications)
  },
}

/* ─── Inventory types (local, not in global types file) ──────────── */
export interface InventoryVariant {
  id: string
  label: string
  price: number
  stock_qty: number
  is_active: boolean
  product: { id: string; name: string; sku: string; category: string; image: string | null }
}
export interface InventorySummary {
  total_skus: number
  out_of_stock: number
  low_stock: number
  total_value: number
}
export interface StockMovement {
  id: string
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN'
  qty: number
  note: string | null
  created_at: string
  variant: { id: string; label: string; price: number }
  product: { name: string; sku: string; category: string }
}

/* ─── Stock Alerts ───────────────────────────────────────────────── */
export const stockAlertsApi = {
  subscribe(data: { email: string; variantId: string }) {
    return api.post<{ ok: boolean; message: string }>(ENDPOINTS.stockAlerts.subscribe, data)
  },
  adminList() {
    return api.get<StockAlertItem[]>(ENDPOINTS.stockAlerts.adminList)
  },
}

export interface StockAlertItem {
  id: string
  email: string
  created_at: string
  variant: {
    id: string
    label: string
    stock_qty: number
    product: { id: string; name: string; slug: string; sku: string }
  }
}

export default api
