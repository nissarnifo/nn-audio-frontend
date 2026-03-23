export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: expiry },
      })

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
      const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const nodemailer = (await import('nodemailer')).default
          const transporter = nodemailer.createTransport({
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          })
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 1 hour. If you did not request this, please ignore this email.`,
            html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>`,
          })
        } catch (emailErr) {
          console.error('Failed to send reset email:', emailErr)
        }
      }
    }

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
