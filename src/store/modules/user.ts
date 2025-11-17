import { store } from '@/store'
import { defineStore } from 'pinia'
import { getAccessToken } from '@/utils/auth'
import { CACHE_KEY, useCache, deleteUserCache } from '@/hooks/web/useCache'
import { getInfo } from '@/api/login'
import { useAppStore } from './app'
import { SsoAuth } from '@/utils/sso'

const { wsCache } = useCache()

interface UserVO {
  id: number
  avatar: string
  nickname: string
  realName?: string
  deptId: number
  deptName?: string
  roleCode?: string
  roleName?: string
  mobile?: string
  passwordChanged?: boolean
}

interface UserInfoVO {
  // USER 缓存
  permissions: Set<string>
  roles: string[]
  isSetUser: boolean
  user: UserVO
}

export const useUserStore = defineStore('admin-user', {
  state: (): UserInfoVO => ({
    permissions: new Set<string>(),
    roles: [],
    isSetUser: false,
    user: {
      id: 0,
      avatar: '',
      nickname: '',
      realName: '',
      deptId: 0,
      deptName: '',
      roleCode: '',
      roleName: '',
      mobile: '',
      passwordChanged: false
    }
  }),
  getters: {
    getPermissions(): Set<string> {
      return this.permissions
    },
    getRoles(): string[] {
      return this.roles
    },
    getIsSetUser(): boolean {
      return this.isSetUser
    },
    getUser(): UserVO {
      return this.user
    }
  },
  actions: {
    async setUserInfoAction() {
      if (!getAccessToken()) {
        this.resetState()
        return null
      }
      let userInfo = wsCache.get(CACHE_KEY.USER)
      if (!userInfo) {
        userInfo = await getInfo()
      } else {
        // 特殊：在有缓存的情况下，进行加载。但是即使加载失败，也不影响后续的操作，保证可以进入系统
        try {
          userInfo = await getInfo()
        } catch (error) {}
      }
      this.permissions = new Set(userInfo.permissions)
      this.roles = userInfo.roles
      this.user = userInfo.user
      this.isSetUser = true
      wsCache.set(CACHE_KEY.USER, userInfo)
      wsCache.set(CACHE_KEY.ROLE_ROUTERS, userInfo.menus)

      // 根据用户信息加载主题配置
      const appStore = useAppStore()
      appStore.loadUserTheme(userInfo.user.id, userInfo.roles)
    },
    async setUserAvatarAction(avatar: string) {
      const userInfo = wsCache.get(CACHE_KEY.USER)
      // NOTE: 是否需要像`setUserInfoAction`一样判断`userInfo != null`
      this.user.avatar = avatar
      userInfo.user.avatar = avatar
      wsCache.set(CACHE_KEY.USER, userInfo)
    },
    async setUserNicknameAction(nickname: string) {
      const userInfo = wsCache.get(CACHE_KEY.USER)
      // NOTE: 是否需要像`setUserInfoAction`一样判断`userInfo != null`
      this.user.nickname = nickname
      userInfo.user.nickname = nickname
      wsCache.set(CACHE_KEY.USER, userInfo)
    },
    async loginOut() {
      // 清理本地状态
      deleteUserCache()
      this.resetState()

      // SSO模式：只调用SSO logout即可，会同时处理普通退出和SSO退出
      // 注意：SsoAuth.logout() 内部会调用 /system/auth/sso/logout，然后清除token并刷新页面
      await SsoAuth.logout()
    },
    resetState() {
      this.permissions = new Set<string>()
      this.roles = []
      this.isSetUser = false
      this.user = {
        id: 0,
        avatar: '',
        nickname: '',
        realName: '',
        deptId: 0,
        deptName: '',
        roleCode: '',
        roleName: '',
        mobile: '',
        passwordChanged: false
      }
    }
  }
})

export const useUserStoreWithOut = () => {
  return useUserStore(store)
}
