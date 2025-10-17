<template>
  <el-card class="function-card" shadow="hover" @click="handleCardClick">
    <div class="function-content">
      <div class="function-icon">
        <Icon :icon="func.icon" :size="24" />
      </div>
      <div class="function-name">{{ func.name }}</div>
      <div class="menu-badge">
        <el-icon><Right /></el-icon>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Right } from '@element-plus/icons-vue'
import { Icon } from '@/components/Icon'

// 菜单数据类型
interface MenuData {
  id: number
  parentId: number
  name: string
  path: string
  component: string
  componentName: string
  icon: string
  visible: boolean
  keepAlive: boolean
  alwaysShow: boolean
  type: number // 0=目录 1=菜单 2=按钮
  children?: MenuData[] | null
}

interface Props {
  func: MenuData  // 改为 func，与模板中使用的变量名一致
}

interface Emits {
  (e: 'click', func: MenuData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleCardClick = () => {
  emit('click', props.func)  // 这里也要改为 props.func
}
</script>

<style scoped>
.function-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
}

.function-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-color: #409EFF;
}

.function-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 12px;
  min-height: 100px;
  gap: 12px;
  position: relative;
}

.function-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: #f0f2f5;
  border-radius: 50%;
  color: #409EFF;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.function-card:hover .function-icon {
  background-color: #409EFF;
  color: white;
  transform: scale(1.1);
}

.function-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.function-card:hover .function-name {
  color: #409EFF;
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
  transition: all 0.3s ease;
}

.function-card:hover .menu-badge {
  transform: scale(1.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .function-content {
    padding: 16px 10px;
    min-height: 90px;
    gap: 10px;
  }

  .function-icon {
    width: 40px;
    height: 40px;
  }

  .function-name {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .function-content {
    padding: 12px 8px;
    min-height: 80px;
    gap: 8px;
  }

  .function-icon {
    width: 36px;
    height: 36px;
  }

  .function-name {
    font-size: 12px;
  }
}
</style>
