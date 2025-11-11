import request from '@/config/axios'

// 药品标准库 VO
export interface StandardLibraryVO {
  id: number // 主键ID
  versionId: number // 关联YPID版本表ID
  ypid: string // 国家药管平台药品编码（YPID）
  medicalInsuranceCode: string // 国家医保药品编码
  drugCode: string // 药品本位码
  productName: string // 产品名称
  standardProductName: string // 标化产品名称
  genericNameCn: string // 通用名（中文）
  genericNameEn: string // 通用名（英文）
  tradeName: string // 商品名
  tradeNameEn: string // 商品名（英文）
  manufacturerName: string // 生产企业名称
  manufacturerCode: string // 生产企业编码
  licenseHolder: string // 上市许可持有人
  approvalNumber: string // 批准文号
  dosageForm: string // 剂型名称
  dosageFormCode: string // 剂型规格码
  specification: string // 制剂规格
  standardSpecification: string // 规格标化
  dosageUnit: string // 制剂单位
  minPackageUnit: string // 最小销售包装单位
  packagingMaterial: string // 包装材质
  conversionFactor: number // 转换系数
  isBasicDrug: number // 是否基本药物:0-否,1-是
  drugCategory: string // 药品类别
  pharmacologyCategory: string // 药理/功效分类
  medicalInsuranceType: string // 医保甲乙类
  isCentralizedProcurement: number // 是否集中采购:0-否,1-是
  isConsistencyEvaluation: number // 是否通过一致性评价:0-否,1-是
  isImportedDrug: number // 是否进口药:0-否,1-是
  status: number // 状态:1-启用,2-停用,3-已删除
  effectiveDate: Date // 生效日期
  expiryDate: Date // 失效日期
}

// 药品标准库 API
export const StandardLibraryApi = {
  // 查询药品标准库分页
  getStandardLibraryPage: async (params: any) => {
    return await request.get({ url: `/drug/standard-library/page`, params })
  },

  // 查询药品标准库详情
  getStandardLibrary: async (id: number) => {
    return await request.get({ url: `/drug/standard-library/get?id=` + id })
  },

  // 新增药品标准库
  createStandardLibrary: async (data: StandardLibraryVO) => {
    return await request.post({ url: `/drug/standard-library/create`, data })
  },

  // 修改药品标准库
  updateStandardLibrary: async (data: StandardLibraryVO) => {
    return await request.put({ url: `/drug/standard-library/update`, data })
  },

  // 删除药品标准库
  deleteStandardLibrary: async (id: number) => {
    return await request.delete({ url: `/drug/standard-library/delete?id=` + id })
  },

  // 导出药品标准库 Excel
  exportStandardLibrary: async (params) => {
    return await request.download({ url: `/drug/standard-library/export-excel`, params })
  },

  // 获取药品类别去重列表
  getDrugCategories: async (versionId?: number) => {
    return await request.get({ url: `/drug/standard-library/drug-categories`, params: { versionId } })
  }
}
