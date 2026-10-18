import axios from 'axios'
import { ApiError } from './ApiError'

/**
 * Shared axios instance for the document service REST API. Failed requests reject with
 * an ApiError; cancelled requests reject with the original axios cancel error.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  paramsSerializer: { indexes: null },
})

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(axios.isCancel(error) ? error : ApiError.from(error)),
)
