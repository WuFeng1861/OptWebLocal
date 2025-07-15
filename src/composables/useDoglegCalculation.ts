import { computed } from 'vue'
import type { DoglegPoint } from '../types'

export function useDoglegCalculation() {
  // 格式化数值，保留最多2位小数
  const formatValue = (value: string): string => {
    const parsed = parseFloat(value)
    if (!isNaN(parsed)) {
      const multiplied = parsed * 100
      const floored = Math.floor(multiplied) / 100
      return floored.toString()
    }
    return value
  }

  // 根据 dogleg 值自动计算 radius
  const calculateRadiusFromDogleg = (doglegValue: string): string => {
    const doglegNum = parseFloat(doglegValue)
    if (!isNaN(doglegNum) && doglegNum > 0) {
      // 公式: radius = 30 * 180 / (dogleg * π)
      const radius = (30 * 180) / (doglegNum * Math.PI)
      // 保留最多2位小数
      const formattedRadius = Math.floor(radius * 100) / 100
      return formattedRadius.toString()
    }
    return ''
  }

  // 根据 radius 值自动计算 dogleg
  const calculateDoglegFromRadius = (radiusValue: string): string => {
    const radiusNum = parseFloat(radiusValue)
    if (!isNaN(radiusNum) && radiusNum > 0) {
      // 公式: dogleg = 30 * 180 / (radius * π)
      const dogleg = (30 * 180) / (radiusNum * Math.PI)
      // 保留最多2位小数
      const formattedDogleg = Math.floor(dogleg * 100) / 100
      return formattedDogleg.toString()
    }
    return ''
  }

  // 解析dogleg字符串为三个值的数组
  const parseDoglegValues = (doglegStr: string): string[] => {
    if (!doglegStr) return ['', '', '']
    const values = doglegStr.split(',').map(v => v.trim())
    while (values.length < 3) {
      values.push('')
    }
    return values.slice(0, 3)
  }

  // 解析radius字符串为三个值的数组
  const parseRadiusValues = (radiusStr: string): string[] => {
    if (!radiusStr) return ['', '', '']
    const values = radiusStr.split(',').map(v => v.trim())
    while (values.length < 3) {
      values.push('')
    }
    return values.slice(0, 3)
  }

  // 更新dogleg值并自动计算radius
  const updateDoglegValue = (
    doglegPoints: DoglegPoint[],
    wellIndex: number,
    valueIndex: number,
    newValue: string
  ) => {
    const values = parseDoglegValues(doglegPoints[wellIndex].dogleg)
    values[valueIndex] = formatValue(newValue)
    doglegPoints[wellIndex].dogleg = values.filter(v => v !== '').join(',')
    
    // 自动计算对应的radius值
    if (newValue && !isNaN(parseFloat(newValue))) {
      const radiusValues = parseRadiusValues(doglegPoints[wellIndex].radius)
      radiusValues[valueIndex] = calculateRadiusFromDogleg(newValue)
      doglegPoints[wellIndex].radius = radiusValues.filter(v => v !== '').join(',')
    }
  }

  // 更新radius值并自动计算dogleg
  const updateRadiusValue = (
    doglegPoints: DoglegPoint[],
    wellIndex: number,
    valueIndex: number,
    newValue: string
  ) => {
    const values = parseRadiusValues(doglegPoints[wellIndex].radius)
    values[valueIndex] = formatValue(newValue)
    doglegPoints[wellIndex].radius = values.filter(v => v !== '').join(',')
    
    // 自动计算对应的dogleg值
    if (newValue && !isNaN(parseFloat(newValue))) {
      const doglegValues = parseDoglegValues(doglegPoints[wellIndex].dogleg)
      doglegValues[valueIndex] = calculateDoglegFromRadius(newValue)
      doglegPoints[wellIndex].dogleg = doglegValues.filter(v => v !== '').join(',')
    }
  }

  return {
    formatValue,
    calculateRadiusFromDogleg,
    calculateDoglegFromRadius,
    parseDoglegValues,
    parseRadiusValues,
    updateDoglegValue,
    updateRadiusValue
  }
}