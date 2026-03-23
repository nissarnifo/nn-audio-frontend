export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, err } from '@/lib/api-helpers'
import bcrypt from 'bcryptjs'

function safeUser(u: any) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, created_at: u.createdAt }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, password: rawPassword } = body

    if (!name || !email || !rawPassword) {
      return NextResponse.json({ error: 'name, email, and password are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const password = await bcrypt.hash(rawPassword, 10)

    const user = await prisma.user.create({
      data: { name, email, phone: phone ?? null, password },
    })

    const token = signToken(user.id, user.role)
    return NextResponse.json({ user: safeUser(user), token }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
