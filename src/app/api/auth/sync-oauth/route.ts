import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { API_BASE_URL, ENDPOINTS } from '@/config'

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session || !session.oauthProvider || !session.oauthProviderId) {
    return NextResponse.json({ error: 'No OAuth session found' }, { status: 401 })
  }

  try {
    const res = await fetch(`${API_BASE_URL}${ENDPOINTS.auth.oauth}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: session.oauthProvider,
        providerId: session.oauthProviderId,
        email: session.oauthEmail,
        name: session.oauthName,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Backend error: ${text}` }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({ token: data.token, user: data.user })
  } catch (err) {
    console.error('sync-oauth retry failed', err)
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 503 })
  }
}
