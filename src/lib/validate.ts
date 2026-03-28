import { NextResponse } from 'next/server'
import { z, ZodSchema } from 'zod'

export { z }

/**
 * Parse and validate request body against a Zod schema.
 * Returns { data } on success or { error: NextResponse } on failure.
 */
export async function validateBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return {
        data: null,
        error: NextResponse.json({ error: 'Validation failed', details: errors }, { status: 422 }),
      }
    }
    return { data: result.data, error: null }
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    }
  }
}

/**
 * Parse and validate URL search params against a Zod schema.
 */
export function validateParams<T>(
  params: Record<string, string>,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(params)
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }))
    return {
      data: null,
      error: NextResponse.json({ error: 'Invalid parameters', details: errors }, { status: 400 }),
    }
  }
  return { data: result.data, error: null }
}

/* ─── Common Schemas ──────────────────────────────────────────────────────── */

export const schemas = {
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  register: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  forgotPassword: z.object({
    email: z.string().email('Invalid email address'),
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  address: z.object({
    label: z.enum(['HOME', 'OFFICE', 'OTHER']).default('HOME'),
    name: z.string().min(2, 'Name is required'),
    phone: z.string().min(10, 'Valid phone number required').max(15),
    line1: z.string().min(5, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pin: z.string().length(6, 'PIN code must be 6 digits').regex(/^\d+$/, 'PIN must be numeric'),
  }),

  createOrder: z.object({
    paymentMethod: z.enum(['COD', 'RAZORPAY']),
    addressId: z.string().min(1, 'Address is required'),
    couponCode: z.string().optional(),
    razorpay: z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    }).optional(),
  }),

  cartItem: z.object({
    variantId: z.string().min(1, 'Variant ID is required'),
    qty: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  }),

  review: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(10, 'Review must be at least 10 characters').max(1000),
  }),

  createProduct: z.object({
    name: z.string().min(2, 'Product name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    category: z.enum(['amplifier', 'speaker', 'speaker_box', 'subwoofer', 'processor', 'cable', 'accessory']),
    badge: z.string().optional().nullable(),
    sku: z.string().optional(),
    specs: z.record(z.unknown()).optional(),
    variants: z.array(z.object({
      label: z.string().min(1),
      price: z.number().positive('Price must be positive'),
      stock_qty: z.number().int().min(0).default(0),
    })).min(1, 'At least one variant is required'),
  }),

  updateOrderStatus: z.object({
    status: z.enum(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
    tracking_number: z.string().optional(),
    tracking_url: z.string().url().optional().or(z.literal('')),
    notes: z.string().optional(),
  }),

  newsletterSubscribe: z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().optional(),
  }),

  couponValidate: z.object({
    code: z.string().min(1, 'Coupon code is required'),
    subtotal: z.number().positive('Subtotal must be positive'),
  }),

  razorpayOrder: z.object({
    amount: z.number().positive('Amount must be positive'),
  }),

  submitReturn: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
    notes: z.string().optional(),
  }),
}
