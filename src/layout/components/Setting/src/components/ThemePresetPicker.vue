<script lang="ts" setup>
import { THEME_PRESETS } from '@/config/theme'
import ThemePresetCard from './ThemePresetCard.vue'

defineOptions({ name: 'ThemePresetPicker' })

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const handleSelect = (id: string) => {
  emit('update:modelValue', id)
  emit('change', id)
}
</script>

<template>
  <div class="theme-preset-picker">
    <div class="theme-preset-picker__grid">
      <ThemePresetCard
        v-for="preset in THEME_PRESETS"
        :key="preset.id"
        :preset="preset"
        :selected="modelValue === preset.id"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.theme-preset-picker {
  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
}
</style>

