export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/api-helpers'

function fmt(a: any) {
  return { id: a.id, label: a.label, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? undefined, city: a.city, state: a.state, pin: a.pin, is_default: a.isDefault }
}

export async function GET(req: NextRequest) {
  const user = requireUser(req)
  if (user instanceof NextResponse) return user

  try {
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' },
    })
    return NextResponse.json({ addresses: addresses.map(fmt) })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = requireUser(req)
  if (user instanceof NextResponse) return user

  try {
    const body = await req.json()
    const { label, name, phone, line1, line2, city, state, pin } = body

    if (!label || !name || !phone || !line1 || !city || !state || !pin) {
      return NextResponse.json({ error: 'label, name, phone, line1, city, state, and pin are required' }, { status: 400 })
    }

    const existingCount = await prisma.address.count({ where: { userId: user.id } })
    const isDefault = existingCount === 0

    const address = await prisma.address.create({
      data: { userId: user.id, label, name, phone, line1, line2: line2 ?? null, city, state, pin, isDefault },
    })

    return NextResponse.json({ address: fmt(address) }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
