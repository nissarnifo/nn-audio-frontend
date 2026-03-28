import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export interface AuthUser { id: string; role: string }

export function getAuthUser(req: NextRequest): AuthUser | null {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  try {
    return jwt.verify(header.split(' ')[1], process.env.JWT_SECRET!) as AuthUser
  } catch {
    return null
  }
}

export function requireAuth(req: NextRequest): { user: AuthUser; err: null } | { user: null; err: Response } {
  const user = getAuthUser(req)
  if (!user) return { user: null, err: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { user, err: null }
}

export function requireAdmin(req: NextRequest): { user: AuthUser; err: null } | { user: null; err: Response } {
  const user = getAuthUser(req)
  if (!user) return { user: null, err: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (user.role !== 'ADMIN') return { user: null, err: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, err: null }
}

export function signToken(id: string, role: string) {
  const jwt2 = require('jsonwebtoken')
  return jwt2.sign({ id, role }, process.env.JWT_SECRET!, { expiresIn: '30d' })
}
