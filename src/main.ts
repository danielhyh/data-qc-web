import 'uno.css'
import '@/plugins/unocss'

// 导入全局的svg图标
import '@/plugins/svgIcon'

// 初始化多语言
import { setupI18n } from '@/plugins/vueI18n'

// 引入状态管理
import { setupStore } from '@/store'

// 全局组件
import { setupGlobCom } from '@/components'

// 引入 element-plus
import { setupElementPlus } from '@/plugins/elementPlus'
import { ElMessageBox } from 'element-plus'

// 引入 form-create
import { setupFormCreate } from '@/plugins/formCreate'

// 引入全局样式
import '@/styles/index.scss'

// 引入动画
import '@/plugins/animate.css'

// 路由
import router, { setupRouter } from '@/router'

// 指令
import { setupAuth, setupMountedFocus } from '@/directives'

import { createApp } from 'vue'

import App from './App.vue'

import './permission'

import '@/plugins/tongji' // 百度统计
import Logger from '@/utils/Logger'

import VueDOMPurifyHTML from 'vue-dompurify-html' // 解决v-html 的安全隐患

// 引入SSO工具
import { SsoAuth } from '@/utils/sso'
import { getAccessToken, removeToken } from '@/utils/auth'
import { isRelogin } from '@/config/axios/service'
import { useI18n } from '@/hooks/web/useI18n'
import * as SsoApi from '@/api/login/sso'

const INACTIVITY_LIMIT = 10 * 60 * 1000 // 10 分钟
let inactivityTimer: number | null = null

const clearInactivityTimer = () => {
  if (inactivityTimer) {
    window.clearTimeout(inactivityTimer)
    inactivityTimer = null
  }
}

const showInactivityLogoutConfirm = () => {
  const { t } = useI18n()

  // 先调用后端SSO注销接口并清除本地token
  // 但不刷新页面，让弹框先显示
  SsoApi.ssoLogout().catch((error) => {
    console.error('[Inactivity] SSO注销失败:', error)
  })
  removeToken()
  SsoAuth.setRedirecting(false)

  // 显示弹框提示用户重新登录
  ElMessageBox.confirm(t('sys.api.timeoutMessage'), t('common.confirmTitle'), {
    showCancelButton: false,
    closeOnClickModal: false,
    showClose: false,
    closeOnPressEscape: false,
    confirmButtonText: t('login.relogin'),
    type: 'warning'
  })
    .then(() => {
      isRelogin.show = false
      // 刷新页面，触发SSO登录流程
      window.location.href = window.location.pathname
    })
    .catch(() => {
      isRelogin.show = false
      // 即使用户尝试关闭弹框，也刷新页面强制重新登录
      window.location.href = window.location.pathname
    })
}

const resetInactivityTimer = () => {
  // 未登录不计时
  if (!getAccessToken()) {
    clearInactivityTimer()
    return
  }

  clearInactivityTimer()

  inactivityTimer = window.setTimeout(() => {
    // 到点再确认一次还在登录状态，且没有其它超时弹框
    if (!getAccessToken()) return
    if (isRelogin.show) return

    isRelogin.show = true
    showInactivityLogoutConfirm()
  }, INACTIVITY_LIMIT)
}

const setupInactivityForceLogout = () => {
  const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart']
  events.forEach((event) => {
    window.addEventListener(event, resetInactivityTimer, true)
  })
  // 应用启动时，根据当前 token 状态启动一次计时
  resetInactivityTimer()
}
// 创建实例
const setupAll = async () => {
  // 初始化SSO状态，清理可能残留的重定向标记
  SsoAuth.init()

  const app = createApp(App)

  await setupI18n(app)

  setupStore(app)

  setupGlobCom(app)

  setupElementPlus(app)

  setupFormCreate(app)

  setupRouter(app)

  // directives 指令
  setupAuth(app)
  setupMountedFocus(app)

  await router.isReady()

  app.use(VueDOMPurifyHTML)

  app.mount('#app')

  // 启用“空闲 10 分钟强制退出登录”
  setupInactivityForceLogout()
}

setupAll()

Logger.prettyPrimary(`欢迎使用`, import.meta.env.VITE_APP_TITLE)
