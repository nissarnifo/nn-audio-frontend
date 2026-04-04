export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/api-helpers'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest) {
  const user = requireUser(req)
  if (user instanceof NextResponse) return user

  try {
    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || !dbUser.password) {
      return NextResponse.json({ error: 'User not found or no password set' }, { status: 404 })
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.password)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const password = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { password } })

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
