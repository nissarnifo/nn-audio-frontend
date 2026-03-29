export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/api-helpers'
import { validateBody, schemas } from '@/lib/validate'
import { limiters, getIp, rateLimitResponse } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

function safeUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, created_at: u.createdAt }
}

export async function POST(req: NextRequest) {
  const rl = rateLimitResponse(limiters.auth(getIp(req.headers)))
  if (rl) return rl

  const { data, error } = await validateBody(req, schemas.register)
  if (error) return error

  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const password = await bcrypt.hash(data.password, 10)
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, phone: data.phone ?? null, password },
    })

    return NextResponse.json({ user: safeUser(user), token: signToken(user.id, user.role) }, { status: 201 })
  } catch (e) {
    console.error('[register]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
