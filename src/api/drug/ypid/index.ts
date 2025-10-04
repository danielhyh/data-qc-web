// src/api/drug/ypid/index.ts
import request from '@/config/axios'

// ========================= 类型定义 =========================

/**
 * YPID统计概览
 */
export interface YpidStatisticsVO {
  totalDrugs: number // 药品总数
  matchedDrugs: number // 已匹配药品数
  unmatchedDrugs: number // 未匹配药品数
  matchRate: number // 匹配率
  todayMatched: number // 今日匹配数
  manualMatched: number // 手动匹配数
  autoMatched: number // 自动匹配数
  matchRateTrend: number // 匹配率趋势
}

/**
 * YPID药品信息
 */
export interface YpidDrugVO {
  id: number
  ypid: string // YPID编码
  drugName: string // 药品通用名
  productName: string // 产品名称
  specification: string // 规格
  dosageForm: string // 剂型
  manufacturer: string // 生产企业
  approvalNumber: string // 批准文号
  conversionFactor: number // 转换系数
  category: string // 药品类别
  status: number // 状态：1-正常，2-停用
  createTime: string
  updateTime: string
}

/**
 * YPID搜索请求参数
 */
export interface YpidSearchVO {
  pageNo: number
  pageSize: number
  keyword?: string // 搜索关键词（支持YPID、药品名、生产企业等）
  ypid?: string
  drugName?: string
  productName?: string
  manufacturer?: string
  category?: string
  status?: number
}

/**
 * 待匹配药品信息
 */
export interface UnmatchedDrugVO {
  id: number
  taskId: number
  taskNo: string
  hospitalName: string
  hospitalCode: string
  hospitalDrugId: string // 院内药品ID
  hospitalDrugName: string // 院内药品名称
  specification?: string // 规格
  dosageForm?: string // 剂型
  manufacturer?: string // 生产企业
  approvalNumber?: string // 批准文号
  price?: number // 价格
  quantity?: number // 数量
  amount?: number // 金额
  sourceTable: string // 来源表
  createTime: string
  matchStatus: number // 匹配状态：0-未匹配，1-已匹配，2-匹配失败
  matchedYpid?: string // 匹配的YPID
  matchConfidence?: number // 匹配置信度
}

/**
 * 批量匹配请求参数
 */
export interface BatchMatchRequestVO {
  taskId?: number // 任务ID
  unmatchedIds?: number[] // 待匹配记录ID列表
  matchStrategy: string // 匹配策略：exact-精确匹配，fuzzy-模糊匹配，smart-智能匹配
  options?: {
    minConfidence?: number // 最小置信度阈值
    autoApprove?: boolean // 自动审批高置信度匹配
    skipManualReview?: boolean // 跳过人工审核
  }
}

/**
 * 匹配结果
 */
export interface MatchResultVO {
  unmatchedId: number // 待匹配记录ID
  hospitalDrugName: string // 院内药品名称
  matchedYpid?: string // 匹配的YPID
  matchedDrugName?: string // 匹配的药品名称
  confidence: number // 置信度（0-100）
  matchType: string // 匹配类型：exact-精确，fuzzy-模糊，manual-手动
  matchReason?: string // 匹配原因说明
  suggestions?: YpidDrugVO[] // 推荐的其他候选项
}

/**
 * 批量匹配响应
 */
export interface BatchMatchResponseVO {
  batchNo: string // 批次号
  totalCount: number // 总数
  successCount: number // 成功匹配数
  failureCount: number // 失败数
  pendingCount: number // 待人工确认数
  results: MatchResultVO[] // 匹配结果列表
  executionTime: number // 执行时间（毫秒）
}

/**
 * 手动匹配请求
 */
export interface ManualMatchRequestVO {
  unmatchedId: number // 待匹配记录ID
  ypid: string // 选择的YPID
  matchReason: string // 匹配原因
  confidence?: number // 人工设定的置信度
}

/**
 * 匹配报告
 */
export interface MatchReportVO {
  reportId: string
  taskId: number
  taskNo: string
  hospitalName: string
  reportTime: string
  totalDrugs: number // 药品总数
  matchedCount: number // 已匹配数
  unmatchedCount: number // 未匹配数
  matchRate: number // 匹配率
  autoMatchCount: number // 自动匹配数
  manualMatchCount: number // 手动匹配数
  averageConfidence: number // 平均置信度
  categoryDistribution: Record<string, number> // 类别分布
  unmatchedReasons: Record<string, number> // 未匹配原因分布
  matchQualityScore: number // 匹配质量评分
  suggestions: string[] // 改进建议
}

/**
 * 匹配历史记录
 */
export interface MatchHistoryVO {
  id: number
  unmatchedId: number
  hospitalDrugName: string
  originalYpid?: string // 原YPID
  newYpid: string // 新YPID
  matchType: string // 匹配类型
  operator: string // 操作人
  operateTime: string // 操作时间
  reason?: string // 原因说明
}

// ========================= API 接口方法 =========================

export const YpidApi = {
  // ========================= 统计与概览 =========================

  /**
   * 获取YPID统计概览
   */
  async getStatistics(taskId?: number): Promise<YpidStatisticsVO> {
    return request.get({
      url: '/drug/ypid/search/statistics',
      params: { taskId }
    })
  },

  // ========================= YPID搜索 =========================

  /**
   * 分页搜索YPID药品信息
   */
  async searchYpid(params: YpidSearchVO) {
    return request.get({
      url: '/drug/ypid/search/standard',
      params
    })
  },

  /**
   * 获取YPID详情
   */
  async getYpidDetail(ypid: string): Promise<YpidDrugVO> {
    return request.get({
      url: `/drug/ypid/search/detail/${ypid}`
    })
  },

  /**
   * 模糊搜索YPID（用于自动完成）
   */
  async fuzzySearch(keyword: string, limit: number = 10): Promise<YpidDrugVO[]> {
    return request.get({
      url: '/drug/ypid/search/fuzzy',
      params: { keyword, limit }
    })
  },

  // ========================= 批量匹配 =========================

  /**
   * 获取待匹配药品列表
   */
  async getUnmatchedList(params: {
    pageNo: number
    pageSize: number
    taskId?: number
    hospitalName?: string
    drugName?: string
  }) {
    return request.get({
      url: '/drug/ypid/unmatched-list',
      params
    })
  },

  /**
   * 获取批量匹配列表（按状态分类）
   */
  async getBatchMatchList(params: {
    pageNo: number
    pageSize: number
    matchTaskId: number
    matchStatus?: number
  }) {
    return request.get({
      url: '/drug/ypid-pending-batch/page',
      params
    })
  },

  /**
   * 获取匹配统计
   */
  async getMatchStatistics(taskId: number) {
    return request.get({
      url: `/drug/ypid-pending-batch/statistics/${taskId}`
    })
  },

  /**
   * 执行批量匹配
   */
  async executeBatchMatch(params: BatchMatchRequestVO): Promise<BatchMatchResponseVO> {
    return request.post({
      url: '/drug/ypid-pending-batch/match',
      data: params
    })
  },

  /**
   * 获取批量匹配进度
   */
  async getMatchProgress(taskId: number) {
    return request.get({
      url: `/drug/ypid-pending-batch/progress/${taskId}`
    })
  },

  /**
   * 批量确认
   */
  async batchConfirm(params: { taskId: number; pendingIds?: number[] }): Promise<boolean> {
    return request.post({
      url: '/drug/ypid-pending-batch/confirm',
      data: params
    })
  },

  /**
   * 单个确认
   */
  async confirmMatch(id: number, matchHistoryId: number): Promise<boolean> {
    return request.post({
      url: '/drug/ypid-pending-batch/confirm-single',
      data: { id, matchHistoryId }
    })
  },
  // async confirmMatch(pendingId: number): Promise<boolean> {
  //   return request.post({
  //     url: '/drug/ypid-pending-batch/confirm-single',
  //     data: { pendingId }
  //   })
  // },

  /**
   * 导出匹配结果
   */
  async exportMatchResult(taskId: number): Promise<any> {
    return request.download({
      url: `/drug/ypid-match-task/${taskId}/export`
    })
  },

  // ========================= 手动匹配 =========================

   /**
   * 获取推荐匹配项列表查询
   */
  async getMatchProgressList(pendingId: number) {
    return request.get({
      url: `/drug/ypid-match-history/list/${pendingId}`,
      params: { pendingId }
    })
  },
   

  /**
   * 获取待手动匹配列表
   */
  async getManualMatchList(params: {
    pageNo: number
    pageSize: number
    taskId?: number
    priority?: string
  }) {
    return request.get({
      url: '/drug/ypid-pending-batch/match-list',
      params
    })
  },

  /**
   * 提交手动匹配
   */
  async submitManualMatch(params: ManualMatchRequestVO): Promise<boolean> {
    return request.post({
      url: '/drug/ypid-pending-batch/confirm',
      data: params
    })
  },

  /**
   * 获取匹配候选项
   */
  async getMatchCandidates(id: number): Promise<MatchResultVO> {
    return request.get({
      url: '/drug/ypid-pending-batch/search-candidates',
      params: { id }
    })
  },

  /**
   * 获取任务报告信息
   */
  async getTaskReport(taskId: number) {
    return request.get({
      url: `/drug/ypid-match-task/${taskId}/report`
    })
  },

  // ========================= 匹配报告 =========================

  /**
   * 生成匹配报告
   */
  async generateReport(taskId: number): Promise<MatchReportVO> {
    return request.post({
      url: '/drug/ypid/report/generate',
      data: { taskId }
    })
  },

  /**
   * 获取匹配报告列表
   */
  async getReportList(params: {
    pageNo: number
    pageSize: number
    taskId?: number
    hospitalName?: string
    startTime?: string
    endTime?: string
  }) {
    return request.get({
      url: '/drug/ypid/report/list',
      params
    })
  },

  /**
   * 获取匹配报告详情
   */
  async getReportDetail(reportId: string): Promise<MatchReportVO> {
    return request.get({
      url: `/drug/ypid/report/detail/${reportId}`
    })
  },

  /**
   * 导出匹配报告
   */
  async exportReport(reportId: string): Promise<void> {
    return request.download({
      url: `/drug/ypid/report/export/${reportId}`
    })
  },

  /**
   * 导出报告Excel
   */
  async exportReportExcel(reportId: string): Promise<void> {
    return request.download({
      url: `/drug/ypid/report/export-excel/${reportId}`
    })
  },

  /**
   * 获取报告匹配详情
   */
  async getReportMatchDetails(params: {
    pageNo: number
    pageSize: number
    reportId: string
    keyword?: string
    matchStatus?: number
  }) {
    return request.get({
      url: '/drug/ypid/report/match-details',
      params
    })
  },

  // ========================= 其他功能 =========================

  /**
   * 获取匹配历史
   */
  async getMatchHistory(pendingId: number): Promise<MatchHistoryVO[]> {
    return request.get({
      url: `/drug/ypid-pending-batch/history/${pendingId}`
    })
  },

  /**
   * 撤销匹配
   */
  async revokeMatch(pendingId: number, reason: string): Promise<boolean> {
    return request.post({
      url: '/drug/ypid-pending-batch/revoke',
      params: { pendingId, reason }
    })
  }
}
