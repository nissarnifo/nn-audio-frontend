import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, safeUser } from '@/lib/api-auth'

// safeUser is actually in formatters, not api-auth. Use this inline version:
function safe(user: any) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, created_at: user.createdAt }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json()
    if (!name || !email || !phone || !password)
      return Response.json({ error: 'All fields required' }, { status: 400 })
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return Response.json({ error: 'Email already in use' }, { status: 409 })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({ data: { name, email, phone, password: hashed } })
    return Response.json({ user: safe(user), token: signToken(user.id, user.role) }, { status: 201 })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
