import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

// 请求响应参数（不含data）
export interface Result {
  code: number
  message: string
}

// 请求响应参数（包含data）
export interface ResultData<T = any> extends Result {
  data: T
}

// 请求配置接口
export interface RequestConfig extends AxiosRequestConfig {
  showLoading?: boolean // 是否显示加载状态
  showError?: boolean   // 是否显示错误信息
  timeout?: number      // 超时时间
}

// 响应状态码枚举
enum StatusCode {
  SUCCESS = 200,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

class Request {
  private instance: AxiosInstance
  private baseConfig: AxiosRequestConfig = {
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  }

  constructor(config?: AxiosRequestConfig) {
    // 创建axios实例
    this.instance = axios.create(Object.assign(this.baseConfig, config))
    
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // 在发送请求之前做些什么
        
        // 添加认证token
        const token = this.getToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // 添加时间戳防止缓存
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now()
          }
        }
        
        console.log('请求发送:', config)
        return config
      },
      (error: AxiosError) => {
        // 对请求错误做些什么
        console.error('请求错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 对响应数据做点什么
        const { data, status } = response
        
        if (status === StatusCode.SUCCESS) {
          // 根据后端返回的code判断请求是否成功
          if (data.code === StatusCode.SUCCESS) {
            return data
          } else {
            // 业务错误
            this.handleBusinessError(data)
            return Promise.reject(data)
          }
        } else {
          // HTTP状态码错误
          this.handleHttpError(status)
          return Promise.reject(response)
        }
      },
      (error: AxiosError) => {
        // 对响应错误做点什么
        this.handleNetworkError(error)
        return Promise.reject(error)
      }
    )
  }

  /**
   * 获取token
   */
  private getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
  }

  /**
   * 处理业务错误
   */
  private handleBusinessError(data: any): void {
    const { code, message } = data
    
    switch (code) {
      case StatusCode.UNAUTHORIZED:
        ElMessage.error('登录已过期，请重新登录')
        // 清除token并跳转到登录页
        this.clearToken()
        // 这里可以添加路由跳转逻辑
        // router.push('/login')
        break
      case StatusCode.FORBIDDEN:
        ElMessage.error('没有权限访问该资源')
        break
      default:
        ElMessage.error(message || '请求失败')
        break
    }
  }

  /**
   * 处理HTTP错误
   */
  private handleHttpError(status: number): void {
    let message = ''
    
    switch (status) {
      case StatusCode.BAD_GATEWAY:
        message = '网关错误'
        break
      case StatusCode.SERVICE_UNAVAILABLE:
        message = '服务不可用'
        break
      case StatusCode.GATEWAY_TIMEOUT:
        message = '网关超时'
        break
      case StatusCode.SERVER_ERROR:
        message = '服务器内部错误'
        break
      default:
        message = `HTTP错误: ${status}`
        break
    }
    
    ElMessage.error(message)
  }

  /**
   * 处理网络错误
   */
  private handleNetworkError(error: AxiosError): void {
    let message = '网络错误'
    
    if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    } else if (error.message.includes('Network Error')) {
      message = '网络连接失败'
    } else if (error.response) {
      // 服务器返回了错误状态码
      this.handleHttpError(error.response.status)
      return
    }
    
    ElMessage.error(message)
  }

  /**
   * 清除token
   */
  private clearToken(): void {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
  }

  /**
   * 通用请求方法
   */
  public request<T = any>(config: RequestConfig): Promise<ResultData<T>> {
    return this.instance.request(config)
  }

  /**
   * GET请求
   */
  public get<T = any>(
    url: string,
    params?: any,
    config?: RequestConfig
  ): Promise<ResultData<T>> {
    return this.instance.get(url, { params, ...config })
  }

  /**
   * POST请求
   */
  public post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ResultData<T>> {
    return this.instance.post(url, data, config)
  }

  /**
   * PUT请求
   */
  public put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ResultData<T>> {
    return this.instance.put(url, data, config)
  }

  /**
   * DELETE请求
   */
  public delete<T = any>(
    url: string,
    config?: RequestConfig
  ): Promise<ResultData<T>> {
    return this.instance.delete(url, config)
  }

  /**
   * PATCH请求
   */
  public patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ResultData<T>> {
    return this.instance.patch(url, data, config)
  }

  /**
   * 文件上传
   */
  public upload<T = any>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: any) => void,
    config?: RequestConfig
  ): Promise<ResultData<T>> {
    const formData = new FormData()
    formData.append('file', file)
    
    return this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress,
      ...config
    })
  }

  /**
   * 文件下载
   */
  public download(
    url: string,
    params?: any,
    filename?: string,
    config?: RequestConfig
  ): Promise<void> {
    return this.instance.get(url, {
      params,
      responseType: 'blob',
      ...config
    }).then((response: any) => {
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    })
  }

  /**
   * 取消请求
   */
  public cancelRequest(message?: string): void {
    // 这里可以实现取消请求的逻辑
    console.log('取消请求:', message)
  }
}

// 创建请求实例
const request = new Request()

export default request