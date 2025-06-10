<script setup lang="ts">
import { ref, inject, computed, watch } from 'vue'
import MultiSelect from './MultiSelect.vue'

interface Surface {
  depth: number;
  inclination: string;
  selectedWells: number[];
  areaFormula: string;
  displayArea: boolean;
  setIntermediatePoint: boolean;
}

const numberOfWells = inject<Readonly<Ref<number>>>('numberOfWells')!
const otherConstraints = inject<Ref<{
  drillSiteEnabled: boolean;
  drillSiteFormula: string;
  firstCurveEnabled: boolean;
  firstCurveAngle: number;
  firstCurveSelectedWells: number[];
  secondCurveEnabled: boolean;
  secondCurveAngle: number;
  secondCurveSelectedWells: number[];
  customFunctionEnabled: boolean;
  customFunctionFormula: string;
  numberOfSurfaces: number;
}>>('otherConstraints')!

// 控制折叠面板的展开状态
const activeNames = ref(['drill-site', 'max-turn-angle', 'layers'])

// 控制各部分的Unify/Specify模式
const drillSiteMode = ref('unify')
const maxTurnAngleMode = ref('unify')
const layersMode = ref('unify')

// Specify模式下的表格数据
const drillSiteSpecifyData = ref<Array<{ wellNo: number; formula: string }>>([])
const maxTurnAngleSpecifyData = ref<Array<{ wellNo: number; firstCurve: string; secondCurve: string }>>([])
const customFunctionSpecifyData = ref<Array<{ wellNo: number; customFunction: string }>>([])
const layersSpecifyData = ref<Array<{ wellNo: number; formula: string }>>([])

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

// 验证角度输入（0-180度）
const validateAngle = (value: string): string => {
  const num = parseFloat(value)
  if (isNaN(num)) return value
  
  // 限制在0-180范围内
  if (num < 0) return '0'
  if (num > 180) return '180'
  
  return value
}

// 处理角度输入
const handleAngleInput = (obj: any, key: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const validatedValue = validateAngle(target.value)
  obj[key] = validatedValue
  target.value = validatedValue
}

// 处理角度失焦验证
const handleAngleBlur = (obj: any, key: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.trim()
  
  if (value === '') {
    obj[key] = ''
    return
  }
  
  const num = parseFloat(value)
  
  // 如果不是有效数字或不在0-180范围内，则清空
  if (isNaN(num) || num < 0 || num > 180) {
    obj[key] = ''
    target.value = ''
  } else {
    // 如果是有效范围内的数字，保持原值
    obj[key] = value
  }
}

// 监听井数变化，更新Specify表格数据
watch(numberOfWells, (newValue) => {
  // 更新Drill Site Specify数据
  while (drillSiteSpecifyData.value.length < newValue) {
    drillSiteSpecifyData.value.push({
      wellNo: drillSiteSpecifyData.value.length + 1,
      formula: 'Y-1000'
    })
  }
  while (drillSiteSpecifyData.value.length > newValue) {
    drillSiteSpecifyData.value.pop()
  }

  // 更新Max Turn Angle Specify数据
  while (maxTurnAngleSpecifyData.value.length < newValue) {
    maxTurnAngleSpecifyData.value.push({
      wellNo: maxTurnAngleSpecifyData.value.length + 1,
      firstCurve: '90',
      secondCurve: '90'
    })
  }
  while (maxTurnAngleSpecifyData.value.length > newValue) {
    maxTurnAngleSpecifyData.value.pop()
  }

  // 更新Custom Function Specify数据
  while (customFunctionSpecifyData.value.length < newValue) {
    customFunctionSpecifyData.value.push({
      wellNo: customFunctionSpecifyData.value.length + 1,
      customFunction: 'theta1(2)-pi/2; theta2(3)-deg2rad(80)'
    })
  }
  while (customFunctionSpecifyData.value.length > newValue) {
    customFunctionSpecifyData.value.pop()
  }

  // 更新Layers Specify数据
  while (layersSpecifyData.value.length < newValue) {
    layersSpecifyData.value.push({
      wellNo: layersSpecifyData.value.length + 1,
      formula: ''
    })
  }
  while (layersSpecifyData.value.length > newValue) {
    layersSpecifyData.value.pop()
  }
}, { immediate: true })

// Watch for changes in numberOfSurfaces and update surfaces array
watch(() => otherConstraints.value.numberOfSurfaces, (newValue) => {
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
                v-model="drillSiteMode"
                value="unify"
                class="text-blue-600"
              >
              <span class="text-sm">Unify</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                v-model="drillSiteMode"
                value="specify"
                class="text-blue-600"
              >
              <span class="text-sm">Specify</span>
            </label>
          </div>

          <!-- Unify模式 -->
          <div v-if="drillSiteMode === 'unify'" class="space-y-3">
            <div class="flex items-center space-x-2">
              <input
                  type="checkbox"
                  v-model="otherConstraints.drillSiteEnabled"
                  class="rounded border-gray-300"
              >
              <span class="text-sm italic whitespace-nowrap">f(X,Y) =</span>
              <input
                  type="text"
                  v-model="otherConstraints.drillSiteFormula"
                  class="border rounded px-2 py-1 w-64 text-sm"
                  :disabled="!otherConstraints.drillSiteEnabled"
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
                  <tr v-for="(item, index) in drillSiteSpecifyData" :key="index">
                    <td>{{ item.wellNo }}</td>
                    <td>
                      <input
                        type="text"
                        v-model="item.formula"
                        placeholder="e.g. Y-1000"
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
                v-model="maxTurnAngleMode"
                value="unify"
                class="text-blue-600"
              >
              <span class="text-sm">Unify</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                v-model="maxTurnAngleMode"
                value="specify"
                class="text-blue-600"
              >
              <span class="text-sm">Specify</span>
            </label>
          </div>

          <!-- Unify模式 -->
          <div v-if="maxTurnAngleMode === 'unify'" class="space-y-4">
            <!-- First Curve -->
            <div class="space-y-2">
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                  <input
                      type="checkbox"
                      v-model="otherConstraints.firstCurveEnabled"
                      class="rounded border-gray-300"
                  >
                  <span class="text-sm">1st curve (buildup) <=</span>
                </div>
                <div class="flex items-center space-x-1">
                  <input
                      type="number"
                      v-model="otherConstraints.firstCurveAngle"
                      class="border rounded px-2 py-1 w-20 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      :disabled="!otherConstraints.firstCurveEnabled"
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
                      v-model="otherConstraints.secondCurveEnabled"
                      class="rounded border-gray-300"
                  >
                  <span class="text-sm">2nd curve (buildup/drop) <=</span>
                </div>
                <div class="flex items-center space-x-1">
                  <input
                      type="number"
                      v-model="otherConstraints.secondCurveAngle"
                      class="border rounded px-2 py-1 w-20 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      :disabled="!otherConstraints.secondCurveEnabled"
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
                    v-model="otherConstraints.customFunctionEnabled"
                    class="rounded border-gray-300"
                >
                <span class="text-sm">Custom Function f(theta1, theta2)≥0:</span>
              </div>
              <div class="ml-6 grid grid-cols-[auto,1fr] items-center gap-2">
                <span class="text-sm italic whitespace-nowrap">f(theta1, theta2) =</span>
                <input
                    type="text"
                    v-model="otherConstraints.customFunctionFormula"
                    class="border rounded px-2 py-1 text-sm"
                    :disabled="!otherConstraints.customFunctionEnabled"
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
                  <tr v-for="(item, index) in maxTurnAngleSpecifyData" :key="index">
                    <td>{{ item.wellNo }}</td>
                    <td>
                      <input
                        type="text"
                        v-model="item.firstCurve"
                        @input="handleAngleInput(item, 'firstCurve', $event)"
                       @blur="handleAngleBlur(item, 'firstCurve', $event)"
                        min="0"
                        max="180"
                        step="0.1"
                        placeholder="90"
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
                        placeholder="90"
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
                    <tr v-for="(item, index) in customFunctionSpecifyData" :key="index">
                      <td>{{ item.wellNo }}</td>
                      <td>
                        <input
                          type="text"
                          v-model="item.customFunction"
                          placeholder="theta1(2)-pi/2; theta2(3)-deg2rad(80)"
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
                v-model="layersMode"
                value="unify"
                class="text-blue-600"
              >
              <span class="text-sm">Unify</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                v-model="layersMode"
                value="specify"
                class="text-blue-600"
              >
              <span class="text-sm">Specify</span>
            </label>
          </div>

          <!-- Unify模式 -->
          <div v-if="layersMode === 'unify'" class="space-y-4">
            <!-- Number of Surfaces -->
            <div class="flex items-center space-x-3">
              <span class="text-sm">Number of Surfaces:</span>
              <input
                  type="number"
                  v-model="otherConstraints.numberOfSurfaces"
                  min="0"
                  class="border rounded px-2 py-1 w-20 text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              >
            </div>

            <!-- Surface Tabs -->
            <div v-if="otherConstraints.numberOfSurfaces > 0" class="border rounded">
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
                  <tr v-for="(item, index) in layersSpecifyData" :key="index">
                    <td>{{ item.wellNo }}</td>
                    <td>
                      <input
                        type="text"
                        v-model="item.formula"
                        placeholder="Layer constraint formula"
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
</style>