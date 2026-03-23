import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    await prisma.newsletterSubscriber.delete({ where: { id: params.id } })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return err('Failed to delete subscriber', 500)
  }
}
