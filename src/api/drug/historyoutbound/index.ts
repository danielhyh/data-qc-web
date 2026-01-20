import request from '@/config/axios'

// 药品出库情况-历史 VO
export interface HistoryOutboundVO {
  id: number // 主键ID
  taskId: number // 导入任务ID
  uploadDate: string // 数据上报日期
  domainCode: string // 省级行政区划代码
  organizationCode: string // 组织机构代码
  hospitalCode: string // 医疗机构代码
  organizationName: string // 组织机构名称
  ypid: string // 国家药管平台药品编码(YPID)
  hospitalDrugId: string // 院内药品唯一码
  provinceDrugId: string // 省级药品集中采购平台药品编码
  productName: string // 产品名称
  outboundDate: Date // 出库日期
  outboundPackQuantity: number // 出库数量（最小销售包装单位）
  outboundDosageQuantity: number // 出库数量（最小制剂单位）
  qcStatus: number // 质控状态:0-未质控,1-质控通过,2-质控失败
  qcResult: string // 质控结果详情(JSON格式)
  errorMessage: string // 错误信息
  deptId: number // 部门id
  reportYear: number // 年份
}

// 药品出库情况-历史 API
export const HistoryOutboundApi = {
  // 查询药品出库情况-历史分页
  getHistoryOutboundPage: async (params: any) => {
    return await request.get({ url: `/drug/history-outbound/page`, params })
  },

  // 查询药品出库情况-历史详情
  getHistoryOutbound: async (id: number) => {
    return await request.get({ url: `/drug/history-outbound/get?id=` + id })
  },

  // 新增药品出库情况-历史
  createHistoryOutbound: async (data: HistoryOutboundVO) => {
    return await request.post({ url: `/drug/history-outbound/create`, data })
  },

  // 修改药品出库情况-历史
  updateHistoryOutbound: async (data: HistoryOutboundVO) => {
    return await request.put({ url: `/drug/history-outbound/update`, data })
  },

  // 删除药品出库情况-历史
  deleteHistoryOutbound: async (id: number) => {
    return await request.delete({ url: `/drug/history-outbound/delete?id=` + id })
  },

  // 导出药品出库情况-历史 Excel
  exportHistoryOutbound: async (params) => {
    return await request.download({ url: `/drug/history-outbound/export-excel`, params })
  },
}