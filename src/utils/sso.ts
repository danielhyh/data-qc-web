// SSO工具类 - 简化版
// 文件位置: data-qc-web/src/utils/sso.ts

import { getAccessToken, setToken, removeToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'
import * as SsoApi from '@/api/login/sso'

// SSO重定向状态管理
let isRedirecting = false

export const SsoAuth = {

  /**
   * 检查是否需要SSO登录
   */
  needSsoLogin(): boolean {
    // 如果正在重定向中，不需要再次触发
    if (isRedirecting) {
      return false
    }

    const token = getAccessToken()
    // 检查URL是否有SSO回调参数
    const urlParams = new URLSearchParams(window.location.search)
    const hasAccessToken = urlParams.has('accessToken')
    const hasRefreshToken = urlParams.has('refreshToken')
    const isCallback = hasAccessToken && hasRefreshToken

    return !token && !isCallback
  },

  /**
   * 重定向到SSO登录
   */
  async redirectToSso(): Promise<void> {
    // 设置重定向标记
    isRedirecting = true


    try {
      const response = await SsoApi.getSsoLoginUrl()
      const loginUrl = response?.data || response

      if (loginUrl) {
        console.log('重定向到SSO:', loginUrl)
        // 执行重定向，页面会跳转，标记会自动重置
        window.location.href = loginUrl
      } else {
        throw new Error('未获取到SSO登录地址')
      }
    } catch (error) {
      console.error('SSO登录失败:', error)
      ElMessage.error('SSO服务不可用，转为本地登录')
      // 重置标记
      isRedirecting = false
      // 降级到本地登录
      window.location.href = '/#/login'
    }
  },

  /**
   * 同步方式重定向到SSO（用于路由守卫）
   */
  redirectToSsoSync(): void {
    // 使用异步但不等待，避免阻塞路由守卫
    this.redirectToSso().catch(() => {
      // 如果失败，重置标记并跳转到登录页
      isRedirecting = false
      window.location.href = '/#/login'
    })
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
        console.log('[SSO] Token保存完成，清理URL参数')
        this.clearUrlParams()
        console.log('[SSO] URL参数清理完成')
        return true
      } catch (e) {
        console.error('[SSO] Token保存失败:', e)
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
      console.error('SSO注销失败:', error)
    } finally {
      removeToken()
      // 注销后重定向到前端首页的Vue路由，保留当前路径前缀（如 /sxwjwypjc）
      // 使用 location.pathname 保留路径前缀，只修改 hash
      window.location.href = window.location.pathname + '#/'
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

