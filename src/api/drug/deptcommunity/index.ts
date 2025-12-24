import request from '@/config/axios'

// 紧密医疗共同体 VO
export interface DeptCommunityVO {
  id: number // 主键
  masterId: number // 牵头单位
  memberId: number // 成员单位
  memberName?: string // 成员单位名称（可选）
  sortNum: number // 排序
}

// 部门 VO（用于返回可选的成员单位列表）
export interface DeptRespVO {
  id: number // 部门ID
  name: string // 部门名称
  parentId: number // 父部门ID
}

// 紧密医疗共同体 API
export const DeptCommunityApi = {
  // 查询紧密医疗共同体分页
  getDeptCommunityPage: async (params: any) => {
    return await request.get({ url: `/drug/dept-community/page`, params })
  },

  // 查询紧密医疗共同体详情
  getDeptCommunity: async (id: number) => {
    return await request.get({ url: `/drug/dept-community/get?id=` + id })
  },

  // 新增紧密医疗共同体
  createDeptCommunity: async (data: DeptCommunityVO) => {
    return await request.post({ url: `/drug/dept-community/create`, data })
  },

  // 修改紧密医疗共同体
  updateDeptCommunity: async (data: DeptCommunityVO) => {
    return await request.put({ url: `/drug/dept-community/update`, data })
  },

  // 删除紧密医疗共同体
  deleteDeptCommunity: async (id: number) => {
    return await request.delete({ url: `/drug/dept-community/delete?id=` + id })
  },

  // 导出紧密医疗共同体 Excel
  exportDeptCommunity: async (params) => {
    return await request.download({ url: `/drug/dept-community/export-excel`, params })
  },

  // 获取可加入紧密医疗共同体的部门列表
  getAvailableDepts: async (masterId: number) => {
    console.log('Calling getAvailableDepts API with masterId:', masterId) // 调试日志
    const result = await request.get({ url: `/drug/dept-community/get-available-depts`, params: { masterId } })
    console.log('getAvailableDepts API response:', result) // 调试日志
    return result
  },

  // 根据牵头单位ID查询紧密医疗共同体成员单位列表（包含成员单位名称）
  getDeptCommunityListByMasterId: async (params: any) => {
    return await request.get({ url: `/drug/dept-community/get-by-master-id`, params })
  },
}