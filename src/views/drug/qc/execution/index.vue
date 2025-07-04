<template>
  <div class="qc-execution-container">
    <!-- 页面头部 -->
    <PageHeader title="质控执行监控" content="实时监控质控任务执行状态，查看质控结果和异常处理情况">
      <template #extra>
        <el-button type="primary" @click="handleManualTrigger">
          <el-icon><VideoPlay /></el-icon>
          手动触发质控
        </el-button>
        <el-button @click="handleRefreshAll" :loading="refreshing">
          <el-icon><Refresh /></el-icon>
          刷新监控
        </el-button>
      </template>
    </PageHeader>

    <!-- 实时监控面板 -->
    <div class="monitor-overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <MonitorCard
            title="今日质控任务"
            :value="monitorStats.todayTasks"
            icon="Document"
            color="#409eff"
            :description="`进行中: ${monitorStats.runningTasks}`"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <MonitorCard
            title="质控通过率"
            :value="monitorStats.passRate"
            suffix="%"
            icon="CircleCheck"
            color="#67c23a"
            :trend="monitorStats.passRateTrend"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <MonitorCard
            title="异常数据量"
            :value="monitorStats.anomalyCount"
            icon="Warning"
            color="#e6a23c"
            :description="`待处理: ${monitorStats.pendingCount}`"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <MonitorCard
            title="平均处理时长"
            :value="formatDuration(monitorStats.avgDuration)"
            icon="Clock"
            color="#909399"
            :description="`最长: ${formatDuration(monitorStats.maxDuration)}`"
            :loading="statsLoading"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 执行状态图表 -->
    <el-row :gutter="20" class="chart-section">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>质控执行趋势</span>
              <el-radio-group v-model="trendPeriod" size="small" @change="loadTrendChart">
                <el-radio-button label="7d">近7天</el-radio-button>
                <el-radio-button label="30d">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>错误类型分布</span>
          </template>
          <div ref="errorChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 质控执行记录 -->
    <el-card class="execution-list-card">
      <template #header>
        <div class="table-header">
          <span class="table-title">质控执行记录</span>
          <div class="table-actions">
            <el-button size="small" @click="handleRefreshList" :loading="listLoading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button size="small" type="primary" @click="openExecutionDetail()">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :model="queryParams" :inline="true" class="search-form">
        <el-form-item label="执行批次">
          <el-input
            v-model="queryParams.executionNo"
            placeholder="请输入执行批次号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="质控类型">
          <el-select
            v-model="queryParams.qcType"
            placeholder="请选择"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="前置质控" value="1" />
            <el-option label="后置质控" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="进行中" value="0" />
            <el-option label="成功" value="1" />
            <el-option label="失败" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 执行记录表格 -->
      <el-table
        v-loading="listLoading"
        :data="executionList"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="executionNo" label="执行批次" width="180" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" @click="openExecutionDetail(row.id)">
              {{ row.executionNo }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="taskId" label="关联任务" width="100" align="center">
          <template #default="{ row }">
            <el-link type="primary" @click="openTaskDetail(row.taskId)">
              {{ row.taskId }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="qcType" label="质控类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.qcType === 1 ? 'primary' : 'success'" size="small">
              {{ row.qcType === 1 ? '前置质控' : '后置质控' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="执行进度" width="200" align="center">
          <template #default="{ row }">
            <div class="progress-wrapper">
              <el-progress
                :percentage="calculateProgress(row)"
                :status="getProgressStatus(row.executionStatus)"
                :stroke-width="8"
              />
              <div class="progress-text"> {{ row.checkedRecords }}/{{ row.totalRecords }} </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="质控结果" width="150" align="center">
          <template #default="{ row }">
            <div class="result-stats">
              <div class="stat-item success">
                <span class="label">通过:</span>
                <span class="value">{{ formatNumber(row.passedRecords) }}</span>
              </div>
              <div class="stat-item error">
                <span class="label">失败:</span>
                <span class="value">{{ formatNumber(row.failedRecords) }}</span>
              </div>
              <div class="stat-item warning">
                <span class="label">警告:</span>
                <span class="value">{{ formatNumber(row.warningRecords) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="executionStatus" label="执行状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.executionStatus)" size="small">
              <el-icon v-if="row.executionStatus === 0" class="is-loading"><Loading /></el-icon>
              {{ getStatusText(row.executionStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="执行时间" width="200" align="center">
          <template #default="{ row }">
            <div class="time-info">
              <div>开始: {{ formatTime(row.startTime) }}</div>
              <div v-if="row.endTime">结束: {{ formatTime(row.endTime) }}</div>
              <div v-if="row.endTime" class="duration">
                耗时: {{ getDuration(row.startTime, row.endTime) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link size="small" @click="openExecutionDetail(row.id)">
                <el-icon><View /></el-icon>
                查看详情
              </el-button>
              <el-button
                v-if="row.executionStatus === 1"
                type="success"
                link
                size="small"
                @click="downloadReport(row)"
              >
                <el-icon><Download /></el-icon>
                质控报告
              </el-button>
              <el-button
                v-if="row.executionStatus === 0"
                type="warning"
                link
                size="small"
                @click="stopExecution(row)"
              >
                <el-icon><Close /></el-icon>
                停止
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleQuery"
          @current-change="handleQuery"
        />
      </div>
    </el-card>

    <!-- 执行详情弹窗 -->
    <ExecutionDetailModal v-model="detailVisible" :execution-id="selectedExecutionId" />

    <!-- 手动触发质控弹窗 -->
    <ManualTriggerModal v-model="triggerVisible" @success="handleTriggerSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, Refresh, View, Download, Close, Loading } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  QcExecutionApi,
  type QcExecutionRespVO,
  type QcExecutionPageReqVO,
  type QcMonitorStatsVO
} from '@/api/drug/qc/execution'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import MonitorCard from './components/MonitorCard.vue'
import ExecutionDetailModal from './components/ExecutionDetailModal.vue'
import ManualTriggerModal from './components/ManualTriggerModal.vue'

/** 页面组件名称 */
defineOptions({ name: 'DrugQcExecutionMonitor' })

// ========================= 响应式数据 =========================

const refreshing = ref(false)
const listLoading = ref(false)
const statsLoading = ref(false)
const trendPeriod = ref('7d')

/** 查询参数 */
const queryParams = reactive<QcExecutionPageReqVO>({
  pageNo: 1,
  pageSize: 20,
  executionNo: undefined,
  qcType: undefined,
  status: undefined
})

/** 执行记录列表 */
const executionList = ref<QcExecutionRespVO[]>([])
const total = ref(0)
const multipleSelection = ref<QcExecutionRespVO[]>([])

/** 监控统计数据 */
const monitorStats = reactive<QcMonitorStatsVO>({
  todayTasks: 0,
  runningTasks: 0,
  passRate: 0,
  passRateTrend: 0,
  anomalyCount: 0,
  pendingCount: 0,
  avgDuration: 0,
  maxDuration: 0
})

/** 模态框控制 */
const detailVisible = ref(false)
const triggerVisible = ref(false)
const selectedExecutionId = ref<number>()

/** 图表引用 */
const trendChartRef = ref<HTMLElement>()
const errorChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let errorChart: echarts.ECharts | null = null

/** 定时器 */
let refreshTimer: NodeJS.Timeout | null = null

// ========================= 生命周期 =========================

onMounted(() => {
  initPage()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
  if (trendChart) {
    trendChart.dispose()
  }
  if (errorChart) {
    errorChart.dispose()
  }
})

// ========================= 核心方法 =========================

/** 初始化页面 */
const initPage = async () => {
  await Promise.all([loadMonitorStats(), loadExecutionList()])

  // 等待DOM渲染完成后初始化图表
  await nextTick()
  initCharts()
}

/** 加载监控统计 */
const loadMonitorStats = async () => {
  statsLoading.value = true
  try {
    const data = await QcExecutionApi.getMonitorStats()
    Object.assign(monitorStats, data)
  } catch (error) {
    console.error('加载监控统计失败:', error)
  } finally {
    statsLoading.value = false
  }
}

/** 加载执行记录列表 */
const loadExecutionList = async () => {
  listLoading.value = true
  try {
    const { list, total: totalCount } = await QcExecutionApi.getExecutionPage(queryParams)
    executionList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    ElMessage.error('加载执行记录失败')
    console.error('加载执行记录失败:', error)
  } finally {
    listLoading.value = false
  }
}

/** 搜索查询 */
const handleQuery = () => {
  queryParams.pageNo = 1
  loadExecutionList()
}

/** 重置查询 */
const handleResetQuery = () => {
  Object.assign(queryParams, {
    pageNo: 1,
    pageSize: 20,
    executionNo: undefined,
    qcType: undefined,
    status: undefined
  })
  loadExecutionList()
}

/** 刷新列表 */
const handleRefreshList = () => {
  loadExecutionList()
}

/** 刷新所有数据 */
const handleRefreshAll = async () => {
  refreshing.value = true
  try {
    await Promise.all([loadMonitorStats(), loadExecutionList(), loadTrendChart(), loadErrorChart()])
    ElMessage.success('刷新成功')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

/** 多选变化 */
const handleSelectionChange = (selection: QcExecutionRespVO[]) => {
  multipleSelection.value = selection
}

// ========================= 图表相关方法 =========================

/** 初始化图表 */
const initCharts = () => {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    loadTrendChart()
  }

  if (errorChartRef.value) {
    errorChart = echarts.init(errorChartRef.value)
    loadErrorChart()
  }
}

/** 加载趋势图表 */
const loadTrendChart = async () => {
  if (!trendChart) return

  try {
    const data = await QcExecutionApi.getTrendChart(trendPeriod.value)

    const option = {
      title: {
        text: '质控执行趋势',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['总任务数', '成功任务', '失败任务'],
        bottom: 0
      },
      xAxis: {
        type: 'category',
        data: data.dates
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '总任务数',
          type: 'line',
          data: data.totalTasks,
          smooth: true
        },
        {
          name: '成功任务',
          type: 'line',
          data: data.successTasks,
          smooth: true
        },
        {
          name: '失败任务',
          type: 'line',
          data: data.failedTasks,
          smooth: true
        }
      ]
    }

    trendChart.setOption(option)
  } catch (error) {
    console.error('加载趋势图表失败:', error)
  }
}

/** 加载错误分布图表 */
const loadErrorChart = async () => {
  if (!errorChart) return

  try {
    const data = await QcExecutionApi.getErrorDistribution()

    const option = {
      title: {
        text: '错误类型分布',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: { trigger: 'item' },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          type: 'pie',
          radius: '50%',
          data: data.map((item) => ({
            name: item.errorType,
            value: item.count
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }

    errorChart.setOption(option)
  } catch (error) {
    console.error('加载错误分布图表失败:', error)
  }
}

// ========================= 业务操作方法 =========================

/** 手动触发质控 */
const handleManualTrigger = () => {
  triggerVisible.value = true
}

/** 触发成功处理 */
const handleTriggerSuccess = () => {
  ElMessage.success('质控任务已成功触发')
  loadExecutionList()
  loadMonitorStats()
}

/** 打开执行详情 */
const openExecutionDetail = (executionId?: number) => {
  if (executionId) {
    selectedExecutionId.value = executionId
    detailVisible.value = true
  } else {
    ElMessage.warning('请选择要查看的执行记录')
  }
}

/** 打开任务详情 */
const openTaskDetail = (taskId: number) => {
  // 跳转到任务详情页面
  window.open(`/drug-import/detail/${taskId}`, '_blank')
}

/** 下载质控报告 */
const downloadReport = async (row: QcExecutionRespVO) => {
  try {
    await QcExecutionApi.downloadReport(row.id)
    ElMessage.success('报告下载已开始')
  } catch (error) {
    ElMessage.error('下载报告失败')
  }
}

/** 停止执行 */
const stopExecution = async (row: QcExecutionRespVO) => {
  try {
    await ElMessageBox.confirm('确认停止该质控任务的执行？', '确认停止', {
      type: 'warning'
    })

    await QcExecutionApi.stopExecution(row.id)
    ElMessage.success('质控任务已停止')
    loadExecutionList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('停止任务失败')
    }
  }
}

// ========================= 自动刷新 =========================

/** 开始自动刷新 */
const startAutoRefresh = () => {
  refreshTimer = setInterval(() => {
    loadMonitorStats()
    // 只刷新进行中的任务
    if (executionList.value.some((item) => item.executionStatus === 0)) {
      loadExecutionList()
    }
  }, 30000) // 30秒刷新一次
}

/** 停止自动刷新 */
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// ========================= 工具方法 =========================

/** 计算进度 */
const calculateProgress = (row: QcExecutionRespVO): number => {
  if (row.totalRecords === 0) return 0
  return Math.round((row.checkedRecords / row.totalRecords) * 100)
}

/** 获取进度状态 */
const getProgressStatus = (status: number): string | undefined => {
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'exception'
    default:
      return undefined
  }
}

/** 获取状态类型 */
const getStatusType = (status: number): string => {
  switch (status) {
    case 0:
      return 'warning'
    case 1:
      return 'success'
    case 2:
      return 'danger'
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
      return '成功'
    case 2:
      return '失败'
    default:
      return '未知'
  }
}

/** 格式化时间 */
const formatTime = (time: string): string => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

/** 获取执行时长 */
const getDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return '-'

  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const duration = Math.floor((end - start) / 1000)

  if (duration < 60) return `${duration}秒`
  if (duration < 3600) return `${Math.floor(duration / 60)}分${duration % 60}秒`
  return `${Math.floor(duration / 3600)}小时${Math.floor((duration % 3600) / 60)}分`
}

/** 格式化时长 */
const formatDuration = (seconds: number): string => {
  if (!seconds || seconds === 0) return '0秒'

  if (seconds < 60) return `${Math.round(seconds)}秒`
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`
  return `${Math.round(seconds / 3600)}小时`
}

/** 格式化数字 */
const formatNumber = (num: number): string => {
  if (!num) return '0'
  return num.toLocaleString()
}
</script>

<style scoped>
.qc-execution-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.monitor-overview {
  margin-bottom: 20px;
}

.chart-section {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.execution-list-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.search-form {
  margin-bottom: 16px;
}

.progress-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.progress-text {
  font-size: 12px;
  color: #606266;
}

.result-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-item.success .value {
  color: #67c23a;
  font-weight: 500;
}

.stat-item.error .value {
  color: #f56c6c;
  font-weight: 500;
}

.stat-item.warning .value {
  color: #e6a23c;
  font-weight: 500;
}

.time-info {
  font-size: 12px;
  line-height: 1.2;
}

.duration {
  color: #909399;
  margin-top: 2px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: end;
  margin-top: 20px;
  padding: 20px;
}

/* 加载动画 */
.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .qc-execution-container {
    padding: 10px;
  }

  .chart-section .el-col {
    margin-bottom: 20px;
  }

  .search-form :deep(.el-form-item) {
    width: 100%;
    margin-right: 0;
  }

  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

/* 进度条样式 */
:deep(.el-progress-bar__outer) {
  border-radius: 4px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

/* 卡片样式 */
:deep(.el-card) {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-card__header) {
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}
</style>
