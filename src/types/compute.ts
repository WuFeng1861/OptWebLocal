/**
 * 计算相关类型定义
 */

// 计算状态类型
export interface ComputeState {
  problemType: string
  cluster_min: number
  cluster_max: number
  sitePreparationCost: number
  numberOfClusterSizes: number
  clusterSizes: Array<{ size: number; cost: number }>
  economicZoneThreshold: number
  parallelComputing: boolean
  threadCount: number
  designatePosition: boolean
  ranges: {
    x: { mode: 'Auto' | 'Manual'; value: string }
    y: { mode: 'Auto' | 'Manual'; value: string }
    radius: { mode: 'Auto' | 'Manual'; value: string }
    resolution: { mode: 'Auto' | 'Manual'; value: string }
    wellNo: { mode: 'All' | 'Manual'; value: string }
    initialGuess: { mode: 'Auto' | 'Manual'; value: string }
  }
}