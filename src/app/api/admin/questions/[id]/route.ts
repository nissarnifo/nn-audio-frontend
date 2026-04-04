import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const body = await req.json()
    const { answer, is_published } = body
    const data: any = {}

    if (answer !== undefined) {
      data.answer = answer || null
      data.answeredAt = answer ? new Date() : null
      data.isPublished = answer ? true : false
    }
    if (is_published !== undefined) data.isPublished = is_published

    const q = await prisma.question.update({
      where: { id: params.id },
      data,
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json({
      id: q.id,
      question: q.question,
      answer: q.answer,
      is_published: q.isPublished,
      answered_at: q.answeredAt,
      user: q.user,
      product: q.product,
    })
  } catch (e) {
    return err('Failed to update question', 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    await prisma.question.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return err('Failed to delete question', 500)
  }
}
