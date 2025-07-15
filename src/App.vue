<script setup lang="ts">
import { ref, provide, readonly, watch } from 'vue'
import type { 
  Point, 
  CustomFunction, 
  KickoffPoint, 
  KickoffDirection, 
  DoglegPoint, 
  Surface, 
  ComputeState, 
  OtherConstraintsState 
} from './types'
import ConfigurationPanel from './components/ConfigurationPanel.vue'
import OilfieldLayoutTree from './components/OilfieldLayoutTree.vue'
// import VisualizationPanel from './components/VisualizationPanel.vue'


const activeTab = ref('completion-intervals')
const numberOfWells = ref(1)
const targetPoints = ref<Point[]>([{ x: '', y: '', z: '' }])
const entryDirections = ref<Point[]>([{ x: '', y: '', z: '' }])
const wellNames = ref<string[]>(['Well No1'])

// 选中的井编号数组
const selectedWells = ref<number[]>([])
const selectWellsEnabled = ref(false)

// Kickoff state
const kickoffPoints = ref<KickoffPoint[]>([{
  pkx: null,
  pky: null,
  pkz: -500.00
}])

const kickoffDirections = ref<KickoffDirection[]>([{
  vkx: 0,
  vky: 0,
  vkz: -1.00
}])

const surfaces = ref<Surface[]>([{
  depth: -1000,
  inclination: '',
  selectedWells: [-1],
  areaFormula: '',
  displayArea: false,
  setIntermediatePoint: false
}])

const activeSurfaceIndex = ref(0)

// Dogleg state
const doglegPoints = ref<DoglegPoint[]>([{
  dogleg: '3,3,3',
  radius: '572.95,572.95,572.95'
}])

// Other Constraints state
const otherConstraints = ref<OtherConstraintsState>({
  drillSite: {
    mode: 'unify',
    unify: {
      enabled: false,
      formula: ''
    },
    specify: []
  },
  maxTurnAngle: {
    mode: 'unify',
    unify: {
      firstCurve: {
        enabled: false,
        angle: ''
      },
      secondCurve: {
        enabled: false,
        angle: ''
      },
      customFunction: {
        enabled: false,
        formula: ''
      }
    },
    specify: {
      angles: [],
      customFunctions: []
    }
  },
  layers: {
    mode: 'unify',
    unify: {
      numberOfSurfaces: 0
    },
    specify: []
  }
})

// Compute state
const computeState = ref<ComputeState>({
  problemType: '1-Site-N-Wells',
  cluster_min: 10,
  cluster_max: 10,
  sitePreparationCost: 300,
  numberOfClusterSizes: 4,
  clusterSizes: [
    { size: 1.00, cost: 20.00 },
    { size: 2.00, cost: 30.00 },
    { size: 3.00, cost: 50.00 },
    { size: 4.00, cost: 50.00 }
  ],
  economicZoneThreshold: 20,
  parallelComputing: false,
  threadCount: 11,
  designatePosition: false,
  ranges: {
    x: { mode: 'Auto', value: '' },
    y: { mode: 'Auto', value: '' },
    radius: { mode: 'Auto', value: '3000' },
    resolution: { mode: 'Auto', value: '200' },
    initialGuess: { mode: 'Auto', value: '[0, 0]' }
  }
})

const selectedObjective = ref('Minimum Length')
const objectiveType = ref('unify')
const formula = ref('Ls + Lc')
const customFunctions = ref<CustomFunction[]>([{ formula: '(1+sin(theta))*Ls+2*Lc' }])

provide('activeTab', activeTab)
provide('numberOfWells', readonly(numberOfWells))
provide('updateNumberOfWells', (value: number) => {
  numberOfWells.value = value

  // Update well names array
  while (wellNames.value.length < value) {
    wellNames.value.push(`Well No${wellNames.value.length + 1}`)
  }
  while (wellNames.value.length > value) {
    wellNames.value.pop()
  }

  // Update well names array
  while (wellNames.value.length < value) {
    wellNames.value.push(`Well No${wellNames.value.length + 1}`)
  }
  while (wellNames.value.length > value) {
    wellNames.value.pop()
  }


  // Update arrays when number of wells changes
  while (targetPoints.value.length < value) {
    targetPoints.value.push({ x: '', y: '', z: '' })
  }
  while (targetPoints.value.length > value) {
    targetPoints.value.pop()
  }

  while (entryDirections.value.length < value) {
    entryDirections.value.push({ x: '', y: '', z: '' })
  }
  while (entryDirections.value.length > value) {
    entryDirections.value.pop()
  }

  // Update custom functions array
  while (customFunctions.value.length < value) {
    customFunctions.value.push({ formula: '(1+sin(theta))*Ls+2*Lc' })
  }
  while (customFunctions.value.length > value) {
    customFunctions.value.pop()
  }

  // Update kickoff points
  while (kickoffPoints.value.length < value) {
    kickoffPoints.value.push({
      pkx: null,
      pky: null,
      pkz: -500.00
    })
  }
  while (kickoffPoints.value.length > value) {
    kickoffPoints.value.pop()
  }

  // Update kickoff directions
  while (kickoffDirections.value.length < value) {
    kickoffDirections.value.push({
      vkx: 0,
      vky: 0,
      vkz: -1.00
    })
  }
  while (kickoffDirections.value.length > value) {
    kickoffDirections.value.pop()
  }

  // Update dogleg points
  while (doglegPoints.value.length < value) {
    doglegPoints.value.push({
      dogleg: "3,3,3",
      radius: '572.95,572.95,572.95'
    })
  }
  while (doglegPoints.value.length > value) {
    doglegPoints.value.pop()
  }
})

provide('wellNames', wellNames)
provide('updateWellName', (index: number, newName: string) => {
  if (index >= 0 && index < wellNames.value.length) {
    wellNames.value[index] = newName
  }
})
provide('targetPoints', targetPoints)
provide('entryDirections', entryDirections)
provide('selectedObjective', selectedObjective)
provide('objectiveType', objectiveType)
provide('formula', formula)
provide('customFunctions', customFunctions)
provide('kickoffPoints', kickoffPoints)
provide('kickoffDirections', kickoffDirections)
provide('doglegPoints', doglegPoints)
provide('otherConstraints', otherConstraints)
provide('surfaces', surfaces)
provide('activeSurfaceIndex', activeSurfaceIndex)
provide('computeState', computeState)
provide('selectedWells', selectedWells)
provide('updateSelectedWells', (wells: number[]) => {
  console.log(wells);
  selectedWells.value = wells
})
provide('selectWellsEnabled', selectWellsEnabled)

// Reset formula when switching objectives
watch(selectedObjective, (newValue) => {
  if (newValue === 'Minimum Length') {
    formula.value = 'Ls + Lc'
    objectiveType.value = 'unify'
  }
})

// 处理打开文件
const handleOpenFile = async () => {
  try {
    let content = await window.ipcRenderer.openFile()
    // 将NaN替换成null
    content = content.replace(/NaN/g, 'null')
    if (content) {
      const data = JSON.parse(content)
      const fieldOptBlock = data['FIELDOPT INPUT BLOCK']
      console.log(fieldOptBlock);
      if (!fieldOptBlock) {
        throw new Error('Invalid file format')
      }

      // 更新 numberOfWells
      numberOfWells.value = fieldOptBlock.n.VALUE

      // 更新 tag -> wellNames
      let wellNamesTemp = Array.from({length:fieldOptBlock.n.VALUE}, (_, _i) => `Well No${_i}`);
      if(fieldOptBlock.tag.value.length === fieldOptBlock.n.VALUE) {
        wellNamesTemp = fieldOptBlock.tag.value.map((it,_i) => {
          return !it ? `Well No${_i+1}`: it;
        })
      }
      wellNames.value === wellNamesTemp;
      
      // 更新 targetPoints
      targetPoints.value = fieldOptBlock.PCM.VALUE.map((point: number[]) => ({
        x: point[0].toString(),
        y: point[1].toString(),
        z: point[2].toString()
      }))

      // 更新 entryDirections
      entryDirections.value = fieldOptBlock.VCM.VALUE.map((dir: number[]) => ({
        x: dir[0].toString(),
        y: dir[1].toString(),
        z: dir[2].toString()
      }))

      // 更新 kickoffPoints - 从PKM获取完整的kickoff点信息
      kickoffPoints.value = fieldOptBlock.PKM.VALUE.map((point: (number | null)[]) => ({
        pkx: point[0],
        pky: point[1], 
        pkz: point[2]
      }))

      // 更新 kickoffDirections
      kickoffDirections.value = fieldOptBlock.VKM.VALUE.map((dir: number[]) => ({
        vkx: dir[0],
        vky: dir[1],
        vkz: dir[2]
      }))

      // 更新 doglegPoints - 处理DLSM和rM数组
      doglegPoints.value = fieldOptBlock.DLSM.VALUE.map((dogleg: number[], index: number) => {
        const radiusArray = fieldOptBlock.rM.VALUE[index]
        return {
          dogleg: dogleg.join(','),
          radius: Array.isArray(radiusArray) ? radiusArray.join(',') : radiusArray.toString()
        }
      })

      // 更新 computeState
      computeState.value = {
        ...computeState.value,
        problemType: '1-Site-N-Wells',
        cluster_min: fieldOptBlock.cluster_min.VALUE,
        cluster_max: fieldOptBlock.cluster_max.VALUE,
        sitePreparationCost: fieldOptBlock.cst_Site.VALUE,
        numberOfClusterSizes: fieldOptBlock.slot ? fieldOptBlock.slot.VALUE.length : 4,
        clusterSizes: fieldOptBlock.slot && fieldOptBlock.cst_WH ? 
          fieldOptBlock.slot.VALUE.map((size: number, index: number) => ({
            size,
            cost: fieldOptBlock.cst_WH.VALUE[index]
          })).reverse() : // 因为buildRequestData中是reverse的，所以这里也要reverse回来
          [
            { size: 1.00, cost: 20.00 },
            { size: 2.00, cost: 30.00 },
            { size: 3.00, cost: 50.00 },
            { size: 4.00, cost: 50.00 }
          ].reverse(),
        ranges: {
          x: {
            mode: Array.isArray(fieldOptBlock.XRange.VALUE) ? 'Manual' : 'Auto',
            value: Array.isArray(fieldOptBlock.XRange.VALUE) ? 
              JSON.stringify(fieldOptBlock.XRange.VALUE) : 
              (fieldOptBlock.XRange.VALUE === 'Auto' ? '' : fieldOptBlock.XRange.VALUE.toString())
          },
          y: {
            mode: Array.isArray(fieldOptBlock.YRange.VALUE) ? 'Manual' : 'Auto',
            value: Array.isArray(fieldOptBlock.YRange.VALUE) ? 
              JSON.stringify(fieldOptBlock.YRange.VALUE) : 
              (fieldOptBlock.YRange.VALUE === 'Auto' ? '' : fieldOptBlock.YRange.VALUE.toString())
          },
          radius: {
            mode: fieldOptBlock.cst_radiusM && Array.isArray(fieldOptBlock.cst_radiusM.VALUE) && 
                  fieldOptBlock.cst_radiusM.VALUE.length > 0 ? 'Manual' : 'Auto',
            value: fieldOptBlock.cst_radiusM && Array.isArray(fieldOptBlock.cst_radiusM.VALUE) && 
                   fieldOptBlock.cst_radiusM.VALUE.length > 0 ? 
                   fieldOptBlock.cst_radiusM.VALUE[0].toString() : '3000'
          },
          resolution: {
            mode: typeof fieldOptBlock.resolution.VALUE === 'number' ? 'Manual' : 'Auto',
            value: typeof fieldOptBlock.resolution.VALUE === 'number' ? 
                   fieldOptBlock.resolution.VALUE.toString() : '200'
          },
          initialGuess: { mode: 'Auto', value: '[0, 0]' }
        }
      }

      // 更新 otherConstraints - 从necon字段恢复约束信息
      if (fieldOptBlock.necon && fieldOptBlock.necon.VALUE) {
        const neconConstraints = fieldOptBlock.necon.VALUE
        
        // 重置约束状态
        otherConstraints.value = {
          drillSite: {
            mode: 'specify',
            unify: { enabled: false, formula: '' },
            specify: []
          },
          maxTurnAngle: {
            mode: 'specify',
            unify: {
              firstCurve: { enabled: false, angle: '' },
              secondCurve: { enabled: false, angle: '' },
              customFunction: { enabled: false, formula: '' }
            },
            specify: {
              angles: [],
              customFunctions: []
            }
          },
          layers: {
            mode: 'specify',
            unify: { numberOfSurfaces: 0 },
            specify: []
          }
        }

        // 初始化specify数组
        for (let i = 0; i < numberOfWells.value; i++) {
          otherConstraints.value.maxTurnAngle.specify.angles.push({
            wellNo: i + 1,
            firstCurve: '',
            secondCurve: ''
          })
          otherConstraints.value.maxTurnAngle.specify.customFunctions.push({
            wellNo: i + 1,
            customFunction: ''
          })
          otherConstraints.value.drillSite.specify.push({
            wellNo: i + 1,
            formula: ''
          })
        }

        // 解析每个井的约束信息
        for (let wellIndex = 0; wellIndex < neconConstraints.length; wellIndex++) {
          const wellConstraints = neconConstraints[wellIndex]
          if (wellConstraints && wellConstraints.length > 0) {
            for (const constraint of wellConstraints) {
              const constraintStr = constraint.trim()
              
              // 判断约束类型并分类处理
              if (constraintStr.includes('X') || constraintStr.includes('Y')) {
                // Drill Site Location 约束
                otherConstraints.value.drillSite.specify[wellIndex].formula = constraintStr
              } else if (constraintStr.includes('-theta1+') && !constraintStr.includes('-theta2+')) {
                // 只包含 -theta1 的约束 → 1st curve
                const match = constraintStr.match(/-theta1\+(\d+(?:\.\d+)?)(\/180\*pi)?/)
                if (match) {
                  otherConstraints.value.maxTurnAngle.specify.angles[wellIndex].firstCurve = match[1]
                }
              } else if (constraintStr.includes('-theta2+') && !constraintStr.includes('-theta1+')) {
                // 只包含 -theta2 的约束 → 2nd curve
                const match = constraintStr.match(/-theta2\+(\d+(?:\.\d+)?)(\/180\*pi)?/)
                if (match) {
                  otherConstraints.value.maxTurnAngle.specify.angles[wellIndex].secondCurve = match[1]
                }
              } else if (constraintStr.includes('theta1') || constraintStr.includes('theta2')) {
                // 包含两个角度或非负数theta的约束 → Custom Function
                otherConstraints.value.maxTurnAngle.specify.customFunctions[wellIndex].customFunction = constraintStr
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading file:', error)
  }
}
</script>

<template>
  <div class="h-screen bg-gray-50 flex flex-col overflow-hidden">
    <!-- 添加打开文件按钮 -->
    <div class="p-4 bg-white border-b">
      <button
          @click="handleOpenFile"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        打开文件
      </button>
    </div>

    <div class="flex-1 grid grid-cols-[250px,400px,1fr]">
            
      <!-- Oilfield Layout Tree - 新增的左侧树形组件 -->
      <OilfieldLayoutTree />
      
      <!-- Left Panel -->
      <ConfigurationPanel :number-of-wells="numberOfWells" />

      <!--&lt;!&ndash; Right Panel &ndash;&gt;-->
      <!--<VisualizationPanel />-->
    </div>
  </div>
</template>
