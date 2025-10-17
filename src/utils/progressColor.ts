// utils/progressColor.ts

/**
 * 根据进度百分比返回对应颜色
 * @param percentage 进度百分比 0-100
 * @returns 颜色值
 */
export function getProgressColor(percentage?: number | null): string {
  if (percentage === undefined || percentage === null) {
    return '#F56C6C' // 空值-红色
  }

  if (percentage >= 100) return '#67C23A' // 完成-绿色
  if (percentage >= 80) return '#409EFF'  // 良好-蓝色
  if (percentage >= 50) return '#E6A23C'  // 一般-橙色
  return '#F56C6C' // 较差-红色
}

/**
 * 获取进度状态文本
 * @param percentage 进度百分比
 * @returns 状态文本
 */
export function getProgressStatus(percentage?: number | null): string {
  if (percentage === undefined || percentage === null) return '未开始'
  if (percentage >= 100) return '已完成'
  if (percentage >= 80) return '进展良好'
  if (percentage >= 50) return '进行中'
  return '进度滞后'
}
