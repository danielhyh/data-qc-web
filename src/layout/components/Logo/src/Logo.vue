<script lang="ts" setup>
import { computed, onMounted, ref, unref, watch } from 'vue'
import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'Logo' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('logo')

const appStore = useAppStore()
const userStore = useUserStore()

const show = ref(true)

const title = computed(() => appStore.getTitle)

const layout = computed(() => appStore.getLayout)

const collapse = computed(() => appStore.getCollapse)

// 获取机构名称
const institutionName = computed(() => {
  return userStore.user?.deptName || '数据质控平台'
})

onMounted(() => {
  if (unref(collapse)) show.value = false
})

watch(
  () => collapse.value,
  (collapse: boolean) => {
    if (unref(layout) === 'topLeft' || unref(layout) === 'cutMenu') {
      show.value = true
      return
    }
    if (!collapse) {
      setTimeout(() => {
        show.value = !collapse
      }, 400)
    } else {
      show.value = !collapse
    }
  }
)

watch(
  () => layout.value,
  (layout) => {
    if (layout === 'top' || layout === 'cutMenu') {
      show.value = true
    } else {
      if (unref(collapse)) {
        show.value = false
      } else {
        show.value = true
      }
    }
  }
)
</script>

<template>
  <div class="logo-wrapper">
    <router-link
      :class="[prefixCls, 'logo-container', layout !== 'classic' ? `${prefixCls}__Top` : '']"
      to="/"
    >
      <!-- Logo 图标区域 -->
      <div class="logo-icon-box">
        <!-- Logo 图片 -->
        <img class="logo-img" src="@/assets/imgs/logo.png" alt="Logo" />
      </div>

      <!-- Logo 文字信息 -->
      <transition name="logo-fade">
        <div v-if="show" class="logo-info">
          <!-- 系统标题 -->
          <div
            :class="[
              'logo-title',
              {
                'logo-title-classic': layout === 'classic',
                'logo-title-top': layout === 'topLeft' || layout === 'top' || layout === 'cutMenu'
              }
            ]"
          >
            {{ title }}
          </div>

          <!-- 机构名称 -->
          <div class="logo-dept">
            <svg class="dept-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
              />
            </svg>
            <span class="dept-text">{{ institutionName }}</span>
          </div>
        </div>
      </transition>
    </router-link>
  </div>
</template>

<style scoped lang="scss">
$prefix-cls: #{$namespace}-logo;

// Logo 外层包装
.logo-wrapper {
  height: var(--logo-height);
  position: relative;
}

// Logo 容器
.logo-container {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 12px;
  cursor: pointer;
  text-decoration: none;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
  border-radius: 0 10px 10px 0;

  // Top 布局 - 固定宽度，背景透明融入顶部栏
  &.#{$prefix-cls}__Top {
    width: 260px; // 固定宽度，不影响菜单
    max-width: 260px;
    flex-shrink: 0;
    border-radius: 0;
  }

  // 悬停效果
  &:hover {
    background: var(--tech-hover-bg);
  }
}

// Logo 图标盒子
.logo-icon-box {
  position: relative;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

// Logo 图片
.logo-img {
  width: 30px;
  height: 30px;
  position: relative;
  z-index: 2;
}

// Logo 信息区
.logo-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 10px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  justify-content: center;
}

// 系统标题
.logo-title {
  font-size: 14px;
  font-weight: var(--font-weight-bold);
  line-height: 1.3;
  letter-spacing: 0.3px;
  // 允许最多显示两行
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  transition: all 0.2s;
  background: linear-gradient(120deg, #2563eb, #7c3aed, #db2777);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  // Classic 布局
  &.logo-title-classic {
    color: var(--logo-title-text-color);
    background: none;
    -webkit-text-fill-color: var(--logo-title-text-color);
  }

  // Top 布局
  &.logo-title-top {
    font-size: 14px;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

// 机构名称
.logo-dept {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
  color: rgba(37, 99, 235, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 10px;
  background: linear-gradient(120deg, rgba(37, 99, 235, 0.08), rgba(124, 58, 237, 0.08));
  border: 1px solid rgba(37, 99, 235, 0.15);
  backdrop-filter: blur(8px);
  transition: all 0.3s;
  width: fit-content;
  max-width: 100%;

  &:hover {
    background: linear-gradient(120deg, rgba(37, 99, 235, 0.12), rgba(124, 58, 237, 0.12));
    border-color: rgba(37, 99, 235, 0.25);
  }
}

// 机构图标
.dept-icon {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
  color: rgba(37, 99, 235, 0.8);
}

// 机构文字
.dept-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 淡入淡出动画
.logo-fade-enter-active,
.logo-fade-leave-active {
  transition: all 0.3s ease;
}

.logo-fade-enter-from,
.logo-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

// 响应式
@media (max-width: 768px) {
  .logo-container {
    padding: 0 10px;

    &.#{$prefix-cls}__Top {
      width: 220px;
      max-width: 220px;
    }
  }

  .logo-icon-box {
    width: 30px;
    height: 30px;
  }

  .logo-img {
    width: 26px;
    height: 26px;
  }

  .logo-info {
    margin-left: 8px;
    gap: 2px;
  }

  .logo-title {
    font-size: 14px;

    &.logo-title-top {
      font-size: 14px;
    }
  }

  .logo-dept {
    font-size: 9px;
    padding: 2px 6px;
    gap: 3px;
  }

  .dept-icon {
    width: 10px;
    height: 10px;
  }
}
</style>
