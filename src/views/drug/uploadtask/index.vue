<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="任务名称" prop="taskName">
        <el-input
          v-model="queryParams.taskName"
          placeholder="请输入任务名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="采集年度" prop="uploadYear">
        <el-input
          v-model="queryParams.uploadYear"
          placeholder="请输入采集年度"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>

      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button 
          @click="createTask" 
          type="success"
          :disabled="!canStartUpload"
        >
          <Icon icon="fa:upload" class="mr-5px" /> 开始上报
        </el-button>
<!--        <el-button-->
<!--          type="primary"-->
<!--          plain-->
<!--          @click="openForm('create')"-->
<!--          v-hasPermi="['drug:upload-task:create']"-->
<!--        >-->
<!--          <Icon icon="ep:plus" class="mr-5px" /> 新增-->
<!--        </el-button>-->
<!--        <el-button-->
<!--          type="success"-->
<!--          plain-->
<!--          @click="handleExport"-->
<!--          :loading="exportLoading"-->
<!--          v-hasPermi="['drug:upload-task:export']"-->
<!--        >-->
<!--          <Icon icon="ep:download" class="mr-5px" /> 导出-->
<!--        </el-button>-->
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
<!--      <el-table-column label="id" align="center" prop="id" />-->
      <el-table-column label="任务名称" align="center" prop="taskName" />
      <el-table-column label="采集年度" align="center" prop="uploadYear" />
      <el-table-column label="总部门数" align="center" prop="totalDepts" />
      <el-table-column label="成功部门数" align="center" prop="successDepts" />
      <el-table-column label="失败部门数" align="center" prop="failedDepts" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.DATA_UPLOAD_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" min-width="180px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="showProgress(scope.row)"
          >
            详情
          </el-button>
          <el-button
            v-if="scope.row.status === 'running' || scope.row.status === 'pausing'"
            link
            type="warning"
            @click="handlePause(scope.row.id)"
            :disabled="scope.row.status === 'pausing'"
          >
            {{ scope.row.status === 'pausing' ? '暂停中...' : '暂停' }}
          </el-button>
          <el-button
            v-if="scope.row.status === 'paused'"
            link
            type="success"
            @click="handleResume(scope.row.id)"
          >
            恢复
          </el-button>
          <el-button
            v-if="scope.row.status === 'failed'"
            link
            type="warning"
            @click="handleRetry(scope.row.id)"
          >
            重试
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <UploadTaskForm ref="formRef" @success="getList" />

  <!-- 进度弹窗 -->
  <el-dialog
    v-model="progressDialogVisible"
    title="上报进度"
    width="600px"
    :close-on-click-modal="false"
  >
    <div v-loading="progressLoading">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="任务名称">
          {{ currentTask?.taskName }}
        </el-descriptions-item>
        <el-descriptions-item label="采集年度">
          {{ currentTask?.uploadYear }}
        </el-descriptions-item>
        <el-descriptions-item label="总部门数">
          {{ progressData?.total || currentTask?.totalDepts || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="成功部门数">
          <span style="color: #67c23a">{{ progressData?.successfulDeptCount || currentTask?.successDepts || 0 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="失败部门数">
          <span style="color: #f56c6c">{{ progressData?.failedDeptCount || currentTask?.failedDepts || 0 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="完成率">
          {{ formatRate(progressData?.rate) }}
        </el-descriptions-item>
        <el-descriptions-item label="数据来源">
          <el-tag :type="progressData?.source === 'redis' ? 'success' : 'info'">
            {{ progressData?.source === 'redis' ? '实时数据' : '历史数据' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 20px">
        <el-progress
          :percentage="getProgressPercentage()"
          :status="getProgressStatus()"
          :stroke-width="20"
        />
      </div>

      <div v-if="currentTask?.status === 'running'" style="margin-top: 15px; text-align: center; color: #909399">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span style="margin-left: 8px">任务进行中，数据实时更新...</span>
      </div>
      <div v-if="currentTask?.status === 'pausing'" style="margin-top: 15px; text-align: center; color: #e6a23c">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span style="margin-left: 8px">正在暂停，等待当前部门上传完成...</span>
      </div>
      <div v-if="currentTask?.status === 'paused'" style="margin-top: 15px; text-align: center; color: #909399">
        <el-icon><VideoPause /></el-icon>
        <span style="margin-left: 8px">任务已暂停，可点击恢复按钮继续上传</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="progressDialogVisible = false">关闭</el-button>
      <el-button type="primary" @click="refreshProgress" :loading="progressLoading">
        刷新
      </el-button>
      <el-button
        v-if="currentTask?.status === 'running' || currentTask?.status === 'pausing'"
        type="warning"
        @click="handlePauseInDialog"
        :disabled="currentTask?.status === 'pausing'"
      >
        {{ currentTask?.status === 'pausing' ? '暂停中...' : '暂停任务' }}
      </el-button>
      <el-button
        v-if="currentTask?.status === 'paused'"
        type="success"
        @click="handleResumeInDialog"
      >
        恢复任务
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { UploadTaskApi, UploadTaskVO } from '@/api/drug/uploadtask'
import UploadTaskForm from './UploadTaskForm.vue'
import {DICT_TYPE} from "@/utils/dict";

/** 数据上报任务主 列表 */
defineOptions({ name: 'UploadTask' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<UploadTaskVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const canStartUpload = ref(false) // 是否可以开始上报
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskName: undefined,
  uploadYear: undefined,
  totalDepts: undefined,
  successDepts: undefined,
  failedDepts: undefined,
  status: undefined,
  createTime: [],
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

// 进度弹窗相关
const progressDialogVisible = ref(false)
const progressLoading = ref(false)
const progressData = ref<any>(null)
const currentTask = ref<UploadTaskVO | null>(null)
let progressTimer: any = null

/** 检查是否可以开始上报 */
const checkReadyToStart = async () => {
  try {
    const ready = await UploadTaskApi.readyToStart()
    canStartUpload.value = ready
  } catch (error) {
    console.error('检查上报状态失败:', error)
    canStartUpload.value = false
  }
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await UploadTaskApi.getUploadTaskPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const createTask = async () => {
  try {
    // 检查是否可以开始上报
    if (!canStartUpload.value) {
      message.warning('当前不满足上报条件，无法开始上报')
      return
    }
    
    // 确认操作
    await message.confirm('确定要开始数据上报吗？')
    
    // 创建任务并开始上报
    await UploadTaskApi.startUpload()
    message.success('数据上报任务已创建，正在后台执行...')
    
    // 刷新列表和上报状态
    await getList()
    await checkReadyToStart()
  } catch (error) {
    console.error('创建上报任务失败:', error)
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await UploadTaskApi.deleteUploadTask(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await UploadTaskApi.exportUploadTask(queryParams)
    download.excel(data, '数据上报任务主.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 显示进度弹窗 */
const showProgress = async (task: UploadTaskVO) => {
  currentTask.value = task
  progressDialogVisible.value = true
  await loadProgress()
  
  // 如果任务正在运行或暂停中，启动自动刷新
  if (task.status === 'running' || task.status === 'pausing') {
    startProgressPolling()
  }
}

/** 加载进度数据 */
const loadProgress = async () => {
  if (!currentTask.value?.id) return
  
  progressLoading.value = true
  try {
    const data = await UploadTaskApi.getUploadProgress(currentTask.value.id)
    progressData.value = data
  } catch (error) {
    console.error('获取进度失败:', error)
    message.error('获取进度失败')
  } finally {
    progressLoading.value = false
  }
}

/** 刷新进度 */
const refreshProgress = async () => {
  await loadProgress()
  // 同时刷新列表以获取最新状态
  await getList()
  // 更新当前任务对象
  const updatedTask = list.value.find(t => t.id === currentTask.value?.id)
  if (updatedTask) {
    currentTask.value = updatedTask
    // 如果任务已完成或已暂停，停止轮询
    if (updatedTask.status !== 'running' && updatedTask.status !== 'pausing') {
      stopProgressPolling()
    }
  }
}

/** 启动进度轮询 */
const startProgressPolling = () => {
  stopProgressPolling() // 先清除已有的定时器
  progressTimer = setInterval(async () => {
    await refreshProgress()
  }, 5000) // 每5秒刷新一次
}

/** 停止进度轮询 */
const stopProgressPolling = () => {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

/** 格式化完成率 */
const formatRate = (rate: string | undefined) => {
  if (!rate) return '0.00%'
  const percentage = (parseFloat(rate) * 100).toFixed(2)
  return `${percentage}%`
}

/** 获取进度百分比 */
const getProgressPercentage = () => {
  if (!progressData.value?.rate) return 0
  return Math.round(parseFloat(progressData.value.rate) * 100)
}

/** 获取进度状态 */
const getProgressStatus = () => {
  if (!currentTask.value) return undefined
  if (currentTask.value.status === 'completed') return 'success'
  if (currentTask.value.status === 'failed') return 'exception'
  return undefined
}

/** 重试上报 */
const handleRetry = async (taskId: number) => {
  try {
    await message.confirm('确定要重试失败的上报吗？')
    await UploadTaskApi.retryUpload(taskId)
    message.success('重试任务已提交，正在后台执行...')
    await getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重试失败:', error)
    }
  }
}

/** 暂停上报 */
const handlePause = async (taskId: number) => {
  try {
    await message.confirm('确定要暂停上报任务吗？当前部门上传完成后将暂停。')
    await UploadTaskApi.pauseUpload(taskId)
    message.success('暂停指令已发送，等待当前部门上传完成...')
    await getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('暂停失败:', error)
      message.error('暂停任务失败')
    }
  }
}

/** 恢复上报 */
const handleResume = async (taskId: number) => {
  try {
    await message.confirm('确定要恢复上报任务吗？将从上次暂停的位置继续上传。')
    await UploadTaskApi.resumeUpload(taskId)
    message.success('任务已恢复，正在继续上传...')
    await getList()
    await checkReadyToStart()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复失败:', error)
      message.error('恢复任务失败')
    }
  }
}

/** 在进度弹窗中暂停 */
const handlePauseInDialog = async () => {
  if (!currentTask.value?.id) return
  await handlePause(currentTask.value.id)
  await refreshProgress()
}

/** 在进度弹窗中恢复 */
const handleResumeInDialog = async () => {
  if (!currentTask.value?.id) return
  await handleResume(currentTask.value.id)
  await refreshProgress()
  // 恢复后启动轮询
  startProgressPolling()
}

/** 监听弹窗关闭，停止轮询 */
watch(progressDialogVisible, (newVal) => {
  if (!newVal) {
    stopProgressPolling()
    progressData.value = null
    currentTask.value = null
  }
})

/** 初始化 **/
onMounted(() => {
  getList()
  checkReadyToStart()
})

/** 组件卸载时清理定时器 **/
onUnmounted(() => {
  stopProgressPolling()
})
</script>
