import request from '@/config/axios'

// 药品入库情况-历史 VO
export interface HistoryInboundVO {
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
  inboundDate: Date // 入库日期
  inboundPackQuantity: number // 入库数量（最小销售包装单位）
  inboundDosageQuantity: number // 入库数量（最小制剂单位）
  inboundTotalAmount: number // 入库总金额（元）
  inboundPackPrice: number // 入库价格（最小销售包装单位）
  inboundDosagePrice: number // 入库价格（最小制剂单位）
  qcStatus: number // 质控状态:0-未质控,1-质控通过,2-质控失败
  qcResult: string // 质控结果详情(JSON格式)
  errorMessage: string // 错误信息
  priceStatus: number // 价格状态:0-正常,1-价格过高,2-价格过低
  reportYear: number // 年份
  deptId: number // 部门id
}

// 药品入库情况-历史 API
export const HistoryInboundApi = {
  // 查询药品入库情况-历史分页
  getHistoryInboundPage: async (params: any) => {
    return await request.get({ url: `/drug/history-inbound/page`, params })
  },

  // 查询药品入库情况-历史详情
  getHistoryInbound: async (id: number) => {
    return await request.get({ url: `/drug/history-inbound/get?id=` + id })
  },

  // 新增药品入库情况-历史
  createHistoryInbound: async (data: HistoryInboundVO) => {
    return await request.post({ url: `/drug/history-inbound/create`, data })
  },

  // 修改药品入库情况-历史
  updateHistoryInbound: async (data: HistoryInboundVO) => {
    return await request.put({ url: `/drug/history-inbound/update`, data })
  },

  // 删除药品入库情况-历史
  deleteHistoryInbound: async (id: number) => {
    return await request.delete({ url: `/drug/history-inbound/delete?id=` + id })
  },

  // 导出药品入库情况-历史 Excel
  exportHistoryInbound: async (params) => {
    return await request.download({ url: `/drug/history-inbound/export-excel`, params })
  },
}