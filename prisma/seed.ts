import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nnaudio.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Admin',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
    },
  })

  console.log(`Admin user ensured: ${adminEmail}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
