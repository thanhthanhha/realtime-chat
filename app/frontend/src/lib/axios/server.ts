import { auth } from "@/auth"
import createBaseApi from './base'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import logger, { logError } from '@/lib/logger'

const createServerApi = () => {
  const MODULE_NAME = "AXIOS_SERVER_LIB"
  logger.info(MODULE_NAME, 'Initializing server-side API client')
  
  const api = createBaseApi(MODULE_NAME)

  // Add server-side auth interceptor
  api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        logger.debug(MODULE_NAME, 'Attempting to get auth session', {
          url: config.url,
          method: config.method
        })

        const session = await auth()
        
        if (session?.user) {
          logger.debug(MODULE_NAME, 'Auth session found, adding authorization header', {
            userId: session.user.id,
            hasToken: !!session.user.token
          })
          
          config.headers.Authorization = `Bearer ${session.user.token}`
        } else {
          logger.warn(MODULE_NAME, 'No auth session found for request', {
            url: config.url,
            method: config.method,
            timestamp: new Date().toISOString()
          })
        }
        
        logger.debug(MODULE_NAME, 'Request configuration complete', {
          url: config.url,
          method: config.method,
          hasAuthHeader: !!config.headers.Authorization
        })

        return config
      } catch (error) {
        logError(error as Error, {
          context: 'server-request-interceptor',
          url: config.url,
          method: config.method
        })

        logger.error(MODULE_NAME, 'Failed to process server request interceptor', {
          url: config.url,
          method: config.method,
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        return Promise.reject(error)
      }
    },
    (error: AxiosError) => {
      logError(error, {
        context: 'server-request-interceptor-error-handler',
        url: error.config?.url,
        method: error.config?.method
      })

      logger.error(MODULE_NAME, 'Server request interceptor error handler', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        errorMessage: error.message
      })

      return Promise.reject(error)
    }
  )

  logger.info(MODULE_NAME, 'Server-side API client initialized successfully')
  return api
}

export const serverApi = createServerApi()