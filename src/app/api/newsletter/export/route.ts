import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { unsubscribed: false },
      orderBy: { createdAt: 'desc' },
    })

    const header = 'id,email,source,created_at'
    const rows = subscribers.map((s) =>
      `${s.id},"${s.email}","${s.source ?? ''}","${s.createdAt.toISOString()}"`
    )
    const csv = [header, ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="newsletter_subscribers.csv"',
      },
    })
  } catch (e) {
    return err('Failed to export subscribers', 500)
  }
}
