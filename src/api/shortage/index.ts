import request from '@/config/axios'

// ========== 专区管理 ==========
export interface ReportTimeConfigVO {
  dayOfWeek: number  // 周几 (1=周一, 7=周日)
  startTime: string  // 开始时间 "12:00"
  endTime: string    // 结束时间 "18:00"
}

export interface ReportZoneVO {
  id?: number
  zoneName: string
  zoneCode: string
  noticeContent?: string  // 富文本通知内容
  status: number
  remark?: string
  reportableOrgs?: string // 可填报的机构
  drugCount?: number // 药品数
  reportCount?: number // 填报次数
  createTime?: Date
  reportTimeConfig?: ReportTimeConfigVO // 填报时间配置
  isTimeRestricted?: boolean // 是否启用时间限制
}

export interface ReportTimeCheckRespVO {
  isInTime: boolean
  remainingMinutes?: number
  timeConfig?: ReportTimeConfigVO & { isTimeRestricted: boolean }
  message: string
}

export interface ReportZonePageReqVO {
  pageNo?: number
  pageSize?: number
  zoneName?: string
  status?: number
  zoneCode?: string
}

export const ReportZoneApi = {
  // 获取分页
  getPage: (params: ReportZonePageReqVO) => 
    request.get({ url: '/shortage/report-zone/page', params }),
  // 查询短缺药品填报专区
  getList: async (params: any) => {
    return request.get({ url: `/shortage/report-zone/list`, params })
  },
  // 获取详情
  get: (id: number) => 
    request.get({ url: `/shortage/report-zone/get?id=${id}` }),
  
  // 创建
  create: (data: ReportZoneVO) => 
    request.post({ url: '/shortage/report-zone/create', data }),
  
  // 更新
  update: (data: ReportZoneVO) => 
    request.put({ url: '/shortage/report-zone/update', data }),
  
  // 删除
  delete: (id: number) => 
    request.delete({ url: `/shortage/report-zone/delete?id=${id}` }),
  
  // 更新状态
  updateStatus: (id: number, status: number) =>
    request.put({ url: `/shortage/report-zone/update-status/${id}?status=${status}` }),
  
  // 更新通知内容
  updateNotice: (id: number, noticeContent: string) => 
    request.put({ 
      url: `/shortage/report-zone/notice/${id}`, 
      data: { noticeContent } 
    }),
  
  // 更新时间配置
  updateTimeConfig: (id: number, data: { reportTimeConfig: ReportTimeConfigVO, isTimeRestricted: boolean }) => 
    request.put({ url: `/shortage/report-zone/time-config/${id}`, data }),
  
  // 检查填报时间
  checkReportTime: (zoneId: number): Promise<ReportTimeCheckRespVO> =>
    request.get({ url: `/shortage/report-zone/check-time/${zoneId}` }),

  // 获取可用专区选项
  getOptions: () =>
    request.get({ url: '/shortage/report-zone/options' }),

  // 开启填报专区并生成首批任务
  enableZone: (id: number) =>
    request.post({ url: `/shortage/report-zone/enable/${id}` }),

  // 导出Excel
  exportExcel: (params: ReportZonePageReqVO) =>
    request.download({ url: '/shortage/report-zone/export-excel', params })
}

// ========== 药品配置 ==========
export interface DrugConfigVO {
  id?: number
  zoneId: number
  drugName: string
  dosageCategory: string // 剂型规格
  dosageForm: string
  dosageUnit: string
  status: number
  sortOrder: number
  createTime?: Date
}

export interface DrugConfigPageReqVO {
  pageNo?: number
  pageSize?: number
  zoneId?: number
  drugName?: string
  drugCategory?: string // 药品分类
  dosageCategory?: string // 剂型规格
  dosageForm?: string
  status?: number
}

export const DrugConfigApi = {
  // 获取分页
  getPage: (params: DrugConfigPageReqVO) => 
    request.get({ url: '/shortage/drug-config/page', params }),
  
  // 获取详情
  get: (id: number) => 
    request.get({ url: `/shortage/drug-config/get?id=${id}` }),
  
  // 创建
  create: (data: DrugConfigVO) => 
    request.post({ url: '/shortage/drug-config/create', data }),
  
  // 更新
  update: (data: DrugConfigVO) => 
    request.put({ url: '/shortage/drug-config/update', data }),
  
  // 删除
  delete: (id: number) => 
    request.delete({ url: `/shortage/drug-config/delete?id=${id}` }),

  // 更新状态
  updateStatus: async (id: number, status: number) => {
    return await request.put({ url: `/shortage/drug-config/update-status`, data: { id, status } })
  },

  // 更新排序
  updateSortOrder: async (id: number, sortOrder: number) => {
    return await request.put({ url: `/shortage/drug-config/update-sort-order`, data: { id, sortOrder } })
  },
  
  // 批量导入（文件上传）
  batchImport: (zoneId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('zoneId', zoneId.toString())
    return request.upload({ url: '/shortage/drug-config/import', data: formData })
  },
  
  // 从药品分类批量导入
  batchImportFromCategory: (data: { zoneId: number; categoryName: string }) =>
    request.post({ url: '/shortage/drug-config/batch-import', data })
}

// ========== 填报记录 ==========
export interface ReportRecordVO {
  id?: number
  zoneId: number
  drugConfigId: number
  orgId?: number
  reportWeek: string
  reportDate: string
  weekUsageAmount: number
  currentStockAmount: number
  supplyStatus: number
  notAvailable?: boolean // 本机构未使用此药品
  
  // 关联字段 - 更新字段名以匹配后端
  drugName?: string        // drug_name 
  drugCategory?: string    // drug_category 药品分类
  dosageForm?: string      // dosage_form 剂型
  dosageCategory?: string  // dosage_category 剂型规格
  dosageUnit?: string      // dosage_unit 最小统计单位
}

export interface ReportStatisticsReqVO {
  zoneId?: number | null
  reportWeek?: string
  administrativeRegion?: string | null
}

export interface OverviewData {
  reportOrgCount: number
  reportDrugCount: number
  shortageDrugCount: number
  completionRate: number
  // 新增趋势数据
  orgTrend?: number
  drugTrend?: number
  shortageTrend?: number
  completionTrend?: number
}

export interface SupplyStatusDistribution {
  supplyStatus: number
  statusName: string
  count: number
  percentage: number
}

export interface ShortageDetail {
  drugName: string
  dosageForm: string
  shortageOrgCount: number
  severeShortageOrgCount: number
  avgStockDays: number
}

export interface ReportStatisticsRespVO {
  overview: OverviewData
  supplyDistribution: SupplyStatusDistribution[]
  shortageDetails: ShortageDetail[]
  // 新增指标数据
  dosageFormCount?: number         // 剂型规格统计
  weeklyUsage?: number            // 本周使用量
  currentStock?: number           // 当日实时库存
  stockAlertCount?: number        // 库存预警数量
}

export const ReportRecordApi = {
  // 获取专区填报药品列表
  getReportListByZoneId: (zoneId: number, taskId?: number) =>
    request.get({ url: `/shortage/report-record/list`, params: { zoneId, taskId } }),

  // 导出机构填报记录
  exportReportRecord: (params: any) =>
    request.download({ url: '/shortage/report-record/export-excel', params }),

  // 批量保存填报记录(提交)
  batchSave: (data: ReportRecordVO[]) =>
    request.post({ url: '/shortage/report-record/batch-save', data }),

  // 保存草稿
  saveDraft: (params: { taskId: number; reportWeek: string; data: ReportRecordVO[]; completionRate?: number }) =>
    request.post({ url: '/shortage/report-record/save-draft', data: params }),

  // 提交填报
  submitReport: (params: { taskId: number; reportWeek: string; data: ReportRecordVO[]; completionRate?: number }) =>
    request.post({ url: '/shortage/report-record/submit-report', data: params }),

  // 获取统计分析数据
  getStatistics: (params: ReportStatisticsReqVO) =>
    request.get({ url: '/shortage/report-record/statistics', params }),

  // 导出统计报告
  exportReport: (params: ReportStatisticsReqVO) =>
    request.download({ url: '/shortage/report-record/export-excel', params }),

  // 获取填报周期列表
  getReportWeeks: () =>
    request.get({ url: '/shortage/report-record/report-weeks' }),

  // 获取填报记录查询列表（按地区查询）
  getReportRecordList: (params: any) =>
    request.get({ url: '/shortage/report-record/list-by-region', params }),

  // 获取填报详情（含药品明细）
  getReportRecordDetail: (taskId: number) =>
    request.get({ url: `/shortage/report-record/detail?taskId=${taskId}` }),

  // 导出填报详情
  exportReportDetail: (params: any) =>
    request.download({ url: `/shortage/report-record/export-report-detail`, params }),

  // 获取填报进度统计
  getReportProgress: (params: any) =>
    request.get({ url: `/shortage/report-record/report-progress`, params })
}

// ========== 供应状态枚举 ==========
export const SupplyStatusEnum = {
  SUFFICIENT: { value: 1, label: '充足', color: 'success' },
  RELATIVELY_SUFFICIENT: { value: 2, label: '较充足', color: 'warning' },
  SHORTAGE: { value: 3, label: '短缺', color: 'danger' },
  SEVERE_SHORTAGE: { value: 4, label: '严重短缺', color: 'danger' }
}

export const getSupplyStatusLabel = (status: number): string => {
  const statusMap = Object.values(SupplyStatusEnum).find(item => item.value === status)
  return statusMap?.label || '未知'
}

export const getSupplyStatusColor = (status: number): string => {
  const statusMap = Object.values(SupplyStatusEnum).find(item => item.value === status)
  return statusMap?.color || 'info'
}
