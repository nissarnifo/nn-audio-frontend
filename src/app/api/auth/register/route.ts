import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, apiError } from '@/lib/api-auth'

function safeUser(u: { id: string; name: string; email: string; phone?: string | null; role: string; createdAt: Date }) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, created_at: u.createdAt }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json()
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

    const user = await prisma.user.create({
      data: { name, email, phone, password: await bcrypt.hash(password, 10) },
    })
    return NextResponse.json({ user: safeUser(user), token: signToken(user.id, user.role) }, { status: 201 })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
