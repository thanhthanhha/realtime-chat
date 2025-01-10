import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { DynamoDBAdapter } from "@auth/dynamodb-adapter"
import { dynamoDb } from './dynamodb'
import { authApi } from '@/lib/axios'

export const authOptions: NextAuthOptions = {
  adapter: DynamoDBAdapter(dynamoDb),
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
        try {
          const { data } = await authApi.post('/auth/login', {
            username: credentials.username,
            password: credentials.password,
          })

          // Check if data or data.user is null/undefined
          if (!data || !data.user) {
            console.error('Auth API returned no data or user')
            return null
          }

          // Additional validation to ensure all required fields exist
          if (!data.user.id || !data.user.name || !data.user.email) {
            console.error('Auth API returned incomplete user data')
            return null
          }
          
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            image: data.user.image
          }
        } catch (error) {
          if (authApi.isAxiosError(error)) {
            console.error('Auth error:', {
              status: error.response?.status,
              message: error.response?.data,
              error: error.message
            })
          } else {
            console.error('Unexpected error:', error)
          }
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (!user) {
        const userData = await dynamoDb.get({
          TableName: "next-auth",
          Key: { pk: `USER#${token.id}`, sk: `USER#${token.id}` }
        })
        
        if (!userData.Item) {
          return token
        }

        const dbUser = userData.Item as User

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          picture: dbUser.image,
        }
      }

      token.id = user!.id
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
      }
      return session
    },
    redirect() {
      return '/dashboard'
    },
  },
}
