import { NextResponse } from 'next/server'

export async function GET() {
  const providers: string[] = []
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push('google')
  }
  if (
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET &&
    process.env.GITHUB_CLIENT_SECRET !== 'PASTE_YOUR_SECRET_HERE'
  ) {
    providers.push('github')
  }
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    providers.push('discord')
  }
  return NextResponse.json({ providers })
}
