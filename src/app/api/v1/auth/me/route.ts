import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

function safe(user: any) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, created_at: user.createdAt }
}

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const user = await prisma.user.findUnique({ where: { id: authUser.id } })
    if (!user) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(safe(user))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const { name, phone, email } = await req.json()
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing && existing.id !== authUser.id)
        return Response.json({ error: 'Email already in use by another account' }, { status: 409 })
    }
    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email && { email }),
      },
    })
    return Response.json(safe(user))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    await prisma.user.delete({ where: { id: authUser.id } })
    return Response.json({ message: 'Account deleted' })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
