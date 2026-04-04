import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-auth'

function fmt(a: any) {
  return {
    id: a.id, label: a.label, name: a.name, phone: a.phone,
    line1: a.line1, line2: a.line2, city: a.city,
    state: a.state, pin: a.pin, is_default: a.isDefault,
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const addresses = await prisma.address.findMany({ where: { userId: auth.id }, orderBy: { isDefault: 'desc' } })
    return NextResponse.json(addresses.map(fmt))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const body = await req.json()
    const count = await prisma.address.count({ where: { userId: auth.id } })
    const address = await prisma.address.create({
      data: { ...body, userId: auth.id, isDefault: count === 0 },
    })
    return NextResponse.json(fmt(address), { status: 201 })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
