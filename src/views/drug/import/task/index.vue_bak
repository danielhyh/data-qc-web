<template>
  <div class="drug-import-container">
    <!-- 页面头部 -->
    <PageHeader
      title="药品数据导入管理"
      content="支持批量导入药品相关数据，提供完整的进度监控和任务管理功能"
    />

    <!-- 统计概览卡片 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="今日任务"
            :value="statistics.todayTasks"
            icon="Calendar"
            color="#409eff"
            :trend="statistics.taskGrowthRate"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="进行中"
            :value="statistics.runningTasks"
            icon="Loading"
            color="#e6a23c"
            status="processing"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="成功率"
            :value="statistics.successRate"
            suffix="%"
            icon="CircleCheck"
            color="#67c23a"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="平均耗时"
            :value="formatAverageProcessingTime(statistics.averageProcessingTime).value"
            :suffix="formatAverageProcessingTime(statistics.averageProcessingTime).unit"
            icon="Clock"
            color="#909399"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和操作区域 -->
    <ContentWrap>
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="任务编号" prop="taskNo">
          <el-input
            v-model="queryParams.taskNo"
            placeholder="请输入任务编号"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="任务名称" prop="taskName">
          <el-input
            v-model="queryParams.taskName"
            placeholder="请输入任务名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="任务状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            class="!w-240px"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.DRUG_TASK_STATUS)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间" prop="createTime">
          <el-date-picker
            v-model="queryParams.createTime"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
          <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
          <el-button type="primary" @click="openBatchImport">
            <el-icon><Upload /></el-icon>
            批量导入
          </el-button>
          <el-button @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
          <el-button type="success" @click="handleExport" :loading="exportLoading">
            <Icon icon="ep:download" class="mr-5px" /> 导出
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap>
      <el-table v-loading="loading" :data="taskList" :show-overflow-tooltip="true">
        <el-table-column label="任务编号" align="center" prop="taskNo" width="200"/>
        <el-table-column type="expand">
          <template #default="{ row }">
            <TaskExpandContent :task="row" />
          </template>
        </el-table-column>
        <el-table-column label="任务名称" align="center" prop="taskName" />
        <el-table-column label="文件名称" align="center" prop="fileName" />
        <el-table-column label="状态" align="center" prop="status">
          <template #default="{ row }">
            <el-tag
              :type="getDictColorType(DICT_TYPE.DRUG_TASK_STATUS, row.status)"
              size="small"
              effect="dark"
            >
              {{ getDictLabel(DICT_TYPE.DRUG_TASK_STATUS, row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" align="center" prop="progressPercent">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progressPercent || 0"
              :stroke-width="8"
              :show-text="false"
              :status="getProgressStatus(row.status)"
            />
            <div class="progress-text">{{ row.progressPercent }}%</div>
          </template>
        </el-table-column>
        <el-table-column label="处理统计" align="center">
          <template #default="{ row }">
            <div class="stats-column">
              <div class="stat-row">
                <span class="stat-label">文件:</span>
                <span class="stat-value">{{ row.successFiles }}/{{ row.totalFiles }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">记录:</span>
                <span class="stat-value"
                >{{ formatNumber(row.successRecords) }}/{{ formatNumber(row.totalRecords) }}</span
                >
              </div>
              <div class="stat-row" v-if="row.qualityScore">
                <span class="stat-label">质量分:</span>
                <span class="stat-value quality-score" :class="getQualityScoreClass(row.qualityScore)">
                  {{ row.qualityScore }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="durationMs" label="耗时" width="100" align="center">
          <template #default="{ row }">
            <span>{{ formatDurationFromMs(row.durationMs) || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="creator"
          label="创建人"
          width="100"
          align="center"
          show-overflow-tooltip
        />

        <el-table-column
          label="创建时间"
          align="center"
          prop="createTime"
          :formatter="dateFormatter"
          width="180px"
        />
        <el-table-column label="操作" align="center" min-width="150px">
          <template #default="{ row }">
            <div class="action-buttons">
              <router-link :to="'/drug-import/monitor/' + row.id">
                <el-button type="primary" link> 查看进度 </el-button>
              </router-link>

              <el-button
                v-if="row.canRetry"
                type="warning"
                link
                @click="handleRetry(row)"
              >
                重试
              </el-button>

              <el-button
                v-if="row.canCancel"
                type="danger"
                link
                @click="handleCancel(row)"
              >
                取消
              </el-button>

              <el-dropdown trigger="click" @command="(command) => handleMoreAction(command, row)">
                <el-button link> 更多 </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail"> 查看详情 </el-dropdown-item>
                    <el-dropdown-item command="download" v-if="isTaskCompleted(row.status)">
                      下载报告
                    </el-dropdown-item>
                    <el-dropdown-item command="errorFile" v-if="row.hasErrorFile">
                      下载错误文件
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided> 删除任务 </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="loadTaskList"
      />
    </ContentWrap>

    <!-- 批量导入模态框 -->
    <BatchImportModal v-model="batchImportVisible" @success="handleImportSuccess" />

    <!-- 进度监控模态框 -->
    <ProgressMonitorModal
      v-model="progressMonitorVisible"
      :task-id="selectedTaskId"
      @retry="handleRetryFromMonitor"
    />

    <!-- 任务详情模态框 -->
    <TaskDetailModal v-model="taskDetailVisible" :task-id="selectedTaskId" />

    <!-- 重试确认对话框 -->
    <RetryConfirmDialog
      v-model="retryDialogVisible"
      :task="selectedTask"
      @confirm="handleRetryConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Upload, Download, View, RefreshRight, Close, Delete } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import {
  DrugBatchImportApi,
  type ImportTaskRespVO,
  type ImportTaskPageReqVO,
  type ImportStatisticsVO, TASK_STATUS
} from '@/api/drug/task'
import { DICT_TYPE, getDictLabel, getDictColorType, getIntDictOptions } from '@/utils/dict'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'
import BatchImportModal from './components/BatchImportModal.vue'
import ProgressMonitorModal from './components/ProgressMonitorModal.vue'
import TaskDetailModal from './components/TaskDetailModal.vue'
import RetryConfirmDialog from './components/RetryConfirmDialog.vue'
import TaskExpandContent from './components/TaskExpandContent.vue'

/** 页面组件名称 */
defineOptions({ name: 'DrugImportIndex' })

// ========================= 响应式数据 =========================

const loading = ref(false)
const refreshing = ref(false)
const exportLoading = ref(false)
const router = useRouter() // 路由
const queryFormRef = ref<FormInstance>()

/** 查询参数 */
const queryParams = reactive<ImportTaskPageReqVO>({
  pageNo: 1,
  pageSize: 10,
  taskNo: undefined,
  taskName: undefined,
  status: undefined,
  fileName: undefined,
  creator: undefined,
  createTime: undefined
})

/** 任务列表数据 */
const taskList = ref<ImportTaskRespVO[]>([])
const total = ref(0)

/** 统计数据 */
const statistics = reactive<ImportStatisticsVO>({
  totalTasks: 0,
  successTasks: 0,
  failedTasks: 0,
  partialSuccessTasks: 0,
  runningTasks: 0,
  successRate: 0,
  averageProcessingTime: 0,
  totalRecordsProcessed: 0,
  todayTasks: 0,
  yesterdayTasks: 0,
  taskGrowthRate: 0
})

/** 模态框控制 */
const batchImportVisible = ref(false)
const progressMonitorVisible = ref(false)
const taskDetailVisible = ref(false)
const retryDialogVisible = ref(false)

/** 选中的任务 */
const selectedTaskId = ref<number>()
const selectedTask = ref<ImportTaskRespVO>()

// ========================= 生命周期 =========================

onMounted(() => {
  initPage()
})

// ========================= 核心方法 =========================

/** 初始化页面 */
const initPage = async () => {
  await Promise.all([loadTaskList(), loadStatistics()])
}

/** 加载任务列表 */
const loadTaskList = async () => {
  loading.value = true
  try {
    const { list, total: totalCount } = await DrugBatchImportApi.getTaskPage(queryParams)
    taskList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    ElMessage.error('加载任务列表失败')
    console.error('加载任务列表失败:', error)
  } finally {
    loading.value = false
  }
}

/** 加载统计数据 */
const loadStatistics = async () => {
  try {
    const data = await DrugBatchImportApi.getImportStatistics()
    Object.assign(statistics, data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

/** 搜索查询 */
const handleQuery = () => {
  queryParams.pageNo = 1
  loadTaskList()
}

/** 重置查询 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  loadTaskList()
}

/** 刷新页面 */
const handleRefresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([loadTaskList(), loadStatistics()])
    ElMessage.success('刷新成功')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

/** 导出数据 */
const handleExport = async () => {
  try {
    await ElMessageBox.confirm('确认导出当前查询条件下的任务数据？', '确认导出', {
      type: 'warning'
    })

    exportLoading.value = true
    await DrugBatchImportApi.exportTaskList(queryParams)
    ElMessage.success('导出成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('导出失败')
    }
  } finally {
    exportLoading.value = false
  }
}

// ========================= 业务操作方法 =========================

/** 打开批量导入 */
const openBatchImport = () => {
  router.push({
    name: 'DrugImportBatch'
  })
}

/** 导入成功处理 */
const handleImportSuccess = (taskId: number, taskNo: string) => {
  ElNotification({
    type: 'success',
    title: '导入任务创建成功',
    message: `任务编号：${taskNo}，您可以在进度监控中查看处理状态`,
    duration: 5000
  })

  // 刷新列表并自动打开进度监控
  loadTaskList()
  selectedTaskId.value = taskId
  progressMonitorVisible.value = true
}

/** 处理任务重试 */
const handleRetry = (task: ImportTaskRespVO) => {
  selectedTask.value = task
  retryDialogVisible.value = true
}

/** 从监控页面重试 */
const handleRetryFromMonitor = (taskId: number) => {
  const task = taskList.value.find((t) => t.id === taskId)
  if (task) {
    handleRetry(task)
  }
}

/** 重试确认 */
const handleRetryConfirm = async (params: any) => {
  try {
    const result = await DrugBatchImportApi.retryImportTask(params)

    ElNotification({
      type: 'success',
      title: '重试任务已启动',
      message: `批次编号：${result.retryBatchNo}`,
      duration: 3000
    })

    // 刷新列表
    loadTaskList()

    // 自动打开进度监控
    selectedTaskId.value = params.taskId
    progressMonitorVisible.value = true
  } catch (error) {
    ElMessage.error('重试任务失败')
  }
}

/** 取消任务 */
const handleCancel = async (task: ImportTaskRespVO) => {
  try {
    await ElMessageBox.confirm(`确认取消任务"${task.taskName}"？取消后将无法恢复。`, '确认取消', {
      type: 'warning'
    })

    await DrugBatchImportApi.cancelTask(task.id)
    ElMessage.success('任务已取消')
    loadTaskList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('取消任务失败')
    }
  }
}

/** 更多操作处理 */
const handleMoreAction = async (command: string, task: ImportTaskRespVO) => {
  switch (command) {
    case 'detail':
      await router.push('/drug-import/detail/' + task.id)
      break

    case 'download':
      try {
        // 实现下载报告逻辑
        ElMessage.success('报告下载已开始')
      } catch (error) {
        ElMessage.error('下载报告失败')
      }
      break

    case 'errorFile':
      try {
        if (task.errorFilePath) {
          // 实现错误文件下载逻辑
          ElMessage.success('错误文件下载已开始')
        } else {
          ElMessage.warning('未找到错误文件')
        }
      } catch (error) {
        ElMessage.error('下载错误文件失败')
      }
      break

    case 'delete':
      await handleDeleteTask(task)
      break
  }
}

/** 删除任务 */
const handleDeleteTask = async (task: ImportTaskRespVO) => {
  try {
    await ElMessageBox.confirm(`确认删除任务"${task.taskName}"？删除后将无法恢复。`, '确认删除', {
      type: 'error',
      confirmButtonText: '确认删除',
      confirmButtonClass: 'el-button--danger'
    })

    // 这里需要实现删除API
    // await DrugBatchImportApi.deleteTask(task.id)

    ElMessage.success('任务已删除')
    loadTaskList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除任务失败')
    }
  }
}

/** 下载模板 */
const downloadTemplate = () => {
  const downloadUrl = 'http://cdn.fangliyun.com/drug-data-guard-suite/药品数据导入模板_2024.zip'

  // 创建隐藏的 a 标签进行下载
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = '药品数据导入模板_2024.zip' // 指定下载文件名
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  ElMessage.success('模板开始下载')
}

// ========================= 工具方法 =========================

/** 格式化平均处理时间 - 智能选择合适的单位 */
const formatAverageProcessingTime = (milliseconds: number) => {
  if (!milliseconds || milliseconds === 0) {
    return { value: 0, unit: '秒' }
  }

  // 小于1秒，显示毫秒
  if (milliseconds < 1000) {
    return { value: Math.round(milliseconds), unit: '毫秒' }
  }

  // 小于60秒，显示秒
  const seconds = milliseconds / 1000
  if (seconds < 60) {
    return { value: Math.round(seconds * 10) / 10, unit: '秒' }
  }

  // 小于3600秒（1小时），显示分钟
  if (seconds < 3600) {
    const minutes = seconds / 60
    return { value: Math.round(minutes * 10) / 10, unit: '分钟' }
  }

  // 大于等于1小时，显示小时
  const hours = seconds / 3600
  return { value: Math.round(hours * 10) / 10, unit: '小时' }
}

/** 格式化毫秒数为可读时间 */
const formatDurationFromMs = (durationMs: number) => {
  if (!durationMs || durationMs === 0) return null

  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}

/** 获取进度条状态 */
const getProgressStatus = (status: number) => {
  if (status === TASK_STATUS.COMPLETED) return 'success'
  if (status === TASK_STATUS.FAILED) return 'exception'
  if (status === TASK_STATUS.CANCELLED) return 'warning'
  return undefined
}

/** 判断任务是否已完成 */
const isTaskCompleted = (status: number) => {
  // 完成状态：值为5
  return status === 5
}

/** 获取质量评分样式类 */
const getQualityScoreClass = (score: number) => {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'average'
  if (score >= 60) return 'poor'
  return 'very-poor'
}

/** 格式化数字 */
const formatNumber = (num: number) => {
  if (!num) return '0'
  return num.toLocaleString()
}
</script>

<style scoped>
.drug-import-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.stats-overview {
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.search-form {
  margin-bottom: 0;
}

.table-card {
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

.progress-text {
  text-align: center;
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

.stats-column {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-label {
  color: #909399;
}

.stat-value {
  color: #303133;
  font-weight: 500;
}

.quality-score {
  font-weight: 600;
}

.quality-score.excellent {
  color: #67c23a;
}

.quality-score.good {
  color: #409eff;
}

.quality-score.average {
  color: #e6a23c;
}

.quality-score.poor {
  color: #f56c6c;
}

.quality-score.very-poor {
  color: #909399;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .drug-import-container {
    padding: 10px;
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

:deep(.el-table .el-table__expand-icon) {
  color: #409eff;
}

:deep(.el-table .el-table__expanded-cell) {
  background-color: #f8f9fa;
  padding: 20px;
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
