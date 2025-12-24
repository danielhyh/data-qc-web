import request from '@/config/axios'

// 紧密医疗共同体 VO
export interface DeptCommunityVO {
  id: number // 主键
  masterId: number // 牵头单位
  memberId: number // 成员单位
  sortNum: number // 排序
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
}