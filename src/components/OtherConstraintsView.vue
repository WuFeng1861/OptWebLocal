<script setup lang="ts">
import { ref, inject, computed, watch } from 'vue'
import type { Surface } from '../types'
import MultiSelect from './MultiSelect.vue'
import { useConstraints } from '../composables'


const numberOfWells = inject<Readonly<Ref<number>>>('numberOfWells')!
const selectedWells = inject<Ref<number[]>>('selectedWells', ref([]))
const otherConstraints = inject<Ref<{
  drillSite: {
    mode: 'unify' | 'specify'
    unify: {
      enabled: boolean
      formula: string
    }
    specify: Array<{ wellNo: number; formula: string }>
  }
  maxTurnAngle: {
    mode: 'unify' | 'specify'
    unify: {
      firstCurve: {
        enabled: boolean
        angle: string
      }
      secondCurve: {
        enabled: boolean
        angle: string
      }
      customFunction: {
        enabled: boolean
        formula: string
      }
    }
    specify: {
      angles: Array<{ wellNo: number; firstCurve: string; secondCurve: string }>
      customFunctions: Array<{ wellNo: number; customFunction: string }>
    }
  }
  layers: {
    mode: 'unify' | 'specify'
    unify: {
      numberOfSurfaces: number
    }
    specify: Array<{ wellNo: number; formula: string }>
  }
}>>('otherConstraints')!

// 使用 composable
const {
  validateAngle,
  handleAngleInput,
  handleAngleBlur,
  syncConstraintsWithWells
} = useConstraints()

// 检查井是否被选中
const isWellSelected = (wellIndex: number): boolean => {
  const wellNumber = wellIndex + 1
  return selectedWells.value.includes(wellNumber)
}

// 注入Select Wells启用状态
const selectWellsEnabled = inject<Ref<boolean>>('selectWellsEnabled', ref(false))

// 控制折叠面板的展开状态
const activeNames = ref(['drill-site', 'max-turn-angle', 'layers'])

// 控制各部分的Unify/Specify模式
// 注意：模式控制现在直接使用 otherConstraints 中的 mode 属性

const surfaces = inject<Ref<Surface[]>>('surfaces')!
const activeSurfaceIndex = inject<Ref<number>>('activeSurfaceIndex')!

interface Well {
  id: number;
  label: string;
}

const wellOptions = computed(() => {
  const options: Well[] = [{ id: -1, label: 'All' }]
  for (let i = 0; i < numberOfWells.value; i++) {
    options.push({ id: i, label: i.toString() })
  }
  return options
})

// 监听井数变化，更新Specify表格数据
watch(numberOfWells, (newValue) => {
  syncConstraintsWithWells(newValue, otherConstraints.value)
}, { immediate: true })

// Watch for changes in numberOfSurfaces and update surfaces array
watch(() => otherConstraints.value.layers.unify.numberOfSurfaces, (newValue) => {
  while (surfaces.value.length < newValue) {
    surfaces.value.push({
      depth: -1000,
      inclination: '',
      selectedWells: [-1],
      areaFormula: '',
      displayArea: false,
      setIntermediatePoint: false
    })
  }
  while (surfaces.value.length > newValue) {
    surfaces.value.pop()
  }
})
</script>

<template>
  <div class="pb-6 max-h-[calc(100vh-500px)] overflow-y-auto">
    <el-collapse v-model="activeNames" class="custom-collapse">
      <!-- Drill Site Location -->
      <el-collapse-item title="Drill Site Location f(X,Y)≥0" name="drill-site">
        <div class="p-4 space-y-4">
          <!-- Unify/Specify 选择 -->
          <div class="flex space-x-8">
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                v-model="otherConstraints.drillSite.mode"
                value="unify"
                class="text-blue-600"
              >
              <span class="text-sm">Unify</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                v-model="otherConstraints.drillSite.mode"
                value="specify"
                class="text-blue-600"
              >
              <span class="text-sm">Specify</span>
            </label>
          </div>

          <!-- Unify模式 -->
          <div v-if="otherConstraints.drillSite.mode === 'unify'" class="space-y-3">
            <div class="flex items-center space-x-2">
              <input
                  type="checkbox"
                  v-model="otherConstraints.drillSite.unify.enabled"
                  class="rounded border-gray-300"
              >
              <span class="text-sm italic whitespace-nowrap">f(X,Y) =</span>
              <input
                  type="text"
                  v-model="otherConstraints.drillSite.unify.formula"
                  class="border rounded px-2 py-1 w-64 text-sm"
                  :disabled="!otherConstraints.drillSite.unify.enabled"
              >
            </div>
          </div>

          <!-- Specify模式 -->
          <div v-else class="space-y-1">
            <div class="table-scroll-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>f(X,Y)=</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in otherConstraints.drillSite.specify" :key="index"
                      :class="{ 
                        'selected-well-row': isWellSelected(index) && !selectWellsEnabled,
                        'selected-well-row-orange': isWellSelected(index) && selectWellsEnabled
                      }">
                    <td>{{ item.wellNo }}</td>
                    <td>
                      <input
                        type="text"
                        v-model="item.formula"
                        placeholder=""
                        class="w-full px-1.5 py-1 border rounded text-right"
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </el-collapse-item>

      <!-- Max Turn Angle -->
      <el-collapse-item title="Max Turn Angle" name="max-turn-angle">
        <div class="p-4 space-y-4">
          <!-- Unify/Specify 选择 -->
          <div class="flex space-x-8">
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                v-model="otherConstraints.maxTurnAngle.mode"
                value="unify"
                class="text-blue-600"
              >
              <span class="text-sm">Unify</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                v-model="otherConstraints.maxTurnAngle.mode"
                value="specify"
                class="text-blue-600"
              >
              <span class="text-sm">Specify</span>
            </label>
          </div>

          <!-- Unify模式 -->
          <div v-if="otherConstraints.maxTurnAngle.mode === 'unify'" class="space-y-4">
            <!-- First Curve -->
            <div class="space-y-2">
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                  <input
                      type="checkbox"
                      v-model="otherConstraints.maxTurnAngle.unify.firstCurve.enabled"
                      class="rounded border-gray-300"
                  >
                  <span class="text-sm">1st curve (buildup) <=</span>
                </div>
                <div class="flex items-center space-x-1">
                  <input
                      type="text"
                      v-model="otherConstraints.maxTurnAngle.unify.firstCurve.angle"
                      @input="handleAngleInput(otherConstraints.maxTurnAngle.unify.firstCurve, 'angle', $event)"
                      @blur="handleAngleBlur(otherConstraints.maxTurnAngle.unify.firstCurve, 'angle', $event)"
                      class="border rounded px-2 py-1 w-20 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      :disabled="!otherConstraints.maxTurnAngle.unify.firstCurve.enabled"
                      min="0"
                      max="180"
                      step="0.1"
                  >
                  <span class="text-sm">°</span>
                </div>
              </div>
            </div>

            <!-- Second Curve -->
            <div class="space-y-2">
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                  <input
                      type="checkbox"
                      v-model="otherConstraints.maxTurnAngle.unify.secondCurve.enabled"
                      class="rounded border-gray-300"
                  >
                  <span class="text-sm">2nd curve (buildup/drop) <=</span>
                </div>
                <div class="flex items-center space-x-1">
                  <input
                      type="text"
                      v-model="otherConstraints.maxTurnAngle.unify.secondCurve.angle"
                      @input="handleAngleInput(otherConstraints.maxTurnAngle.unify.secondCurve, 'angle', $event)"
                      @blur="handleAngleBlur(otherConstraints.maxTurnAngle.unify.secondCurve, 'angle', $event)"
                      class="border rounded px-2 py-1 w-20 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      :disabled="!otherConstraints.maxTurnAngle.unify.secondCurve.enabled"
                      min="0"
                      max="180"
                      step="0.1"
                  >
                  <span class="text-sm">°</span>
                </div>
              </div>
            </div>

            <!-- Custom Function in Unify mode -->
            <div class="space-y-3">
              <div class="flex items-center space-x-2">
                <input
                    type="checkbox"
                    v-model="otherConstraints.maxTurnAngle.unify.customFunction.enabled"
                    class="rounded border-gray-300"
                >
                <span class="text-sm">Custom Function f(theta1, theta2)≥0:</span>
              </div>
              <div class="ml-6 grid grid-cols-[auto,1fr] items-center gap-2">
                <span class="text-sm italic whitespace-nowrap">f(theta1, theta2) =</span>
                <input
                    type="text"
                    v-model="otherConstraints.maxTurnAngle.unify.customFunction.formula"
                    class="border rounded px-2 py-1 text-sm"
                    :disabled="!otherConstraints.maxTurnAngle.unify.customFunction.enabled"
                >
              </div>
            </div>
          </div>

          <!-- Specify模式 -->
          <div v-else class="space-y-3">
            <!-- Max Turn Angle表格 -->
            <div class="table-scroll-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>1st curve (°) <= </th>
                    <th>2nd curve (°) <= </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in otherConstraints.maxTurnAngle.specify.angles" :key="index">
                    <td :class="{ 
                      'selected-well-row': isWellSelected(index) && !selectWellsEnabled,
                      'selected-well-row-orange': isWellSelected(index) && selectWellsEnabled
                    }">{{ item.wellNo }}</td>
                    <td>
                      <input
                        type="text"
                        v-model="item.firstCurve"
                        @input="handleAngleInput(item, 'firstCurve', $event)"
                       @blur="handleAngleBlur(item, 'firstCurve', $event)"
                        min="0"
                        max="180"
                        step="0.1"
                        placeholder=""
                        :class="{ 
                          'selected-well-input': isWellSelected(index) && !selectWellsEnabled,
                          'selected-well-input-orange': isWellSelected(index) && selectWellsEnabled
                        }"
                      >
                    </td>
                    <td>
                      <input
                        type="text"
                        v-model="item.secondCurve"
                        @input="handleAngleInput(item, 'secondCurve', $event)"
                       @blur="handleAngleBlur(item, 'secondCurve', $event)"
                        min="0"
                        max="180"
                        step="0.1"
                        placeholder=""
                        :class="{ 
                          'selected-well-input': isWellSelected(index) && !selectWellsEnabled,
                          'selected-well-input-orange': isWellSelected(index) && selectWellsEnabled
                        }"
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Custom Function表格 -->
            <div class="mt-4">
              <h4 class="text-sm font-medium mb-2">Custom Function f(theta1, theta2)≥0</h4>
              <div class="table-scroll-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>f(theta1, theta2)=</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in otherConstraints.maxTurnAngle.specify.customFunctions" :key="index"
                        :class="{ 
                          'selected-well-row': isWellSelected(index) && !selectWellsEnabled,
                          'selected-well-row-orange': isWellSelected(index) && selectWellsEnabled
                        }">
                      <td>{{ item.wellNo }}</td>
                      <td>
                        <input
                          type="text"
                          v-model="item.customFunction"
                          placeholder=""
                          class="w-full px-1.5 py-1 border rounded text-right"
                        >
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </el-collapse-item>

      <!-- Layers -->
      <el-collapse-item title="Layers" name="layers">
        <div class="p-4 space-y-4">
          <!-- Unify/Specify 选择 -->
          <div class="flex space-x-8">
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                v-model="otherConstraints.layers.mode"
                value="unify"
                class="text-blue-600"
              >
              <span class="text-sm">Unify</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                v-model="otherConstraints.layers.mode"
                value="specify"
                class="text-blue-600"
              >
              <span class="text-sm">Specify</span>
            </label>
          </div>

          <!-- Unify模式 -->
          <div v-if="otherConstraints.layers.mode === 'unify'" class="space-y-4">
            <!-- Number of Surfaces -->
            <div class="flex items-center space-x-3">
              <span class="text-sm">Number of Surfaces:</span>
              <input
                  type="number"
                  v-model="otherConstraints.layers.unify.numberOfSurfaces"
                  min="0"
                  class="border rounded px-2 py-1 w-20 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              >
            </div>

            <!-- Surface Tabs -->
            <div v-if="otherConstraints.layers.unify.numberOfSurfaces > 0" class="border rounded">
              <!-- Tab Headers -->
              <div class="flex flex-wrap border-b">
                <button
                    v-for="(_, index) in surfaces"
                    :key="index"
                    class="px-4 py-2 text-sm border-r border-b last:border-r-0 hover:bg-gray-50"
                    :class="{ 'bg-gray-100': activeSurfaceIndex === index }"
                    @click="activeSurfaceIndex = index"
                >
                  S{{ index + 1 }}
                </button>
              </div>

              <!-- Surface Configuration -->
              <div class="p-4 space-y-4 overflow-y-auto max-h-[400px]">
                <!-- Surface Definition -->
                <div class="grid grid-cols-[auto,1fr] items-center gap-2">
                  <span class="text-sm whitespace-nowrap">Surface Definition:</span>
                  <div class="flex items-center space-x-2">
                    <select class="border rounded px-2 py-1 text-sm w-20">
                      <option>Depth</option>
                    </select>
                    <input
                        type="number"
                        v-model="surfaces[activeSurfaceIndex].depth"
                        class="border rounded px-2 py-1 w-20 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    >
                  </div>
                </div>

                <!-- Inclination -->
                <div class="space-y-2">
                  <div class="flex items-center space-x-2">
                    <span class="text-sm whitespace-nowrap">Inclination ≤</span>
                    <input
                        type="text"
                        v-model="surfaces[activeSurfaceIndex].inclination"
                        class="border rounded px-2 py-1 w-24 text-sm"
                    >
                    <span class="text-sm">°</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-sm whitespace-nowrap">Specify Wells</span>
                    <MultiSelect
                        v-model="surfaces[activeSurfaceIndex].selectedWells"
                        :options="wellOptions"
                        placeholder="Select wells"
                    />
                  </div>
                </div>

                <!-- Area Function -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm italic">Area f(X,Y) ≤ 0</span>
                    <label class="flex items-center space-x-2">
                      <input
                          type="checkbox"
                          v-model="surfaces[activeSurfaceIndex].displayArea"
                          class="rounded border-gray-300"
                      >
                      <span class="text-sm">DisplayArea</span>
                    </label>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-sm italic">f(X,Y) =</span>
                    <input
                        type="text"
                        v-model="surfaces[activeSurfaceIndex].areaFormula"
                        class="flex-1 border rounded px-2 py-1 text-sm"
                    >
                  </div>
                </div>

                <!-- Set Intermediate Point -->
                <div>
                  <label class="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        v-model="surfaces[activeSurfaceIndex].setIntermediatePoint"
                        class="rounded border-gray-300"
                    >
                    <span class="text-sm">Set intermediate point</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Specify模式 -->
          <div v-else class="space-y-3">
            <div class="table-scroll-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Layer Function</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in otherConstraints.layers.specify" :key="index"
                      :class="{ 
                        'selected-well-row': isWellSelected(index) && !selectWellsEnabled,
                        'selected-well-row-orange': isWellSelected(index) && selectWellsEnabled
                      }">
                    <td>{{ item.wellNo }}</td>
                    <td>
                      <input
                        type="text"
                        v-model="item.formula"
                        placeholder="Layer constraint formula"
                        class="w-full px-1.5 py-1 border rounded text-right"
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
@import '../styles/shared.css';

/* 组件特定的样式可以在这里添加 */
</style>