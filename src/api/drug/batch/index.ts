import request from '@/config/axios'

// 药品数据导入任务 VO
export interface ImportTaskVO {
  taskNo: string // 任务编号（格式：DRUG_YYYYMMDD_XXXXXX）
  totalFiles: number // 预期文件数量
  successFiles: number // 成功文件数
  warningFiles: number // 警告文件数
  failedFiles: number // 失败文件数
  totalRecords: number // 总记录数
  successRecords: number // 成功记录数
  failedRecords: number // 失败记录数
  warningRecords: number // 警告记录数
  anomalyRecords: number // 异常记录数
  durationMs: number // 总耗时(毫秒)
  avgRecordTime: number // 平均单条记录处理时间(ms)
  hasErrorFile: number // 是否生成错误文件
  errorFilePath: string // 错误文件路径
  errorMessage: string // 错误信息
  errorDetail: string // 详细错误信息
  dataSource: string // 数据来源
  description: string // 备注说明
  deptId: number // 部门id
  reportProgress: number // 上报进度
  reportId: number // 上报任务id
  currentStep: number // 当前步骤
  reportStatus: number // 上报状态：0未上报、1审核中,2已退回、3已通过,4已上报
  reportTime: Date // 上报时间
  rejectTime: Date // 退回时间
  approveTime: Date // 通过时间
  rejectReason: string // 退回原因
  submitTime: Date // 提交时间
}

// 药品数据导入任务 API
export const ImportTaskApi = {
  // 查询药品数据导入任务分页
  getImportTaskPage: async (params: any) => {
    return await request.get({ url: `/drug/import-task/page`, params })
  },

  // 查询药品数据导入任务详情
  getImportTask: async (id: number) => {
    return await request.get({ url: `/drug/import-task/get?id=` + id })
  },

  // 新增药品数据导入任务
  createImportTask: async (data: ImportTaskVO) => {
    return await request.post({ url: `/drug/import-task/create`, data })
  },

  // 修改药品数据导入任务
  updateImportTask: async (data: ImportTaskVO) => {
    return await request.put({ url: `/drug/import-task/update`, data })
  },

  // 删除药品数据导入任务
  deleteImportTask: async (id: number) => {
    return await request.delete({ url: `/drug/import-task/delete?id=` + id })
  },

  // 导出药品数据导入任务 Excel
  exportImportTask: async (params) => {
    return await request.download({ url: `/drug/import-task/export-excel`, params })
  },
}
