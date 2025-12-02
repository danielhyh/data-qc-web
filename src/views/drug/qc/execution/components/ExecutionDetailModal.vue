<template>
  <el-dialog
    v-model="dialogVisible"
    title="质控执行详情"
    width="1000px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="loading" class="execution-detail-container">
      <!-- 执行概览信息 -->
      <el-card class="overview-card" shadow="never" v-if="executionDetail">
        <template #header>
          <div class="card-header">
            <el-icon><InfoFilled /></el-icon>
            <span>执行概览</span>
            <el-tag
              :type="getStatusType(executionDetail.executionStatus)"
              size="large"
              effect="dark"
            >
              {{ getStatusText(executionDetail.executionStatus) }}
            </el-tag>
          </div>
        </template>

        <el-descriptions :column="3" border>
          <el-descriptions-item label="执行批次">
            <span class="batch-no">{{ executionDetail.executionNo }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="关联任务">
            <el-link type="primary" @click="viewTask(executionDetail.taskId)">
              {{ executionDetail.taskId }}
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item label="质控类型">
            <el-tag :type="executionDetail.qcType === 1 ? 'primary' : 'success'">
              {{ executionDetail.qcType === 1 ? '前置质控' : '后置质控' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatDateTime(executionDetail.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间">
            {{ formatDateTime(executionDetail.endTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="执行时长">
            {{ getDuration(executionDetail.startTime, executionDetail.endTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="执行人">
            {{ executionDetail.executor || '系统自动' }}
          </el-descriptions-item>
          <el-descriptions-item label="执行环境">
            {{ executionDetail.environment || '生产环境' }}
          </el-descriptions-item>
          <el-descriptions-item label="数据版本">
            {{ executionDetail.dataVersion || 'v1.0' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 执行结果统计 -->
      <el-card class="result-stats-card" shadow="never" v-if="executionDetail">
        <template #header>
          <div class="card-header">
            <el-icon><PieChart /></el-icon>
            <span>执行结果统计</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <div class="result-stat-item total">
              <div class="stat-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ executionDetail.totalRecords }}</div>
                <div class="stat-label">总记录数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat-item success">
              <div class="stat-icon">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ executionDetail.passedRecords }}</div>
                <div class="stat-label">通过记录</div>
                <div class="stat-percentage"
                  >{{
                    getPercentage(executionDetail.passedRecords, executionDetail.totalRecords)
                  }}%</div
                >
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat-item error">
              <div class="stat-icon">
                <el-icon><CircleClose /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ executionDetail.failedRecords }}</div>
                <div class="stat-label">失败记录</div>
                <div class="stat-percentage"
                  >{{
                    getPercentage(executionDetail.failedRecords, executionDetail.totalRecords)
                  }}%</div
                >
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="result-stat-item warning">
              <div class="stat-icon">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ executionDetail.warningRecords }}</div>
                <div class="stat-label">警告记录</div>
                <div class="stat-percentage"
                  >{{
                    getPercentage(executionDetail.warningRecords, executionDetail.totalRecords)
                  }}%</div
                >
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 执行进度时间线 -->
      <el-card class="timeline-card" shadow="never" v-if="executionSteps.length">
        <template #header>
          <div class="card-header">
            <el-icon><Clock /></el-icon>
            <span>执行进度</span>
          </div>
        </template>

        <el-timeline class="execution-timeline">
          <el-timeline-item
            v-for="(step, index) in executionSteps"
            :key="index"
            :timestamp="step.timestamp"
            :type="step.status"
            :hollow="step.status === 'primary'"
          >
            <div class="timeline-content">
              <div class="step-header">
                <span class="step-title">{{ step.title }}</span>
                <el-tag v-if="step.duration" size="small" type="info">
                  {{ step.duration }}ms
                </el-tag>
              </div>
              <div class="step-description">{{ step.description }}</div>
              <div v-if="step.details" class="step-details">
                <el-collapse accordion>
                  <el-collapse-item title="查看详情" :name="index">
                    <pre class="step-detail-content">{{ step.details }}</pre>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <!-- 规则执行结果 -->
      <el-card class="rules-result-card" shadow="never" v-if="ruleResults.length">
        <template #header>
          <div class="card-header">
            <el-icon><List /></el-icon>
            <span>规则执行结果</span>
            <div class="header-actions">
              <el-radio-group v-model="ruleFilter" size="small" @change="filterRules">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="failed">失败</el-radio-button>
                <el-radio-button label="warning">警告</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </template>

        <el-table :data="filteredRuleResults" stripe border max-height="400">
          <el-table-column prop="ruleCode" label="规则编码" width="120" />
          <el-table-column prop="ruleName" label="规则名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="checkedRecords" label="检查记录数" width="120" align="center" />
          <el-table-column prop="passedRecords" label="通过数" width="100" align="center">
            <template #default="{ row }">
              <span class="success-text">{{ row.passedRecords }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="failedRecords" label="失败数" width="100" align="center">
            <template #default="{ row }">
              <span class="error-text">{{ row.failedRecords }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="executionTime" label="执行时间" width="100" align="center">
            <template #default="{ row }"> {{ row.executionTime }}ms </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getRuleStatusType(row.status)" size="small">
                {{ getRuleStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button
                v-if="row.failedRecords > 0"
                type="primary"
                link
                size="small"
                @click="viewRuleErrors(row)"
              >
                查看异常
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 系统资源使用情况 -->
      <el-card class="resource-card" shadow="never" v-if="resourceUsage">
        <template #header>
          <div class="card-header">
            <el-icon><Monitor /></el-icon>
            <span>系统资源使用</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="8">
            <div class="resource-item">
              <div class="resource-header">
                <span class="resource-label">CPU使用率</span>
                <span class="resource-value">{{ resourceUsage.cpuUsage }}%</span>
              </div>
              <el-progress
                :percentage="resourceUsage.cpuUsage"
                :stroke-width="8"
                :status="resourceUsage.cpuUsage > 80 ? 'exception' : undefined"
              />
            </div>
          </el-col>
          <el-col :span="8">
            <div class="resource-item">
              <div class="resource-header">
                <span class="resource-label">内存使用率</span>
                <span class="resource-value">{{ resourceUsage.memoryUsage }}%</span>
              </div>
              <el-progress
                :percentage="resourceUsage.memoryUsage"
                :stroke-width="8"
                :status="resourceUsage.memoryUsage > 85 ? 'exception' : undefined"
              />
            </div>
          </el-col>
          <el-col :span="8">
            <div class="resource-item">
              <div class="resource-header">
                <span class="resource-label">数据库连接</span>
                <span class="resource-value">{{ resourceUsage.dbConnections }}</span>
              </div>
              <el-progress
                :percentage="(resourceUsage.dbConnections / resourceUsage.maxConnections) * 100"
                :stroke-width="8"
              />
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 错误日志 -->
      <el-card class="error-logs-card" shadow="never" v-if="errorLogs.length">
        <template #header>
          <div class="card-header">
            <el-icon><Warning /></el-icon>
            <span>错误日志</span>
            <el-tag type="danger" size="small">{{ errorLogs.length }}条错误</el-tag>
          </div>
        </template>

        <div class="error-logs-container">
          <div v-for="(log, index) in errorLogs" :key="index" class="error-log-item">
            <div class="log-header">
              <span class="log-level error">ERROR</span>
              <span class="log-time">{{ log.timestamp }}</span>
              <span class="log-source">{{ log.source }}</span>
            </div>
            <div class="log-message">{{ log.message }}</div>
            <div v-if="log.stackTrace" class="log-stack">
              <el-collapse accordion>
                <el-collapse-item title="查看堆栈信息" :name="index">
                  <pre class="stack-trace">{{ log.stackTrace }}</pre>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button v-if="canRerun" type="warning" @click="rerunExecution">
          <el-icon><Refresh /></el-icon>
          重新执行
        </el-button>
        <el-button v-if="canDownloadReport" type="primary" @click="downloadReport">
          <el-icon><Download /></el-icon>
          下载报告
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  InfoFilled,
  PieChart,
  Document,
  CircleCheck,
  CircleClose,
  Warning,
  Clock,
  List,
  Monitor,
  Refresh,
  Download
} from '@element-plus/icons-vue'

interface Props {
  executionId?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  viewTask: [taskId: number]
  rerun: [executionId: number]
}>()

// ========================= 响应式数据 =========================

const dialogVisible = defineModel<boolean>({ default: false })
const loading = ref(false)

/** 执行详情数据 */
const executionDetail = ref<any>(null)

/** 执行步骤数据 */
const executionSteps = ref<any[]>([])

/** 规则执行结果 */
const ruleResults = ref<any[]>([])

/** 规则筛选器 */
const ruleFilter = ref('all')

/** 系统资源使用情况 */
const resourceUsage = ref<any>(null)

/** 错误日志 */
const errorLogs = ref<any[]>([])

// ========================= 计算属性 =========================

/** 筛选后的规则结果 */
const filteredRuleResults = computed(() => {
  if (ruleFilter.value === 'all') return ruleResults.value
  if (ruleFilter.value === 'failed') return ruleResults.value.filter((r) => r.failedRecords > 0)
  if (ruleFilter.value === 'warning') return ruleResults.value.filter((r) => r.warningRecords > 0)
  return ruleResults.value
})

/** 是否可以重新执行 */
const canRerun = computed(() => {
  return executionDetail.value && executionDetail.value.executionStatus !== 0
})

/** 是否可以下载报告 */
const canDownloadReport = computed(() => {
  return executionDetail.value && executionDetail.value.executionStatus === 1
})

// ========================= 监听器 =========================

watch(dialogVisible, (visible) => {
  if (visible && props.executionId) {
    loadExecutionDetail()
  }
})

// ========================= 核心方法 =========================

/** 加载执行详情 */
const loadExecutionDetail = async () => {
  loading.value = true
  try {
    // 并行加载所有数据 - 在实际项目中这些都应该是真实的API调用
    await Promise.all([
      loadBasicInfo(),
      loadExecutionSteps(),
      loadRuleResults(),
      loadResourceUsage(),
      loadErrorLogs()
    ])
  } catch (error) {
    ElMessage.error('加载执行详情失败')
    console.error('加载执行详情失败:', error)
  } finally {
    loading.value = false
  }
}

/** 加载基本信息 */
const loadBasicInfo = async () => {
  // 模拟API调用 - 这里生成模拟数据来演示组件功能
  await new Promise((resolve) => setTimeout(resolve, 500))

  executionDetail.value = {
    id: props.executionId,
    executionNo: `EXEC_${String(props.executionId).padStart(6, '0')}`,
    taskId: Math.floor(Math.random() * 9999) + 1000,
    qcType: Math.random() > 0.5 ? 1 : 2,
    executionStatus: Math.random() > 0.2 ? 1 : 2, // 80%成功率
    totalRecords: 1500,
    passedRecords: 1420,
    failedRecords: 65,
    warningRecords: 15,
    startTime: '2024-06-10 14:30:25',
    endTime: '2024-06-10 14:35:42',
    executor: '张三',
    environment: '生产环境',
    dataVersion: 'v2.1.3'
  }
}

/** 加载执行步骤 */
const loadExecutionSteps = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300))

  executionSteps.value = [
    {
      title: '初始化质控引擎',
      description: '加载质控规则配置，初始化执行环境',
      timestamp: '2024-06-10 14:30:25',
      status: 'success',
      duration: 1200,
      details:
        'QC Engine initialized successfully\nLoaded 22 pre-QC rules and 8 post-QC rules\nMemory allocated: 256MB'
    },
    {
      title: '数据预处理',
      description: '验证数据格式，建立数据索引',
      timestamp: '2024-06-10 14:30:38',
      status: 'success',
      duration: 8500,
      details:
        'Data validation completed\nProcessed 1500 records\nCreated indexes for performance optimization'
    },
    {
      title: '执行前置质控',
      description: '运行22条前置质控规则',
      timestamp: '2024-06-10 14:31:15',
      status: 'success',
      duration: 45000,
      details:
        'Pre-QC execution completed\nChecked: 1500 records\nPassed: 1465 records\nFailed: 35 records'
    },
    {
      title: '执行后置质控',
      description: '运行8条后置质控规则，包含三倍标准差算法',
      timestamp: '2024-06-10 14:32:58',
      status: 'warning',
      duration: 125000,
      details:
        'Post-QC execution completed with warnings\nStandard deviation analysis found 30 anomalies\nPrice validation detected 15 outliers'
    },
    {
      title: '生成质控报告',
      description: '汇总结果，生成详细报告',
      timestamp: '2024-06-10 14:35:32',
      status: 'success',
      duration: 10000,
      details:
        'Report generation completed\nGenerated detailed analysis report\nSaved to: /reports/qc_20240610_143532.pdf'
    }
  ]
}

/** 加载规则结果 */
const loadRuleResults = async () => {
  await new Promise((resolve) => setTimeout(resolve, 400))

  // 模拟生成规则执行结果
  const ruleNames = [
    '联合主键字段不唯一',
    '必填项未按要求填报',
    'YPID编码空值',
    '品种通用名空值',
    '入库数量错误',
    '转换系数不匹配',
    '单个药品金额过大',
    '三倍标准差-价格异常'
  ]

  ruleResults.value = ruleNames.map((name, index) => {
    const checked = Math.floor(Math.random() * 1500) + 100
    const failed = Math.floor(Math.random() * 50)
    const passed = checked - failed

    return {
      ruleCode: `QC_${String(index + 1).padStart(3, '0')}`,
      ruleName: name,
      checkedRecords: checked,
      passedRecords: passed,
      failedRecords: failed,
      executionTime: Math.floor(Math.random() * 5000) + 500,
      status: failed > 10 ? 'failed' : failed > 0 ? 'warning' : 'success'
    }
  })
}

/** 加载资源使用情况 */
const loadResourceUsage = async () => {
  await new Promise((resolve) => setTimeout(resolve, 200))

  resourceUsage.value = {
    cpuUsage: Math.floor(Math.random() * 40) + 20, // 20-60%
    memoryUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
    dbConnections: Math.floor(Math.random() * 20) + 5, // 5-25
    maxConnections: 50
  }
}

/** 加载错误日志 */
const loadErrorLogs = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300))

  // 只有在执行失败或有错误时才显示错误日志
  if (Math.random() > 0.7) {
    // 30%概率有错误日志
    errorLogs.value = [
      {
        timestamp: '2024-06-10 14:32:15',
        source: 'StandardDeviationProcessor',
        message: 'Failed to calculate mode for YPID group: insufficient data points',
        stackTrace:
          'java.lang.RuntimeException: Insufficient data points\n  at com.qc.StandardDeviationProcessor.calculateMode(StandardDeviationProcessor.java:85)\n  at com.qc.PostQcEngine.execute(PostQcEngine.java:42)'
      },
      {
        timestamp: '2024-06-10 14:33:22',
        source: 'DatabaseConnection',
        message: 'Connection timeout while fetching reference price data',
        stackTrace:
          'java.sql.SQLException: Connection timed out\n  at com.db.ConnectionPool.getConnection(ConnectionPool.java:156)'
      }
    ]
  }
}

// ========================= 事件处理方法 =========================

/** 查看关联任务 */
const viewTask = (taskId: number) => {
  emit('viewTask', taskId)
  dialogVisible.value = false
}

/** 筛选规则结果 */
const filterRules = () => {
  // 筛选逻辑在计算属性中处理，这里只需要触发响应式更新
}

/** 查看规则异常 */
const viewRuleErrors = (rule: any) => {
  ElMessage.info(`查看规则 ${rule.ruleCode} 的异常详情`)
  // 这里应该打开规则异常详情弹窗
}

/** 重新执行 */
const rerunExecution = async () => {
  try {
    await ElMessageBox.confirm('确认重新执行该质控任务？', '确认重新执行', {
      type: 'warning'
    })

    emit('rerun', props.executionId!)
    ElMessage.success('重新执行任务已启动')
    dialogVisible.value = false
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('重新执行失败')
    }
  }
}

/** 下载报告 */
const downloadReport = async () => {
  try {
    // 这里应该调用真实的下载API
    ElMessage.success('报告下载已开始')
  } catch (error) {
    ElMessage.error('下载报告失败')
  }
}

// ========================= 工具方法 =========================

/** 格式化日期时间 */
const formatDateTime = (dateTime: string): string => {
  if (!dateTime) return '-'
  return dateTime
}

/** 获取持续时间 */
const getDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return '-'

  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const duration = Math.floor((end - start) / 1000)

  if (duration < 60) return `${duration}秒`
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}分${seconds}秒`
}

/** 计算百分比 */
const getPercentage = (part: number, total: number): string => {
  if (total === 0) return '0'
  return ((part / total) * 100).toFixed(1)
}

/** 获取状态类型 */
const getStatusType = (status: number): string => {
  switch (status) {
    case 0:
      return 'warning' // 进行中
    case 1:
      return 'success' // 成功
    case 2:
      return 'danger' // 失败
    default:
      return 'info'
  }
}

/** 获取状态文本 */
const getStatusText = (status: number): string => {
  switch (status) {
    case 0:
      return '进行中'
    case 1:
      return '执行成功'
    case 2:
      return '执行失败'
    default:
      return '未知状态'
  }
}

/** 获取规则状态类型 */
const getRuleStatusType = (status: string): string => {
  switch (status) {
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

/** 获取规则状态文本 */
const getRuleStatusText = (status: string): string => {
  switch (status) {
    case 'success':
      return '正常'
    case 'warning':
      return '警告'
    case 'failed':
      return '失败'
    default:
      return '未知'
  }
}

// ========================= 对外方法 =========================

defineExpose({
  open: (executionId: number) => {
    // 这里可以设置执行ID等初始化参数
    dialogVisible.value = true
  }
})
</script>

<style lang="scss" scoped>
.execution-detail-container {
  max-height: 70vh;
  overflow-y: auto;
}

.overview-card,
.result-stats-card,
.timeline-card,
.rules-result-card,
.resource-card,
.error-logs-card {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;

  .header-actions {
    margin-left: auto;
  }
}

.batch-no {
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  color: #409eff;
}

.result-stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid;

  &.total {
    border-left-color: #909399;
  }

  &.success {
    border-left-color: #67c23a;
  }

  &.error {
    border-left-color: #f56c6c;
  }

  &.warning {
    border-left-color: #e6a23c;
  }

  .stat-icon {
    font-size: 24px;
    opacity: 0.8;
  }

  .stat-content {
    flex: 1;

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 14px;
      color: #606266;
    }

    .stat-percentage {
      font-size: 12px;
      color: #909399;
    }
  }
}

.execution-timeline {
  .timeline-content {
    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .step-title {
        font-weight: 600;
        color: #303133;
      }
    }

    .step-description {
      color: #606266;
      margin-bottom: 8px;
    }

    .step-details {
      margin-top: 8px;

      .step-detail-content {
        background-color: #f8f9fa;
        padding: 12px;
        border-radius: 4px;
        font-size: 12px;
        color: #5d6d7e;
        white-space: pre-wrap;
      }
    }
  }
}

.success-text {
  color: #67c23a;
  font-weight: 500;
}

.error-text {
  color: #f56c6c;
  font-weight: 500;
}

.resource-item {
  .resource-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .resource-label {
      font-size: 14px;
      color: #606266;
    }

    .resource-value {
      font-weight: 600;
      color: #303133;
    }
  }
}

.error-logs-container {
  max-height: 300px;
  overflow-y: auto;

  .error-log-item {
    background-color: #fef0f0;
    border: 1px solid #fbc4c4;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .log-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      .log-level.error {
        background-color: #f56c6c;
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 600;
      }

      .log-time {
        font-size: 12px;
        color: #909399;
      }

      .log-source {
        font-size: 12px;
        color: #606266;
        font-weight: 500;
      }
    }

    .log-message {
      color: #f56c6c;
      margin-bottom: 8px;
    }

    .stack-trace {
      background-color: #2d2d2d;
      color: #f8f8f2;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      white-space: pre-wrap;
      overflow-x: auto;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .execution-detail-container {
    max-height: 60vh;
  }

  .result-stat-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

/* 描述列表样式 */
:deep(.el-descriptions__label) {
  background-color: #fafbfc;
  font-weight: 600;
  width: 100px;
}

/* 表格样式 */
:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

/* 时间线样式 */
:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}
</style>
