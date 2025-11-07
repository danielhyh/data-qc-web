import request from '@/config/axios'

// SSO统一认证相关API

/**
 * 获取SSO登录地址
 */
export const getSsoLoginUrl = () => {
  return request.get({ 
    url: '/system/auth/sso/login-url',
    timeout: 10000  // 10秒超时
  })
}

/**
 * SSO注销
 */
export const ssoLogout = () => {
  return request.post({ url: '/system/auth/sso/logout' })
}

/**
 * SSO配置测试接口
 */
export const testSsoConfig = () => {
  return request.get({ url: '/system/auth/sso/test' })
}