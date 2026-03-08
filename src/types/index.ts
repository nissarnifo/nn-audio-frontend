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
  is_active: boolean
  created_at: string
}

export type ProductCategory =
  | 'amplifier'
  | 'speaker'
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
  total: number
  created_at: string
  updated_at: string
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
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}
