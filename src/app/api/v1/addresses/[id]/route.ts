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
    const body = await req.json()
    const { label, name, phone, line1, line2, city, state, pin } = body

    const existing = await prisma.address.findFirst({ where: { id: params.id, userId: user.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.address.update({
      where: { id: params.id },
      data: {
        ...(label !== undefined && { label }),
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(line1 !== undefined && { line1 }),
        ...(line2 !== undefined && { line2 }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pin !== undefined && { pin }),
      },
    })

    return NextResponse.json({ address: fmt(updated) })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireUser(req)
  if (user instanceof NextResponse) return user

  try {
    const existing = await prisma.address.findFirst({ where: { id: params.id, userId: user.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.address.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Address deleted' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
