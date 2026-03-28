import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

function fmt(a: any) {
  return { id: a.id, label: a.label, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? undefined, city: a.city, state: a.state, pin: a.pin, is_default: a.isDefault }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    await prisma.address.updateMany({ where: { userId: authUser.id }, data: { isDefault: false } })
    const address = await prisma.address.update({
      where: { id: params.id, userId: authUser.id },
      data: { isDefault: true },
    })
    return Response.json(fmt(address))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
