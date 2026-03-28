import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return Response.json({ error: 'Email is required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return Response.json({ message: 'If that email exists, a reset link has been sent.' })

    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000)
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    })

    const frontendUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`

    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASS
    const emailFrom = process.env.EMAIL_FROM || emailUser

    if (emailUser && emailPass) {
      try {
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.default.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: Number(process.env.EMAIL_PORT) || 587,
          secure: false,
          auth: { user: emailUser, pass: emailPass },
        })
        await transporter.sendMail({
          from: `"N & N Audio" <${emailFrom}>`,
          to: user.email,
          subject: 'Reset your N & N Audio password',
          html: `<div style="font-family:sans-serif;max-width:480px;margin:auto"><h2 style="color:#00D4FF">Reset Your Password</h2><p>Hi ${user.name},</p><p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p><a href="${resetLink}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#00D4FF;color:#000;text-decoration:none;border-radius:4px;font-weight:bold">Reset Password</a><p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p></div>`,
        })
      } catch (err) {
        console.error('Email send failed:', err)
      }
    } else {
      console.log(`[RESET LINK for ${user.email}]: ${resetLink}`)
    }

    return Response.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
