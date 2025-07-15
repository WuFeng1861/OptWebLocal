import { ref, computed, Ref } from 'vue'
import { watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { OilfieldTreeNode } from '../types'
import {eventBus} from "../utils"


// 油田配置类型
interface OilfieldConfig {
  id: string
  name: string
  wells: number[]
  wellNames: string[]
  sites: Array<{ id: number; wells: number[] }>
}

export function useOilfieldLayout(numberOfWells: Ref<number>, wellNames: Ref<string[]>) {
  // 油田数据配置
  const oilfieldConfig = ref<OilfieldConfig>({
    id: 'oil-field1',
    name: 'oil field1',
    wells: [0], // 初始化第一口井在ungrouped中
    sites: []
  })

  // 获取当前所有井的编号（包括ungrouped和各站点的）
  const getAllCurrentWells = (): number[] => {
    const allWells: number[] = [...oilfieldConfig.value.wells]
    oilfieldConfig.value.sites.forEach(site => {
      allWells.push(...site.wells)
    })
    return allWells.sort((a, b) => a - b)
  }

  // 监听井数量变化，更新油田数据
  watch(numberOfWells, (newWellCount) => {
    const currentWells = getAllCurrentWells()
    const currentWellCount = currentWells.length
    
    if (newWellCount > currentWellCount) {
      // 井数量增加：将新井添加到ungrouped中
      const newWells: number[] = []
      for (let i = currentWellCount; i < newWellCount; i++) {
        newWells.push(i)
      }
      oilfieldConfig.value.wells.push(...newWells)
      oilfieldConfig.value.wells.sort((a, b) => a - b)
    } else if (newWellCount < currentWellCount) {
      // 井数量减少：删除编号最大的井
      const wellsToRemove = currentWellCount - newWellCount
      
      for (let i = 0; i < wellsToRemove; i++) {
        const maxWellNumber = Math.max(...getAllCurrentWells())
        
        // 从ungrouped wells中移除
        const ungroupedIndex = oilfieldConfig.value.wells.indexOf(maxWellNumber)
        if (ungroupedIndex > -1) {
          oilfieldConfig.value.wells.splice(ungroupedIndex, 1)
        } else {
          // 从各站点中查找并移除
          for (const site of oilfieldConfig.value.sites) {
            const siteIndex = site.wells.indexOf(maxWellNumber)
            if (siteIndex > -1) {
              site.wells.splice(siteIndex, 1)
              break
            }
          }
        }
      }
    }
  }, { immediate: true })

  // 展开状态管理
  const expandedKeys = ref([
    'oilfield-layout',
    'oil-field1-ungrouped',
    'oil-field1-grouped'
  ])

  // 生成井节点
  const generateWells = (wellNumbers: number[], prefix: string): OilfieldTreeNode[] => {
    return wellNumbers.map(wellNumber => {
      const wellName = wellNames.value[wellNumber] || `Well No${wellNumber+1}`
      return {
      id: `${prefix}-well-${wellNumber}`,
      label: wellName,
      type: 'well' as const
      }
    })
  }

  // 生成树形数据
  const treeData = computed(() => {
    const field = oilfieldConfig.value
    
    // 生成未分组井
    const ungroupedWells = generateWells(field.wells, `${field.id}-ungrouped`)
    
    // 生成分组井（按站点）
    const groupedSites: OilfieldTreeNode[] = field.sites.map(site => {
      const siteWells = generateWells(site.wells, `${field.id}-site${site.id}`)
      
      return {
        id: `${field.id}-site${site.id}`,
        label: `Site NO${site.id}`,
        type: 'site' as const,
        wellCount: site.wells.length,
        children: siteWells
      }
    })

    // 计算分组井总数
    const groupedWellsCount = field.sites.reduce((sum, site) => sum + site.wells.length, 0)

    // 创建油田节点的子节点
    const oilfieldChildren = [
      {
        id: `${field.id}-ungrouped`,
        label: 'Ungrouped Wells',
        type: 'category' as const,
        wellCount: field.wells.length,
        children: ungroupedWells
      },
      {
        id: `${field.id}-grouped`,
        label: 'Grouped Wells',
        type: 'category' as const,
        wellCount: groupedWellsCount,
        children: groupedSites
      }
    ]

    // 返回包装在 oilfield-layout 下的结构
    return [
      {
        id: 'oilfield-layout',
        label: 'Oilfield Layout',
        type: 'oilfield' as const,
        children: oilfieldChildren
      }
    ]
  })

  // 解析井信息
  const parseWellInfo = (wellId: string) => {
    const parts = wellId.split('-')
    const fieldId = `${parts[0]}-${parts[1]}`
    const wellNumber = parseInt(parts[parts.length - 1])
    const isFromSite = parts[2].includes('site')
    const siteId = isFromSite ? parseInt(parts[2].replace('site', '')) : null
    
    return { fieldId, wellNumber, isFromSite, siteId }
  }

  // 移动井到新位置
  const moveWell = (
    wellNumber: number,
    fromSiteId: number | null,
    toSiteId: number | null,
    toUngrouped: boolean
  ) => {
    const field = oilfieldConfig.value
    let removeSuccess = false
    let addSuccess = false

    // 从原位置移除
    if (fromSiteId !== null) {
      const sourceSite = field.sites.find(s => s.id === fromSiteId)
      if (sourceSite) {
        const index = sourceSite.wells.indexOf(wellNumber)
        if (index > -1) {
          sourceSite.wells.splice(index, 1)
          removeSuccess = true
        }
      }
    } else {
      const index = field.wells.indexOf(wellNumber)
      if (index > -1) {
        field.wells.splice(index, 1)
        removeSuccess = true
      }
    }

    if (!removeSuccess) {
      throw new Error(`无法从原位置移除井 NO${wellNumber}`)
    }

    // 添加到目标位置
    if (toUngrouped) {
      field.wells.push(wellNumber)
      field.wells.sort((a, b) => a - b)
      addSuccess = true
    } else if (toSiteId !== null) {
      const targetSite = field.sites.find(s => s.id === toSiteId)
      if (!targetSite) {
        throw new Error(`目标站点 ${toSiteId} 不存在`)
      }
      targetSite.wells.push(wellNumber)
      targetSite.wells.sort((a, b) => a - b)
      addSuccess = true
    }

    // 排序所有站点的井
    field.sites.forEach(site => {
      site.wells.sort((a, b) => a - b)
    })
    if (addSuccess) {
      eventBus.emit('updateWellSite', {
        wellNumber,
        toUngrouped: toUngrouped,
        toSiteId: toSiteId
      })
    }
  }

  // 拖拽验证逻辑
  const allowDrag = (draggingNode: any): boolean => {
    return draggingNode.data.type === 'well'
  }

  const allowDrop = (draggingNode: any, dropNode: any, type: string): boolean => {
    const draggingData = draggingNode.data as OilfieldTreeNode
    const dropData = dropNode.data as OilfieldTreeNode
    
    if (draggingData.type !== 'well') return false
    
    if (type === 'inner') {
      return (dropData.type === 'category' && dropData.id.includes('ungrouped')) ||
             dropData.type === 'site'
    }
    
    if (type === 'before' || type === 'after') {
      return dropData.type === 'well'
    }
    
    return false
  }

  // 处理拖拽
  const handleNodeDrop = (draggingNode: any, dropNode: any, dropType: string, event: any) => {
    try {
      event.stopPropagation()
      
      if (!allowDrop(draggingNode, dropNode, dropType)) {
        ElMessage.warning('不允许的拖拽操作')
        return
      }

      const draggingData = draggingNode.data as OilfieldTreeNode
      const dropData = dropNode.data as OilfieldTreeNode
      
      const draggingWellInfo = parseWellInfo(draggingData.id)
      
      // 确定目标位置
      let targetIsUngrouped = false
      let targetSiteId: number | null = null
      
      if (dropType === 'inner') {
        if (dropData.type === 'category' && dropData.id.includes('ungrouped')) {
          targetIsUngrouped = true
        } else if (dropData.type === 'site') {
          const siteIdMatch = dropData.id.match(/site(\d+)/)
          targetSiteId = siteIdMatch ? parseInt(siteIdMatch[1]) : null
        }
      } else if (dropType === 'before' || dropType === 'after') {
        const targetWellInfo = parseWellInfo(dropData.id)
        targetIsUngrouped = !targetWellInfo.isFromSite
        targetSiteId = targetWellInfo.siteId
      }

      // 检查是否拖拽到同一位置
      if (draggingWellInfo.isFromSite === !targetIsUngrouped &&
          draggingWellInfo.siteId === targetSiteId) {
        ElMessage.info('井已在目标位置，无需移动')
        return
      }

      // 执行移动
      moveWell(
        draggingWellInfo.wellNumber,
        draggingWellInfo.siteId,
        targetSiteId,
        targetIsUngrouped
      )

      const targetLocation = targetIsUngrouped
        ? '未分组井'
        : `站点 NO${targetSiteId}`
      
      ElMessage.success(`井 NO${draggingWellInfo.wellNumber} 已移动到${targetLocation}`)

    } catch (error) {
      console.error('拖拽操作失败:', error)
      ElMessage.error(error instanceof Error ? error.message : '拖拽操作失败')
    }
  }

  // 节点展开/折叠处理
  const handleNodeExpand = (data: OilfieldTreeNode) => {
    if (!expandedKeys.value.includes(data.id)) {
      expandedKeys.value.push(data.id)
    }
  }

  const handleNodeCollapse = (data: OilfieldTreeNode) => {
    const index = expandedKeys.value.indexOf(data.id)
    if (index > -1) {
      expandedKeys.value.splice(index, 1)
    }
  }

  // 节点图标
  const renderIcon = (node: any) => {
    const data = node.data as OilfieldTreeNode
    switch (data.type) {
      case 'oilfield': return '🏭'
      case 'field': return '🛢️'
      case 'category': return data.id.includes('ungrouped') ? '📁' : '🏢'
      case 'site': return '🏗️'
      case 'well': return '⚡'
      default: return '📄'
    }
  }

  // 监听site分组
  eventBus.on("updateSiteData", (newSiteData: Number[][]) => {
    let sites = [];
    newSiteData.forEach((siteData, index) => {
      sites.push({
        id: index + 1,
        wells: siteData
      })
    })
    oilfieldConfig.value = {
      id: 'oil-field1',
      name: 'oil field1',
      wells: [],
      sites
    }
  })

  return {
    // 数据
    oilfieldConfig,
    treeData,
    expandedKeys,
    
    // 方法
    allowDrag,
    allowDrop,
    handleNodeDrop,
    handleNodeExpand,
    handleNodeCollapse,
    renderIcon,
  }
}
