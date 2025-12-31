<template>
  <ContentWrap class="header-card">
    <div class="header-content">
      <div class="header-left">
        <el-button class="back-button" @click="router.push(backPath)" text>
          <el-icon class="back-icon"><ArrowLeft /></el-icon>
          <span>返回</span>
        </el-button>
        <div class="header-divider"></div>
        <div class="header-info">
          <h2 class="page-title">
            <el-icon class="title-icon"><Tickets /></el-icon>
            反馈详情
          </h2>
          <p class="page-subtitle">查看和处理用户反馈工单</p>
        </div>
      </div>
      <div class="header-right" v-if="feedback">
        <div class="feedback-brief">
          <span class="feedback-title-text">{{ feedback.title }}</span>
          <div class="title-tags">
            <el-tag v-if="feedback.type === 1" type="danger" size="small">功能异常</el-tag>
            <el-tag v-else-if="feedback.type === 2" type="warning" size="small">数据错误</el-tag>
            <el-tag v-else-if="feedback.type === 3" type="info" size="small">操作咨询</el-tag>
            <el-tag v-else-if="feedback.type === 4" type="success" size="small">功能建议</el-tag>
            <el-tag v-if="feedback.priority === 1" type="info" size="small">低</el-tag>
            <el-tag v-else-if="feedback.priority === 2" type="warning" size="small">中</el-tag>
            <el-tag v-else-if="feedback.priority === 3" type="danger" size="small">高</el-tag>
          </div>
        </div>
        <div class="meta-divider"></div>
        <div class="meta-item">
          <span class="meta-label">工单编号：</span>
          <span class="meta-value">#{{ feedback.id }}</span>
        </div>
        <div class="meta-divider"></div>
        <div class="meta-item">
          <el-icon class="meta-icon"><User /></el-icon>
          <span class="meta-text">{{ feedback.userName || '未知用户' }}</span>
        </div>
        <div class="meta-divider"></div>
        <div class="meta-item">
          <span class="meta-label">状态：</span>
          <span class="status-badge" :class="getStatusClass(feedback.status)">
            <span class="status-dot"></span>
            {{ getStatusText(feedback.status) }}
          </span>
        </div>
      </div>
    </div>
  </ContentWrap>

  <!-- 中间消息区域 -->
  <div v-if="feedback" class="chat-main">
    <div class="message-list" ref="messageListRef">
      <TransitionGroup name="message-fade">
        <div
          v-for="message in feedback.messages"
          :key="message.id"
          class="message-item"
          :class="{ 'is-admin': message.senderType === 2 }"
        >
          <div class="message-header">
            <div class="sender-info">
              <span class="sender-tag" :class="message.senderType === 2 ? 'tag-admin' : 'tag-user'">
                {{ message.senderType === 2 ? '管理员' : '用户' }}
              </span>
              <span class="sender-name">{{ message.senderName }}</span>
            </div>
            <span class="message-time">{{ dateFormatter(null, null, message.createTime) }}</span>
          </div>
          <div class="message-bubble">
            <div class="message-text">{{ message.content }}</div>
            <div v-if="message.images && message.images.length > 0" class="image-gallery">
              <el-image
                v-for="(url, index) in message.images.split(',')"
                :key="index"
                :src="url"
                :preview-teleported="true"
                :preview-src-list="message.images.split(',')"
                fit="cover"
                class="message-image"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                    <span>加载失败</span>
                  </div>
                </template>
              </el-image>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>

  <!-- 固定底部输入区域 - 居中缩短 -->
  <div class="chat-footer-wrapper" v-if="feedback && feedback.status < 2">
    <div class="chat-footer">
      <!-- 图片预览条 -->
      <Transition name="slide-up">
        <div class="preview-bar" v-if="formData.images.length > 0">
          <div class="preview-list">
            <div
              v-for="(img, index) in formData.images"
              :key="index"
              class="preview-item"
            >
              <img :src="img" alt="preview" />
              <button class="remove-btn" @click="removeImage(index)">
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 输入区域 -->
      <div class="input-container">
        <div class="input-wrapper">
          <!-- 左侧工具栏 -->
          <div class="input-tools">
            <el-upload
              :show-file-list="false"
              :auto-upload="true"
              :action="uploadUrl"
              :headers="uploadHeaders"
              accept="image/*"
              :on-success="handleUploadSuccess"
              :before-upload="beforeUpload"
            >
              <button class="tool-btn" type="button" title="上传图片">
                <el-icon><PictureFilled /></el-icon>
              </button>
            </el-upload>
          </div>

          <!-- 输入框 -->
          <div class="input-box">
            <el-input
              v-model="formData.content"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 4 }"
              placeholder="输入消息，Enter 发送..."
              resize="none"
              @keydown.enter.exact.prevent="submitMessage"
            />
          </div>

          <!-- 右侧操作区 -->
          <div class="input-actions">
            <template v-if="isAdmin">
              <el-tooltip content="标记已解决" placement="top">
                <button class="action-btn success" @click="updateStatus(2)">
                  <el-icon><CircleCheck /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip content="关闭工单" placement="top">
                <button class="action-btn gray" @click="updateStatus(3)">
                  <el-icon><CircleClose /></el-icon>
                </button>
              </el-tooltip>
            </template>
            <button
              class="send-btn"
              :class="{ active: formData.content.trim() }"
              :disabled="!formData.content.trim()"
              @click="submitMessage"
            >
              <el-icon><Promotion /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 工单已关闭提示 -->
  <div class="chat-footer-wrapper" v-else-if="feedback">
    <div class="chat-footer closed">
      <div class="closed-notice">
        <el-icon><Lock /></el-icon>
        <span>工单已{{ feedback.status === 2 ? '解决' : '关闭' }}，无法继续对话</span>
        <el-button type="primary" size="small" round @click="router.push(backPath)">
          返回列表
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Tickets, ArrowLeft, User, Clock, Picture, Promotion,
  CircleCheck, CircleClose, PictureFilled, Close, Lock
} from '@element-plus/icons-vue'
import {
  getFeedback,
  appendFeedbackMessage,
  updateFeedbackStatus2
} from '@/api/drug/feedback'
import { dateFormatter } from '@/utils/formatTime'
import { useUserStore } from '@/store/modules/user'
import { getAccessToken } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const messageListRef = ref<HTMLElement>()

// 上传配置
const uploadUrl = import.meta.env.VITE_API_URL + '/infra/file/upload'
const uploadHeaders = computed(() => ({
  Authorization: 'Bearer ' + getAccessToken()
}))

const isAdmin = computed(() => {
  const roles = userStore.getRoles || []
  return roles.some(role => ['super_admin', 'provincial_admin'].includes(role))
})

const backPath = computed(() => {
  return route.name === 'SystemFeedbackDetail' ? '/system/feedback' : '/user/feedback'
})

const feedback = ref(null)
const formData = reactive({
  id: route.params.id,
  content: '',
  images: [] as string[]
})

const getStatusText = (status: number) => {
  const map = { 0: '待处理', 1: '处理中', 2: '已解决', 3: '已关闭' }
  return map[status] || '未知'
}

const getStatusClass = (status: number) => {
  const map = { 0: 'status-pending', 1: 'status-processing', 2: 'status-resolved', 3: 'status-closed' }
  return map[status] || ''
}

// 上传前校验
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

// 上传成功处理
const handleUploadSuccess = (response) => {
  if (response.code === 0 && response.data) {
    formData.images.push(response.data)
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

const removeImage = (index: number) => {
  formData.images.splice(index, 1)
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

const getDetail = async () => {
  const id = route.params.id
  if (id) {
    const data = await getFeedback(id)
    feedback.value = data
    scrollToBottom()
  }
}

const submitMessage = async () => {
  if (!formData.content.trim()) return

  const data = {
    feedbackId: formData.id,
    content: formData.content,
    images: formData.images?.length ? formData.images.join(',') : ''
  }
  await appendFeedbackMessage(data)
  ElMessage.success('发送成功')
  formData.content = ''
  formData.images = []
  getDetail()
}

const updateStatus = async (status) => {
  await updateFeedbackStatus2({ id: feedback.value.id, status })
  ElMessage.success('状态更新成功')
  getDetail()
}

onMounted(() => {
  getDetail()
})
</script>

<style scoped lang="scss">
/* ==================== 固定头部卡片样式 ==================== */
.header-card {
  position: sticky;
  top: 0;
  margin: 20px 20px 0 20px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.back-button {
  color: #4b5563;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 14px;
  margin: -4px 0 0 -4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.back-button:hover {
  color: #667eea;
  background: #f3f4f6;
  border-color: #667eea;
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.back-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.back-button:hover .back-icon {
  transform: translateX(-2px);
}

.header-divider {
  width: 1px;
  height: 32px;
  background: linear-gradient(to bottom, transparent, #d1d5db, transparent);
  flex-shrink: 0;
}

.header-info {
  min-width: 0;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.title-icon {
  color: #409EFF;
  font-size: 22px;
}

.page-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.feedback-brief {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 280px;
}

.feedback-title-text {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.meta-value {
  font-size: 13px;
  color: #1a202c;
  font-weight: 600;
  background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
  padding: 4px 12px;
  border-radius: 6px;
}

.meta-icon {
  color: #6b7280;
  font-size: 16px;
}

.meta-text {
  font-size: 13px;
  color: #4b5563;
  font-weight: 500;
}

.meta-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-pending {
  background: #fef0f0;
  color: #f56c6c;
}
.status-pending .status-dot { background: #f56c6c; }

.status-processing {
  background: #fdf6ec;
  color: #e6a23c;
}
.status-processing .status-dot { background: #e6a23c; }

.status-resolved {
  background: #f0f9eb;
  color: #67c23a;
}
.status-resolved .status-dot { background: #67c23a; animation: none; }

.status-closed {
  background: #f4f4f5;
  color: #909399;
}
.status-closed .status-dot { background: #909399; animation: none; }

/* ==================== 中间消息区域 ==================== */
.chat-main {
  padding: 20px;
  padding-bottom: 120px; /* 为底部输入框预留空间 */
}

.message-list {
  min-height: calc(100vh - 280px);
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* 滚动条美化 */
.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-item {
  margin-bottom: 20px;
}

.message-item:last-child {
  margin-bottom: 0;
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sender-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tag-user {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: #fff;
}

.tag-admin {
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  color: #fff;
}

.sender-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-bubble {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 14px 18px;
  border: 1px solid #ebeef5;
  margin-left: 2px;
}

.message-item.is-admin .message-bubble {
  background: linear-gradient(135deg, #ecf5ff 0%, #f5f9ff 100%);
  border-color: #d9ecff;
}

.message-text {
  line-height: 1.6;
  word-break: break-word;
  color: #303133;
  white-space: pre-wrap;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.message-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.message-image:hover {
  transform: scale(1.02);
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
  gap: 4px;
}

.message-fade-enter-active {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== 固定底部输入区域 - 居中缩短 ==================== */
.chat-footer-wrapper {
  position: fixed;
  bottom: 30px; /* 往上移动 */
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 0 20px;
  z-index: 100;
  pointer-events: none; /* 让wrapper不阻挡点击 */
}

.chat-footer {
  width: 100%;
  max-width: 800px; /* 限制最大宽度 */
  background: #fff;
  border: 1px solid #ebeef5;
  padding: 12px 16px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  pointer-events: auto; /* 恢复点击 */

  &.closed {
    padding: 16px 24px;
  }
}

/* 图片预览条 */
.preview-bar {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.preview-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.preview-item {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #f56c6c;
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    transition: all 0.2s;
    box-shadow: 0 2px 6px rgba(245, 108, 108, 0.4);

    &:hover {
      transform: scale(1.1);
      background: #e04343;
    }
  }
}

/* 输入区域 */
.input-container {
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;

  &:focus-within {
    border-color: #409EFF;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
  }
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 12px;
}

.input-tools {
  flex-shrink: 0;
  display: flex;
  align-items: center;

  :deep(.el-upload) {
    display: inline-flex;
  }
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #909399;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e8e8e8;
    color: #409EFF;
  }

  .el-icon {
    font-size: 20px;
  }
}

.input-box {
  flex: 1;
  min-width: 0;

  :deep(.el-textarea__inner) {
    border: none;
    background: transparent;
    padding: 8px 0;
    font-size: 14px;
    line-height: 1.5;
    box-shadow: none !important;
    resize: none;

    &::placeholder {
      color: #a8abb2;
    }
  }
}

.input-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  .el-icon {
    font-size: 18px;
  }

  &.success {
    background: #f0f9eb;
    color: #67c23a;

    &:hover {
      background: #e1f3d8;
    }
  }

  &.gray {
    background: #f4f4f5;
    color: #909399;

    &:hover {
      background: #e9e9eb;
    }
  }
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: #dcdfe6;
  color: #a8abb2;
  border-radius: 10px;
  cursor: not-allowed;
  transition: all 0.2s;

  .el-icon {
    font-size: 18px;
  }

  &.active {
    background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
    color: #fff;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
    }
  }
}

/* 关闭状态提示 */
.closed-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 4px;
  color: #909399;
  font-size: 14px;

  .el-icon {
    font-size: 18px;
    color: #c0c4cc;
  }
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ==================== 响应式设计 ==================== */
@media (max-width: 1200px) {
  .header-right {
    flex-wrap: wrap;
    gap: 12px;
  }

  .feedback-brief {
    max-width: 200px;
  }
}

@media (max-width: 992px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-right {
    width: 100%;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }

  .feedback-brief {
    max-width: none;
    flex: 1;
  }

  .chat-footer {
    max-width: 700px;
  }
}

@media (max-width: 768px) {
  .header-card {
    margin: 12px 12px 0 12px;
    border-radius: 12px;
  }

  .header-content {
    padding: 12px 16px;
  }

  .chat-main {
    padding: 12px;
    padding-bottom: 100px;
  }

  .message-list {
    padding: 16px;
    border-radius: 12px;
    min-height: calc(100vh - 240px);
    max-height: calc(100vh - 240px);
  }

  .chat-footer-wrapper {
    bottom: 20px;
    padding: 0 12px;
  }

  .chat-footer {
    max-width: none;
    padding: 10px 12px;
    border-radius: 12px;
  }

  .meta-divider {
    display: none;
  }

  .header-right {
    gap: 8px;
  }

  .feedback-brief {
    display: none;
  }

  .input-wrapper {
    padding: 6px 10px;
  }
}
</style>
