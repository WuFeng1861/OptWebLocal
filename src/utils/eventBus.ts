/**
 * 发布订阅工具类
 * 用于组件间的事件通信
 */

// 事件处理函数类型
type EventHandler<T = any> = (data: T) => void

// 事件订阅信息
interface EventSubscription {
  handler: EventHandler
  once?: boolean
}

// 事件映射类型
interface EventMap {
  [eventName: string]: EventSubscription[]
}

class EventBus {
  private events: EventMap = {}

  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param handler 事件处理函数
   * @returns 取消订阅函数
   */
  on<T = any>(eventName: string, handler: EventHandler<T>): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = []
    }

    const subscription: EventSubscription = { handler }
    this.events[eventName].push(subscription)

    // 返回取消订阅函数
    return () => this.off(eventName, handler)
  }

  /**
   * 一次性订阅事件（只触发一次后自动取消）
   * @param eventName 事件名称
   * @param handler 事件处理函数
   * @returns 取消订阅函数
   */
  once<T = any>(eventName: string, handler: EventHandler<T>): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = []
    }

    const subscription: EventSubscription = { handler, once: true }
    this.events[eventName].push(subscription)

    // 返回取消订阅函数
    return () => this.off(eventName, handler)
  }

  /**
   * 取消订阅事件
   * @param eventName 事件名称
   * @param handler 要取消的事件处理函数
   */
  off<T = any>(eventName: string, handler: EventHandler<T>): void {
    if (!this.events[eventName]) return

    this.events[eventName] = this.events[eventName].filter(
      subscription => subscription.handler !== handler
    )

    // 如果没有订阅者了，删除该事件
    if (this.events[eventName].length === 0) {
      delete this.events[eventName]
    }
  }

  /**
   * 发布事件
   * @param eventName 事件名称
   * @param data 要传递的数据
   */
  emit<T = any>(eventName: string, data?: T): void {
    if (!this.events[eventName]) return

    // 复制订阅列表，避免在遍历过程中修改数组
    const subscriptions = [...this.events[eventName]]

    for (const subscription of subscriptions) {
      try {
        subscription.handler(data)
      } catch (error) {
        console.error(`EventBus: Error in event handler for "${eventName}":`, error)
      }

      // 如果是一次性订阅，执行后立即移除
      if (subscription.once) {
        this.off(eventName, subscription.handler)
      }
    }
  }

  /**
   * 清空指定事件的所有订阅
   * @param eventName 事件名称
   */
  clear(eventName: string): void {
    if (this.events[eventName]) {
      delete this.events[eventName]
    }
  }

  /**
   * 清空所有事件订阅
   */
  clearAll(): void {
    this.events = {}
  }

  /**
   * 获取指定事件的订阅数量
   * @param eventName 事件名称
   * @returns 订阅数量
   */
  getSubscriberCount(eventName: string): number {
    return this.events[eventName]?.length || 0
  }

  /**
   * 获取所有事件名称
   * @returns 事件名称数组
   */
  getEventNames(): string[] {
    return Object.keys(this.events)
  }

  /**
   * 检查是否有订阅者
   * @param eventName 事件名称
   * @returns 是否有订阅者
   */
  hasSubscribers(eventName: string): boolean {
    return this.getSubscriberCount(eventName) > 0
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus()

// 导出类型
export type { EventHandler }
export default EventBus