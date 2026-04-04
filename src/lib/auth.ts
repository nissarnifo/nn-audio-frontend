import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GithubProvider from 'next-auth/providers/github'
import DiscordProvider from 'next-auth/providers/discord'
import { oauthConfig } from '@/config'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/api-auth'

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

async function handleOAuthLogin(params: {
  provider: string
  providerId: string
  email: string
  name: string
}) {
  const { provider, providerId, email, name } = params

  const providerWhere =
    provider === 'google' ? { googleId: providerId }
    : provider === 'github' ? { githubId: providerId }
    : { discordId: providerId }

  const providerData =
    provider === 'google' ? { googleId: providerId }
    : provider === 'github' ? { githubId: providerId }
    : { discordId: providerId }

  const db = prisma.user as any
  let user = (await db.findUnique({ where: providerWhere })) ?? (await db.findUnique({ where: { email } }))

  if (user) {
    if (!user[`${provider}Id`]) {
      user = await db.update({ where: { id: user.id }, data: providerData })
    }
  } else {
    user = await db.create({ data: { name: name || email, email, ...providerData } })
  }

  return {
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, created_at: user.createdAt },
    token: signToken(user.id, user.role),
  }
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.oauthProvider = account.provider
        token.oauthProviderId = account.providerAccountId
        try {
          const { user, token: jwt } = await handleOAuthLogin({
            provider: account.provider,
            providerId: account.providerAccountId,
            email: token.email!,
            name: token.name || token.email!,
          })
          token.backendToken = jwt
          token.backendUser = user
        } catch (err) {
          console.error('OAuth DB sync failed', err)
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
