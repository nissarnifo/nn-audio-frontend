import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import app from '../src/app'

const prisma = new PrismaClient()

// Ensures admin user exists — runs on cold start (idempotent upsert)
;(async () => {
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (!admin) {
      await prisma.user.upsert({
        where: { email: 'admin@nnaudio.com' },
        update: {},
        create: {
          name: 'Admin',
          email: 'admin@nnaudio.com',
          phone: '9999999999',
          password: await bcrypt.hash('admin123', 10),
          role: 'ADMIN',
        },
      })
    }
  } catch (err) {
    console.error('Admin init error:', err)
  }
})()

export default app
