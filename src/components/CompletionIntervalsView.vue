<script setup lang="ts">
import { inject, Ref, ref, watch } from 'vue'

const numberOfWells = inject<Readonly<Ref<number>>>('numberOfWells')!
const targetPoints = inject<Ref<Array<{x: string, y: string, z: string}>>>('targetPoints')!
const entryDirections = inject<Ref<Array<{x: string, y: string, z: string}>>>('entryDirections')!
const updateNumberOfWells = inject<(value: number) => void>('updateNumberOfWells')!
const selectedWells = inject<Ref<number[]>>('selectedWells', ref([]))
const isWellSelected = inject<(wellIndex: number) => boolean>('isWellSelected', (wellIndex: number) => false)

// 控制折叠面板的展开状态，默认全部展开
const activeNames = ref(['wells', 'target', 'entry'])

// 临时存储输入值
const tempWellsCount = ref(numberOfWells.value.toString())

// 监听 numberOfWells 变化，同步到临时值
watch(numberOfWells, (newValue) => {
  tempWellsCount.value = newValue.toString()
})

// 注入Select Wells启用状态
const selectWellsEnabled = inject<Ref<boolean>>('selectWellsEnabled', ref(false))
const formatToTwoDecimals = (obj: any, key: string) => {
  const value = parseFloat(obj[key])
  if (!isNaN(value)) {
    // 使用Math.floor保留最多2位小数
    const multiplied = value * 100
    const floored = Math.floor(multiplied) / 100
    obj[key] = floored.toString()
  }
}

// 处理井数量输入
const handleWellsInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  // 只允许数字输入
  const value = input.value.replace(/[^0-9]/g, '')
  tempWellsCount.value = value
  input.value = value
}

// 确认井数量修改
const confirmWellsChange = () => {
  const numValue = tempWellsCount.value ? Math.max(1, parseInt(tempWellsCount.value)) : 1
  tempWellsCount.value = numValue.toString()
  updateNumberOfWells(numValue)
}

// 处理按键事件
const handleWellsKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    confirmWellsChange()
    const input = e.target as HTMLInputElement
    input.blur() // 失去焦点
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
                v-model="tempWellsCount"
                @input="handleWellsInput"
                @blur="confirmWellsChange"
                @keydown="handleWellsKeydown"
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
            <tr
              v-for="(point, index) in targetPoints"
              :key="index"
              :class="{
                'selected-well-row': isWellSelected(index) && !selectWellsEnabled,
                'selected-well-row-orange': isWellSelected(index) && selectWellsEnabled
              }"
            >
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
            <tr
              v-for="(direction, index) in entryDirections"
              :key="index"
              :class="{
                'selected-well-row': isWellSelected(index) && !selectWellsEnabled,
                'selected-well-row-orange': isWellSelected(index) && selectWellsEnabled
              }"
            >
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

/* 组件特定的样式可以在这里添加 */
</style>
