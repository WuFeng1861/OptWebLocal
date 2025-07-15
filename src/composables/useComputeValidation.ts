import type { Point, DoglegPoint } from '../types'

export function useComputeValidation() {
  // 数据验证函数
  const validateData = (
    numberOfWells: number,
    targetPoints: Point[],
    entryDirections: Point[],
    doglegPoints: DoglegPoint[]
  ): string[] => {
    const errors: string[] = []
    
    // 1. 检查 Number of Wells 不能小于1
    if (numberOfWells < 1) {
      errors.push('Number of wells cannot be less than 1')
    }
    
    // 2. 检查 Target Points (PT) 不能有空值
    for (let i = 0; i < targetPoints.length; i++) {
      const point = targetPoints[i]
      if (!point.x || !point.y || !point.z) {
        errors.push(`Target point ${i + 1} coordinates cannot be empty (P2x: ${point.x}, P2y: ${point.y}, P2z: ${point.z})`)
      }
      
      // 检查是否为有效数字
      if (point.x && isNaN(parseFloat(point.x))) {
        errors.push(`Target point ${i + 1} P2x must be a valid number`)
      }
      if (point.y && isNaN(parseFloat(point.y))) {
        errors.push(`Target point ${i + 1} P2y must be a valid number`)
      }
      if (point.z && isNaN(parseFloat(point.z))) {
        errors.push(`Target point ${i + 1} P2z must be a valid number`)
      }
    }
    
    // 3. 检查 Entry Directions (VT) 不能有空值
    for (let i = 0; i < entryDirections.length; i++) {
      const direction = entryDirections[i]
      if (!direction.x || !direction.y || !direction.z) {
        errors.push(`Entry direction ${i + 1} coordinates cannot be empty (V2x: ${direction.x}, V2y: ${direction.y}, V2z: ${direction.z})`)
      }
      
      // 检查是否为有效数字
      if (direction.x && isNaN(parseFloat(direction.x))) {
        errors.push(`Entry direction ${i + 1} V2x must be a valid number`)
      }
      if (direction.y && isNaN(parseFloat(direction.y))) {
        errors.push(`Entry direction ${i + 1} V2y must be a valid number`)
      }
      if (direction.z && isNaN(parseFloat(direction.z))) {
        errors.push(`Entry direction ${i + 1} V2z must be a valid number`)
      }
    }
    
    // 4. 检查 Dogleg 数据不能有空值，且 dogleg 和 radius 的数据位数要一致
    for (let i = 0; i < doglegPoints.length; i++) {
      const point = doglegPoints[i]
      
      // 检查 dogleg 不能为空
      if (!point.dogleg || point.dogleg.toString().trim() === '') {
        errors.push(`Well ${i + 1} dogleg value cannot be empty`)
        continue
      }
      
      // 检查 radius 不能为空
      if (!point.radius || point.radius.toString().trim() === '') {
        errors.push(`Well ${i + 1} radius value cannot be empty`)
        continue
      }
      
      // 解析 dogleg 和 radius 的数组长度
      const doglegStr = point.dogleg.toString().replace(/，/g, ',')
      const radiusStr = point.radius.toString().replace(/，/g, ',')
      
      const doglegValues = doglegStr.split(',').map(v => v.trim()).filter(v => v !== '')
      const radiusValues = radiusStr.split(',').map(v => v.trim()).filter(v => v !== '')
      
      // 检查 dogleg 值是否都是有效数字
      for (let j = 0; j < doglegValues.length; j++) {
        if (isNaN(parseFloat(doglegValues[j]))) {
          errors.push(`Well ${i + 1} dogleg value ${j + 1} must be a valid number`)
        }
      }
      
      // 检查 radius 值是否都是有效数字
      for (let j = 0; j < radiusValues.length; j++) {
        if (isNaN(parseFloat(radiusValues[j]))) {
          errors.push(`Well ${i + 1} radius value ${j + 1} must be a valid number`)
        }
      }
      
      // 检查 dogleg 和 radius 的数据位数是否一致
      if (doglegValues.length !== radiusValues.length) {
        errors.push(`Well ${i + 1} dogleg and radius data count mismatch (dogleg: ${doglegValues.length} values, radius: ${radiusValues.length} values)`)
      }
    }
    
    return errors
  }

  return {
    validateData
  }
}