// SSO工具类 - 简化版
// 文件位置: data-qc-web/src/utils/sso.ts

import { getAccessToken, setToken, removeToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'
import * as SsoApi from '@/api/login/sso'

// SSO重定向状态key
const SSO_REDIRECTING_KEY = 'sso_redirecting'
const SSO_REDIRECT_TIMEOUT = 5000 // 5秒超时（从10秒改为5秒，更快响应）

export const SsoAuth = {

  /**
   * 初始化SSO状态（在应用启动时调用）
   */
  init(): void {
    const redirecting = localStorage.getItem(SSO_REDIRECTING_KEY)
    if (redirecting) {
      const timestamp = parseInt(redirecting, 10)
      const now = Date.now()
      const elapsed = now - timestamp
      
      // 如果有残留状态且已经超时，清理掉
      if (elapsed > SSO_REDIRECT_TIMEOUT) {
        console.warn('[SSO] 应用启动时发现残留的重定向状态，已清理')
        localStorage.removeItem(SSO_REDIRECTING_KEY)
      }
    }
  },

  /**
   * 检查是否正在重定向
   */
  isRedirecting(): boolean {
    const redirecting = localStorage.getItem(SSO_REDIRECTING_KEY)
    if (!redirecting) return false
    
    const timestamp = parseInt(redirecting, 10)
    const now = Date.now()
    const elapsed = now - timestamp
    
    // 如果超过5秒还没完成，认为重定向失败，清除状态
    if (elapsed > SSO_REDIRECT_TIMEOUT) {
      console.warn('[SSO] 重定向超时，清除状态')
      localStorage.removeItem(SSO_REDIRECTING_KEY)
      return false
    }
    
    return true
  },

  /**
   * 设置重定向状态
   */
  setRedirecting(redirecting: boolean): void {
    if (redirecting) {
      localStorage.setItem(SSO_REDIRECTING_KEY, Date.now().toString())
    } else {
      localStorage.removeItem(SSO_REDIRECTING_KEY)
    }
  },

  /**
   * 检查是否需要SSO登录
   */
  needSsoLogin(): boolean {
    // 如果正在重定向中，不需要再次触发
    if (this.isRedirecting()) {
      return false
    }

    const token = getAccessToken()
    // 检查URL是否有SSO回调参数
    const urlParams = new URLSearchParams(window.location.search)
    const hasAccessToken = urlParams.has('accessToken')
    const hasRefreshToken = urlParams.has('refreshToken')
    const hasSsoError = urlParams.has('ssoError')
    const isCallback = hasAccessToken && hasRefreshToken

    return !token && !isCallback && !hasSsoError
  },

  /**
   * 重定向到SSO登录
   */
  async redirectToSso(): Promise<void> {
    this.setRedirecting(true)

    try {
      const response = await SsoApi.getSsoLoginUrl()
      const loginUrl = response?.data || response

      if (loginUrl) {
        console.log('[SSO] 重定向到SSO登录页:', loginUrl)
        window.location.href = loginUrl
      } else {
        throw new Error('未获取到SSO登录地址')
      }
    } catch (error: any) {
      console.error('[SSO] SSO服务不可用:', error)
      this.setRedirecting(false)
      
      if (import.meta.env.DEV) {
        ElMessage.warning('SSO未配置，请联系管理员')
      } else {
        ElMessage.error('SSO服务不可用，请联系管理员')
      }
      
      throw error
    }
  },

  /**
   * 处理SSO回调Token
   */
  handleSsoCallback(): boolean {
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('accessToken')
    const refreshToken = urlParams.get('refreshToken')
    const expiresTime = urlParams.get('expiresTime')
    const error = urlParams.get('error')

    console.log('[SSO] handleSsoCallback 执行', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasError: !!error
    })

    if (error) {
      ElMessage.error('SSO登录失败: ' + decodeURIComponent(error))
      this.clearUrlParams()
      return false
    }

    if (accessToken && refreshToken) {
      console.log('[SSO] 开始保存Token到localStorage')
      try {
        // 解析expiresTime为时间戳（毫秒）
        let expiresTimeNum = 0
        if (expiresTime) {
          // 后端传来的是ISO 8601格式字符串，如 "2025-10-17T19:53:22.119884400"
          const expiresDate = new Date(expiresTime)
          expiresTimeNum = expiresDate.getTime()
        }

        // 使用setToken保存完整的token对象（包含refreshToken）
        setToken({
          id: 0, // SSO登录时不需要
          accessToken: accessToken,
          refreshToken: refreshToken,
          userId: 0, // SSO登录时不需要
          userType: 0, // SSO登录时不需要
          clientId: '', // SSO登录时不需要
          expiresTime: expiresTimeNum
        })
        console.log('[SSO] Token保存完成，清理重定向状态和URL参数')
        // 清理重定向状态
        this.setRedirecting(false)
        this.clearUrlParams()
        console.log('[SSO] 清理完成')
        return true
      } catch (e) {
        console.error('[SSO] Token保存失败:', e)
        this.setRedirecting(false)
        return false
      }
    }

    console.log('[SSO] 未找到有效的token参数')
    return false
  },

  /**
   * SSO注销
   */
  async logout(): Promise<void> {
    try {
      await SsoApi.ssoLogout()
    } catch (error) {
      console.error('[SSO] SSO注销失败:', error)
    } finally {
      removeToken()
      // 清理重定向状态
      this.setRedirecting(false)
      // 注销后刷新页面，触发重新SSO登录
      // 注意：使用 History 路由，不需要 hash
      window.location.href = window.location.pathname
    }
  },

  /**
   * 清理URL参数
   */
  clearUrlParams(): void {
    const url = new URL(window.location.href)
    url.search = ''
    window.history.replaceState({}, '', url.toString())
  }
}

