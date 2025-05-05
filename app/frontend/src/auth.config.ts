import { NextAuthConfig } from 'next-auth/lib'
import { JWT } from 'next-auth/jwt'
import { Session, User } from 'next-auth'
import logger, { logError, logAPIRequest, logAPIResponse } from '@/lib/logger'

export const authConfig = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [],
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        logger.debug('Updating JWT token with user data', {
          userId: user.id,
          email: user.email
        })

        token.id = user.id ? user.id : ''
        token.email = user.email ? user.email : ''
        token.name = user.name ? user.name : ''
        token.picture = user.image ? user.image : ''
        token.accessToken = user.token ? user.token : ''
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        logger.debug('Updating session with token data', {
          userId: token.id,
          email: token.email
        })

        session.user.id = token.id
        session.user.email = token.email
        session.user.name = token.name
        session.user.image = token.picture
        session.user.token = token.accessToken
      }
      return session
    },
  },
} satisfies NextAuthConfig;