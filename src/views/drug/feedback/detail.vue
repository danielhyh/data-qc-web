<template>
  <ContentWrap>
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon class="header-icon"><Tickets /></el-icon>
            <span>工单详情</span>
          </div>
          <el-button class="button" :icon="Back" @click="router.push('/feedback/list')">返回列表</el-button>
        </div>
      </template>

      <div v-if="feedback" class="feedback-detail">
        <!-- 标题区域 -->
        <div class="title-section">
          <div class="title-wrapper">
            <h2 class="feedback-title">{{ feedback.title }}</h2>
            <div class="status-badge" :class="getStatusClass(feedback.status)">
              <span class="status-dot"></span>
              <span>{{ getStatusText(feedback.status) }}</span>
            </div>
          </div>
          <div class="meta-info">
            <div class="meta-item">
              <el-icon><Document /></el-icon>
              <span>工单编号：#{{ feedback.id }}</span>
            </div>
            <div class="meta-item">
              <el-icon><Clock /></el-icon>
              <span>创建于 {{ dateFormatter(null, null, feedback.createTime) }}</span>
            </div>
          </div>
        </div>

        <!-- 对话记录区域 -->
        <div class="conversation-section">
          <div class="section-header">
            <el-icon><ChatDotRound /></el-icon>
            <h3>对话记录</h3>
            <span class="message-count">{{ feedback.messages?.length || 0 }} 条消息</span>
          </div>

          <div class="message-list">
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
          </div>
        </div>

        <!-- 回复区域 -->
        <div v-if="feedback.status < 2" class="reply-section">
          <div class="section-header">
            <el-icon><EditPen /></el-icon>
            <h3>追加消息</h3>
          </div>
          <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top">
            <el-form-item label="消息内容" prop="content">
              <el-input
                type="textarea"
                :rows="4"
                v-model="formData.content"
                placeholder="请输入您要回复的内容..."
              />
            </el-form-item>
            <el-form-item label="图片上传" prop="images">
              <UploadImgs v-model="formData.images" />
            </el-form-item>
          </el-form>
          <div class="action-buttons">
            <el-button type="primary" :icon="Promotion" @click="submitMessage">发送消息</el-button>
            <el-button type="success" :icon="CircleCheck" @click="updateStatus(2)">标记为已解决</el-button>
            <el-button type="info" :icon="CircleClose" @click="updateStatus(3)">关闭工单</el-button>
          </div>
        </div>

        <div v-else class="closed-notice">
          <el-result icon="info" title="工单已结束" sub-title="此工单已解决或关闭，无法追加消息">
            <template #extra>
              <el-button type="primary" @click="router.push('/feedback/list')">返回列表</el-button>
            </template>
          </el-result>
        </div>
      </div>
    </el-card>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Tickets, Back, Document, Clock, ChatDotRound,
  EditPen, Promotion, CircleCheck, CircleClose, Picture
} from '@element-plus/icons-vue'
import {
  getFeedback,
  appendFeedbackMessage,
  updateFeedbackStatus,
  updateFeedbackStatus2
} from '@/api/drug/feedback'
import { dateFormatter } from '@/utils/formatTime'
import { UploadImgs } from '@/components/UploadFile'

const route = useRoute()
const router = useRouter()

const feedback = ref(null)
const formRef = ref()
const formData = reactive({
  id: route.params.id,
  content: '',
  images: [] as string[]
})
const formRules = {
  content: [{ required: true, message: '请输入消息内容', trigger: 'blur' }]
}

const getStatusText = (status: number) => {
  const map = { 0: '待处理', 1: '处理中', 2: '已解决', 3: '已关闭' }
  return map[status] || '未知'
}

const getStatusClass = (status: number) => {
  const map = { 0: 'status-pending', 1: 'status-processing', 2: 'status-resolved', 3: 'status-closed' }
  return map[status] || ''
}

const getDetail = async () => {
  const id = route.params.id
  if (id) {
    const data = await getFeedback(id)
    feedback.value = data
  }
}

const submitMessage = async () => {
  await formRef.value.validate()
  const data = {
    feedbackId: formData.id,
    content: formData.content,
    images: formData.images?.length ? formData.images.join(',') : ''
  }
  await appendFeedbackMessage(data)
  ElMessage.success('消息发送成功')
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

<style scoped>
.box-card {
  border: none;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-icon {
  font-size: 22px;
  color: #409EFF;
}

/* 标题区域 */
.title-section {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.feedback-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
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
.status-pending .status-dot {
  background: #f56c6c;
}

.status-processing {
  background: #fdf6ec;
  color: #e6a23c;
}
.status-processing .status-dot {
  background: #e6a23c;
}

.status-resolved {
  background: #f0f9eb;
  color: #67c23a;
}
.status-resolved .status-dot {
  background: #67c23a;
  animation: none;
}

.status-closed {
  background: #f4f4f5;
  color: #909399;
}
.status-closed .status-dot {
  background: #909399;
  animation: none;
}

.meta-info {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
}

.meta-item .el-icon {
  color: #909399;
}

/* 对话记录区域 */
.conversation-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.section-header .el-icon {
  font-size: 20px;
  color: #409EFF;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.message-count {
  margin-left: auto;
  font-size: 13px;
  color: #909399;
  background: #f4f4f5;
  padding: 4px 12px;
  border-radius: 12px;
}

.message-list {
  max-height: 500px;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
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
  background: #fff;
  border-radius: 12px;
  padding: 14px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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

/* 回复区域 */
.reply-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #ebeef5;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.closed-notice {
  background: #fafafa;
  border-radius: 12px;
  padding: 20px;
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
</style>
