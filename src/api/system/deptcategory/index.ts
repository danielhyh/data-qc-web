import request from '@/config/axios'

// 机构分类字典 VO
export interface DeptCategoryVO {
  id: number // 主键ID
  code: string // 分类编码
  name: string // 分类名称
  parentId: number // 父级ID
  level: number // 层级
  sortOrder: number // 排序号
  status: number // 状态(0正常 1停用)
}

// 机构分类字典 API
export const DeptCategoryApi = {
  // 查询机构分类字典列表
  getDeptCategoryList: async (params) => {
    return await request.get({ url: `/system/dept-category/list`, params })
  },

  // 查询机构分类字典详情
  getDeptCategory: async (id: number) => {
    return await request.get({ url: `/system/dept-category/get?id=` + id })
  },

  // 新增机构分类字典
  createDeptCategory: async (data: DeptCategoryVO) => {
    return await request.post({ url: `/system/dept-category/create`, data })
  },

  // 修改机构分类字典
  updateDeptCategory: async (data: DeptCategoryVO) => {
    return await request.put({ url: `/system/dept-category/update`, data })
  },

  // 删除机构分类字典
  deleteDeptCategory: async (id: number) => {
    return await request.delete({ url: `/system/dept-category/delete?id=` + id })
  },

  // 导出机构分类字典 Excel
  exportDeptCategory: async (params) => {
    return await request.download({ url: `/system/dept-category/export-excel`, params })
  },

  // 更新机构分类状态
  updateDeptCategoryStatus: async (id: number, status: number) => {
    return await request.put({ url: `/system/dept-category/update-status?id=${id}&status=${status}` })
  },

  // 更新机构分类排序
  updateDeptCategorySort: async (id: number, sortOrder: number) => {
    return await request.put({ url: `/system/dept-category/update-sort?id=${id}&sortOrder=${sortOrder}` })
  },
}
