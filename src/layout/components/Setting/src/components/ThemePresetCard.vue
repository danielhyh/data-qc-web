<script lang="ts" setup>
import type { ThemePreset } from '@/config/theme'

defineOptions({ name: 'ThemePresetCard' })

const props = defineProps<{
  preset: ThemePreset
  selected: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const handleClick = () => {
  emit('select', props.preset.id)
}
</script>

<template>
  <div
    :class="[
      'theme-preset-card',
      {
        'theme-preset-card--selected': selected
      }
    ]"
    @click="handleClick"
  >
    <!-- 预览色块 -->
    <div class="theme-preset-card__preview">
      <div
        class="preview-block preview-block--primary"
        :style="{ backgroundColor: preset.previewColors.primary }"
      ></div>
      <div
        class="preview-block preview-block--menu"
        :style="{ backgroundColor: preset.previewColors.menu }"
      ></div>
      <div
        class="preview-block preview-block--header"
        :style="{ backgroundColor: preset.previewColors.header }"
      ></div>
    </div>

    <!-- 主题信息 -->
    <div class="theme-preset-card__info">
      <div class="theme-name">{{ preset.name }}</div>
      <div class="theme-desc">{{ preset.description }}</div>
    </div>

    <!-- 选中标记 -->
    <div v-if="selected" class="theme-preset-card__check">
      <ElIcon :size="16">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M406.656 706.944L195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z"
          />
        </svg>
      </ElIcon>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.theme-preset-card {
  position: relative;
  padding: 16px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  &--selected {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.2);
  }

  &__preview {
    display: flex;
    gap: 4px;
    height: 40px;
    margin-bottom: 12px;
    border-radius: 4px;
    overflow: hidden;

    .preview-block {
      flex: 1;
      transition: all 0.3s ease;

      &--primary {
        flex: 1.2;
      }

      &--menu {
        flex: 1;
      }

      &--header {
        flex: 1;
      }
    }
  }

  &__info {
    .theme-name {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .theme-desc {
      font-size: 12px;
      color: #666;
      line-height: 1.5;
    }
  }

  &__check {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-color-primary);
    color: #fff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

.dark {
  .theme-preset-card {
    background: var(--el-bg-color-overlay);

    &__info {
      .theme-name {
        color: var(--el-text-color-primary);
      }

      .theme-desc {
        color: var(--el-text-color-regular);
      }
    }
  }
}
</style>

