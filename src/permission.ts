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

  // 优先处理SSO回调Token（在所有路由判断之前，且必须立即处理）
  const urlParams = new URLSearchParams(window.location.search)
  const hasAccessToken = urlParams.has('accessToken')
  const hasRefreshToken = urlParams.has('refreshToken')

  if (hasAccessToken && hasRefreshToken) {
    console.log('[SSO] 检测到SSO token参数，开始保存')
    const success = SsoAuth.handleSsoCallback()
    console.log('[SSO] Token保存结果:', success, '当前token:', getAccessToken())

    if (success) {
      // Token已保存成功，重新进入路由守卫流程（此时 getAccessToken() 应该有值了）
      console.log('[SSO] Token保存成功，继续路由守卫流程')
      // 不要直接 next()，而是让代码继续向下执行到 getAccessToken() 的判断
    } else {
      console.error('[SSO] Token保存失败')
      next('/login')
      return
    }
  }

  const currentToken = getAccessToken()
  console.log('[路由守卫] 当前token状态:', currentToken ? '有token' : '无token', 'to.path:', to.path)

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
        // 修复跳转时不带参数的问题
        const redirect = decodeURIComponent(redirectPath as string)
        const { paramsObject: query } = parseURL(redirect)
        const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect, query }
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
      if (SsoAuth.needSsoLogin()) {
        console.log('[路由守卫] 触发SSO重定向')
        SsoAuth.redirectToSsoSync()
        next(false) // 取消本次导航
        return
      } else {
        // 如果SSO不可用（例如正在重定向），等待
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
