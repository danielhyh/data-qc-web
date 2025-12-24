import request from '@/config/axios'

// 区域 VO
export interface RegionsVO {
  id: number // 主键
  parentId: number // 父级id
  code: string // 区划行政代码
  name: string // 区域名称
  level: number // 区域等级
  path: string // 路径
  nodeType: string // 节点类型
  sortOrder: number // 排序号
  createTime?: string // 创建时间
}

export interface AreaOrgTreeNode {
  code: string
  name: string
  level?: number
  nodeType?: string
  directOrgCount?: number
  totalOrgCount?: number
  children?: AreaOrgTreeNode[]
}

// 区域 API
export const RegionsApi = {
  // 查询区域分页
  getRegionsPage: async (params: any) => {
    return await request.get({ url: `/system/regions/page`, params })
  },

  // 查询区域详情
  getRegions: async (id: number) => {
    return await request.get({ url: `/system/regions/get?id=` + id })
  },

  // 新增区域
  createRegions: async (data: RegionsVO) => {
    return await request.post({ url: `/system/regions/create`, data })
  },

  // 修改区域
  updateRegions: async (data: RegionsVO) => {
    return await request.put({ url: `/system/regions/update`, data })
  },

  // 删除区域
  deleteRegions: async (id: number) => {
    return await request.delete({ url: `/system/regions/delete?id=` + id })
  },

  // 导出区域 Excel
  exportRegions: async (params) => {
    return await request.download({ url: `/system/regions/export-excel`, params })
  },

  // 获取区域精简信息列表
  getSimpleRegionsList: async () => {
    return await request.get({ url: `/system/regions/simple-list` })
  },

  // 获取区域树(带机构数量)
  getRegionsTreeWithOrgCount: async (excludeModuleCode?: string, onlyMedical?: boolean) => {
    return await request.get<AreaOrgTreeNode[]>({ 
      url: `/system/area-org/area-tree`,
      params: { excludeModuleCode, onlyMedical }
    })
  },
}
