/**
 * 环境变量配置
 */

// 获取环境变量
export const getEnv = (key: string, defaultValue?: string): string => {
  return import.meta.env[key] || defaultValue || ''
}

// 判断是否为开发环境
export const isDev = (): boolean => {
  return import.meta.env.DEV
}

// 判断是否为生产环境
export const isProd = (): boolean => {
  return import.meta.env.PROD
}

// API基础URL
export const API_BASE_URL = getEnv('VITE_API_BASE_URL', '/api')

// 应用标题
export const APP_TITLE = getEnv('VITE_APP_TITLE', 'Vue Application')

// 上传文件大小限制（MB）
export const UPLOAD_SIZE_LIMIT = parseInt(getEnv('VITE_UPLOAD_SIZE_LIMIT', '10'))

// 请求超时时间（毫秒）
export const REQUEST_TIMEOUT = parseInt(getEnv('VITE_REQUEST_TIMEOUT', '10000'))