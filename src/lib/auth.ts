import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import { fetchRedis } from '@/helpers/redis'
import { IORedisAdapter } from "@/lib/redis_adapter/IORedisAdapter";
import { createRedisInstance } from '@auth/redis-adapter'


export const authOptions: NextAuthOptions = {
  adapter: IORedisAdapter(db),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Check for hardcoded admin credentials

        if (credentials.username === 'admin' && credentials.password === 'admin') {
          return {
            id: '1',
            name: 'Admin',
            email: 'admin@example.com',
          }
        }

        if (credentials.username === 'user' && credentials.password === 'user') {
          return {
            id: '2',
            name: 'User',
            email: 'user@example.com',
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
      }
      return session
    },
    redirect() {
      return '/dashboard'
    },
  },
}