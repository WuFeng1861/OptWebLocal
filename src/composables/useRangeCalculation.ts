import { computed, watchEffect } from 'vue'
import type { Point, DoglegPoint } from '../types'

export function useRangeCalculation(
  targetPoints: Point[],
  doglegPoints: DoglegPoint[]
) {
  // 计算X Range的自动值
  const calculateAutoXRange = () => {
    const ranges: number[] = []
    
    for (let i = 0; i < targetPoints.length; i++) {
      const targetPoint = targetPoints[i]
      const doglegPoint = doglegPoints[i]
      
      if (targetPoint && doglegPoint) {
        const p2x = parseFloat(targetPoint.x)
        
        // 解析radius字符串，选出最大值
        let maxRadius = 0
        if (typeof doglegPoint.radius === 'string') {
          const radiusValues = doglegPoint.radius.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
          maxRadius = radiusValues.length > 0 ? Math.max(...radiusValues) : 0
        } else {
          maxRadius = doglegPoint.radius || 0
        }
        
        if (!isNaN(p2x) && maxRadius > 0) {
          const minRange = p2x - maxRadius - 1000
          const maxRange = p2x + maxRadius + 1000
          ranges.push(minRange, maxRange)
        }
      }
    }
    
    if (ranges.length > 0) {
      const minValue = Math.min(...ranges)
      const maxValue = Math.max(...ranges)
      // 向下取整到500的倍数（减去额外的500）
      const formattedMin = Math.floor((minValue - 500) / 500) * 500
      // 向上取整到500的倍数（加上额外的500）
      const formattedMax = Math.ceil((maxValue + 500) / 500) * 500
      
      return [formattedMin, formattedMax]
    }
    
    return [0, 0]
  }

  // 计算Y Range的自动值
  const calculateAutoYRange = () => {
    const ranges: number[] = []
    
    for (let i = 0; i < targetPoints.length; i++) {
      const targetPoint = targetPoints[i]
      const doglegPoint = doglegPoints[i]
      
      if (targetPoint && doglegPoint) {
        const p2y = parseFloat(targetPoint.y)
        
        // 解析radius字符串，选出最大值
        let maxRadius = 0
        if (typeof doglegPoint.radius === 'string') {
          const radiusValues = doglegPoint.radius.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
          maxRadius = radiusValues.length > 0 ? Math.max(...radiusValues) : 0
        } else {
          maxRadius = doglegPoint.radius || 0
        }
        
        if (!isNaN(p2y) && maxRadius > 0) {
          const minRange = p2y - maxRadius - 1000
          const maxRange = p2y + maxRadius + 1000
          ranges.push(minRange, maxRange)
        }
      }
    }
    
    if (ranges.length > 0) {
      const minValue = Math.min(...ranges)
      const maxValue = Math.max(...ranges)
      
      // 向下取整到500的倍数（减去额外的500）
      const formattedMin = Math.floor((minValue - 500) / 500) * 500
      // 向上取整到500的倍数（加上额外的500）
      const formattedMax = Math.ceil((maxValue + 500) / 500) * 500
      
      return [formattedMin, formattedMax]
    }
    
    return [0, 0]
  }

  // 计算 Initial Guess 的自动值（Target Points 的 x 和 y 的平均值）
  const calculateAutoInitialGuess = () => {
    if (targetPoints.length === 0) {
      return [0, 0]
    }
    
    let totalX = 0
    let totalY = 0
    let validCount = 0
    
    for (const point of targetPoints) {
      const x = parseFloat(point.x)
      const y = parseFloat(point.y)
      
      if (!isNaN(x) && !isNaN(y)) {
        totalX += x
        totalY += y
        validCount++
      }
    }
    
    if (validCount === 0) {
      return [0, 0]
    }
    
    // 计算平均值并保留2位小数
    const avgX = Math.floor((totalX / validCount) * 100) / 100
    const avgY = Math.floor((totalY / validCount) * 100) / 100
    
    return [avgX, avgY]
  }

  return {
    calculateAutoXRange,
    calculateAutoYRange,
    calculateAutoInitialGuess
  }
}