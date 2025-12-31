import request from '@/config/axios'

// 创建工单
export const createFeedback = (data) => {
  return request.post({
    url: '/drug/feedback/create',
    data
  })
}

// 更新工单状态
export const updateFeedbackStatus = (data) => {
  return request.put({
    url: '/drug/feedback/update',
    data
  })
}

export const updateFeedbackStatus2 = (data) => {
  return request.put({
    url: '/drug/feedback/update-status',
    data
  })
}

// 追加对话消息
export const appendFeedbackMessage = (data) => {
  return request.post({
    url: '/drug/feedback/append-message',
    data
  })
}

// 获得工单
export const getFeedback = (id) => {
  return request.get({
    url: '/drug/feedback/get?id=' + id
  })
}

// 获得工单分页
export const getFeedbackPage = (params) => {
  return request.get({
    url: '/drug/feedback/my',
    params
  })
}

// 获取未读反馈数量
export const getUnreadFeedbackCount = () => {
  return request.get({
    url: '/drug/feedback/unread-count'
  })
}
