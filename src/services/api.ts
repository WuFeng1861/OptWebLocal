import request from './request'
import type { 
  Point, 
  KickoffPoint, 
  KickoffDirection, 
  DoglegPoint, 
  ComputeState, 
  OtherConstraintsState 
} from '../types'

// 构建 necon 约束数据
function buildNeconConstraints(
  numberOfWells: number,
  otherConstraints: OtherConstraintsState
): string[][] | null {
  const constraints: string[][] = []
  
  // 角度转换函数：将角度转换为 角度/180*pi 的格式
  const convertAngleToPi = (angle: number): string => {
    if (angle === 0) return '0'
    return `${angle}/180*pi`
  }
  
  // 为每个井构建约束数组
  for (let wellIndex = 0; wellIndex < numberOfWells; wellIndex++) {
    const wellConstraints: string[] = []
    
    // 处理 Max Turn Angle 约束
    if (otherConstraints.maxTurnAngle.mode === 'unify') {
      // Unify 模式：所有井使用相同的约束
      const { firstCurve, secondCurve } = otherConstraints.maxTurnAngle.unify
      
      if (otherConstraints.maxTurnAngle.unify.firstCurve.enabled && 
          otherConstraints.maxTurnAngle.unify.firstCurve.angle.toString().trim() !== '') {
        const angle = parseFloat(otherConstraints.maxTurnAngle.unify.firstCurve.angle)
        if (!isNaN(angle)) {
          wellConstraints.push(`-theta1+${convertAngleToPi(angle)}`)
        }
      }
      
      if (otherConstraints.maxTurnAngle.unify.secondCurve.enabled && 
          otherConstraints.maxTurnAngle.unify.secondCurve.angle.toString().trim() !== '') {
        const angle = parseFloat(otherConstraints.maxTurnAngle.unify.secondCurve.angle)
        if (!isNaN(angle)) {
          wellConstraints.push(`-theta2+${convertAngleToPi(angle)}`)
        }
      }
      
      if (otherConstraints.maxTurnAngle.unify.customFunction.enabled && 
          otherConstraints.maxTurnAngle.unify.customFunction.formula.trim() !== '') {
        wellConstraints.push(otherConstraints.maxTurnAngle.unify.customFunction.formula.trim())
      }
    } else {
      // Specify 模式：每个井使用独立的约束
      const angleConstraint = otherConstraints.maxTurnAngle.specify.angles[wellIndex]
      if (angleConstraint) {
        if (angleConstraint.firstCurve.toString().trim() !== '') {
          const angle = parseFloat(angleConstraint.firstCurve)
          if (!isNaN(angle)) {
            wellConstraints.push(`-theta1+${convertAngleToPi(angle)}`)
          }
        }
        
        if (angleConstraint.secondCurve.toString().trim() !== '') {
          const angle = parseFloat(angleConstraint.secondCurve)
          if (!isNaN(angle)) {
            wellConstraints.push(`-theta2+${convertAngleToPi(angle)}`)
          }
        }
      }
      
      const customConstraint = otherConstraints.maxTurnAngle.specify.customFunctions[wellIndex]
      if (customConstraint && customConstraint.customFunction.trim() !== '') {
        wellConstraints.push(customConstraint.customFunction.trim())
      }
    }
    
    // 处理 Drill Site Location 约束
    if (otherConstraints.drillSite.mode === 'unify') {
      // Unify 模式：所有井使用相同的约束
      if (otherConstraints.drillSite.unify.enabled && 
          otherConstraints.drillSite.unify.formula.trim() !== '') {
        wellConstraints.push(` ${otherConstraints.drillSite.unify.formula.trim()}`)
      }
    } else {
      // Specify 模式：每个井使用独立的约束
      const drillSiteConstraint = otherConstraints.drillSite.specify[wellIndex]
      if (drillSiteConstraint && drillSiteConstraint.formula.trim() !== '') {
        wellConstraints.push(` ${drillSiteConstraint.formula.trim()}`)
      }
    }
    
    // 如果该井有约束，则添加到总约束数组中
    if (wellConstraints.length > 0) {
      constraints.push(wellConstraints)
    } else {
      // 如果没有约束，添加空数组或跳过
      constraints.push([])
    }
  }
  
  // 如果所有井都没有约束，返回 null
  const hasAnyConstraints = constraints.some(wellConstraints => wellConstraints.length > 0)
  return hasAnyConstraints ? constraints : null
}

export function buildRequestData(
  numberOfWells: number,
  wellNames: string[],
  targetPoints: Point[],
  entryDirections: Point[],
  kickoffPoints: KickoffPoint[],
  kickoffDirections: KickoffDirection[],
  doglegPoints: DoglegPoint[],
  computeState: ComputeState,
  otherConstraints: OtherConstraintsState
) {
  const wellIndices = computeState.clusterSizes.map((item) => item.size);
  
  // 构建 necon 约束数据
  const neconConstraints = buildNeconConstraints(numberOfWells, otherConstraints)
  
  return {
    "FIELDOPT INPUT BLOCK": {
      "n": {
        "DESCRIPTION": "number of wells",
        "UNIT": "",
        "VALUE": numberOfWells
      },
      "tag": {
        "DESCRIPTION": "well tag",
        "UNIT": "",
        "VALUE": wellNames
      },
      "WellNo": {
        "DESCRIPTION": "well index",
        "UNIT": "",
        "VALUE": wellIndices
      },
      "PCM": {
        "DESCRIPTION": "target location, i.e., the 1st point of completion interval. 3D, [EAST,NORTH,Depth]",
        "UNIT": "m",
        "VALUE": targetPoints.map(point => [
          parseFloat(point.x) || 0,
          parseFloat(point.y) || 0,
          parseFloat(point.z) || 0
        ])
      },
      "VCM": {
        "DESCRIPTION": "driling direction at the target, 3D, [EAST,NORTH,Depth]",
        "UNIT": "m",
        "VALUE": entryDirections.map(dir => [
          parseFloat(dir.x) || 0,
          parseFloat(dir.y) || 0,
          parseFloat(dir.z) || 0
        ])
      },
      "PKzM": {
        "DESCRIPTION": "kickoff depth, [Depth]",
        "UNIT": "m",
        "VALUE": kickoffPoints.map(point => [point.pkz])
      },
      "MD_intervalM": {
        "DESCRIPTION": "measured depth interval in output data of well trajectory",
        "UNIT": "m",
        "VALUE": [
          [
            30.0
          ],
          [
            100.0
          ],
          [NaN
          ],
          [NaN
          ]
        ]
      },
      "VKM": {
        "DESCRIPTION": "driling direction at the KOP, 3D, [EAST,NORTH,Depth]",
        "UNIT": "m",
        "VALUE": kickoffDirections.map(dir => [dir.vkx, dir.vky, dir.vkz])
      },
      "DLSM": {
        "DESCRIPTION": "dogleg severity, [Depth]",
        "UNIT": "deg/30m",
        "VALUE": doglegPoints.map(point => {
          // 解析dogleg字符串，支持1-3个数值
          const values = point.dogleg.toString().split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
          return values.length > 0 ? values : [3] // 默认值为3
        })
      },
      "rM": {
        "DESCRIPTION": "turning radius",
        "UNIT": "m",
        "VALUE": doglegPoints.map(point => {
          // 解析radius字符串，支持单个数字或数组格式
          if (typeof point.radius === 'string') {
            // 检查是否包含逗号（数组格式）
            if (point.radius.includes(',')) {
              // 处理数组格式：如 "572.95,381.97,286.48"
              const values = point.radius.toString().split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v))
              return values.length > 0 ? values : [572.95] // 默认值为572.95
            } else {
              // 处理单个数字格式
              const value = parseFloat(point.radius)
              return !isNaN(value) ? [value] : [572.95] // 默认值为572.95
            }
          }
          return [572.95] // 默认值
        })
      },
      "XRange": {
        "DESCRIPTION": "X(East) range for computing",
        "UNIT": "m",
        "VALUE": JSON.parse(computeState.ranges.x.value || '[0, 0]')
      },
      "YRange": {
        "DESCRIPTION": "Y(North) range for computing",
        "UNIT": "m",
        "VALUE": JSON.parse(computeState.ranges.y.value || '[0, 0]')
      },
      "resolution": {
        "DESCRIPTION": "resolution for computing nodes",
        "UNIT": "m",
        "VALUE": parseFloat(computeState.ranges.resolution.value) || 200
      },
      "cst_radiusM": {
        "DESCRIPTION": "radius for computing cost contour",
        "UNIT": "m",
        "VALUE": Array(numberOfWells).fill(parseFloat(computeState.ranges.radius.value) || 3000)
      },
      "PKM": {
        "DESCRIPTION": "kickoff point, [East, North, Depth]",
        "UNIT": "m",
        "VALUE": kickoffPoints.map(point => [point.pkx, point.pky, point.pkz])
      },
      "necon": {
        "DESCRIPTION": "non-equal constraints",
        "UNIT": "",
        "VALUE": neconConstraints
      },
      "lay_con": {
        "DESCRIPTION": "formation constraints in special layer(s)",
        "UNIT": "",
        "VALUE": null
      }, 
      "cst_Site": {
        "DESCRIPTION": "drill site preparation cost",
        "UNIT": "",
        "VALUE": computeState.sitePreparationCost
      },
      "slot": {
        "DESCRIPTION": "available slot numbers in one cluster",
        "UNIT": "",
        "VALUE": computeState.clusterSizes.map(item => item.size).reverse()
      },
      "cst_WH": {
        "DESCRIPTION": "cost of subsea wellhead equipment of different slots, corresponding with slot",
        "UNIT": "",
        "VALUE": computeState.clusterSizes.map(item => item.cost).reverse()
      },
      "cluster_min": {
        "DESCRIPTION": "minimum number of clusters(drill sites)",
        "UNIT": "",
        "VALUE": computeState.cluster_min
      },
      "cluster_max": {
        "DESCRIPTION": "maximum number of clusters(drill sites)",
        "UNIT": "",
        "VALUE": computeState.cluster_max
      }
    }
  }
}

export async function sendComputeRequest(requestData: any) {
  try {
    const response = await request.post('/get_1site', requestData)
    return response;
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
  console.log(JSON.stringify(requestData));
}