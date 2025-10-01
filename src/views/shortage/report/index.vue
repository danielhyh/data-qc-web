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
      <el-form-item label="年份" prop="year">
        <el-select v-model="queryParams.year" placeholder="请选择年份" clearable class="!w-240px">
          <el-option v-for="year in yearOptions" :key="year" :label="year" :value="year" />
        </el-select>
      </el-form-item>
      <el-form-item label="填报专区" prop="zoneId">
        <el-select
          v-model="queryParams.zoneId"
          placeholder="请选择填报专区"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="zone in zoneOptions"
            :key="zone.id"
            :label="zone.zoneName"
            :value="zone.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="填报状态" prop="reportStatus">
        <el-select
          v-model="queryParams.reportStatus"
          placeholder="请选择填报状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.DRUG_REPORT_STATUS)"
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
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['shortage:report-task:export']"
        >
          <Icon icon="ep:download" class="mr-5px" />
          导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="年份" align="center" prop="year" />
      <el-table-column label="填报周期" align="center" prop="reportWeek" />
      <el-table-column label="填报专区" align="center" prop="zoneName" />
      <el-table-column label="填报状态" align="center" prop="reportStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.DRUG_REPORT_STATUS" :value="scope.row.reportStatus" />
        </template>
      </el-table-column>
      <el-table-column label="填报完成度" align="center" prop="completionRate" width="200">
        <template #default="scope">
          <div class="flex items-center gap-2">
            <el-progress
              :percentage="scope.row.completionRate || 0"
              :color="getProgressColor(scope.row.completionRate)"
              :stroke-width="8"
              style="flex: 1"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="剩余时间" align="center">
        <template #default="scope">
          <span :class="getRemainingTimeClass(scope.row.deadlineTime)">
            {{ calculateRemainingTime(scope.row.deadlineTime) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            v-if="scope.row.reportStatus === 0 || scope.row.reportStatus === 1"
            link
            type="primary"
            @click="handleReport(scope.row.id)"
          >
            填报
          </el-button>
          <el-button
            v-if="scope.row.reportStatus === 2"
            link
            type="info"
            @click="handleView(scope.row.id)"
          >
            查看
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
  <!-- <ReportTaskForm ref="formRef" @success="getList" /> -->
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import download from '@/utils/download'
import { ReportTaskApi, ReportTaskVO } from '@/api/shortage/reporttask'
import { ReportZoneApi, ReportZoneOptionVO } from '@/api/shortage/reportzone'
import { useRouter, useRoute } from 'vue-router'
// import ReportTaskForm from './ReportTaskForm.vue'

/** 机构填报任务 列表 */
defineOptions({ name: 'ReportTask' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const router = useRouter() // 路由
const route = useRoute() // 路由实例

const loading = ref(true) // 列表的加载中
const list = ref<ReportTaskVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  year: undefined,
  zoneId: undefined,
  reportStatus: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

// 下拉选项数据
const yearOptions = ref<number[]>([])
const zoneOptions = ref<ReportZoneOptionVO[]>([])

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReportTaskApi.getReportTaskPage(queryParams)
    list.value = data.list
    total.value = data.total
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

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await ReportTaskApi.exportReportTask(queryParams)
    download.excel(data, '机构填报任务.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
  loadYearOptions()
  loadZoneOptions()
})

// 监听路由参数变化，用于从填报页面返回时刷新
watch(
  () => route.params.refresh,
  (newVal) => {
    if (newVal === 'true') {
      getList()
      // 清除刷新标记
      router.replace({ name: 'ShortageReportList', params: {} })
    }
  },
  { immediate: true }
)

/** 加载年份选项 */
const loadYearOptions = async () => {
  try {
    const data = await ReportTaskApi.getReportTaskYears()
    yearOptions.value = data
  } catch (error) {
    console.error('加载年份选项失败:', error)
  }
}

/** 加载专区选项 */
const loadZoneOptions = async () => {
  try {
    const data = await ReportZoneApi.getOptions()
    zoneOptions.value = data
  } catch (error) {
    console.error('加载专区选项失败:', error)
  }
}

/** 计算剩余时间 */
const calculateRemainingTime = (deadlineTime: string) => {
  if (!deadlineTime) return '-'

  const now = new Date()
  const deadline = new Date(deadlineTime)
  const diff = deadline.getTime() - now.getTime()

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

/** 获取剩余时间样式类名 */
const getRemainingTimeClass = (deadlineTime: string) => {
  if (!deadlineTime) return ''

  const now = new Date()
  const deadline = new Date(deadlineTime)
  const diff = deadline.getTime() - now.getTime()

  if (diff <= 0) {
    return 'text-red-500' // 逾期显示红色
  } else if (diff <= 24 * 60 * 60 * 1000) {
    return 'text-orange-500' // 24小时内显示橙色
  } else {
    return 'text-green-500' // 正常显示绿色
  }
}

/** 获取进度条颜色 */
const getProgressColor = (percentage: number) => {
  if (percentage >= 100) {
    return '#67C23A' // 绿色 - 完成
  } else if (percentage >= 60) {
    return '#409EFF' // 蓝色 - 良好
  } else if (percentage >= 30) {
    return '#E6A23C' // 橙色 - 一般
  } else {
    return '#F56C6C' // 红色 - 较低
  }
}

/** 填报按钮操作 */
const handleReport = (id: number) => {
  // 从列表中找到对应的任务
  const task = list.value.find((t) => t.id === id)
  if (!task) return
  // 跳转到填报页面,传递专区ID、周期和填报状态
  router.push({
    name: 'ShortageReport',
    params: { taskId: id.toString() },
    query: {
      zoneId: task.zoneId?.toString(),
      reportWeek: task.reportWeek,
      reportStatus: task.reportStatus?.toString()
    }
  })
}

/** 查看按钮操作 */
const handleView = (id: number) => {
  // 从列表中找到对应的任务
  const task = list.value.find((t) => t.id === id)
  if (!task) return

  // 跳转到查看页面,传递专区ID、周期和填报状态
  router.push({
    name: 'ShortageReport',
    params: { taskId: id.toString() },
    query: {
      zoneId: task.zoneId?.toString(),
      reportWeek: task.reportWeek,
      reportStatus: task.reportStatus?.toString()
    }
  })
}
</script>
