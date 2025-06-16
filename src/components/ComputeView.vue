<script setup lang="ts">
import { inject, watch, ref, computed, watchEffect } from 'vue'
import { buildRequestData, sendComputeRequest } from '../services/api'
import { ElMessage } from 'element-plus'

const computeState = inject<Ref<{
  problemType: string;
  cluster_min: number;
  cluster_max: number;
  sitePreparationCost: number;
  numberOfClusterSizes: number;
  clusterSizes: Array<{ size: number; cost: number }>;
  economicZoneThreshold: number;
  parallelComputing: boolean;
  threadCount: number;
  designatePosition: boolean;
  ranges: {
    x: { mode: 'Auto' | 'Manual'; value: string };
    y: { mode: 'Auto' | 'Manual'; value: string };
    radius: { mode: 'Auto' | 'Manual'; value: string };
    resolution: { mode: 'Auto' | 'Manual'; value: string };
    initialGuess: { mode: 'Auto' | 'Manual'; value: string };
  };
}>>('computeState')!

const numberOfWells = inject<Readonly<Ref<number>>>('numberOfWells')!
const targetPoints = inject<Ref<Array<{x: string, y: string, z: string}>>>('targetPoints')!
const entryDirections = inject<Ref<Array<{x: string, y: string, z: string}>>>('entryDirections')!
const kickoffPoints = inject<Ref<Array<{pkx: number | null, pky: number | null, pkz: number}>>>('kickoffPoints')!
const kickoffDirections = inject<Ref<Array<{vkx: number | null, vky: number | null, vkz: number}>>>('kickoffDirections')!
const doglegPoints = inject<Ref<Array<{dogleg: number, radius: number}>>>('doglegPoints')!
const otherConstraints = inject<Ref<any>>('otherConstraints')!

// 计算X Range的自动值
const calculateAutoXRange = () => {
  const ranges: number[] = []
  
  for (let i = 0; i < targetPoints.value.length; i++) {
    const targetPoint = targetPoints.value[i]
    const doglegPoint = doglegPoints.value[i]
    console.log(targetPoint, doglegPoint, "calculateAutoXRange");
    
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
  
  for (let i = 0; i < targetPoints.value.length; i++) {
    const targetPoint = targetPoints.value[i]
    const doglegPoint = doglegPoints.value[i]
    
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
  if (targetPoints.value.length === 0) {
    return [0, 0]
  }
  
  let totalX = 0
  let totalY = 0
  let validCount = 0
  
  for (const point of targetPoints.value) {
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

// 监听相关数据变化，自动更新范围值
watchEffect(() => {
  if (computeState.value.ranges.x.mode === 'Auto') {
    const autoRange = calculateAutoXRange()
    computeState.value.ranges.x.value = JSON.stringify(autoRange)
  }
})

watchEffect(() => {
  if (computeState.value.ranges.y.mode === 'Auto') {
    const autoRange = calculateAutoYRange()
    computeState.value.ranges.y.value = JSON.stringify(autoRange)
  }
})

watchEffect(() => {
  if (computeState.value.ranges.initialGuess.mode === 'Auto') {
    const autoGuess = calculateAutoInitialGuess()
    computeState.value.ranges.initialGuess.value = JSON.stringify(autoGuess)
  }
})

// 控制折叠面板的展开状态，默认全部展开
const activeNames = ref(['cost-contour', 'optimal-layout', 'optimal-site'])

// 数据验证函数
const validateData = () => {
  const errors: string[] = []
  
  // 1. 检查 Number of Wells 不能小于1
  if (numberOfWells.value < 1) {
    errors.push('Number of wells cannot be less than 1')
  }
  
  // 2. 检查 Target Points (PT) 不能有空值
  for (let i = 0; i < targetPoints.value.length; i++) {
    const point = targetPoints.value[i]
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
  for (let i = 0; i < entryDirections.value.length; i++) {
    const direction = entryDirections.value[i]
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
  for (let i = 0; i < doglegPoints.value.length; i++) {
    const point = doglegPoints.value[i]
    
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

const sendRequest = async () => {
  try {
    // 进行数据验证
    const validationErrors = validateData()
    
    if (validationErrors.length > 0) {
      // 显示验证错误信息
      const errorMessage = 'Data validation failed. Please check the following issues:<br><br>' + 
        validationErrors.map(error => `• ${error}`).join('<br>')
      
      ElMessage({
        message: errorMessage,
        type: 'error',
        duration: 0, // 不自动关闭，需要用户手动关闭
        showClose: true,
        dangerouslyUseHTMLString: true // 启用 HTML 渲染
      })
      return
    }
    
    const data = buildRequestData(
        numberOfWells.value,
        targetPoints.value,
        entryDirections.value,
        kickoffPoints.value,
        kickoffDirections.value,
        doglegPoints.value,
        computeState.value,
        otherConstraints.value
    )
    const response = await sendComputeRequest(data)
    console.log('Response:', response)
  } catch (error) {
    console.error('Error:', error)
  }
}

// Watch for changes in numberOfClusterSizes and update clusterSizes array
watch(() => computeState.value.numberOfClusterSizes, (newValue) => {
  const currentLength = computeState.value.clusterSizes.length
  if (newValue > currentLength) {
    // Add new rows
    for (let i = currentLength; i < newValue; i++) {
      computeState.value.clusterSizes.push({ size: 1.00, cost: 20.00 })
    }
  } else if (newValue < currentLength) {
    // Remove excess rows
    computeState.value.clusterSizes.splice(newValue)
  }
})

// Watch clusterSizes length and update numberOfClusterSizes
watch(() => computeState.value.clusterSizes.length, (newLength) => {
  computeState.value.numberOfClusterSizes = newLength
})
</script>

<template>
  <div class="pb-6 max-h-[calc(100vh-500px)] overflow-y-auto">
    <el-collapse v-model="activeNames" class="custom-collapse">
      <!-- Cost Contour -->
      <el-collapse-item title="Cost Contour" name="cost-contour">
        <div class="p-4 space-y-3">
          <!-- X Range -->
          <div class="grid grid-cols-[80px,1fr] items-center gap-2">
            <span class="text-sm">X Range:</span>
            <div class="flex items-center space-x-3">
              <label class="inline-flex items-center">
                <input type="radio" v-model="computeState.ranges.x.mode" value="Auto" class="form-radio">
                <span class="ml-2 text-sm">Auto</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" v-model="computeState.ranges.x.mode" value="Manual" class="form-radio">
                <input
                    type="text"
                    v-model="computeState.ranges.x.value"
                    class="ml-2 border rounded px-2 py-1 w-28 text-sm"
                    :disabled="computeState.ranges.x.mode === 'Auto'"
                    :placeholder="computeState.ranges.x.mode === 'Auto' ? computeState.ranges.x.value : '[min, max]'"
                >
              </label>
            </div>
          </div>

          <!-- Y Range -->
          <div class="grid grid-cols-[80px,1fr] items-center gap-2">
            <span class="text-sm">Y Range:</span>
            <div class="flex items-center space-x-3">
              <label class="inline-flex items-center">
                <input type="radio" v-model="computeState.ranges.y.mode" value="Auto" class="form-radio">
                <span class="ml-2 text-sm">Auto</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" v-model="computeState.ranges.y.mode" value="Manual" class="form-radio">
                <input
                    type="text"
                    v-model="computeState.ranges.y.value"
                    class="ml-2 border rounded px-2 py-1 w-28 text-sm"
                    :disabled="computeState.ranges.y.mode === 'Auto'"
                    :placeholder="computeState.ranges.y.mode === 'Auto' ? computeState.ranges.y.value : '[min, max]'"
                >
              </label>
            </div>
          </div>

          <!-- Radius -->
          <div class="grid grid-cols-[80px,1fr] items-center gap-2">
            <span class="text-sm">Radius:</span>
            <div class="flex items-center space-x-3">
              <label class="inline-flex items-center">
                <input type="radio" v-model="computeState.ranges.radius.mode" value="Auto" class="form-radio">
                <span class="ml-2 text-sm">Auto</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" v-model="computeState.ranges.radius.mode" value="Manual" class="form-radio">
                <input
                    type="text"
                    v-model="computeState.ranges.radius.value"
                    class="ml-2 border rounded px-2 py-1 w-28 text-sm"
                    :disabled="computeState.ranges.radius.mode === 'Auto'"
                >
              </label>
            </div>
          </div>

          <!-- Resolution -->
          <div class="grid grid-cols-[80px,1fr] items-center gap-2">
            <span class="text-sm">Resolution:</span>
            <div class="flex items-center space-x-3">
              <label class="inline-flex items-center">
                <input type="radio" v-model="computeState.ranges.resolution.mode" value="Auto" class="form-radio">
                <span class="ml-2 text-sm">Auto</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" v-model="computeState.ranges.resolution.mode" value="Manual" class="form-radio">
                <input
                    type="text"
                    v-model="computeState.ranges.resolution.value"
                    class="ml-2 border rounded px-2 py-1 w-28 text-sm"
                    :disabled="computeState.ranges.resolution.mode === 'Auto'"
                >
              </label>
            </div>
          </div>

          <!-- Run Button -->
          <div class="flex items-center space-x-3">
            <button
                @click="sendRequest"
                class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-green-600 transition-colors">
              ▶
            </button>
            <span class="text-sm text-gray-600">Run Cost Contour Analysis</span>
          </div>
        </div>
      </el-collapse-item>

      <!-- Optimal Layout -->
      <el-collapse-item
        v-if="computeState.problemType === 'K-Sites-N-Wells'"
        title="Optimal Layout(K-Sites-N-Wells)"
        name="optimal-layout"
      >
        <div class="p-4 space-y-3">
          <!-- Minimum Clusters -->
          <div class="flex items-center space-x-2">
            <span class="text-sm whitespace-nowrap">Minimum Clusters:</span>
            <input
                type="number"
                v-model="computeState.cluster_min"
                min="1"
                class="border rounded px-2 py-1 w-20 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            >
          </div>

          <!-- Maximum Clusters -->
          <div class="flex items-center space-x-2">
            <span class="text-sm whitespace-nowrap">Maximum Clusters:</span>
            <input
                type="number"
                v-model="computeState.cluster_max"
                min="1"
                class="border rounded px-2 py-1 w-20 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            >
          </div>
          <button class="px-4 py-1 border rounded text-sm hover:bg-gray-50 transition-colors">
            Run Optimization
          </button>
        </div>
      </el-collapse-item>

      <!-- Optimal Site -->
      <el-collapse-item
        v-if="computeState.problemType === '1-Site-N-Wells'"
        title="Optimal Site(1-Site-N-Wells)"
        name="optimal-site"
      >
        <div class="p-4 space-y-3">
          <!-- Initial Guess -->
          <div class="grid grid-cols-[100px,1fr] items-center gap-2">
            <span class="text-sm whitespace-nowrap">Initial Guess:</span>
            <div class="flex items-center space-x-3">
              <label class="inline-flex items-center">
                <input type="radio" v-model="computeState.ranges.initialGuess.mode" value="Auto" class="form-radio">
                <span class="ml-2 text-sm">Auto</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" v-model="computeState.ranges.initialGuess.mode" value="Manual" class="form-radio">
                <input
                    type="text"
                    v-model="computeState.ranges.initialGuess.value"
                    class="ml-2 border rounded px-2 py-1 w-28 text-sm"
                    :disabled="computeState.ranges.initialGuess.mode === 'Auto'"
                    placeholder="[x, y]"
                >
              </label>
            </div>
          </div>

          <!-- Run Button -->
          <div class="flex items-center space-x-3">
            <button class="px-4 py-1 border rounded text-sm hover:bg-gray-50 transition-colors">
              Run Optimization
            </button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
@import '../styles/shared.css';
</style>