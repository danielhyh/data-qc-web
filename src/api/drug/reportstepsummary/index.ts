import request from '@/config/axios'

// 上报步骤总览 VO
export interface ReportStepSummaryVO {
  id: number // 主键ID
  taskId: number // 关联任务ID
  stepType: number // 步骤类型：1上传/2质控/3提交/4国家平台
  status: number // 处理状态：0处理中/1已完成/2部分失败/3全部失败
  totalFiles: number // 总文件数
  successFiles: number // 成功文件数
  failedFiles: number // 失败文件数
  warningFiles: number // 警告文件数
  totalRecords: number // 总记录数
  successRecords: number // 成功记录数
  errorRecords: number // 错误记录数
  warningRecords: number // 警告记录数
  startTime: Date // 开始时间
  endTime: Date // 结束时间
  duration: number // 处理耗时（秒）
  summaryData: string // 步骤特有数据（JSON格式）
  errorSummary: string // 错误汇总信息
}

// 上报步骤总览 API
export const ReportStepSummaryApi = {
  // 查询上报步骤总览分页
  getReportStepSummaryPage: async (params: any) => {
    return await request.get({ url: `/drug/report-step-summary/page`, params })
  },

  // 查询上报步骤总览详情
  getReportStepSummary: async (id: number) => {
    return await request.get({ url: `/drug/report-step-summary/get?id=` + id })
  },

  // 新增上报步骤总览
  createReportStepSummary: async (data: ReportStepSummaryVO) => {
    return await request.post({ url: `/drug/report-step-summary/create`, data })
  },

  // 修改上报步骤总览
  updateReportStepSummary: async (data: ReportStepSummaryVO) => {
    return await request.put({ url: `/drug/report-step-summary/update`, data })
  },

  // 删除上报步骤总览
  deleteReportStepSummary: async (id: number) => {
    return await request.delete({ url: `/drug/report-step-summary/delete?id=` + id })
  },

  // 导出上报步骤总览 Excel
  exportReportStepSummary: async (params) => {
    return await request.download({ url: `/drug/report-step-summary/export-excel`, params })
  },

  // ==================== 业务接口 ====================
  
  // 根据任务ID和步骤类型获取总览
  getStepSummaryByTaskAndStep: async (taskId: number, stepType: number) => {
    return await request.get({ 
      url: `/drug/report-data/step-summary`, 
      params: { taskId, stepType } 
    })
  },

  // 创建或更新步骤总览
  createOrUpdateStepSummary: async (data: Partial<ReportStepSummaryVO>) => {
    return await request.post({ url: `/drug/report-data/step-summary/create-or-update`, data })
  },

  // 完成步骤（更新状态为已完成）
  completeStepSummary: async (taskId: number, stepType: number) => {
    return await request.put({ 
      url: `/drug/report-data/step-summary/complete`, 
      params: { taskId, stepType } 
    })
  },

  // 关闭总览卡片（软删除）
  closeStepSummary: async (taskId: number, stepType: number) => {
    return await request.delete({ 
      url: `/drug/report-data/step-summary/close`, 
      params: { taskId, stepType } 
    })
  }
}
