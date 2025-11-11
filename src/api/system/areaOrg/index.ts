import request from '@/config/axios'

// 区域机构相关 API

export interface AreaNode {
  code: string
  name: string
  level: number
  nodeType?: string
  directOrgCount?: number
  totalOrgCount?: number
  children?: AreaNode[]
}

export interface OrgItem {
  id: number
  name: string
  areaCode: string
  parentName?: string
  hasReported?: boolean
  orgType?: string
  status: number
  userCount?: number
}

// 获取区域树（完整树，包含所有子节点）
export const getAreaTree = () => {
  return request.get<AreaNode[]>({ url: '/system/area-org/area-tree' })
}

// 获取区域树顶级节点（懒加载）
export const getAreaTreeLazy = () => {
  return request.get<AreaNode[]>({ url: '/system/area-org/area-tree-lazy' })
}

// 获取区域的子节点（懒加载）
export const getAreaChildren = (areaCode: string) => {
  return request.get<AreaNode[]>({
    url: '/system/area-org/area-children',
    params: { areaCode }
  })
}

// 获取指定区域下的机构列表
export const getOrgListByArea = (areaCode: string) => {
  return request.get<OrgItem[]>({ 
    url: '/system/area-org/org-list',
    params: { areaCode }
  })
}

// 获取区域信息
export const getAreaInfo = (areaCode: string) => {
  return request.get({ 
    url: '/system/area-org/area-info',
    params: { areaCode }
  })
}