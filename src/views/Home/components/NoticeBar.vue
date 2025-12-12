<template>
  <transition name="notice-slide">
    <div v-if="visible" class="notice-bar" :class="[`notice-bar--${type}`]">
      <div class="notice-bar__wrapper">
        <!-- 图标区域 -->
        <div class="notice-bar__icon">
          <el-icon :size="22">
            <component :is="iconComponent" />
          </el-icon>
        </div>

        <!-- 内容区域 -->
        <div class="notice-bar__content">
          <span class="notice-bar__title">{{ title }}</span>
          <span class="notice-bar__text">{{ content }}</span>
        </div>

        <!-- 操作区域 -->
        <div class="notice-bar__actions">
          <el-button
            v-if="actionText"
            type="primary"
            size="small"
            round
            @click="handleAction"
          >
            {{ actionText }}
          </el-button>
          <el-icon
            v-if="closable"
            class="notice-bar__close"
            @click="handleClose"
          >
            <Close />
          </el-icon>
        </div>
      </div>

      <!-- 装饰元素 -->
      <div class="notice-bar__decoration">
        <div class="decoration-circle decoration-circle--1"></div>
        <div class="decoration-circle decoration-circle--2"></div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Close,
  Bell,
  InfoFilled,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled,
  Promotion
} from '@element-plus/icons-vue'

defineOptions({ name: 'NoticeBar' })

interface Props {
  title?: string
  content: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'new'
  icon?: string
  closable?: boolean
  actionText?: string
  storageKey?: string // 用于记住用户关闭状态
}

const props = withDefaults(defineProps<Props>(), {
  title: '系统通知',
  type: 'info',
  closable: true,
  storageKey: ''
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'action'): void
}>()

// 检查是否已被用户关闭
const getInitialVisible = () => {
  if (props.storageKey) {
    return localStorage.getItem(`notice_closed_${props.storageKey}`) !== 'true'
  }
  return true
}

const visible = ref(getInitialVisible())

// 根据类型选择图标
const iconComponent = computed(() => {
  const iconMap = {
    info: InfoFilled,
    success: SuccessFilled,
    warning: WarningFilled,
    error: CircleCloseFilled,
    new: Promotion
  }
  return iconMap[props.type] || Bell
})

// 关闭通知
const handleClose = () => {
  visible.value = false
  if (props.storageKey) {
    localStorage.setItem(`notice_closed_${props.storageKey}`, 'true')
  }
  emit('close')
}

// 操作按钮点击（点击后关闭通知）
const handleAction = () => {
  emit('action')
  handleClose()
}

// 暴露重新显示方法
const show = () => {
  visible.value = true
  if (props.storageKey) {
    localStorage.removeItem(`notice_closed_${props.storageKey}`)
  }
}

defineExpose({ show })
</script>

<style scoped lang="scss">
.notice-bar {
  position: relative;
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  &__wrapper {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    padding: 16px 20px;
    gap: 16px;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(4px);
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: inherit;
  }

  &__text {
    font-size: 14px;
    color: inherit;
    opacity: 0.9;
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;

    .el-button {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: inherit;
      font-weight: 500;

      &:hover {
        background: rgba(255, 255, 255, 0.35);
        border-color: rgba(255, 255, 255, 0.5);
      }
    }
  }

  &__close {
    cursor: pointer;
    padding: 6px;
    border-radius: 50%;
    transition: all 0.2s ease;
    opacity: 0.7;

    &:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &__decoration {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 200px;
    overflow: hidden;
    pointer-events: none;

    .decoration-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);

      &--1 {
        width: 120px;
        height: 120px;
        top: -40px;
        right: -20px;
      }

      &--2 {
        width: 80px;
        height: 80px;
        bottom: -30px;
        right: 60px;
      }
    }
  }

  // 主题色彩
  &--info {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }

  &--success {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    color: #fff;
  }

  &--warning {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: #fff;
  }

  &--error {
    background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
    color: #fff;
  }

  &--new {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
  }
}

// 动画
.notice-slide-enter-active,
.notice-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.notice-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.notice-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  max-height: 0;
}

// 响应式
@media (max-width: 768px) {
  .notice-bar {
    &__wrapper {
      padding: 14px 16px;
      flex-wrap: wrap;
    }

    &__icon {
      width: 36px;
      height: 36px;
    }

    &__content {
      flex-basis: calc(100% - 100px);
    }

    &__actions {
      flex-basis: 100%;
      justify-content: flex-end;
      margin-top: 8px;
    }

    &__decoration {
      display: none;
    }
  }
}
</style>
