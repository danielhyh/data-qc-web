import request from '@/config/axios'

export interface DeptVO {
  id?: number
  name: string
  parentId: number
  status: number
  sort: number
  leaderUser: number
  phone: string
  email: string
  createTime: Date
  regionId?: number
  regionCode?: string
  regionPath?: string
  regionPathName?: string // 区域路径中文名称
  regionName?: string
  areaName?: string
  institutionId?: string
  institutionCategory?: string
  hospitalLevel?: string
  contactPerson?: string
  contactPhone?: string
  address?: string
  deptType?: string
  area?: string
}

// 查询部门（精简)列表
export const getSimpleDeptList = async (regionId?: number): Promise<DeptVO[]> => {
  const params = regionId ? { regionId } : {}
  return await request.get({ url: '/system/dept/simple-list', params })
}

export interface DeptPageParam extends PageParam {
  areaCode?: string
  [key: string]: any
}

// 查询部门列表
export const getDeptPage = async (params: DeptPageParam) => {
  return await request.get({ url: '/system/dept/list', params })
}

// 查询部门详情
export const getDept = async (id: number) => {
  return await request.get({ url: '/system/dept/get?id=' + id })
}

// 新增部门
export const createDept = async (data: DeptVO) => {
  return await request.post({ url: '/system/dept/create', data: data })
}

// 修改部门
export const updateDept = async (params: DeptVO) => {
  return await request.put({ url: '/system/dept/update', data: params })
}

// 删除部门
export const deleteDept = async (id: number) => {
  return await request.delete({ url: '/system/dept/delete?id=' + id })
}
