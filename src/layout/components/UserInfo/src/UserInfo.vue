<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'

import { useDesign } from '@/hooks/web/useDesign'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useUserStore } from '@/store/modules/user'
import LockDialog from './components/LockDialog.vue'
import LockPage from './components/LockPage.vue'
import { useLockStore } from '@/store/modules/lock'

defineOptions({ name: 'UserInfo' })

const { t } = useI18n()

const { push, replace } = useRouter()

const userStore = useUserStore()

const tagsViewStore = useTagsViewStore()

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('user-info')

// 头像URL（如果用户上传了头像）
const avatarUrl = computed(() => userStore.user.avatar || '')

// 是否使用文字头像（没有上传头像时）
const useTextAvatar = computed(() => !userStore.user.avatar)

// 获取姓名首字作为默认头像文字
const avatarText = computed(() => {
  const realName = userStore.user.realName
  const nickname = userStore.user.nickname
  // 优先使用真实姓名的第一个字，否则使用昵称的第一个字
  const name = realName || nickname || ''
  return name.charAt(0) || '用'
})

// 根据姓名生成一个稳定的背景色
const avatarBgColor = computed(() => {
  const name = userStore.user.realName || userStore.user.nickname || ''
  // 预定义一组好看的渐变色
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ]
  // 根据姓名的字符码生成一个稳定的索引
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})
const userName = computed(() => {
  const nickname = userStore.user.nickname ?? 'Admin'
  const realName = userStore.user.realName
  return realName ? `${nickname}（${realName}）` : nickname
})

// 获取用户角色名称（优先使用后端返回的 roleName）
const userRole = computed(() => {
  // 优先使用后端返回的角色名称
  if (userStore.user.roleName) {
    return userStore.user.roleName
  }

  // 降级方案：使用 roles 数组映射
  const roles = userStore.getRoles
  if (roles && roles.length > 0) {
    // 角色名称映射
    const roleMap: Record<string, string> = {
      'super_admin': '超级管理员',
      'provincial_admin': '省级管理员',
      'city_admin': '市级管理员',
      'district_admin': '区县管理员',
      'institution_admin': '机构用户',
      'admin': '系统管理员',
      'tenant_admin': '租户管理员',
      'user': '普通用户'
    }
    return roleMap[roles[0]] || roles[0]
  }
  return '用户'
})

// 根据角色代码返回对应的颜色主题
const roleTheme = computed(() => {
  // 优先使用后端返回的角色代码
  const roleCode = userStore.user.roleCode || (userStore.getRoles.length > 0 ? userStore.getRoles[0] : '')

  if (roleCode === 'super_admin') return 'tech-primary'
  if (roleCode === 'provincial_admin') return 'tech-primary'
  if (roleCode === 'city_admin') return 'tech-secondary'
  if (roleCode === 'district_admin') return 'tech-secondary'
  if (roleCode === 'institution_admin') return 'tech-accent'
  if (roleCode === 'admin') return 'tech-secondary'
  if (roleCode === 'tenant_admin') return 'tech-accent'

  return 'tech-primary'
})

// 锁定屏幕
const lockStore = useLockStore()
const getIsLock = computed(() => lockStore.getLockInfo?.isLock ?? false)
const dialogVisible = ref<boolean>(false)
const lockScreen = () => {
  dialogVisible.value = true
}

const loginOut = async () => {
  try {
    await ElMessageBox.confirm(t('common.loginOutMessage'), t('common.reminder'), {
      confirmButtonText: t('common.ok'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
    await userStore.loginOut()
    tagsViewStore.delAllViews()
    // 注意：不要在这里跳转，userStore.loginOut() 内部会调用 SsoAuth.logout() 处理跳转
  } catch {}
}
const toProfile = async () => {
  push('/user/profile')
}
const toDocument = () => {
  window.open('https://doc.iocoder.cn/')
}
</script>

<template>
  <ElDropdown :class="prefixCls" trigger="click">
    <div class="tech-user-info">
      <!-- 用户头像 -->
      <div class="avatar-container">
        <!-- 有头像URL时显示图片 -->
        <ElAvatar v-if="!useTextAvatar" :src="avatarUrl" alt="" class="user-avatar" />
        <!-- 无头像时显示姓名首字 -->
        <div v-else class="user-avatar text-avatar" :style="{ background: avatarBgColor }">
          {{ avatarText }}
        </div>
      </div>

      <!-- 用户信息 -->
      <div class="user-details">
        <div class="user-name">{{ userName }}</div>
        <div class="user-role" :class="`role-${roleTheme}`">
          <Icon icon="ep:user" class="role-icon" />
          <span>{{ userRole }}</span>
        </div>
      </div>

      <!-- 下拉箭头 -->
      <Icon icon="ep:arrow-down" class="dropdown-arrow" />
    </div>

    <template #dropdown>
      <ElDropdownMenu class="tech-dropdown-menu">
        <ElDropdownItem class="tech-dropdown-item">
          <Icon icon="ep:tools" />
          <div @click="toProfile">{{ t('common.profile') }}</div>
        </ElDropdownItem>
        <ElDropdownItem class="tech-dropdown-item" divided>
          <Icon icon="ep:lock" />
          <div @click="lockScreen">{{ t('lock.lockScreen') }}</div>
        </ElDropdownItem>
        <ElDropdownItem class="tech-dropdown-item" divided @click="loginOut">
          <Icon icon="ep:switch-button" />
          <div>{{ t('common.loginOut') }}</div>
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>

  <LockDialog v-if="dialogVisible" v-model="dialogVisible" />

  <teleport to="body">
    <transition name="fade-bottom" mode="out-in">
      <LockPage v-if="getIsLock" />
    </transition>
  </teleport>
</template>

<style scoped lang="scss">
$prefix-cls: #{$namespace}-user-info;

/* 用户信息容器 */
.tech-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 16px 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--tech-hover-bg);
    
    .dropdown-arrow {
      transform: rotate(180deg);
    }
  }
}

/* 头像容器 */
.avatar-container {
  position: relative;
  flex-shrink: 0;

  .user-avatar {
    width: 36px;
    height: 36px;
  }

  /* 文字头像样式 */
  .text-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
}

/* 用户详情 */
.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  @media (max-width: 1024px) {
    display: none;
  }
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--top-header-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.user-role {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  font-weight: 500;
  width: fit-content;

  .role-icon {
    font-size: 9px;
  }

  /* 不同角色的颜色主题 */
  &.role-tech-primary {
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 212, 255, 0.05));
    color: #00d4ff;
    border: 1px solid rgba(0, 212, 255, 0.3);
  }

  &.role-tech-secondary {
    background: linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(147, 51, 234, 0.05));
    color: #9333ea;
    border: 1px solid rgba(147, 51, 234, 0.3);
  }

  &.role-tech-accent {
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.05));
    color: #ec4899;
    border: 1px solid rgba(236, 72, 153, 0.3);
  }
}

/* 下拉箭头 */
.dropdown-arrow {
  font-size: 14px;
  color: var(--top-header-text-color);
  opacity: 0.6;
  transition: all 0.3s;
  margin-left: 4px;

  @media (max-width: 1024px) {
    display: none;
  }
}

/* 下拉菜单美化 */
:deep(.tech-dropdown-menu) {
  background: rgba(15, 23, 42, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  padding: 8px !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4) !important;
  min-width: 180px;

  .tech-dropdown-item {
    border-radius: 8px !important;
    padding: 10px 12px !important;
    margin: 2px 0 !important;
    color: #e2e8f0 !important;
    transition: all 0.2s !important;
    display: flex;
    align-items: center;
    gap: 10px;

    &:hover {
      background: var(--tech-hover-bg) !important;
    }

    .icon {
      font-size: 16px;
    }

    div {
      flex: 1;
    }
  }

  .el-dropdown-menu__item--divided {
    margin-top: 8px !important;
    padding-top: 8px !important;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 12px;
      right: 12px;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
    }
  }
}

/* 渐入渐出动画 */
.fade-bottom-enter-active,
.fade-bottom-leave-active {
  transition:
    opacity 0.25s,
    transform 0.3s;
}

.fade-bottom-enter-from {
  opacity: 0;
  transform: translateY(-10%);
}

.fade-bottom-leave-to {
  opacity: 0;
  transform: translateY(10%);
}
</style>
