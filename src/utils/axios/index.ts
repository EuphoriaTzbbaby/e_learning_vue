import axios from 'axios'
import type { AxiosResponse } from 'axios'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 1000000,
})

export const get = <T = any>(url: string, params?: any): Promise<AxiosResponse<T>> => {
  console.log(import.meta.env.VITE_API_URL, url, 66666666666666)
  return service.get<T>(url, { params })
}

export const post = <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
  return service.post<T>(url, data, {
    headers: { 'Content-Type': 'application/json' }
  })
}

export const put = <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
  return service.put<T>(url, data)
}

export const del = <T = any>(url: string): Promise<AxiosResponse<T>> => {
  return service.delete<T>(url)
}
