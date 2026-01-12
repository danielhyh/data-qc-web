<template>
  <Dialog
    v-model="dialogVisible"
    :title="currentNotice?.title || '系统通知'"
    width="720px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="notice-dialog"
    @closed="handleDialogClosed"
  >
    <div class="notice-content">
      <!-- 通知类型标签 -->
      <div class="notice-meta">
        <el-tag :type="getNoticeTypeTag(currentNotice?.type)" size="small">
          {{ getNoticeTypeName(currentNotice?.type) }}
        </el-tag>
        <span class="notice-time">{{
          formatTime(currentNotice?.publishTime || currentNotice?.createTime)
        }}</span>
      </div>

      <!-- 通知内容 -->
      <div class="notice-body" v-html="currentNotice?.content"></div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span class="notice-count" v-if="notices.length > 1">
          {{ currentIndex + 1 }} / {{ notices.length }}
        </span>
        <el-button type="primary" @click="handleConfirm" :loading="confirmLoading">
          我知道了
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as NoticeApi from '@/api/system/notice'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'NoticeDialog' })

// 通知列表
const notices = ref<NoticeApi.NoticeVO[]>([])
// 当前显示的通知索引
const currentIndex = ref(0)
// 弹框可见性
const dialogVisible = ref(false)
// 确认按钮loading
const confirmLoading = ref(false)

// 当前显示的通知
const currentNotice = computed(() => notices.value[currentIndex.value])

// 获取通知类型名称
const getNoticeTypeName = (type?: number) => {
  const typeMap: Record<number, string> = {
    1: '公告',
    2: '通知'
  }
  return typeMap[type || 1] || '通知'
}

// 获取通知类型标签样式
const getNoticeTypeTag = (type?: number) => {
  const tagMap: Record<number, string> = {
    1: 'danger',
    2: 'warning'
  }
  return tagMap[type || 1] || 'info'
}

// 格式化时间
const formatTime = (time?: Date | string) => {
  if (!time) return ''
  return formatDate(time)
}

// 加载未读的工作台通知
const loadUnreadNotices = async () => {
  try {
    // 获取工作台通知列表
    const allNotices = await NoticeApi.getDashboardNoticeList()

    // 过滤出未读的通知（readStatus为false或undefined的）
    notices.value = allNotices.filter((notice: NoticeApi.NoticeVO) => !notice.readStatus)

    if (notices.value.length > 0) {
      currentIndex.value = 0
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('加载通知失败:', error)
  }
}

// 处理确认按钮点击
const handleConfirm = async () => {
  if (!currentNotice.value?.id) return

  confirmLoading.value = true
  try {
    // 调用后端接口标记已读
    await NoticeApi.markAsRead([currentNotice.value.id])

    // 如果还有下一条通知，显示下一条
    if (currentIndex.value < notices.value.length - 1) {
      currentIndex.value++
    } else {
      // 所有通知都已确认，关闭弹框
      dialogVisible.value = false
      ElMessage.success('所有通知已确认')
    }
  } catch (error) {
    console.error('标记已读失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    confirmLoading.value = false
  }
}

// 弹框关闭后的处理
const handleDialogClosed = () => {
  // 重置状态
  currentIndex.value = 0
}

// 组件挂载时加载通知
onMounted(() => {
  loadUnreadNotices()
})

// 暴露方法供外部调用
defineExpose({
  loadUnreadNotices
})
</script>

<style lang="scss" scoped>
.notice-dialog {
  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin-right: 0;
    padding: 16px 20px;
    border-radius: 8px 8px 0 0;

    .el-dialog__title {
      color: #fff;
      font-weight: 600;
      font-size: 16px;
    }

    .el-dialog__headerbtn {
      top: 16px;

      .el-dialog__close {
        color: rgba(255, 255, 255, 0.8);

        &:hover {
          color: #fff;
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 12px 20px 20px;
  }
}

.notice-content {
  .notice-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #ebeef5;
  }

  .notice-time {
    font-size: 13px;
    color: #909399;
  }

  .notice-body {
    font-size: 14px;
    line-height: 1.8;
    color: #303133;
    max-height: 400px;
    overflow-y: auto;

    :deep(p) {
      margin: 8px 0;
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 20px;
      margin: 8px 0;
    }

    :deep(li) {
      margin: 4px 0;
    }

    :deep(strong),
    :deep(b) {
      font-weight: 600;
    }

    :deep(a) {
      color: #409eff;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;

  .notice-count {
    font-size: 13px;
    color: #909399;
  }

  .el-button {
    min-width: 100px;
  }
}
</style>
