/**
 * 工具函数统一导出
 */

// 导出颜色工具
export * from './colorUtil'

// 导出事件总线
export { eventBus, default as EventBus } from './eventBus'
export type { EventHandler } from './eventBus'