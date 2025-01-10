import axios from 'axios'
import axiosRetry from 'axios-retry'

// Create axios instance with default config
export const authApi = axios.create({
  baseURL: process.env.BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000 // 5 second timeout
})

// Add retry logic
axiosRetry(authApi, { 
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           error.response?.status === 500
  }
})

// Add request interceptor if needed
authApi.interceptors.request.use(
  (config) => {
    // Do something before request is sent
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor if needed
authApi.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx
    return response
  },
  (error) => {
    // Any status codes outside the range of 2xx
    return Promise.reject(error)
  }
)