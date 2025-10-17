<template>
  <div class="quick-action-card" @click="handleClick">
    <div class="action-icon" :style="{ backgroundColor: action.color }">
      <Icon :icon="action.icon" :size="20" />
    </div>
    <div class="action-content">
      <div class="action-name">{{ action.name }}</div>
      <div class="action-description">{{ action.description }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@/components/Icon'

interface QuickAction {
  key: number | string
  name: string
  description: string
  icon: string
  color: string
  path?: string
  action?: () => void
}

interface Props {
  action: QuickAction
}

interface Emits {
  (e: 'click', action: QuickAction): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('click', props.action)
}
</script>

<style scoped>
.quick-action-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
  height: 100%;
  min-height: 80px;
}

.quick-action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: white;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
  min-width: 0;
}

.action-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.4;
}

.action-description {
  font-size: 12px;
  color: #909399;
  line-height: 1.3;
  word-break: break-all;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quick-action-card {
    padding: 12px;
    min-height: 70px;
    gap: 10px;
  }

  .action-icon {
    width: 36px;
    height: 36px;
  }

  .action-name {
    font-size: 13px;
  }

  .action-description {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .quick-action-card {
    flex-direction: column;
    text-align: center;
    padding: 12px 8px;
    min-height: 90px;
    gap: 8px;
  }

  .action-icon {
    width: 32px;
    height: 32px;
  }

  .action-content {
    text-align: center;
  }

  .action-name {
    font-size: 12px;
  }

  .action-description {
    font-size: 10px;
    line-height: 1.2;
  }
}
</style>