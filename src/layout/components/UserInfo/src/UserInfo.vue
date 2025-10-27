<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'

import avatarImg from '@/assets/imgs/logo.png'
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

const avatar = computed(() => userStore.user.avatar || avatarImg)
const userName = computed(() => userStore.user.nickname ?? 'Admin')

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
    // 退出后跳转到首页，路由守卫会自动触发SSO登录
    window.location.href = '/'
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
  <ElDropdown class="custom-hover" :class="prefixCls" trigger="click">
    <div class="tech-user-info">
      <!-- 用户头像 -->
      <div class="avatar-container">
        <ElAvatar :src="avatar" alt="" class="user-avatar" />
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

/* 科技感用户信息容器 */
.tech-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 16px 6px 12px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  /* 渐变边框效果 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.5), rgba(147, 51, 234, 0.5));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.15);

    &::before {
      opacity: 1;
    }

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
    border: 2px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s;
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
      background: linear-gradient(
        135deg,
        rgba(0, 212, 255, 0.15),
        rgba(147, 51, 234, 0.15)
      ) !important;
      color: #00d4ff !important;
      transform: translateX(4px);

      .icon {
        color: #00d4ff !important;
      }
    }

    .icon {
      font-size: 16px;
      transition: color 0.2s;
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
