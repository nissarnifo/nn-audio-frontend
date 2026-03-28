import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function PUT(req: NextRequest) {
  try {
    const { user: authUser, err } = requireAuth(req)
    if (err) return err
    const { currentPassword, newPassword } = await req.json()
    const user = await prisma.user.findUnique({ where: { id: authUser.id } })
    if (!user || !user.password || !(await bcrypt.compare(currentPassword, user.password)))
      return Response.json({ error: 'Current password is incorrect' }, { status: 400 })
    await prisma.user.update({
      where: { id: authUser.id },
      data: { password: await bcrypt.hash(newPassword, 10) },
    })
    return Response.json({ message: 'Password updated' })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
