<script setup lang="ts">
import { inject, ref } from 'vue'
import { ElMessage } from 'element-plus'

const numberOfWells = inject<Readonly<Ref<number>>>('numberOfWells')!
const targetPoints = inject<Ref<Array<{x: string, y: string, z: string}>>>('targetPoints')!
const entryDirections = inject<Ref<Array<{x: string, y: string, z: string}>>>('entryDirections')!
const updateNumberOfWells = inject<(value: number) => void>('updateNumberOfWells')!

// 控制折叠面板的展开状态，默认全部展开
const activeNames = ref(['wells', 'target', 'entry'])

// 格式化为两位小数的函数
const formatToTwoDecimals = (obj: any, key: string) => {
  const value = parseFloat(obj[key])
  if (!isNaN(value)) {
    obj[key] = value.toFixed(2)
  } else if (obj[key] !== '' && obj[key] !== '0') {
    ElMessage({
      message: `Invalid coordinate value: ${obj[key]}, please enter a valid number`,
      type: 'error',
      showClose: true,
      duration: 3000
    })
    obj[key] = '0.00'
  }
}

const handleNumberOfWellsInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const value = input.value.replace(/[^0-9]/g, '')
  const numValue = value ? Math.max(1, parseInt(value)) : 1
  
  if (numValue < 1 || numValue > 100) {
    ElMessage({
      message: 'Number of wells must be between 1 and 100',
      type: 'error',
      showClose: true,
      duration: 3000
    })
    updateNumberOfWells(Math.min(100, Math.max(1, numValue)))
  } else {
    updateNumberOfWells(numValue)
  }
}
</script>

<template>
  <div class="pb-6 max-h-[calc(100vh-500px)] overflow-y-auto">
    <el-collapse v-model="activeNames" class="custom-collapse">
      <!-- Well Count Settings -->
      <el-collapse-item title="Number of Wells" name="wells">
          <div class="flex items-center space-x-2 p-4">
            <label class="text-sm">Number of Wells:</label>
            <input
                type="number"
                min="1"
                :value="numberOfWells"
                @input="handleNumberOfWellsInput"
                class="border rounded px-2 py-1 w-16 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            >
          </div>
      </el-collapse-item>

      <el-collapse-item title="Target Points (PT)" name="target">
        <div class="table-scroll-container">
          <table class="data-table">
            <thead>
            <tr>
              <th>#</th>
              <th>P2x</th>
              <th>P2y</th>
              <th>P2z</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(point, index) in targetPoints" :key="index">
              <td>{{ index + 1 }}</td>
              <td>
                <input
                    type="number"
                    step="0.01"
                    v-model="point.x"
                    @blur="formatToTwoDecimals(point, 'x')"
                >
              </td>
              <td>
                <input
                    type="number"
                    step="0.01"
                    v-model="point.y"
                    @blur="formatToTwoDecimals(point, 'y')"
                >
              </td>
              <td>
                <input
                    type="number"
                    step="0.01"
                    v-model="point.z"
                    @blur="formatToTwoDecimals(point, 'z')"
                >
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </el-collapse-item>

      <el-collapse-item title="Entry Directions (VT)" name="entry">
        <div class="table-scroll-container">
          <table class="data-table">
            <thead>
            <tr>
              <th>#</th>
              <th>V2x</th>
              <th>V2y</th>
              <th>V2z</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(direction, index) in entryDirections" :key="index">
              <td>{{ index + 1 }}</td>
              <td>
                <input
                    type="number"
                    step="0.01"
                    v-model="direction.x"
                    @blur="formatToTwoDecimals(direction, 'x')"
                >
              </td>
              <td>
                <input
                    type="number"
                    step="0.01"
                    v-model="direction.y"
                    @blur="formatToTwoDecimals(direction, 'y')"
                >
              </td>
              <td>
                <input
                    type="number"
                    step="0.01"
                    v-model="direction.z"
                    @blur="formatToTwoDecimals(direction, 'z')"
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