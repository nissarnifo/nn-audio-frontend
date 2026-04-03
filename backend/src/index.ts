// Local development server — NOT used by Vercel (see api/index.ts)
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import app from './app'

const prisma = new PrismaClient()
const PORT = process.env.PORT || 5000

async function ensureAdminExists() {
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
    console.info('[startup] Default admin created: admin@nnaudio.com')
  }
}

ensureAdminExists()
  .then(() => app.listen(PORT, () => console.info(`[startup] Server listening on port ${PORT}`)))
  .catch((err) => { console.error('Startup error:', err); process.exit(1) })
