import request from '@/config/axios'

// ========== 上报任务管理 ==========

export interface ReportTaskCreateVO {
  taskName: string
  hospitalId?: number
  hospitalName?: string
  description?: string
  startDate?: string
  endDate?: string
  reportProgress?: number
}

export interface ReportTaskVO {
  id: number
  name: string
  status: string
  startDate: string
  endDate: string
  hospitalId: number
  hospitalName: string
  currentStep: number
  submitTime?: Date
  completeTime?: Date
  rejectTime?: Date
  rejectReason?: string
  reviewer?: string
}

export interface ReportTaskRespVO {
  id: number
  taskName: string
  status: number
  currentStep: number
  startDate: string
  endDate: string
  hospitalId: number
  hospitalName: string
  description: string
  submitTime?: Date
  completeTime?: Date
}

export interface ImportTaskCreateReqVO {
  taskName: string
  hospitalId: number
  hospitalName?: string
  description?: string
  startDate?: string
  endDate?: string
  reportProgress?: number
}

export interface FileUploadVO {
  id: number
  fileName: string
  fileType: string
  status: string
  size: number
  recordCount: number
  errorCount?: number
  message?: string
}

export interface QCResultVO {
  passed: boolean
  details: QCDetailVO[]
  reportUrl?: string
}

export interface QCDetailVO {
  tableName: string
  checkItem: string
  passed: boolean
  errorCount: number
  message: string
  errors?: QCErrorVO[]
}

export interface QCErrorVO {
  row: number
  column: string
  value: string
  errorType: string
  message: string
  suggestion: string
}

export interface PostQCResultVO {
  status: string // processing, passed, rejected
  progress?: number
  estimatedTime?: string
  rejectReason?: string
  rejectTime?: string
  reviewer?: string
  errorTables?: ErrorTableVO[]
}

export interface ErrorTableVO {
  tableName: string
  errorType: string
  errorCount: number
  description: string
}

export interface FileValidationResult {
  success: boolean
  taskId?: number
  taskNo?: string
  message: string
}

export interface HistoricalFilingTaskListVO {
  pageNo: number
  pageSize: number
  reportYear?: string
  reportStatus?: string
  taskName?: string
}

export interface ViewDataTypesListVO {
  pageNo: number
  pageSize: number
  taskId: number | undefined
}

// 药品数据上报 API - 整合所有相关接口
export const ReportDataApi = {
  // ==================== 上报任务相关API ====================
  // 获取当前激活任务
  getCurrentActiveTask: (taskId: number): Promise<ReportTaskRespVO> => {
    return request.get({ url: '/drug/report-data/current-active' ,params: { taskId: taskId }})
  },

  // 创建上报任务
  createReportTask: (data: ReportTaskCreateVO): Promise<number> => {
    return request.post({ url: '/drug/report-data/create-report-task', data })
  },

  // 更新上报进度
  updateReportProgress: (taskId: number, reportProgress: number): Promise<boolean> => {
    return request.put({
      url: '/drug/report-data/update-report-progress',
      params: { taskId, reportProgress }
    })
  },

  // 获取任务详情
  getTask: (id: number): Promise<ReportTaskVO> => {
    return request.get({ url: `/drug/report-data/task/get?id=${id}` })
  },

  // 更新任务状态
  updateTaskStatus: (id: number, status: string): Promise<boolean> => {
    return request.put({
      url: '/drug/report-data/task/update-status',
      data: { id, status }
    })
  },

  // 获取历史任务列表
  getTaskHistory: (params: any): Promise<any> => {
    return request.get({ url: '/drug/report-data/task/history', params })
  },

  // ==================== 文件上传相关API ====================
  // 验证并解析文件
  validateAndParseFile: (file: File, taskId: number): Promise<FileValidationResult> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', taskId.toString())

    return request.post({
      url: '/drug/report-data/validate-and-parse',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 上传文件
  uploadFile: (file: File, taskId: number): Promise<any> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', String(taskId))
    return request.upload({
      url: '/drug/report-data/file/upload',
      data: formData
    })
  },

  // 批量上传压缩包
  uploadZip: (file: File, taskId: number): Promise<any> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', String(taskId))
    return request.upload({
      url: '/drug/report-data/file/upload-zip',
      data: formData
    })
  },

  // 获取文件列表
  getFileList: (taskId: number): Promise<FileUploadVO[]> => {
    return request.get({
      url: `/drug/report-data/file/list?taskId=${taskId}`
    })
  },

  // 删除文件
  deleteFile: (id: number): Promise<boolean> => {
    return request.delete({ url: `/drug/report-data/file/delete?id=${id}` })
  },

  // 查询医疗机构数据、药瓶目录、入库、出库、使用
  getFileData: (type:string, taskId: number, id: number, pageNo?: number, pageSize?: number): Promise<any> => {
    return request.get({
      url: `/drug/report-data/file/data/${type}`,
      params: { taskId, id, pageNo: pageNo || 1, pageSize: pageSize || 10 }
    })
  },

  // 下载模板
  downloadTemplate: (): Promise<any> => {
    return request.download({ url: '/drug/report-data/file/download-template' })
  },

  // 下载原始文件
  downloadOriginalFiles: (taskId: number): Promise<any> => {
    return request.download({
      url: `/drug/report-data/file/download-original?taskId=${taskId}`
    })
  },

  // ==================== 质控相关API ====================
  // 执行前置质控
  executePreQC: (taskId: number): Promise<QCResultVO> => {
    return request.post({
      url: '/drug/report-data/qc/pre',
      data: { taskId }
    })
  },

  // 获取前置质控结果
  getPreQCResult: (taskId: number): Promise<QCResultVO> => {
    return request.get({
      url: `/drug/report-data/qc/pre-result?taskId=${taskId}`
    })
  },

  // 获取后置质控结果
  getPostQCResult: (taskId: number): Promise<PostQCResultVO> => {
    return request.get({
      url: `/drug/report-data/qc/post-result?taskId=${taskId}`
    })
  },

  // 获取质控错误详情
  getQCErrors: (taskId: number, tableType: string): Promise<QCErrorVO[]> => {
    return request.get({
      url: '/drug/report-data/qc/error-messages',
      params: { taskId, tableType }
    })
  },

  // 下载质控报告
  downloadQCReport: (taskId: number, type: 'pre' | 'post'): Promise<any> => {
    return request.download({
      url: `/drug/report-data/qc/download-report?taskId=${taskId}&type=${type}`
    })
  },

  // 导出错误清单
  exportErrors: (taskId: number, tableName?: string): Promise<any> => {
    return request.download({
      url: '/drug/report-data/qc/export-errors',
      params: { taskId, tableName }
    })
  },

  // 下载错误数据
  downloadErrorData: (taskId: number, tableName: string): Promise<any> => {
    return request.download({
      url: '/drug/report-data/qc/download-error-data',
      params: { taskId, tableName }
    })
  },

  // ==================== 上报提交相关API ====================
  // 提交上报
  submitReport: (taskId: number, fileIds: Array<number>): Promise<boolean> => {
    return request.post({
      url: '/drug/report-data/submit',
      data: { taskId, fileIds }
    })
  },

  // 撤回上报
  withdrawReport: (taskId: number, reason: string): Promise<boolean> => {
    return request.post({
      url: '/drug/report-data/withdraw',
      data: { taskId, reason }
    })
  },

  // 重新上报
  resubmitReport: (taskId: number): Promise<boolean> => {
    return request.post({
      url: '/drug/report-data/resubmit',
      data: { taskId }
    })
  },

  // 获取提交日志
  getSubmitLog: (taskId: number): Promise<any> => {
    return request.get({
      url: `/drug/report-data/submit-log?taskId=${taskId}`
    })
  },

  // 刷新上报状态
  refreshStatus: (taskId: number): Promise<any> => {
    return request.get({
      url: `/drug/report-data/refresh-status?taskId=${taskId}`
    })
  },

  // ==================== 管理端审核API（用于测试） ====================
  // 审核通过
  approve: (taskId: number, comment?: string): Promise<boolean> => {
    return request.post({
      url: '/drug/report-data/review/approve',
      data: { taskId, comment }
    })
  },

  // 审核退回
  reject: (taskId: number, reason: string, errorTables: ErrorTableVO[]): Promise<boolean> => {
    return request.post({
      url: '/drug/report-data/review/reject',
      data: { taskId, reason, errorTables }
    })
  },

  // 获取审核历史
  getReviewHistory: (taskId: number): Promise<any> => {
    return request.get({
      url: `/drug/report-data/review/history?taskId=${taskId}`
    })
  },

  // ==================== 药品监测 - 数据上报 ====================

  // 获取去重后的年份列表
  getDeduplicationYearList: (): Promise<any> => {
    return request.get({ url: '/drug/report-data/report-years' })
  },

  // 获取历史填报任务列表
  getHistoricalFilingTaskList: (params: HistoricalFilingTaskListVO): Promise<any> => {
    return request.get({ url: '/drug/report-data/history', params })
  },

  // 提交国家平台
  submitToTheNationalPlatform: (taskId: Number): Promise<any> => {
    return request.post({ url: '/drug/report-data/submit-national-platform', data: { taskId } })
  },

  // 医疗机构数据
  getHospitalList: (params: ViewDataTypesListVO): Promise<any> => {
    return request.get({ url: '/drug/report-data/file/data/hospital', params })
  },

  // 查看药品目录数据
  getCatalogList: (params: ViewDataTypesListVO): Promise<any> => {
    return request.get({ url: '/drug/report-data/file/data/catalog', params })
  },

  // 查看入库数据
  getInboundList: (params: ViewDataTypesListVO): Promise<any> => {
    return request.get({ url: '/drug/report-data/file/data/inbound', params })
  },

  // 查看出库数据
  getOutboundList: (params: ViewDataTypesListVO): Promise<any> => {
    return request.get({ url: '/drug/report-data/file/data/outbound', params })
  },

  // 查看使用数据
  getUsageList: (params: ViewDataTypesListVO): Promise<any> => {
    return request.get({ url: '/drug/report-data/file/data/usage', params })
  },

  // ==================== 上传进度和结果API ====================
  // 获取批次上传进度
  getUploadProgress: (taskId: number): Promise<any> => {
    return request.get({ url: '/drug/report-data/upload/progress', params: { taskId } })
  },

  // 获取批次上传结果
  getUploadResult: (taskId: number): Promise<any> => {
    return request.get({ url: '/drug/report-data/upload/result', params: { taskId } })
  },

  // ==================== 文件验证错误API ====================
  // 获取文件的验证错误详情
  getFileValidationErrors: (taskId: number, fileType: string): Promise<any> => {
    return request.get({ 
      url: '/drug/report-data/file/validation-errors', 
      params: { taskId, fileType } 
    })
  },

  // 下载错误Excel（单个文件）
  downloadErrorExcel: (taskId: number, fileType: string): Promise<any> => {
    return request.download({ 
      url: '/drug/report-data/file/download-error-excel', 
      params: { taskId, fileType } 
    })
  },

  // 下载错误汇总（所有文件）
  downloadErrorSummary: (taskId: number): Promise<any> => {
    return request.download({ 
      url: '/drug/report-data/file/download-error-summary', 
      params: { taskId } 
    })
  },
}
