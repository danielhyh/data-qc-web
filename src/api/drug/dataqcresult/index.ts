import request from '@/config/axios'

// 质控记录结果 VO
export interface DataqcResultVO {
  id: number // 主键id
  taskId: number // 任务id
  deptId: number // 机构id
  bussType: string // 业务表类型
  bussId: number // 业务表id
  bussName: string // 业务记录标识
  bussYpid: string // YPID
  bussDesc: string // 结果描述
  status: string // 状态
}

// 质控记录结果 API
export const DataqcResultApi = {
  // 查询质控记录结果分页
  getDataqcResultPage: async (params: any) => {
    return await request.get({ url: `/drug/dataqc-result/page`, params })
  },

  // 查询质控记录结果详情
  getDataqcResult: async (id: number) => {
    return await request.get({ url: `/drug/dataqc-result/get?id=` + id })
  },

  // 新增质控记录结果
  createDataqcResult: async (data: DataqcResultVO) => {
    return await request.post({ url: `/drug/dataqc-result/create`, data })
  },

  // 修改质控记录结果
  updateDataqcResult: async (data: DataqcResultVO) => {
    return await request.put({ url: `/drug/dataqc-result/update`, data })
  },

  // 删除质控记录结果
  deleteDataqcResult: async (id: number) => {
    return await request.delete({ url: `/drug/dataqc-result/delete?id=` + id })
  },

  // 导出质控记录结果 Excel
  exportDataqcResult: async (params) => {
    return await request.download({ url: `/drug/dataqc-result/export-excel`, params })
  },
}