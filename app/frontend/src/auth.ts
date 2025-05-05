import CredentialsProvider from 'next-auth/providers/credentials'
import { serverApi } from '@/lib/axios'
import logger, { logError, logAPIRequest, logAPIResponse } from '@/lib/logger'
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const MODULE_NAME = 'NextAuthMain'

export const {
    auth,
    signIn,
    signOut,
    handlers: { GET, POST },
} = NextAuth({
    ...authConfig,
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
              logger.debug(MODULE_NAME, 'Authorization attempt started', { 
                email: credentials?.email ? credentials.email.substring(0, 3) + '***' : 'missing',
                hasPassword: !!credentials?.password
              });

              if (!credentials?.email || !credentials?.password) {
                logger.warn(MODULE_NAME, 'Login attempt with missing credentials', {
                  hasEmail: !!credentials?.email,
                  hasPassword: !!credentials?.password
                });
                return null;
              }
      
              try {
                logger.info(MODULE_NAME, 'Authenticating user', {
                  email: credentials.email.substring(0, 3) + '***',
                  requestId: `auth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
                });
      
                logAPIRequest('POST', '/api/auth/login', {
                  email: credentials.email.substring(0, 3) + '***',
                  // Password intentionally excluded from logs
                });
      
                const startTime = Date.now();
                logger.http(MODULE_NAME, 'Sending authentication request to API');
                
                const response = await serverApi.post('/api/auth/login', {
                  email: credentials.email,
                  password: credentials.password,
                });
                
                const responseTime = Date.now() - startTime;
      
                logAPIResponse('POST', '/api/auth/login', response.status, responseTime);
                logger.debug(MODULE_NAME, 'Auth API response received', { 
                  status: response.status, 
                  responseTime: `${responseTime}ms`,
                  hasToken: !!response.data?.token
                });
      
                const { data } = response;
                if (!data || !data.token) {
                  logger.error(MODULE_NAME, 'Authentication response missing expected data', {
                    hasData: !!data,
                    hasToken: !!data?.token,
                    responseStatus: response.status
                  });
                  throw new Error('Authentication failed: Invalid response structure');
                }
      
                logger.info(MODULE_NAME, 'Authentication successful', {
                  userId: data.user.id,
                  email: data.user.email.substring(0, 3) + '***',
                  hasImage: !!data.user.image,
                  tokenLength: data.token.length
                });
      
                return {
                  id: data.user.id,
                  email: data.user.email,
                  name: data.user.name,
                  image: data.user.image,
                  token: data.token
                };
              } catch (error) {
                const isAxiosError = error.isAxiosError || (error.response && error.config);
                
                logger.error(MODULE_NAME, 'Authentication failed', {
                  errorType: isAxiosError ? 'API Error' : 'Application Error',
                  errorMessage: error.message,
                  statusCode: error.response?.status,
                  email: credentials.email.substring(0, 3) + '***'
                });
                
                logError(
                  error instanceof Error ? error : new Error('Unknown authentication error'), 
                  {
                    context: MODULE_NAME,
                    operation: 'user_authentication',
                    email: credentials.email.substring(0, 3) + '***'
                  }
                );
                
                return null;
              }
            }
        })
    ],
});