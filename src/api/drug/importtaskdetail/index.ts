import request from '@/config/axios'

// 数据档案 VO
export interface ImportTaskDetailVO {
  taskId: number // 任务ID
  fileType: string // 文件类型:HOSPITAL_INFO,DRUG_CATALOG,DRUG_INBOUND,DRUG_OUTBOUND,DRUG_USAGE
  fileName: string // 文件名
  totalRows: number // 总行数
  fileSize: number // 文件大小
}

// 数据档案 API
export const ImportTaskDetailApi = {
  // 查询数据档案分页
  getImportTaskDetailPage: async (params: any) => {
    return await request.get({ url: `/drug/import-task-detail/page`, params })
  },

  // 查询数据档案详情
  getImportTaskDetail: async (id: number) => {
    return await request.get({ url: `/drug/import-task-detail/get?id=` + id })
  },

  // 新增数据档案
  createImportTaskDetail: async (data: ImportTaskDetailVO) => {
    return await request.post({ url: `/drug/import-task-detail/create`, data })
  },

  // 修改数据档案
  updateImportTaskDetail: async (data: ImportTaskDetailVO) => {
    return await request.put({ url: `/drug/import-task-detail/update`, data })
  },

  // 删除数据档案
  deleteImportTaskDetail: async (id: number) => {
    return await request.delete({ url: `/drug/import-task-detail/delete?id=` + id })
  },

  // 导出数据档案 Excel
  exportImportTaskDetail: async (params) => {
    return await request.download({ url: `/drug/import-task-detail/export-excel`, params })
  },
}