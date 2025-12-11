<!--
  提交国家平台Tab组件
  功能：展示审核通过状态、提交到国家平台
-->
<template>
  <div class="national-submit-tab">
    <h3 class="step-title">提交国家平台</h3>

    <div class="national-submit-section">
      <el-result icon="success" title="准备就绪" sub-title="您的数据已通过审核，可以提交到国家平台了">
        <template #extra>
          <el-space direction="vertical" size="large" alignment="center" style="width: 100%">
            <div class="submit-info-card">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="任务名称">
                  {{ currentTask.taskName }}
                </el-descriptions-item>
                <el-descriptions-item label="审核状态">
                  <el-tag type="success">已审核通过</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="数据周期">
                  {{ formatDateTime(currentTask.startDate) }} ~ {{ formatDateTime(currentTask.endDate) }}
                </el-descriptions-item>
                <el-descriptions-item label="文件数量">
                  {{ fileCount }} 个
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <el-alert
              title="提示"
              type="warning"
              :closable="false"
              show-icon
            >
              <template #default>
                <div style="line-height: 1.8">
                  <p>提交到国家平台后，数据将同步至国家药品监测系统</p>
                  <p>请确保数据准确无误后再进行提交</p>
                </div>
              </template>
            </el-alert>

            <el-space>
              <el-button size="large" @click="$emit('back-to-submit-report')">
                返回上一步
              </el-button>
              <el-button type="primary" size="large" @click="$emit('submit-to-national-platform')">
                <el-icon><Promotion /></el-icon>
                确认提交国家平台
              </el-button>
            </el-space>
          </el-space>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Promotion } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/formatTime'

// Props定义
interface CurrentTask {
  taskName: string
  startDate: string
  endDate: string
}

interface Props {
  currentTask: CurrentTask
  fileCount: number
}

defineProps<Props>()

// Emits定义
defineEmits<{
  (e: 'back-to-submit-report'): void
  (e: 'submit-to-national-platform'): void
}>()

/**
 * 格式化日期时间
 */
const formatDateTime = (date: string | undefined): string => {
  if (!date) return '-'
  return formatDate(new Date(date), 'YYYY-MM-DD')
}
</script>

<style scoped lang="scss">
.national-submit-tab {
  .step-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #303133;
  }

  .national-submit-section {
    padding: 40px 20px;
    
    .submit-info-card {
      width: 100%;
      max-width: 600px;
    }
  }
}
</style>
