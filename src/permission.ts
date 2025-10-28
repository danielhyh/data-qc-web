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

  console.log('[路由守卫] ===== 开始 =====', {
    from: from.path,
    to: to.path,
    toFullPath: to.fullPath,
    fromFullPath: from.fullPath,
    hasQuery: Object.keys(to.query).length > 0,
    query: to.query
  })

  // 优先处理SSO回调Token（在所有路由判断之前，且必须立即处理）
  const urlParams = new URLSearchParams(window.location.search)
  const hasAccessToken = urlParams.has('accessToken')
  const hasRefreshToken = urlParams.has('refreshToken')

  if (hasAccessToken && hasRefreshToken) {
    console.log('[SSO] 检测到SSO token参数，开始保存')
    const success = SsoAuth.handleSsoCallback()
    console.log('[SSO] Token保存结果:', success, '当前token:', getAccessToken())

    if (success) {
      // Token已保存成功，清理URL后重新导航到目标路径（不带查询参数）
      console.log('[SSO] Token保存成功，重新导航到:', to.path)
      // 使用 replace: true 替换当前历史记录，避免产生新的标签页
      console.log('[路由守卫] 执行 next() 到干净的路径')
      next({ path: to.path, replace: true })
      return
    } else {
      console.error('[SSO] Token保存失败')
      console.log('[路由守卫] 执行 next("/login")')
      next('/login')
      return
    }
  }

  const currentToken = getAccessToken()
  console.log('[路由守卫] 当前token状态:', currentToken ? '有token' : '无token', 'to.path:', to.path)

  if (currentToken) {
    if (to.path === '/login') {
      console.log('[路由守卫] 已登录但访问login页，重定向到首页')
      console.log('[路由守卫] 执行 next({ path: "/" })')
      next({ path: '/' })
    } else {
      // 获取所有字典
      const dictStore = useDictStoreWithOut()
      const userStore = useUserStoreWithOut()
      const permissionStore = usePermissionStoreWithOut()
      
      console.log('[路由守卫] 检查字典状态:', dictStore.getIsSetDict)
      if (!dictStore.getIsSetDict) {
        console.log('[路由守卫] 开始加载字典...')
        await dictStore.setDictMap()
        console.log('[路由守卫] 字典加载完成')
      }
      
      console.log('[路由守卫] 检查用户信息状态:', userStore.getIsSetUser)
      if (!userStore.getIsSetUser) {
        console.log('[路由守卫] 用户信息未加载，开始加载...')
        isRelogin.show = true
        await userStore.setUserInfoAction()
        isRelogin.show = false
        console.log('[路由守卫] 用户信息加载完成')
        
        // 后端过滤菜单
        console.log('[路由守卫] 开始生成路由...')
        await permissionStore.generateRoutes()
        console.log('[路由守卫] 路由生成完成，动态路由数量:', permissionStore.getAddRouters.length)
        
        permissionStore.getAddRouters.forEach((route) => {
          router.addRoute(route as unknown as RouteRecordRaw) // 动态添加可访问路由表
        })
        
        const redirectPath = from.query.redirect || to.path
        // 修复跳转时不带参数的问题
        const redirect = decodeURIComponent(redirectPath as string)
        const { paramsObject: query } = parseURL(redirect)
        
        console.log('[路由守卫] 准备跳转:', {
          from_path: from.path,
          to_path: to.path,
          redirectPath: redirectPath,
          redirect: redirect,
          query: query,
          isSamePath: to.path === redirect
        })
        
        // 【修复】无论哪种情况都使用 replace: true 替换历史记录，避免产生重复标签页
        const nextData = to.path === redirect ? { ...to, replace: true } : { path: redirect, query, replace: true }
        console.log('[路由守卫] 执行 next() with:', nextData)
        next(nextData)
      } else {
        console.log('[路由守卫] 用户信息已加载，直接放行')
        console.log('[路由守卫] 执行 next()')
        next()
      }
    }
  } else {
    console.log('[路由守卫] 无token，检查白名单')
    // SSO  白名单：这些路由允许在未登录状态下访问
    const ssoWhiteList = [
      '/login'
    ]

    if (ssoWhiteList.indexOf(to.path) !== -1) {
      console.log('[路由守卫] 在白名单中，直接放行')
      console.log('[路由守卫] 执行 next()')
      next()
    } else {
      // 未登录且不在白名单，触发SSO登录
      if (SsoAuth.needSsoLogin()) {
        console.log('[路由守卫] 触发SSO重定向')
        SsoAuth.redirectToSsoSync()
        console.log('[路由守卫] 执行 next(false) - 取消本次导航')
        next(false) // 取消本次导航
        return
      } else {
        console.log('[路由守卫] SSO正在重定向中，等待...')
        console.log('[路由守卫] 执行 next(false) - 等待重定向')
        next(false)
      }
    }
  }
  
  console.log('[路由守卫] ===== 结束 =====')
})

router.afterEach((to) => {
  console.log('[路由守卫] afterEach 触发:', {
    path: to.path,
    fullPath: to.fullPath,
    name: to.name,
    meta: to.meta
  })
  useTitle(to?.meta?.title as string)
  done() // 结束Progress
  loadDone()
})
