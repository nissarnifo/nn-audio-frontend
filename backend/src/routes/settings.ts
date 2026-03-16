import { Router } from 'express'
import { prisma, requireAdmin } from '../middleware/auth'

const router = Router()

// Public-readable setting keys (storefront needs these)
const PUBLIC_KEYS = [
  'banner_enabled',
  'banner_text',
  'banner_color',
  'banner_link',
  'shipping_threshold',
  'shipping_fee',
]

// Default values when rows don't exist yet
const DEFAULTS: Record<string, string> = {
  banner_enabled: 'false',
  banner_text: '',
  banner_color: 'cyan',
  banner_link: '',
  shipping_threshold: '5000',
  shipping_fee: '299',
}

function toMap(rows: { key: string; value: string }[]): Record<string, string> {
  const map: Record<string, string> = { ...DEFAULTS }
  for (const r of rows) map[r.key] = r.value
  return map
}

// GET /api/v1/settings  — returns all public settings (no auth)
router.get('/', async (_req, res) => {
  const rows = await prisma.setting.findMany({ where: { key: { in: PUBLIC_KEYS } } })
  res.json(toMap(rows))
})

// GET /api/v1/settings/all  — returns ALL settings (admin only)
router.get('/all', requireAdmin, async (_req, res) => {
  const rows = await prisma.setting.findMany()
  res.json(toMap(rows))
})

// PUT /api/v1/settings  — upsert one or more key-value pairs (admin only)
// body: { key: string; value: string }[]  OR  { [key]: value, ... }
router.put('/', requireAdmin, async (req, res) => {
  const body = req.body as Record<string, string>
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Body must be a key-value object' })
    return
  }
  const entries = Object.entries(body)
  if (entries.length === 0) { res.json({ ok: true }); return }

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  )
  res.json({ ok: true })
})

export default router
