export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { oauthConfig } from '@/config'

export async function GET() {
  const providers: string[] = []
  if (oauthConfig.google.enabled) providers.push('google')
  if (oauthConfig.github.enabled) providers.push('github')
  if (oauthConfig.discord.enabled) providers.push('discord')
  return NextResponse.json({ providers })
}
