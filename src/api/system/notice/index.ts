import request from '@/config/axios'

export interface NoticeVO {
  id: number | undefined
  title: string
  type: number
  content: string
  status: number
  remark: string
  creator: string
  createTime: Date
  // 推送目标相关字段
  targetAdminLevels?: number[]
  targetBusinessType?: string
  publishStatus?: number
  publishTime?: Date
  // 阅读相关字段
  readStatus?: boolean
  readTime?: Date
  // 工作台展示
  showOnDashboard?: boolean
}

// 查询公告列表
export const getNoticePage = (params: PageParam) => {
  return request.get({ url: '/system/notice/page', params })
}

// 查询公告详情
export const getNotice = (id: number) => {
  return request.get({ url: '/system/notice/get?id=' + id })
}

// 新增公告
export const createNotice = (data: NoticeVO) => {
  return request.post({ url: '/system/notice/create', data })
}

// 修改公告
export const updateNotice = (data: NoticeVO) => {
  return request.put({ url: '/system/notice/update', data })
}

// 删除公告
export const deleteNotice = (id: number) => {
  return request.delete({ url: '/system/notice/delete?id=' + id })
}

// 发布公告
export const publishNotice = (id: number) => {
  return request.post({ url: '/system/notice/publish?id=' + id })
}

// 关闭公告
export const closeNotice = (id: number) => {
  return request.post({ url: '/system/notice/close?id=' + id })
}

// ========== 用户端接口 ==========

// 获取我的公告分页列表
export const getMyNoticePage = (params: PageParam) => {
  return request.get({ url: '/system/notice/my-page', params })
}

// 获取我的未读公告数量
export const getMyUnreadCount = () => {
  return request.get({ url: '/system/notice/my-unread-count' })
}

// 获取我的未读公告列表
export const getMyUnreadList = (size?: number) => {
  return request.get({ url: '/system/notice/my-unread-list', params: { size } })
}

// 标记公告已读
export const markAsRead = (ids: number[]) => {
  return request.put({ url: '/system/notice/mark-read', params: { ids } })
}

// 标记所有公告已读
export const markAllAsRead = () => {
  return request.put({ url: '/system/notice/mark-all-read' })
}

// 获取公告详情并标记已读
export const getMyNoticeDetail = (id: number) => {
  return request.get({ url: '/system/notice/my-detail?id=' + id })
}


// 已读统计信息
export interface NoticeReadStatsVO {
  noticeId: number
  targetUserCount: number
  readUserCount: number
  unreadUserCount: number
  readRate: number
  readUsers: ReadUserInfo[]
  readUserTotal: number // 用于分页
}

export interface ReadUserInfo {
  userId: number
  username: string // 用户账号
  nickname: string // 用户昵称/身份
  realName: string // 真实姓名
  mobile: string // 手机号
  deptName: string // 所属机构
  readTime: Date
}

// 获取公告已读统计（分页）
export const getReadStats = (id: number, pageNo = 1, pageSize = 10) => {
  return request.get({ url: '/system/notice/read-stats', params: { id, pageNo, pageSize } })
}

// 获取工作台通知列表
export const getDashboardNoticeList = () => {
  return request.get({ url: '/system/notice/dashboard' })
}

// 切换工作台展示状态
export const toggleDashboard = (id: number, showOnDashboard: boolean) => {
  return request.put({ url: '/system/notice/toggle-dashboard', params: { id, showOnDashboard } })
}
