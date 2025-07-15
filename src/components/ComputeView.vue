<script setup lang="ts">
import { inject, watch, ref, computed, watchEffect } from 'vue'
import { buildRequestData, sendComputeRequest } from '../services/api'
import { ElMessage } from 'element-plus'
import { useComputeValidation, useRangeCalculation } from '../composables'

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
const wellNames = inject<Ref<string[]>>('wellNames')!
const targetPoints = inject<Ref<Array<{x: string, y: string, z: string}>>>('targetPoints')!
const entryDirections = inject<Ref<Array<{x: string, y: string, z: string}>>>('entryDirections')!
const kickoffPoints = inject<Ref<Array<{pkx: number | null, pky: number | null, pkz: number}>>>('kickoffPoints')!
const kickoffDirections = inject<Ref<Array<{vkx: number | null, vky: number | null, vkz: number}>>>('kickoffDirections')!
const doglegPoints = inject<Ref<Array<{dogleg: number, radius: number}>>>('doglegPoints')!
const otherConstraints = inject<Ref<any>>('otherConstraints')!
const selectedWells = inject<Ref<number[]>>('selectedWells', ref([]))
const updateSelectedWells = inject<(wells: number[]) => void>('updateSelectedWells', () => {})
const selectWellsEnabled = inject<Ref<boolean>>('selectWellsEnabled', ref(false))

// 使用 composables
const { validateData } = useComputeValidation()
const { calculateAutoXRange, calculateAutoYRange, calculateAutoInitialGuess } = useRangeCalculation(
  targetPoints.value,
  doglegPoints.value
)

// 计算X Range的自动值
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
const activeNames = ref(['select-wells', 'cost-contour', 'optimal-layout', 'optimal-site'])

// Select Wells 状态
const wellsInputValue = ref('')

// 监听选中井的变化，更新输入框内容
watch(selectedWells, (newWells) => {
  // 始终同步选中井数据到输入框
  wellsInputValue.value = JSON.stringify(newWells)
}, { immediate: true })

// 监听单选按钮状态变化
watch(selectWellsEnabled, (enabled) => {
  if (!enabled) {
    // 禁用时，清空选择
  }
})

// 处理输入框内容变化
const handleWellsInputChange = () => {
  if (!selectWellsEnabled.value) return
  
  const input = wellsInputValue.value.trim()
  if (!input) {
    updateSelectedWells([])
    return
  }
  
  try {
    // 解析JSON数组格式的井号
    const parsedArray = JSON.parse(input)
    if (!Array.isArray(parsedArray)) {
      return
    }
    
    const wellNumbers = parsedArray
      .map(n => parseInt(n))
      .filter(n => !isNaN(n) && n >= 1 && n <= numberOfWells.value)
    
    // 去重并排序
    const uniqueWells = [...new Set(wellNumbers)].sort((a, b) => a - b)
    updateSelectedWells(uniqueWells)
  } catch (error) {
    // 如果JSON解析失败，不做任何操作
    console.warn('Invalid JSON format for wells input')
  }
}

const sendRequest = async () => {
  try {
    // 进行数据验证
    const validationErrors = validateData(
      numberOfWells.value,
      targetPoints.value,
      entryDirections.value,
      doglegPoints.value
    )
    
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
        wellNames.value,
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
      <!-- Select Wells -->
      <el-collapse-item title="Select Wells" name="select-wells">
        <div class="p-4 space-y-3">
          <div class="flex items-center space-x-3">
            <label class="inline-flex items-center">
              <input 
                type="checkbox" 
                v-model="selectWellsEnabled" 
                class="form-checkbox rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              >
              <span class="ml-2 text-sm">Select Wells:</span>
            </label>
            <input
              type="text"
              v-model="wellsInputValue"
              @blur="handleWellsInputChange"
              :disabled="!selectWellsEnabled"
              class="border rounded px-2 py-1 w-48 text-sm"
              :class="{ 'bg-gray-100 cursor-not-allowed': !selectWellsEnabled }"
            >
          </div>
          <div class="text-xs text-gray-500">
            Enter well numbers as JSON array (e.g. [1, 3, 5]). Selected wells will be highlighted in other pages.
          </div>
          <div v-if="selectedWells.length > 0" class="text-xs text-blue-600">
            Currently selected {{ selectedWells.length }} wells: {{ JSON.stringify(selectedWells) }}
          </div>
        </div>
      </el-collapse-item>

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
        title="Optimal Layout (K-Sites-N-Wells)"
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
        title="Optimal Site (1-Site-N-Wells)"
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