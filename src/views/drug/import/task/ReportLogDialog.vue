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
              <dict-tag
                :type="DICT_TYPE.REPORT_STATUS"
                :value="log.operationType"
              />
              <dict-tag
                :type="DICT_TYPE.REPORT_OPERATION_STATUS"
                :value="log.operationStatus"
                class="ml-10px"
              />
              <span class="execution-time" v-if="log.executionTime">
                耗时：{{ formatExecutionTime(log.executionTime) }}
              </span>
            </div>

            <div class="log-operator">
              <Icon :icon="log.operatorType === 1 ? 'ep:user' : 'ep:setting'" />
              <span class="ml-5px">{{ log.operatorName || '系统' }}</span>
            </div>

            <div class="log-detail" v-if="log.errorMessage">
              <!-- 只显示错误信息 -->
              <div class="error-message">
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
import { DICT_TYPE } from '@/utils/dict'
import { getReportLogListByTaskId, ReportLogVO, OperationStatusEnum } from '@/api/drug/reportLog'

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('上报日志') // 弹窗的标题
const logList = ref<ReportLogVO[]>([]) // 日志列表

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

/** 获取状态颜色（用于时间轴圆点） */
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
      gap: 8px;
      margin-bottom: 12px;

      .execution-time {
        margin-left: auto;
        color: #909399;
        font-size: 12px;
        font-weight: 500;
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

        :deep(.el-alert) {
          border-radius: 8px;
        }
      }
    }
  }
}

/* 时间轴样式优化 */
:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 13px;
  font-weight: 500;
}

:deep(.el-timeline-item__wrapper) {
  padding-left: 32px;
}
</style>
