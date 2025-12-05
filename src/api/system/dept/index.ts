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
  regionPathName?: string // 区域路径中文名称（简化为市/区县）
  regionName?: string
  areaName?: string
  institutionId?: string
  institutionCategory?: string
  hospitalLevel?: string
  hospitalLevelJ?: string // 医院等级-级
  hospitalGrade?: string // 医院等级-等
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
  deptClass?: string // 机构分类代码
  deptClassName?: string // 机构分类名称
  area?: string
  businessType?: string // 业务类型: BOTH/SHORTAGE/MONITOR
  adminLevel?: number // 管理级别: 0-非管理机构, 1-省级, 2-市级, 3-区县级
  hasChildren?: boolean // 是否有子节点
  // 用户关联字段
  userId?: number
  username?: string
  userStatus?: number
  loginDate?: Date
  // 树形结构子节点
  children?: DeptVO[]
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
  hospitalLevels?: string[] // 支持多个等级筛选
  institutionCategory?: string
  excludeUnableReport?: boolean
  excludeModuleCode?: string // 排除指定模块的无法上报机构，如 'SHORTAGE'
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

// 树列表查询参数
export interface DeptTreeListParam {
  keyword?: string
  status?: number
  areaCode?: string
  adminLevel?: number
  businessType?: string
  hospitalLevelJ?: string
  deptClass?: string
}

// 查询机构树列表（全量，用于虚拟列表）
export const getDeptTreeList = async (params: DeptTreeListParam): Promise<DeptVO[]> => {
  return await request.get({ url: '/system/dept/tree-list', params })
}

// 导出机构列表
export const exportDeptList = async (params: DeptTreeListParam) => {
  return await request.download({ url: '/system/dept/export', params })
}