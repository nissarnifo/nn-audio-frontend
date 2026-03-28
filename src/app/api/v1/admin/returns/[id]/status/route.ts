import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'
import { sendReturnStatusEmail } from '@/lib/notify'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const body = await req.json()
    const { status, admin_note } = body

    const allowed = ['APPROVED', 'REJECTED', 'REFUNDED']
    if (!allowed.includes(status)) {
      return err(`status must be one of ${allowed.join(', ')}`, 400)
    }

    const ret = await prisma.return.update({
      where: { id: params.id },
      data: { status, adminNote: admin_note ?? null },
      include: {
        order: { select: { orderNumber: true } },
        user: { select: { name: true, email: true } },
      },
    })

    if (status === 'REFUNDED') {
      await prisma.order.update({
        where: { id: ret.orderId },
        data: { paymentStatus: 'REFUNDED' },
      })
    }

    sendReturnStatusEmail({
      customerName: ret.user.name,
      customerEmail: ret.user.email,
      orderNumber: ret.order.orderNumber,
      status,
      adminNote: ret.adminNote,
    }).catch(() => {})

    return NextResponse.json({ id: ret.id, status: ret.status, admin_note: ret.adminNote })
  } catch (e) {
    return err('Failed to update return status', 500)
  }
}
