import request from '@/config/axios'

// 专区药品配置 VO
export interface DrugConfigVO {
  id: number // 编码
  zoneId: number // 专区ID
  drugName: string // 药品名称
  drugCategory: string // 药品分类
  dosageCategory: string // 剂型规格
  dosageForm: string // 剂型
  dosageUnit: string // 最小剂量单位
  status: number // 启动状态: 0-开启 1-停用
  sortOrder: number // 排序
}

// 专区药品配置 API
export const DrugConfigApi = {
  // 查询专区药品配置分页
  getPage: async (params: any) => {
    return await request.get({ url: `/shortage/drug-config/page`, params })
  },

  // 查询专区药品配置详情
  get: async (id: number) => {
    return await request.get({ url: `/shortage/drug-config/get?id=` + id })
  },

  // 新增专区药品配置
  create: async (data: DrugConfigVO) => {
    return await request.post({ url: `/shortage/drug-config/create`, data })
  },

  // 修改专区药品配置
  update: async (data: DrugConfigVO) => {
    return await request.put({ url: `/shortage/drug-config/update`, data })
  },

  // 删除专区药品配置
  delete: async (id: number) => {
    return await request.delete({ url: `/shortage/drug-config/delete?id=` + id })
  },

  // 导出专区药品配置 Excel
  exportExcel: async (params) => {
    return await request.download({ url: `/shortage/drug-config/export-excel`, params })
  },
}
