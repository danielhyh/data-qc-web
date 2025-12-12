import request from '@/config/axios'

// 采集周期 VO
export interface ReportPeriodVO {
  id: number // 编码
  zoneId: number // 所属专区ID
  periodCode: string // 周期标识(如:2025-47)
  year: number // 年份
  weekNum: number // 周数
  dataStartTime: Date // 数据开始时间(上周六00:00)
  dataEndTime: Date // 数据截止时间(本周五12:00)
  reportStartTime: Date // 填报开始时间(周五12:00)
  reportEndTime: Date // 正常截止时间(周五18:00)
  supplementEndTime: Date // 补报截止时间(周六23:59)
  status: number // 周期状态: 0-未开始 1-填报中 2-已截止(补报中) 3-已结束
  totalOrgCount: number // 应报机构总数
  submittedCount: number // 已提交机构数(含补报)
  supplementCount: number // 补报机构数
}

// 采集周期 API
export const ReportPeriodApi = {
  // 查询采集周期分页
  getReportPeriodPage: async (params: any) => {
    return await request.get({ url: `/shortage/report-period/page`, params })
  },

  // 查询采集周期详情
  getReportPeriod: async (id: number) => {
    return await request.get({ url: `/shortage/report-period/get?id=` + id })
  },

  // 新增采集周期
  createReportPeriod: async (data: ReportPeriodVO) => {
    return await request.post({ url: `/shortage/report-period/create`, data })
  },

  // 修改采集周期
  updateReportPeriod: async (data: ReportPeriodVO) => {
    return await request.put({ url: `/shortage/report-period/update`, data })
  },

  // 删除采集周期
  deleteReportPeriod: async (id: number) => {
    return await request.delete({ url: `/shortage/report-period/delete?id=` + id })
  },

  // 导出采集周期 Excel
  exportReportPeriod: async (params) => {
    return await request.download({ url: `/shortage/report-period/export-excel`, params })
  },
}
