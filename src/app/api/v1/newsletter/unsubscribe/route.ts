import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return err('Email is required', 400)
    }

    await prisma.newsletterSubscriber.updateMany({
      where: { email },
      data: { unsubscribed: true },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return err('Failed to unsubscribe', 500)
  }
}
