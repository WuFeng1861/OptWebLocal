/**
 * 油田相关类型定义
 */

// Kickoff点类型
export interface KickoffPoint {
  pkx: number | null
  pky: number | null
  pkz: number
}

// Kickoff方向类型
export interface KickoffDirection {
  vkx: number | null
  vky: number | null
  vkz: number
}

// Dogleg点类型
export interface DoglegPoint {
  dogleg: string
  radius: string
}

// Surface表面类型
export interface Surface {
  depth: number
  inclination: string
  selectedWells: number[]
  areaFormula: string
  displayArea: boolean
  setIntermediatePoint: boolean
}

// 其他约束状态类型
export interface OtherConstraintsState {
  // Drill Site Location 配置
  drillSite: {
    mode: 'unify' | 'specify'
    unify: {
      enabled: boolean
      formula: string
    }
    specify: Array<{ wellNo: number; formula: string }>
  }
  
  // Max Turn Angle 配置
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
  
  // Layers 配置
  layers: {
    mode: 'unify' | 'specify'
    unify: {
      numberOfSurfaces: number
    }
    specify: Array<{ wellNo: number; formula: string }>
  }
}