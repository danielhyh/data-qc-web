import request from '@/config/axios'

// 直报系统同步日志 VO
export interface SyncLogVO {
  id: number // 主键ID
  syncType: string // 同步类型
  externalId: string // 外部ID
  operation: string // 操作类型
  status: number // 处理状态
  requestData: string // 请求数据
  errorMsg: string // 错误信息
  pushTime: Date // 推送时间
  processTime: Date // 处理时间
}

// 直报系统同步日志 API
export const SyncLogApi = {
  // 查询直报系统同步日志分页
  getSyncLogPage: async (params: any) => {
    return await request.get({ url: `/system/sync-log/page`, params })
  },

  // 查询直报系统同步日志详情
  getSyncLog: async (id: number) => {
    return await request.get({ url: `/system/sync-log/get?id=` + id })
  },

  // 新增直报系统同步日志
  createSyncLog: async (data: SyncLogVO) => {
    return await request.post({ url: `/system/sync-log/create`, data })
  },

  // 修改直报系统同步日志
  updateSyncLog: async (data: SyncLogVO) => {
    return await request.put({ url: `/system/sync-log/update`, data })
  },

  // 删除直报系统同步日志
  deleteSyncLog: async (id: number) => {
    return await request.delete({ url: `/system/sync-log/delete?id=` + id })
  },

  // 导出直报系统同步日志 Excel
  exportSyncLog: async (params) => {
    return await request.download({ url: `/system/sync-log/export-excel`, params })
  },
}