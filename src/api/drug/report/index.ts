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

// 上报任务相关API
export const ReportTaskApi = {
  // 创建上报任务
  createReportTask: (data: ReportTaskCreateVO) => {
    return request.post<number>({ url: '/drug/import-task/create-report-task', data })
  },

  // 获取当前上报任务
  getCurrentTask: () => {
    return request.get<ReportTaskVO>({ url: '/drug/report-task/current-active' })
  },

  // 更新上报进度
  updateReportProgress: (taskId: number, reportProgress: number) => {
    return request.put({
      url: '/drug/import-task/update-report-progress',
      params: { taskId, reportProgress }
    })
  },

  // 获取任务详情
  getTask: (id: number) => {
    return request.get<ReportTaskVO>({ url: `/drug/report/task/get?id=${id}` })
  },

  // 更新任务状态
  updateTaskStatus: (id: number, status: string) => {
    return request.put({
      url: '/drug/report/task/update-status',
      data: { id, status }
    })
  },

  // 获取历史任务列表
  getTaskHistory: (params: any) => {
    return request.get({ url: '/drug/report/task/history', params })
  }
}

// 文件上传相关API
export const ReportFileApi = {
  // 上传文件
  uploadFile: (file: File, taskId: number) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', String(taskId))
    return request.upload({
      url: '/drug/report/file/upload',
      data: formData
    })
  },

  // 批量上传压缩包
  uploadZip: (file: File, taskId: number) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', String(taskId))
    return request.upload({
      url: '/drug/report/file/upload-zip',
      data: formData
    })
  },

  // 获取文件列表
  getFileList: (taskId: number) => {
    return request.get<FileUploadVO[]>({
      url: `/drug/report/file/list?taskId=${taskId}`
    })
  },

  // 删除文件
  deleteFile: (id: number) => {
    return request.delete({ url: `/drug/report/file/delete?id=${id}` })
  },

  // 查看文件数据
  getFileData: (id: number, page?: number, pageSize?: number) => {
    return request.get({
      url: '/drug/report/file/data',
      params: { id, page: page || 1, pageSize: pageSize || 10 }
    })
  },

  // 下载模板
  downloadTemplate: () => {
    return request.download({ url: '/drug/report/file/download-template' })
  },

  // 下载原始文件
  downloadOriginalFiles: (taskId: number) => {
    return request.download({
      url: `/drug/report/file/download-original?taskId=${taskId}`
    })
  }
}

// 质控相关API
export const ReportQCApi = {
  // 执行前置质控
  executePreQC: (taskId: number) => {
    return request.post<QCResultVO>({
      url: '/drug/report/qc/pre',
      data: { taskId }
    })
  },

  // 获取前置质控结果
  getPreQCResult: (taskId: number) => {
    return request.get<QCResultVO>({
      url: `/drug/report/qc/pre-result?taskId=${taskId}`
    })
  },

  // 获取后置质控结果
  getPostQCResult: (taskId: number) => {
    return request.get<PostQCResultVO>({
      url: `/drug/report/qc/post-result?taskId=${taskId}`
    })
  },

  // 获取质控错误详情
  getQCErrors: (taskId: number, tableName: string) => {
    return request.get<QCErrorVO[]>({
      url: '/drug/report/qc/errors',
      params: { taskId, tableName }
    })
  },

  // 下载质控报告
  downloadQCReport: (taskId: number, type: 'pre' | 'post') => {
    return request.download({
      url: `/drug/report/qc/download-report?taskId=${taskId}&type=${type}`
    })
  },

  // 导出错误清单
  exportErrors: (taskId: number, tableName?: string) => {
    return request.download({
      url: '/drug/report/qc/export-errors',
      params: { taskId, tableName }
    })
  },

  // 下载错误数据
  downloadErrorData: (taskId: number, tableName: string) => {
    return request.download({
      url: '/drug/report/qc/download-error-data',
      params: { taskId, tableName }
    })
  }
}

// 上报提交相关API
export const ReportSubmitApi = {
  // 提交上报
  submitReport: (taskId: number, fileIds) => {
    return request.post({
      url: '/drug/report-data/submit',
      data: { taskId, fileIds }
    })
  },

  // 撤回上报
  withdrawReport: (taskId: number, reason: string) => {
    return request.post({
      url: '/drug/report/withdraw',
      data: { taskId, reason }
    })
  },

  // 重新上报
  resubmitReport: (taskId: number) => {
    return request.post({
      url: '/drug/report/resubmit',
      data: { taskId }
    })
  },

  // 获取提交日志
  getSubmitLog: (taskId: number) => {
    return request.get({
      url: `/drug/report/submit-log?taskId=${taskId}`
    })
  },

  // 刷新上报状态
  refreshStatus: (taskId: number) => {
    return request.get({
      url: `/drug/report/refresh-status?taskId=${taskId}`
    })
  }
}

// 管理端审核API（用于测试）
export const ReportReviewApi = {
  // 审核通过
  approve: (taskId: number, comment?: string) => {
    return request.post({
      url: '/drug/report/review/approve',
      data: { taskId, comment }
    })
  },

  // 审核退回
  reject: (taskId: number, reason: string, errorTables: ErrorTableVO[]) => {
    return request.post({
      url: '/drug/report/review/reject',
      data: { taskId, reason, errorTables }
    })
  },

  // 获取审核历史
  getReviewHistory: (taskId: number) => {
    return request.get({
      url: `/drug/report/review/history?taskId=${taskId}`
    })
  }
}