<template>
  <section class="panel-card">
    <header class="panel-header" :class="[headerAlignClass, themeClass]">
      <div class="panel-title">
        <Icon
          v-if="icon"
          :icon="icon"
          class="panel-icon"
          :style="{ color: iconColor }"
        />
        <span class="panel-title-text">{{ title }}</span>
      </div>
      <div class="panel-header-extra">
        <slot name="header"></slot>
      </div>
    </header>
    <div class="panel-body">
      <slot></slot>
    </div>
  </section>
</template>

<script lang="ts">
import type { PropType } from 'vue'
import { computed, defineComponent, toRefs } from 'vue'
import { Icon } from '../../../../components/Icon'

export default defineComponent({
  name: 'ReportZonePanel',
  components: { Icon },
  props: {
    title: { type: String, default: '' },
    icon: { type: String, default: '' },
    iconColor: { type: String, default: '#2563eb' },
    headerAlign: { type: String as PropType<'center' | 'start'>, default: 'start' },
    theme: { type: String as PropType<'blue' | 'green'>, default: 'blue' }
  },
  setup(props) {
    const headerAlignClass = computed(() => {
      return props.headerAlign === 'center' ? 'is-center' : 'is-start'
    })

    const themeClass = computed(() => {
      return `theme-${props.theme}`
    })

    return { headerAlignClass, themeClass, ...toRefs(props) }
  }
})
</script>

<style scoped lang="scss">
.panel-card {
  display: flex;
  flex-direction: column;
  background: transparent;
  border-radius: 12px;
  border: none;
  height: 100%;
  overflow: hidden;
  min-height: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: none;
  position: relative;
  border-radius: 12px 12px 0 0;
  
  &.theme-blue {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.06) 50%, rgba(239, 246, 255, 0.04) 100%);
    box-shadow: 0 1px 0 rgba(37, 99, 235, 0.1);
  }
  
  &.theme-green {
    background: linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(134, 239, 172, 0.06) 50%, rgba(240, 253, 244, 0.04) 100%);
    box-shadow: 0 1px 0 rgba(22, 163, 74, 0.1);
  }
}

.panel-header.is-start {
  align-items: flex-start;
}

.panel-header.is-center {
  align-items: center;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.panel-icon {
  font-size: 20px;
}

.panel-title-text {
  white-space: nowrap;
}

.panel-header-extra {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  gap: 12px;
  flex-wrap: wrap;
}

.panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  min-height: 0;
}
</style>

