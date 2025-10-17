<template>
  <el-card class="system-card" shadow="hover" @click="handleCardClick">
    <div class="system-content">
      <div class="system-icon" :style="{ backgroundColor: system.color }">
        <Icon :icon="system.icon" :size="48" />
      </div>
      <div class="system-name">{{ system.name }}</div>
      <div class="system-description">{{ system.description }}</div>
      <div class="menu-badge" v-if="isMenu">
        <el-icon><Right /></el-icon>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Right } from '@element-plus/icons-vue'
import { Icon } from '@/components/Icon'

// 系统数据类型
interface SystemData {
  id: number
  name: string
  description: string
  icon: string
  color: string
  path: string
  type?: number
  children: any[]
}

interface Props {
  system: SystemData
}

interface Emits {
  (e: 'click', system: SystemData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 判断是否为菜单类型（type=2为菜单，可以直接跳转）
const isMenu = computed(() => {
  return props.system.type === 2
})

const handleCardClick = () => {
  emit('click', props.system)
}
</script>

<style scoped>
.system-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
}

.system-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.system-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px;
  min-height: 140px;
  position: relative;
}

.system-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  color: white;
  margin-bottom: 12px;
}

.system-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  line-height: 1.4;
}

.system-description {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.menu-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background-color: #409EFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .system-content {
    padding: 12px;
    min-height: 120px;
  }

  .system-icon {
    width: 48px;
    height: 48px;
  }

  .system-name {
    font-size: 14px;
  }

  .system-description {
    font-size: 11px;
  }
}
</style>
