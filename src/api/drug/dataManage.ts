import request from '@/config/axios'

export interface DataManageImportTaskVO {
  id?: number
  taskNo?: string
  taskName?: string
  fileName?: string
  status?: number
  totalFiles?: number
  totalRecords?: number
  description?: string
  deptId?: number
  deptName?: string
  orgCode?: string // 机构代码
  cityName?: string
  districtName?: string
  hospitalLevelJ?: string // 等级
  hospitalGrade?: string // 等次
  contactPerson?: string
  contactPhone?: string
  reportStatus?: number
  reportProgress?: number // 上报进度
  regionCode?: string
  createTime?: Date[]
  creator?: string
}

export interface ReportTaskVO {
  id?: number
  taskName?: string
  reportYear?: number
  startDate?: Date
  endDate?: Date
  status?: number
  description?: string
  createTime?: Date
}

// 查询药品数据导入任务分页（含机构信息）
export const getDataManageImportTaskPage = async (params: any) => {
  return await request.get({ url: '/drug/data-manage/import-task/page', params })
}

// 导出药品数据导入任务 Excel（含机构信息）
export const exportDataManageImportTask = async (params: any) => {
  return await request.download({
    url: '/drug/data-manage/import-task/export-excel',
    params
  })
}

// 获取填报任务列表
export const getReportTaskList = async () => {
  return await request.get({ url: '/drug/data-manage/report-task/list' })
}

// 执行后置质控
export const executePostQc = async (id: number) => {
  return await request.post({ url: '/drug/data-manage/import-task/post-qc', params: { id } })
}

// 驳回任务
export const rejectTask = async (id: number, reason?: string) => {
  const params: any = { id }
  if (reason) {
    params.reason = reason
  }
  return await request.post({ url: '/drug/data-manage/import-task/reject', params })
}

// 通过任务
export const approveTask = async (id: number) => {
  return await request.post({ url: '/drug/data-manage/import-task/approve', params: { id } })
}

// 批量执行后置质控
export const batchExecutePostQc = async (ids: number[]) => {
  return await request.post({ url: '/drug/data-manage/import-task/batch-post-qc', data: ids })
}

// 批量驳回任务
export const batchRejectTask = async (ids: number[], reason?: string) => {
  const params: any = {}
  if (reason) {
    params.reason = reason
  }
  return await request.post({ url: '/drug/data-manage/import-task/batch-reject', data: ids, params })
}

// 批量通过任务
export const batchApproveTask = async (ids: number[]) => {
  return await request.post({ url: '/drug/data-manage/import-task/batch-approve', data: ids })
}
