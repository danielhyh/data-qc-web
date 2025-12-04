import request from '@/config/axios'

// 无法上报机构 VO
export interface MonitoringUnableReportVO {
  id: number // 主键ID
  deptId: number // 部门ID，关联system_dept表
  deptName?: string // 机构名称
  orgCode?: string // 机构代码
  regionName?: string // 行政区划
  institutionCategory?: string // 机构类别
  moduleCode: string // 模块编码: shortage-短缺, monitoring-监测
  unableReportReason: string // 无法上报原因
  remark?: string // 备注说明
  creator?: string // 设置人
  createTime?: Date // 设置时间
}

// 无法上报机构 API
export const MonitoringUnableReportApi = {
  // 查询无法上报机构分页
  getMonitoringUnableReportPage: async (params: any) => {
    return await request.get({ url: `/system/monitoring-unable-report/page`, params })
  },

  // 查询无法上报机构详情
  getMonitoringUnableReport: async (id: number) => {
    return await request.get({ url: `/system/monitoring-unable-report/get?id=` + id })
  },

  // 新增无法上报机构
  createMonitoringUnableReport: async (data: MonitoringUnableReportVO) => {
    return await request.post({ url: `/system/monitoring-unable-report/create`, data })
  },

  // 修改无法上报机构
  updateMonitoringUnableReport: async (data: MonitoringUnableReportVO) => {
    return await request.put({ url: `/system/monitoring-unable-report/update`, data })
  },

  // 删除无法上报机构
  deleteMonitoringUnableReport: async (id: number) => {
    return await request.delete({ url: `/system/monitoring-unable-report/delete?id=` + id })
  },

  // 导出无法上报机构 Excel
  exportMonitoringUnableReport: async (params) => {
    return await request.download({ url: `/system/monitoring-unable-report/export-excel`, params })
  }
}
