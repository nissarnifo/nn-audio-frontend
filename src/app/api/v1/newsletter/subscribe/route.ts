import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, source = 'footer' } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return err('Invalid email address', 400)
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })

    if (existing) {
      if (!existing.unsubscribed) {
        return NextResponse.json({ ok: true, message: 'You are already subscribed!' })
      }
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { unsubscribed: false, source },
      })
      return NextResponse.json({ ok: true, message: 'Welcome back! You have been re-subscribed.' })
    }

    await prisma.newsletterSubscriber.create({
      data: { email, source },
    })

    return NextResponse.json({ ok: true, message: 'Successfully subscribed to our newsletter!' })
  } catch (e) {
    return err('Failed to subscribe', 500)
  }
}
