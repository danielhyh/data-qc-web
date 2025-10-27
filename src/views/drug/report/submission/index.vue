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
    <ContentWrap title="我的填报任务">
    <el-table
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
    >
      <el-table-column label="序号" width="60" type="index" align="center" />
      <el-table-column label="任务名称" align="center" prop="taskName" min-width="120px" />
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
      <el-table-column label="剩余时间" align="center" width="120px">
        <template #default="scope">
          <span :class="getRemainingTimeClass(scope.row.endDate)">
            {{ calculateRemainingTime(scope.row.endDate) }}
          </span>
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
      <el-table-column label="上报状态" align="center" prop="reportStatus" width="120px">
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
                type="success"
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
              type="primary"
              size="small"
              @click="handleCheckStatus(scope)"
            >
              <Icon icon="ep:document" class="mr-1" />
              查看数据
            </el-button>

            <el-button
              v-if="scope.row.reportStatus !== 0"
              type="info"
              size="small"
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
import ReportLogDialog from '../../import/task/ReportLogDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProgressColor } from '@/utils/progressColor'

// 定义组件名称
defineOptions({ name: 'DrugReportSubmission' })

const loading = ref(true) // 列表的加载中
const router = useRouter() // 路由对象
const queryFormRef = ref() // 搜索的表单
const reportLogRef = ref() // 日志弹窗ref
const list = ref<ImportTaskVO[]>([]) // 列表的数据
const yearOptions = ref([]) // 年份列表
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
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
  loading.value = true
  try {
    const data = await ReportDataApi.getDeduplicationYearList()
    yearOptions.value = data || []
  } finally {
    loading.value = false
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
 * @returns 剩余/逾期时间描述
 */
function calculateRemainingTime(endDate?: number): string {
  if (!endDate) return '-'
  const now = Date.now()
  const diff = endDate - now

  if (diff <= 0) {
    const overdue = Math.abs(diff)
    const days = Math.floor(overdue / (1000 * 60 * 60 * 24))
    const hours = Math.floor((overdue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return days > 0 ? `逾期${days}天` : `逾期${hours}小时`
  } else {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return days > 0 ? `剩余${days}天` : `剩余${hours}小时`
  }
}

/**
 * 获取剩余时间样式类
 * @param endDate 截止时间戳
 * @returns 颜色 class
 */
function getRemainingTimeClass(endDate?: number): string {
  if (!endDate) return ''
  const diff = endDate - Date.now()
  if (diff <= 0) return 'text-red-500 font-bold' // 逾期
  if (diff <= 24 * 60 * 60 * 1000) return 'text-orange-500 font-bold' // 24小时内
  if (diff <= 3 * 24 * 60 * 60 * 1000) return 'text-orange-400' // 3天内
  return 'text-green-500'
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
  min-height: calc(100vh - 50px);
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
