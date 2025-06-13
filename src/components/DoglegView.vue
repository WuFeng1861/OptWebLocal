<script setup lang="ts">
import { ref, inject } from 'vue'

const numberOfWells = inject<Readonly<Ref<number>>>('numberOfWells')!
const doglegPoints = inject<Ref<Array<{
  dogleg: string;
  radius: string;
}>>>('doglegPoints')!

// 控制折叠面板的展开状态，默认全部展开
const activeNames = ref(['dogleg', 'radius'])

// 格式化数值，保留最多2位小数
const formatValue = (value: string): string => {
  const parsed = parseFloat(value)
  if (!isNaN(parsed)) {
    // 使用Math.floor保留最多2位小数
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

// 更新dogleg值
const updateDoglegValue = (wellIndex: number, valueIndex: number, newValue: string) => {
  const values = parseDoglegValues(doglegPoints.value[wellIndex].dogleg)
  values[valueIndex] = formatValue(newValue)
  doglegPoints.value[wellIndex].dogleg = values.filter(v => v !== '').join(',')
  
  // 自动计算对应的radius值
  if (newValue && !isNaN(parseFloat(newValue))) {
    const radiusValues = parseRadiusValues(doglegPoints.value[wellIndex].radius)
    radiusValues[valueIndex] = calculateRadiusFromDogleg(newValue)
    doglegPoints.value[wellIndex].radius = radiusValues.filter(v => v !== '').join(',')
  }
}

// 更新radius值
const updateRadiusValue = (wellIndex: number, valueIndex: number, newValue: string) => {
  const values = parseRadiusValues(doglegPoints.value[wellIndex].radius)
  values[valueIndex] = formatValue(newValue)
  doglegPoints.value[wellIndex].radius = values.filter(v => v !== '').join(',')
  
  // 自动计算对应的dogleg值
  if (newValue && !isNaN(parseFloat(newValue))) {
    const doglegValues = parseDoglegValues(doglegPoints.value[wellIndex].dogleg)
    doglegValues[valueIndex] = calculateDoglegFromRadius(newValue)
    doglegPoints.value[wellIndex].dogleg = doglegValues.filter(v => v !== '').join(',')
  }
}
</script>

<template>
  <div class="p-4 max-h-[calc(100vh-500px)] overflow-y-auto">
    <h2 class="text-lg font-serif mb-4 text-gray-800">Dogleg Severity and Corresponding Minimum Radius</h2>

    <el-collapse v-model="activeNames" class="custom-collapse">
      <!-- Dogleg Table -->
      <el-collapse-item title="Dogleg Severity (°/30m)" name="dogleg">
        <div class="table-scroll-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="w-12">#</th>
                <th class="w-1/3">Dogleg 1</th>
                <th class="w-1/3">Dogleg 2</th>
                <th class="w-1/3">Dogleg 3</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(point, wellIndex) in doglegPoints" :key="wellIndex">
                <td>{{ wellIndex + 1 }}</td>
                <td>
                  <input
                    type="text"
                    :value="parseDoglegValues(point.dogleg)[0]"
                    @input="updateDoglegValue(wellIndex, 0, ($event.target as HTMLInputElement).value)"
                    class="w-full px-1.5 py-1 border rounded text-right"
                    placeholder="e.g.: 3.0"
                  >
                </td>
                <td>
                  <input
                    type="text"
                    :value="parseDoglegValues(point.dogleg)[1]"
                    @input="updateDoglegValue(wellIndex, 1, ($event.target as HTMLInputElement).value)"
                    class="w-full px-1.5 py-1 border rounded text-right"
                    placeholder="e.g.: 3.0"
                  >
                </td>
                <td>
                  <input
                    type="text"
                    :value="parseDoglegValues(point.dogleg)[2]"
                    @input="updateDoglegValue(wellIndex, 2, ($event.target as HTMLInputElement).value)"
                    class="w-full px-1.5 py-1 border rounded text-right"
                    placeholder="e.g.: 3.0"
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-collapse-item>

      <!-- Radius Table -->
      <el-collapse-item title="Minimum Radius (m)" name="radius">
        <div class="table-scroll-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="w-12">#</th>
                <th class="w-1/3">Radius 1</th>
                <th class="w-1/3">Radius 2</th>
                <th class="w-1/3">Radius 3</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(point, wellIndex) in doglegPoints" :key="wellIndex">
                <td>{{ wellIndex + 1 }}</td>
                <td>
                  <input
                    type="text"
                    :value="parseRadiusValues(point.radius)[0]"
                    @input="updateRadiusValue(wellIndex, 0, ($event.target as HTMLInputElement).value)"
                    class="w-full px-1.5 py-1 border rounded text-right"
                    placeholder="e.g.: 572.95"
                  >
                </td>
                <td>
                  <input
                    type="text"
                    :value="parseRadiusValues(point.radius)[1]"
                    @input="updateRadiusValue(wellIndex, 1, ($event.target as HTMLInputElement).value)"
                    class="w-full px-1.5 py-1 border rounded text-right"
                    placeholder="e.g.: 572.95"
                  >
                </td>
                <td>
                  <input
                    type="text"
                    :value="parseRadiusValues(point.radius)[2]"
                    @input="updateRadiusValue(wellIndex, 2, ($event.target as HTMLInputElement).value)"
                    class="w-full px-1.5 py-1 border rounded text-right"
                    placeholder="e.g.: 572.95"
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
@import '../styles/shared.css';
</style>