import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(req)
    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId: auth.id }, data: { isDefault: false } }),
      prisma.address.update({ where: { id: params.id, userId: auth.id }, data: { isDefault: true } }),
    ])
    const addresses = await prisma.address.findMany({ where: { userId: auth.id }, orderBy: { isDefault: 'desc' } })
    return NextResponse.json(addresses.map((a) => ({
      id: a.id, label: a.label, name: a.name, phone: a.phone,
      line1: a.line1, line2: a.line2, city: a.city,
      state: a.state, pin: a.pin, is_default: a.isDefault,
    })))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
