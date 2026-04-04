import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export interface AuthPayload {
  id: string
  role: string
}

export function signToken(id: string, role: string): string {
  return jwt.sign({ id, role }, process.env.JWT_SECRET!, { expiresIn: '30d' })
}

export function getAuth(req: NextRequest): AuthPayload | null {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as AuthPayload
  } catch {
    return null
  }
}

export function requireAuth(req: NextRequest): AuthPayload {
  const payload = getAuth(req)
  if (!payload) throw { status: 401, message: 'Unauthorized' }
  return payload
}

export function requireAdmin(req: NextRequest): AuthPayload {
  const payload = requireAuth(req)
  if (payload.role !== 'ADMIN') throw { status: 403, message: 'Admin access required' }
  return payload
}

export function apiError(e: unknown) {
  const err = e as { status?: number; message?: string }
  if (err?.status) return { error: err.message ?? 'Error', status: err.status }
  console.error(e)
  return { error: 'Internal server error', status: 500 }
}
