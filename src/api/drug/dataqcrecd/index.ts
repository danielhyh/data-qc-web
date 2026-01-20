import request from '@/config/axios'

// 质控记录主 VO
export interface DataqcRecdVO {
  id: number // 主键id
  deptId: number // 机构id
  status: string // 状态
}

// 质控记录主 API
export const DataqcRecdApi = {
  // 查询质控记录主分页
  getDataqcRecdPage: async (params: any) => {
    return await request.get({ url: `/drug/dataqc-recd/page`, params })
  },

  // 查询质控记录主详情
  getDataqcRecd: async (id: number) => {
    return await request.get({ url: `/drug/dataqc-recd/get?id=` + id })
  },

  // 新增质控记录主
  createDataqcRecd: async (data: DataqcRecdVO) => {
    return await request.post({ url: `/drug/dataqc-recd/create`, data })
  },

  // 修改质控记录主
  updateDataqcRecd: async (data: DataqcRecdVO) => {
    return await request.put({ url: `/drug/dataqc-recd/update`, data })
  },

  // 删除质控记录主
  deleteDataqcRecd: async (id: number) => {
    return await request.delete({ url: `/drug/dataqc-recd/delete?id=` + id })
  },

  // 导出质控记录主 Excel
  exportDataqcRecd: async (params) => {
    return await request.download({ url: `/drug/dataqc-recd/export-excel`, params })
  },
}