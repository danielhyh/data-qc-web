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
import { getAccessToken } from '@/utils/auth'
import { isRelogin } from '@/config/axios/service'
import { useI18n } from '@/hooks/web/useI18n'
import { useUserStore } from '@/store/modules/user'
import { useTagsViewStore } from '@/store/modules/tagsView'

const INACTIVITY_LIMIT = 1000 * 60 * 1000 // 10 分钟
let inactivityTimer: number | null = null

const clearInactivityTimer = () => {
  if (inactivityTimer) {
    window.clearTimeout(inactivityTimer)
    inactivityTimer = null
  }
}

const showInactivityLogoutConfirm = async () => {
  const { t } = useI18n()
  const userStore = useUserStore()
  const tagsViewStore = useTagsViewStore()

  // 显示弹框提示用户重新登录
  ElMessageBox.confirm(t('sys.api.timeoutMessage'), t('common.confirmTitle'), {
    showCancelButton: false,
    closeOnClickModal: false,
    showClose: false,
    closeOnPressEscape: false,
    confirmButtonText: t('login.relogin'),
    type: 'warning'
  })
    .then(async () => {
      // 执行完整的登出逻辑
      await userStore.loginOut()
      tagsViewStore.delAllViews()
      isRelogin.show = false
      // 注意：userStore.loginOut() 内部会调用 SsoAuth.logout() 并刷新页面
    })
    .catch(async () => {
      // 即使用户尝试关闭弹框,也执行完整的登出逻辑
      await userStore.loginOut()
      tagsViewStore.delAllViews()
      isRelogin.show = false
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
