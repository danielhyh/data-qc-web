<template>
  <el-card class="message-center-card" shadow="never">
    <template #header>
      <div class="card-header">
        <div class="header-title">
          <el-icon>
            <Bell />
          </el-icon>
          <span>消息中心</span>
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge" />
        </div>
        <el-button link type="primary" @click="handleViewAll">
          查看全部
          <el-icon>
            <ArrowRight />
          </el-icon>
        </el-button>
      </div>
    </template>

    <div class="messages-container" v-loading="loading">
      <el-empty v-if="messages.length === 0" description="暂无消息" :image-size="80">
        <el-button type="primary" @click="handleRefresh">刷新</el-button>
      </el-empty>

      <div v-else class="message-list">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="{ unread: !message.read, important: message.priority === 'high' }"
          @click="handleMessageClick(message)"
        >
          <div class="message-icon" :style="{ color: getMessageColor(message.type) }">
            <el-icon :size="18">
              <component :is="getMessageIcon(message.type)" />
            </el-icon>
          </div>
          <div class="message-content">
            <div class="message-title">{{ message.title }}</div>
            <div class="message-meta">
              <span class="message-type">{{ getMessageTypeName(message.type) }}</span>
              <span class="message-time">{{ formatTime(message.createTime) }}</span>
            </div>
          </div>
          <div class="message-status">
            <div v-if="!message.read" class="unread-dot"></div>
            <div v-if="message.priority === 'high'" class="priority-mark">!</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="message-actions" v-if="messages.length > 0">
      <el-button
        link
        type="primary"
        size="small"
        @click="handleMarkAllRead"
        :disabled="unreadCount === 0"
      >
        全部已读
      </el-button>
      <el-button
        link
        type="danger"
        size="small"
        @click="handleClearAll"
      >
        清空消息
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Bell,
  ArrowRight,
  InfoFilled,
  Warning,
  SuccessFilled,
  CircleClose,
  Setting,
  Document,
  UserFilled
} from '@element-plus/icons-vue'
import { formatPast } from '@/utils/formatTime'

interface Message {
  id: number
  title: string
  content?: string
  type: 'system' | 'warning' | 'success' | 'error' | 'notice' | 'report' | 'user'
  priority?: 'high' | 'medium' | 'low'
  read: boolean
  createTime: Date
  link?: string
}

interface Props {
  messages: Message[]
  loading?: boolean
}

interface Emits {
  (e: 'view-all'): void
  (e: 'message-click', message: Message): void
  (e: 'mark-all-read'): void
  (e: 'clear-all'): void
  (e: 'refresh'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

const unreadCount = computed(() => {
  return props.messages.filter(msg => !msg.read).length
})

const handleViewAll = () => {
  emit('view-all')
}

const handleMessageClick = (message: Message) => {
  emit('message-click', message)
}

const handleMarkAllRead = () => {
  emit('mark-all-read')
}

const handleClearAll = () => {
  emit('clear-all')
}

const handleRefresh = () => {
  emit('refresh')
}

const getMessageIcon = (type: string) => {
  const iconMap = {
    system: Setting,
    warning: Warning,
    success: SuccessFilled,
    error: CircleClose,
    notice: InfoFilled,
    report: Document,
    user: UserFilled
  }
  return iconMap[type] || InfoFilled
}

const getMessageColor = (type: string) => {
  const colorMap = {
    system: '#409EFF',
    warning: '#E6A23C',
    success: '#67C23A',
    error: '#F56C6C',
    notice: '#909399',
    report: '#9C27B0',
    user: '#FF9800'
  }
  return colorMap[type] || '#909399'
}

const getMessageTypeName = (type: string) => {
  const nameMap = {
    system: '系统',
    warning: '警告',
    success: '成功',
    error: '错误',
    notice: '通知',
    report: '报告',
    user: '用户'
  }
  return nameMap[type] || '消息'
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

.message-badge {
  margin-left: 8px;
}

.message-badge :deep(.el-badge__content) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

.messages-container {
  max-height: 400px;
  overflow-y: auto;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  position: relative;
}

.message-item:hover {
  background-color: #e9ecef;
  transform: translateX(2px);
}

.message-item.unread {
  background-color: #ecf5ff;
  border-left-color: #409EFF;
}

.message-item.unread:hover {
  background-color: #d9ecff;
}

.message-item.important {
  border-left-color: #f56c6c;
}

.message-item.important.unread {
  background-color: #fef2f2;
}

.message-icon {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.message-type {
  padding: 2px 6px;
  background-color: #f0f2f5;
  border-radius: 4px;
  font-size: 11px;
}

.message-status {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background-color: #f56c6c;
  border-radius: 50%;
}

.priority-mark {
  width: 16px;
  height: 16px;
  background-color: #f56c6c;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 2px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 1px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 1px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-item {
    padding: 10px;
    gap: 10px;
  }

  .message-title {
    font-size: 13px;
  }

  .message-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .message-actions {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .message-item {
    padding: 8px;
    gap: 8px;
  }

  .message-title {
    font-size: 12px;
  }

  .message-meta {
    font-size: 11px;
  }
}
</style>