import router from './router'
import type { RouteRecordRaw } from 'vue-router'
import { isRelogin } from '@/config/axios/service'
import { getAccessToken } from '@/utils/auth'
import { useTitle } from '@/hooks/web/useTitle'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import { useDictStoreWithOut } from '@/store/modules/dict'
import { useUserStoreWithOut } from '@/store/modules/user'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { SsoAuth } from '@/utils/sso'

const { start, done } = useNProgress()

const { loadStart, loadDone } = usePageLoading()

const parseURL = (
  url: string | null | undefined
): { basePath: string; paramsObject: { [key: string]: string } } => {
  // 如果输入为 null 或 undefined，返回空字符串和空对象
  if (url == null) {
    return { basePath: '', paramsObject: {} }
  }

  // 找到问号 (?) 的位置，它之前是基础路径，之后是查询参数
  const questionMarkIndex = url.indexOf('?')
  let basePath = url
  const paramsObject: { [key: string]: string } = {}

  // 如果找到了问号，说明有查询参数
  if (questionMarkIndex !== -1) {
    // 获取 basePath
    basePath = url.substring(0, questionMarkIndex)

    // 从 URL 中获取查询字符串部分
    const queryString = url.substring(questionMarkIndex + 1)

    // 使用 URLSearchParams 遍历参数
    const searchParams = new URLSearchParams(queryString)
    searchParams.forEach((value, key) => {
      // 封装进 paramsObject 对象
      paramsObject[key] = value
    })
  }

  // 返回 basePath 和 paramsObject
  return { basePath, paramsObject }
}

// 路由加载前
router.beforeEach(async (to, from, next) => {
  start()
  loadStart()

  // 优先处理SSO回调Token和错误（在所有路由判断之前，且必须立即处理）
  const urlParams = new URLSearchParams(window.location.search)
  const hasAccessToken = urlParams.has('accessToken')
  const hasRefreshToken = urlParams.has('refreshToken')
  const hasSsoError = urlParams.has('ssoError')

  // 处理 SSO 错误（用户未注册等）
  if (hasSsoError) {
    const ssoError = urlParams.get('ssoError')
    const message = urlParams.get('message') || 'SSO登录失败'
    const ssoUserId = urlParams.get('ssoUserId')
    
    console.error('[SSO] SSO错误:', ssoError, 'message:', message, 'ssoUserId:', ssoUserId)
    
    // 清理重定向状态
    SsoAuth.setRedirecting(false)
    
    // 复用全局重新登录弹框机制
    if (!isRelogin.show) {
      isRelogin.show = true
      
      // 构建提示消息
      let alertMessage = decodeURIComponent(message)
      if (ssoError === 'USER_NOT_REGISTERED' && ssoUserId) {
        alertMessage += `\n\n单点账号ID：${ssoUserId}\n请将此信息提供给系统管理员`
      }
      
      import('element-plus').then(({ ElMessageBox }) => {
        ElMessageBox.confirm(
          alertMessage,
          ssoError === 'USER_NOT_REGISTERED' ? '无权限访问' : 'SSO登录失败',
          {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning',
            closeOnClickModal: false,
            showClose: false
          }
        ).then(() => {
          // 点击重新登录，清理状态并刷新页面
          // 注意：后端已经注销了单点平台session，所以刷新后会重新跳转到单点登录页
          isRelogin.show = false
          SsoAuth.setRedirecting(false)  // 清理重定向状态
          window.history.replaceState({}, '', window.location.pathname)
          window.location.href = window.location.pathname
        }).catch(() => {
          // 点击取消，清理状态并停留在当前页面
          isRelogin.show = false
          SsoAuth.setRedirecting(false)  // 清理重定向状态
          window.history.replaceState({}, '', window.location.pathname)
          // 显示一个提示信息
          import('element-plus').then(({ ElMessage }) => {
            ElMessage.info('请联系管理员开通系统权限后重新登录')
          })
        })
      })
    }
    
    next(false) // 取消本次导航，等待用户点击弹框
    return
  }

  if (hasAccessToken && hasRefreshToken) {
    const success = SsoAuth.handleSsoCallback()

    if (success) {
      // Token已保存成功，清理URL后重新导航到目标路径（不带查询参数）
      next({ path: to.path, replace: true })
      return
    } else {
      console.error('[SSO] Token保存失败')
      next('/login')
      return
    }
  }

  const currentToken = getAccessToken()

  if (currentToken) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      // 获取所有字典
      const dictStore = useDictStoreWithOut()
      const userStore = useUserStoreWithOut()
      const permissionStore = usePermissionStoreWithOut()
      
      if (!dictStore.getIsSetDict) {
        await dictStore.setDictMap()
      }
      
      if (!userStore.getIsSetUser) {
        isRelogin.show = true
        await userStore.setUserInfoAction()
        isRelogin.show = false
        
        // 后端过滤菜单
        await permissionStore.generateRoutes()
        
        permissionStore.getAddRouters.forEach((route) => {
          router.addRoute(route as unknown as RouteRecordRaw) // 动态添加可访问路由表
        })
        
        const redirectPath = from.query.redirect || to.path
        const redirect = decodeURIComponent(redirectPath as string)
        const { paramsObject: query } = parseURL(redirect)
        
        // 无论哪种情况都使用 replace: true 替换历史记录，避免产生重复标签页
        const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect, query, replace: true }
        next(nextData)
      } else {
        next()
      }
    }
  } else {
    // SSO  白名单：这些路由允许在未登录状态下访问
    const ssoWhiteList = [
      '/login'
    ]

    if (ssoWhiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      // 未登录且不在白名单，触发SSO登录
      // 如果正在重定向中但needSsoLogin返回false，可能是重定向标记未清理
      // 强制检查重定向状态
      const isRedirecting = SsoAuth.isRedirecting()
      
      if (SsoAuth.needSsoLogin()) {
        // 异步执行重定向，不阻塞路由守卫
        SsoAuth.redirectToSso().catch((error) => {
          console.error('[路由守卫] SSO重定向失败:', error)
          SsoAuth.setRedirecting(false)
          
          // SSO失败后，显示错误页面
          import('element-plus').then(({ ElMessageBox }) => {
            ElMessageBox.alert(
              'SSO单点登录服务暂时不可用，请稍后重试或联系系统管理员。',
              '无法连接到登录服务',
              {
                confirmButtonText: '刷新页面',
                type: 'error',
                callback: () => {
                  window.location.reload()
                }
              }
            )
          })
        })
        next(false) // 取消本次导航，等待 window.location.href 跳转到SSO或显示错误弹窗
        return
      } else if (isRedirecting) {
        // 正在重定向中，等待重定向完成或超时
        next(false)
      } else {
        // needSsoLogin返回false且不在重定向中，清理状态后重新触发SSO登录
        console.warn('[路由守卫] SSO状态异常，清理后重新触发')
        SsoAuth.setRedirecting(false)
        SsoAuth.redirectToSso().catch((error) => {
          console.error('[路由守卫] SSO重定向失败:', error)
          SsoAuth.setRedirecting(false)
        })
        next(false)
      }
    }
  }
})

router.afterEach((to) => {
  useTitle(to?.meta?.title as string)
  done() // 结束Progress
  loadDone()
})
