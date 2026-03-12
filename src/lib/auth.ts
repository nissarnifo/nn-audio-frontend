import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
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
          const data = await res.json()
          token.backendToken = data.token
          token.backendUser = data.user
        } catch (err) {
          console.error('Backend OAuth sync failed', err)
        }
      }
      return token
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken as string | undefined
      session.backendUser = token.backendUser as Record<string, unknown> | undefined
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
}
