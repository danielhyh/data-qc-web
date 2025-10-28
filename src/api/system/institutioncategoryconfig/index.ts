import request from '@/config/axios'

// 机构行政归属配置 VO
export interface InstitutionCategoryConfigVO {
  id: number // 主键ID
  institutionName: string // 机构名称（用于匹配）
  category: string // 行政管理归属：委直/委管/部队等
  level: string // 机构级别：三级/二级等
  medicalCategory: string // 医疗类别：综合医院/专科医院等
  status: number // 状态：0-启用 1-禁用
  remark: string // 备注
}

// 机构行政归属配置 API
export const InstitutionCategoryConfigApi = {
  // 查询机构行政归属配置分页
  getInstitutionCategoryConfigPage: async (params: any) => {
    return await request.get({ url: `/system/institution-category-config/page`, params })
  },

  // 查询机构行政归属配置详情
  getInstitutionCategoryConfig: async (id: number) => {
    return await request.get({ url: `/system/institution-category-config/get?id=` + id })
  },

  // 新增机构行政归属配置
  createInstitutionCategoryConfig: async (data: InstitutionCategoryConfigVO) => {
    return await request.post({ url: `/system/institution-category-config/create`, data })
  },

  // 修改机构行政归属配置
  updateInstitutionCategoryConfig: async (data: InstitutionCategoryConfigVO) => {
    return await request.put({ url: `/system/institution-category-config/update`, data })
  },

  // 删除机构行政归属配置
  deleteInstitutionCategoryConfig: async (id: number) => {
    return await request.delete({ url: `/system/institution-category-config/delete?id=` + id })
  },

  // 导出机构行政归属配置 Excel
  exportInstitutionCategoryConfig: async (params) => {
    return await request.download({ url: `/system/institution-category-config/export-excel`, params })
  },

  // 下载导入模板
  importTemplate: async () => {
    return await request.download({ url: `/system/institution-category-config/get-import-template` })
  },

  // 导入机构行政归属配置
  importInstitutionCategoryConfig: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return await request.upload({ url: `/system/institution-category-config/import`, data: formData })
  },
}
