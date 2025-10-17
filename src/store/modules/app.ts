import { defineStore } from 'pinia'
import { store } from '../index'
import { humpToUnderline, setCssVar } from '@/utils'
import { ElMessage } from 'element-plus'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'
import { ElementPlusSize } from '@/types/elementPlus'
import { LayoutType } from '@/types/layout'
import { ThemeTypes } from '@/types/theme'

const { wsCache } = useCache()

// 机构用户的样式配置
const institutionThemeConfig = {
  // 面包屑
  breadcrumb: true,
  // 面包屑图标
  breadcrumbIcon: true,
  // 折叠图标
  hamburger: true,
  // 全屏图标
  screenfull: true,
  // 尺寸图标
  size: true,
  // 多语言图标
  locale: true,
  // 消息图标
  message: true,
  // 标签页
  tagsView: true,
  // 标签页
  tagsViewImmerse: false,
  // 标签页图标
  tagsViewIcon: true,
  // logo
  logo: true,
  // 菜单手风琴
  uniqueOpened: true,
  // 固定header
  fixedHeader: true,
  // 页脚
  footer: false,
  // 灰色模式
  greyMode: false,
  // layout布局
  layout: 'top' as LayoutType,
  // 暗黑模式
  isDark: false,
  // 组件尺寸
  currentSize: 'default' as ElementPlusSize,
  // 主题相关
  theme: {
    // 主题色
    elColorPrimary: '#409eff',
    // 左侧菜单边框颜色
    leftMenuBorderColor: 'inherit',
    // 左侧菜单背景颜色
    leftMenuBgColor: '#151515',
    // 左侧菜单浅色背景颜色
    leftMenuBgLightColor: '#242424',
    // 左侧菜单选中背景颜色
    leftMenuBgActiveColor: 'var(--el-color-primary)',
    // 左侧菜单收起选中背景颜色
    leftMenuCollapseBgActiveColor: 'var(--el-color-primary)',
    // 左侧菜单字体颜色
    leftMenuTextColor: '#bfcbd9',
    // 左侧菜单选中字体颜色
    leftMenuTextActiveColor: '#fff',
    // logo字体颜色
    logoTitleTextColor: '#fff',
    // logo边框颜色
    logoBorderColor: '#151515',
    // 头部背景颜色
    topHeaderBgColor: '#151515',
    // 头部字体颜色
    topHeaderTextColor: '#fff',
    // 头部悬停颜色
    topHeaderHoverColor: '#242424',
    // 头部边框颜色
    topToolBorderColor: '#151515'
  }
}

interface AppState {
  breadcrumb: boolean
  breadcrumbIcon: boolean
  collapse: boolean
  uniqueOpened: boolean
  hamburger: boolean
  screenfull: boolean
  search: boolean
  size: boolean
  locale: boolean
  message: boolean
  tagsView: boolean
  tagsViewImmerse: boolean
  tagsViewIcon: boolean
  logo: boolean
  fixedHeader: boolean
  greyMode: boolean
  pageLoading: boolean
  layout: LayoutType
  title: string
  titleEn: string
  userInfo: string
  isDark: boolean
  currentSize: ElementPlusSize
  sizeMap: ElementPlusSize[]
  mobile: boolean
  footer: boolean
  theme: ThemeTypes
  fixedMenu: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => {
    return {
      userInfo: 'userInfo', // 登录信息存储字段-建议每个项目换一个字段，避免与其他项目冲突
      sizeMap: ['default', 'large', 'small'],
      mobile: false, // 是否是移动端
      title: import.meta.env.VITE_APP_TITLE, // 标题
      titleEn: import.meta.env.VITE_APP_TITLE_EN, // 英文标题
      pageLoading: false, // 路由跳转loading

      breadcrumb: true, // 面包屑
      breadcrumbIcon: true, // 面包屑图标
      collapse: false, // 折叠菜单
      uniqueOpened: true, // 是否只保持一个子菜单的展开
      hamburger: true, // 折叠图标
      screenfull: true, // 全屏图标
      search: true, // 搜索图标
      size: true, // 尺寸图标
      locale: true, // 多语言图标
      message: true, // 消息图标
      tagsView: true, // 标签页
      tagsViewImmerse: false, // 标签页沉浸
      tagsViewIcon: true, // 是否显示标签图标
      logo: true, // logo
      fixedHeader: true, // 固定toolheader
      footer: false, // 显示页脚
      greyMode: false, // 是否开始灰色模式，用于特殊悼念日
      fixedMenu: wsCache.get('fixedMenu') || false, // 是否固定菜单

      layout: wsCache.get(CACHE_KEY.LAYOUT) || 'classic', // layout布局
      isDark: wsCache.get(CACHE_KEY.IS_DARK) || false, // 是否是暗黑模式
      currentSize: wsCache.get('default') || 'default', // 组件尺寸
      theme: (() => {
        // 从缓存加载主题时验证用户身份
        const cachedThemeData = wsCache.get(CACHE_KEY.THEME)
        const currentUserInfo = wsCache.get(CACHE_KEY.USER)

        // 如果缓存中有主题数据且包含用户标识
        if (cachedThemeData && typeof cachedThemeData === 'object' && 'userId' in cachedThemeData) {
          // 验证用户身份是否匹配
          if (currentUserInfo && cachedThemeData.userId === currentUserInfo.user?.id) {
            // 用户匹配,返回缓存的主题配置
            return cachedThemeData.theme
          }
          // 用户不匹配,返回默认主题
        }

        // 兼容旧版缓存格式或返回默认主题
        return {
          // 主题色
          elColorPrimary: '#409eff',
          // 左侧菜单边框颜色
          leftMenuBorderColor: 'inherit',
          // 左侧菜单背景颜色
          leftMenuBgColor: '#001529',
          // 左侧菜单浅色背景颜色
          leftMenuBgLightColor: '#0f2438',
          // 左侧菜单选中背景颜色
          leftMenuBgActiveColor: 'var(--el-color-primary)',
          // 左侧菜单收起选中背景颜色
          leftMenuCollapseBgActiveColor: 'var(--el-color-primary)',
          // 左侧菜单字体颜色
          leftMenuTextColor: '#bfcbd9',
          // 左侧菜单选中字体颜色
          leftMenuTextActiveColor: '#fff',
          // logo字体颜色
          logoTitleTextColor: '#fff',
          // logo边框颜色
          logoBorderColor: 'inherit',
          // 头部背景颜色
          topHeaderBgColor: '#fff',
          // 头部字体颜色
          topHeaderTextColor: 'inherit',
          // 头部悬停颜色
          topHeaderHoverColor: '#f6f6f6',
          // 头部边框颜色
          topToolBorderColor: '#eee'
        }
      })()
    }
  },
  getters: {
    getBreadcrumb(): boolean {
      return this.breadcrumb
    },
    getBreadcrumbIcon(): boolean {
      return this.breadcrumbIcon
    },
    getCollapse(): boolean {
      return this.collapse
    },
    getUniqueOpened(): boolean {
      return this.uniqueOpened
    },
    getHamburger(): boolean {
      return this.hamburger
    },
    getScreenfull(): boolean {
      return this.screenfull
    },
    getSize(): boolean {
      return this.size
    },
    getLocale(): boolean {
      return this.locale
    },
    getMessage(): boolean {
      return this.message
    },
    getTagsView(): boolean {
      return this.tagsView
    },
    getTagsViewImmerse(): boolean {
      return this.tagsViewImmerse
    },
    getTagsViewIcon(): boolean {
      return this.tagsViewIcon
    },
    getLogo(): boolean {
      return this.logo
    },
    getFixedHeader(): boolean {
      return this.fixedHeader
    },
    getGreyMode(): boolean {
      return this.greyMode
    },
    getFixedMenu(): boolean {
      return this.fixedMenu
    },
    getPageLoading(): boolean {
      return this.pageLoading
    },
    getLayout(): LayoutType {
      return this.layout
    },
    getTitle(): string {
      return this.title
    },
    getTitleEn(): string {
      return this.titleEn
    },
    getUserInfo(): string {
      return this.userInfo
    },
    getIsDark(): boolean {
      return this.isDark
    },
    getCurrentSize(): ElementPlusSize {
      return this.currentSize
    },
    getSizeMap(): ElementPlusSize[] {
      return this.sizeMap
    },
    getMobile(): boolean {
      return this.mobile
    },
    getTheme(): ThemeTypes {
      return this.theme
    },
    getFooter(): boolean {
      return this.footer
    }
  },
  actions: {
    setBreadcrumb(breadcrumb: boolean) {
      this.breadcrumb = breadcrumb
    },
    setBreadcrumbIcon(breadcrumbIcon: boolean) {
      this.breadcrumbIcon = breadcrumbIcon
    },
    setCollapse(collapse: boolean) {
      this.collapse = collapse
    },
    setUniqueOpened(uniqueOpened: boolean) {
      this.uniqueOpened = uniqueOpened
    },
    setHamburger(hamburger: boolean) {
      this.hamburger = hamburger
    },
    setScreenfull(screenfull: boolean) {
      this.screenfull = screenfull
    },
    setSize(size: boolean) {
      this.size = size
    },
    setLocale(locale: boolean) {
      this.locale = locale
    },
    setMessage(message: boolean) {
      this.message = message
    },
    setTagsView(tagsView: boolean) {
      this.tagsView = tagsView
    },
    setTagsViewImmerse(tagsViewImmerse: boolean) {
      this.tagsViewImmerse = tagsViewImmerse
    },
    setTagsViewIcon(tagsViewIcon: boolean) {
      this.tagsViewIcon = tagsViewIcon
    },
    setLogo(logo: boolean) {
      this.logo = logo
    },
    setFixedHeader(fixedHeader: boolean) {
      this.fixedHeader = fixedHeader
    },
    setGreyMode(greyMode: boolean) {
      this.greyMode = greyMode
    },
    setFixedMenu(fixedMenu: boolean) {
      wsCache.set('fixedMenu', fixedMenu)
      this.fixedMenu = fixedMenu
    },
    setPageLoading(pageLoading: boolean) {
      this.pageLoading = pageLoading
    },
    setLayout(layout: LayoutType) {
      if (this.mobile && layout !== 'classic') {
        ElMessage.warning('移动端模式下不支持切换其他布局')
        return
      }
      this.layout = layout
      wsCache.set(CACHE_KEY.LAYOUT, this.layout)
    },
    setTitle(title: string) {
      this.title = title
    },
    setTitleEn(titleEn: string) {
      this.titleEn = titleEn
    },
    setIsDark(isDark: boolean) {
      this.isDark = isDark
      if (this.isDark) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }
      wsCache.set(CACHE_KEY.IS_DARK, this.isDark)
    },
    setCurrentSize(currentSize: ElementPlusSize) {
      this.currentSize = currentSize
      wsCache.set('currentSize', this.currentSize)
    },
    setMobile(mobile: boolean) {
      this.mobile = mobile
    },
    setTheme(theme: ThemeTypes) {
      this.theme = Object.assign(this.theme, theme)

      // 保存主题到缓存时带上用户标识
      const currentUserInfo = wsCache.get('userInfo')
      if (currentUserInfo && currentUserInfo.user?.id) {
        wsCache.set(CACHE_KEY.THEME, {
          userId: currentUserInfo.user.id,
          theme: this.theme
        })
      } else {
        // 如果没有用户信息,仍然保存主题但不带用户标识
        wsCache.set(CACHE_KEY.THEME, this.theme)
      }
    },
    setCssVarTheme() {
      for (const key in this.theme) {
        setCssVar(`--${humpToUnderline(key)}`, this.theme[key])
      }
    },
    setFooter(footer: boolean) {
      this.footer = footer
    },
    // 根据用户信息加载主题配置
    loadUserTheme(userId: number, roles: string[]) {
      // 先从缓存加载用户的主题配置
      const cachedThemeData = wsCache.get(CACHE_KEY.THEME)

      // 如果缓存中有该用户的主题配置,直接使用
      if (
        cachedThemeData &&
        typeof cachedThemeData === 'object' &&
        'userId' in cachedThemeData &&
        cachedThemeData.userId === userId
      ) {
        this.theme = { ...cachedThemeData.theme }
        this.setCssVarTheme()
        return
      }

      // 如果缓存中没有或用户不匹配,根据角色加载主题
      this.loadConfigByRoles(roles)
    },
    // 根据用户角色加载配置
    loadConfigByRoles(roles: string[]) {
      if (roles.includes('institution_admin')) {
        // 应用机构用户配置
        this.breadcrumb = institutionThemeConfig.breadcrumb
        this.breadcrumbIcon = institutionThemeConfig.breadcrumbIcon
        this.hamburger = institutionThemeConfig.hamburger
        this.screenfull = institutionThemeConfig.screenfull
        this.size = institutionThemeConfig.size
        this.locale = institutionThemeConfig.locale
        this.message = institutionThemeConfig.message
        this.tagsView = institutionThemeConfig.tagsView
        this.tagsViewImmerse = institutionThemeConfig.tagsViewImmerse
        this.tagsViewIcon = institutionThemeConfig.tagsViewIcon
        this.logo = institutionThemeConfig.logo
        this.uniqueOpened = institutionThemeConfig.uniqueOpened
        this.fixedHeader = institutionThemeConfig.fixedHeader
        this.footer = institutionThemeConfig.footer
        this.greyMode = institutionThemeConfig.greyMode
        this.setLayout(institutionThemeConfig.layout)
        this.setIsDark(institutionThemeConfig.isDark)
        this.setCurrentSize(institutionThemeConfig.currentSize)
        // 直接替换主题配置而不是合并，确保机构主题完全生效
        this.theme = { ...institutionThemeConfig.theme }

        // 保存主题到缓存时带上用户标识
        const currentUserInfo = wsCache.get(CACHE_KEY.USER)

        if (currentUserInfo && currentUserInfo.user?.id) {
          const themeDataToCache = {
            userId: currentUserInfo.user.id,
            theme: this.theme
          }
          wsCache.set(CACHE_KEY.THEME, themeDataToCache)
        } else {
          wsCache.set(CACHE_KEY.THEME, this.theme)
        }

        this.setCssVarTheme()
      } else {
        // 非机构管理员,重置所有配置为默认值
        this.breadcrumb = true
        this.breadcrumbIcon = true
        this.hamburger = true
        this.screenfull = true
        this.size = true
        this.locale = true
        this.message = true
        this.tagsView = true
        this.tagsViewImmerse = false
        this.tagsViewIcon = true
        this.logo = true
        this.uniqueOpened = true
        this.fixedHeader = true
        this.footer = false
        this.greyMode = false

        // 重置布局为默认值
        this.setLayout('classic')
        this.setIsDark(false)
        this.setCurrentSize('default')

        // 使用默认主题
        this.theme = {
          elColorPrimary: '#409eff',
          leftMenuBorderColor: 'inherit',
          leftMenuBgColor: '#001529',
          leftMenuBgLightColor: '#0f2438',
          leftMenuBgActiveColor: 'var(--el-color-primary)',
          leftMenuCollapseBgActiveColor: 'var(--el-color-primary)',
          leftMenuTextColor: '#bfcbd9',
          leftMenuTextActiveColor: '#fff',
          logoTitleTextColor: '#fff',
          logoBorderColor: 'inherit',
          topHeaderBgColor: '#fff',
          topHeaderTextColor: 'inherit',
          topHeaderHoverColor: '#f6f6f6',
          topToolBorderColor: '#eee'
        }

        // 保存默认主题到缓存
        const currentUserInfo = wsCache.get(CACHE_KEY.USER)

        if (currentUserInfo && currentUserInfo.user?.id) {
          const themeDataToCache = {
            userId: currentUserInfo.user.id,
            theme: this.theme
          }
          wsCache.set(CACHE_KEY.THEME, themeDataToCache)
        }

        this.setCssVarTheme()
      }
    }
  },
  persist: false
})

export const useAppStoreWithOut = () => {
  return useAppStore(store)
}
