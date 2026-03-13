import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import DiscordProvider from 'next-auth/providers/discord'
import { API_BASE_URL, ENDPOINTS, oauthConfig } from '@/config'

const providers: NextAuthOptions['providers'] = []

if (oauthConfig.google.enabled) {
  providers.push(GoogleProvider({
    clientId: oauthConfig.google.clientId,
    clientSecret: oauthConfig.google.clientSecret,
  }))
}

if (oauthConfig.github.enabled) {
  providers.push(GithubProvider({
    clientId: oauthConfig.github.clientId,
    clientSecret: oauthConfig.github.clientSecret,
  }))
}

if (oauthConfig.discord.enabled) {
  providers.push(DiscordProvider({
    clientId: oauthConfig.discord.clientId,
    clientSecret: oauthConfig.discord.clientSecret,
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
          const res = await fetch(`${API_BASE_URL}${ENDPOINTS.auth.oauth}`, {
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
