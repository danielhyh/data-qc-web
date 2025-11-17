import request from '@/config/axios'

// 药品填报记录 VO
export interface ReportRecordVO {
  id: number // 编码
  zoneId: number // 专区ID
  drugConfigId: number // 药品配置ID
  orgId: number // 机构ID
  reportWeek: string // 填报周期(YYYY-WW)
  reportDate: Date // 填报日期
  weekUsageAmount: number // 本周累计使用量
  currentStockAmount: number // 当日实时库存量
  supplyStatus: number // 供应情况: 1-充足 2-较充足 3-短缺 4-严重短缺
  notAvailable?: boolean // 本机构未使用此药品
}

// 药品填报记录 API
export const ReportRecordApi = {
  // 查询药品填报记录分页
  getReportRecordPage: async (params: any) => {
    return await request.get({ url: `/shortage/report-record/page`, params })
  },

  // 查询药品填报记录详情
  getReportRecord: async (id: number) => {
    return await request.get({ url: `/shortage/report-record/get?id=` + id })
  },

  // 新增药品填报记录
  createReportRecord: async (data: ReportRecordVO) => {
    return await request.post({ url: `/shortage/report-record/create`, data })
  },

  // 修改药品填报记录
  updateReportRecord: async (data: ReportRecordVO) => {
    return await request.put({ url: `/shortage/report-record/update`, data })
  },

  // 删除药品填报记录
  deleteReportRecord: async (id: number) => {
    return await request.delete({ url: `/shortage/report-record/delete?id=` + id })
  },

  // 导出药品填报记录 Excel
  exportReportRecord: async (params) => {
    return await request.download({ url: `/shortage/report-record/export-excel`, params })
  },

  // 获取填报周期列表
  getReportWeeks: async () => {
    return await request.get({ url: `/shortage/report-record/report-weeks` })
  },

  // 查询填报记录列表（管理端）
  getReportRecordList: async (params: any) => {
    return await request.get({ url: `/shortage/report-record/list-by-region`, params })
  },

  // 获取填报详情（含药品明细）
  getReportRecordDetail: async (taskId: number) => {
    return await request.get({ url: `/shortage/report-record/detail?taskId=` + taskId })
  }
}
