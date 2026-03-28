export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateBody, schemas } from '@/lib/validate'
import { limiters, getIp, rateLimitResponse } from '@/lib/rate-limit'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const rl = rateLimitResponse(limiters.auth(getIp(req.headers)))
  if (rl) return rl

  const { data, error } = await validateBody(req, schemas.forgotPassword)
  if (error) return error

  try {
    const user = await prisma.user.findUnique({ where: { email: data.email } })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expiry = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: expiry },
      })

      const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const nodemailer = (await import('nodemailer')).default
          const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: Number(process.env.EMAIL_PORT) || 587,
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          })
          await transporter.sendMail({
            from: `"N & N Audio" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: data.email,
            subject: 'Reset your N & N Audio password',
            html: `<div style="font-family:sans-serif;max-width:480px;margin:auto"><h2 style="color:#00D4FF">Reset Your Password</h2><p>Hi ${user.name},</p><p>Click below to reset your password. This link expires in <strong>1 hour</strong>.</p><a href="${resetLink}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#00D4FF;color:#000;text-decoration:none;border-radius:4px;font-weight:bold">Reset Password</a><p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p></div>`,
          })
        } catch (emailErr) {
          console.error('[forgot-password] email send failed:', emailErr)
        }
      } else {
        console.log(`[RESET LINK for ${data.email}]: ${resetLink}`)
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (e) {
    console.error('[forgot-password]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
