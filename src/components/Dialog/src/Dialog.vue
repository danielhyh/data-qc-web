<script lang="ts" setup>
import { computed, ref, watch, nextTick, useSlots, useAttrs, unref } from 'vue'
import { propTypes } from '@/utils/propTypes'
import { isNumber } from '@/utils/is'

defineOptions({ name: 'Dialog' })

const slots = useSlots()

const props = defineProps({
  modelValue: propTypes.bool.def(false),
  title: propTypes.string.def('Dialog'),
  fullscreen: propTypes.bool.def(true),
  width: propTypes.oneOfType([String, Number]).def('40%'),
  scroll: propTypes.bool.def(false), // 是否开启滚动条。如果是的话，按照 maxHeight 设置最大高度
  maxHeight: propTypes.oneOfType([String, Number]).def('400px'),
  appendToBody: propTypes.bool.def(true) // 是否将对话框挂载到 body 元素上，避免被父容器限制
})

const getBindValue = computed(() => {
  const delArr: string[] = ['fullscreen', 'title', 'maxHeight']
  const attrs = useAttrs()
  const obj = { ...attrs, ...props }
  for (const key in obj) {
    if (delArr.indexOf(key) !== -1) {
      delete obj[key]
    }
  }
  return obj
})

const isFullscreen = ref(false)

const toggleFull = () => {
  isFullscreen.value = !unref(isFullscreen)
}

const dialogHeight = ref(isNumber(props.maxHeight) ? `${props.maxHeight}px` : props.maxHeight)

watch(
  () => isFullscreen.value,
  async (val: boolean) => {
    await nextTick()
    if (val) {
      const windowHeight = document.documentElement.offsetHeight
      dialogHeight.value = `${windowHeight - 55 - 60 - (slots.footer ? 63 : 0)}px`
    } else {
      dialogHeight.value = isNumber(props.maxHeight) ? `${props.maxHeight}px` : props.maxHeight
    }
  },
  {
    immediate: true
  }
)

const dialogStyle = computed(() => {
  return {
    height: unref(dialogHeight)
  }
})
</script>

<template>
  <ElDialog
    v-bind="getBindValue"
    :close-on-click-modal="true"
    :fullscreen="isFullscreen"
    :width="width"
    :append-to-body="appendToBody"
    destroy-on-close
    lock-scroll
    draggable
    class="com-dialog"
    :show-close="false"
    @close="$emit('update:modelValue', false)"
  >
    <template #header="{ close }">
      <div class="dialog-header-wrapper">
        <div class="dialog-title-section">
          <slot name="title">
            <div class="dialog-title-content">
              <Icon icon="ep:document" class="dialog-title-icon" />
              <span class="dialog-title-text">{{ title }}</span>
            </div>
          </slot>
        </div>
        <div class="dialog-actions">
          <Icon
            v-if="fullscreen"
            class="dialog-action-icon"
            :icon="isFullscreen ? 'radix-icons:exit-full-screen' : 'radix-icons:enter-full-screen'"
            @click="toggleFull"
          />
          <Icon
            class="dialog-action-icon"
            icon="ep:close"
            @click.stop="close"
          />
        </div>
      </div>
    </template>

    <ElScrollbar v-if="scroll" :style="dialogStyle">
      <slot></slot>
    </ElScrollbar>
    <slot v-else></slot>
    <template v-if="slots.footer" #footer>
      <slot name="footer"></slot>
    </template>
  </ElDialog>
</template>

<style lang="scss">
.com-dialog {
  .#{$elNamespace}-overlay-dialog {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .#{$elNamespace}-dialog {
    margin: 0 !important;

    &__header {
      height: 54px;
      padding: 0;
      margin-right: 0 !important;
      border-bottom: 1px solid var(--el-border-color);
      background: linear-gradient(135deg, #fafbfc 0%, #f3f4f6 100%);
    }

    &__body {
      padding: 15px !important;
    }

    &__footer {
      border-top: 1px solid var(--el-border-color);
    }

    &__headerbtn {
      top: 0;
    }
  }

  // 标题样式优化
  .dialog-header-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 54px;
    padding: 0 20px;
  }

  .dialog-title-section {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .dialog-title-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dialog-title-icon {
    font-size: 20px;
    color: #409eff;
  }

  .dialog-title-text {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    letter-spacing: 0.3px;
  }

  .dialog-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dialog-action-icon {
    font-size: 18px;
    color: #909399;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 6px;
    border-radius: 6px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #409eff;
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.12) 0%, rgba(64, 158, 255, 0.08) 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(64, 158, 255, 0.2);
    }
  }

  // 统一设置表单标签加粗样式
  .#{$elNamespace}-form-item__label {
    font-weight: 600;
  }
}
</style>
