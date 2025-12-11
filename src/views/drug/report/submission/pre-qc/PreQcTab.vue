<!--
  前置质控Tab组件
  功能：质控进度展示、质控结果表格、错误查看
-->
<template>
  <div class="pre-qc-tab">
    <h3 class="step-title">前置质控结果</h3>

    <!-- 质控进度条 -->
    <transition name="fade-slide">
      <div v-if="isQCProcessing" class="qc-progress-section">
        <el-card class="qc-progress-card">
          <div class="qc-progress-header">
            <div class="header-left">
              <el-icon class="processing-icon"><Loading /></el-icon>
              <h4>正在执行前置质控...</h4>
            </div>
            <div class="header-right">
              <span class="progress-percent">{{ qcProgress }}%</span>
            </div>
          </div>

          <el-progress
            :percentage="qcProgress"
            :color="getProgressColor(qcProgress)"
            :stroke-width="12"
            class="main-progress"
          />

          <div class="qc-current-phase">
            <el-icon class="phase-icon"><Document /></el-icon>
            <span class="phase-text">{{ qcCurrentPhase }}</span>
          </div>

          <!-- 文件进度列表 -->
          <div v-if="qcFileProgress.length > 0" class="qc-files-list">
            <div v-for="(file, index) in qcFileProgress" :key="index" class="qc-file-item">
              <div class="file-info">
                <el-icon :class="['file-icon', file.status]">
                  <Loading v-if="file.status === 'processing'" />
                  <CircleCheckFilled v-else-if="file.status === 'success'" />
                  <Document v-else />
                </el-icon>
                <span class="file-name">{{ file.name }}</span>
              </div>
              <el-progress
                :percentage="file.progress"
                :status="file.status === 'success' ? 'success' : undefined"
                :stroke-width="6"
                class="file-progress"
              />
            </div>
          </div>
        </el-card>
      </div>
    </transition>

    <!-- 总览卡片 -->
    <StepSummaryCard
      v-if="!isQCProcessing"
      :key="`step2-${stepSummaryKey}`"
      :step-type="2"
      :task-id="taskId"
      @refresh="$emit('refresh-summary')"
      @close="$emit('summary-close')"
    />

    <div v-if="!isQCProcessing" class="qc-section">
      <!-- 质控统计卡片 -->
      <div class="qc-summary">
        <div class="summary-card" :class="preQCResult.passed ? 'success' : 'warning'">
          <div class="summary-icon">
            <el-icon v-if="preQCResult.passed">
              <CircleCheck />
            </el-icon>
            <el-icon v-else>
              <Warning />
            </el-icon>
          </div>
          <div class="summary-content">
            <div class="summary-title">{{ preQCResult.passed ? '质控通过' : '质控未通过' }}</div>
            <div class="summary-desc">
              {{ preQCResult.passed ? '所有文件已通过前置质控，可以提交上报' : '部分文件存在问题，请修复后重新上传' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 文件列表头部（带质控统计和刷新按钮） -->
      <div class="table-header">
        <span class="table-title">文件列表</span>

        <!-- 质控统计 -->
        <div class="header-qc-stats">
          <span class="stats-label">质控进度：</span>
          <el-progress
            :percentage="qcPercentage"
            :color="getProgressColor(qcPercentage)"
            :stroke-width="6"
            class="stats-progress"
          />
          <span class="stats-count">
            {{ passedFileCount }}/{{ totalFileCount }}
          </span>
        </div>

        <el-button
          type="primary"
          size="small"
          :icon="RefreshRight"
          :loading="refreshing"
          @click="handleRefresh"
          circle
        />
      </div>

      <!-- 质控详情表格 -->
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
        <el-table-column prop="qcStatus" label="质检状态" width="120" align="center">
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
        <el-table-column label="质控问题" width="140" align="center">
          <template #default="{ row }">
            <div class="qc-issue-tags">
              <el-tag v-if="row.qcErrorCount > 0" type="danger" size="small">
                错误 {{ row.qcErrorCount }}
              </el-tag>
              <el-tag v-if="row.warningCount > 0" type="warning" size="small">
                警告 {{ row.warningCount }}
              </el-tag>
              <span v-if="!row.qcErrorCount && !row.warningCount" class="text-success">无</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="质控进度" width="180" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="getQCProgress(row.qcStatus)"
              :color="getQCProgressColor(row.qcStatus)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="$emit('view-file-data', row)"
            >
              <el-icon class="mr-5px"><Document /></el-icon>
              查看详情
            </el-button>
            <!-- 警告状态(3)：显示查看警告按钮 -->
            <el-button
              v-if="row.qcStatus === 3"
              type="warning"
              size="small"
              @click="$emit('view-qc-errors', row)"
            >
              <el-icon class="mr-5px"><Warning /></el-icon>
              查看警告
            </el-button>
            <!-- 失败状态(4)：显示查看错误和修复重传按钮 -->
            <el-button
              v-if="row.qcStatus === 4"
              type="danger"
              size="small"
              @click="$emit('view-qc-errors', row)"
            >
              <el-icon class="mr-5px"><Warning /></el-icon>
              查看错误
            </el-button>
            <el-button
              v-if="row.qcStatus === 4"
              type="warning"
              size="small"
              @click="$emit('fix-and-reupload', row)"
            >
              <el-icon class="mr-5px"><RefreshRight /></el-icon>
              修复重传
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="qc-actions">
        <el-button @click="$emit('back-to-upload')">
          <el-icon class="mr-5px"><ArrowLeft /></el-icon>
          返回上传
        </el-button>
        <el-button
          type="primary"
          :disabled="!preQCResult.passed"
          @click="$emit('start-submit-report')"
        >
          <el-icon class="mr-5px"><Promotion /></el-icon>
          开始提交上报
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Loading,
  Document,
  CircleCheck,
  CircleCheckFilled,
  Warning,
  RefreshRight,
  ArrowLeft,
  Promotion
} from '@element-plus/icons-vue'
import DictTag from '@/components/DictTag/src/DictTag.vue'
import StepSummaryCard from '../components/StepSummaryCard.vue'
import { DICT_TYPE } from '@/utils/dict'
import { getProgressColor } from '@/utils/progressColor'

// Props定义
interface QCFileProgress {
  name: string
  status: 'pending' | 'processing' | 'success'
  progress: number
}

interface PreQCResult {
  passed: boolean
  details: any[]
}

interface Props {
  taskId: number
  stepSummaryKey: number
  isQCProcessing: boolean
  qcProgress: number
  qcCurrentPhase: string
  qcFileProgress: QCFileProgress[]
  preQCResult: PreQCResult
}

const props = defineProps<Props>()

// Emits定义
const emit = defineEmits<{
  (e: 'refresh-summary'): void
  (e: 'refresh-file-list'): void
  (e: 'summary-close'): void
  (e: 'view-file-data', row: any): void
  (e: 'view-qc-errors', row: any): void
  (e: 'fix-and-reupload', row: any): void
  (e: 'back-to-upload'): void
  (e: 'start-submit-report'): void
}>()

// 刷新状态
const refreshing = ref(false)

// ==================== 计算属性 ====================
const totalFileCount = computed(() => props.preQCResult.details?.length || 0)

const passedFileCount = computed(() => {
  // qcStatus: 2=质控通过, 3=质控警告（也算通过）
  return props.preQCResult.details?.filter((file: any) => file.qcStatus === 2 || file.qcStatus === 3).length || 0
})

const qcPercentage = computed(() => {
  if (totalFileCount.value === 0) return 0
  return Math.round((passedFileCount.value / totalFileCount.value) * 100)
})

/**
 * 处理刷新按钮点击
 */
const handleRefresh = async () => {
  refreshing.value = true
  // 同时刷新总览和文件列表
  emit('refresh-summary')
  emit('refresh-file-list')
  // 模拟刷新延迟
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
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

/**
 * 根据质控状态获取进度百分比
 * 0=未质控, 1=质控中, 2=质控通过, 3=质控警告, 4=质控未通过
 */
const getQCProgress = (qcStatus: number): number => {
  switch (qcStatus) {
    case 0: return 0    // 未质控
    case 1: return 50   // 质控中
    case 2: return 100  // 质控通过
    case 3: return 100  // 质控警告（完成但有警告）
    case 4: return 100  // 质控未通过（完成但失败）
    default: return 0
  }
}

/**
 * 根据质控状态获取进度条颜色
 * 0=未质控, 1=质控中, 2=质控通过, 3=质控警告, 4=质控未通过
 */
const getQCProgressColor = (qcStatus: number): string => {
  switch (qcStatus) {
    case 2: return '#67c23a'  // 通过 - 绿色
    case 3: return '#e6a23c'  // 警告 - 橙色
    case 4: return '#f56c6c'  // 失败 - 红色
    default: return '#409eff' // 进行中 - 蓝色
  }
}
</script>

<style scoped lang="scss">
.pre-qc-tab {
  .step-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #303133;
  }

  .qc-progress-section {
    margin-bottom: 20px;
  }

  .qc-progress-card {
    .qc-progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .processing-icon {
          font-size: 24px;
          color: #409eff;
          animation: spin 1s linear infinite;
        }

        h4 {
          margin: 0;
          font-size: 16px;
          color: #303133;
        }
      }

      .progress-percent {
        font-size: 24px;
        font-weight: 600;
        color: #409eff;
      }
    }

    .main-progress {
      margin-bottom: 16px;
    }

    .qc-current-phase {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #606266;
      margin-bottom: 16px;

      .phase-icon {
        color: #409eff;
      }
    }

    .qc-files-list {
      border-top: 1px solid #ebeef5;
      padding-top: 16px;

      .qc-file-item {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 200px;

          .file-icon {
            font-size: 18px;

            &.processing {
              color: #409eff;
              animation: spin 1s linear infinite;
            }

            &.success {
              color: #67c23a;
            }
          }

          .file-name {
            font-size: 14px;
            color: #303133;
          }
        }

        .file-progress {
          flex: 1;
        }
      }
    }
  }

  .table-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 4px;

    .table-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    // 刷新按钮靠右
    > :last-child {
      margin-left: auto;
    }

    .header-qc-stats {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 280px;
      margin-left: 16px;

      .stats-label {
        font-size: 14px;
        color: #606266;
        white-space: nowrap;
      }

      .stats-progress {
        flex: 1;
      }

      .stats-count {
        font-size: 14px;
        font-weight: 600;
        color: #409eff;
        white-space: nowrap;
      }
    }
  }

  .qc-section {
    .qc-summary {
      margin-bottom: 20px;

      .summary-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        border-radius: 8px;

        &.success {
          background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
          border: 1px solid #c2e7b0;

          .summary-icon {
            color: #67c23a;
          }
        }

        &.warning {
          background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
          border: 1px solid #f5dab1;

          .summary-icon {
            color: #e6a23c;
          }
        }

        .summary-icon {
          font-size: 40px;
        }

        .summary-content {
          .summary-title {
            font-size: 18px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .summary-desc {
            font-size: 14px;
            color: #606266;
          }
        }
      }
    }
  }

  .error-count {
    color: #f56c6c;
    font-weight: 600;
  }

  .qc-issue-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
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

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
