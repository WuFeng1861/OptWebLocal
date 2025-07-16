import { ref, Ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { ResultData } from '../utils/request'

/**
 * API请求状态管理Hook
 */
export function useApi<T = any>() {
  const loading = ref(false)
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)

  /**
   * 执行API请求
   */
  const execute = async <R = T>(
    apiCall: () => Promise<ResultData<R>>,
    options?: {
      showLoading?: boolean
      showSuccess?: boolean
      successMessage?: string
      showError?: boolean
    }
  ): Promise<R | null> => {
    const {
      showLoading = true,
      showSuccess = false,
      successMessage = '操作成功',
      showError = true
    } = options || {}

    try {
      if (showLoading) {
        loading.value = true
      }
      
      error.value = null
      
      const response = await apiCall()
      data.value = response.data as T
      
      if (showSuccess) {
        ElMessage.success(successMessage)
      }
      
      return response.data
    } catch (err: any) {
      error.value = err.message || '请求失败'
      
      if (showError) {
        ElMessage.error(error.value)
      }
      
      return null
    } finally {
      if (showLoading) {
        loading.value = false
      }
    }
  }

  /**
   * 重置状态
   */
  const reset = () => {
    loading.value = false
    data.value = null
    error.value = null
  }

  return {
    loading: loading as Ref<boolean>,
    data: data as Ref<T | null>,
    error: error as Ref<string | null>,
    execute,
    reset
  }
}

/**
 * 分页数据管理Hook
 */
export function usePagination<T = any>(
  apiCall: (params: { page: number; pageSize: number }) => Promise<ResultData<{
    list: T[]
    total: number
    page: number
    pageSize: number
  }>>
) {
  const loading = ref(false)
  const list = ref<T[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)

  /**
   * 加载数据
   */
  const loadData = async (resetPage = false) => {
    if (resetPage) {
      page.value = 1
    }

    try {
      loading.value = true
      
      const response = await apiCall({
        page: page.value,
        pageSize: pageSize.value
      })
      
      list.value = response.data.list
      total.value = response.data.total
      page.value = response.data.page
      pageSize.value = response.data.pageSize
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新数据
   */
  const refresh = () => {
    loadData(true)
  }

  /**
   * 改变页码
   */
  const changePage = (newPage: number) => {
    page.value = newPage
    loadData()
  }

  /**
   * 改变每页大小
   */
  const changePageSize = (newPageSize: number) => {
    pageSize.value = newPageSize
    page.value = 1
    loadData()
  }

  return {
    loading: loading as Ref<boolean>,
    list: list as Ref<T[]>,
    total: total as Ref<number>,
    page: page as Ref<number>,
    pageSize: pageSize as Ref<number>,
    loadData,
    refresh,
    changePage,
    changePageSize
  }
}