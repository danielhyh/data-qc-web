import request from '@/config/axios'

// ========== 统计查询参数 ==========
export interface StatisticsQueryVO {
  zoneId?: number | null
  reportWeek?: string
  administrativeRegion?: string | null
  deptId?: number | null
  startDate?: string
  endDate?: string
  areaCode?: string | null // 新增：区域编码
  orgIds?: number[] // 新增：机构ID列表
}

// ========== 简化查询参数 ==========
export interface SimpleQueryVO {
  zoneId?: number | null
  reportWeek?: string
}

// ========== 简化概览数据 ==========
export interface SimpleOverviewVO {
  reportOrgCount: number
  reportDrugCount: number
  shortageDrugCount: number
  completionRate: number
}

// ========== 总体概况 ==========
export interface StatisticsOverviewVO {
  reportOrgCount: number
  totalOrgCount?: number // 新增：应填报机构数
  completionDegree?: number // 新增：填报完成度
  reportDrugCount: number
  shortageDrugCount: number
  completionRate: number
  orgTrend?: number
  drugTrend?: number
  shortageTrend?: number
  completionTrend?: number
  drugCategoryCount?: number
  weeklyUsageTotal?: number
  currentStockTotal?: number
  stockAlertCount?: number
}

// ========== 供应分布 ==========
export interface SupplyDistributionVO {
  supplyStatus: number
  statusName: string
  count: number
  percentage: number
  monthOnMonth?: number
}

// ========== 短缺详情 ==========
export interface ShortageDetailVO {
  drugId?: number
  drugName: string
  drugCategory?: string // 新增药品分类字段
  dosageForm: string
  dosageUnit?: string
  shortageOrgCount: number
  severeShortageOrgCount: number
  avgStockDays: number
  riskLevel?: number
  riskLevelName?: string
}

// ========== 药品详细信息 ==========
export interface DrugDetailVO {
  drugId: number
  drugName: string
  drugCategory: string
  dosageForm: string
  dosageUnit?: string
  specification?: string
  manufacturer?: string
  shortageOrgCount: number
  severeShortageOrgCount: number
  totalOrgCount: number
  avgStockDays: number
  totalStock: number
  totalWeeklyUsage: number
  riskLevel: number
  riskLevelName: string
  trendData: DrugTrendData[]
  orgDistribution: OrgDistributionData[]
}

export interface DrugTrendData {
  week: string
  shortageCount: number
  severeShortageCount: number
  avgStockDays: number
}

export interface OrgDistributionData {
  orgName: string
  region: string
  supplyStatus: number
  supplyStatusName: string
  stockAmount: number
  weekUsage: number
  stockDays: number
  updateTime: string
}

// ========== 药品分类统计 ==========
export interface DrugCategoryChartVO {
  drugCategory: string // 修改为正确的字段名
  drugCount: number
  percentage: number
  shortageCount: number
  shortageRate: number
  totalUsage?: number
  totalStock?: number
  orgCount?: number
}

// ========== 周使用量趋势 ==========
export interface WeeklyUsageTrendVO {
  weeks: string[]
  usageData: number[]
  growthRates: number[]
  avgUsage: number
  peakUsage: number
  minUsage: number
}

// ========== 库存分析 ==========
export interface StockAnalysisVO {
  distributions: StockDistribution[]
  alerts: StockAlert[]
  avgStockDays: number
  sufficientRate: number
}

export interface StockDistribution {
  range: string
  count: number
  percentage: number
}

export interface StockAlert {
  drugName: string
  dosageForm: string
  currentStock: number
  stockDays: number
  alertLevel: number
}

// ========== 机构排名 ==========
export interface OrgRankingVO {
  rank: number
  deptId: number
  orgName: string
  completionRate: number
  reportDrugCount: number
  shortageDrugCount: number
  timelyRate: number
}

// ========== 药品短缺趋势 ==========
export interface DrugShortageTrendVO {
  timeAxis: string[]
  shortageCountTrend: number[]
  severeShortageCountTrend: number[]
  shortageRateTrend: number[]
  forecastData?: number[]
}

// ========== 库存可用周数统计 ==========
export interface StockWeeksStatisticsVO {
  drugCategory: string
  hospitalStock: number
  enterpriseStock: number
  totalStock: number
  weeklyUsage: number
  availableWeeks: number
}

// ========== 药品使用量统计 ==========
export interface UsageStatisticsVO {
  drugCategory: string
  usageAmount: number
  usageUnit: string
  orgCount: number
}

// ========== 使用量环比变化 ==========
export interface UsageChangeVO {
  drugCategory: string
  currentUsage: number
  lastUsage: number
  changeRate: number
}

// ========== 时间趋势分析 ==========
export interface TrendAnalysisVO {
  drugCategory: string
  dataPoints: TrendDataPoint[]
}

export interface TrendDataPoint {
  week: string
  usage: number
}

// ========== 地域统计 ==========
export interface RegionStatisticsVO {
  regionName: string
  drugCategory: string
  usageAmount: number
  stockAmount: number
  reportingOrganizations: number
}

// ========== API 接口定义 ==========
export const StatisticsApi = {
  // 获取简化概览（专用于指标卡片）
  getSimpleOverview: (params: SimpleQueryVO) =>
    request.get<SimpleOverviewVO>({
      url: '/shortage/statistics/simple-overview',
      params
    }),

  // 获取总体概况
  getOverview: (params: StatisticsQueryVO) =>
    request.get<StatisticsOverviewVO>({
      url: '/shortage/statistics/overview',
      params
    }),

  // 获取供应状况分布
  getSupplyDistribution: (params: StatisticsQueryVO) =>
    request.get<SupplyDistributionVO[]>({
      url: '/shortage/statistics/supply-distribution',
      params
    }),

  // 获取短缺药品详情
  getShortageDetails: (params: StatisticsQueryVO) =>
    request.get<ShortageDetailVO[]>({
      url: '/shortage/statistics/shortage-details',
      params
    }),

  // 获取药品详细信息
  getDrugDetail: (drugId: number, params: StatisticsQueryVO) =>
    request.get<DrugDetailVO>({
      url: '/shortage/statistics/drug-detail',
      params: { ...params, drugId }
    }),

  // 获取药品分类统计
  getDrugCategoryChart: (params: StatisticsQueryVO) =>
    request.get<DrugCategoryChartVO[]>({
      url: '/shortage/statistics/drug-category-chart',
      params
    }),

  // 获取周使用量趋势
  getWeeklyUsageTrend: (params: StatisticsQueryVO) =>
    request.get<WeeklyUsageTrendVO>({
      url: '/shortage/statistics/weekly-usage-trend',
      params
    }),

  // 获取库存分析
  getStockAnalysis: (params: StatisticsQueryVO) =>
    request.get<StockAnalysisVO>({
      url: '/shortage/statistics/stock-analysis',
      params
    }),

  // 获取机构排名
  getOrgRanking: (params: StatisticsQueryVO) =>
    request.get<OrgRankingVO[]>({
      url: '/shortage/statistics/org-ranking',
      params
    }),

  // 获取药品短缺趋势
  getDrugShortageTrend: (params: StatisticsQueryVO) =>
    request.get<DrugShortageTrendVO>({
      url: '/shortage/statistics/drug-shortage-trend',
      params
    }),

  // 导出统计报告
  exportReport: (params: StatisticsQueryVO) =>
    request.download({
      url: '/shortage/statistics/export-report',
      params
    }),

  // 获取库存可用周数统计
  getStockWeeks: (params: StatisticsQueryVO) =>
    request.get<StockWeeksStatisticsVO[]>({
      url: '/shortage/statistics/stock-weeks',
      params
    }),

  // 获取药品使用量统计
  getDrugUsage: (params: StatisticsQueryVO) =>
    request.get<UsageStatisticsVO[]>({
      url: '/shortage/statistics/drug-usage',
      params
    }),

  // 获取使用量环比变化
  getUsageChange: (params: StatisticsQueryVO) =>
    request.get<UsageChangeVO[]>({
      url: '/shortage/statistics/usage-change',
      params
    }),

  // 获取时间趋势分析
  getTrendAnalysis: (params: StatisticsQueryVO) =>
    request.get<TrendAnalysisVO[]>({
      url: '/shortage/statistics/trend-analysis',
      params
    }),

  // 获取地域分布统计
  getRegionStatistics: (params: StatisticsQueryVO) =>
    request.get<RegionStatisticsVO[]>({
      url: '/shortage/statistics/region-statistics',
      params
    }),

  // 导出周报
  exportWeeklyReport: (params: StatisticsQueryVO) =>
    request.download({
      url: '/shortage/statistics/export-weekly-report',
      params
    }),

  // 导出Word格式周报
  exportWeeklyDocx: (params: StatisticsQueryVO) =>
    request.download({
      url: '/shortage/statistics/export-weekly-docx',
      params
    }),

  // 导出药品清单
  exportDrugsList: (params: StatisticsQueryVO) =>
    request.download({
      url: '/shortage/statistics/export-drugs-list',
      params
    }),

  // 导出区域汇总
  exportRegionSummary: (params: StatisticsQueryVO) =>
    request.download({
      url: '/shortage/statistics/export-region-summary',
      params
    }),

  // 导出流感药品周报（Word格式）
  exportFluDrugReport: (params: { zoneId: number; reportWeek: string }) =>
    request.download({
      url: '/shortage/statistics/export-flu-drug-report',
      params
    })
}

// ========== 工具函数 ==========
export const SupplyStatusConfig = {
  1: { label: '充足', color: '#67c23a', type: 'success' },
  2: { label: '较充足', color: '#e6a23c', type: 'warning' },
  3: { label: '短缺', color: '#f56c6c', type: 'danger' },
  4: { label: '严重短缺', color: '#f56c6c', type: 'danger' }
} as const

export const RiskLevelConfig = {
  1: { label: '低风险', color: '#409eff', type: 'info' },
  2: { label: '中风险', color: '#e6a23c', type: 'warning' },
  3: { label: '高风险', color: '#f56c6c', type: 'danger' }
} as const

export const AlertLevelConfig = {
  1: { label: '黄色预警', color: '#e6a23c', icon: 'Warning' },
  2: { label: '橙色预警', color: '#ff9800', icon: 'WarningFilled' },
  3: { label: '红色预警', color: '#f56c6c', icon: 'CircleCloseFilled' }
} as const

// 格式化数字
export const formatNumber = (num: number | undefined | null, decimals: number = 0): string => {
  if (num == null) return '0'

  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + '千'
  }

  return num.toFixed(decimals)
}

// 格式化百分比
export const formatPercentage = (value: number | undefined | null): string => {
  if (value == null) return '0%'
  return value.toFixed(1) + '%'
}

// 获取趋势图标
export const getTrendIcon = (trend: number | undefined | null): string => {
  if (trend == null || trend === 0) return 'ep:minus'
  return trend > 0 ? 'ep:top-right' : 'ep:bottom-right'
}

// 获取趋势颜色
export const getTrendColor = (
  trend: number | undefined | null,
  reverse: boolean = false
): string => {
  if (trend == null || trend === 0) return '#909399'
  if (reverse) {
    // 反向逻辑：下降是好的（如短缺率）
    return trend > 0 ? '#f56c6c' : '#67c23a'
  }
  // 正常逻辑：上升是好的
  return trend > 0 ? '#67c23a' : '#f56c6c'
}
