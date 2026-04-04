import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-auth'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(a: any) {
  return {
    id: a.id, label: a.label, name: a.name, phone: a.phone,
    line1: a.line1, line2: a.line2, city: a.city,
    state: a.state, pin: a.pin, is_default: a.isDefault,
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(req)
    const body = await req.json()
    const address = await prisma.address.update({
      where: { id: params.id, userId: auth.id },
      data: body,
    })
    return NextResponse.json(fmt(address))
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = requireAuth(req)
    await prisma.address.delete({ where: { id: params.id, userId: auth.id } })
    return NextResponse.json({ message: 'Address deleted' })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
