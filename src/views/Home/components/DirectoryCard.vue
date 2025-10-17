<template>
  <el-card class="directory-card" shadow="hover" @click="handleCardClick">
    <div class="directory-content">
      <div class="directory-icon">
        <Icon :icon="directory.icon" :size="32" />
      </div>
      <div class="directory-info">
        <div class="directory-name">{{ directory.name }}</div>
      </div>
      <el-icon class="arrow-icon">
        <ArrowRight />
      </el-icon>
      <div class="menu-badge" v-if="directory.type === 1">
        <el-icon><Right /></el-icon>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ArrowRight, Right } from '@element-plus/icons-vue'
import { Icon } from '@/components/Icon'

interface DirectoryData {
  id: number
  name: string
  icon: string
  type: number
  path?: string
  children?: any[]
}

interface Props {
  directory: DirectoryData
}

interface Emits {
  (e: 'click', directory: DirectoryData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleCardClick = () => {
  emit('click', props.directory)
}
</script>

<style scoped>
.directory-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
}

.directory-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-color: #409EFF;
}

.directory-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  position: relative;
}

.directory-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: #f0f2f5;
  border-radius: 8px;
  color: #409EFF;
  flex-shrink: 0;
}

.directory-info {
  flex: 1;
  min-width: 0;
}

.directory-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow-icon {
  font-size: 18px;
  color: #c0c4cc;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.directory-card:hover .arrow-icon {
  color: #409EFF;
  transform: translateX(4px);
}

.menu-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background-color: #409EFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .directory-content {
    padding: 12px;
  }

  .directory-icon {
    width: 40px;
    height: 40px;
  }

  .directory-name {
    font-size: 14px;
  }
}
</style>