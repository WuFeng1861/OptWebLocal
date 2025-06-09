<script setup lang="ts">
import { ref, inject, watch } from 'vue'
import { ElMessage } from 'element-plus'

const numberOfWells = inject<Readonly<Ref<number>>>('numberOfWells')!
const doglegPoints = inject<Ref<Array<{
  dogleg: string;
  radius: number;
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
          if (parsed < 0) {
            ElMessage({
              message: '狗腿度值不能为负数',
              type: 'error',
              showClose: true,
              duration: 3000
            })
            return '0'
          }
          // 使用Math.floor保留最多2位小数
          const multiplied = parsed * 100
          const floored = Math.floor(multiplied) / 100
          return floored.toString()
        }
        ElMessage({
          message: `Invalid dogleg value: ${num.trim()}, please enter a valid number`,
          type: 'error',
          showClose: true,
          duration: 3000
        })
        return num.trim()
      })
      obj[key] = numbers.join(',')
    } else {
      // 处理单个数字格式
      const parsed = parseFloat(normalizedValue)
      if (!isNaN(parsed)) {
        if (parsed < 0) {
          ElMessage({
            message: 'Dogleg value cannot be negative',
            type: 'error',
            showClose: true,
            duration: 3000
          })
          obj[key] = '0'
          return
        }
        // 使用Math.floor保留最多2位小数
        const multiplied = parsed * 100
        const floored = Math.floor(multiplied) / 100
        obj[key] = floored.toString()
      } else if (normalizedValue !== '') {
        ElMessage({
          message: `Invalid dogleg value: ${normalizedValue}, please enter a valid number or array format`,
          type: 'error',
          showClose: true,
          duration: 3000
        })
        obj[key] = '3'
      }
    }
  }
}

// 格式化radius值，保留最多2位小数
const formatRadiusValue = (obj: any, key: string) => {
  const value = parseFloat(obj[key])
  if (!isNaN(value)) {
    if (value <= 0) {
      ElMessage({
        message: 'Radius value must be greater than 0',
        type: 'error',
        showClose: true,
        duration: 3000
      })
      obj[key] = 859.44
      return
    }
    // 使用Math.floor保留最多2位小数
    const multiplied = value * 100
    const floored = Math.floor(multiplied) / 100
    obj[key] = floored
  } else {
    ElMessage({
      message: 'Invalid radius value, please enter a valid positive number',
      type: 'error',
      showClose: true,
      duration: 3000
    })
    obj[key] = 859.44
  }
}
</script>

<template>
  <div class="p-4 max-h-[calc(100vh-500px)] overflow-y-auto">
    <h2 class="text-lg font-serif mb-4 text-gray-800">Dogleg Severity & Corresponding Minimum Radius</h2>

    <div class="border rounded max-h-[400px] overflow-y-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 border-b">
            <th class="w-12 py-2 px-2 text-center font-medium border-r">#</th>
            <th class="w-1/2 py-2 px-2 text-center font-medium border-r">dogleg (°/30m)</th>
            <th class="w-1/2 py-2 px-2 text-center font-medium">radius(m)</th>
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
                placeholder="example: 2.0 or 2.0,3.0,4.0"
              >
            </td>
            <td class="py-1.5 px-2">
              <input
                type="number"
                v-model="point.radius"
                @blur="formatRadiusValue(point, 'radius')"
                class="w-full px-1.5 py-1 border rounded text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                step="0.01"
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>