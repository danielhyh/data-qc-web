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
  externalId?: string
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
  deptAddressCode?: string
  orgCode?: string
  socialCreditCode?: string
  practiceLicenseNo?: string
  approvalRegistrationNo?: string
  address?: string
  postalCode?: string
  description?: string
  grassrootsInstitution?: number
  isMonitoringRequired?: number
  adminCategory?: string
  deptType?: string
  area?: string
  hasChildren?: boolean // 是否有子节点
}

// 查询部门（精简)列表
export const getSimpleDeptList = async (regionId?: number): Promise<DeptVO[]> => {
  const params = regionId ? { regionId } : {}
  return await request.get({ url: '/system/dept/simple-list', params })
}

export interface DeptPageParam extends PageParam {
  name?: string
  status?: number
  areaCode?: string
  hospitalLevel?: string
  institutionCategory?: string
  excludeUnableReport?: boolean
  [key: string]: any
}

// 查询部门列表（树形）
export const getDeptList = async (params: any) => {
  return await request.get({ url: '/system/dept/list', params })
}

// 查询部门分页列表
export const getDeptPage = async (params: DeptPageParam) => {
  return await request.get({ url: '/system/dept/page', params })
}

// 获取所有符合条件的部门ID（用于全选）
export const getAllDeptIds = async (params: DeptPageParam) => {
  return await request.get({ url: '/system/dept/all-ids', params })
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

// 更新部门状态
export const updateDeptStatus = async (id: number, status: number) => {
  return await request.put({ url: '/system/dept/update-status', params: { id, status } })
}

// 更新部门排序
export const updateDeptSort = async (id: number, sort: number) => {
  return await request.put({ url: '/system/dept/update-sort', params: { id, sort } })
}

// 导入机构
export const importDept = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return await request.upload({ url: '/system/dept/import', data: formData })
}

// 下载导入模板
export const importTemplate = async () => {
  return await request.download({ url: '/system/dept/get-import-template' })
}