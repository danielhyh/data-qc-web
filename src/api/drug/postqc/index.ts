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

export interface PostQcProgressVO {
  reportTaskId: number
  totalOrgs: number
  totalRules: number
  processedRules: number
  totalErrorOrgs: number
  suggestedReturnOrgs: number
  status: string // RUNNING-执行中, COMPLETED-已完成, FAILED-失败
  startTime: string
  endTime?: string
  executionTime?: number
  currentStep: string
  benchmarkCalculated: boolean
  benchmarkYpidCount: number
  errorMessage?: string
  progressPercentage: number
  // 以下字段已废弃，保留以兼容
  processedOrgs?: number
  passedOrgs?: number
  pendingReviewOrgs?: number
  autoReturnOrgs?: number
  currentOrgName?: string
}

export interface PostQcRuleStatistics {
  ruleCode: string
  ruleName: string
  ruleDescription: string
  totalErrorOrgs: number
  suggestedReturnOrgs: number
  totalErrorRecords: number
  totalAnomalyRecords: number  // 新增：异常记录数
  totalWarningRecords: number  // 新增：警告记录数
  executeAction: string        // 新增：执行动作
  executeActionLabel: string   // 新增：执行动作标签
  executeTime: number
  orgErrors: PostQcOrgError[]
}

export interface PostQcOrgError {
  taskId: number
  deptId: number
  deptName: string
  orgCode: string
  hospitalLevel: number
  hospitalLevelName: string
  totalRecords: number
  errorRecords: number
  errorRate: number
  suggestedReturn: boolean
  suggestedReason?: string
}

export interface PostQcRuleStatisticsVO {
  rules: PostQcRuleStatistics[]
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

// 获取后置质控进度
export const getPostQcProgress = (reportId: number) => {
  return request.get({ url: '/admin/drug/post-qc/progress', params: { reportId } })
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

// 获取规则错误详情（用于规则详情区）
export const getRuleErrorDetail = (reportId: number, ruleCode: string) => {
  return request.get({ url: '/admin/drug/post-qc/rule-error-detail', params: { reportId, ruleCode } })
}

// 获取后置质控规则列表（概览）
export const getRuleList = (reportId: number) => {
  return request.get({ url: '/admin/drug/post-qc/rule-list', params: { reportId } })
}

// 获取机构汇总列表（用于底部机构汇总区）
export const getOrgSummary = (reportId: number) => {
  return request.get({ url: '/admin/drug/post-qc/org-summary', params: { reportId } })
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

// 批量退回结果VO
export interface BatchReturnResultVO {
  totalCount: number
  successCount: number
  failedCount: number
  failedOrgs: string[]
}

// 批量退回所有建议退回的机构
export const batchReturnSuggestedOrgs = (reportTaskId: number, extraNote?: string) => {
  return request.post<BatchReturnResultVO>({
    url: '/admin/drug/post-qc/batch-return-suggested',
    params: {
      reportTaskId,
      extraNote
    }
  })
}

// 批量退回所有错误机构（包含异常和警告）
export const batchReturnAllErrorOrgs = (reportTaskId: number, extraNote?: string) => {
  return request.post<BatchReturnResultVO>({
    url: '/admin/drug/post-qc/batch-return-all-errors',
    params: {
      reportTaskId,
      extraNote
    }
  })
}

// 数据定版
export const finalizeData = (reportId: number) => {
  return request.post({ url: '/admin/drug/post-qc/finalize', params: { reportId } })
}


// 获取规则机构错误详情列表（分页）
export const getRuleOrgErrorList = (taskId: number, ruleCode: string, pageNo: number, pageSize: number) => {
  return request.get({ 
    url: '/admin/drug/post-qc/rule-org-error-list', 
    params: { taskId, ruleCode, pageNo, pageSize } 
  })
}

// 后置质控错误详情（单条错误记录）
export interface PostQcErrorDetail {
  id: number
  tableType: string
  tableTypeName: string
  dataId: number | null
  excelRowNum: number | null
  errorMessage: string
}

// 后置质控规则分组（包含错误详情列表）
export interface PostQcRuleGroup {
  ruleId: number
  ruleCode: string
  ruleName: string
  ruleDescription: string
  executeAction: string  // MARK_ANOMALY-异常, WARNING-警告
  errorCount: number     // 总错误数
  anomalyCount: number   // 异常数量（check_status=3）
  warningCount: number   // 警告数量（check_status=2）
  errorDetails: PostQcErrorDetail[]
}

export interface PostQcOrgErrorGroupedVO {
  taskId: number
  deptId: number
  deptName: string
  totalErrors: number  // 改为 totalErrors
  ruleGroups: PostQcRuleGroup[]
}

// 获取机构后置质控错误分组详情
export const getOrgPostQcErrorsGrouped = (taskId: number) => {
  return request.get({ 
    url: '/admin/drug/post-qc/org-errors-grouped', 
    params: { taskId } 
  })
}

// 退回机构市属统计VO
export interface CityStatistics {
  cityName: string
  primaryCount: number
  secondaryCount: number
  tertiaryCount: number
  totalCount: number
}

export interface PostQcReturnCityStatisticsVO {
  cityStatisticsList: CityStatistics[]
  totalStatistics: CityStatistics
}

// 获取退回机构市属统计表
export const getReturnCityStatistics = (reportTaskId: number) => {
  return request.get<PostQcReturnCityStatisticsVO>({ 
    url: '/admin/drug/post-qc/return-city-statistics', 
    params: { reportTaskId } 
  })
}

// 导出规则机构列表Excel
export const exportRuleOrgList = (reportTaskId: number, ruleCode: string) => {
  return request.download({
    url: '/admin/drug/post-qc/export-rule-org-list',
    params: { reportTaskId, ruleCode }
  })
}
