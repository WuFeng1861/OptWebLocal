<script setup lang="ts">
import { ref, inject } from 'vue'
import { useDoglegCalculation } from '../composables'

const numberOfWells = inject<Readonly<Ref<number>>>('numberOfWells')!
const doglegPoints = inject<Ref<Array<{
  dogleg: string;
  radius: string;
}>>>('doglegPoints')!
const selectedWells = inject<Ref<number[]>>('selectedWells', ref([]))

// 使用 composable
const {
  parseDoglegValues,
  parseRadiusValues,
  updateDoglegValue,
  updateRadiusValue
} = useDoglegCalculation()

// 检查井是否被选中
const isWellSelected = (wellIndex: number): boolean => {
  const wellNumber = wellIndex + 1
  return selectedWells.value.includes(wellNumber)
}

// 注入Select Wells启用状态
const selectWellsEnabled = inject<Ref<boolean>>('selectWellsEnabled', ref(false))

// 控制折叠面板的展开状态，默认全部展开
const activeNames = ref(['dogleg', 'radius'])
</script>

<template>
  <div class="max-h-[calc(100vh-500px)] overflow-y-auto">
    <h2 class="p-4 pb-0 text-lg font-serif mb-4 text-gray-800">Dogleg Severity and Corresponding Minimum Radius</h2>

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
              <tr v-for="(point, wellIndex) in doglegPoints" :key="wellIndex"
                  :class="{ 
                    'selected-well-row': isWellSelected(wellIndex) && !selectWellsEnabled,
                    'selected-well-row-orange': isWellSelected(wellIndex) && selectWellsEnabled
                  }">
                <td>{{ wellIndex + 1 }}</td>
                <td>
                  <input
                    type="text"
                    :value="parseDoglegValues(point.dogleg)[0]"
                    @input="updateDoglegValue(doglegPoints, wellIndex, 0, ($event.target as HTMLInputElement).value)"
                    class="w-full px-1.5 py-1 border rounded text-right"
                    placeholder="e.g.: 3.0"
                  >
                </td>
                <td>
                  <input
                    type="text"
                    :value="parseDoglegValues(point.dogleg)[1]"
                    @input="updateDoglegValue(doglegPoints, wellIndex, 1, ($event.target as HTMLInputElement).value)"
                    class="w-full px-1.5 py-1 border rounded text-right"
                    placeholder="e.g.: 3.0"
                  >
                </td>
                <td>
                  <input
                    type="text"
                    :value="parseDoglegValues(point.dogleg)[2]"
                    @input="updateDoglegValue(doglegPoints, wellIndex, 2, ($event.target as HTMLInputElement).value)"
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
              <tr v-for="(point, wellIndex) in doglegPoints" :key="wellIndex"
                  :class="{ 
                    'selected-well-row': isWellSelected(wellIndex) && !selectWellsEnabled,
                    'selected-well-row-orange': isWellSelected(wellIndex) && selectWellsEnabled
                  }">
                <td>{{ wellIndex + 1 }}</td>
                <td>
                  <input
                    type="text"
                    :value="parseRadiusValues(point.radius)[0]"
                    @input="updateRadiusValue(doglegPoints, wellIndex, 0, ($event.target as HTMLInputElement).value)"
                    class="w-full px-1.5 py-1 border rounded text-right"
                    placeholder="e.g.: 572.95"
                  >
                </td>
                <td>
                  <input
                    type="text"
                    :value="parseRadiusValues(point.radius)[1]"
                    @input="updateRadiusValue(doglegPoints, wellIndex, 1, ($event.target as HTMLInputElement).value)"
                    class="w-full px-1.5 py-1 border rounded text-right"
                    placeholder="e.g.: 572.95"
                  >
                </td>
                <td>
                  <input
                    type="text"
                    :value="parseRadiusValues(point.radius)[2]"
                    @input="updateRadiusValue(doglegPoints, wellIndex, 2, ($event.target as HTMLInputElement).value)"
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

/* 组件特定的样式可以在这里添加 */
</style>