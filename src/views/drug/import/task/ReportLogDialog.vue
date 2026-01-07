<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="720px">
    <div class="report-log-container">
      <!-- 时间轴形式展示日志 -->
      <el-timeline v-if="logList.length > 0">
        <el-timeline-item
          v-for="log in logList"
          :key="log.id"
          :color="getStatusColor(log.operationStatus)"
          placement="top"
          :hollow="log.operationStatus === OperationStatusEnum.PROCESSING"
        >
          <div class="log-card" :class="getStatusClass(log.operationStatus)">
            <!-- 卡片头部：操作类型 + 状态 -->
            <div class="log-card-header">
              <div class="operation-info">
                <span class="operation-label">操作类型</span>
                <span class="operation-icon">{{ getOperationIcon(log.operationType) }}</span>
                <span class="operation-name">{{ getOperationName(log.operationType) }}</span>
              </div>
              <div class="status-info">
                <span class="status-label">执行结果</span>
                <div class="status-badge" :class="getStatusClass(log.operationStatus)">
                  {{ getStatusName(log.operationStatus) }}
                </div>
              </div>
            </div>

            <!-- 卡片内容：详细信息 -->
            <div class="log-card-body">
              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">操作时间</span>
                  <span class="info-value">{{ formatDate(log.createTime) }}</span>
                </div>
                <div class="info-item" v-if="log.executionTime">
                  <span class="info-label">执行耗时</span>
                  <span class="info-value time-value">{{ formatExecutionTime(log.executionTime) }}</span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">操作人</span>
                  <span class="info-value operator-value">
                    <el-icon v-if="log.operatorType === 1"><User /></el-icon>
                    <el-icon v-else><Monitor /></el-icon>
                    {{ log.operatorName || '系统自动' }}
                    <span v-if="log.operatorRealName" class="real-name">（{{ log.operatorRealName }}）</span>
                  </span>
                </div>
              </div>
              
              <!-- 操作详情（暂时隐藏）
              <div class="detail-section" v-if="log.operationDetail">
                <div class="detail-header">
                  <span class="info-label">操作详情</span>
                </div>
                <div class="detail-content">
                  <div v-for="(value, key) in parseDetail(log.operationDetail)" :key="key" class="detail-line">
                    <span class="detail-key">{{ formatDetailKey(key) }}:</span>
                    <span class="detail-value">{{ formatDetailValue(key, value) }}</span>
                  </div>
                </div>
              </div>
              -->
            </div>

            <!-- 错误信息（如果有） -->
            <div class="log-card-error" v-if="log.errorMessage">
              <el-icon><WarningFilled /></el-icon>
              <span>{{ log.errorMessage }}</span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-else description="暂无日志记录" :image-size="120" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { formatDate } from '@/utils/formatTime'
import { User, Monitor, WarningFilled } from '@element-plus/icons-vue'
import { getReportLogListByTaskId, ReportLogVO, OperationStatusEnum } from '@/api/drug/reportLog'

const dialogVisible = ref(false)
const dialogTitle = ref('上报日志')
const logList = ref<ReportLogVO[]>([])

/** 打开弹窗 */
const open = async (taskId: number, taskName?: string) => {
  dialogVisible.value = true
  dialogTitle.value = taskName ? `${taskName} - 上报日志` : '上报日志'

  try {
    logList.value = await getReportLogListByTaskId(taskId)
  } catch (error) {
    console.error('加载日志失败:', error)
    logList.value = []
  }
}

/** 获取操作类型图标 */
const getOperationIcon = (type: number) => {
  const iconMap: Record<number, string> = {
    1: '📤', // 文件上传
    2: '🔍', // 前置质控
    3: '📝', // 提交上报
    4: '✅', // 审核通过
    5: '❌', // 审核驳回
    6: '🔬', // 后置质控
    7: '🚀'  // 提交国家平台
  }
  return iconMap[type] || '📋'
}

/** 获取操作类型名称 */
const getOperationName = (type: number) => {
  const nameMap: Record<number, string> = {
    1: '文件上传',
    2: '前置质控',
    3: '提交上报',
    4: '审核通过',
    5: '审核驳回',
    6: '后置质控',
    7: '提交国家平台'
  }
  return nameMap[type] || '未知操作'
}

/** 获取状态名称 */
const getStatusName = (status: number) => {
  const nameMap: Record<number, string> = {
    0: '进行中',
    1: '成功',
    2: '失败',
    3: '成功(警告)'
  }
  return nameMap[status] || '未知'
}

/** 获取状态颜色 */
const getStatusColor = (status: number) => {
  const colorMap: Record<number, string> = {
    [OperationStatusEnum.PROCESSING]: '#409EFF',
    [OperationStatusEnum.SUCCESS]: '#67C23A',
    [OperationStatusEnum.FAIL]: '#F56C6C',
    [OperationStatusEnum.WARNING]: '#E6A23C'
  }
  return colorMap[status] || '#909399'
}

/** 获取状态样式类 */
const getStatusClass = (status: number) => {
  const classMap: Record<number, string> = {
    0: 'status-processing',
    1: 'status-success',
    2: 'status-fail',
    3: 'status-warning'
  }
  return classMap[status] || ''
}

/** 格式化执行时间 */
const formatExecutionTime = (time: number) => {
  if (time < 1000) {
    return `${time} 毫秒`
  } else if (time < 60000) {
    return `${(time / 1000).toFixed(1)} 秒`
  } else {
    const minutes = Math.floor(time / 60000)
    const seconds = Math.round((time % 60000) / 1000)
    return seconds > 0 ? `${minutes} 分 ${seconds} 秒` : `${minutes} 分钟`
  }
}

/** 解析操作详情JSON */
const parseDetail = (jsonStr: string) => {
  try {
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('解析操作详情失败:', error)
    return {}
  }
}

/** 格式化详情字段名为中文 */
const formatDetailKey = (key: string) => {
  const keyMap: Record<string, string> = {
    // 文件上传
    fileCount: '文件数量',
    files: '文件列表',
    totalSize: '总大小',
    
    // 前置质控
    totalFiles: '总文件数',
    passedFiles: '通过文件数',
    warningFiles: '警告文件数',
    failedFiles: '失败文件数',
    totalErrors: '错误总数',
    totalWarnings: '警告总数',
    details: '详细信息',
    
    // 提交上报
    taskName: '任务名称',
    period: '上报周期',
    dataCount: '数据统计',
    totalRecords: '总记录数',
    
    // 审核
    comment: '审核意见',
    rejectReason: '驳回原因',
    
    // 后置质控
    totalRules: '规则总数',
    passedRules: '通过规则数',
    failedRules: '失败规则数',
    errorCount: '错误数量',
    warningCount: '警告数量',
    failedRuleNames: '失败规则',
    
    // 提交国家平台
    platform: '平台名称',
    submitTime: '提交时间',
    batchNo: '批次号',
    recordCount: '记录数量'
  }
  return keyMap[key] || key
}

/** 格式化详情值 */
const formatDetailValue = (key: string, value: any): string => {
  if (value === null || value === undefined) {
    return '-'
  }
  
  // 布尔值翻译
  if (typeof value === 'boolean') {
    if (key === 'canContinue') {
      return value ? '是' : '否'
    }
    return value ? '是' : '否'
  }
  
  // 特殊字段翻译
  if (key === 'qcStatus') {
    const statusMap: Record<string, string> = {
      'PASSED': '通过',
      'WARNING': '警告',
      'FAILED': '失败',
      'PROCESSING': '处理中'
    }
    return statusMap[value] || value
  }
  
  if (key === 'reportStatus') {
    const statusMap: Record<string, string> = {
      '0': '待上报',
      '1': '审核中',
      '2': '已通过',
      '3': '已驳回',
      '4': '已上报'
    }
    return statusMap[value] || value
  }
  
  // 数字格式化
  if (typeof value === 'number') {
    // 文件大小
    if (key === 'fileSize' || key === 'totalSize') {
      if (value < 1024) return `${value} B`
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(2)} KB`
      if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`
      return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }
    // 其他数字直接显示
    return value.toLocaleString()
  }
  
  // 数组
  if (Array.isArray(value)) {
    if (value.length === 0) return '无'
    return value.join('、')
  }
  
  // 对象
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  
  return String(value)
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.report-log-container {
  padding: 16px 20px;
  max-height: 520px;
  overflow-y: auto;
}

.log-card {
  background: #fafafa;
  border-radius: 8px;
  border-left: 3px solid #dcdfe6;
  padding: 14px 16px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &.status-success {
    border-left-color: #67C23A;
    background: linear-gradient(to right, #f0f9eb, #fafafa);
  }

  &.status-fail {
    border-left-color: #F56C6C;
    background: linear-gradient(to right, #fef0f0, #fafafa);
  }

  &.status-warning {
    border-left-color: #E6A23C;
    background: linear-gradient(to right, #fdf6ec, #fafafa);
  }

  &.status-processing {
    border-left-color: #409EFF;
    background: linear-gradient(to right, #ecf5ff, #fafafa);
  }
}

.log-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .operation-info {
    display: flex;
    align-items: center;
    gap: 6px;

    .operation-label {
      color: #909399;
      font-size: 13px;
      margin-right: 4px;
    }

    .operation-icon {
      font-size: 16px;
    }

    .operation-name {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .status-label {
      color: #909399;
      font-size: 13px;
    }
  }

  .status-badge {
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;

    &.status-success {
      background: #e1f3d8;
      color: #67C23A;
    }

    &.status-fail {
      background: #fde2e2;
      color: #F56C6C;
    }

    &.status-warning {
      background: #faecd8;
      color: #E6A23C;
    }

    &.status-processing {
      background: #d9ecff;
      color: #409EFF;
    }
  }
}

.log-card-body {
  .info-row {
    display: flex;
    gap: 32px;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .info-label {
      color: #909399;
      font-size: 13px;
      min-width: 56px;
    }

    .info-value {
      color: #606266;
      font-size: 13px;

      &.time-value {
        color: #409EFF;
        font-weight: 500;
      }

      &.operator-value {
        display: flex;
        align-items: center;
        gap: 4px;

        .el-icon {
          color: #909399;
        }
        
        .real-name {
          color: #409EFF;
          font-weight: 500;
        }
      }
    }
  }
}

.detail-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e4e7ed;

  .detail-header {
    margin-bottom: 8px;

    .info-label {
      color: #909399;
      font-size: 13px;
    }
  }

  .detail-content {
    background: #fff;
    border-radius: 6px;
    padding: 10px 12px;
    border: 1px solid #e4e7ed;
  }

  .detail-line {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 4px 0;
    font-size: 13px;

    &:not(:last-child) {
      border-bottom: 1px solid #f5f7fa;
    }

    .detail-key {
      color: #606266;
      font-weight: 500;
      min-width: 80px;
      flex-shrink: 0;
    }

    .detail-value {
      color: #303133;
      flex: 1;
      word-break: break-all;
      white-space: pre-wrap;
    }
  }
}

.log-card-error {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fef0f0;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #F56C6C;
  font-size: 13px;
  line-height: 1.5;

  .el-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }
}

/* 时间轴样式优化 */
:deep(.el-timeline) {
  padding-left: 4px;
}

:deep(.el-timeline-item__wrapper) {
  padding-left: 24px;
}

:deep(.el-timeline-item__tail) {
  border-left-style: dashed;
}

:deep(.el-timeline-item__node) {
  width: 12px;
  height: 12px;
}

:deep(.el-timeline-item) {
  padding-bottom: 16px;
}
</style>
