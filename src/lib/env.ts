/**
 * Validates required environment variables at startup.
 * Call this in the root layout or a server component that always runs.
 * Missing required vars will throw in production to prevent silent failures.
 */

interface EnvVar {
  key: string
  required: boolean
  description: string
}

const ENV_VARS: EnvVar[] = [
  // Database
  { key: 'DATABASE_URL', required: true, description: 'PostgreSQL connection URL' },

  // Auth
  { key: 'JWT_SECRET', required: true, description: 'Secret for JWT signing' },
  { key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', required: true, description: 'Clerk publishable key' },
  { key: 'CLERK_SECRET_KEY', required: true, description: 'Clerk secret key' },

  // Cloudinary (required for image uploads)
  { key: 'CLOUDINARY_CLOUD_NAME', required: true, description: 'Cloudinary cloud name' },
  { key: 'CLOUDINARY_API_KEY', required: true, description: 'Cloudinary API key' },
  { key: 'CLOUDINARY_API_SECRET', required: true, description: 'Cloudinary API secret' },

  // Razorpay (required for payments)
  { key: 'RAZORPAY_KEY_ID', required: true, description: 'Razorpay key ID' },
  { key: 'RAZORPAY_KEY_SECRET', required: true, description: 'Razorpay key secret' },

  // Notifications (optional)
  { key: 'EMAIL_USER', required: false, description: 'SMTP email address' },
  { key: 'EMAIL_PASS', required: false, description: 'SMTP email password' },
  { key: 'ADMIN_NOTIFY_EMAIL', required: false, description: 'Admin notification email' },
  { key: 'TELEGRAM_BOT_TOKEN', required: false, description: 'Telegram bot token' },
  { key: 'TELEGRAM_CHAT_ID', required: false, description: 'Telegram chat ID' },
]

let validated = false

export function validateEnv(): void {
  // Only validate once per process
  if (validated) return
  validated = true

  // Skip validation in test environments
  if (process.env.NODE_ENV === 'test') return

  const missing: string[] = []

  for (const envVar of ENV_VARS) {
    if (envVar.required && !process.env[envVar.key]) {
      missing.push(`${envVar.key} — ${envVar.description}`)
    }
  }

  if (missing.length > 0) {
    const message = [
      '\n⚠️  Missing required environment variables:',
      ...missing.map((m) => `  ✕ ${m}`),
      '\nSee .env.local.example for setup instructions.\n',
    ].join('\n')

    if (process.env.NODE_ENV === 'production') {
      throw new Error(message)
    } else {
      console.warn(message)
    }
  }
}

/** Type-safe getter for environment variables */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value
}
