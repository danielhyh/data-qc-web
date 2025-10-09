<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
      <el-form-item label="年份" prop="reportYear">
        <el-select v-model="queryParams.reportYear" placeholder="请选择年份" clearable class="!w-240px">
          <el-option v-for="year in yearOptions" :key="year" :label="year" :value="year" />
        </el-select>
      </el-form-item>
      <el-form-item label="上报状态" prop="reportStatus">
        <el-select v-model="queryParams.reportStatus" placeholder="请选择上报状态" clearable class="!w-240px">
          <el-option
v-for="dict in getIntDictOptions(DICT_TYPE.REPORT_STATUS)" :key="dict.value" :label="dict.label"
            :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" /> 重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
      <el-table-column label="序号" width="60" type="index" />
      <el-table-column label="任务名称" align="center" prop="taskName" />
      <el-table-column label="任务描述" align="center" prop="description" />
      <el-table-column label="开始日期" align="center">
        <template #default="scope">
          {{ getCurrentDate(scope.row.startDate) }}
        </template>
      </el-table-column>
      <el-table-column label="结束日期" align="center">
        <template #default="scope">
          {{ getCurrentDate(scope.row.endDate) }}
        </template>
      </el-table-column>
      <el-table-column label="上报状态" align="center" prop="reportStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.REPORT_STATUS" :value="scope.row.reportStatus" />
        </template>
      </el-table-column>
      <el-table-column label="剩余时间" align="center">
        <template #default="scope">
          {{ getRemainingTime(scope) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button v-if="scope.row.reportStatus === 0" link @click="handleReport(scope)" type="primary">
            上报
          </el-button>
          <el-button link v-if="scope.row.reportStatus === 2" @click="handleResubmit(scope)" type="primary">
            重新上报
          </el-button>
          <el-button link v-if="scope.row.reportStatus === 3" @click="handleSubmit(scope)" type="primary">
            提交
          </el-button>
          <el-button link v-if="scope.row.reportStatus !== 0" @click="handleCheckStatus(scope)" type="primary">
            查看数据
          </el-button>
          <el-button v-if="scope.row.reportStatus !== 0" link @click="handleReportLogs(scope)" type="primary">
            上报日志
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
:total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize"
      @pagination="getList" />
  </ContentWrap>

  <!-- 日志弹窗 -->
  <ReportLogDialog ref="reportLogRef" />
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import dayjs from 'dayjs'
import { ImportTaskVO } from '@/api/drug/batch'
import { ReportDataApi } from '@/api/drug/reportdata'
import ReportLogDialog from '../../import/task/ReportLogDialog.vue'
import { ElMessage } from 'element-plus'

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

/** 获取结束时间 */
const getRemainingTime = ({ row }) => {
  if (row.endDate - Date.now() > 0) {
    return dayjs(row.endDate).diff(dayjs(), 'day') + '天'
  } else {
    return '已逾期' + dayjs().diff(dayjs(row.endDate), 'day') + '天'
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
  loading.value = true
  try {
    const status = await ReportDataApi.submitToTheNationalPlatform(row.taskId)
    if (status) {
      ElMessage.success('提交成功')
      getList()
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
  reportLogRef.value.open(row.id, row.taskName)
}

/** 初始化 **/
onMounted(() => {
  getYear()
  getList()
})
</script>
