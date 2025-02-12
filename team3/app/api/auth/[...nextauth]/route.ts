import NextAuth, { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

declare module 'next-auth' {
  interface Session {
    accessToken?: string
  }
  interface JWT {
    accessToken?: string
  }
}

// Export the config as authOptions
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      return session
    },
    async redirect({ url, baseUrl }) {
      return baseUrl + '/dashboard'
    },
  },
}

// Create handler from the config
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }