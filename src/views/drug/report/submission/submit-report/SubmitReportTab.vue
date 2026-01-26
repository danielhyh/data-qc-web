<!--
  提交上报Tab组件
  功能：审核状态展示、上报信息、文件列表、提交操作
-->
<template>
  <div class="submit-report-tab">
    <h3 class="step-title">提交上报</h3>

    <!-- 总览卡片 -->
    <StepSummaryCard
      :key="`step3-${stepSummaryKey}`"
      :step-type="3"
      :task-id="taskId"
      @refresh="$emit('refresh-summary')"
      @close="$emit('summary-close')"
    />

    <div class="submit-section">
      <!-- 审核状态卡片 -->
      <transition name="fade-slide">
        <div v-if="reviewStatus !== null" class="review-status-section">
          <el-card :class="['review-status-card', getReviewStatusClass()]">
            <div class="review-status-header">
              <div class="status-icon-wrapper">
                <el-icon :class="['status-icon', getReviewStatusClass()]">
                  <Clock v-if="reviewStatus === 0" />
                  <CircleCheckFilled v-else-if="reviewStatus === 1" />
                  <CircleCloseFilled v-else-if="reviewStatus === 2" />
                </el-icon>
              </div>
              <div class="status-content">
                <h3 class="status-title">{{ getReviewStatusText() }}</h3>
                <p class="status-desc">{{ getReviewStatusDesc() }}</p>
              </div>
            </div>

            <!-- 审核信息 -->
            <div v-if="reviewInfo" class="review-info">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="提交时间">
                  {{ formatDateTime(reviewInfo.submitTime) }}
                </el-descriptions-item>
                <el-descriptions-item label="审核状态">
                  <el-tag :type="getReviewTagType()">{{ getReviewStatusText() }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item v-if="reviewInfo.reviewTime" label="审核时间">
                  {{ formatDateTime(reviewInfo.reviewTime) }}
                </el-descriptions-item>
                <el-descriptions-item v-if="reviewInfo.reviewer" label="审核人">
                  {{ reviewInfo.reviewer }}
                </el-descriptions-item>
                <el-descriptions-item v-if="reviewInfo.reviewComment" label="审核意见" :span="2">
                  <div class="review-comment">{{ reviewInfo.reviewComment }}</div>
                </el-descriptions-item>
                <el-descriptions-item v-if="reviewStatus === 2 && reviewInfo.rejectReason" label="驳回原因" :span="2">
                  <div class="reject-reason">{{ reviewInfo.rejectReason }}</div>
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <!-- 操作按钮 -->
            <div class="review-actions">
              <el-button
                v-if="reviewStatus === 0"
                :icon="RefreshRight"
                @click="$emit('refresh-review-status')"
                :loading="refreshingReview"
              >
                刷新审核状态
              </el-button>
              <el-button
                v-if="reviewStatus === 1"
                type="success"
                size="large"
                @click="$emit('go-to-national-submit')"
              >
                <el-icon><Promotion /></el-icon>
                进入国家平台提交
              </el-button>
              <el-button
                v-if="reviewStatus === 2"
                type="warning"
                size="large"
                @click="$emit('back-to-upload-for-resubmit')"
              >
                <el-icon><RefreshLeft /></el-icon>
                重新上传文件
              </el-button>
            </div>
          </el-card>
        </div>
      </transition>

      <!-- 上报信息 -->
      <div v-if="reviewStatus === null" class="submit-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务名称">
            {{ submitInfo.taskName }}
          </el-descriptions-item>
          <el-descriptions-item label="开始日期">
            {{ formatDateTime(submitInfo.startDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束日期">
            {{ formatDateTime(submitInfo.endDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="上报时间">
            {{ formatDateTime(submitInfo.reportTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 文件列表 -->
      <el-table
        :data="preQCResult.details"
        :show-overflow-tooltip="true"
      >
        <el-table-column label="序号" width="80" type="index" align="center" />
        <el-table-column prop="fileType" label="文件类型" width="150" align="center">
          <template #default="{ row }">
            <dict-tag :type="DICT_TYPE.IMPORT_TABLE_TYPE" :value="row.fileType" />
          </template>
        </el-table-column>
        <el-table-column prop="standardFileName" label="标准文件名称" min-width="180" align="center">
          <template #default="scope">
            <span class="font-bold">{{ scope.row.standardFileName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="originalFileName" label="实际文件名称" min-width="200" align="center">
          <template #default="scope">
            <span class="font-bold">{{ scope.row.originalFileName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="uploadStatus" label="上传状态" width="120" align="center">
          <template #default="{ row }">
            <dict-tag :type="DICT_TYPE.UPLOAD_STATUS" :value="row.uploadStatus" />
          </template>
        </el-table-column>
        <el-table-column prop="qcStatus" label="质检状态" width="140" align="center">
          <template #default="{ row }">
            <dict-tag :type="DICT_TYPE.QC_STATUS" :value="row.qcStatus" />
          </template>
        </el-table-column>
        <el-table-column prop="fileSize" label="文件大小" width="120" align="center">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="fileFormat" label="文件格式" width="120" align="center" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="$emit('view-file-data', row)">
              <el-icon class="mr-5px"><Document /></el-icon>
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="qc-actions">
        <el-button @click="$emit('back-to-pre-qc')" :disabled="reviewStatus !== null">
          <el-icon class="mr-5px"><ArrowLeft /></el-icon>
          返回前置质控
        </el-button>
        <el-button
          type="warning"
          @click="$emit('view-post-qc-errors')"
        >
          <el-icon class="mr-5px"><Warning /></el-icon>
          查看后置质控错误详情
        </el-button>
        <el-button
          v-if="reviewStatus === null"
          type="success"
          size="large"
          :disabled="!preQCResult.passed"
          @click="$emit('submit-report')"
        >
          <el-icon class="mr-5px"><Promotion /></el-icon>
          确认提交上报
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Clock,
  CircleCheckFilled,
  CircleCloseFilled,
  RefreshRight,
  RefreshLeft,
  Promotion,
  Document,
  ArrowLeft,
  Warning
} from '@element-plus/icons-vue'
import DictTag from '@/components/DictTag/src/DictTag.vue'
import StepSummaryCard from '../components/StepSummaryCard.vue'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'

// Props定义
interface SubmitInfo {
  taskName: string
  startDate: string
  endDate: string
  reportTime: string
}

interface ReviewInfo {
  submitTime: string
  reviewTime?: string
  reviewer?: string
  reviewComment?: string
  rejectReason?: string
}

interface PreQCResult {
  passed: boolean
  details: any[]
}

interface Props {
  taskId: number
  stepSummaryKey: number
  reviewStatus: number | null
  reviewInfo: ReviewInfo | null
  submitInfo: SubmitInfo
  preQCResult: PreQCResult
  refreshingReview: boolean
}

const props = defineProps<Props>()

// Emits定义
defineEmits<{
  (e: 'refresh-summary'): void
  (e: 'summary-close'): void
  (e: 'refresh-review-status'): void
  (e: 'go-to-national-submit'): void
  (e: 'back-to-upload-for-resubmit'): void
  (e: 'view-file-data', row: any): void
  (e: 'back-to-pre-qc'): void
  (e: 'submit-report'): void
  (e: 'view-post-qc-errors'): void
}>()

/**
 * 获取审核状态样式类
 * reviewStatus: 0=待审核(审核中), 1=审核通过, 2=审核驳回
 */
const getReviewStatusClass = () => {
  switch (props.reviewStatus) {
    case 0:
      return 'pending'   // 待审核
    case 1:
      return 'approved'  // 审核通过
    case 2:
      return 'rejected'  // 审核驳回
    default:
      return ''
  }
}

/**
 * 获取审核状态文本
 */
const getReviewStatusText = () => {
  switch (props.reviewStatus) {
    case 0:
      return '等待审核'
    case 1:
      return '审核通过'
    case 2:
      return '审核驳回'
    default:
      return '未知状态'
  }
}

/**
 * 获取审核状态描述
 */
const getReviewStatusDesc = () => {
  switch (props.reviewStatus) {
    case 0:
      return '您的上报数据已提交，管理员正在审核中，请耐心等待...'
    case 1:
      return '恭喜！您的上报数据已通过审核，可以提交到国家平台了'
    case 2:
      return '很抱歉，您的上报数据未通过审核，请根据驳回原因修改后重新提交'
    default:
      return ''
  }
}

/**
 * 获取审核标签类型
 */
const getReviewTagType = (): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  switch (props.reviewStatus) {
    case 0:
      return 'warning'  // 待审核 - 橙色
    case 1:
      return 'success'  // 审核通过 - 绿色
    case 2:
      return 'danger'   // 审核驳回 - 红色
    default:
      return 'info'
  }
}

/**
 * 格式化日期时间
 */
const formatDateTime = (date: string | undefined): string => {
  if (!date) return '-'
  return formatDate(new Date(date), 'YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}
</script>

<style scoped lang="scss">
.submit-report-tab {
  .step-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #303133;
  }

  .submit-section {
    margin-top: 20px;
  }

  .review-status-section {
    margin-bottom: 20px;
  }

  .review-status-card {
    &.pending {
      border-left: 4px solid #909399;
    }

    &.approved {
      border-left: 4px solid #67c23a;
    }

    &.rejected {
      border-left: 4px solid #f56c6c;
    }

    .review-status-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;

      .status-icon-wrapper {
        .status-icon {
          font-size: 48px;

          &.pending {
            color: #909399;
          }

          &.approved {
            color: #67c23a;
          }

          &.rejected {
            color: #f56c6c;
          }
        }
      }

      .status-content {
        .status-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .status-desc {
          color: #909399;
          margin: 0;
        }
      }
    }

    .review-info {
      margin-bottom: 20px;
    }

    .review-comment,
    .reject-reason {
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .reject-reason {
      color: #f56c6c;
    }

    .review-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }

  .submit-info {
    margin-bottom: 20px;
  }

  .qc-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #ebeef5;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
