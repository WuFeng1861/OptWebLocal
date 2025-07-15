/**
 * 树形组件相关类型定义
 */

// 树节点基础类型
export interface TreeNode {
  id: string
  label: string
  checked: boolean
  children?: TreeNode[]
  expanded?: boolean
}

// 油田布局树节点类型
export interface OilfieldTreeNode {
  id: string
  label: string
  children?: OilfieldTreeNode[]
  type: 'oilfield' | 'field' | 'category' | 'site' | 'well'
  wellCount?: number
}

// 树控制数据类型
export interface TreeData {
  id: string
  label: string
  children?: TreeData[]
}