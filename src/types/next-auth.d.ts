import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    backendToken?: string
    backendUser?: Record<string, unknown>
    oauthProvider?: string
    oauthProviderId?: string
    oauthEmail?: string
    oauthName?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    backendToken?: string
    backendUser?: Record<string, unknown>
    oauthProvider?: string
    oauthProviderId?: string
  }
}
