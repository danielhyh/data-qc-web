import request from '@/config/axios'

export function DrugStatisticsApi() {}

// ========== 数据类型定义 ==========

// 仪表板数据结构
export interface DashboardDataVO {
  basicStats: {
    totalDrugs: number
    totalInventoryValue: number
    monthlyUsage: number
    totalPrescriptions: number
    baseDrugRate: number
  }
  trendData: Array<{
    month: string
    usage: number
    cost: number
  }>
  categoryStats: Array<{
    category: string
    count: number
    percentage: number
  }>
  warnings: {
    expiryDrugs: number
    lowStock: number
    abnormalUsage: number
    overduePayments: number
  }
  updateTime: string
}

// 药品分析数据结构
export interface DrugAnalysisVO {
  drugStats: {
    totalCount: number
    baseDrugCount: number
    manufacturerCount: number
    formCount: number
  }
  topDrugs: Array<{
    hosDrugId: string
    productName: string
    useCount: number
    totalAmount: number
    percentage: number
  }>
  baseDrugAnalysis: {
    baseDrugAmount: number
    nonBaseDrugAmount: number
    baseDrugRate: number
  }
  supplierAnalysis: Array<{
    supplierName: string
    drugCount: number
    totalAmount: number
  }>
}

// 科室分析数据结构
export interface DepartmentAnalysisVO {
  departmentRanking: Array<{
    departmentName: string
    prescriptionCount: number
    totalAmount: number
    patientCount: number
  }>
  baseDrugComparison: Array<{
    department: string
    baseDrugRate: number
  }>
  departmentTrend: Array<{
    department: string
    trendData: Array<{
      date: string
      amount: number
    }>
  }>
}

// 库存分析数据结构
export interface InventoryAnalysisVO {
  stockSummary: {
    totalValue: number
    totalQuantity: number
    drugCount: number
  }
  expiryWarning: Array<{
    hosDrugId: string
    productName: string
    expiryDate: string
    currentStock: number
    daysToExpiry: number
  }>
  turnoverAnalysis: Array<{
    category: string
    turnoverRate: number
    averageDays: number
  }>
  purchaseAdvice: Array<{
    hosDrugId: string
    productName: string
    currentStock: number
    suggestedQuantity: number
    urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  }>
}

// 费用分析数据结构
export interface CostAnalysisVO {
  monthlyTrend: Array<{
    month: string
    totalCost: number
    baseDrugCost: number
    nonBaseDrugCost: number
  }>
  costStructure: {
    baseDrugPercentage: number
    nonBaseDrugPercentage: number
    topCategoryBreakdown: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  yearOverYear: {
    currentYearTotal: number
    previousYearTotal: number
    growthRate: number
    monthlyComparison: Array<{
      month: string
      currentYear: number
      previousYear: number
      growthRate: number
    }>
  }
}

// 分析查询参数
export interface AnalysisQueryParam {
  startDate?: string
  endDate?: string
  year?: string
}

// ========== API 接口方法 ==========

// 获取数据概览仪表板
export const getDashboard = () => {
  return request.get<DashboardDataVO>({ url: '/dataqc/analysis/dashboard' })
}

// 获取药品分析报告
export const getDrugAnalysis = (params?: AnalysisQueryParam) => {
  return request.get<DrugAnalysisVO>({
    url: '/dataqc/analysis/drug-analysis',
    params
  })
}

// 获取科室分析报告
export const getDepartmentAnalysis = (params?: AnalysisQueryParam) => {
  return request.get<DepartmentAnalysisVO>({
    url: '/dataqc/analysis/department-analysis',
    params
  })
}

// 获取库存分析报告
export const getInventoryAnalysis = () => {
  return request.get<InventoryAnalysisVO>({ url: '/dataqc/analysis/inventory-analysis' })
}

// 获取费用分析报告
export const getCostAnalysis = (params?: Pick<AnalysisQueryParam, 'year'>) => {
  return request.get<CostAnalysisVO>({
    url: '/dataqc/analysis/cost-analysis',
    params
  })
}

// 导出分析报告
export const exportAnalysisReport = (type: string, params?: any) => {
  return request.download({
    url: `/dataqc/analysis/export/${type}`,
    params
  })
}

// 获取分析配置信息
export const getAnalysisConfig = () => {
  return request.get({ url: '/dataqc/analysis/config' })
}

// 保存分析配置
export const saveAnalysisConfig = (data: any) => {
  return request.post({ url: '/dataqc/analysis/config', data })
}

// ========== 机构填报统计相关 API ==========

// 机构填报统计数据结构
export interface InstitutionReportStatsVO {
  // 基本统计
  basicStats: {
    totalInstitutions: number    // 应监测机构数
    reportedInstitutions: number // 已上报机构数
    unreportedInstitutions: number // 未上报机构数  
    unregisteredInstitutions: number // 未注册机构数
    reportRate: number           // 总体上报率
    currentYear: string          // 当前年份
    reportStatus: 'open' | 'closed' | 'pending' // 上报状态
    openTime?: string            // 开放时间
    deadlineTime?: string        // 截止时间
  }
  
  // 按医院等级统计
  levelStats: {
    level3: {
      total: number              // 三级医院总数
      reported: number           // 已上报数
      preReported: number        // 前置上报数
      postReported: number       // 后置上报数
      rate: number              // 上报率
    }
    level2: {
      total: number              // 二级医院总数
      reported: number           // 已上报数
      preReported: number        // 前置上报数
      postReported: number       // 后置上报数
      rate: number              // 上报率
    }
    baseLevel: {
      total: number              // 基层医院总数
      reported: number           // 已上报数
      preReported: number        // 前置上报数
      postReported: number       // 后置上报数
      rate: number              // 上报率
    }
  }
  
  // 按区域统计（省级/市级）
  areaStats: Array<{
    areaCode: string             // 行政区划代码
    areaName: string             // 区域名称
    areaLevel: 'province' | 'city' | 'district' // 区域级别
    totalInstitutions: number    // 总机构数
    reportedCount: number        // 已上报数
    preReportedCount: number     // 前置上报数
    postReportedCount: number    // 后置上报数
    failedCount: number          // 失败数
    partialSuccessCount: number  // 部分成功数
    reportRate: number           // 上报率
    // 按医院等级细分
    levelBreakdown: {
      level3: { total: number; reported: number; rate: number }
      level2: { total: number; reported: number; rate: number }
      baseLevel: { total: number; reported: number; rate: number }
    }
  }>
  
  // 上报任务执行统计
  taskStats: {
    totalTasks: number           // 总任务数
    successTasks: number         // 成功任务数
    failedTasks: number          // 失败任务数
    partialSuccessTasks: number  // 部分成功任务数
    cancelledTasks: number       // 已取消任务数
    preOnlyTasks: number         // 仅前置任务数
    postOnlyTasks: number        // 仅后置任务数
    fullTasks: number            // 完整执行任务数
  }
  
  // 时间趋势数据
  trendData: Array<{
    date: string                 // 日期
    reportedCount: number        // 当日上报数
    cumulativeCount: number      // 累计上报数
    reportRate: number           // 累计上报率
  }>
  
  // 问题机构列表
  problemInstitutions: {
    unreported: Array<{          // 未上报机构
      deptId: number
      deptName: string
      areaName: string
      hospitalLevel: string
      contactInfo?: string
    }>
    failed: Array<{              // 上报失败机构
      deptId: number
      deptName: string
      areaName: string
      hospitalLevel: string
      failReason?: string
      lastAttemptTime?: string
    }>
    unregistered: Array<{        // 未注册机构
      deptId: number
      deptName: string
      areaName: string
      hospitalLevel: string
    }>
  }
}

// 获取机构填报统计
export const getInstitutionReportStats = (params?: {
  year?: string
  areaCode?: string              // 筛选特定区域
  hospitalLevel?: string         // 筛选医院等级
}) => {
  return request.get<InstitutionReportStatsVO>({
    url: '/drug/statistics/institution-report',
    params
  })
}

// 导出机构填报统计报告
export const exportInstitutionReport = (params?: {
  year?: string
  format?: 'excel' | 'pdf'
}) => {
  return request.download({
    url: '/drug/statistics/institution-report/export',
    params
  })
}

// 获取机构详细信息
export const getInstitutionDetail = (deptId: number) => {
  return request.get({
    url: `/drug/statistics/institution-report/${deptId}/detail`
  })
}

// ========== 新增机构上报统计相关 API ==========

// 填报任务统计数据结构
export interface ReportTaskStatsVO {
  taskName?: string              // 任务名称
  reportYear?: string            // 填报年份
  totalMonitoringInstitutions: number // 应监测机构数
  reportedInstitutions: number   // 已上报机构数
  overallReportRate: number      // 总体上报率
  uploadedDataCount: number      // 已给国家上传数据量
  startTime?: string             // 开始时间
  endTime?: string               // 结束时间
  taskStatus?: number            // 上报任务状态
  taskStatusDesc?: string        // 任务状态描述
  levelReportStats: {            // 各级机构上报率统计
    level3: {
      levelDesc: string
      totalInstitutions: number
      reportedInstitutions: number
      reportRate: number
    }
    level2: {
      levelDesc: string
      totalInstitutions: number
      reportedInstitutions: number
      reportRate: number
    }
    baseLevel: {
      levelDesc: string
      totalInstitutions: number
      reportedInstitutions: number
      reportRate: number
    }
  }
}

// 全省上报图表数据结构
export interface ProvinceReportChartVO {
  chartData: Array<{
    regionId: number
    cityCode: string
    cityName: string
    reportedCount: number
    unreportedCount: number
    totalCount: number
    reportRate: number
  }>
  provinceSummary: {
    totalInstitutions: number
    totalReported: number
    totalUnreported: number
    overallReportRate: number
  }
}

// 市区详细上报数据结构
export interface CityDetailReportVO {
  regionId: number
  cityName: string
  totalMonitoringInstitutions: number
  reportedInstitutions: number
  unreportedInstitutions: number
  reportRate: number
  level3ReportRate: number
  level2ReportRate: number
  baseLevelReportRate: number
  uploadedDataCount: number
  levelStats: {
    level3: {
      totalInstitutions: number
      reportedInstitutions: number
      unreportedInstitutions: number
      reportRate: number
      uploadedDataCount: number
    }
    level2: {
      totalInstitutions: number
      reportedInstitutions: number
      unreportedInstitutions: number
      reportRate: number
      uploadedDataCount: number
    }
    baseLevel: {
      totalInstitutions: number
      reportedInstitutions: number
      unreportedInstitutions: number
      reportRate: number
      uploadedDataCount: number
    }
  }
}

// 机构上报列表查询参数
export interface InstitutionReportPageReqVO {
  pageNo: number
  pageSize: number
  reportId: number               // 填报任务ID（必填）
  regionCode?: string            // 地区代码
  institutionType?: string       // 机构类型 monitoring/reported/unreported
  hospitalLevel?: string         // 医院等级 3/2/base
  reportStatus?: number          // 上报状态 0-5
  deptName?: string             // 机构名称
  contactPerson?: string        // 联系人
  contactPhone?: string         // 联系人电话
}

// 机构上报列表项数据结构
export interface InstitutionReportItemVO {
  deptId: number                 // 机构ID
  deptName: string              // 机构名称
  cityName?: string             // 所属市
  districtName?: string         // 所属区县
  hospitalLevel?: string        // 医院等级
  hospitalLevelDesc: string     // 医院等级描述
  reportStatus: number          // 上报状态
  contactPerson?: string        // 联系人
  contactPhone?: string         // 联系人电话
  isMonitoringRequired: boolean // 是否应监测机构
  regionCode?: string           // 地区代码
  regionPath?: string           // 地区路径
}

// 机构上报统计API类
export const InstitutionReportApi = {
  // 获取填报任务统计数据
  getReportTaskStats: (reportId: number) => {
    return request.get<ReportTaskStatsVO>({
      url: `/drug/statistics/institution-report/task/${reportId}`
    })
  },

  // 获取全省各市区上报情况图表数据
  getProvinceReportChart: (reportId: number) => {
    return request.get<ProvinceReportChartVO>({
      url: `/drug/statistics/institution-report/chart/${reportId}`
    })
  },

  // 获取指定市区的详细上报数据
  getCityDetailReport: (reportId: number, regionId: number) => {
    return request.get<CityDetailReportVO>({
      url: `/drug/statistics/institution-report/city/${reportId}/${regionId}`
    })
  },

  // 获取机构上报列表（分页）
  getInstitutionReportPage: (params: InstitutionReportPageReqVO) => {
    return request.get<{
      list: InstitutionReportItemVO[]
      total: number
    }>({
      url: '/drug/statistics/institution-report/institutions/page',
      params
    })
  }
}
