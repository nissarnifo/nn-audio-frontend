/* ─── Product ────────────────────────────────────────────────────── */
export interface ProductImage {
  id: string
  url: string
  is_primary: boolean
  order: number
}

export interface ProductVariant {
  id: string
  label: string
  price: number
  stock_qty: number
  is_active: boolean
}

export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  description: string
  category: ProductCategory
  badge?: ProductBadge
  specs: Record<string, string>
  images: ProductImage[]
  variants: ProductVariant[]
  rating: number
  review_count: number
  sale_price: number | null
  sale_start_at: string | null
  sale_end_at: string | null
  on_sale: boolean
  is_active: boolean
  created_at: string
}

export type ProductCategory =
  | 'amplifier'
  | 'speaker'
  | 'speaker_box'
  | 'subwoofer'
  | 'processor'
  | 'cable'
  | 'accessory'

export type ProductBadge =
  | 'BESTSELLER'
  | 'TOP RATED'
  | 'NEW'
  | 'PRO'
  | 'FLAGSHIP'

/* ─── Review ─────────────────────────────────────────────────────── */
export interface Review {
  id: string
  user_name: string
  rating: number
  comment: string
  created_at: string
}

/* ─── Question ───────────────────────────────────────────────────── */
export interface Question {
  id: string
  question: string
  answer: string | null
  is_published: boolean
  created_at: string
  answered_at: string | null
  user_name?: string
  // admin only
  user?: { name: string; email: string }
  product?: { id: string; name: string; slug: string }
}

/* ─── Return ─────────────────────────────────────────────────────── */
export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED'

export interface ReturnRequest {
  id: string
  order_number: string
  order_total: number
  order_date: string
  reason: string
  notes: string | null
  status: ReturnStatus
  admin_note: string | null
  created_at: string
  updated_at: string
  // admin list only
  user?: { name: string; email: string }
}

/* ─── Cart ───────────────────────────────────────────────────────── */
export interface CartItem {
  id: string
  product: Product
  variant: ProductVariant
  qty: number
}

export interface Cart {
  items: CartItem[]
  count: number
  subtotal: number
  shipping: number
  total: number
}

/* ─── Address ────────────────────────────────────────────────────── */
export interface Address {
  id: string
  label: 'HOME' | 'OFFICE' | 'OTHER'
  name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pin: string
  is_default: boolean
}

/* ─── Order ──────────────────────────────────────────────────────── */
export interface OrderItem {
  id: string
  product: Product
  variant: ProductVariant
  qty: number
  price: number
}

export type OrderStatus = 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type PaymentMethod = 'COD' | 'RAZORPAY'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface Order {
  id: string
  order_number: string
  items: OrderItem[]
  address: Address
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  status: OrderStatus
  subtotal: number
  shipping: number
  discount: number
  coupon_code: string | null
  total: number
  created_at: string
  updated_at: string
}

/* ─── Coupon ──────────────────────────────────────────────────────── */
export type CouponType = 'PERCENT' | 'FLAT'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  min_order: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface CouponValidation {
  valid: boolean
  code: string
  type: CouponType
  value: number
  discount: number
}

/* ─── User / Auth ────────────────────────────────────────────────── */
export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'CUSTOMER' | 'ADMIN'
  created_at: string
}

export interface AuthResponse {
  user: User
  token: string
}

/* ─── Admin Stats ────────────────────────────────────────────────── */
export interface AdminStats {
  total_revenue: number
  month_revenue: number
  total_orders: number
  month_orders: number
  total_customers: number
  pending_orders: number
  monthly_revenue: Array<{ month: string; revenue: number }>
  top_products: Array<{ name: string; revenue: number }>
  orders_by_status: Array<{ status: string; count: number }>
}

/* ─── API Filters ────────────────────────────────────────────────── */
export interface ProductFilters {
  category?: ProductCategory
  search?: string
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest'
  page?: number
  limit?: number
  min_price?: number
  max_price?: number
  in_stock?: boolean
  min_rating?: number
  on_sale?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}
