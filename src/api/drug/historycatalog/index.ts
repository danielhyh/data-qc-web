import request from '@/config/axios'

// 药品目录--历史 VO
export interface HistoryCatalogVO {
  id: number // 主键ID
  taskId: number // 导入任务ID
  uploadDate: string // 数据上报日期
  domainCode: string // 省级行政区划代码
  organizationCode: string // 组织机构代码
  hospitalCode: string // 医疗机构代码
  organizationName: string // 组织机构名称
  hospitalName: string // 医疗机构名称
  ypid: string // 国家药管平台药品编码(YPID)
  hospitalDrugId: string // 院内药品唯一码
  provinceDrugId: string // 省级药品集中采购平台药品编码
  approvalNumber: string // 批准文号
  drugName: string // 品种通用名（不含剂型）
  productName: string // 产品名称
  tradeName: string // 商品名
  tradeNameEn: string // 商品名（英文）
  manufacturer: string // 生产企业
  drugForm: string // 剂型名称
  drugSpec: string // 制剂规格
  dosageUnit: string // 制剂单位
  packUnit: string // 最小销售包装单位
  conversionFactor: number // 转换系数
  isCentralizedPurchase: string // 是否网上集中采购药品:1-是,2-否
  isBasicDrug: string // 是否基本药物:1-是,2-否
  isConsistencyEvaluation: string // 是否通过一致性评价:1-是,2-否
  qcStatus: number // 质控状态:0-未质控,1-质控通过,2-质控失败
  qcResult: string // 质控结果详情(JSON格式)
  errorMessage: string // 错误信息
  ypidMatchStatus: number // YPID匹配状态:0-未匹配,1-自动匹配,2-手动匹配,3-匹配失败
  deptId: number // 部门id
  reportYear: number // 报告年份
}

// 药品目录--历史 API
export const HistoryCatalogApi = {
  // 查询药品目录--历史分页
  getHistoryCatalogPage: async (params: any) => {
    return await request.get({ url: `/drug/history-catalog/page`, params })
  },

  // 查询药品目录--历史详情
  getHistoryCatalog: async (id: number) => {
    return await request.get({ url: `/drug/history-catalog/get?id=` + id })
  },

  // 新增药品目录--历史
  createHistoryCatalog: async (data: HistoryCatalogVO) => {
    return await request.post({ url: `/drug/history-catalog/create`, data })
  },

  // 修改药品目录--历史
  updateHistoryCatalog: async (data: HistoryCatalogVO) => {
    return await request.put({ url: `/drug/history-catalog/update`, data })
  },

  // 删除药品目录--历史
  deleteHistoryCatalog: async (id: number) => {
    return await request.delete({ url: `/drug/history-catalog/delete?id=` + id })
  },

  // 导出药品目录--历史 Excel
  exportHistoryCatalog: async (params) => {
    return await request.download({ url: `/drug/history-catalog/export-excel`, params })
  },
}