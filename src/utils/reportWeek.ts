/**
 * 填报周期工具函数
 *
 * 统一管理周期计算逻辑，确保前端周期格式与后端一致
 * 周期格式: YYYY-WW (例如: 2025-12)
 * 使用 ISO 8601 周编号标准
 *
 * @author hyh
 */

/**
 * 获取当前周期
 * @returns 周期字符串，格式：YYYY-WW (例如: 2025-12)
 */
export function getCurrentWeek(): string {
  return getWeekOfDate(new Date())
}

/**
 * 获取指定日期所在的周期
 * @param date 日期对象
 * @returns 周期字符串，格式：YYYY-WW
 */
export function getWeekOfDate(date: Date): string {
  // 使用 ISO 8601 周编号标准
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7 // 周日为7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum) // 找到该周的周四
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  const year = d.getUTCFullYear()

  return `${year}-${String(weekNumber).padStart(2, '0')}`
}

/**
 * 获取指定日期的周数（仅数字）
 * @param date 日期对象
 * @returns 周数
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/**
 * 获取上一周期
 * @param currentWeek 当前周期 (格式: YYYY-WW)
 * @returns 上一周期
 */
export function getPreviousWeek(currentWeek: string): string {
  if (!isValidWeekFormat(currentWeek)) {
    return getCurrentWeek()
  }

  const [yearStr, weekStr] = currentWeek.split('-')
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)

  // 找到当前周期的周一
  const firstDayOfWeek = getFirstDayOfWeek(year, week)

  // 减去7天得到上一周
  const previousWeekDate = new Date(firstDayOfWeek)
  previousWeekDate.setDate(previousWeekDate.getDate() - 7)

  return getWeekOfDate(previousWeekDate)
}

/**
 * 获取下一周期
 * @param currentWeek 当前周期 (格式: YYYY-WW)
 * @returns 下一周期
 */
export function getNextWeek(currentWeek: string): string {
  if (!isValidWeekFormat(currentWeek)) {
    return getCurrentWeek()
  }

  const [yearStr, weekStr] = currentWeek.split('-')
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)

  // 找到当前周期的周一
  const firstDayOfWeek = getFirstDayOfWeek(year, week)

  // 加上7天得到下一周
  const nextWeekDate = new Date(firstDayOfWeek)
  nextWeekDate.setDate(nextWeekDate.getDate() + 7)

  return getWeekOfDate(nextWeekDate)
}

/**
 * 解析周期字符串，获取年份
 * @param reportWeek 周期字符串 (格式: YYYY-WW)
 * @returns 年份
 */
export function parseYear(reportWeek: string): number | null {
  if (!isValidWeekFormat(reportWeek)) {
    return null
  }
  return parseInt(reportWeek.split('-')[0])
}

/**
 * 解析周期字符串，获取周数
 * @param reportWeek 周期字符串 (格式: YYYY-WW)
 * @returns 周数
 */
export function parseWeekNumber(reportWeek: string): number | null {
  if (!isValidWeekFormat(reportWeek)) {
    return null
  }
  return parseInt(reportWeek.split('-')[1])
}

/**
 * 校验周期格式是否正确
 * @param reportWeek 周期字符串
 * @returns true-格式正确, false-格式错误
 */
export function isValidWeekFormat(reportWeek: string | null | undefined): boolean {
  if (!reportWeek) return false
  return /^\d{4}-\d{2}$/.test(reportWeek)
}

/**
 * 获取周期的开始日期（周一）
 * @param reportWeek 周期字符串 (格式: YYYY-WW)
 * @returns 周一日期
 */
export function getStartOfWeek(reportWeek: string): Date | null {
  if (!isValidWeekFormat(reportWeek)) {
    return null
  }

  const year = parseYear(reportWeek)!
  const week = parseWeekNumber(reportWeek)!

  return getFirstDayOfWeek(year, week)
}

/**
 * 获取周期的结束日期（周日）
 * @param reportWeek 周期字符串 (格式: YYYY-WW)
 * @returns 周日日期
 */
export function getEndOfWeek(reportWeek: string): Date | null {
  const startOfWeek = getStartOfWeek(reportWeek)
  if (!startOfWeek) {
    return null
  }

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)
  return endOfWeek
}

/**
 * 格式化周期为日期范围显示
 * @param reportWeek 周期字符串 (格式: YYYY-WW)
 * @returns 日期范围字符串 (格式: MM月dd日-MM月dd日)
 */
export function formatWeekToDateRange(reportWeek: string): string {
  const startOfWeek = getStartOfWeek(reportWeek)
  if (!startOfWeek) {
    return ''
  }

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 6)

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}月${day}日`
  }

  return `${formatDate(startOfWeek)}-${formatDate(endOfWeek)}`
}

/**
 * 获取指定年份第N周的周一日期
 * @param year 年份
 * @param week 周数
 * @returns 周一日期
 */
function getFirstDayOfWeek(year: number, week: number): Date {
  // 找到该年第一天
  const jan1 = new Date(Date.UTC(year, 0, 1))
  const jan1DayOfWeek = jan1.getUTCDay() || 7

  // ISO 8601: 第一周是包含1月4日的那一周
  // 找到第一周的周一
  const firstMonday = new Date(jan1)
  firstMonday.setUTCDate(jan1.getUTCDate() - jan1DayOfWeek + 1)

  // 如果第一周的周一在去年，则使用1月4日所在周的周一
  if (firstMonday.getUTCFullYear() < year) {
    firstMonday.setUTCDate(firstMonday.getUTCDate() + 7)
  }

  // 加上(week-1)周
  const targetMonday = new Date(firstMonday)
  targetMonday.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7)

  return targetMonday
}

