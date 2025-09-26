import request from '@/config/axios'

// 监测内无法上报机构 VO
export interface MonitoringUnableReportVO {
  id: number // 主键ID
  deptId: number // 部门ID，关联system_dept表
  deptName?: string // 机构名称
  unableReportReason: string // 无法上报原因
  remark: string // 备注说明
  status: number // 状态（0有效 1无效）
  createTime?: Date // 创建时间
}

// 监测内无法上报机构 API
export const MonitoringUnableReportApi = {
  // 查询监测内无法上报机构分页
  getMonitoringUnableReportPage: async (params: any) => {
    return await request.get({ url: `/system/monitoring-unable-report/page`, params })
  },

  // 查询监测内无法上报机构详情
  getMonitoringUnableReport: async (id: number) => {
    return await request.get({ url: `/system/monitoring-unable-report/get?id=` + id })
  },

  // 新增监测内无法上报机构
  createMonitoringUnableReport: async (data: MonitoringUnableReportVO) => {
    return await request.post({ url: `/system/monitoring-unable-report/create`, data })
  },

  // 修改监测内无法上报机构
  updateMonitoringUnableReport: async (data: MonitoringUnableReportVO) => {
    return await request.put({ url: `/system/monitoring-unable-report/update`, data })
  },

  // 删除监测内无法上报机构
  deleteMonitoringUnableReport: async (id: number) => {
    return await request.delete({ url: `/system/monitoring-unable-report/delete?id=` + id })
  },

  // 导出监测内无法上报机构 Excel
  exportMonitoringUnableReport: async (params) => {
    return await request.download({ url: `/system/monitoring-unable-report/export-excel`, params })
  },
}
