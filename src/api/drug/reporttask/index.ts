import request from '@/config/axios'

// 填报任务设置 VO
export interface ReportTaskVO {
  id: number // 主键ID
  taskName: string // 任务名称
  reportYear: number // 上报年份（系统自动生成）
  startDate: Date // 上报开始时间
  endDate: Date // 上报截止时间
  status: number // 状态：1-未开始 2-进行中 3-已结束 4-已关闭（系统自动计算）
  description: string // 任务描述
}

// 填报任务设置 API
export const ReportTaskApi = {
  // 查询填报任务设置分页
  getReportTaskPage: async (params: any) => {
    return await request.get({ url: `/drug/report-task/page`, params })
  },

  // 查询填报任务设置详情
  getReportTask: async (id: number) => {
    return await request.get({ url: `/drug/report-task/get?id=` + id })
  },

  // 新增填报任务设置
  createReportTask: async (data: ReportTaskVO) => {
    return await request.post({ url: `/drug/report-task/create`, data })
  },

  // 修改填报任务设置
  updateReportTask: async (data: ReportTaskVO) => {
    return await request.put({ url: `/drug/report-task/update`, data })
  },

  // 删除填报任务设置
  deleteReportTask: async (id: number) => {
    return await request.delete({ url: `/drug/report-task/delete?id=` + id })
  },

  // 导出填报任务设置 Excel
  exportReportTask: async (params) => {
    return await request.download({ url: `/drug/report-task/export-excel`, params })
  },

  // 激活任务
  activateTask: async (id: number) => {
    return await request.post({ url: `/drug/report-task/activate?id=` + id })
  },

  // 停用任务
  deactivateTask: async (id: number) => {
    return await request.post({ url: `/drug/report-task/deactivate?id=` + id })
  },

  // 获取当前激活任务
  getCurrentActiveTask: async () => {
    return await request.get({ url: `/drug/report-task/current-active` })
  },
}