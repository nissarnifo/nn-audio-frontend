import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatProduct, productInclude } from '@/lib/formatters'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: productInclude,
    })
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 })
    return Response.json(formatProduct(product))
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
