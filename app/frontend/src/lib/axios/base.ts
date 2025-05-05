import axios, { 
  AxiosError, 
  AxiosResponse, 
  InternalAxiosRequestConfig,
  AxiosInstance 
} from 'axios'
import axiosRetry from 'axios-retry'
import logger, { logAPIRequest, logAPIResponse, logError } from '@/lib/logger'

const createBaseApi = (MODULE_NAME: string) => {
  const BACKEND_URL = process.env.BACKEND_URL;
  logger.info(MODULE_NAME, 'Initializing API client', {
    baseURL: BACKEND_URL,
    timeout: 10000
  })

  const api = axios.create({
    baseURL: BACKEND_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000
  })

  // Configure retry logic
  axiosRetry(api, {
    retries: 3,
    retryDelay: (retryCount: number) => {
      return axiosRetry.exponentialDelay(retryCount)
    },
    retryCondition: (error: AxiosError) => {
      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        (error.response && error.response.status >= 500)
      )
    },
    shouldResetTimeout: true,
    onRetry: (retryCount: number, error: AxiosError, requestConfig: InternalAxiosRequestConfig) => {
      logger.warn(MODULE_NAME, 'Retrying failed request', {
        url: requestConfig.url,
        attempt: retryCount + 1,
        maxRetries: 3,
        errorMessage: error.message,
        method: requestConfig.method
      })
    }
  })

  // Add request interceptor for logging
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      logAPIRequest(
        config.method?.toUpperCase() || 'UNKNOWN',
        config.url || 'UNKNOWN',
        config.data,
        config.params
      )
      return config
    },
    (error: AxiosError) => {
      logError(error, { phase: 'request' })
      return Promise.reject(error)
    }
  )

  // Add response interceptor for error handling and logging
  api.interceptors.response.use(
    (response: AxiosResponse) => {
      logAPIResponse(
        response.config.method?.toUpperCase() || 'UNKNOWN',
        response.config.url || 'UNKNOWN',
        response.status,
        response.headers['x-response-time'] || 0
      )
      return response
    },
    async (error: AxiosError) => {
      if (!error.response) {
        logger.error(MODULE_NAME, 'Network Error', {
          message: error.message,
          code: error.code,
          stack: error.stack
        })
        return Promise.reject(new Error('Network error occurred. Please check your connection.'))
      }

      const { status, data, config } = error.response

      // Log detailed error information
      const errorContext = {
        status,
        data,
        url: config?.url,
        method: config?.method,
        headers: config?.headers,
        timestamp: new Date().toISOString()
      }

      switch (status) {
        case 400:
          logger.error(MODULE_NAME, 'Authentication Error', errorContext)
          if (errorContext.data?.error) {
            return Promise.reject(new Error(errorContext.data.error))
          }
          return Promise.reject(new Error('Authentication failed. Please sign in again.'))
        case 401:
          logger.error(MODULE_NAME, 'Authentication Error', errorContext)
          if (errorContext.data?.error) {
            return Promise.reject(new Error(errorContext.data.error))
          }
          return Promise.reject(new Error('Authentication failed. Please sign in again.'))
        case 403:
          logger.error(MODULE_NAME, 'Authorization Error', errorContext)
          if (errorContext.data?.error) {
            return Promise.reject(new Error(errorContext.data.error))
          }
          return Promise.reject(new Error('You do not have permission to perform this action.'))
        case 404:
          logger.error(MODULE_NAME, 'Resource Not Found', errorContext)
          if (errorContext.data?.error) {
            return Promise.reject(new Error(errorContext.data.error))
          }
          return Promise.reject(new Error('The requested resource was not found.'))
        case 422:
          logger.error(MODULE_NAME, 'Validation Error', errorContext)
          const errorMessage = typeof data === 'object' && data !== null && 'message' in data
            ? String(data.message)
            : 'Invalid input provided.'
          return Promise.reject(new Error(errorMessage))
        case 429:
          logger.error(MODULE_NAME, 'Rate Limit Exceeded', {
            ...errorContext,
            retryAfter: error.response.headers['retry-after']
          })
          if (errorContext.data?.error) {
            return Promise.reject(new Error(errorContext.data.error))
          }
          return Promise.reject(new Error('Too many requests. Please try again later.'))
        case 500:
        case 502:
        case 503:
        case 504:
          logger.error(MODULE_NAME, 'Server Error', {
            ...errorContext,
            errorCode: status
          })
          if (errorContext.data?.error) {
            return Promise.reject(new Error(errorContext.data.error))
          }
          return Promise.reject(new Error('A server error occurred. Please try again later.'))
        default:
          logger.error(MODULE_NAME, 'Unexpected Error', {
            ...errorContext,
            errorCode: status
          })
          if (errorContext.data?.error) {
            return Promise.reject(new Error(errorContext.data.error))
          }
          return Promise.reject(new Error('An unexpected error occurred. Please try again.'))
      }
    }
  )

  logger.info(MODULE_NAME, 'API client initialized successfully')
  return api
}

export default createBaseApi