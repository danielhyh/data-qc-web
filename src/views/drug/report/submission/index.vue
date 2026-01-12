<template>
  <div class="submission-container">
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
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="年份" prop="reportYear">
          <el-select
            v-model="queryParams.reportYear"
            placeholder="请选择年份"
            clearable
            class="!w-240px"
          >
            <el-option v-for="year in yearOptions" :key="year" :label="year" :value="year" />
          </el-select>
        </el-form-item>
        <el-form-item label="上报状态" prop="reportStatus">
          <el-select
            v-model="queryParams.reportStatus"
            placeholder="请选择上报状态"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.REPORT_STATUS)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery">
            <Icon icon="ep:search" class="mr-5px" />
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" class="mr-5px" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap
      title="上报任务列表"
      headerIcon="ep:list"
      message="选择任务点击「上报」进入填报页面，支持下载 Excel 模板批量导入数据"
    >
      <template #header>
        <el-button type="primary" size="small" :loading="downloadingTemplate" :disabled="downloadingTemplate" @click="handleDownloadTemplate">
          <Icon icon="ep:download" class="mr-4px" />
          下载标准模板压缩包(2025)
        </el-button>
      </template>

      <el-table
        v-loading="loading"
        :data="list"
        :show-overflow-tooltip="true"
      >
        <el-table-column label="序号" width="80" type="index" align="center" />
        <el-table-column label="任务名称" align="center" prop="taskName" min-width="120px">
          <template #default="scope">
            <span class="font-bold">{{ scope.row.taskName }}</span>
          </template>
        </el-table-column>

        <el-table-column label="所属单位" align="center" prop="deptName" width="220px" />
        <el-table-column label="年份" align="center" prop="reportYear" width="80px" />
        <el-table-column
          label="开始日期"
          align="center"
          width="120px"
        >
          <template #default="scope">
            {{ getCurrentDate(scope.row.startDate) }}
          </template>
        </el-table-column>
        <el-table-column
          label="截止日期"
          align="center"
          width="120px"
        >
          <template #default="scope">
            {{ getCurrentDate(scope.row.endDate) }}
          </template>
        </el-table-column>

        <!-- 剩余时间 -->
        <el-table-column label="剩余时间" align="center" width="150px">
          <template #default="scope">
          <span v-if="scope.row.status !== 3" :class="getRemainingTimeClass(scope.row.endDate, scope.row.status)">
            {{ calculateRemainingTime(scope.row.endDate, scope.row.status) }}
          </span>
            <span v-else class="text-gray-400 font-medium">任务已结束</span>
          </template>
        </el-table-column>

        <!-- 上报进度 -->
        <el-table-column label="上报进度" align="center" width="200px">
          <template #default="scope">
            <div class="flex items-center gap-2">
              <el-progress
                :percentage="scope.row.reportProgress"
                :color="getProgressColor(scope.row.reportProgress)"
                :stroke-width="8"
                style="flex: 1"
              />
            </div>
          </template>
        </el-table-column>

        <!-- 任务状态 -->
        <el-table-column label="任务状态" align="center" width="100px">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.REPORT_STATUS_TYPE" :value="scope.row.status" />
          </template>
        </el-table-column>

        <!-- 上报状态 -->
        <el-table-column label="上报状态" align="center" prop="reportStatus" width="150px">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.REPORT_STATUS" :value="scope.row.reportStatus" />
          </template>
        </el-table-column>

        <el-table-column
          label="任务描述"
          align="center"
          prop="description"
          min-width="150px"
          show-overflow-tooltip
        />

        <el-table-column label="操作" align="center" width="260px" fixed="right">
          <template #default="scope">
            <div class="action-links">
              <!-- 任务未结束时显示操作按钮 -->
              <template v-if="scope.row.status !== 3">
                <!-- 上报按钮 -->
                <el-button
                  v-if="scope.row.reportStatus === 0"
                  type="primary"
                  size="small"
                  @click="handleReport(scope)"
                >
                  <Icon icon="ep:upload" class="mr-1" />
                  上报
                </el-button>

                <!-- 查看审核状态按钮（已上报/审核中） -->
                <el-button
                  v-if="scope.row.reportStatus === 1"
                  type="primary"
                  size="small"
                  @click="handleViewReviewStatus(scope)"
                >
                  <Icon icon="ep:view" class="mr-1" />
                  查看审核
                </el-button>

                <!-- 重新上报按钮 -->
                <el-button
                  v-if="scope.row.reportStatus === 2"
                  type="warning"
                  size="small"
                  @click="handleResubmit(scope)"
                >
                  <Icon icon="ep:refresh-left" class="mr-1" />
                  重新上报
                </el-button>

                <!-- 提交至国家平台按钮 -->
                <el-button
                  v-if="scope.row.reportStatus === 3"
                  type="danger"
                  size="small"
                  @click="handleSubmit(scope)"
                >
                  <Icon icon="ep:promotion" class="mr-1" />
                  提交平台
                </el-button>
              </template>

              <!-- 查看类按钮（任务结束与否都可以查看） -->
              <el-button
                v-if="scope.row.reportStatus !== 0"
                type="info"
                size="small"
                plain
                @click="handleCheckStatus(scope)"
              >
                <Icon icon="ep:document" class="mr-1" />
                查看数据
              </el-button>

              <el-button
                size="small"
                plain
                @click="handleReportLogs(scope)"
              >
                <Icon icon="ep:tickets" class="mr-1" />
                日志
              </el-button>

              <!-- 任务已结束的提示标签 -->
              <el-tag
                v-if="scope.row.status === 3 && scope.row.reportStatus === 0"
                type="info"
                size="small"
              >
                任务已结束
              </el-tag>
            </div>
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

    <!-- 日志弹窗 -->
    <ReportLogDialog ref="reportLogRef" />
  </div>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import dayjs from 'dayjs'
import { ImportTaskVO } from '@/api/drug/batch'
import { ReportDataApi } from '@/api/drug/reportdata'
import { ImportTemplateApi } from '@/api/drug/task/template'
import ReportLogDialog from '../../import/task/ReportLogDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProgressColor } from '@/utils/progressColor'
import download from '@/utils/download'

// 定义组件名称
defineOptions({ name: 'DrugReportSubmission' })

const loading = ref(true) // 列表的加载中
const downloadingTemplate = ref(false) // 下载模板的加载中
const router = useRouter() // 路由对象
const queryFormRef = ref() // 搜索的表单
const reportLogRef = ref() // 日志弹窗ref
const list = ref<ImportTaskVO[]>([]) // 列表的数据
const yearOptions = ref([]) // 年份列表
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskName: '',
  reportYear: '',
  reportStatus: ''
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportDataApi.getHistoricalFilingTaskList(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询年份列表 */
const getYear = async () => {
  try {
    const data = await ReportDataApi.getDeduplicationYearList()
    yearOptions.value = data || []
  } catch (error) {
    console.error('获取年份列表失败:', error)
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

/** 根据当前时间戳获取年月日 */
const getCurrentDate = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD')
}

/**
 * 计算任务剩余时间或逾期时间
 * @param endDate 截止时间戳
 * @param status 任务状态，已结束直接返回标签文案
 * @returns 剩余/逾期时间描述
 */
function calculateRemainingTime(endDate?: number, status?: number): string {
  if (status === 3) {
    return '任务已结束'
  }

  if (!endDate) return '-'
  const now = Date.now()
  const diff = endDate - now
  const absDiff = Math.abs(diff)
  const prefix = diff <= 0 ? '逾期' : '剩余'

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))

  // 大于等于1天：显示天+小时
  if (days > 0) {
    return `${prefix}${days}天${hours}小时`
  }
  // 大于等于1小时：显示小时+分钟
  if (hours > 0) {
    return `${prefix}${hours}小时${minutes}分钟`
  }
  // 小于1小时：只显示分钟
  return `${prefix}${minutes}分钟`
}

/**
 * 获取剩余时间样式类
 * @param endDate 截止时间戳
 * @param status 任务状态，已结束时返回灰色
 * @returns 颜色 class
 */
function getRemainingTimeClass(endDate?: number, status?: number): string {
  if (status === 3) {
    return 'text-gray-400 font-medium'
  }

  if (!endDate) return ''
  const diff = endDate - Date.now()
  if (diff <= 0) return 'text-red-500 font-bold' // 逾期
  if (diff <= 24 * 60 * 60 * 1000) return 'text-orange-500 font-bold' // 24小时内
  if (diff <= 3 * 24 * 60 * 60 * 1000) return 'text-orange-400' // 3天内
  return 'text-green-500'
}

/** 下载上报模板 */
const handleDownloadTemplate = async () => {
  downloadingTemplate.value = true
  try {
    const data = await ImportTemplateApi.downloadStandardTemplatesZip()
    download.zip(data, '标准导入模板.zip')
    ElMessage.success('标准模板压缩包下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请重试')
  } finally {
    downloadingTemplate.value = false
  }
}

/** 上报 */
const handleReport = ({ row }) => {
  router.push({
    name: 'DrugReportData',
    query: {
      taskId: row.taskId
    }
  })
}

/** 查看审核状态 */
const handleViewReviewStatus = ({ row }) => {
  router.push({
    name: 'DrugReportData',
    query: {
      taskId: row.taskId
    }
  })
}

/** 重新上报 */
const handleResubmit = ({ row }) => {
  router.push({
    name: 'DrugReportData',
    query: {
      taskId: row.taskId
    }
  })
}

/** 提交 */
const handleSubmit = async ({ row }) => {
  try {
    await ElMessageBox.confirm(
      `确认提交任务"${row.taskName}"至国家平台？提交后将无法撤回，请确保数据准确无误。`,
      '确认提交至国家平台',
      {
        confirmButtonText: '确认提交',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )

    loading.value = true
    const status = await ReportDataApi.submitToTheNationalPlatform(row.taskId)
    if (status) {
      ElMessage.success('提交成功')
      getList()
    }
  } catch (error) {
    // 用户取消或其他错误，不做处理
    if (error !== 'cancel') {
      console.error('提交失败:', error)
    }
  } finally {
    loading.value = false
  }
}

/** 查看数据 */
const handleCheckStatus = ({ row }) => {
  router.push({
    name: 'DrugReportViewData',
    query: {
      taskId: row.taskId
    }
  })
}

/** 上报日志 */
const handleReportLogs = ({ row }) => {
  // 打开日志弹窗
  reportLogRef.value.open(row.taskId, row.taskName)
}

/** 初始化 **/
onMounted(() => {
  getYear()
  getList()
})
</script>

<style scoped>
.submission-container {
  padding: 20px;
}

/* 操作按钮区域 */
.action-links {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;

  :deep(.el-button) {
    margin: 0;
    padding: 4px 0;
    font-weight: 500;

    .mr-1 {
      margin-right: 4px;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .submission-container {
    padding: 10px;
  }
}
</style>
