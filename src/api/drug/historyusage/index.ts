import request from '@/config/axios'

// 药品使用情况-历史 VO
export interface HistoryUsageVO {
  id: number // 主键ID
  taskId: number // 导入任务ID
  uploadDate: string // 数据上报日期
  organizationCode: string // 组织机构代码
  hospitalCode: string // 医疗机构代码
  organizationName: string // 组织机构名称
  domainCode: string // 省级行政区划代码
  ypid: string // 国家药管平台药品编码(YPID)
  hospitalDrugId: string // 院内药品唯一码
  provinceDrugId: string // 省级药品集中采购平台药品编码
  productName: string // 产品名称
  usageDate: Date // 药品销售日期
  usagePackQuantity: number // 销售数量（最小销售包装单位）
  usageDosageQuantity: number // 销售数量（最小制剂单位）
  usageTotalAmount: number // 销售总金额（元）
  usagePackPrice: number // 销售价格（最小销售包装单位）
  usageDosagePrice: number // 销售价格（最小制剂单位）
  qcStatus: number // 质控状态:0-未质控,1-质控通过,2-质控失败
  qcResult: string // 质控结果详情(JSON格式)
  errorMessage: string // 错误信息
  priceStatus: number // 价格状态:0-正常,1-价格过高,2-价格过低,3-价格异常
  fixStatus: number // 修复状态:0-未修复,1-自动修复,2-手动修复
  fixRule: string // 修复规则标记(如FIX0081)
  deptId: number // 部门id
  reportYear: number // 年份
}

// 药品使用情况-历史 API
export const HistoryUsageApi = {
  // 查询药品使用情况-历史分页
  getHistoryUsagePage: async (params: any) => {
    return await request.get({ url: `/drug/history-usage/page`, params })
  },

  // 查询药品使用情况-历史详情
  getHistoryUsage: async (id: number) => {
    return await request.get({ url: `/drug/history-usage/get?id=` + id })
  },

  // 新增药品使用情况-历史
  createHistoryUsage: async (data: HistoryUsageVO) => {
    return await request.post({ url: `/drug/history-usage/create`, data })
  },

  // 修改药品使用情况-历史
  updateHistoryUsage: async (data: HistoryUsageVO) => {
    return await request.put({ url: `/drug/history-usage/update`, data })
  },

  // 删除药品使用情况-历史
  deleteHistoryUsage: async (id: number) => {
    return await request.delete({ url: `/drug/history-usage/delete?id=` + id })
  },

  // 导出药品使用情况-历史 Excel
  exportHistoryUsage: async (params) => {
    return await request.download({ url: `/drug/history-usage/export-excel`, params })
  },
}