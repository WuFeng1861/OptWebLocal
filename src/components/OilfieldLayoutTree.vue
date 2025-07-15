<script setup lang="ts">
import { inject, type Ref, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useOilfieldLayout } from '../composables'

// 注入井数量
const numberOfWells = inject<Readonly<Ref<number>>>('numberOfWells', ref(1))
const wellNames = inject<Ref<string[]>>('wellNames', ref(['Well No1']))
const updateWellName = inject<(index: number, newName: string) => void>('updateWellName', () => {})
const selectedWells = inject<Ref<number[]>>('selectedWells', ref([]))
const updateSelectedWells = inject<(wells: number[]) => void>('updateSelectedWells', () => {})
const selectWellsEnabled = inject<Ref<boolean>>('selectWellsEnabled', ref(false))

// 使用 composable
const {
  treeData,
  expandedKeys,
  allowDrag,
  allowDrop,
  handleNodeDrop,
  handleNodeExpand,
  handleNodeCollapse,
  renderIcon
} = useOilfieldLayout(numberOfWells, wellNames)

// 树的属性配置
const defaultProps = {
  children: 'children',
  label: 'label'
}

// 节点点击事件
const handleNodeClick = (data: any) => {
  console.log('点击节点:', data)
  
  // 如果是井节点，处理选择逻辑
  if (data.type === 'well') {
    const wellIndex = parseWellIndex(data.id)
    const wellNumber = wellIndex + 1
    
    if (isMultiSelectMode.value) {
      // 多选模式：切换选中状态
      const currentSelected = [...selectedWells.value]
      const index = currentSelected.indexOf(wellNumber)
      
      if (index > -1) {
        // 已选中，取消选中
        currentSelected.splice(index, 1)
      } else {
        // 未选中，添加到选中列表
        currentSelected.push(wellNumber)
      }
      
      updateSelectedWells(currentSelected.sort((a, b) => a - b))
    } else {
      // 单选模式：只选中当前井
      updateSelectedWells([wellNumber])
    }
  }
}

// 编辑状态管理
const editingNodeId = ref<string | null>(null)
const editingValue = ref('')

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuNode = ref<any>(null)

// 多选状态
const isMultiSelectMode = ref(false)

// 解析井ID获取井索引
const parseWellIndex = (wellId: string): number => {
  const parts = wellId.split('-')
  const wellNumber = parseInt(parts[parts.length - 1])
  return wellNumber - 1 // 转换为数组索引
}

// 右键菜单事件
const handleNodeRightClick = (event: MouseEvent, data: any) => {
  // 只对井节点显示右键菜单
  if (data.type === 'well') {
    event.preventDefault()
    event.stopPropagation()
    
    contextMenuVisible.value = true
    contextMenuX.value = event.clientX
    contextMenuY.value = event.clientY
    contextMenuNode.value = data
  }
}

// 开始编辑
const startEdit = () => {
  if (contextMenuNode.value) {
    const nodeId = contextMenuNode.value.id
    const wellIndex = parseWellIndex(nodeId)
    
    editingNodeId.value = nodeId
    editingValue.value = wellNames.value[wellIndex] || ''
    
    // 使用 nextTick 确保DOM更新完成后再获取焦点
    nextTick(() => {
      const inputElement = document.querySelector('.node-edit-input') as HTMLInputElement
      if (inputElement) {
        inputElement.focus()
        inputElement.select()
      }
    })
  }
  hideContextMenu()
}

// 切换多选模式
const toggleMultiSelectMode = () => {
  isMultiSelectMode.value = !isMultiSelectMode.value
  if (!isMultiSelectMode.value) {
    // 退出多选模式时清空选择
    updateSelectedWells([])
  }
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectedWells.value.length === numberOfWells.value) {
    // 当前全选，取消全选
    updateSelectedWells([])
  } else {
    // 全选所有井
    const allWells = Array.from({ length: numberOfWells.value }, (_, i) => i + 1)
    updateSelectedWells(allWells)
  }
}

// 清空选择
const clearSelection = () => {
  updateSelectedWells([])
}

// 检查井是否被选中
const isWellSelected = (wellId: string): boolean => {
  if (!isMultiSelectMode.value && selectedWells.value.length === 0) return false
  const wellIndex = parseWellIndex(wellId)
  const wellNumber = wellIndex + 1
  return selectedWells.value.includes(wellNumber)
}

// 隐藏右键菜单
const hideContextMenu = () => {
  contextMenuVisible.value = false
  contextMenuNode.value = null
}

// 确认编辑
const confirmEdit = () => {
  if (editingNodeId.value && editingValue.value.trim()) {
    const wellIndex = parseWellIndex(editingNodeId.value)
    updateWellName(wellIndex, editingValue.value.trim())
  }
  cancelEdit()
}

// 取消编辑
const cancelEdit = () => {
  editingNodeId.value = null
  editingValue.value = ''
}

// 处理输入框按键事件
const handleInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    confirmEdit()
  } else if (event.key === 'Escape') {
    cancelEdit()
  }
}

// 点击其他地方隐藏菜单
const handleDocumentClick = () => {
  hideContextMenu()
}

// 监听文档点击事件
onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>
<template>
  <div class="oilfield-layout-tree">    
    <!-- 多选控制区域 -->
    <div class="selection-controls">
      <div class="flex items-center justify-between p-3 border-b bg-gray-50">
        <div class="flex items-center space-x-2">
          <button
            @click="toggleMultiSelectMode"
            class="px-3 py-1 text-xs rounded border transition-colors"
            :class="isMultiSelectMode ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'"
          >
            {{ isMultiSelectMode ? '退出多选' : '多选模式' }}
          </button>
          
          <span v-if="selectedWells.length > 0" class="text-xs text-gray-500">
            已选择 {{ selectedWells.length }} 口井
          </span>
        </div>
        
        <div v-if="isMultiSelectMode" class="flex items-center space-x-1">
          <button
            @click="toggleSelectAll"
            class="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            {{ selectedWells.length === numberOfWells ? '取消全选' : '全选' }}
          </button>
          
          <button
            v-if="selectedWells.length > 0"
            @click="clearSelection"
            class="px-2 py-1 text-xs text-red-600 hover:text-red-800 transition-colors"
          >
            清空
          </button>
        </div>
      </div>
      
      <!-- 选中井列表 -->
      <div v-if="selectedWells.length > 0" class="selected-wells-list p-2 border-b bg-blue-50">
        <div class="text-xs text-gray-600 mb-1">选中的井:</div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="wellNumber in selectedWells"
            :key="wellNumber"
            class="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
          >
            井 {{ wellNumber }}
            <button
              @click="updateSelectedWells(selectedWells.filter(w => w !== wellNumber))"
              class="ml-1 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        </div>
      </div>
    </div>

    <!-- 树形组件 -->
    <div class="tree-container">
      <el-tree
        :data="treeData"
        :props="defaultProps"
        :default-expanded-keys="expandedKeys"
        node-key="id"
        draggable
        :allow-drag="allowDrag"
        :allow-drop="allowDrop"
        @node-drop="handleNodeDrop"
        @node-expand="handleNodeExpand"
        @node-collapse="handleNodeCollapse"
        highlight-current
        @node-click="handleNodeClick"
        class="custom-tree"
      >
        <!-- 自定义节点内容 -->
        <template #default="{ node, data }">
          <div 
            class="custom-tree-node" 
            :class="{ 
              'selected-well': data.type === 'well' && isWellSelected(data.id) && !selectWellsEnabled,
              'selected-well-orange': data.type === 'well' && isWellSelected(data.id) && selectWellsEnabled,
              'multi-select-mode': isMultiSelectMode && data.type === 'well'
            }"
            @contextmenu="handleNodeRightClick($event, data)"
          >
            <!-- 节点图标 -->
            <span class="node-icon">{{ renderIcon(node) }}</span>
            
            <!-- 多选复选框 (仅井节点在多选模式下显示) -->
            <input
              v-if="data.type === 'well' && isMultiSelectMode"
              type="checkbox"
              :checked="isWellSelected(data.id)"
              @click.stop="handleNodeClick(data)"
              class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            
            <!-- 编辑时显示输入框 (仅井节点) -->
            <input
              v-if="data.type === 'well'"
              v-show="editingNodeId === data.id"
              type="text"
              v-model="editingValue"
              @keydown="handleInputKeydown"
              @blur="confirmEdit"
              @click.stop
              class="node-edit-input"
            />
            
            <!-- 节点标签 -->
            <span 
              v-show="editingNodeId !== data.id"
              class="node-label"
            >
              {{ data.label }}
            </span>
            
            <!-- 井数量显示（对分类和站点显示） -->
            <span 
              v-if="data.wellCount !== undefined"
              class="well-count"
            >
              ({{ data.wellCount }})
            </span>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="startEdit">
        <span class="menu-icon">✏️</span>
        <span>update well name</span>
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div class="tree-footer">
      <div class="text-xs text-gray-400 p-2 border-t">
        <div class="text-blue-500 mt-1">💡 可拖拽井在分组间移动</div>
        <div class="text-green-500 mt-1">✏️ 右键井名称可编辑</div>
        <div class="text-purple-500 mt-1">☑️ 多选模式可选择多口井</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.oilfield-layout-tree {
  @apply bg-white border-r flex flex-col;
  width: 250px;
  min-width: 200px;
  height: 85vh; /* 明确设置高度 */
}

.selection-controls {
  flex-shrink: 0; /* 防止控制区域被压缩 */
}

.tree-header {
  @apply p-4 border-b bg-gray-50;
  flex-shrink: 0; /* 防止头部被压缩 */
}

.tree-container {
  @apply flex-1 p-2;
  overflow-y: auto; /* 启用垂直滚动 */
  overflow-x: hidden; /* 隐藏水平滚动 */
  min-height: 0; /* 重要：允许flex子元素缩小到小于内容大小 */
}

.tree-footer {
  @apply border-t bg-gray-50;
  flex-shrink: 0; /* 防止底部被压缩 */
}

/* 右键菜单样式 */
.context-menu {
  @apply fixed bg-white border rounded-md shadow-lg z-50 py-1 min-w-[120px];
  border-color: #e5e7eb;
}

.menu-item {
  @apply px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 flex items-center space-x-2;
  transition: background-color 0.15s ease;
}

.menu-item:hover {
  @apply bg-gray-100;
}

.menu-icon {
  @apply text-sm;
  width: 16px;
  text-align: center;
}

/* 自定义树形组件样式 */
:deep(.custom-tree) {
  @apply bg-transparent;
}

:deep(.custom-tree .el-tree-node) {
  @apply mb-1;
}

:deep(.custom-tree .el-tree-node__content) {
  @apply rounded-md transition-all duration-200 px-2 py-1;
  min-height: 28px;
}

:deep(.custom-tree .el-tree-node__content:hover) {
  @apply bg-blue-50;
}

:deep(.custom-tree .el-tree-node.is-current > .el-tree-node__content) {
  @apply bg-blue-100 text-blue-700;
}

/* 自定义节点内容样式 */
.custom-tree-node {
  @apply flex items-center w-full;
}

.node-icon {
  @apply mr-2 text-sm;
  width: 16px;
  text-align: center;
}

.node-label {
  @apply flex-1 text-sm;
}

.well-count {
  @apply text-xs text-gray-500 ml-2 bg-gray-100 px-1 rounded;
}

/* 不同层级的样式区分 */
:deep(.el-tree-node[data-key="oilfield-layout"] > .el-tree-node__content) {
  @apply font-medium bg-gray-100 text-gray-800;
}

/* 油田层级样式 */
:deep(.el-tree-node__content) {
  font-size: 13px;
}

/* 井节点特殊样式 */
:deep(.el-tree-node__content .custom-tree-node .node-icon) {
  filter: brightness(0.8);
}

/* 站点节点样式 */
:deep(.el-tree-node__content:has(.node-icon:contains("🏗️"))) {
  @apply bg-orange-50;
}

/* 展开/折叠图标样式 */
:deep(.el-tree-node__expand-icon) {
  @apply text-gray-400 text-sm;
}

:deep(.el-tree-node__expand-icon.expanded) {
  @apply text-gray-600;
}

/* 滚动条样式 */
.tree-container::-webkit-scrollbar {
  width: 4px;
}

.tree-container::-webkit-scrollbar-track {
  background: transparent;
}

.tree-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.tree-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 动画效果 */
:deep(.el-tree-node__children) {
  overflow: hidden;
}

/* 拖拽相关样式 */
:deep(.el-tree-node.is-drop-inner) {
  @apply bg-blue-100 border-blue-300;
}

:deep(.el-tree-node.is-drop-next) {
  border-bottom: 2px solid #409eff;
}

:deep(.el-tree-node.is-drop-prev) {
  border-top: 2px solid #409eff;
}

/* 被拖拽节点样式 */
:deep(.el-tree-node.is-dragging) {
  @apply opacity-50;
}

/* 井节点在拖拽时的特殊样式 */
:deep(.custom-tree .el-tree-node__content:has(.node-icon:contains("⚡"))) {
  cursor: grab;
}

/* 多选模式下的井节点样式 */
.multi-select-mode {
  cursor: pointer;
}

/* 选中的井节点样式 */
.selected-well {
  @apply bg-blue-100 border border-blue-300 rounded;
}

/* 橙色选中的井节点样式 */
.selected-well-orange {
  @apply bg-orange-100 border border-orange-300 rounded;
}

/* 多选模式下的节点内容样式 */
:deep(.el-tree-node__content:has(.multi-select-mode)) {
  @apply hover:bg-blue-50;
}

/* 选中井节点的特殊样式 */
:deep(.el-tree-node__content:has(.selected-well)) {
  @apply bg-blue-100 border-blue-300;
}

/* 橙色选中井节点的特殊样式 */
:deep(.el-tree-node__content:has(.selected-well-orange)) {
  @apply bg-orange-100 border-orange-300;
}
:deep(.custom-tree .el-tree-node__content:has(.node-icon:contains("⚡")):active) {
  cursor: grabbing;
}

/* 井节点标签样式 */
.well-label {
  @apply cursor-pointer;
  user-select: none;
}
/* 编辑模式样式 */
.node-edit-container {
  @apply flex-1;
}

.node-edit-input {
  @apply w-full px-1 py-0.5 text-sm border border-blue-300 rounded;
  @apply bg-white focus:outline-none focus:ring-1 focus:ring-blue-500;
  font-size: 13px;
}

/* 编辑状态时的节点样式 */
:deep(.el-tree-node__content:has(.node-edit-container)) {
  @apply bg-blue-50 border border-blue-200;
}

/* 响应式字体 */
@media (max-width: 768px) {
  .node-label {
    font-size: 12px;
  }
  
  .well-count {
    font-size: 10px;
  }
  
  .node-edit-input {
    font-size: 12px;
  }
  
  .context-menu {
    @apply text-sm;
  }
}
</style>