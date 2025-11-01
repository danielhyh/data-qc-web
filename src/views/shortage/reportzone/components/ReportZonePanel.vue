<template>
  <section class="panel-card">
    <header class="panel-header" :class="headerAlignClass">
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
    headerAlign: { type: String as PropType<'center' | 'start'>, default: 'start' }
  },
  setup(props) {
    const headerAlignClass = computed(() => {
      return props.headerAlign === 'center' ? 'is-center' : 'is-start'
    })

    return { headerAlignClass, ...toRefs(props) }
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
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(37, 99, 235, 0.08);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(59, 130, 246, 0.03));
    opacity: 0;
    transition: opacity 0.25s ease;
    z-index: 1;
    border-radius: 12px 12px 0 0;
  }

  &:hover::after {
    opacity: 1;
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
  position: relative;
  z-index: 2;
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
  position: relative;
  z-index: 2;
}

.panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
}
</style>

