import request from '@/config/axios'

// 数据上报任务主 VO
export interface UploadTaskVO {
  id: number // id
  taskName: string // 任务名称
  uploadYear: number // 采集年度
  totalDepts: number // 总部门数
  successDepts: number // 成功部门数
  failedDepts: number // 失败部门数
  status: string // pending:待开始; running:进行中; completed:已完成
}

// 数据上报任务主 API
export const UploadTaskApi = {
  // 查询数据上报任务主分页
  getUploadTaskPage: async (params: any) => {
    return await request.get({ url: `/drug/upload-task/page`, params })
  },

  // 查询数据上报任务主详情
  getUploadTask: async (id: number) => {
    return await request.get({ url: `/drug/upload-task/get?id=` + id })
  },

  // 新增数据上报任务主
  createUploadTask: async (data: UploadTaskVO) => {
    return await request.post({ url: `/drug/upload-task/create`, data })
  },

  // 修改数据上报任务主
  updateUploadTask: async (data: UploadTaskVO) => {
    return await request.put({ url: `/drug/upload-task/update`, data })
  },

  // 删除数据上报任务主
  deleteUploadTask: async (id: number) => {
    return await request.delete({ url: `/drug/upload-task/delete?id=` + id })
  },

  // 导出数据上报任务主 Excel
  exportUploadTask: async (params) => {
    return await request.download({ url: `/drug/upload-task/export-excel`, params })
  },

  // 开始数据上报
  startUpload: async () => {
    return await request.post({ url: `/drug/upload-task/start-upload` })
  },

  // 检查是否可以开始上报
  readyToStart: async () => {
    return await request.get({ url: `/drug/upload-task/ready-to-start` })
  },

  // 获取上报进度
  getUploadProgress: async (taskId: number) => {
    return await request.get({ url: `/data/upload/progress?taskId=${taskId}` })
  },

  // 重试失败的上报
  retryUpload: async (taskId: number) => {
    return await request.get({ url: `/data/upload/retry?taskId=${taskId}` })
  },
}
