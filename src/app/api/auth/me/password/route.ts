export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAuth, apiError } from '@/lib/api-auth'

export async function PUT(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const { currentPassword, newPassword } = await req.json()
    const user = await prisma.user.findUnique({ where: { id: auth.id } })
    if (!user || !user.password || !(await bcrypt.compare(currentPassword, user.password))) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }
    await prisma.user.update({
      where: { id: auth.id },
      data: { password: await bcrypt.hash(newPassword, 10) },
    })
    return NextResponse.json({ message: 'Password updated' })
  } catch (e) {
    const { error, status } = apiError(e)
    return NextResponse.json({ error }, { status })
  }
}
