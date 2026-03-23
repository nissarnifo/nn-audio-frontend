export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'token and newPassword are required' }, { status: 400 })
    }

    const now = new Date()
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: now },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    const password = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json({ message: 'Password has been reset successfully' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
