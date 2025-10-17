import request from '@/config/axios'

export interface DashboardStatistics {
  pendingTasks: Record<number, number>
  yearlyData: Record<number, number>
  recentTasks: TaskInfo[]
  recentMessages: MessageInfo[]
}

export interface TaskInfo {
  id: number
  title: string
  type: 'import' | 'qc' | 'review' | 'system' | 'message' | 'analysis'
  status: 'pending' | 'processing' | 'error' | 'completed'
  priority?: 'high' | 'medium' | 'low'
  createTime: Date
  systemId?: number
}

export interface MessageInfo {
  id: number
  title: string
  content?: string
  type: 'system' | 'warning' | 'success' | 'error' | 'notice' | 'report' | 'user'
  priority?: 'high' | 'medium' | 'low'
  read: boolean
  createTime: Date
  link?: string
}

// 仪表板API
export const DashboardApi = {
  // 获取待处理任务数量
  getPendingTasks: (): Promise<Record<number, number>> => {
    return request.get({ url: '/system/dashboard/pending-tasks' })
  },

  // 获取年度数据统计
  getYearlyData: (): Promise<Record<number, number>> => {
    return request.get({ url: '/system/dashboard/yearly-data' })
  },

  // 获取最近任务列表
  getRecentTasks: (limit: number = 10): Promise<TaskInfo[]> => {
    return request.get({
      url: '/system/dashboard/recent-tasks',
      params: { limit }
    })
  },

  // 获取最近消息列表
  getRecentMessages: (limit: number = 10): Promise<MessageInfo[]> => {
    return request.get({
      url: '/system/dashboard/recent-messages',
      params: { limit }
    })
  },

  // 获取完整的仪表板数据
  getDashboardData: (): Promise<DashboardStatistics> => {
    return request.get({ url: '/system/dashboard/data' })
  },

  // 标记消息为已读
  markMessageAsRead: (messageId: number): Promise<void> => {
    return request.put({ url: `/system/dashboard/messages/${messageId}/read` })
  },

  // 标记所有消息为已读
  markAllMessagesAsRead: (): Promise<void> => {
    return request.put({ url: '/system/dashboard/messages/read-all' })
  },

  // 清空消息
  clearAllMessages: (): Promise<void> => {
    return request.delete({ url: '/system/dashboard/messages/clear-all' })
  }
}