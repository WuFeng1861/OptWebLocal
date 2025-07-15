import { watch } from 'vue'
import type { OtherConstraintsState } from '../types'

export function useConstraints() {
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
      obj[key] = num
    }
  }

  // 监听井数变化，更新Specify表格数据
  const syncConstraintsWithWells = (
    numberOfWells: number,
    otherConstraints: OtherConstraintsState
  ) => {
    // 更新Drill Site Specify数据
    while (otherConstraints.drillSite.specify.length < numberOfWells) {
      otherConstraints.drillSite.specify.push({
        wellNo: otherConstraints.drillSite.specify.length + 1,
        formula: ''
      })
    }
    while (otherConstraints.drillSite.specify.length > numberOfWells) {
      otherConstraints.drillSite.specify.pop()
    }

    // 更新Max Turn Angle Specify数据
    while (otherConstraints.maxTurnAngle.specify.angles.length < numberOfWells) {
      otherConstraints.maxTurnAngle.specify.angles.push({
        wellNo: otherConstraints.maxTurnAngle.specify.angles.length + 1,
        firstCurve: '',
        secondCurve: ''
      })
    }
    while (otherConstraints.maxTurnAngle.specify.angles.length > numberOfWells) {
      otherConstraints.maxTurnAngle.specify.angles.pop()
    }

    // 更新Custom Function Specify数据
    while (otherConstraints.maxTurnAngle.specify.customFunctions.length < numberOfWells) {
      otherConstraints.maxTurnAngle.specify.customFunctions.push({
        wellNo: otherConstraints.maxTurnAngle.specify.customFunctions.length + 1,
        customFunction: ''
      })
    }
    while (otherConstraints.maxTurnAngle.specify.customFunctions.length > numberOfWells) {
      otherConstraints.maxTurnAngle.specify.customFunctions.pop()
    }

    // 更新Layers Specify数据
    while (otherConstraints.layers.specify.length < numberOfWells) {
      otherConstraints.layers.specify.push({
        wellNo: otherConstraints.layers.specify.length + 1,
        formula: ''
      })
    }
    while (otherConstraints.layers.specify.length > numberOfWells) {
      otherConstraints.layers.specify.pop()
    }
  }

  return {
    validateAngle,
    handleAngleInput,
    handleAngleBlur,
    syncConstraintsWithWells
  }
}