// API 服务文件 - 处理数据构建和请求发送

import axios from 'axios'

// 构建请求数据的接口定义
interface RequestData {
  numberOfWells: number
  targetPoints: Array<{x: string, y: string, z: string}>
  entryDirections: Array<{x: string, y: string, z: string}>
  kickoffPoints: Array<{pkx: number, pky: number, pkz: number}>
  kickoffDirections: Array<{vkx: number, vky: number, vkz: number}>
  doglegPoints: Array<{dogleg: string, radius: number}>
  computeState: any
}

/**
 * 构建发送给服务器的请求数据
 * @param numberOfWells 井的数量
 * @param targetPoints 目标点数据
 * @param entryDirections 入口方向数据
 * @param kickoffPoints 开钻点数据
 * @param kickoffDirections 开钻方向数据
 * @param doglegPoints 狗腿度数据
 * @param computeState 计算状态数据
 * @returns 格式化后的请求数据
 */
export function buildRequestData(
  numberOfWells: number,
  targetPoints: Array<{x: string, y: string, z: string}>,
  entryDirections: Array<{x: string, y: string, z: string}>,
  kickoffPoints: Array<{pkx: number, pky: number, pkz: number}>,
  kickoffDirections: Array<{vkx: number, vky: number, vkz: number}>,
  doglegPoints: Array<{dogleg: string, radius: number}>,
  computeState: any
): RequestData {
  // 构建请求数据结构
  const requestData: RequestData = {
    numberOfWells,
    targetPoints,
    entryDirections,
    kickoffPoints,
    kickoffDirections,
    doglegPoints,
    computeState
  }

  console.log('构建的请求数据:', requestData)
  return requestData
}

/**
 * 发送计算请求到服务器
 * @param data 请求数据
 * @returns Promise<any> 服务器响应
 */
export async function sendComputeRequest(data: RequestData): Promise<any> {
  try {
    console.log('发送计算请求:', data)
    
    // 这里应该是实际的 API 端点
    const response = await axios.post('/api/compute', data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时
    })

    console.log('服务器响应:', response.data)
    return response.data
  } catch (error) {
    console.error('发送请求时出错:', error)
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // 服务器响应了错误状态码
        throw new Error(`服务器错误: ${error.response.status} - ${error.response.data?.message || '未知错误'}`)
      } else if (error.request) {
        // 请求已发送但没有收到响应
        throw new Error('网络错误: 无法连接到服务器')
      } else {
        // 请求配置出错
        throw new Error(`请求配置错误: ${error.message}`)
      }
    } else {
      throw new Error(`未知错误: ${error}`)
    }
  }
}

/**
 * 格式化数值为指定小数位数
 * @param value 数值
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的数值
 */
export function formatNumber(value: number, decimals: number = 2): number {
  return Math.floor(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * 验证输入数据的有效性
 * @param data 请求数据
 * @returns 验证结果
 */
export function validateRequestData(data: RequestData): { isValid: boolean, errors: string[] } {
  const errors: string[] = []

  // 验证井数量
  if (data.numberOfWells <= 0) {
    errors.push('井的数量必须大于0')
  }

  // 验证目标点数据
  if (data.targetPoints.length !== data.numberOfWells) {
    errors.push('目标点数量与井数量不匹配')
  }

  // 验证入口方向数据
  if (data.entryDirections.length !== data.numberOfWells) {
    errors.push('入口方向数量与井数量不匹配')
  }

  // 验证开钻点数据
  if (data.kickoffPoints.length !== data.numberOfWells) {
    errors.push('开钻点数量与井数量不匹配')
  }

  // 验证开钻方向数据
  if (data.kickoffDirections.length !== data.numberOfWells) {
    errors.push('开钻方向数量与井数量不匹配')
  }

  // 验证狗腿度数据
  if (data.doglegPoints.length !== data.numberOfWells) {
    errors.push('狗腿度数据数量与井数量不匹配')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}