<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1000px">
    <div class="report-log-container">
      <!-- 时间轴形式展示日志 -->
      <el-timeline v-if="logList.length > 0">
        <el-timeline-item
          v-for="log in logList"
          :key="log.id"
          :timestamp="formatDate(log.createTime)"
          :color="getStatusColor(log.operationStatus)"
          placement="top"
        >
          <div class="log-item">
            <div class="log-header">
              <el-tag :type="getOperationTagType(log.operationType)" size="small">
                {{ getOperationName(log.operationType) }}
              </el-tag>
              <el-tag :type="getStatusTagType(log.operationStatus)" size="small" class="ml-10px">
                {{ getStatusName(log.operationStatus) }}
              </el-tag>
              <span class="execution-time" v-if="log.executionTime">
                耗时：{{ formatExecutionTime(log.executionTime) }}
              </span>
            </div>

            <div class="log-operator">
              <Icon :icon="log.operatorType === 1 ? 'ep:user' : 'ep:setting'" />
              <span class="ml-5px">{{ log.operatorName || '系统' }}</span>
            </div>

            <div class="log-detail" v-if="log.errorMessage">
              <!-- 只显示错误信息，移除详情展示 -->
              <div v-if="log.errorMessage" class="error-message">
                <el-alert :title="log.errorMessage" type="error" :closable="false" />
              </div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-else description="暂无日志记录" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { formatDate } from '@/utils/formatTime'
import { getReportLogListByTaskId, ReportLogVO, OperationTypeEnum, OperationStatusEnum } from '@/api/drug/reportLog'

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('上报日志') // 弹窗的标题
const logList = ref<ReportLogVO[]>([]) // 日志列表

/** 操作类型名称映射 */
const operationTypeNames = {
  [OperationTypeEnum.FILE_UPLOAD]: '文件上传',
  [OperationTypeEnum.PRE_QC]: '前置质控',
  [OperationTypeEnum.SUBMIT_REPORT]: '提交上报',
  [OperationTypeEnum.APPROVE]: '审核通过',
  [OperationTypeEnum.REJECT]: '审核驳回',
  [OperationTypeEnum.POST_QC]: '后置质控',
  [OperationTypeEnum.SUBMIT_NATIONAL]: '提交国家平台'
}

/** 操作状态名称映射 */
const operationStatusNames = {
  [OperationStatusEnum.PROCESSING]: '进行中',
  [OperationStatusEnum.SUCCESS]: '成功',
  [OperationStatusEnum.FAIL]: '失败',
  [OperationStatusEnum.WARNING]: '警告'
}

/** 打开弹窗 */
const open = async (taskId: number, taskName?: string) => {
  dialogVisible.value = true
  dialogTitle.value = taskName ? `${taskName} - 上报日志` : '上报日志'

  // 加载日志数据
  try {
    logList.value = await getReportLogListByTaskId(taskId)
  } catch (error) {
    console.error('加载日志失败:', error)
    logList.value = []
  }
}

/** 获取操作类型名称 */
const getOperationName = (type: number) => {
  return operationTypeNames[type] || '未知操作'
}

/** 获取操作状态名称 */
const getStatusName = (status: number) => {
  return operationStatusNames[status] || '未知状态'
}

/** 获取操作类型标签样式 */
const getOperationTagType = (type: number) => {
  const typeMap = {
    [OperationTypeEnum.FILE_UPLOAD]: 'primary',
    [OperationTypeEnum.PRE_QC]: 'warning',
    [OperationTypeEnum.POST_QC]: 'warning',
    [OperationTypeEnum.SUBMIT_REPORT]: 'info',
    [OperationTypeEnum.APPROVE]: 'success',
    [OperationTypeEnum.REJECT]: 'danger',
    [OperationTypeEnum.SUBMIT_NATIONAL]: 'primary'
  }
  return typeMap[type] || 'info'
}

/** 获取状态标签样式 */
const getStatusTagType = (status: number) => {
  const statusMap = {
    [OperationStatusEnum.PROCESSING]: 'info',
    [OperationStatusEnum.SUCCESS]: 'success',
    [OperationStatusEnum.FAIL]: 'danger',
    [OperationStatusEnum.WARNING]: 'warning'
  }
  return statusMap[status] || 'info'
}

/** 获取状态颜色 */
const getStatusColor = (status: number) => {
  const colorMap = {
    [OperationStatusEnum.PROCESSING]: '#409EFF',
    [OperationStatusEnum.SUCCESS]: '#67C23A',
    [OperationStatusEnum.FAIL]: '#F56C6C',
    [OperationStatusEnum.WARNING]: '#E6A23C'
  }
  return colorMap[status] || '#909399'
}

/** 格式化执行时间 */
const formatExecutionTime = (time: number) => {
  if (time < 1000) {
    return `${time}ms`
  } else if (time < 60000) {
    return `${(time / 1000).toFixed(1)}s`
  } else {
    return `${(time / 60000).toFixed(1)}min`
  }
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>

<style lang="scss" scoped>
.report-log-container {
  padding: 20px;
  max-height: 600px;
  overflow-y: auto;

  .log-item {
    .log-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      .execution-time {
        margin-left: auto;
        color: #909399;
        font-size: 12px;
      }
    }

    .log-operator {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      color: #606266;
      font-size: 14px;
    }

    .log-detail {
      margin-top: 10px;

      .error-message {
        margin-top: 10px;
      }
    }
  }
}
</style>