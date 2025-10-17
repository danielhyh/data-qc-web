<template>
  <el-card class="pending-tasks-card" shadow="never">
    <template #header>
      <div class="card-header">
        <div class="header-title">
          <el-icon>
            <Clock />
          </el-icon>
          <span>待处理任务</span>
          <el-badge :value="tasks.length" :hidden="tasks.length === 0" class="task-badge" />
        </div>
        <el-button link type="primary" @click="handleViewAll">
          查看全部
          <el-icon>
            <ArrowRight />
          </el-icon>
        </el-button>
      </div>
    </template>

    <div class="tasks-container" v-loading="loading">
      <el-empty v-if="tasks.length === 0" description="暂无待处理任务" :image-size="80">
        <el-button type="primary" @click="handleCreateTask">创建任务</el-button>
      </el-empty>

      <div v-else class="task-list">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="task-item"
          :class="{ urgent: task.priority === 'high' }"
          @click="handleTaskClick(task)"
        >
          <div class="task-icon" :style="{ backgroundColor: getTaskColor(task.type) }">
            <el-icon :size="16">
              <component :is="getTaskIcon(task.type)" />
            </el-icon>
          </div>
          <div class="task-content">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-meta">
              <span class="task-type">{{ getTaskTypeName(task.type) }}</span>
              <span class="task-time">{{ formatTime(task.createTime) }}</span>
            </div>
          </div>
          <div class="task-status">
            <el-tag :type="getStatusType(task.status)" size="small" effect="plain">
              {{ getStatusName(task.status) }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Clock,
  ArrowRight,
  Upload,
  Document,
  Warning,
  Setting,
  Bell,
  DataLine
} from '@element-plus/icons-vue'
import { formatPast } from '@/utils/formatTime'

interface Task {
  id: number
  title: string
  type: 'import' | 'qc' | 'review' | 'system' | 'message' | 'analysis'
  status: 'pending' | 'processing' | 'error' | 'completed'
  priority?: 'high' | 'medium' | 'low'
  createTime: Date
}

interface Props {
  tasks: Task[]
  loading?: boolean
}

interface Emits {
  (e: 'view-all'): void
  (e: 'task-click', task: Task): void
  (e: 'create-task'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

const handleViewAll = () => {
  emit('view-all')
}

const handleTaskClick = (task: Task) => {
  emit('task-click', task)
}

const handleCreateTask = () => {
  emit('create-task')
}

const getTaskIcon = (type: string) => {
  const iconMap = {
    import: Upload,
    qc: Setting,
    review: Document,
    system: Bell,
    message: Bell,
    analysis: DataLine
  }
  return iconMap[type] || Document
}

const getTaskColor = (type: string) => {
  const colorMap = {
    import: '#409EFF',
    qc: '#67C23A',
    review: '#E6A23C',
    system: '#F56C6C',
    message: '#909399',
    analysis: '#9C27B0'
  }
  return colorMap[type] || '#909399'
}

const getTaskTypeName = (type: string) => {
  const nameMap = {
    import: '数据导入',
    qc: '质控检查',
    review: '数据审核',
    system: '系统维护',
    message: '消息通知',
    analysis: '数据分析'
  }
  return nameMap[type] || '其他'
}

const getStatusType = (status: string) => {
  const typeMap = {
    pending: 'warning',
    processing: 'primary',
    error: 'danger',
    completed: 'success'
  }
  return typeMap[status] || 'info'
}

const getStatusName = (status: string) => {
  const nameMap = {
    pending: '待处理',
    processing: '处理中',
    error: '异常',
    completed: '已完成'
  }
  return nameMap[status] || '未知'
}

const formatTime = (time: Date) => {
  return formatPast(time)
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-title .el-icon {
  font-size: 20px;
  color: #409eff;
}

.task-badge {
  margin-left: 8px;
}

.task-badge :deep(.el-badge__content) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

.tasks-container {
  max-height: 400px;
  overflow-y: auto;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.task-item:hover {
  background-color: #e9ecef;
  transform: translateX(4px);
}

.task-item.urgent {
  border-left-color: #f56c6c;
  background-color: #fef2f2;
}

.task-item.urgent:hover {
  background-color: #fde8e8;
}

.task-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: white;
  flex-shrink: 0;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.task-type {
  padding: 2px 6px;
  background-color: #f0f2f5;
  border-radius: 4px;
  font-size: 11px;
}

.task-status {
  flex-shrink: 0;
}

/* 滚动条样式 */
.tasks-container::-webkit-scrollbar {
  width: 2px;
}

.tasks-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 1px;
}

.tasks-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 1px;
}

.tasks-container::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-item {
    padding: 10px;
    gap: 10px;
  }

  .task-icon {
    width: 28px;
    height: 28px;
  }

  .task-title {
    font-size: 13px;
  }

  .task-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .task-item {
    padding: 8px;
    gap: 8px;
  }

  .task-title {
    font-size: 12px;
  }

  .task-meta {
    font-size: 11px;
  }
}
</style>
