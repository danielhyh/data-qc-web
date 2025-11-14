import request from '@/config/axios'

// 机构填报任务 VO
export interface ReportTaskVO {
  id?: number // 编号
  year: number // 年份
  zoneId?: number // 填报专区ID
  reportWeek: string // 填报周期(YYYY-WW)
  currentPeriodRange?: string // 统计时间范围范围（例如：11月10日-11月15日）
  reportStatus: number // 填报状态: 0-填报中 1-草稿 2-已提交 3-已逾期 4-准备中
  submitTime?: string // 提交时间
  startTime?: string // 填报开始时间
  deadlineTime?: string // 填报截止时间
  completionRate?: number // 填报完成度(%)
  remark?: string // 备注
  // 前端显示用字段
  zoneName?: string // 专区名称
  remainingTime?: string // 剩余时间
}

// 机构填报任务 API
export const ReportTaskApi = {
  // 查询机构填报任务分页
  getReportTaskPage: async (params: any) => {
    return await request.get({ url: `/shortage/report-task/page`, params })
  },

  // 查询机构填报任务详情
  getReportTask: async (id: number) => {
    return await request.get({ url: `/shortage/report-task/get?id=` + id })
  },

  // 新增机构填报任务
  createReportTask: async (data: ReportTaskVO) => {
    return await request.post({ url: `/shortage/report-task/create`, data })
  },

  // 修改机构填报任务
  updateReportTask: async (data: ReportTaskVO) => {
    return await request.put({ url: `/shortage/report-task/update`, data })
  },

  // 删除机构填报任务
  deleteReportTask: async (id: number) => {
    return await request.delete({ url: `/shortage/report-task/delete?id=` + id })
  },

  // 导出机构填报任务 Excel
  exportReportTask: async (params) => {
    return await request.download({ url: `/shortage/report-task/export-excel`, params })
  },

  // 获取填报任务年份列表
  getReportTaskYears: async () => {
    return await request.get({ url: `/shortage/report-task/years` })
  }
}
