import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import DiscordProvider from 'next-auth/providers/discord'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

const providers: NextAuthOptions['providers'] = []

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }))
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(GithubProvider({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  }))
}

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(DiscordProvider({
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  }))
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Store for client-side retry if backend is sleeping
        token.oauthProvider = account.provider
        token.oauthProviderId = account.providerAccountId
        try {
          const res = await fetch(`${API_URL}/auth/oauth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: account.provider,
              providerId: account.providerAccountId,
              email: token.email,
              name: token.name,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            token.backendToken = data.token
            token.backendUser = data.user
          }
        } catch (err) {
          console.error('Backend OAuth sync failed, will retry on client', err)
        }
      }
      return token
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken as string | undefined
      session.backendUser = token.backendUser as Record<string, unknown> | undefined
      session.oauthProvider = token.oauthProvider as string | undefined
      session.oauthProviderId = token.oauthProviderId as string | undefined
      session.oauthEmail = token.email as string | undefined
      session.oauthName = token.name as string | undefined
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
}
