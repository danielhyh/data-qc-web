import request from '@/config/axios'

// 药品分类 VO
export interface DrugCategoryVO {
  id: number // 编码
  categoryName: string // 分类名称
  drugName: string // 药品名称
  dosageCategory?: string // 剂型规格
  dosageForm?: string // 统计单位
  dosageUnit?: string // 最小剂量单位
  sortOrder: number // 排序
  status: number // 启用状态: 0-启用 1-停用
  createTime: Date // 创建时间
}

// 剂型规格信息
export interface DosageInfo {
  dosageCategory: string // 剂型规格
  dosageForm: string // 统计单位
}

// 批量创建 VO
export interface DrugCategoryBatchSaveVO {
  categoryName: string // 分类名称
  drugName: string // 药品名称
  dosageInfos: DosageInfo[] // 剂型规格列表
  sortOrder: number // 排序
  status: number // 状态
}

// 药品分类 API
export const DrugCategoryApi = {
  // 查询药品分类分页
  getPage: async (params: any) => {
    return await request.get({ url: `/shortage/drug-category/page`, params })
  },

  // 查询药品分类详情
  get: async (id: number) => {
    return await request.get({ url: `/shortage/drug-category/get?id=` + id })
  },

  // 新增药品分类
  create: async (data: DrugCategoryVO) => {
    return await request.post({ url: `/shortage/drug-category/create`, data })
  },

  // 修改药品分类
  update: async (data: DrugCategoryVO) => {
    return await request.put({ url: `/shortage/drug-category/update`, data })
  },

  // 删除药品分类
  delete: async (id: number) => {
    return await request.delete({ url: `/shortage/drug-category/delete?id=` + id })
  },

  // 更新药品分类状态
  updateStatus: async (id: number, status: number) => {
    return await request.put({ url: `/shortage/drug-category/update-status`, data: { id, status } })
  },

  // 更新药品分类排序
  updateSortOrder: async (id: number, sortOrder: number) => {
    return await request.put({ url: `/shortage/drug-category/update-sort-order`, data: { id, sortOrder } })
  },

  // 获取所有分类名称
  getCategoryNames: async () => {
    return await request.get({ url: `/shortage/drug-category/category-names` })
  },

  // 根据分类获取药品名称列表
  getDrugsByCategory: async (categoryName: string) => {
    return await request.get({ url: `/shortage/drug-category/drugs-by-category?categoryName=` + categoryName })
  },

  // 根据分类获取完整药品列表（用于批量导入预览）
  getDrugListByCategory: async (categoryName: string): Promise<DrugCategoryVO[]> => {
    const params = { categoryName, status: 0, pageNo: 1, pageSize: -1 }
    const result = await request.get({ url: `/shortage/drug-category/page`, params })
    return result.list || []
  },

  // 批量创建药品分类（支持一个药品多个剂型规格）
  batchCreate: async (data: DrugCategoryBatchSaveVO) => {
    return await request.post({ url: `/shortage/drug-category/batch-create`, data })
  },

  // 根据分类和药品名称获取该药品的所有剂型规格记录
  getListByDrug: async (categoryName: string, drugName: string): Promise<DrugCategoryVO[]> => {
    return await request.get({ 
      url: `/shortage/drug-category/list-by-drug`, 
      params: { categoryName, drugName } 
    })
  },

  // 批量更新药品分类（先删除该药品所有记录，再批量创建）
  batchUpdate: async (data: DrugCategoryBatchSaveVO, originalCategoryName: string, originalDrugName: string) => {
    return await request.put({ 
      url: `/shortage/drug-category/batch-update`, 
      data: { data, originalCategoryName, originalDrugName } 
    })
  }
}
