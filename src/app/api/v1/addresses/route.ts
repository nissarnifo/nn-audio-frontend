import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

function fmt(a: any) {
  return { id: a.id, label: a.label, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? undefined, city: a.city, state: a.state, pin: a.pin, is_default: a.isDefault }
}

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const addresses = await prisma.address.findMany({ where: { userId: authUser.id }, orderBy: { isDefault: 'desc' } })
    return Response.json(addresses.map(fmt))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const { label, name, phone, line1, line2, city, state, pin } = await req.json()
    const count = await prisma.address.count({ where: { userId: authUser.id } })
    const address = await prisma.address.create({
      data: { userId: authUser.id, label, name, phone, line1, line2, city, state, pin, isDefault: count === 0 },
    })
    return Response.json(fmt(address), { status: 201 })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
