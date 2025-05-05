'use client'
 
import { getSession } from 'next-auth/react'
import createBaseApi from './base'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import logger, { logError } from '@/lib/logger'

const createClientApi = () => {
 const MODULE_NAME = "AXIOS_CLIENT_EXPORT_LIB"
 logger.error(MODULE_NAME, 'Initializing client-side API client')

 const api = createBaseApi(MODULE_NAME)

 // Add client-side auth interceptor
 api.interceptors.request.use(
   async (config: InternalAxiosRequestConfig) => {
     try {
       logger.debug(MODULE_NAME, 'Attempting to get client session', {
         url: config.url,
         method: config.method,
         timestamp: new Date().toISOString()
       })

       const session = await getSession()
       
       if (session?.user) {
         logger.debug(MODULE_NAME, 'Client session found, adding authorization header', {
           // Avoid logging sensitive info like tokens/IDs
           hasSession: true,
           hasToken: !!session.user.token
         })

         config.headers.Authorization = `Bearer ${session.user.token}`
       } else {
         logger.error(MODULE_NAME, 'No client session found for request', {
           url: config.url,
           method: config.method,
           timestamp: new Date().toISOString()
         })
       }

       logger.debug(MODULE_NAME, 'Client request configuration complete', {
         url: config.url,
         method: config.method,
         hasAuthHeader: !!config.headers.Authorization,
         timestamp: new Date().toISOString()
       })
       
       return config
     } catch (error) {
       logError(error as Error, {
         context: 'client-request-interceptor',
         url: config.url,
         method: config.method
       })

       logger.error(MODULE_NAME, 'Failed to process client request interceptor', {
         url: config.url,
         method: config.method,
         error: error instanceof Error ? error.message : 'Unknown error',
         timestamp: new Date().toISOString()
       })

       return Promise.reject(error)
     }
   },
   (error: AxiosError) => {
     logError(error, {
       context: 'client-request-interceptor-error-handler',
       url: error.config?.url,
       method: error.config?.method
     })

     logger.error(MODULE_NAME, 'Client request interceptor error handler', {
       status: error.response?.status,
       statusText: error.response?.statusText,
       url: error.config?.url,
       method: error.config?.method,
       errorMessage: error.message,
       timestamp: new Date().toISOString()
     })

     return Promise.reject(error)
   }
 )

 logger.error(MODULE_NAME, 'Client-side API client initialized successfully')
 return api
}

export const clientExportApi = createClientApi()