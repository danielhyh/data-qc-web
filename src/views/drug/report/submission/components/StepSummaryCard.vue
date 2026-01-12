<template>
  <div class="step-summary-card" v-if="parsedSummaryData || isProcessing">
    <!-- 处理中：显示进度 -->
    <div v-if="isProcessing" class="processing-view">
      <div class="progress-header">
        <div class="header-left">
          <el-icon class="processing-icon"><Loading /></el-icon>
          <h4>{{ currentPhase }}</h4>
        </div>
        <div class="header-right" v-if="totalCount > 0">
          <span class="file-count">{{ uploadedCount }}/{{ totalCount }}</span>
        </div>
      </div>
      <el-progress 
        :percentage="overallProgress" 
        :color="getProgressColor(overallProgress)"
        :stroke-width="16"
        :show-text="true"
      />
    </div>
    
    <!-- 已完成：显示总览 -->
    <el-alert v-else :type="alertType" :closable="false">
      <template #title>
        <div class="summary-title">
          <el-icon><component :is="statusIcon" /></el-icon>
          <span>{{ stepName }}总览</span>
          <el-tag :type="statusTagType" size="small">{{ statusText }}</el-tag>
          <!-- 质控步骤显示查看报告按钮 - 暂时注释 -->
          <!-- <el-button 
            v-if="stepType === 2" 
            type="primary" 
            link 
            size="small" 
            @click="handleViewReport"
            class="view-report-btn"
          >
            <el-icon><Document /></el-icon>
            查看报告
          </el-button> -->
        </div>
      </template>
      
      <div class="summary-content">
        <!-- 统计数据 -->
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">总文件</span>
            <span class="stat-value">{{ parsedSummaryData.totalFiles || 0 }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item success">
            <span class="stat-label">成功</span>
            <span class="stat-value">{{ parsedSummaryData.successFiles || 0 }}</span>
          </div>
          <div class="stat-divider" v-if="parsedSummaryData.warningFiles > 0"></div>
          <div class="stat-item warning" v-if="parsedSummaryData.warningFiles > 0">
            <span class="stat-label">警告</span>
            <span class="stat-value">{{ parsedSummaryData.warningFiles }}</span>
          </div>
          <div class="stat-divider" v-if="parsedSummaryData.failedFiles > 0"></div>
          <div class="stat-item failed" v-if="parsedSummaryData.failedFiles > 0">
            <span class="stat-label">失败</span>
            <span class="stat-value">{{ parsedSummaryData.failedFiles }}</span>
          </div>
        </div>
        
        <!-- 步骤特有信息 -->
        <div class="step-specific" v-if="parsedSummaryData.totalRecords">
          <div class="info-row">
            <span>总记录数：{{ formatNumber(parsedSummaryData.totalRecords) }}</span>
            <span class="divider">|</span>
            <span :class="parsedSummaryData.errorRecords > 0 ? 'error-text' : ''">
              错误数：{{ formatNumber(parsedSummaryData.errorRecords) }}
            </span>
            <!-- 统计级错误（整体检查） -->
            <template v-if="stepType === 2 && parsedSummaryData.statErrorRecords > 0">
              <span class="divider">|</span>
              <span class="stat-error-text">
                整体检查：{{ parsedSummaryData.statErrorRecords }}项
              </span>
            </template>
            <template v-if="stepType === 2 && parsedSummaryData.passRate !== undefined">
              <span class="divider">|</span>
              <span :class="getPassRateClass(parsedSummaryData.passRate)">
                通过率：{{ parsedSummaryData.passRate?.toFixed(1) }}%
              </span>
            </template>
          </div>
        </div>

        <!-- 质控步骤：显示规则统计 -->
        <div class="rule-stats" v-if="stepType === 2 && parsedSummaryData.totalRules">
          <div class="info-row">
            <span>执行规则：{{ parsedSummaryData.executedRules || 0 }}/{{ parsedSummaryData.totalRules }}</span>
            <span class="divider">|</span>
            <span class="success-text">通过：{{ parsedSummaryData.passedRules || 0 }}</span>
            <template v-if="parsedSummaryData.failedRules > 0">
              <span class="divider">|</span>
              <span class="error-text">失败：{{ parsedSummaryData.failedRules }}</span>
            </template>
          </div>
        </div>
        
        <!-- 时间信息 -->
        <div class="summary-time" v-if="parsedSummaryData.endTime">
          <span>最近处理耗时：{{ formatDuration(parsedSummaryData.duration) }}</span>
          <span class="divider">|</span>
          <span>完成时间：{{ formatDateTime(parsedSummaryData.endTime) }}</span>
        </div>
      </div>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Loading, CircleCheckFilled, WarningFilled, CircleCloseFilled, Document } from '@element-plus/icons-vue'
import { getProgressColor } from '@/utils/progressColor'
import { ReportStepSummaryApi } from '@/api/drug/reportstepsummary/index'

const props = defineProps({
  stepType: {
    type: Number,
    required: true
  },
  taskId: {
    type: Number,
    required: true
  },
  isProcessing: {
    type: Boolean,
    default: false
  },
  currentPhase: {
    type: String,
    default: '正在处理...'
  },
  uploadedCount: {
    type: Number,
    default: 0
  },
  totalCount: {
    type: Number,
    default: 0
  },
  overallProgress: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['refresh', 'close', 'viewReport'])

const summaryData = ref<any>(null)

// 解析 summaryData JSON 字段中的扩展数据
const parsedSummaryData = computed(() => {
  if (!summaryData.value) return null
  
  const data = { ...summaryData.value }
  
  // 解析 summaryData JSON 字段
  if (data.summaryData && typeof data.summaryData === 'string') {
    try {
      const extraData = JSON.parse(data.summaryData)
      // 合并扩展数据到主数据
      Object.assign(data, extraData)
    } catch (e) {
      console.warn('解析 summaryData JSON 失败:', e)
    }
  }
  
  return data
})

// 步骤名称映射
const stepNames = {
  1: '上传与校验',
  2: '前置质控',
  3: '提交上报',
  4: '提交国家平台'
}

const stepName = computed(() => stepNames[props.stepType] || '处理')

// 状态相关计算
const alertType = computed(() => {
  if (!parsedSummaryData.value) return 'info'
  if (parsedSummaryData.value.status === 1 && parsedSummaryData.value.failedFiles === 0) return 'success'
  if (parsedSummaryData.value.status === 3) return 'error'
  return 'warning'
})

const statusIcon = computed(() => {
  if (!parsedSummaryData.value) return CircleCheckFilled
  if (parsedSummaryData.value.status === 1 && parsedSummaryData.value.failedFiles === 0) return CircleCheckFilled
  if (parsedSummaryData.value.status === 3) return CircleCloseFilled
  return WarningFilled
})

const statusTagType = computed(() => {
  if (!parsedSummaryData.value) return 'info'
  if (parsedSummaryData.value.status === 1 && parsedSummaryData.value.failedFiles === 0) return 'success'
  if (parsedSummaryData.value.status === 3) return 'danger'
  return 'warning'
})

const statusText = computed(() => {
  if (!parsedSummaryData.value) return '未知'
  if (parsedSummaryData.value.status === 0) return '处理中'
  if (parsedSummaryData.value.status === 1) {
    return parsedSummaryData.value.failedFiles > 0 ? '部分成功' : '已完成'
  }
  if (parsedSummaryData.value.status === 2) return '部分失败'
  if (parsedSummaryData.value.status === 3) return '失败'
  return '未知'
})

// 格式化数字
const formatNumber = (num: number) => num?.toLocaleString() || '0'

// 格式化时长
const formatDuration = (seconds: number) => {
  if (!seconds) return '0秒'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes}分${secs}秒`
  }
  return `${secs}秒`
}

// 格式化时间
const formatDateTime = (date: string | Date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// 获取通过率样式类
const getPassRateClass = (rate: number) => {
  if (rate >= 95) return 'success-text'
  if (rate >= 80) return ''
  return 'error-text'
}

// 查看报告
const handleViewReport = () => {
  emit('viewReport')
}

// 关闭总览
const handleClose = async () => {
  try {
    await ReportStepSummaryApi.closeStepSummary(props.taskId, props.stepType)
    summaryData.value = null
    emit('close')
  } catch (error) {
    console.error('关闭总览失败:', error)
  }
}

// 加载总览数据
const loadSummary = async () => {
  if (!props.taskId || props.stepType === 0 || props.isProcessing) {
    return
  }
  
  try {
    const result = await ReportStepSummaryApi.getStepSummaryByTaskAndStep(props.taskId, props.stepType)
    if (result && result.status !== 0) { // 只显示已完成的总览
      summaryData.value = result
    }
  } catch (error) {
    console.log('暂无总览数据')
  }
}

// 监听任务ID和步骤变化
watch(() => [props.taskId, props.stepType, props.isProcessing], () => {
  if (!props.isProcessing) {
    loadSummary()
  }
}, { immediate: true })

// 组件挂载时加载
onMounted(() => {
  if (!props.isProcessing) {
    loadSummary()
  }
})

// 暴露刷新方法
defineExpose({
  loadSummary
})
</script>

<style scoped>
.step-summary-card {
  margin-bottom: 20px;
}

/* 处理中视图 */
.processing-view {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #667eea;
  border-radius: 12px;
  padding: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.processing-icon {
  font-size: 24px;
  color: #667eea;
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.progress-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.file-count {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
  padding: 6px 16px;
  border-radius: 20px;
  border: 2px solid #667eea;
}

.processing-view :deep(.el-progress__text) {
  font-size: 16px !important;
  font-weight: 700;
  color: #667eea;
}

/* 总览卡片样式 */
:deep(.el-alert) {
  border-radius: 12px;
  padding: 20px;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
}

.summary-title .el-icon {
  font-size: 20px;
}

.view-report-btn {
  margin-left: auto;
  font-size: 13px;
}

.summary-content {
  margin-top: 16px;
}

.summary-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #e4e7ed;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.stat-item.success .stat-value {
  color: #67c23a;
}

.stat-item.warning .stat-value {
  color: #e6a23c;
}

.stat-item.failed .stat-value {
  color: #f56c6c;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: #d1d5db;
}

.step-specific, .rule-stats {
  padding: 12px 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #606266;
}

.info-row .divider {
  color: #d1d5db;
}

.error-text {
  color: #f56c6c;
  font-weight: 600;
}

.stat-error-text {
  color: #e6a23c;
  font-weight: 600;
}

.success-text {
  color: #67c23a;
  font-weight: 600;
}

.summary-time {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
  font-size: 13px;
  color: #909399;
}

.summary-time .divider {
  color: #d1d5db;
}
</style>

