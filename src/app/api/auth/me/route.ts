import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-auth'

function safeUser(u: { id: string; name: string; email: string; phone?: string | null; role: string; createdAt: Date }) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, created_at: u.createdAt }
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const user = await prisma.user.findUnique({ where: { id: auth.id } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(safeUser(user))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const { name, phone, email } = await req.json()

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing && existing.id !== auth.id) {
        return NextResponse.json({ error: 'Email already in use by another account' }, { status: 409 })
      }
    }

    const user = await prisma.user.update({
      where: { id: auth.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email && { email }),
      },
    })
    return NextResponse.json(safeUser(user))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    await prisma.user.delete({ where: { id: auth.id } })
    return NextResponse.json({ message: 'Account deleted' })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
