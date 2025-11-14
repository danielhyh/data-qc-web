import request from '@/config/axios'

// 剂型规格 VO
export interface DosageCategoryVO {
  id: number // 编码
  categoryName: string // 剂型规格名称
  dosageUnit: string // 统计单位
  sortOrder: number // 排序
  status: number // 启用状态: 0-启用 1-停用
  createTime: Date // 创建时间
}

// 剂型规格 API
export const DosageCategoryApi = {
  // 查询剂型规格分页
  getPage: async (params: any) => {
    return await request.get({ url: `/shortage/dosage-category/page`, params })
  },

  // 查询剂型规格详情
  get: async (id: number) => {
    return await request.get({ url: `/shortage/dosage-category/get?id=` + id })
  },

  // 新增剂型规格
  create: async (data: DosageCategoryVO) => {
    return await request.post({ url: `/shortage/dosage-category/create`, data })
  },

  // 修改剂型规格
  update: async (data: DosageCategoryVO) => {
    return await request.put({ url: `/shortage/dosage-category/update`, data })
  },

  // 删除剂型规格
  delete: async (id: number) => {
    return await request.delete({ url: `/shortage/dosage-category/delete?id=` + id })
  },

  // 更新剂型规格状态
  updateStatus: async (id: number, status: number) => {
    return await request.put({ url: `/shortage/dosage-category/update-status`, data: { id, status } })
  },

  // 更新剂型规格排序
  updateSortOrder: async (id: number, sortOrder: number) => {
    return await request.put({ url: `/shortage/dosage-category/update-sort-order`, data: { id, sortOrder } })
  },

  // 获取所有剂型规格名称
  getCategoryNames: async () => {
    return await request.get({ url: `/shortage/dosage-category/category-names` })
  },

  // 根据分类获取统计单位列表
  getDosageUnitsByCategory: async (categoryName: string) => {
    return await request.get({ url: `/shortage/dosage-category/dosage-units-by-category?categoryName=` + categoryName })
  }
}
