<script setup lang="ts">
import { ref, inject, watch } from 'vue'

const numberOfWells = inject<Readonly<Ref<number>>>('numberOfWells')!
const doglegPoints = inject<Ref<Array<{
  dogleg: string;
  radius: string;
}>>>('doglegPoints')!

// 格式化dogleg值，支持单个数字或数组格式，保留最多2位小数
const formatDoglegValue = (obj: any, key: string) => {
  const value = obj[key]
  if (typeof value === 'string') {
    // 首先将中文逗号替换为英文逗号
    const normalizedValue = value.replace(/，/g, ',')
    
    // 检查是否包含逗号（数组格式）
    if (normalizedValue.includes(',')) {
      // 处理数组格式：如 "2.0,3.0,4.0"
      const numbers = normalizedValue.split(',').map(num => {
        const parsed = parseFloat(num.trim())
        if (!isNaN(parsed)) {
          // 使用Math.floor保留最多2位小数
          const multiplied = parsed * 100
          const floored = Math.floor(multiplied) / 100
          return floored.toString()
        }
        return num.trim()
      })
      obj[key] = numbers.join(',')
    } else {
      // 处理单个数字格式
      const parsed = parseFloat(normalizedValue)
      if (!isNaN(parsed)) {
        // 使用Math.floor保留最多2位小数
        const multiplied = parsed * 100
        const floored = Math.floor(multiplied) / 100
        obj[key] = floored.toString()
      }
    }
  }
  
  // 自动计算 radius
  calculateRadiusFromDogleg(obj)
}

// 格式化radius值，支持单个数字或数组格式，保留最多2位小数
const formatRadiusValue = (obj: any, key: string) => {
  const value = obj[key]
  if (typeof value === 'string') {
    // 首先将中文逗号替换为英文逗号
    const normalizedValue = value.replace(/，/g, ',')
    
    // 检查是否包含逗号（数组格式）
    if (normalizedValue.includes(',')) {
      // 处理数组格式：如 "572.95,381.97,286.48"
      const numbers = normalizedValue.split(',').map(num => {
        const parsed = parseFloat(num.trim())
        if (!isNaN(parsed)) {
          // 使用Math.floor保留最多2位小数
          const multiplied = parsed * 100
          const floored = Math.floor(multiplied) / 100
          return floored.toString()
        }
        return num.trim()
      })
      obj[key] = numbers.join(',')
    } else {
      // 处理单个数字格式
      const parsed = parseFloat(normalizedValue)
      if (!isNaN(parsed)) {
        // 使用Math.floor保留最多2位小数
        const multiplied = parsed * 100
        const floored = Math.floor(multiplied) / 100
        obj[key] = floored.toString()
      }
    }
  }
  
  // 自动计算 dogleg
  calculateDoglegFromRadius(obj)
}

// 根据 dogleg 值自动计算 radius
const calculateRadiusFromDogleg = (doglegPoint: any) => {
  const doglegValue = doglegPoint.dogleg
  
  if (typeof doglegValue === 'string') {
    // 检查是否包含逗号（数组格式）
    if (doglegValue.includes(',')) {
      // 处理数组格式，计算每个值对应的radius
      const doglegNumbers = doglegValue.split(',').map(val => parseFloat(val.trim())).filter(val => !isNaN(val))
      const radiusNumbers = doglegNumbers.map(doglegNum => {
        if (doglegNum > 0) {
          // 公式: radius = 30 * 180 / (dogleg * π)
          const radius = (30 * 180) / (doglegNum * Math.PI)
          // 保留最多2位小数
          return Math.floor(radius * 100) / 100
        }
        return 0
      })
      doglegPoint.radius = radiusNumbers.map(r => r.toString()).join(',')
    } else {
      // 处理单个值
      const doglegNum = parseFloat(doglegValue)
      if (!isNaN(doglegNum) && doglegNum > 0) {
        // 公式: radius = 30 * 180 / (dogleg * π)
        const radius = (30 * 180) / (doglegNum * Math.PI)
        // 保留最多2位小数
        const formattedRadius = Math.floor(radius * 100) / 100
        doglegPoint.radius = formattedRadius.toString()
      }
    }
  }
}

// 根据 radius 值自动计算 dogleg
const calculateDoglegFromRadius = (doglegPoint: any) => {
  const radiusValue = doglegPoint.radius
  
  if (typeof radiusValue === 'string') {
    // 检查是否包含逗号（数组格式）
    if (radiusValue.includes(',')) {
      // 处理数组格式，计算每个值对应的dogleg
      const radiusNumbers = radiusValue.split(',').map(val => parseFloat(val.trim())).filter(val => !isNaN(val))
      const doglegNumbers = radiusNumbers.map(radiusNum => {
        if (radiusNum > 0) {
          // 公式: dogleg = 30 * 180 / (radius * π)
          const dogleg = (30 * 180) / (radiusNum * Math.PI)
          // 保留最多2位小数
          return Math.floor(dogleg * 100) / 100
        }
        return 0
      })
      doglegPoint.dogleg = doglegNumbers.map(d => d.toString()).join(',')
    } else {
      // 处理单个值
      const radiusNum = parseFloat(radiusValue)
      if (!isNaN(radiusNum) && radiusNum > 0) {
        // 公式: dogleg = 30 * 180 / (radius * π)
        const dogleg = (30 * 180) / (radiusNum * Math.PI)
        // 保留最多2位小数
        const formattedDogleg = Math.floor(dogleg * 100) / 100
        doglegPoint.dogleg = formattedDogleg.toString()
      }
    }
  }
}
</script>

<template>
  <div class="p-4 max-h-[calc(100vh-500px)] overflow-y-auto">
    <h2 class="text-lg font-serif mb-4 text-gray-800">Dogleg Severity and Corresponding Minimum Radius</h2>

    <div class="border rounded max-h-[400px] overflow-y-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 border-b">
            <th class="w-12 py-2 px-2 text-center font-medium border-r">#</th>
            <th class="w-1/2 py-2 px-2 text-center font-medium border-r">dogleg (°/30m)</th>
            <th class="w-1/2 py-2 px-2 text-center font-medium">radius (m)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(point, index) in doglegPoints" :key="index" class="border-b last:border-b-0">
            <td class="py-1.5 px-2 border-r text-center">{{ index + 1 }}</td>
            <td class="py-1.5 px-2 border-r">
              <input
                type="text"
                v-model="point.dogleg"
                @blur="formatDoglegValue(point, 'dogleg')"
                class="w-full px-1.5 py-1 border rounded text-right"
                placeholder="e.g.: 2.0 or 2.0,3.0,4.0"
              >
            </td>
            <td class="py-1.5 px-2">
              <input
                type="text"
                v-model="point.radius"
                @blur="formatRadiusValue(point, 'radius')"
                class="w-full px-1.5 py-1 border rounded text-right"
                placeholder="e.g.: 572.95 or 572.95,381.97,286.48"
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>