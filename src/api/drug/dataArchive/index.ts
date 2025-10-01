import request from '@/config/axios'

// 数据档案 VO
export interface DataArchiveVO {
  id?: number
  taskId: number // 任务ID
  taskNo?: string // 任务编号
  fileType: string // 文件类型:HOSPITAL_INFO,DRUG_CATALOG,DRUG_INBOUND,DRUG_OUTBOUND,DRUG_USAGE
  fileName: string // 文件名
  totalRows: number // 总行数
  fileSize: number // 文件大小
  submitTime?: string // 提交时间
  deptId?: number // 部门ID
  deptName?: string // 部门名称
  reportId?: number // 上报ID
  cityName?: string // 所属市
  districtName?: string // 所属区县
}

// 数据档案分页请求 VO
export interface DataArchivePageReqVO {
  pageNo: number
  pageSize: number
  taskId?: number
  fileType?: string
  fileName?: string
  reportTaskId?: number // 填报任务ID
  deptIds?: string // 部门ID列表，逗号分隔
  submitTime?: string[]
}

// 数据档案 API
export const DataArchiveApi = {
  // 查询数据档案分页
  getDataArchivePage: async (params: DataArchivePageReqVO) => {
    return await request.get({ url: `/drug/data-archive/page`, params })
  },

  // 查询数据档案详情
  getDataArchive: async (id: number) => {
    return await request.get({ url: `/drug/data-archive/get?id=` + id })
  },

  // 新增数据档案
  createDataArchive: async (data: DataArchiveVO) => {
    return await request.post({ url: `/drug/data-archive/create`, data })
  },

  // 修改数据档案
  updateDataArchive: async (data: DataArchiveVO) => {
    return await request.put({ url: `/drug/data-archive/update`, data })
  },

  // 删除数据档案
  deleteDataArchive: async (id: number) => {
    return await request.delete({ url: `/drug/data-archive/delete?id=` + id })
  },

  // 导出数据档案 Excel
  exportDataArchive: async (params: DataArchivePageReqVO) => {
    return await request.download({ url: `/drug/data-archive/export-excel`, params })
  },

  // 下载数据档案对应的数据文件
  downloadArchiveData: async (id: number) => {
    return await request.download({ url: `/drug/data-archive/download-data?id=${id}` })
  },
}
