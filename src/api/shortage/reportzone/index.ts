import request from '@/config/axios'

// 短缺药品填报专区 VO
export interface ReportZoneVO {
  id: number // 编码
  zoneName: string // 专区名称
  zoneCode: string // 专区编码
  noticeContent: string // 填报通知内容(富文本)
  status: number // 状态: 0-开启 1-停用
  remark: string // 备注说明
  reportableOrgs: string // 可填报的机构
  drugCount?: number // 药品数
  reportCount?: number // 填报次数
}

// 填报专区选项 VO
export interface ReportZoneOptionVO {
  id: number // 专区ID
  zoneName: string // 专区名称
  zoneCode: string // 专区编码
  deadlineTime?: string // 截止时间
}

// 短缺药品填报专区 API
export const ReportZoneApi = {
  // 查询短缺药品填报专区
  getList: async (params: any) => {
    return await request.get({ url: `/shortage/report-zone/list`, params })
  },

  // 查询短缺药品填报专区详情
  get: async (id: number) => {
    return await request.get({ url: `/shortage/report-zone/get?id=` + id })
  },

  // 新增短缺药品填报专区
  create: async (data: ReportZoneVO) => {
    return await request.post({ url: `/shortage/report-zone/create`, data })
  },

  // 修改短缺药品填报专区
  update: async (data: ReportZoneVO) => {
    return await request.put({ url: `/shortage/report-zone/update`, data })
  },

  // 删除短缺药品填报专区
  delete: async (id: number) => {
    return await request.delete({ url: `/shortage/report-zone/delete?id=` + id })
  },

  // 修改短缺药品填报专区状态
  updateStatus: async (id: number, status: number) => {
    return await request.put({ url: `/shortage/report-zone/update-status`, data: { id, status } })
  },

  // 导出短缺药品填报专区 Excel
  exportExcel: async (params) => {
    return await request.download({ url: `/shortage/report-zone/export-excel`, params })
  },

  // 获取可用填报专区选项（status=0）
  getOptions: async () => {
    return await request.get({ url: `/shortage/report-zone/options` })
  }
}
