import request from '@/config/axios'

/** 药品上报日志 VO */
export interface ReportLogVO {
  id: number // 日志ID
  taskId: number // 任务ID
  operationType: number // 操作类型
  operationStatus: number // 操作状态
  operatorType: number // 操作人类型
  operatorId: number // 操作人ID
  operatorName: string // 操作人名称（昵称/机构名）
  operatorRealName: string // 操作人真实姓名
  operationDetail: string // 操作详情JSON
  errorMessage: string // 错误信息
  executionTime: number // 执行耗时
  createTime: Date // 创建时间
}

/** 操作类型枚举 */
export enum OperationTypeEnum {
  FILE_UPLOAD = 1, // 文件上传
  PRE_QC = 2, // 前置质控
  SUBMIT_REPORT = 3, // 提交上报
  APPROVE = 4, // 审核通过
  REJECT = 5, // 审核驳回
  POST_QC = 6, // 后置质控
  SUBMIT_NATIONAL = 7 // 提交国家平台
}

/** 操作状态枚举 */
export enum OperationStatusEnum {
  PROCESSING = 0, // 进行中
  SUCCESS = 1, // 成功
  FAIL = 2, // 失败
  WARNING = 3 // 警告
}

/** 操作人类型枚举 */
export enum OperatorTypeEnum {
  USER = 1, // 用户
  SYSTEM = 2 // 系统自动
}

// 查询药品上报日志列表
export const getReportLogPage = async (params: any) => {
  return await request.get({ url: '/drug/report-log/page', params })
}

// 根据任务ID查询日志列表
export const getReportLogListByTaskId = async (taskId: number) => {
  return await request.get({ url: `/drug/report-log/list-by-task/${taskId}` })
}

// 查询药品上报日志详情
export const getReportLog = async (id: number) => {
  return await request.get({ url: `/drug/report-log/get?id=${id}` })
}

// 新增药品上报日志
export const createReportLog = async (data: ReportLogVO) => {
  return await request.post({ url: '/drug/report-log/create', data })
}

// 修改药品上报日志
export const updateReportLog = async (data: ReportLogVO) => {
  return await request.put({ url: '/drug/report-log/update', data })
}

// 删除药品上报日志
export const deleteReportLog = async (id: number) => {
  return await request.delete({ url: `/drug/report-log/delete?id=${id}` })
}

// 导出药品上报日志 Excel
export const exportReportLog = async (params) => {
  return await request.download({ url: '/drug/report-log/export-excel', params })
}