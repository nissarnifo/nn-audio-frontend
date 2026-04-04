import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, err } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const PUBLIC_KEYS = ['banner_enabled', 'banner_text', 'banner_color', 'banner_link', 'shipping_threshold', 'shipping_fee']
const DEFAULTS: Record<string, string> = { banner_enabled: 'false', banner_text: '', banner_color: 'cyan', banner_link: '', shipping_threshold: '5000', shipping_fee: '299' }

function toMap(rows: { key: string; value: string }[]): Record<string, string> {
  const map: Record<string, string> = { ...DEFAULTS }
  for (const r of rows) map[r.key] = r.value
  return map
}

export async function GET() {
  try {
    const rows = await prisma.setting.findMany({ where: { key: { in: PUBLIC_KEYS } } })
    return NextResponse.json(toMap(rows))
  } catch (e) {
    return err('Failed to fetch settings', 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (admin instanceof NextResponse) return admin

    const body = await req.json()

    await prisma.$transaction(
      Object.entries(body as Record<string, string>).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    )

    const rows = await prisma.setting.findMany({ where: { key: { in: PUBLIC_KEYS } } })
    return NextResponse.json(toMap(rows))
  } catch (e) {
    return err('Failed to update settings', 500)
  }
}
