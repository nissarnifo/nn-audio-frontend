import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Store singleton on globalThis in all environments to prevent connection pool exhaustion
globalForPrisma.prisma = prisma
