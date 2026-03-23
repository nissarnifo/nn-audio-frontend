import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    const product = await prisma.product.findUnique({ where: { slug } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const questions = await prisma.question.findMany({
      where: { productId: product.id, isPublished: true },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(questions)
  } catch (e) {
    return err('Internal server error', 500)
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const user = await requireUser(req)
    if (user instanceof NextResponse) return user

    const { slug } = params

    const product = await prisma.product.findUnique({ where: { slug } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await req.json()
    const { question } = body

    const newQuestion = await prisma.question.create({
      data: {
        productId: product.id,
        userId: user.id,
        question,
      },
      include: { user: { select: { name: true } } },
    })

    return NextResponse.json(newQuestion, { status: 201 })
  } catch (e) {
    return err('Internal server error', 500)
  }
}
