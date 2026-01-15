import request from '@/config/axios'

// 后置质控相关API

export interface PostQcStartResult {
  totalOrgs: number
  passedOrgs: number
  pendingReviewOrgs: number
  autoReturnOrgs: number
  benchmarkYpidCount: number
  benchmarkNewlyCalculated: boolean
  executionTime: number
}

export interface PostQcResultVO {
  id: number
  reportId: number
  deptId: number
  organizationCode: string
  organizationName: string
  postQcStatus: number
  postQcStatusName: string
  failedRecords: number
  warningRecords: number
  anomalyRecords: number
  totalRecords: number
  successRecords: number
  errorRate: number
  autoReturn: number
  rejectReason: string
  rejectTime: string
  postQcRound: number
  postQcTime: string
  orgLevelError: number
  orgLevelErrorCodes: string
  qualityScore: number
}

export interface PostQcResultPageReqVO {
  reportId: number
  postQcStatus?: number
  organizationName?: string
  organizationCode?: string
  pageNo?: number
  pageSize?: number
}

export interface FourDimensionEvaluationVO {
  orgCoverageRate: number
  ypidMatchRate: number
  dataAccuracyRate: number
  progressScore: {
    firstRoundRate: number
    resubmitRate: number
    firstRoundAccuracyRate: number
  }
  totalScore: number
}

// 启动后置质控
export const startPostQc = (reportId: number) => {
  return request.post({ url: '/admin/drug/post-qc/start', params: { reportId } })
}

// 获取后置质控结果列表
export const getPostQcResults = (params: PostQcResultPageReqVO) => {
  return request.get({ url: '/admin/drug/post-qc/results', params })
}

// 退回机构
export const returnOrg = (importTaskId: number, reason: string) => {
  return request.post({ url: '/admin/drug/post-qc/return', params: { importTaskId, reason } })
}

// 通过机构
export const approveOrg = (importTaskId: number) => {
  return request.post({ url: '/admin/drug/post-qc/approve', params: { importTaskId } })
}

// 批量退回机构
export const batchReturnOrgs = (importTaskIds: number[], reason: string) => {
  return request.post({ 
    url: '/admin/drug/post-qc/batch-return', 
    params: { importTaskIds: importTaskIds.join(','), reason } 
  })
}

// 数据定版
export const finalizeData = (reportId: number) => {
  return request.post({ url: '/admin/drug/post-qc/finalize', params: { reportId } })
}

// 获取四维度评价
export const getEvaluation = (reportId: number) => {
  return request.get({ url: '/admin/drug/post-qc/evaluation', params: { reportId } })
}

// 获取标尺数量
export const getBenchmarkCount = (reportId?: number) => {
  return request.get({ url: '/admin/drug/post-qc/benchmark/count', params: { reportId } })
}

// 检查标尺是否存在
export const benchmarkExists = (reportId: number) => {
  return request.get({ url: '/admin/drug/post-qc/benchmark/exists', params: { reportId } })
}
