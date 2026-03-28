export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/api-helpers'

function fmt(a: any) {
  return { id: a.id, label: a.label, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? undefined, city: a.city, state: a.state, pin: a.pin, is_default: a.isDefault }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireUser(req)
  if (user instanceof NextResponse) return user

  try {
    const existing = await prisma.address.findFirst({ where: { id: params.id, userId: user.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Unset all defaults for this user
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    })

    // Set this address as default
    const updated = await prisma.address.update({
      where: { id: params.id },
      data: { isDefault: true },
    })

    return NextResponse.json({ address: fmt(updated) })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
