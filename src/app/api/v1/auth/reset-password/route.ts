import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()
    if (!token || !newPassword) return Response.json({ error: 'Token and new password are required' }, { status: 400 })
    if (newPassword.length < 8) return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    })
    if (!user) return Response.json({ error: 'Invalid or expired reset token' }, { status: 400 })

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(newPassword, 10), resetToken: null, resetTokenExpiry: null },
    })
    return Response.json({ message: 'Password reset successfully. You can now log in.' })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
