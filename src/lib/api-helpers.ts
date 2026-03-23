import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

export type AuthUser = { id: string; role: string }

export function getUser(req: NextRequest): AuthUser | null {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  try {
    const token = header.split(' ')[1]
    return jwt.verify(token, process.env.JWT_SECRET!) as AuthUser
  } catch {
    return null
  }
}

/** Returns the authenticated user or a NextResponse error. Check `instanceof NextResponse` to detect error. */
export function requireUser(req: NextRequest): AuthUser | NextResponse {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return user
}

/** Returns the admin user or a NextResponse error. Check `instanceof NextResponse` to detect error. */
export function requireAdmin(req: NextRequest): AuthUser | NextResponse {
  const user = getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return user
}

export function signToken(id: string, role: string): string {
  return jwt.sign({ id, role }, process.env.JWT_SECRET!, { expiresIn: '30d' })
}

export function err(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}
