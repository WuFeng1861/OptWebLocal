import request from './request'
import type { ResultData } from './request'

// 用户相关接口类型定义
export interface LoginParams {
  username: string
  password: string
}

export interface UserInfo {
  id: number
  username: string
  email: string
  avatar?: string
  roles: string[]
}

export interface LoginResult {
  token: string
  userInfo: UserInfo
}

// 分页参数
export interface PageParams {
  page: number
  pageSize: number
}

// 分页结果
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * API接口封装类
 */
class ApiService {
  /**
   * 用户登录
   */
  static login(params: LoginParams): Promise<ResultData<LoginResult>> {
    return request.post('/auth/login', params)
  }

  /**
   * 获取用户信息
   */
  static getUserInfo(): Promise<ResultData<UserInfo>> {
    return request.get('/user/info')
  }

  /**
   * 用户登出
   */
  static logout(): Promise<ResultData<null>> {
    return request.post('/auth/logout')
  }

  /**
   * 获取用户列表（分页）
   */
  static getUserList(params: PageParams): Promise<ResultData<PageResult<UserInfo>>> {
    return request.get('/user/list', params)
  }

  /**
   * 创建用户
   */
  static createUser(data: Partial<UserInfo>): Promise<ResultData<UserInfo>> {
    return request.post('/user', data)
  }

  /**
   * 更新用户
   */
  static updateUser(id: number, data: Partial<UserInfo>): Promise<ResultData<UserInfo>> {
    return request.put(`/user/${id}`, data)
  }

  /**
   * 删除用户
   */
  static deleteUser(id: number): Promise<ResultData<null>> {
    return request.delete(`/user/${id}`)
  }

  /**
   * 文件上传
   */
  static uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ResultData<{ url: string }>> {
    return request.upload('/upload', file, (progressEvent) => {
      if (onProgress) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    })
  }

  /**
   * 文件下载
   */
  static downloadFile(url: string, filename?: string): Promise<void> {
    return request.download(url, {}, filename)
  }
}

export default ApiService