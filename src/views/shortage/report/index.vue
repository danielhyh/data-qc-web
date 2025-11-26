<!--季节性药品监测周报页面-->
<template>
  <div class="report-list-container">
    <ContentWrap>
      <!-- 搜索工作栏 -->
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="填报任务" prop="zoneName">
          <el-input
            v-model="queryParams.zoneName"
            placeholder="请输入填报任务名称"
            clearable
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="年份" prop="year">
          <el-select v-model="queryParams.year" placeholder="请选择年份" clearable class="!w-240px">
            <el-option v-for="year in yearOptions" :key="year" :label="year" :value="year" />
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
  <!--        <el-button
            type="success"
            plain
            @click="handleExport"
            :loading="exportLoading"
            v-hasPermi="['shortage:report-task:export']"
          >
            <Icon icon="ep:download" class="mr-5px" />
            导出
          </el-button>-->
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap>
      <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
        <el-table-column label="序号" width="80" type="index" align="center" />
        <el-table-column label="填报任务" align="center" prop="zoneName" min-width="120px">
          <template #default="scope">
            <span class="font-bold">{{ scope.row.zoneName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="年份" align="center" prop="year" width="80px" />
        <el-table-column label="统计时间范围" align="center" prop="currentPeriodRange" width="200px">
          <template #default="scope">
            <el-tag type="success" effect="plain" v-if="scope.row.currentPeriodRange">
              <Icon icon="ep:calendar" class="mr-1" />
              {{ scope.row.currentPeriodRange }}
            </el-tag>
            <span v-else class="text-gray-400">未配置</span>
          </template>
        </el-table-column>
        <el-table-column label="填报周期" align="center" prop="reportWeek" width="120px" />
        <el-table-column label="任务截止时间" align="center" width="150px">
          <template #default="scope">
            {{ formatDeadlineTime(scope.row.deadlineTime) }}
          </template>
        </el-table-column>
        <el-table-column label="任务剩余时间" align="center" width="150px">
          <template #default="scope">
            <!-- 已逾期状态直接显示已逾期 -->
            <span v-if="scope.row.reportStatus === 3" class="text-gray-400">已逾期</span>
            <!-- 准备中状态显示距开始剩余时间 -->
            <span v-else-if="scope.row.reportStatus === 4" :class="getRemainingTimeClass(scope.row.startTime)">
              {{ calculateRemainingTime(scope.row.startTime, true) }}
            </span>
            <!-- 其他状态显示距截止剩余时间 -->
            <span v-else :class="getRemainingTimeClass(scope.row.deadlineTime)">
              {{ calculateRemainingTime(scope.row.deadlineTime) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="填报完成度" align="center" prop="completionRate" width="200px">
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
        <el-table-column label="填报状态" align="center" prop="reportStatus" width="100px">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.DRUG_REPORT_STATUS" :value="scope.row.reportStatus" />
          </template>
        </el-table-column>
      <el-table-column label="操作" align="center" width="200px" fixed="right">
        <template #default="scope">
          <div class="action-links">
            <!-- 填报中或草稿状态：显示填报按钮 -->
            <el-button
              v-if="scope.row.reportStatus === 0 || scope.row.reportStatus === 1"
              type="primary"
              size="small"
              @click="handleReport(scope.row.id)"
            >
              <Icon icon="ep:edit" class="mr-1" />
              填报
            </el-button>
            
            <!-- 已提交状态：显示查看按钮 -->
            <el-button
              v-if="scope.row.reportStatus === 2"
              type="success"
              size="small"
              plain
              @click="handleView(scope.row.id)"
            >
              <Icon icon="ep:document" class="mr-1" />
              查看
            </el-button>
            
            <!-- 已逾期状态：显示逾期查看按钮 -->
            <el-button
              v-if="scope.row.reportStatus === 3"
              type="warning"
              size="small"
              plain
              @click="handleView(scope.row.id)"
            >
              <Icon icon="ep:warning" class="mr-1" />
              逾期查看
            </el-button>
            
            <!-- 准备中状态：显示查看按钮 -->
            <el-button
              v-if="scope.row.reportStatus === 4"
              type="info"
              size="small"
              plain
              @click="handleView(scope.row.id)"
            >
              <Icon icon="ep:view" class="mr-1" />
              预览
            </el-button>
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

    <!-- 表单弹窗：添加/修改 -->
    <!-- <ReportTaskForm ref="formRef" @success="getList" /> -->
  </div>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { ReportTaskApi, ReportTaskVO } from '@/api/shortage/reporttask'
import { ReportZoneApi, ReportZoneOptionVO } from '@/api/shortage'
import { useRouter, useRoute } from 'vue-router'
import dayjs from 'dayjs'

/** 机构填报任务 列表 */
defineOptions({ name: 'ReportTask' })

const router = useRouter() // 路由
const route = useRoute() // 路由实例

const loading = ref(true) // 列表的加载中
const list = ref<ReportTaskVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  year: undefined,
  zoneName: undefined,
  reportStatus: undefined
})
const queryFormRef = ref() // 搜索的表单

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

/** 格式化截止时间 */
const formatDeadlineTime = (deadlineTime: string) => {
  if (!deadlineTime) return '-'
  return dayjs(deadlineTime).format('YYYY-MM-DD HH:mm')
}

/** 计算剩余时间 */
const calculateRemainingTime = (targetTime: string, isStartTime: boolean = false) => {
  if (!targetTime) return '-'

  const now = new Date()
  const target = new Date(targetTime)
  const diff = target.getTime() - now.getTime()
  const absDiff = Math.abs(diff)
  
  // 根据是否是开始时间，决定前缀
  let prefix = ''
  if (isStartTime) {
    prefix = diff <= 0 ? '已开始' : '距开始'
  } else {
    prefix = diff <= 0 ? '逾期' : '剩余'
  }

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

/** 获取剩余时间样式类名 */
const getRemainingTimeClass = (deadlineTime: string) => {
  if (!deadlineTime) return ''

  const now = new Date()
  const deadline = new Date(deadlineTime)
  const diff = deadline.getTime() - now.getTime()

  if (diff <= 0) {
    return 'text-red-500 font-bold' // 逾期显示红色加粗
  } else if (diff <= 24 * 60 * 60 * 1000) {
    return 'text-orange-500 font-bold' // 24小时内显示橙色加粗
  } else if (diff <= 3 * 24 * 60 * 60 * 1000) {
    return 'text-orange-400' // 3天内显示橙色
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

<style scoped>
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
</style>
